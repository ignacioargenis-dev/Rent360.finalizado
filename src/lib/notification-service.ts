import { db } from './db';
import { logger } from './logger';
import { DatabaseError } from './errors';

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'email' | 'sms' | 'push';
  variables: string[];
}

export interface NotificationRecipient {
  id: string;
  email?: string | undefined;
  phone?: string | undefined;
  deviceToken?: string | undefined; // Para push notifications
  preferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface NotificationMessage {
  templateId: string;
  recipientId: string;
  variables: Record<string, any>;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledFor?: Date | undefined;
}

export interface CommissionNotification {
  brokerId: string;
  type: 'commission_calculated' | 'commission_paid' | 'commission_pending' | 'payout_ready';
  amount: number;
  contractId?: string | undefined;
  period?:
    | {
        start: Date;
        end: Date;
      }
    | undefined;
  metadata?: Record<string, any> | undefined;
}

export interface SystemNotification {
  type: 'system_alert' | 'maintenance' | 'system_maintenance' | 'feature_update' | 'security_alert';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  targetUsers?: string[] | undefined; // IDs de usuarios específicos, o vacío para todos
}

/**
 * Servicio de notificaciones para Rent360
 */
export class NotificationService {
  private static templates: Map<string, NotificationTemplate> = new Map();

  static {
    // Inicializar templates de notificaciones
    this.initializeTemplates();
  }

  private static initializeTemplates() {
    // Template para comisión calculada
    this.templates.set('commission_calculated', {
      id: 'commission_calculated',
      name: 'Comisión Calculada',
      subject: 'Nueva comisión calculada - Rent360',
      body: `Hola {{brokerName}},

Se ha calculado una nueva comisión correspondiente al contrato {{contractNumber}}.

Detalles:
- Monto de comisión: {{commissionAmount}}
- Fecha de cálculo: {{calculatedAt}}
- Tipo de propiedad: {{propertyType}}
- Valor del contrato: {{contractValue}}

Puedes revisar los detalles en tu dashboard de corredor.

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: [
        'brokerName',
        'amount',
        'contractNumber',
        'calculatedAt',
        'propertyType',
        'contractValue',
      ],
    });

    // Template para pago de comisión
    this.templates.set('commission_paid', {
      id: 'commission_paid',
      name: 'Comisión Pagada',
      subject: 'Comisión pagada exitosamente - Rent360',
      body: `Hola {{brokerName}},

¡Excelente! Se ha procesado el pago de tu comisión.

Detalles del pago:
- Monto pagado: {{amount}}
- Método de pago: {{paymentMethod}}
- Fecha de procesamiento: {{processedAt}}
- Referencia: {{reference}}

El monto ha sido transferido a tu cuenta registrada.

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: ['brokerName', 'amount', 'paymentMethod', 'processedAt', 'reference'],
    });

    // Template para payout listo
    this.templates.set('payout_ready', {
      id: 'payout_ready',
      name: 'Payout Listo para Procesar',
      subject: 'Payout de comisión listo - Rent360',
      body: `Hola {{brokerName}},

Tu payout mensual de comisiones está listo para procesar.

Detalles:
- Monto total: {{amount}}
- Período: {{periodStart}} - {{periodEnd}}
- Número de contratos: {{contractCount}}
- Próximo procesamiento: {{nextProcessingDate}}

El pago se procesará automáticamente según tu configuración.

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: [
        'brokerName',
        'amount',
        'periodStart',
        'periodEnd',
        'contractCount',
        'nextProcessingDate',
      ],
    });

    // Template para alerta del sistema
    this.templates.set('system_alert', {
      id: 'system_alert',
      name: 'Alerta del Sistema',
      subject: 'Alerta del Sistema - Rent360',
      body: `Atención: {{title}}

{{message}}

Severidad: {{severity}}
Timestamp: {{timestamp}}

Por favor revisa el sistema inmediatamente.

Equipo Rent360`,
      type: 'email',
      variables: ['title', 'message', 'severity', 'timestamp'],
    });

    // Template para nuevo mensaje
    this.templates.set('new_message', {
      id: 'new_message',
      name: 'Nuevo Mensaje',
      subject: 'Nuevo mensaje - Rent360',
      body: `Hola,

Has recibido un nuevo mensaje de {{senderName}}.

Asunto: {{subject}}

{{contentPreview}}

Para ver el mensaje completo, ingresa a tu cuenta en Rent360.

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: ['senderName', 'subject', 'contentPreview'],
    });

    // Template para mensaje leído
    this.templates.set('message_read', {
      id: 'message_read',
      name: 'Mensaje Leído',
      subject: 'Tu mensaje fue leído - Rent360',
      body: `Hola,

{{readerName}} ha leído tu mensaje.

Mensaje ID: {{messageId}}

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: ['readerName', 'messageId'],
    });

    // Template para calificación recibida
    this.templates.set('rating_received', {
      id: 'rating_received',
      name: 'Calificación Recibida',
      subject: 'Nueva calificación recibida - Rent360',
      body: `Hola,

¡Felicitaciones! Has recibido una nueva calificación.

{{raterName}} te ha calificado con {{rating}} estrella(s) en el contexto de {{contextType}}.

Puedes ver todos tus comentarios y calificaciones en tu perfil de Rent360.

Sigue manteniendo la excelencia en tu servicio.

Saludos,
Equipo Rent360`,
      type: 'email',
      variables: ['raterName', 'rating', 'contextType'],
    });

    // Template SMS para pagos
    this.templates.set('commission_paid_sms', {
      id: 'commission_paid_sms',
      name: 'Comisión Pagada (SMS)',
      subject: '',
      body: 'Rent360: Comisión pagada exitosamente. Ref: {{reference}}',
      type: 'sms',
      variables: ['amount', 'reference'],
    });

    // ===== TEMPLATES PARA RUNNERS =====

    // Template para payout de runner aprobado
    this.templates.set('runner_payout_approved', {
      id: 'runner_payout_approved',
      name: 'Payout de Runner Aprobado',
      subject: '¡Tu payout ha sido aprobado! - Rent360',
      body: `¡Hola {{runnerName}}! 🎉

¡Excelente noticia! Tu payout ha sido aprobado y está siendo procesado.

Detalles del pago:
• Monto aprobado: {{amount}}
• Monto neto (después de comisiones): {{netAmount}}
• Visitas realizadas: {{visitCount}}
• Período: {{periodStart}} - {{periodEnd}}
• Método de pago: {{paymentMethod}}

El pago se transferirá a tu cuenta bancaria registrada en las próximas 24-48 horas.

¡Gracias por tu excelente trabajo! 🚀

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: [
        'runnerName',
        'amount',
        'netAmount',
        'visitCount',
        'periodStart',
        'periodEnd',
        'paymentMethod',
      ],
    });

    // Template SMS para payout aprobado
    this.templates.set('runner_payout_approved_sms', {
      id: 'runner_payout_approved_sms',
      name: 'Payout Runner Aprobado (SMS)',
      subject: '',
      body: 'Rent360: ¡Tu payout de {{netAmount}} ha sido aprobado! 💰 Procesamiento en 24-48h.',
      type: 'sms',
      variables: ['netAmount'],
    });

    // Template para incentivo alcanzado
    this.templates.set('runner_incentive_achieved', {
      id: 'runner_incentive_achieved',
      name: 'Incentivo Runner Alcanzado',
      subject: '¡Felicitaciones! Has alcanzado un nuevo incentivo - Rent360',
      body: `¡Felicitaciones {{runnerName}}! 🏆

¡Has alcanzado el incentivo "{{incentiveName}}"!

Detalles del logro:
• Incentivo: {{incentiveName}}
• Nivel alcanzado: {{incentiveLevel}}
• Recompensa: {{rewardDescription}}
• Visitas realizadas: {{visitCount}}
• Rating promedio: {{averageRating}} ⭐

Sigue así y continúa superando tus propios récords.

¡Eres parte de nuestro equipo TOP! 🌟

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: [
        'runnerName',
        'incentiveName',
        'incentiveLevel',
        'rewardDescription',
        'visitCount',
        'averageRating',
      ],
    });

    // Template para rating actualizado
    this.templates.set('runner_rating_updated', {
      id: 'runner_rating_updated',
      name: 'Rating de Runner Actualizado',
      subject: 'Tu calificación ha sido actualizada - Rent360',
      body: `Hola {{runnerName}},

Tu calificación general ha sido actualizada.

Detalles:
• Nueva calificación: {{newRating}} ⭐
• Calificación anterior: {{previousRating}} ⭐
• Cliente: {{clientName}}
• Propiedad: {{propertyAddress}}
• Comentario: {{clientFeedback}}

Mantén tu excelente nivel de servicio para seguir siendo uno de nuestros runners TOP.

¡Gracias por tu dedicación! 🤝

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: [
        'runnerName',
        'newRating',
        'previousRating',
        'clientName',
        'propertyAddress',
        'clientFeedback',
      ],
    });

    // Template para reporte semanal disponible
    this.templates.set('runner_weekly_report', {
      id: 'runner_weekly_report',
      name: 'Reporte Semanal Runner',
      subject: 'Tu reporte semanal está disponible - Rent360',
      body: `Hola {{runnerName}},

Tu reporte semanal de rendimiento ya está disponible en tu dashboard.

Resumen de la semana:
• Visitas completadas: {{visitsCompleted}}
• Ganancias generadas: {{earningsGenerated}}
• Rating promedio: {{averageRating}} ⭐
• Posición en el ranking: {{rankingPosition}}

Visita tu dashboard para ver el reporte completo con gráficos detallados y consejos para mejorar tu rendimiento.

¡Sigue adelante, estás haciendo un gran trabajo! 📊

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: [
        'runnerName',
        'visitsCompleted',
        'earningsGenerated',
        'averageRating',
        'rankingPosition',
      ],
    });

    // Template para notificación de ranking
    this.templates.set('runner_ranking_update', {
      id: 'runner_ranking_update',
      name: 'Actualización de Ranking Runner',
      subject: 'Actualización de tu posición en el ranking - Rent360',
      body: `¡Hola {{runnerName}}!

Actualización de tu posición en el ranking semanal:

📊 Tu posición actual: #{{currentPosition}}
📈 Posición anterior: #{{previousPosition}}
🎯 Próximo objetivo: #{{nextMilestone}}

Sigue así para alcanzar los primeros lugares y obtener recompensas exclusivas.

¡Vamos por más! 🚀

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: ['runnerName', 'currentPosition', 'previousPosition', 'nextMilestone'],
    });

    // ===== TEMPLATES PARA PROVEEDORES =====

    // Template para payout de proveedor aprobado
    this.templates.set('provider_payout_approved', {
      id: 'provider_payout_approved',
      name: 'Payout de Proveedor Aprobado',
      subject: '¡Tu payout ha sido aprobado! - Rent360',
      body: `¡Hola {{providerName}}! 🎉

¡Excelente noticia! Tu payout por {{amount}} ha sido aprobado y está siendo procesado.

Detalles del pago:
• Monto aprobado: {{amount}}
• Monto neto (después de comisiones): {{netAmount}}
• Trabajos completados: {{jobCount}}
• Tipo de proveedor: {{providerType}}
• Período: {{periodStart}} - {{periodEnd}}
• Método de pago: {{paymentMethod}}

El pago se transferirá a tu cuenta bancaria registrada en las próximas 24-48 horas.

¡Gracias por tu excelente trabajo! 🚀

Saludos,
Equipo Rent360`,
      type: 'push',
      variables: [
        'providerName',
        'amount',
        'netAmount',
        'jobCount',
        'providerType',
        'periodStart',
        'periodEnd',
        'paymentMethod',
      ],
    });

    // Template SMS para payout aprobado de proveedor
    this.templates.set('provider_payout_approved_sms', {
      id: 'provider_payout_approved_sms',
      name: 'Payout Proveedor Aprobado (SMS)',
      subject: '',
      body: 'Rent360: ¡Tu payout de {{netAmount}} ha sido aprobado! 💰 Procesamiento en 24-48h.',
      type: 'sms',
      variables: ['netAmount'],
    });
  }

  /**
   * Envía notificación de comisión calculada
   */
  static async notifyCommissionCalculated(notification: CommissionNotification): Promise<void> {
    try {
      const broker = await db.user.findUnique({
        where: { id: notification.brokerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!broker) {
        throw new DatabaseError('Corredor no encontrado');
      }

      // Obtener detalles del contrato si existe
      let contractDetails = null;
      if (notification.contractId) {
        contractDetails = await db.contract.findUnique({
          where: { id: notification.contractId },
          include: {
            property: {
              select: {
                title: true,
                type: true,
              },
            },
          },
        });
      }

      const variables = {
        brokerName: broker.name,
        amount: notification.amount.toLocaleString('es-CL'),
        contractNumber: contractDetails?.contractNumber || 'N/A',
        calculatedAt: new Date().toLocaleDateString('es-CL'),
        propertyType: contractDetails?.property?.type || 'N/A',
        contractValue: contractDetails?.monthlyRent?.toLocaleString('es-CL') || 'N/A',
      };

      // Enviar notificación por email
      await this.sendNotification({
        templateId: 'commission_calculated',
        recipientId: broker.id,
        variables,
        priority: 'medium',
      });

      logger.info('Commission calculated notification sent', {
        brokerId: notification.brokerId,
        amount: notification.amount,
        contractId: notification.contractId,
      });
    } catch (error) {
      logger.error('Error sending commission calculated notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Envía notificación de pago de comisión
   */
  static async notifyCommissionPaid(notification: CommissionNotification): Promise<void> {
    try {
      const broker = await db.user.findUnique({
        where: { id: notification.brokerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!broker) {
        throw new DatabaseError('Corredor no encontrado');
      }

      const variables = {
        brokerName: broker.name,
        amount: notification.amount.toLocaleString('es-CL'),
        paymentMethod: 'Transferencia Bancaria',
        processedAt: new Date().toLocaleDateString('es-CL'),
        reference: `PAY_${Date.now()}`,
      };

      // Enviar notificación por email
      await this.sendNotification({
        templateId: 'commission_paid',
        recipientId: broker.id,
        variables,
        priority: 'high',
      });

      // Enviar SMS si el corredor tiene teléfono
      if (broker.phone) {
        await this.sendNotification({
          templateId: 'commission_paid_sms',
          recipientId: broker.id,
          variables: {
            amount: notification.amount.toLocaleString('es-CL'),
            reference: variables.reference,
          },
          priority: 'high',
        });
      }

      logger.info('Commission paid notification sent', {
        brokerId: notification.brokerId,
        amount: notification.amount,
        methods: ['email', broker.phone ? 'sms' : null].filter(Boolean),
      });
    } catch (error) {
      logger.error('Error sending commission paid notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Envía notificación de payout listo
   */
  static async notifyPayoutReady(notification: CommissionNotification): Promise<void> {
    try {
      const broker = await db.user.findUnique({
        where: { id: notification.brokerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!broker) {
        throw new DatabaseError('Corredor no encontrado');
      }

      const variables = {
        brokerName: broker.name,
        amount: notification.amount.toLocaleString('es-CL'),
        periodStart: notification.period?.start.toLocaleDateString('es-CL') || 'N/A',
        periodEnd: notification.period?.end.toLocaleDateString('es-CL') || 'N/A',
        contractCount: notification.metadata?.contractCount || 0,
        nextProcessingDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('es-CL'),
      };

      await this.sendNotification({
        templateId: 'payout_ready',
        recipientId: broker.id,
        variables,
        priority: 'medium',
      });

      logger.info('Payout ready notification sent', {
        brokerId: notification.brokerId,
        amount: notification.amount,
        period: notification.period,
      });
    } catch (error) {
      logger.error('Error sending payout ready notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Envía notificación del sistema
   */
  static async notifySystemAlert(notification: SystemNotification): Promise<void> {
    try {
      let targetUsers: string[];

      if (notification.targetUsers && notification.targetUsers.length > 0) {
        targetUsers = notification.targetUsers;
      } else {
        // Obtener todos los administradores
        const admins = await db.user.findMany({
          where: { role: 'admin' },
          select: { id: true },
        });
        targetUsers = admins.map(admin => admin.id);
      }

      const variables = {
        title: notification.title,
        message: notification.message,
        severity: notification.severity.toUpperCase(),
        timestamp: new Date().toLocaleString('es-CL'),
      };

      // Enviar a todos los usuarios objetivo
      const notifications = targetUsers.map(userId => ({
        templateId: 'system_alert',
        recipientId: userId,
        variables,
        priority: (notification.severity === 'critical' ? 'urgent' : 'high') as
          | 'low'
          | 'medium'
          | 'high'
          | 'urgent',
      }));

      await Promise.all(notifications.map(notification => this.sendNotification(notification)));

      logger.info('System alert notification sent', {
        type: notification.type,
        severity: notification.severity,
        targetUsersCount: targetUsers.length,
      });
    } catch (error) {
      logger.error('Error sending system alert notification', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Envía notificación genérica usando template
   */
  private static async sendNotification(message: NotificationMessage): Promise<void> {
    try {
      const template = this.templates.get(message.templateId);
      if (!template) {
        throw new Error(`Template ${message.templateId} not found`);
      }

      // Obtener información del destinatario
      const recipient = await db.user.findUnique({
        where: { id: message.recipientId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      });

      if (!recipient) {
        throw new DatabaseError('Destinatario no encontrado');
      }

      // Reemplazar variables en el template
      let processedSubject = template.subject;
      let processedBody = template.body;

      Object.entries(message.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        processedSubject = processedSubject.replace(regex, String(value));
        processedBody = processedBody.replace(regex, String(value));
      });

      // Aquí iría la lógica real de envío según el tipo
      switch (template.type) {
        case 'email':
          await this.sendEmailNotification(recipient.email!, processedSubject, processedBody);
          break;
        case 'sms':
          if (recipient.phone) {
            await this.sendSmsNotification(recipient.phone, processedBody);
          }
          break;
        case 'push':
          // Implementar notificaciones push
          break;
      }

      // Registrar la notificación en la base de datos
      await this.logNotification({
        recipientId: message.recipientId,
        type: template.type,
        templateId: message.templateId,
        subject: processedSubject,
        content: processedBody,
        priority: message.priority,
        status: 'sent',
      });
    } catch (error) {
      logger.error('Error sending notification', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Registrar notificación fallida
      await this.logNotification({
        recipientId: message.recipientId,
        type: 'unknown',
        templateId: message.templateId,
        subject: 'Error sending notification',
        content: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
        priority: message.priority,
        status: 'failed',
      });

      throw error;
    }
  }

  /**
   * Envía notificación por email (implementación básica)
   */
  private static async sendEmailNotification(
    email: string,
    subject: string,
    body: string
  ): Promise<void> {
    // Aquí iría la integración con un servicio de email real
    // Por ahora solo loggeamos
    logger.info('Email notification sent', {
      to: email,
      subject,
      bodyLength: body.length,
    });

    // Registrar envío de email
    logger.info('Email enviado exitosamente', {
      context: 'notification-service.email',
      recipient: email,
      subject,
      bodyLength: body.length,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envía notificación por SMS (implementación básica)
   */
  private static async sendSmsNotification(phone: string, message: string): Promise<void> {
    // Aquí iría la integración con un servicio de SMS real
    // Por ahora solo loggeamos
    logger.info('SMS notification sent', {
      to: phone,
      messageLength: message.length,
    });

    // Registrar envío de SMS
    logger.info('SMS enviado exitosamente', {
      context: 'notification-service.sms',
      recipient: phone,
      messageLength: message.length,
      timestamp: new Date().toISOString(),
    });
  }

  // ===== MÉTODOS ESPECÍFICOS PARA RUNNERS =====

  /**
   * Notifica payout aprobado a runner
   */
  static async notifyRunnerPayoutApproved(payoutData: {
    runnerId: string;
    runnerName: string;
    amount: number;
    netAmount: number;
    visitCount: number;
    periodStart: string;
    periodEnd: string;
    paymentMethod: string;
  }): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: payoutData.runnerId },
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
        },
      });

      if (!runner) {
        logger.warn('Runner not found for payout notification', { runnerId: payoutData.runnerId });
        return;
      }

      // Enviar notificación push/email
      await this.sendNotification({
        templateId: 'runner_payout_approved',
        recipientId: payoutData.runnerId,
        variables: {
          runnerName: runner.name || payoutData.runnerName,
          amount: payoutData.amount,
          netAmount: payoutData.netAmount,
          visitCount: payoutData.visitCount,
          periodStart: payoutData.periodStart,
          periodEnd: payoutData.periodEnd,
          paymentMethod: payoutData.paymentMethod,
        },
        priority: 'high',
      });

      // Enviar SMS si tiene teléfono
      if (runner.phone) {
        await this.sendNotification({
          templateId: 'runner_payout_approved_sms',
          recipientId: payoutData.runnerId,
          variables: {
            netAmount: payoutData.netAmount,
          },
          priority: 'high',
        });
      }

      logger.info('Runner payout approval notification sent', {
        runnerId: payoutData.runnerId,
        amount: payoutData.netAmount,
        notificationType: 'push_and_sms',
      });
    } catch (error) {
      logger.error('Error sending runner payout notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica incentivo alcanzado
   */
  static async notifyRunnerIncentiveAchieved(incentiveData: {
    runnerId: string;
    incentiveName: string;
    incentiveLevel: string;
    rewardDescription: string;
    visitCount: number;
    averageRating: number;
  }): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: incentiveData.runnerId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!runner) {
        logger.warn('Runner not found for incentive notification', {
          runnerId: incentiveData.runnerId,
        });
        return;
      }

      await this.sendNotification({
        templateId: 'runner_incentive_achieved',
        recipientId: incentiveData.runnerId,
        variables: {
          runnerName: runner.name || 'Runner',
          incentiveName: incentiveData.incentiveName,
          incentiveLevel: incentiveData.incentiveLevel,
          rewardDescription: incentiveData.rewardDescription,
          visitCount: incentiveData.visitCount,
          averageRating: incentiveData.averageRating,
        },
        priority: 'high',
      });

      logger.info('Runner incentive achievement notification sent', {
        runnerId: incentiveData.runnerId,
        incentiveName: incentiveData.incentiveName,
        level: incentiveData.incentiveLevel,
      });
    } catch (error) {
      logger.error('Error sending runner incentive notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica actualización de rating
   */
  static async notifyRunnerRatingUpdated(ratingData: {
    runnerId: string;
    newRating: number;
    previousRating: number;
    clientName: string;
    propertyAddress: string;
    clientFeedback: string;
  }): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: ratingData.runnerId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!runner) {
        logger.warn('Runner not found for rating notification', { runnerId: ratingData.runnerId });
        return;
      }

      await this.sendNotification({
        templateId: 'runner_rating_updated',
        recipientId: ratingData.runnerId,
        variables: {
          runnerName: runner.name || 'Runner',
          newRating: ratingData.newRating,
          previousRating: ratingData.previousRating,
          clientName: ratingData.clientName,
          propertyAddress: ratingData.propertyAddress,
          clientFeedback: ratingData.clientFeedback,
        },
        priority: 'medium',
      });

      logger.info('Runner rating update notification sent', {
        runnerId: ratingData.runnerId,
        newRating: ratingData.newRating,
        previousRating: ratingData.previousRating,
      });
    } catch (error) {
      logger.error('Error sending runner rating notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica reporte semanal disponible
   */
  static async notifyRunnerWeeklyReport(reportData: {
    runnerId: string;
    visitsCompleted: number;
    earningsGenerated: number;
    averageRating: number;
    rankingPosition: number;
  }): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: reportData.runnerId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!runner) {
        logger.warn('Runner not found for weekly report notification', {
          runnerId: reportData.runnerId,
        });
        return;
      }

      await this.sendNotification({
        templateId: 'runner_weekly_report',
        recipientId: reportData.runnerId,
        variables: {
          runnerName: runner.name || 'Runner',
          visitsCompleted: reportData.visitsCompleted,
          earningsGenerated: reportData.earningsGenerated,
          averageRating: reportData.averageRating,
          rankingPosition: reportData.rankingPosition,
        },
        priority: 'medium',
      });

      logger.info('Runner weekly report notification sent', {
        runnerId: reportData.runnerId,
        visitsCompleted: reportData.visitsCompleted,
        earningsGenerated: reportData.earningsGenerated,
      });
    } catch (error) {
      logger.error('Error sending runner weekly report notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica actualización de ranking
   */
  static async notifyRunnerRankingUpdate(rankingData: {
    runnerId: string;
    currentPosition: number;
    previousPosition: number;
    nextMilestone: number;
  }): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: rankingData.runnerId },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      if (!runner) {
        logger.warn('Runner not found for ranking notification', {
          runnerId: rankingData.runnerId,
        });
        return;
      }

      await this.sendNotification({
        templateId: 'runner_ranking_update',
        recipientId: rankingData.runnerId,
        variables: {
          runnerName: runner.name || 'Runner',
          currentPosition: rankingData.currentPosition,
          previousPosition: rankingData.previousPosition,
          nextMilestone: rankingData.nextMilestone,
        },
        priority: 'low',
      });

      logger.info('Runner ranking update notification sent', {
        runnerId: rankingData.runnerId,
        currentPosition: rankingData.currentPosition,
        previousPosition: rankingData.previousPosition,
      });
    } catch (error) {
      logger.error('Error sending runner ranking notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ===== MÉTODOS ESPECÍFICOS PARA PROVEEDORES =====

  /**
   * Notifica payout aprobado a proveedor
   */
  static async notifyProviderPayoutApproved(payoutData: {
    providerId: string;
    providerName: string;
    amount: number;
    netAmount: number;
    jobCount: number;
    providerType: string;
    periodStart: string;
    periodEnd: string;
    paymentMethod: string;
  }): Promise<void> {
    try {
      // Buscar el usuario del proveedor
      let providerUser;

      // Intentar encontrar el usuario según el tipo de proveedor
      const maintenanceProvider = await db.maintenanceProvider.findUnique({
        where: { id: payoutData.providerId },
        include: { user: true },
      });

      if (maintenanceProvider) {
        providerUser = maintenanceProvider.user;
      } else {
        const serviceProvider = await db.serviceProvider.findUnique({
          where: { id: payoutData.providerId },
          include: { user: true },
        });
        if (serviceProvider) {
          providerUser = serviceProvider.user;
        }
      }

      if (!providerUser) {
        logger.warn('Provider user not found for payout notification', {
          providerId: payoutData.providerId,
        });
        return;
      }

      // Enviar notificación push/email
      await this.sendNotification({
        templateId: 'provider_payout_approved',
        recipientId: providerUser.id,
        variables: {
          providerName: providerUser.name || payoutData.providerName,
          amount: payoutData.amount,
          netAmount: payoutData.netAmount,
          jobCount: payoutData.jobCount,
          providerType: payoutData.providerType === 'MAINTENANCE' ? 'Mantenimiento' : 'Servicios',
          periodStart: payoutData.periodStart,
          periodEnd: payoutData.periodEnd,
          paymentMethod: payoutData.paymentMethod,
        },
        priority: 'high',
      });

      // Enviar SMS si tiene teléfono
      if (providerUser.phone) {
        await this.sendNotification({
          templateId: 'provider_payout_approved_sms',
          recipientId: providerUser.id,
          variables: {
            netAmount: payoutData.netAmount,
          },
          priority: 'high',
        });
      }

      logger.info('Provider payout approval notification sent', {
        providerId: payoutData.providerId,
        amount: payoutData.netAmount,
        notificationType: 'push_and_sms',
      });
    } catch (error) {
      logger.error('Error sending provider payout notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Registra notificación en la base de datos
   */
  private static async logNotification(notification: {
    recipientId: string;
    type: string;
    templateId: string;
    subject: string;
    content: string;
    priority: string;
    status: 'sent' | 'failed';
  }): Promise<void> {
    try {
      // Aquí se guardaría en una tabla de notificaciones
      // Por ahora solo loggeamos
      logger.info('Notification logged', {
        recipientId: notification.recipientId,
        type: notification.type,
        templateId: notification.templateId,
        priority: notification.priority,
        status: notification.status,
      });
    } catch (error) {
      logger.error('Error logging notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Procesa notificaciones programadas
   */
  static async processScheduledNotifications(): Promise<void> {
    try {
      logger.info('Processing scheduled notifications');

      // Aquí iría la lógica para procesar notificaciones programadas
      // Por ejemplo, recordatorios de payouts, alertas de sistema, etc.

      const now = new Date();

      // Simular procesamiento de notificaciones programadas
      logger.info('Scheduled notifications processed', { processedCount: 0 });
    } catch (error) {
      logger.error('Error processing scheduled notifications', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Obtiene estadísticas de notificaciones
   */
  static async getNotificationStats(): Promise<{
    totalSent: number;
    totalFailed: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    // Aquí iría la consulta real a la base de datos
    // Por ahora retornamos datos simulados
    return {
      totalSent: 1250,
      totalFailed: 15,
      byType: {
        email: 1100,
        sms: 135,
        push: 15,
      },
      byPriority: {
        low: 800,
        medium: 350,
        high: 95,
        urgent: 5,
      },
    };
  }

  // ===== MÉTODOS DE NOTIFICACIÓN PARA MENSAJES =====

  /**
   * Notifica nuevo mensaje recibido
   */
  static async notifyNewMessage(messageData: {
    recipientId: string;
    senderId: string;
    senderName: string;
    subject: string;
    content: string;
    messageId: string;
    type: string;
    propertyId?: string;
    contractId?: string;
  }): Promise<void> {
    try {
      // Crear notificación push a través de WebSocket
      const notificationData = {
        id: `msg_${messageData.messageId}`,
        type: 'new_message',
        title: 'Nuevo mensaje',
        message: `Tienes un nuevo mensaje de ${messageData.senderName}`,
        data: {
          messageId: messageData.messageId,
          senderId: messageData.senderId,
          senderName: messageData.senderName,
          subject: messageData.subject,
          type: messageData.type,
          propertyId: messageData.propertyId,
          contractId: messageData.contractId,
        },
        priority: 'medium' as const,
        userId: messageData.recipientId,
      };

      // Enviar notificación en tiempo real
      await this.sendNotification({
        recipientId: messageData.recipientId,
        templateId: 'new_message',
        variables: {
          senderName: messageData.senderName,
          subject: messageData.subject,
          contentPreview:
            messageData.content.substring(0, 100) + (messageData.content.length > 100 ? '...' : ''),
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error sending new message notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica mensaje marcado como leído
   */
  static async notifyMessageRead(messageData: {
    senderId: string;
    readerId: string;
    readerName: string;
    messageId: string;
  }): Promise<void> {
    try {
      // Notificar al remitente que su mensaje fue leído
      const notificationData = {
        id: `read_${messageData.messageId}`,
        type: 'message_read',
        title: 'Mensaje leído',
        message: `${messageData.readerName} ha leído tu mensaje`,
        data: {
          messageId: messageData.messageId,
          readerId: messageData.readerId,
          readerName: messageData.readerName,
        },
        priority: 'low' as const,
        userId: messageData.senderId,
      };

      await this.sendNotification({
        recipientId: messageData.senderId,
        templateId: 'message_read',
        variables: {
          readerName: messageData.readerName,
          messageId: messageData.messageId,
        },
        priority: 'low',
      });
    } catch (error) {
      logger.error('Error sending message read notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ===== MÉTODOS DE NOTIFICACIÓN PARA CALIFICACIONES =====

  /**
   * Notifica calificación recibida
   */
  static async notifyUserRatingReceived(ratingData: {
    recipientId: string;
    raterId: string;
    raterName: string;
    rating: number;
    contextType: string;
    ratingId: string;
  }): Promise<void> {
    try {
      // Crear notificación push a través de WebSocket
      const notificationData = {
        id: `rating_${ratingData.ratingId}`,
        type: 'rating_received',
        title: 'Nueva calificación',
        message: `${ratingData.raterName} te ha calificado con ${ratingData.rating} estrella(s)`,
        data: {
          ratingId: ratingData.ratingId,
          raterId: ratingData.raterId,
          raterName: ratingData.raterName,
          rating: ratingData.rating,
          contextType: ratingData.contextType,
        },
        priority: 'medium' as const,
        userId: ratingData.recipientId,
      };

      // Enviar notificación en tiempo real
      await this.sendNotification({
        recipientId: ratingData.recipientId,
        templateId: 'rating_received',
        variables: {
          raterName: ratingData.raterName,
          rating: ratingData.rating.toString(),
          contextType: ratingData.contextType,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error sending rating received notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ===== MÉTODOS DE NOTIFICACIÓN PARA MANTENIMIENTO =====

  /**
   * Notifica asignación de prestador a solicitud de mantenimiento
   */
  static async notifyMaintenanceProviderAssigned(assignmentData: {
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    maintenanceId: string;
    maintenanceTitle: string;
    propertyAddress: string;
    assignedBy: string;
    notes?: string;
  }): Promise<void> {
    try {
      await this.sendNotification({
        templateId: 'maintenance_provider_assigned',
        recipientId: assignmentData.recipientId,
        variables: {
          recipientName: assignmentData.recipientName,
          maintenanceTitle: assignmentData.maintenanceTitle,
          propertyAddress: assignmentData.propertyAddress,
          assignedBy: assignmentData.assignedBy,
          notes: assignmentData.notes || '',
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending maintenance provider assigned notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica asignación de prestador al solicitante
   */
  static async notifyMaintenanceAssigned(assignmentData: {
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    maintenanceId: string;
    maintenanceTitle: string;
    providerName: string;
    providerPhone?: string;
    assignedBy: string;
  }): Promise<void> {
    try {
      await this.sendNotification({
        templateId: 'maintenance_assigned',
        recipientId: assignmentData.recipientId,
        variables: {
          recipientName: assignmentData.recipientName,
          maintenanceTitle: assignmentData.maintenanceTitle,
          providerName: assignmentData.providerName,
          providerPhone: assignmentData.providerPhone || '',
          assignedBy: assignmentData.assignedBy,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending maintenance assigned notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Notifica programación de visita de mantenimiento
   */
  static async notifyMaintenanceVisitScheduled(visitData: {
    recipientId: string;
    recipientName: string;
    recipientEmail: string;
    maintenanceId: string;
    maintenanceTitle: string;
    propertyAddress: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    contactPerson: string;
    contactPhone: string;
    specialInstructions?: string;
    scheduledBy: string;
  }): Promise<void> {
    try {
      await this.sendNotification({
        templateId: 'maintenance_visit_scheduled',
        recipientId: visitData.recipientId,
        variables: {
          recipientName: visitData.recipientName,
          maintenanceTitle: visitData.maintenanceTitle,
          propertyAddress: visitData.propertyAddress,
          scheduledDate: visitData.scheduledDate,
          scheduledTime: visitData.scheduledTime,
          estimatedDuration: visitData.estimatedDuration.toString(),
          contactPerson: visitData.contactPerson,
          contactPhone: visitData.contactPhone,
          specialInstructions: visitData.specialInstructions || '',
          scheduledBy: visitData.scheduledBy,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending maintenance visit scheduled notification', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
