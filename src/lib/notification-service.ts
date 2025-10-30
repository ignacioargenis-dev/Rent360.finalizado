import { db } from './db';
import { logger } from './logger';
import { sendNotification } from './websocket/socket-server';

/**
 * Servicio de Notificaciones en Tiempo Real
 * Gestiona la creación y envío de notificaciones a usuarios
 */

export enum NotificationType {
  // Invitaciones
  INVITATION_RECEIVED = 'INVITATION_RECEIVED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
  INVITATION_REJECTED = 'INVITATION_REJECTED',

  // Solicitudes de Servicio
  SERVICE_REQUEST_RESPONSE = 'SERVICE_REQUEST_RESPONSE',
  SERVICE_REQUEST_ACCEPTED = 'SERVICE_REQUEST_ACCEPTED',
  SERVICE_REQUEST_REJECTED = 'SERVICE_REQUEST_REJECTED',

  // Recomendaciones
  NEW_RECOMMENDATIONS = 'NEW_RECOMMENDATIONS',

  // Prospects
  PROSPECT_CONVERTED = 'PROSPECT_CONVERTED',
  PROSPECT_ACTIVITY = 'PROSPECT_ACTIVITY',

  // Comisiones y Pagos
  COMMISSION_CALCULATED = 'COMMISSION_CALCULATED',
  COMMISSION_PAID = 'COMMISSION_PAID',
  PAYOUT_READY = 'PAYOUT_READY',

  // Runners y Proveedores
  RUNNER_RATING_UPDATED = 'RUNNER_RATING_UPDATED',
  RUNNER_INCENTIVE_ACHIEVED = 'RUNNER_INCENTIVE_ACHIEVED',
  PROVIDER_PAYOUT_APPROVED = 'PROVIDER_PAYOUT_APPROVED',

  // General
  NEW_MESSAGE = 'NEW_MESSAGE',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string;
  metadata?: any;
  priority?: 'low' | 'medium' | 'high';
}

export class NotificationService {
  /**
   * Crea una nueva notificación para un usuario
   */
  static async create(params: CreateNotificationParams): Promise<any> {
    try {
      const notification = await db.notification.create({
        data: {
          userId: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          link: params.link || null,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          isRead: false,
          priority: params.priority || 'medium',
        },
      });

      logger.info('📬 Notification created', {
        notificationId: notification.id,
        userId: params.userId,
        type: params.type,
      });

      // Enviar notificación en tiempo real vía WebSocket
      try {
        sendNotification(params.userId, params.type, {
          id: notification.id,
          title: params.title,
          message: params.message,
          link: params.link,
          priority: params.priority,
          timestamp: notification.createdAt,
        });
      } catch (wsError) {
        logger.warn('Failed to send WebSocket notification', {
          error: wsError instanceof Error ? wsError.message : String(wsError),
          userId: params.userId,
          notificationId: notification.id,
        });
        // No fallar la creación si falla el envío WebSocket
      }

      return notification;
    } catch (error) {
      logger.error('Error creating notification', {
        error: error instanceof Error ? error.message : String(error),
        params,
      });
      throw error;
    }
  }

  /**
   * Crea notificación cuando un corredor envía una invitación
   */
  static async notifyInvitationReceived(params: {
    userId: string;
    brokerName: string;
    brokerId: string;
    invitationType: string;
    invitationId: string;
    userRole?: string;
  }) {
    const invitationTypeLabels: any = {
      SERVICE_OFFER: 'oferta de servicios',
      PROPERTY_MANAGEMENT: 'gestión de propiedades',
      PROPERTY_VIEWING: 'visualización de propiedades',
      CONSULTATION: 'consultoría',
      PROPERTY_SEARCH: 'búsqueda de propiedades',
    };

    // Determinar el link según el rol del usuario
    const link =
      params.userRole === 'TENANT' ? '/tenant/broker-services' : '/owner/broker-services';

    return this.create({
      userId: params.userId,
      type: NotificationType.INVITATION_RECEIVED,
      title: '📨 Nueva Invitación de Corredor',
      message: `${params.brokerName} te ha enviado una ${invitationTypeLabels[params.invitationType] || 'invitación'}`,
      link: link,
      priority: 'high',
      metadata: {
        brokerId: params.brokerId,
        invitationId: params.invitationId,
        invitationType: params.invitationType,
      },
    });
  }

  /**
   * Crea notificación cuando un usuario acepta una invitación
   */
  static async notifyInvitationAccepted(params: {
    brokerId: string;
    userName: string;
    userId: string;
    invitationId: string;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.INVITATION_ACCEPTED,
      title: '✅ Invitación Aceptada',
      message: `${params.userName} ha aceptado tu invitación`,
      link: `/broker/prospects`,
      priority: 'high',
      metadata: {
        userId: params.userId,
        invitationId: params.invitationId,
      },
    });
  }

  /**
   * Crea notificación cuando un usuario rechaza una invitación
   */
  static async notifyInvitationRejected(params: {
    brokerId: string;
    userName: string;
    userId: string;
    invitationId: string;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.INVITATION_REJECTED,
      title: '❌ Invitación Rechazada',
      message: `${params.userName} ha rechazado tu invitación`,
      link: `/broker/discover`,
      priority: 'medium',
      metadata: {
        userId: params.userId,
        invitationId: params.invitationId,
      },
    });
  }

  static async notifyInvitationCompleted(params: {
    brokerId: string;
    ownerName: string;
    ownerId: string;
    invitationId: string;
    clientId: string;
    propertyCount: number;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.INVITATION_ACCEPTED,
      title: '🎉 ¡Nuevo Cliente Adquirido!',
      message: `${params.ownerName} ha aceptado tu invitación y seleccionado ${params.propertyCount} propiedades para gestionar`,
      link: `/broker/clients/${params.clientId}`,
      priority: 'high',
      metadata: {
        ownerId: params.ownerId,
        invitationId: params.invitationId,
        clientId: params.clientId,
        propertyCount: params.propertyCount,
      },
    });
  }

  /**
   * Crea notificación cuando un corredor responde a una solicitud
   */
  static async notifyServiceRequestResponse(params: {
    userId: string;
    brokerName: string;
    brokerId: string;
    requestId: string;
    requestTitle: string;
  }) {
    return this.create({
      userId: params.userId,
      type: NotificationType.SERVICE_REQUEST_RESPONSE,
      title: '💬 Nueva Propuesta Recibida',
      message: `${params.brokerName} ha respondido a tu solicitud: ${params.requestTitle}`,
      link: `/owner/broker-services`,
      priority: 'high',
      metadata: {
        brokerId: params.brokerId,
        requestId: params.requestId,
      },
    });
  }

  /**
   * Crea notificación cuando un usuario acepta una propuesta
   */
  static async notifyResponseAccepted(params: {
    brokerId: string;
    userName: string;
    userId: string;
    requestId: string;
    requestTitle: string;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.SERVICE_REQUEST_ACCEPTED,
      title: '🎉 Propuesta Aceptada',
      message: `${params.userName} ha aceptado tu propuesta para: ${params.requestTitle}`,
      link: `/broker/discover`,
      priority: 'high',
      metadata: {
        userId: params.userId,
        requestId: params.requestId,
      },
    });
  }

  /**
   * Crea notificación cuando un usuario rechaza una propuesta
   */
  static async notifyResponseRejected(params: {
    brokerId: string;
    userName: string;
    userId: string;
    requestId: string;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.SERVICE_REQUEST_REJECTED,
      title: 'Propuesta Rechazada',
      message: `${params.userName} ha rechazado tu propuesta`,
      link: `/broker/discover`,
      priority: 'low',
      metadata: {
        userId: params.userId,
        requestId: params.requestId,
      },
    });
  }

  /**
   * Crea notificación de nuevas recomendaciones generadas
   */
  static async notifyNewRecommendations(params: {
    brokerId: string;
    count: number;
    ownersCount: number;
    tenantsCount: number;
  }) {
    return this.create({
      userId: params.brokerId,
      type: NotificationType.NEW_RECOMMENDATIONS,
      title: '✨ Nuevas Recomendaciones',
      message: `Se han generado ${params.count} nuevas recomendaciones (${params.ownersCount} propietarios, ${params.tenantsCount} inquilinos)`,
      link: `/broker/discover`,
      priority: 'medium',
      metadata: {
        count: params.count,
        ownersCount: params.ownersCount,
        tenantsCount: params.tenantsCount,
      },
    });
  }

  /**
   * Obtiene notificaciones no leídas de un usuario
   */
  static async getUnread(userId: string) {
    try {
      const notifications = await db.notification.findMany({
        where: {
          userId,
          isRead: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      return notifications;
    } catch (error) {
      logger.error('Error fetching unread notifications', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return [];
    }
  }

  /**
   * Marca una notificación como leída
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      await db.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Seguridad: solo el dueño puede marcarla
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('✓ Notification marked as read', {
        notificationId,
        userId,
      });
    } catch (error) {
      logger.error('Error marking notification as read', {
        error: error instanceof Error ? error.message : String(error),
        notificationId,
        userId,
      });
    }
  }

  /**
   * Marca todas las notificaciones como leídas
   */
  static async markAllAsRead(userId: string) {
    try {
      const result = await db.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('✓ All notifications marked as read', {
        userId,
        count: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Error marking all notifications as read', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return 0;
    }
  }

  /**
   * Elimina una notificación
   */
  static async delete(notificationId: string, userId: string) {
    try {
      await db.notification.deleteMany({
        where: {
          id: notificationId,
          userId, // Seguridad: solo el dueño puede eliminarla
        },
      });

      logger.info('🗑️ Notification deleted', {
        notificationId,
        userId,
      });
    } catch (error) {
      logger.error('Error deleting notification', {
        error: error instanceof Error ? error.message : String(error),
        notificationId,
        userId,
      });
    }
  }

  /**
   * Notifica cálculo de comisión
   */
  static async notifyCommissionCalculated(params: {
    brokerId: string;
    contractId: string;
    amount: number;
    effectiveRate: number;
    propertyType?: string;
    propertyValue?: number;
    baseCommission?: number;
    bonusCommission?: number;
  }): Promise<void> {
    try {
      await this.create({
        userId: params.brokerId,
        type: NotificationType.COMMISSION_CALCULATED,
        title: '💰 Comisión Calculada',
        message: `Se ha calculado una comisión de $${params.amount.toFixed(2)} por tu gestión`,
        link: '/broker/commissions',
        metadata: {
          contractId: params.contractId,
          amount: params.amount,
          effectiveRate: params.effectiveRate,
          propertyType: params.propertyType,
          propertyValue: params.propertyValue,
          baseCommission: params.baseCommission,
          bonusCommission: params.bonusCommission,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending commission calculated notification', {
        error: error instanceof Error ? error.message : String(error),
        brokerId: params.brokerId,
      });
    }
  }

  /**
   * Notifica pago de comisión
   */
  static async notifyCommissionPaid(params: {
    brokerId: string;
    amount: number;
    payoutId?: string;
    processedAt?: Date;
    paymentMethod?: string;
  }): Promise<void> {
    try {
      await this.create({
        userId: params.brokerId,
        type: NotificationType.COMMISSION_PAID,
        title: '💸 Comisión Pagada',
        message: `Se ha procesado el pago de $${params.amount.toFixed(2)} a tu cuenta`,
        link: '/broker/payments',
        metadata: {
          amount: params.amount,
          payoutId: params.payoutId,
          processedAt: params.processedAt,
          paymentMethod: params.paymentMethod,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending commission paid notification', {
        error: error instanceof Error ? error.message : String(error),
        brokerId: params.brokerId,
      });
    }
  }

  /**
   * Notifica payout listo
   */
  static async notifyPayoutReady(params: {
    brokerId: string;
    amount: number;
    payoutId: string;
    readyAt?: Date;
  }): Promise<void> {
    try {
      await this.create({
        userId: params.brokerId,
        type: NotificationType.PAYOUT_READY,
        title: '🎉 Payout Listo para Cobro',
        message: `Tu payout de $${params.amount.toFixed(2)} está listo para ser cobrado`,
        link: '/broker/payments',
        metadata: {
          amount: params.amount,
          payoutId: params.payoutId,
          readyAt: params.readyAt,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error sending payout ready notification', {
        error: error instanceof Error ? error.message : String(error),
        brokerId: params.brokerId,
      });
    }
  }

  /**
   * Notifica alerta del sistema
   */
  static async notifySystemAlert(params: {
    type: string;
    title: string;
    message: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    targetUsers?: string[];
    metadata?: any;
  }): Promise<void> {
    try {
      // Si hay targetUsers específicos, enviar a cada uno
      if (params.targetUsers && params.targetUsers.length > 0) {
        for (const userId of params.targetUsers) {
          await this.create({
            userId,
            type: NotificationType.SYSTEM_ALERT,
            title: `🚨 ${params.title}`,
            message: params.message,
            priority: params.severity === 'critical' ? 'high' : 'medium',
            metadata: params.metadata,
          });
        }
      } else {
        // Si no hay targets específicos, enviar a todos los usuarios activos
        // (esto sería implementado según necesidades específicas)
        logger.warn('System alert without target users - implement broadcast logic if needed', {
          alertType: params.type,
          title: params.title,
        });
      }
    } catch (error) {
      logger.error('Error sending system alert notification', {
        error: error instanceof Error ? error.message : String(error),
        alertType: params.type,
      });
    }
  }

  /**
   * Notifica actualización de rating de runner
   */
  static async notifyRunnerRatingUpdated(params: {
    runnerId: string;
    newRating: number;
    previousRating: number;
    totalRatings?: number;
    feedbackCount?: number;
  }): Promise<void> {
    try {
      await this.create({
        userId: params.runnerId,
        type: NotificationType.RUNNER_RATING_UPDATED,
        title: '⭐ Rating Actualizado',
        message: `Tu rating promedio ha cambiado de ${params.previousRating.toFixed(1)} a ${params.newRating.toFixed(1)} estrellas`,
        link: '/runner/profile',
        metadata: {
          newRating: params.newRating,
          previousRating: params.previousRating,
          totalRatings: params.totalRatings,
          feedbackCount: params.feedbackCount,
        },
        priority: 'medium',
      });
    } catch (error) {
      logger.error('Error sending runner rating updated notification', {
        error: error instanceof Error ? error.message : String(error),
        runnerId: params.runnerId,
      });
    }
  }

  /**
   * Notifica logro de incentivo para runner
   */
  static async notifyRunnerIncentiveAchieved(params: {
    runnerId: string;
    incentiveType: string;
    rewardValue: number;
    rewardType: 'cash' | 'bonus' | 'discount';
    achievedAt: Date;
    description?: string;
  }): Promise<void> {
    try {
      const rewardTypeLabels = {
        cash: 'dinero',
        bonus: 'bono',
        discount: 'descuento',
      };

      await this.create({
        userId: params.runnerId,
        type: NotificationType.RUNNER_INCENTIVE_ACHIEVED,
        title: '🎉 ¡Incentivo Logrado!',
        message: `Has logrado un incentivo: ${params.rewardValue} ${rewardTypeLabels[params.rewardType]} por ${params.incentiveType}`,
        link: '/runner/incentives',
        metadata: {
          incentiveType: params.incentiveType,
          rewardValue: params.rewardValue,
          rewardType: params.rewardType,
          achievedAt: params.achievedAt,
          description: params.description,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending runner incentive achieved notification', {
        error: error instanceof Error ? error.message : String(error),
        runnerId: params.runnerId,
      });
    }
  }

  /**
   * Notifica pago aprobado para proveedor
   */
  static async notifyProviderPayoutApproved(params: {
    providerId: string;
    amount: number;
    serviceType: string;
    payoutId?: string;
    processedAt?: Date;
    paymentMethod?: string;
  }): Promise<void> {
    try {
      await this.create({
        userId: params.providerId,
        type: NotificationType.PROVIDER_PAYOUT_APPROVED,
        title: '💰 Pago Aprobado',
        message: `Se ha aprobado un pago de $${params.amount.toFixed(2)} por servicios de ${params.serviceType}`,
        link: '/provider/payments',
        metadata: {
          amount: params.amount,
          serviceType: params.serviceType,
          payoutId: params.payoutId,
          processedAt: params.processedAt,
          paymentMethod: params.paymentMethod,
        },
        priority: 'high',
      });
    } catch (error) {
      logger.error('Error sending provider payout approved notification', {
        error: error instanceof Error ? error.message : String(error),
        providerId: params.providerId,
      });
    }
  }
}
