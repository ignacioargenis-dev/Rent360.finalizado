import { db } from './db';
import { logger } from './logger';
import { NotificationService, CommissionNotification, SystemNotification } from './notification-service';

export interface QueuedNotification {
  id: string;
  type: 'commission' | 'system' | 'scheduled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: CommissionNotification | SystemNotification | ScheduledNotification;
  scheduledFor: Date;
  createdAt: Date;
  processedAt?: Date | undefined;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  errorMessage?: string | undefined;
}

export interface ScheduledNotification {
  type: 'payout_reminder' | 'commission_summary' | 'system_maintenance' | 'broker_performance';
  recipientIds: string[];
  templateData: Record<string, any>;
  recurring?: {
    interval: 'daily' | 'weekly' | 'monthly';
    nextExecution: Date;
  } | undefined;
}

/**
 * Sistema de colas para notificaciones automáticas
 */
export class NotificationQueue {
  private static queue: QueuedNotification[] = [];
  private static isProcessing = false;
  private static maxConcurrent = 5;
  private static processingInterval: NodeJS.Timeout | null = null;

  /**
   * Agrega una notificación a la cola
   */
  static async addToQueue(notification: Omit<QueuedNotification, 'id' | 'createdAt' | 'retryCount' | 'status'>): Promise<string> {
    const queuedNotification: QueuedNotification = {
      ...notification,
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      retryCount: 0,
      status: 'pending'
    };

    this.queue.push(queuedNotification);

    // Ordenar cola por prioridad y fecha programada
    this.sortQueue();

    logger.info('Notification added to queue', {
      id: queuedNotification.id,
      type: queuedNotification.type,
      priority: queuedNotification.priority,
      scheduledFor: queuedNotification.scheduledFor
    });

    return queuedNotification.id;
  }

  /**
   * Procesa las notificaciones pendientes
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const now = new Date();
      const pendingNotifications = this.queue
        .filter(n => n.status === 'pending' && n.scheduledFor <= now)
        .slice(0, this.maxConcurrent);

      if (pendingNotifications.length === 0) {
        return;
      }

      logger.info('Processing notification queue', { count: pendingNotifications.length });

      const promises = pendingNotifications.map(notification =>
        this.processNotification(notification)
      );

      await Promise.allSettled(promises);

    } catch (error) {
      logger.error('Error processing notification queue', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Procesa una notificación individual
   */
  private static async processNotification(notification: QueuedNotification): Promise<void> {
    try {
      notification.status = 'processing';
      notification.retryCount++;

      logger.debug('Processing notification', {
        id: notification.id,
        type: notification.type,
        retryCount: notification.retryCount
      });

      // Procesar según el tipo de notificación
      switch (notification.type) {
        case 'commission':
          await this.processCommissionNotification(notification.data as CommissionNotification);
          break;
        case 'system':
          await this.processSystemNotification(notification.data as SystemNotification);
          break;
        case 'scheduled':
          await this.processScheduledNotification(notification.data as ScheduledNotification);
          break;
      }

      // Marcar como completada
      notification.status = 'completed';
      notification.processedAt = new Date();

      logger.info('Notification processed successfully', {
        id: notification.id,
        type: notification.type
      });

    } catch (error) {
      logger.error('Error processing notification', {
        id: notification.id,
        type: notification.type,
        error: error instanceof Error ? error.message : String(error)
      });

      notification.errorMessage = error instanceof Error ? error.message : String(error);

      // Reintentar si no se ha alcanzado el máximo de reintentos
      if (notification.retryCount < notification.maxRetries) {
        notification.status = 'pending';
        // Programar reintento con backoff exponencial
        notification.scheduledFor = new Date(Date.now() + Math.pow(2, notification.retryCount) * 60000);
        logger.info('Notification scheduled for retry', {
          id: notification.id,
          retryCount: notification.retryCount,
          nextAttempt: notification.scheduledFor
        });
      } else {
        notification.status = 'failed';
        logger.warn('Notification failed permanently', {
          id: notification.id,
          maxRetries: notification.maxRetries
        });
      }
    }
  }

  /**
   * Procesa notificación de comisión
   */
  private static async processCommissionNotification(data: CommissionNotification): Promise<void> {
    switch (data.type) {
      case 'commission_calculated':
        await NotificationService.notifyCommissionCalculated(data);
        break;
      case 'commission_paid':
        await NotificationService.notifyCommissionPaid(data);
        break;
      case 'payout_ready':
        await NotificationService.notifyPayoutReady(data);
        break;
      default:
        throw new Error(`Unknown commission notification type: ${data.type}`);
    }
  }

  /**
   * Procesa notificación del sistema
   */
  private static async processSystemNotification(data: SystemNotification): Promise<void> {
    await NotificationService.notifySystemAlert(data);
  }

  /**
   * Procesa notificación programada
   */
  private static async processScheduledNotification(data: ScheduledNotification): Promise<void> {
    // Aquí iría la lógica específica para cada tipo de notificación programada
    logger.info('Processing scheduled notification', {
      type: data.type,
      recipientCount: data.recipientIds.length
    });

    // Implementar lógica específica según el tipo
    switch (data.type) {
      case 'payout_reminder':
        await this.processPayoutReminder(data);
        break;
      case 'commission_summary':
        await this.processCommissionSummary(data);
        break;
      case 'system_maintenance':
        await this.processSystemMaintenance(data);
        break;
      case 'broker_performance':
        await this.processBrokerPerformance(data);
        break;
    }
  }

  /**
   * Procesa recordatorio de payout
   */
  private static async processPayoutReminder(data: ScheduledNotification): Promise<void> {
    // Lógica para enviar recordatorios de payouts pendientes
    logger.info('Sending payout reminders', {
      recipientCount: data.recipientIds.length
    });
  }

  /**
   * Procesa resumen de comisiones
   */
  private static async processCommissionSummary(data: ScheduledNotification): Promise<void> {
    // Lógica para enviar resúmenes mensuales de comisiones
    logger.info('Sending commission summaries', {
      recipientCount: data.recipientIds.length
    });
  }

  /**
   * Procesa notificación de mantenimiento del sistema
   */
  private static async processSystemMaintenance(data: ScheduledNotification): Promise<void> {
    const notification: SystemNotification = {
      type: 'system_maintenance',
      title: 'Mantenimiento Programado del Sistema',
      message: data.templateData.message || 'El sistema estará en mantenimiento próximamente.',
      severity: 'medium',
      targetUsers: data.recipientIds
    };

    await NotificationService.notifySystemAlert(notification);
  }

  /**
   * Procesa reporte de rendimiento de corredores
   */
  private static async processBrokerPerformance(data: ScheduledNotification): Promise<void> {
    // Lógica para enviar reportes de rendimiento a corredores
    logger.info('Sending broker performance reports', {
      recipientCount: data.recipientIds.length
    });
  }

  /**
   * Ordena la cola por prioridad y fecha programada
   */
  private static sortQueue(): void {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };

    this.queue.sort((a, b) => {
      // Primero por prioridad
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por fecha programada
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
  }

  /**
   * Inicia el procesamiento automático de la cola
   */
  static startProcessing(intervalMs: number = 30000): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, intervalMs);

    logger.info('Notification queue processing started', { intervalMs });
  }

  /**
   * Detiene el procesamiento automático
   */
  static stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info('Notification queue processing stopped');
  }

  /**
   * Obtiene estadísticas de la cola
   */
  static getQueueStats() {
    const stats = {
      total: this.queue.length,
      pending: this.queue.filter(n => n.status === 'pending').length,
      processing: this.queue.filter(n => n.status === 'processing').length,
      completed: this.queue.filter(n => n.status === 'completed').length,
      failed: this.queue.filter(n => n.status === 'failed').length,
      byPriority: {
        urgent: this.queue.filter(n => n.priority === 'urgent').length,
        high: this.queue.filter(n => n.priority === 'high').length,
        medium: this.queue.filter(n => n.priority === 'medium').length,
        low: this.queue.filter(n => n.priority === 'low').length,
      },
      byType: {
        commission: this.queue.filter(n => n.type === 'commission').length,
        system: this.queue.filter(n => n.type === 'system').length,
        scheduled: this.queue.filter(n => n.type === 'scheduled').length,
      }
    };

    return stats;
  }

  /**
   * Programa notificaciones recurrentes
   */
  static async scheduleRecurringNotifications(): Promise<void> {
    try {
      // Programar recordatorios semanales de payouts
      await this.addToQueue({
        type: 'scheduled',
        priority: 'medium',
        data: {
          type: 'payout_reminder',
          recipientIds: [], // Se llenará dinámicamente
          templateData: {}
        },
        scheduledFor: this.getNextWeeklyExecution(),
        maxRetries: 3
      });

      // Programar resúmenes mensuales de comisiones
      await this.addToQueue({
        type: 'scheduled',
        priority: 'low',
        data: {
          type: 'commission_summary',
          recipientIds: [],
          templateData: {}
        },
        scheduledFor: this.getNextMonthlyExecution(),
        maxRetries: 3
      });

      logger.info('Recurring notifications scheduled');

    } catch (error) {
      logger.error('Error scheduling recurring notifications', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Calcula la próxima ejecución semanal (todos los viernes)
   */
  private static getNextWeeklyExecution(): Date {
    const now = new Date();
    const daysUntilFriday = (5 - now.getDay() + 7) % 7;
    const nextFriday = new Date(now);
    nextFriday.setDate(now.getDate() + (daysUntilFriday || 7));
    nextFriday.setHours(9, 0, 0, 0); // 9:00 AM

    return nextFriday;
  }

  /**
   * Calcula la próxima ejecución mensual (primer día del mes)
   */
  private static getNextMonthlyExecution(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    nextMonth.setHours(9, 0, 0, 0); // 9:00 AM

    return nextMonth;
  }

  /**
   * Limpia notificaciones completadas antiguas
   */
  static cleanupOldNotifications(maxAgeHours: number = 24): void {
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(notification => {
      if (notification.status === 'completed' && notification.processedAt) {
        return notification.processedAt.getTime() > cutoffTime;
      }
      return true; // Mantener notificaciones no completadas
    });

    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      logger.info('Cleaned up old notifications', { removedCount });
    }
  }
}

// Iniciar procesamiento automático al cargar el módulo
NotificationQueue.startProcessing();

// Limpiar notificaciones antiguas cada hora
setInterval(() => {
  NotificationQueue.cleanupOldNotifications();
}, 60 * 60 * 1000);

// Programar notificaciones recurrentes al inicio
setTimeout(() => {
  NotificationQueue.scheduleRecurringNotifications();
}, 5000); // Esperar 5 segundos después del inicio
