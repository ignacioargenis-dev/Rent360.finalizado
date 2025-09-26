import { logger } from '@/lib/logger';

/**
 * Frecuencia de servicios recurrentes
 */
export enum RecurrenceFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  BIWEEKLY = 'BIWEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  BIANNUAL = 'BIANNUAL',
  ANNUAL = 'ANNUAL'
}

/**
 * Estado del servicio recurrente
 */
export enum RecurringServiceStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

/**
 * Estado de una instancia específica
 */
export enum ServiceInstanceStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  MISSED = 'MISSED'
}

/**
 * Servicio recurrente
 */
export interface RecurringService {
  id: string;
  propertyId: string;
  clientId: string;
  providerId: string;
  serviceType: string;
  serviceCategory: string;
  title: string;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: Date;
  endDate?: Date;
  nextScheduledDate: Date;
  status: RecurringServiceStatus;
  createdAt: Date;
  updatedAt: Date;
  totalInstances: number;
  completedInstances: number;
  cancelledInstances: number;

  // Configuración de precios
  basePrice: number;
  adjustments?: {
    seasonal?: number;
    urgency?: number;
    complexity?: number;
  };

  // Configuración de recordatorios
  reminderSettings: {
    clientReminder: number; // horas antes
    providerReminder: number; // horas antes
    followUpReminder: number; // horas después
  };

  // Preferencias
  preferredTimeSlots: string[]; // ej: ['09:00-12:00', '14:00-17:00']
  notes?: string;
  specialInstructions?: string;
}

/**
 * Instancia específica de un servicio recurrente
 */
export interface ServiceInstance {
  id: string;
  recurringServiceId: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: ServiceInstanceStatus;
  estimatedDuration: number; // minutos
  actualDuration?: number;
  price: number;
  notes?: string;

  // Información del trabajo
  workDescription?: string;
  materials?: string[];
  photos?: string[];
  issues?: string[];

  // Calificaciones
  clientRating?: number;
  providerRating?: number;
  clientFeedback?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Servicio de gestión de servicios recurrentes
 */
export class RecurringServicesService {
  private static instance: RecurringServicesService;
  private recurringServices: Map<string, RecurringService> = new Map();
  private serviceInstances: Map<string, ServiceInstance[]> = new Map(); // recurringServiceId -> instances

  private constructor() {
    this.initializeMockData();
    this.startScheduler();
  }

  static getInstance(): RecurringServicesService {
    if (!RecurringServicesService.instance) {
      RecurringServicesService.instance = new RecurringServicesService();
    }
    return RecurringServicesService.instance;
  }

  /**
   * Crea un nuevo servicio recurrente
   */
  async createRecurringService(serviceData: Omit<RecurringService, 'id' | 'createdAt' | 'updatedAt' | 'nextScheduledDate' | 'totalInstances' | 'completedInstances' | 'cancelledInstances'>): Promise<RecurringService> {
    try {
      const serviceId = this.generateServiceId();
      const now = new Date();

      const service: RecurringService = {
        ...serviceData,
        id: serviceId,
        createdAt: now,
        updatedAt: now,
        nextScheduledDate: this.calculateNextScheduledDate(serviceData.startDate, serviceData.frequency),
        totalInstances: 0,
        completedInstances: 0,
        cancelledInstances: 0
      };

      this.recurringServices.set(serviceId, service);
      this.serviceInstances.set(serviceId, []);

      // Crear primera instancia
      await this.scheduleNextInstance(serviceId);

      logger.info('Servicio recurrente creado:', {
        serviceId,
        clientId: serviceData.clientId,
        frequency: serviceData.frequency
      });

      return service;
    } catch (error) {
      logger.error('Error creando servicio recurrente:', error as Error);
      throw error;
    }
  }

  /**
   * Actualiza un servicio recurrente
   */
  async updateRecurringService(serviceId: string, updates: Partial<RecurringService>): Promise<RecurringService> {
    try {
      const service = this.recurringServices.get(serviceId);
      if (!service) {
        throw new Error('Servicio recurrente no encontrado');
      }

      const updatedService = {
        ...service,
        ...updates,
        updatedAt: new Date()
      };

      // Recalcular próxima fecha si cambió la frecuencia
      if (updates.frequency || updates.startDate) {
        updatedService.nextScheduledDate = this.calculateNextScheduledDate(
          updatedService.startDate,
          updatedService.frequency
        );
      }

      this.recurringServices.set(serviceId, updatedService);

      logger.info('Servicio recurrente actualizado:', { serviceId });

      return updatedService;
    } catch (error) {
      logger.error('Error actualizando servicio recurrente:', error as Error);
      throw error;
    }
  }

  /**
   * Pausa un servicio recurrente
   */
  async pauseRecurringService(serviceId: string): Promise<void> {
    await this.updateRecurringService(serviceId, { status: RecurringServiceStatus.PAUSED });
    logger.info('Servicio recurrente pausado:', { serviceId });
  }

  /**
   * Reanuda un servicio recurrente
   */
  async resumeRecurringService(serviceId: string): Promise<void> {
    const service = this.recurringServices.get(serviceId);
    if (!service) {
      throw new Error('Servicio recurrente no encontrado');
    }

    // Actualizar próxima fecha programada
    const nextDate = this.calculateNextScheduledDate(new Date(), service.frequency);

    await this.updateRecurringService(serviceId, {
      status: RecurringServiceStatus.ACTIVE,
      nextScheduledDate: nextDate
    });

    logger.info('Servicio recurrente reanudado:', { serviceId });
  }

  /**
   * Cancela un servicio recurrente
   */
  async cancelRecurringService(serviceId: string, reason?: string): Promise<void> {
    await this.updateRecurringService(serviceId, {
      status: RecurringServiceStatus.CANCELLED
    });

    // Cancelar todas las instancias pendientes
    const instances = this.serviceInstances.get(serviceId) || [];
    instances.forEach(instance => {
      if (instance.status === ServiceInstanceStatus.SCHEDULED) {
        instance.status = ServiceInstanceStatus.CANCELLED;
        if (reason) {
          instance.notes = reason;
        }
        instance.updatedAt = new Date();
      }
    });

    logger.info('Servicio recurrente cancelado:', { serviceId });
  }

  /**
   * Completa una instancia de servicio
   */
  async completeServiceInstance(
    serviceId: string,
    instanceId: string,
    completionData: {
      actualDate: Date;
      actualDuration: number;
      workDescription: string;
      materials?: string[];
      photos?: string[];
      issues?: string[];
      notes?: string;
    }
  ): Promise<ServiceInstance> {
    try {
      const instances = this.serviceInstances.get(serviceId);
      if (!instances) {
        throw new Error('Servicio no encontrado');
      }

      const instance = instances.find(i => i.id === instanceId);
      if (!instance) {
        throw new Error('Instancia no encontrada');
      }

      // Actualizar instancia
      instance.status = ServiceInstanceStatus.COMPLETED;
      instance.actualDate = completionData.actualDate;
      instance.actualDuration = completionData.actualDuration;
      instance.workDescription = completionData.workDescription;
      instance.materials = completionData.materials;
      instance.photos = completionData.photos;
      instance.issues = completionData.issues;
      instance.notes = completionData.notes;
      instance.updatedAt = new Date();

      // Actualizar estadísticas del servicio recurrente
      const service = this.recurringServices.get(serviceId);
      if (service) {
        service.completedInstances++;
        service.updatedAt = new Date();

        // Programar siguiente instancia
        await this.scheduleNextInstance(serviceId);
      }

      logger.info('Instancia de servicio completada:', {
        serviceId,
        instanceId,
        duration: completionData.actualDuration
      });

      return instance;
    } catch (error) {
      logger.error('Error completando instancia de servicio:', error as Error);
      throw error;
    }
  }

  /**
   * Obtiene servicios recurrentes de un cliente
   */
  async getClientRecurringServices(clientId: string): Promise<RecurringService[]> {
    const services: RecurringService[] = [];

    for (const [serviceId, service] of this.recurringServices) {
      if (service.clientId === clientId) {
        services.push(service);
      }
    }

    return services.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Obtiene servicios recurrentes de un proveedor
   */
  async getProviderRecurringServices(providerId: string): Promise<RecurringService[]> {
    const services: RecurringService[] = [];

    for (const [serviceId, service] of this.recurringServices) {
      if (service.providerId === providerId && service.status === RecurringServiceStatus.ACTIVE) {
        services.push(service);
      }
    }

    return services.sort((a, b) => a.nextScheduledDate.getTime() - b.nextScheduledDate.getTime());
  }

  /**
   * Obtiene instancias de un servicio recurrente
   */
  async getServiceInstances(serviceId: string, limit: number = 20): Promise<ServiceInstance[]> {
    const instances = this.serviceInstances.get(serviceId) || [];
    return instances
      .sort((a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime())
      .slice(0, limit);
  }

  /**
   * Calcula la próxima fecha programada
   */
  private calculateNextScheduledDate(fromDate: Date, frequency: RecurrenceFrequency): Date {
    const nextDate = new Date(fromDate);

    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case RecurrenceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case RecurrenceFrequency.BIWEEKLY:
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case RecurrenceFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case RecurrenceFrequency.BIANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case RecurrenceFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    return nextDate;
  }

  /**
   * Programa la siguiente instancia de un servicio
   */
  private async scheduleNextInstance(serviceId: string): Promise<void> {
    try {
      const service = this.recurringServices.get(serviceId);
      if (!service || service.status !== RecurringServiceStatus.ACTIVE) {
        return;
      }

      // Verificar si debe terminar
      if (service.endDate && service.nextScheduledDate >= service.endDate) {
        service.status = RecurringServiceStatus.COMPLETED;
        return;
      }

      const instanceId = this.generateInstanceId();
      const instance: ServiceInstance = {
        id: instanceId,
        recurringServiceId: serviceId,
        scheduledDate: service.nextScheduledDate,
        status: ServiceInstanceStatus.SCHEDULED,
        estimatedDuration: this.estimateDuration(service.serviceType),
        price: this.calculatePrice(service),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Agregar instancia
      const instances = this.serviceInstances.get(serviceId) || [];
      instances.push(instance);
      this.serviceInstances.set(serviceId, instances);

      // Actualizar próxima fecha
      service.nextScheduledDate = this.calculateNextScheduledDate(service.nextScheduledDate, service.frequency);
      service.totalInstances++;

      // Enviar notificaciones
      await this.sendSchedulingNotifications(service, instance);

      logger.info('Nueva instancia programada:', {
        serviceId,
        instanceId,
        scheduledDate: instance.scheduledDate
      });

    } catch (error) {
      logger.error('Error programando siguiente instancia:', error as Error);
    }
  }

  /**
   * Calcula precio para una instancia específica
   */
  private calculatePrice(service: RecurringService): number {
    let price = service.basePrice;

    // Aplicar ajustes
    if (service.adjustments) {
      if (service.adjustments.seasonal) {
        price += service.adjustments.seasonal;
      }
      if (service.adjustments.urgency) {
        price += service.adjustments.urgency;
      }
      if (service.adjustments.complexity) {
        price += service.adjustments.complexity;
      }
    }

    return price;
  }

  /**
   * Estima duración basada en tipo de servicio
   */
  private estimateDuration(serviceType: string): number {
    const durationMap: Record<string, number> = {
      'limpieza': 180, // 3 horas
      'mantenimiento': 120, // 2 horas
      'jardineria': 240, // 4 horas
      'plomeria': 90, // 1.5 horas
      'electricidad': 120, // 2 horas
      'pintura': 300, // 5 horas
      'fumigacion': 60, // 1 hora
      'seguridad': 480 // 8 horas
    };

    return durationMap[serviceType.toLowerCase()] || 120; // default 2 horas
  }

  /**
   * Envía notificaciones de programación
   */
  private async sendSchedulingNotifications(service: RecurringService, instance: ServiceInstance): Promise<void> {
    // En implementación real, enviar notificaciones push/email
    logger.info('Notificaciones de programación enviadas:', {
      serviceId: service.id,
      clientId: service.clientId,
      providerId: service.providerId,
      scheduledDate: instance.scheduledDate
    });
  }

  /**
   * Inicia el programador automático
   */
  private startScheduler(): void {
    // Verificar cada hora si hay nuevas instancias que programar
    setInterval(() => {
      this.checkAndScheduleInstances();
    }, 60 * 60 * 1000); // cada hora

    logger.info('Programador de servicios recurrentes iniciado');
  }

  /**
   * Verifica y programa nuevas instancias según sea necesario
   */
  private async checkAndScheduleInstances(): Promise<void> {
    try {
      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

      for (const [serviceId, service] of this.recurringServices) {
        if (service.status !== RecurringServiceStatus.ACTIVE) {
          continue;
        }

        // Si la próxima fecha está dentro de 3 días, programar instancia
        if (service.nextScheduledDate <= threeDaysFromNow) {
          await this.scheduleNextInstance(serviceId);
        }
      }
    } catch (error) {
      logger.error('Error en verificación automática de instancias:', error as Error);
    }
  }

  /**
   * Genera ID único para servicio
   */
  private generateServiceId(): string {
    return `rec_svc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Genera ID único para instancia
   */
  private generateInstanceId(): string {
    return `rec_inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Inicializa datos de ejemplo
   */
  private initializeMockData(): void {
    const mockServices: RecurringService[] = [
      {
        id: 'rec_svc_001',
        propertyId: 'prop_001',
        clientId: 'user_001',
        providerId: 'prov_001',
        serviceType: 'limpieza',
        serviceCategory: 'CLEANING',
        title: 'Limpieza semanal de hogar',
        description: 'Limpieza completa semanal del hogar',
        frequency: RecurrenceFrequency.WEEKLY,
        startDate: new Date('2024-01-01'),
        nextScheduledDate: new Date('2024-02-01'),
        status: RecurringServiceStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        totalInstances: 5,
        completedInstances: 4,
        cancelledInstances: 0,
        basePrice: 35000,
        reminderSettings: {
          clientReminder: 24,
          providerReminder: 12,
          followUpReminder: 2
        },
        preferredTimeSlots: ['09:00-12:00', '14:00-17:00']
      },
      {
        id: 'rec_svc_002',
        propertyId: 'prop_002',
        clientId: 'user_002',
        providerId: 'prov_002',
        serviceType: 'jardineria',
        serviceCategory: 'GARDENING',
        title: 'Mantenimiento mensual de jardín',
        description: 'Cuidado y mantenimiento mensual del jardín',
        frequency: RecurrenceFrequency.MONTHLY,
        startDate: new Date('2024-01-01'),
        nextScheduledDate: new Date('2024-02-01'),
        status: RecurringServiceStatus.ACTIVE,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        totalInstances: 2,
        completedInstances: 1,
        cancelledInstances: 0,
        basePrice: 45000,
        reminderSettings: {
          clientReminder: 48,
          providerReminder: 24,
          followUpReminder: 4
        },
        preferredTimeSlots: ['08:00-11:00']
      }
    ];

    mockServices.forEach(service => {
      this.recurringServices.set(service.id, service);
      this.serviceInstances.set(service.id, []);
    });

    logger.info(`Servicios recurrentes inicializados: ${mockServices.length}`);
  }

  /**
   * Obtiene estadísticas del sistema de servicios recurrentes
   */
  async getSystemStats(): Promise<{
    totalServices: number;
    activeServices: number;
    totalInstances: number;
    completedInstances: number;
    averageCompletionRate: number;
    popularFrequencies: Record<string, number>;
  }> {
    const services = Array.from(this.recurringServices.values());
    const activeServices = services.filter(s => s.status === RecurringServiceStatus.ACTIVE);
    const allInstances = Array.from(this.serviceInstances.values()).flat();

    const totalInstances = allInstances.length;
    const completedInstances = allInstances.filter(i => i.status === ServiceInstanceStatus.COMPLETED).length;
    const averageCompletionRate = totalInstances > 0 ? (completedInstances / totalInstances) * 100 : 0;

    const frequencyCount: Record<string, number> = {};
    activeServices.forEach(service => {
      frequencyCount[service.frequency] = (frequencyCount[service.frequency] || 0) + 1;
    });

    return {
      totalServices: services.length,
      activeServices: activeServices.length,
      totalInstances,
      completedInstances,
      averageCompletionRate,
      popularFrequencies: frequencyCount
    };
  }
}

/**
 * Instancia global del servicio de servicios recurrentes
 */
export const recurringServicesService = RecurringServicesService.getInstance();
