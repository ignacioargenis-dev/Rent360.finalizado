/**
 * Preventive Maintenance Service
 *
 * Sistema completo de mantenimiento preventivo para propiedades
 * Incluye programación, recordatorios automáticos y checklists
 */

import { db } from './db';
import { logger } from './logger-minimal';
import { EmailService } from './email-service';

export interface PreventiveMaintenanceSchedule {
  id: string;
  propertyId: string;
  title: string;
  description: string;
  category: string;
  frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  nextDueDate: Date;
  lastExecutedDate?: Date;
  active: boolean;
  reminderDaysBefore: number;
  estimatedCost?: number;
  estimatedDuration?: number; // en horas
  checklist?: string[]; // Lista de tareas a completar
}

export interface MaintenanceChecklistItem {
  id: string;
  task: string;
  completed: boolean;
  notes?: string;
  completedAt?: Date;
  completedBy?: string;
}

export interface MaintenanceReminder {
  scheduleId: string;
  propertyId: string;
  dueDate: Date;
  daysBefore: number;
  sent: boolean;
  sentAt?: Date;
}

export class PreventiveMaintenanceService {
  /**
   * Crea un nuevo programa de mantenimiento preventivo
   */
  static async createSchedule(
    ownerId: string,
    data: Omit<PreventiveMaintenanceSchedule, 'id' | 'nextDueDate' | 'active'>
  ): Promise<PreventiveMaintenanceSchedule> {
    try {
      // Verificar que la propiedad pertenece al owner
      const property = await db.property.findFirst({
        where: {
          id: data.propertyId,
          ownerId: ownerId,
        },
        include: {
          contracts: {
            where: {
              status: {
                in: ['ACTIVE', 'SIGNED'],
              },
            },
            take: 1,
          },
        },
      });

      if (!property) {
        throw new Error('Propiedad no encontrada o no pertenece al propietario');
      }

      // Obtener tenantId del contrato activo si existe
      const activeContract = property.contracts?.[0];
      const tenantId = activeContract?.tenantId || '';

      // Calcular la próxima fecha de mantenimiento
      const nextDueDate = this.calculateNextDueDate(new Date(), data.frequency);

      // Crear el programa en la base de datos
      // Mapear campos de PreventiveMaintenanceSchedule a RecurringService
      const schedule = await db.recurringService.create({
        data: {
          serviceId: `preventive-${data.propertyId}-${Date.now()}`, // Generar ID único
          propertyId: data.propertyId,
          tenantId: tenantId, // Usar tenantId del contrato activo o string vacío
          ownerId: ownerId,
          serviceType: data.category.toUpperCase(), // Usar category como serviceType
          frequency: this.mapFrequencyToRecurringService(data.frequency),
          description: `${data.title}: ${data.description}`,
          basePrice: data.estimatedCost || 0,
          startDate: new Date(),
          nextExecutionDate: nextDueDate,
          lastExecutedDate: data.lastExecutedDate || null,
          isActive: true,
          status: 'ACTIVE',
          autoRenew: true,
          createdBy: ownerId,
          notes: JSON.stringify({
            title: data.title,
            reminderDaysBefore: data.reminderDaysBefore,
            estimatedDuration: data.estimatedDuration,
            checklist: data.checklist,
          }),
        },
      });

      logger.info('Programa de mantenimiento preventivo creado', {
        scheduleId: schedule.id,
        propertyId: data.propertyId,
        frequency: data.frequency,
      });

      // Parsear notas para obtener datos adicionales
      const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};

      const result: any = {
        id: schedule.id,
        propertyId: schedule.propertyId,
        title: notesData.title || schedule.description.split(':')[0] || '',
        description:
          schedule.description.split(':').slice(1).join(':').trim() || schedule.description,
        category: schedule.serviceType.toLowerCase(),
        frequency: this.mapFrequencyFromRecurringService(schedule.frequency),
        nextDueDate: schedule.nextExecutionDate,
        active: schedule.isActive,
        reminderDaysBefore: notesData.reminderDaysBefore || 7,
      };

      if (schedule.lastExecutedDate) {
        result.lastExecutedDate = schedule.lastExecutedDate;
      }
      if (schedule.basePrice > 0) {
        result.estimatedCost = schedule.basePrice;
      }
      if (notesData.estimatedDuration) {
        result.estimatedDuration = notesData.estimatedDuration;
      }
      if (notesData.checklist) {
        result.checklist = notesData.checklist;
      }

      return result;
    } catch (error) {
      logger.error('Error creando programa de mantenimiento preventivo', { error, data });
      throw error;
    }
  }

  /**
   * Obtiene todos los programas de mantenimiento preventivo de un propietario
   */
  static async getSchedulesByOwner(ownerId: string): Promise<PreventiveMaintenanceSchedule[]> {
    try {
      const schedules = await db.recurringService.findMany({
        where: {
          property: {
            ownerId: ownerId,
          },
        },
        include: {
          property: {
            select: {
              title: true,
              address: true,
            },
          },
        },
        orderBy: {
          nextExecutionDate: 'asc',
        },
      });

      return schedules.map(schedule => {
        const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};
        const result: any = {
          id: schedule.id,
          propertyId: schedule.propertyId,
          title: notesData.title || schedule.description.split(':')[0] || '',
          description:
            schedule.description.split(':').slice(1).join(':').trim() || schedule.description,
          category: schedule.serviceType.toLowerCase(),
          frequency: this.mapFrequencyFromRecurringService(schedule.frequency),
          nextDueDate: schedule.nextExecutionDate,
          active: schedule.isActive,
          reminderDaysBefore: notesData.reminderDaysBefore || 7,
        };
        if (schedule.lastExecutedDate) {
          result.lastCompletedDate = schedule.lastExecutedDate;
        }
        if (schedule.basePrice > 0) {
          result.estimatedCost = schedule.basePrice;
        }
        if (notesData.estimatedDuration) {
          result.estimatedDuration = notesData.estimatedDuration;
        }
        if (notesData.checklist) {
          result.checklist = notesData.checklist;
        }
        return result;
      });
    } catch (error) {
      logger.error('Error obteniendo programas de mantenimiento preventivo', { error, ownerId });
      return [];
    }
  }

  /**
   * Obtiene programas de mantenimiento próximos a vencer
   */
  static async getUpcomingMaintenance(
    ownerId: string,
    daysAhead: number = 30
  ): Promise<PreventiveMaintenanceSchedule[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const schedules = await db.recurringService.findMany({
        where: {
          property: {
            ownerId: ownerId,
          },
          isActive: true,
          nextExecutionDate: {
            lte: futureDate,
          },
        },
        include: {
          property: {
            select: {
              title: true,
              address: true,
            },
          },
        },
        orderBy: {
          nextExecutionDate: 'asc',
        },
      });

      return schedules.map(schedule => {
        const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};
        const result: any = {
          id: schedule.id,
          propertyId: schedule.propertyId,
          title: notesData.title || schedule.description.split(':')[0] || '',
          description:
            schedule.description.split(':').slice(1).join(':').trim() || schedule.description,
          category: schedule.serviceType.toLowerCase(),
          frequency: this.mapFrequencyFromRecurringService(schedule.frequency),
          nextDueDate: schedule.nextExecutionDate,
          active: schedule.isActive,
          reminderDaysBefore: notesData.reminderDaysBefore || 7,
        };
        if (schedule.lastExecutedDate) {
          result.lastCompletedDate = schedule.lastExecutedDate;
        }
        if (schedule.basePrice > 0) {
          result.estimatedCost = schedule.basePrice;
        }
        if (notesData.estimatedDuration) {
          result.estimatedDuration = notesData.estimatedDuration;
        }
        if (notesData.checklist) {
          result.checklist = notesData.checklist;
        }
        return result;
      });
    } catch (error) {
      logger.error('Error obteniendo mantenimientos próximos', { error, ownerId });
      return [];
    }
  }

  /**
   * Marca un mantenimiento preventivo como completado
   */
  static async markAsCompleted(
    scheduleId: string,
    ownerId: string,
    completionData: {
      actualCost?: number;
      actualDuration?: number;
      notes?: string;
      providerId?: string;
    }
  ): Promise<boolean> {
    try {
      // Verificar que el programa pertenece al owner
      const schedule = await db.recurringService.findFirst({
        where: {
          id: scheduleId,
          property: {
            ownerId: ownerId,
          },
        },
      });

      if (!schedule) {
        throw new Error('Programa de mantenimiento no encontrado');
      }

      // Parsear notas para obtener datos adicionales
      const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};

      // Calcular la próxima fecha de mantenimiento
      const nextDueDate = this.calculateNextDueDate(
        new Date(),
        this.mapFrequencyFromRecurringService(schedule.frequency)
      );

      // Actualizar notas con nuevos datos si se proporcionaron
      const updatedNotes = {
        ...notesData,
        ...(completionData.actualCost && { estimatedCost: completionData.actualCost }),
        ...(completionData.actualDuration && { estimatedDuration: completionData.actualDuration }),
      };

      // Actualizar el programa
      await db.recurringService.update({
        where: {
          id: scheduleId,
        },
        data: {
          lastExecutedDate: new Date(),
          nextExecutionDate: nextDueDate,
          ...(completionData.actualCost && { basePrice: completionData.actualCost }),
          notes: JSON.stringify(updatedNotes),
        },
      });

      // Crear registro de mantenimiento completado (en tabla maintenance)
      if (completionData.providerId) {
        await db.maintenance.create({
          data: {
            propertyId: schedule.propertyId,
            title: notesData.title || schedule.description.split(':')[0] || '',
            description: `${schedule.description}\n\n${completionData.notes || ''}`,
            category: schedule.serviceType,
            priority: 'MEDIUM',
            status: 'COMPLETED',
            maintenanceProviderId: completionData.providerId,
            estimatedCost: completionData.actualCost || schedule.basePrice || 0,
            actualCost: completionData.actualCost || schedule.basePrice || 0,
            requestedBy: ownerId,
            requesterRole: 'OWNER',
            completedDate: new Date(),
          },
        });
      }

      logger.info('Mantenimiento preventivo marcado como completado', {
        scheduleId,
        nextDueDate,
      });

      return true;
    } catch (error) {
      logger.error('Error marcando mantenimiento como completado', { error, scheduleId });
      return false;
    }
  }

  /**
   * Envía recordatorios automáticos de mantenimiento preventivo
   */
  static async sendMaintenanceReminders(): Promise<number> {
    try {
      logger.info('Enviando recordatorios de mantenimiento preventivo');

      // Obtener todos los programas activos
      const schedules = await db.recurringService.findMany({
        where: {
          isActive: true,
        },
        include: {
          property: {
            include: {
              owner: {
                select: {
                  email: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      let remindersSent = 0;

      for (const schedule of schedules) {
        const daysUntilDue = Math.floor(
          (schedule.nextExecutionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};
        const reminderDays = notesData.reminderDaysBefore || 7;

        // Enviar recordatorio si está dentro del rango
        if (daysUntilDue <= reminderDays && daysUntilDue >= 0) {
          const sent = await this.sendReminderEmail(schedule, daysUntilDue);
          if (sent) {
            remindersSent++;
          }
        }

        // Enviar alerta si está vencido
        if (daysUntilDue < 0) {
          const sent = await this.sendOverdueAlert(schedule, Math.abs(daysUntilDue));
          if (sent) {
            remindersSent++;
          }
        }
      }

      logger.info(`Recordatorios de mantenimiento enviados: ${remindersSent}`);
      return remindersSent;
    } catch (error) {
      logger.error('Error enviando recordatorios de mantenimiento', { error });
      return 0;
    }
  }

  /**
   * Envía un recordatorio por email
   */
  private static async sendReminderEmail(schedule: any, daysUntilDue: number): Promise<boolean> {
    try {
      const ownerEmail = schedule.property.owner.email;
      const ownerName = schedule.property.owner.name;
      const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};
      const title = notesData.title || schedule.description.split(':')[0] || '';
      const category = schedule.serviceType || '';
      const estimatedCost = schedule.basePrice || notesData.estimatedCost;

      const subject = `⏰ Recordatorio: Mantenimiento Preventivo - ${title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mantenimiento Preventivo Próximo</h2>
          
          <p>Hola ${ownerName},</p>
          
          <p>Te recordamos que tienes un mantenimiento preventivo programado para tu propiedad:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">${title}</h3>
            <p><strong>Propiedad:</strong> ${schedule.property.title}</p>
            <p><strong>Dirección:</strong> ${schedule.property.address}</p>
            <p><strong>Categoría:</strong> ${category}</p>
            <p><strong>Fecha programada:</strong> ${schedule.nextExecutionDate.toLocaleDateString('es-CL')}</p>
            <p><strong>Días restantes:</strong> ${daysUntilDue}</p>
            ${estimatedCost ? `<p><strong>Costo estimado:</strong> $${estimatedCost.toLocaleString('es-CL')}</p>` : ''}
          </div>
          
          ${schedule.description ? `<p><strong>Descripción:</strong> ${schedule.description}</p>` : ''}
          
          <p>Te recomendamos programar este mantenimiento con anticipación para mantener tu propiedad en óptimas condiciones.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/owner/maintenance" 
             style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Ver Mantenimientos
          </a>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Este es un recordatorio automático. Si ya completaste este mantenimiento, 
            por favor márcalo como completado en tu panel.
          </p>
        </div>
      `;

      await EmailService.sendEmail({
        to: ownerEmail,
        subject,
        html,
      });

      return true;
    } catch (error) {
      logger.error('Error enviando recordatorio de mantenimiento', {
        error,
        scheduleId: schedule.id,
      });
      return false;
    }
  }

  /**
   * Envía una alerta de mantenimiento vencido
   */
  private static async sendOverdueAlert(schedule: any, daysOverdue: number): Promise<boolean> {
    try {
      const ownerEmail = schedule.property.owner.email;
      const ownerName = schedule.property.owner.name;
      const notesData = schedule.notes ? JSON.parse(schedule.notes) : {};
      const title = notesData.title || schedule.description.split(':')[0] || '';
      const category = schedule.serviceType || '';

      const subject = `🚨 URGENTE: Mantenimiento Vencido - ${title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">⚠️ Mantenimiento Vencido</h2>
          
          <p>Hola ${ownerName},</p>
          
          <p>El siguiente mantenimiento preventivo está <strong>VENCIDO</strong>:</p>
          
          <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin-top: 0; color: #dc2626;">${title}</h3>
            <p><strong>Propiedad:</strong> ${schedule.property.title}</p>
            <p><strong>Categoría:</strong> ${category}</p>
            <p><strong>Fecha programada:</strong> ${schedule.nextExecutionDate.toLocaleDateString('es-CL')}</p>
            <p><strong>Días de retraso:</strong> ${daysOverdue}</p>
          </div>
          
          <p><strong>⚠️ Importante:</strong> El mantenimiento preventivo es crucial para evitar problemas mayores y más costosos.</p>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/owner/maintenance" 
             style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 20px 0;">
            Programar Ahora
          </a>
          
          <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
            Si ya completaste este mantenimiento, márcalo como completado para actualizar el calendario.
          </p>
        </div>
      `;

      await EmailService.sendEmail({
        to: ownerEmail,
        subject,
        html,
      });

      return true;
    } catch (error) {
      logger.error('Error enviando alerta de mantenimiento vencido', {
        error,
        scheduleId: schedule.id,
      });
      return false;
    }
  }

  /**
   * Calcula la próxima fecha de mantenimiento basada en la frecuencia
   */
  /**
   * Mapea frecuencia de PreventiveMaintenanceSchedule a RecurringService
   */
  private static mapFrequencyToRecurringService(
    frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  ): string {
    const frequencyMap: Record<string, string> = {
      monthly: 'MONTHLY',
      quarterly: 'QUARTERLY',
      semiannual: 'QUARTERLY', // Mapear a QUARTERLY ya que no hay SEMIANNUAL
      annual: 'YEARLY',
    };
    return frequencyMap[frequency] || 'MONTHLY';
  }

  /**
   * Mapea frecuencia de RecurringService a PreventiveMaintenanceSchedule
   */
  private static mapFrequencyFromRecurringService(
    frequency: string
  ): 'monthly' | 'quarterly' | 'semiannual' | 'annual' {
    const frequencyMap: Record<string, 'monthly' | 'quarterly' | 'semiannual' | 'annual'> = {
      MONTHLY: 'monthly',
      QUARTERLY: 'quarterly',
      YEARLY: 'annual',
    };
    return frequencyMap[frequency] || 'monthly';
  }

  private static calculateNextDueDate(
    fromDate: Date,
    frequency: 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  ): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'semiannual':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'annual':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Mapea la frecuencia de la base de datos al tipo TypeScript
   */
  private static mapFrequency(
    frequency: string
  ): 'monthly' | 'quarterly' | 'semiannual' | 'annual' {
    const lowerFreq = frequency.toLowerCase();
    if (lowerFreq.includes('month')) {
      return 'monthly';
    }
    if (lowerFreq.includes('quarter')) {
      return 'quarterly';
    }
    if (lowerFreq.includes('semi')) {
      return 'semiannual';
    }
    return 'annual';
  }

  /**
   * Obtiene checklists predefinidos por categoría
   */
  static getPredefinedChecklist(category: string): string[] {
    const checklists: Record<string, string[]> = {
      Plomería: [
        'Revisar grifos y llaves de paso',
        'Inspeccionar tuberías visibles',
        'Verificar estado de cañerías',
        'Revisar sistema de desagüe',
        'Inspeccionar calefont o caldera',
      ],
      Electricidad: [
        'Revisar tablero eléctrico',
        'Inspeccionar enchufes y interruptores',
        'Verificar iluminación general',
        'Revisar conexiones a tierra',
        'Inspeccionar cables visibles',
      ],
      Pintura: [
        'Evaluar estado de paredes interiores',
        'Revisar pintura de fachada',
        'Inspeccionar cielos',
        'Verificar estado de molduras',
        'Evaluar necesidad de retoque',
      ],
      Jardín: [
        'Podar árboles y arbustos',
        'Cortar césped',
        'Revisar sistema de riego',
        'Fertilizar plantas',
        'Limpiar hojas y maleza',
      ],
      Limpieza: [
        'Limpieza profunda general',
        'Limpiar vidrios',
        'Desinfectar baños',
        'Limpiar cocina',
        'Aspirar y trapear pisos',
      ],
      'Aire Acondicionado': [
        'Limpiar filtros',
        'Revisar gas refrigerante',
        'Inspeccionar compresor',
        'Limpiar serpentines',
        'Verificar funcionamiento general',
      ],
      Calefacción: [
        'Revisar sistema de calefacción',
        'Limpiar radiadores',
        'Verificar termostatos',
        'Inspeccionar conexiones',
        'Purgar sistema si es necesario',
      ],
    };

    return (
      checklists[category] || [
        'Inspección general',
        'Verificar funcionamiento',
        'Limpiar componentes',
        'Revisar conexiones',
        'Documentar estado',
      ]
    );
  }

  /**
   * Desactiva un programa de mantenimiento preventivo
   */
  static async deactivateSchedule(scheduleId: string, ownerId: string): Promise<boolean> {
    try {
      const schedule = await db.recurringService.findFirst({
        where: {
          id: scheduleId,
          property: {
            ownerId: ownerId,
          },
        },
      });

      if (!schedule) {
        throw new Error('Programa de mantenimiento no encontrado');
      }

      await db.recurringService.update({
        where: {
          id: scheduleId,
        },
        data: {
          isActive: false,
        },
      });

      logger.info('Programa de mantenimiento desactivado', { scheduleId });
      return true;
    } catch (error) {
      logger.error('Error desactivando programa de mantenimiento', { error, scheduleId });
      return false;
    }
  }
}

// Función para ejecutar recordatorios automáticos (se puede llamar con cron job)
export async function runPreventiveMaintenanceReminders(): Promise<void> {
  try {
    logger.info('Ejecutando recordatorios automáticos de mantenimiento preventivo');
    await PreventiveMaintenanceService.sendMaintenanceReminders();
  } catch (error) {
    logger.error('Error ejecutando recordatorios de mantenimiento', { error });
  }
}
