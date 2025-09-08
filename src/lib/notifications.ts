// Sistema de Notificaciones Avanzado - Rent360
// import { logger } from './logger';
import React from 'react';

export enum NotificationType {
  PAYMENT_DUE = 'payment_due',
  PAYMENT_RECEIVED = 'payment_received',
  MAINTENANCE_REQUEST = 'maintenance_request',
  MAINTENANCE_COMPLETED = 'maintenance_completed',
  CONTRACT_EXPIRING = 'contract_expiring',
  CONTRACT_RENEWED = 'contract_renewed',
  PROPERTY_VIEWED = 'property_viewed',
  NEW_MESSAGE = 'new_message',
  SYSTEM_ALERT = 'system_alert',
  MARKET_UPDATE = 'market_update',
  RECOMMENDATION = 'recommendation',
  REMINDER = 'reminder'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
  IN_APP = 'in_app'
}

export interface SmartNotification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  optimalChannel: NotificationChannel;
  optimalTime: Date;
  personalization: Record<string, any>;
  aiOptimized: boolean;
  metadata?: {
    propertyId?: string;
    contractId?: string;
    paymentId?: string;
    maintenanceId?: string;
    amount?: number;
    dueDate?: Date;
    location?: string;
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export interface UserNotificationPreferences {
  userId: string;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
    in_app: boolean;
  };
  types: {
    [key in NotificationType]: {
      enabled: boolean;
      priority: NotificationPriority;
      channels: NotificationChannel[];
    };
  };
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  language: 'es' | 'en' | 'pt';
  personalization: {
    name: string;
    preferredContact: NotificationChannel;
    timezone: string;
    location?: string;
  };
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variables: string[];
  channels: NotificationChannel[];
  priority: NotificationPriority;
  aiOptimized: boolean;
}

export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  openRate: number;
  clickRate: number;
  channelPerformance: Record<NotificationChannel, {
    sent: number;
    delivered: number;
    read: number;
    openRate: number;
  }>;
  typePerformance: Record<NotificationType, {
    sent: number;
    read: number;
    openRate: number;
  }>;
  timePerformance: {
    hourly: Record<number, number>;
    daily: Record<string, number>;
    weekly: Record<string, number>;
  };
}

class AdvancedNotificationService {
  private templates: Map<string, NotificationTemplate> = new Map();
  private userPreferences: Map<string, UserNotificationPreferences> = new Map();
  private notifications: Map<string, SmartNotification> = new Map();
  private analytics: NotificationAnalytics = {
    sent: 0,
    delivered: 0,
    read: 0,
    failed: 0,
    openRate: 0,
    clickRate: 0,
    channelPerformance: {} as any,
    typePerformance: {} as any,
    timePerformance: {
      hourly: {},
      daily: {},
      weekly: {},
    },
  };

  constructor() {
    this.initializeTemplates();
    this.initializeAnalytics();
  }

  private initializeTemplates() {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'payment_due',
        type: NotificationType.PAYMENT_DUE,
        title: 'Pago de renta próximo a vencer',
        message: 'Hola {{name}}, tu pago de renta de {{amount}} vence el {{dueDate}}. ¡No olvides realizar el pago a tiempo!',
        variables: ['name', 'amount', 'dueDate'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        aiOptimized: true,
      },
      {
        id: 'payment_received',
        type: NotificationType.PAYMENT_RECEIVED,
        title: 'Pago recibido exitosamente',
        message: '¡Gracias {{name}}! Hemos recibido tu pago de {{amount}}. Tu recibo está disponible en tu cuenta.',
        variables: ['name', 'amount'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        aiOptimized: true,
      },
      {
        id: 'maintenance_request',
        type: NotificationType.MAINTENANCE_REQUEST,
        title: 'Nueva solicitud de mantenimiento',
        message: 'Hemos recibido tu solicitud de mantenimiento para {{property}}. Te mantendremos informado del progreso.',
        variables: ['property'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        aiOptimized: true,
      },
      {
        id: 'maintenance_completed',
        type: NotificationType.MAINTENANCE_COMPLETED,
        title: 'Mantenimiento completado',
        message: '¡Excelente noticia {{name}}! El mantenimiento en {{property}} ha sido completado. Puedes verificar el trabajo realizado.',
        variables: ['name', 'property'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        aiOptimized: true,
      },
      {
        id: 'contract_expiring',
        type: NotificationType.CONTRACT_EXPIRING,
        title: 'Contrato próximo a vencer',
        message: 'Tu contrato en {{property}} vence el {{dueDate}}. ¿Te gustaría renovar o necesitas ayuda?',
        variables: ['property', 'dueDate'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.HIGH,
        aiOptimized: true,
      },
      {
        id: 'property_viewed',
        type: NotificationType.PROPERTY_VIEWED,
        title: 'Tu propiedad fue vista',
        message: '¡{{name}}! Tu propiedad en {{location}} recibió {{views}} visitas esta semana. ¡Excelente interés!',
        variables: ['name', 'location', 'views'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.LOW,
        aiOptimized: true,
      },
      {
        id: 'market_update',
        type: NotificationType.MARKET_UPDATE,
        title: 'Actualización del mercado',
        message: 'El mercado en {{area}} muestra {{trend}}. Te recomendamos {{recommendation}}.',
        variables: ['area', 'trend', 'recommendation'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.LOW,
        aiOptimized: true,
      },
      {
        id: 'recommendation',
        type: NotificationType.RECOMMENDATION,
        title: 'Recomendación personalizada',
        message: '{{name}}, hemos encontrado {{count}} propiedades que coinciden con tus preferencias en {{area}}.',
        variables: ['name', 'count', 'area'],
        channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP],
        priority: NotificationPriority.MEDIUM,
        aiOptimized: true,
      },
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  private initializeAnalytics() {
    // Inicializar métricas por canal
    const channels: NotificationChannel[] = [
      NotificationChannel.EMAIL, 
      NotificationChannel.SMS, 
      NotificationChannel.PUSH, 
      NotificationChannel.WHATSAPP, 
      NotificationChannel.IN_APP
    ];
    channels.forEach(channel => {
      this.analytics.channelPerformance[channel] = {
        sent: 0,
        delivered: 0,
        read: 0,
        openRate: 0,
      };
    });

    // Inicializar métricas por tipo
    const types: NotificationType[] = [
      NotificationType.PAYMENT_DUE, 
      NotificationType.PAYMENT_RECEIVED, 
      NotificationType.MAINTENANCE_REQUEST, 
      NotificationType.MAINTENANCE_COMPLETED,
      NotificationType.CONTRACT_EXPIRING, 
      NotificationType.CONTRACT_RENEWED, 
      NotificationType.PROPERTY_VIEWED, 
      NotificationType.NEW_MESSAGE,
      NotificationType.SYSTEM_ALERT, 
      NotificationType.MARKET_UPDATE, 
      NotificationType.RECOMMENDATION, 
      NotificationType.REMINDER
    ];
    types.forEach(type => {
      this.analytics.typePerformance[type] = {
        sent: 0,
        read: 0,
        openRate: 0,
      };
    });
  }

  /**
   * Crear notificación inteligente
   */
  async createSmartNotification(
    userId: string,
    type: NotificationType,
    metadata: Record<string, any> = {},
    options: {
      priority?: NotificationPriority;
      channels?: NotificationChannel[];
      scheduledFor?: Date;
      personalization?: Record<string, any>;
    } = {}
  ): Promise<SmartNotification> {
    try {
      const userPrefs = await this.getUserPreferences(userId);
      const template = this.templates.get(type);
      
      if (!template) {
        throw new Error(`Template no encontrado para tipo: ${type}`);
      }

      // Determinar canal óptimo
      const optimalChannel = this.determineOptimalChannel(type, userPrefs, options.channels);
      
      // Determinar tiempo óptimo
      const optimalTime = this.determineOptimalTime(userPrefs, options.scheduledFor);
      
      // Personalizar contenido
      const personalization = {
        ...userPrefs.personalization,
        ...options.personalization,
        ...metadata,
      };

      const { title, message } = this.personalizeContent(template, personalization);

      const notification: SmartNotification = {
        id: this.generateId(),
        userId,
        type,
        priority: options.priority || template.priority,
        title,
        message,
        optimalChannel,
        optimalTime,
        personalization,
        aiOptimized: template.aiOptimized,
        metadata,
        status: 'pending',
        createdAt: new Date(),
        scheduledFor: options.scheduledFor,
        retryCount: 0,
        maxRetries: 3,
      };

      // Guardar notificación
      await this.saveNotification(notification);
      
      // Programar envío
      await this.scheduleNotification(notification);

      logger.info('Notificación inteligente creada', {
        userId,
        type,
        optimalChannel,
        optimalTime,
        priority: notification.priority,
      });

      return notification;
    } catch (error) {
      logger.error('Error creando notificación inteligente', {
        userId,
        type,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Determinar canal óptimo para la notificación
   */
  private determineOptimalChannel(
    type: NotificationType,
    userPrefs: UserNotificationPreferences,
    preferredChannels?: NotificationChannel[]
  ): NotificationChannel {
    // Verificar preferencias del usuario
    const enabledChannels = Object.entries(userPrefs.channels)
      .filter(([_, enabled]) => enabled)
      .map(([channel, _]) => channel as NotificationChannel);

    if (enabledChannels.length === 0) {
      return NotificationChannel.IN_APP; // Fallback
    }

    // Filtrar por canales preferidos si se especifican
    const availableChannels = preferredChannels 
      ? enabledChannels.filter(channel => preferredChannels.includes(channel))
      : enabledChannels;

    if (availableChannels.length === 0) {
      return enabledChannels[0];
    }

    // Algoritmo de selección basado en tipo y prioridad
    const channelScores = new Map<NotificationChannel, number>();

    availableChannels.forEach(channel => {
      let score = 0;

      // Score basado en rendimiento histórico
      const performance = this.analytics.channelPerformance[channel];
      if (performance) {
        score += performance.openRate * 100;
      }

      // Score basado en tipo de notificación
      switch (type) {
        case NotificationType.PAYMENT_DUE:
        case NotificationType.CONTRACT_EXPIRING:
          if (channel === NotificationChannel.SMS || channel === NotificationChannel.WHATSAPP) score += 20;
          if (channel === NotificationChannel.PUSH) score += 15;
          break;
        case NotificationType.PAYMENT_RECEIVED:
        case NotificationType.MAINTENANCE_COMPLETED:
          if (channel === NotificationChannel.EMAIL) score += 25;
          if (channel === NotificationChannel.PUSH) score += 20;
          break;
        case NotificationType.PROPERTY_VIEWED:
        case NotificationType.MARKET_UPDATE:
          if (channel === NotificationChannel.EMAIL) score += 30;
          if (channel === NotificationChannel.PUSH) score += 15;
          break;
        case NotificationType.RECOMMENDATION:
          if (channel === NotificationChannel.EMAIL) score += 25;
          if (channel === NotificationChannel.IN_APP) score += 20;
          break;
      }

      // Score basado en preferencia del usuario
      if (channel === userPrefs.personalization.preferredContact) {
        score += 10;
      }

      channelScores.set(channel, score);
    });

    // Retornar canal con mayor score
    let bestChannel = availableChannels[0];
    let bestScore = channelScores.get(bestChannel) || 0;

    channelScores.forEach((score, channel) => {
      if (score > bestScore) {
        bestScore = score;
        bestChannel = channel;
      }
    });

    return bestChannel;
  }

  /**
   * Determinar tiempo óptimo para el envío
   */
  private determineOptimalTime(
    userPrefs: UserNotificationPreferences,
    scheduledFor?: Date
  ): Date {
    if (scheduledFor) {
      return scheduledFor;
    }

    const now = new Date();
    
    // Verificar horas silenciosas
    if (userPrefs.quietHours.enabled) {
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        timeZone: userPrefs.quietHours.timezone 
      });
      
      const startTime = userPrefs.quietHours.start;
      const endTime = userPrefs.quietHours.end;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        // Programar para después de las horas silenciosas
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(parseInt(endTime.split(':')[0]), parseInt(endTime.split(':')[1]), 0, 0);
        return tomorrow;
      }
    }

    // Análisis de mejores horarios basado en engagement histórico
    const hour = now.getHours();
    const bestHours = [9, 12, 18, 20]; // Horas con mayor engagement
    
    if (!bestHours.includes(hour)) {
      // Encontrar la próxima mejor hora
      const nextBestHour = bestHours.find(h => h > hour) || bestHours[0];
      const optimalTime = new Date(now);
      
      if (nextBestHour > hour) {
        optimalTime.setHours(nextBestHour, 0, 0, 0);
      } else {
        optimalTime.setDate(optimalTime.getDate() + 1);
        optimalTime.setHours(nextBestHour, 0, 0, 0);
      }
      
      return optimalTime;
    }

    return now;
  }

  /**
   * Personalizar contenido de la notificación
   */
  private personalizeContent(
    template: NotificationTemplate,
    personalization: Record<string, any>
  ): { title: string; message: string } {
    let title = template.title;
    let message = template.message;

    // Reemplazar variables en el título
    template.variables.forEach(variable => {
      const value = personalization[variable];
      if (value !== undefined) {
        const regex = new RegExp(`{{${variable}}}`, 'g');
        title = title.replace(regex, this.formatVariable(variable, value));
        message = message.replace(regex, this.formatVariable(variable, value));
      }
    });

    // Optimización con IA (simulada)
    if (template.aiOptimized) {
      title = this.aiOptimizeTitle(title, personalization);
      message = this.aiOptimizeMessage(message, personalization);
    }

    return { title, message };
  }

  /**
   * Formatear variables según su tipo
   */
  private formatVariable(variable: string, value: any): string {
    switch (variable) {
      case 'amount':
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
        }).format(value);
      
      case 'dueDate':
        return new Intl.DateTimeFormat('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date(value));
      
      case 'views':
        return `${value} ${value === 1 ? 'visita' : 'visitas'}`;
      
      case 'count':
        return `${value} ${value === 1 ? 'propiedad' : 'propiedades'}`;
      
      default:
        return String(value);
    }
  }

  /**
   * Optimización de título con IA (simulada)
   */
  private aiOptimizeTitle(title: string, personalization: Record<string, any>): string {
    // Simular optimización basada en personalización
    if (personalization.name) {
      // Personalizar con el nombre del usuario
      title = title.replace(/^/, `${personalization.name}, `);
    }
    
    // Añadir emojis según el tipo de notificación
    if (title.includes('pago')) {
      title = '💰 ' + title;
    } else if (title.includes('mantenimiento')) {
      title = '🔧 ' + title;
    } else if (title.includes('contrato')) {
      title = '📄 ' + title;
    } else if (title.includes('propiedad')) {
      title = '🏠 ' + title;
    }
    
    return title;
  }

  /**
   * Optimización de mensaje con IA (simulada)
   */
  private aiOptimizeMessage(message: string, personalization: Record<string, any>): string {
    // Simular optimización basada en comportamiento del usuario
    const userEngagement = personalization.engagement || 'medium';
    
    if (userEngagement === 'high') {
      // Usuarios con alto engagement reciben mensajes más detallados
      message += ' ¡Gracias por tu confianza!';
    } else if (userEngagement === 'low') {
      // Usuarios con bajo engagement reciben mensajes más concisos
      message = message.split('.')[0] + '.';
    }
    
    return message;
  }

  /**
   * Enviar notificación
   */
  async sendNotification(notification: SmartNotification): Promise<boolean> {
    try {
      logger.info('Enviando notificación', {
        id: notification.id,
        userId: notification.userId,
        channel: notification.optimalChannel,
        type: notification.type,
      });

      // Simular envío según el canal
      const success = await this.sendToChannel(notification);
      
      if (success) {
        notification.status = 'sent';
        notification.sentAt = new Date();
        await this.updateNotification(notification);
        await this.updateAnalytics(notification, 'sent');
        
        logger.info('Notificación enviada exitosamente', {
          id: notification.id,
          channel: notification.optimalChannel,
        });
        
        return true;
      } else {
        throw new Error('Error en el envío');
      }
    } catch (error) {
      logger.error('Error enviando notificación', {
        id: notification.id,
        error: error instanceof Error ? error.message : String(error),
      });
      
      notification.status = 'failed';
      notification.retryCount++;
      await this.updateNotification(notification);
      await this.updateAnalytics(notification, 'failed');
      
      // Reintentar si no se ha excedido el límite
      if (notification.retryCount < notification.maxRetries) {
        await this.retryNotification(notification);
      }
      
      return false;
    }
  }

  /**
   * Enviar a canal específico
   */
  private async sendToChannel(notification: SmartNotification): Promise<boolean> {
    // Simular envío a diferentes canales
    switch (notification.optimalChannel) {
      case 'email':
        return await this.sendEmail(notification);
      case 'sms':
        return await this.sendSMS(notification);
      case 'push':
        return await this.sendPushNotification(notification);
      case 'whatsapp':
        return await this.sendWhatsApp(notification);
      case 'in_app':
        return await this.sendInAppNotification(notification);
      default:
        return false;
    }
  }

  private async sendEmail(notification: SmartNotification): Promise<boolean> {
    // Simular envío de email
    await new Promise(resolve => setTimeout(resolve, 100));
    return Math.random() > 0.1; // 90% éxito
  }

  private async sendSMS(notification: SmartNotification): Promise<boolean> {
    // Simular envío de SMS
    await new Promise(resolve => setTimeout(resolve, 50));
    return Math.random() > 0.05; // 95% éxito
  }

  private async sendPushNotification(notification: SmartNotification): Promise<boolean> {
    // Simular envío de push notification
    await new Promise(resolve => setTimeout(resolve, 30));
    return Math.random() > 0.02; // 98% éxito
  }

  private async sendWhatsApp(notification: SmartNotification): Promise<boolean> {
    // Simular envío de WhatsApp
    await new Promise(resolve => setTimeout(resolve, 80));
    return Math.random() > 0.08; // 92% éxito
  }

  private async sendInAppNotification(notification: SmartNotification): Promise<boolean> {
    // Simular envío de notificación in-app
    await new Promise(resolve => setTimeout(resolve, 10));
    return true; // 100% éxito
  }

  /**
   * Programar notificación
   */
  private async scheduleNotification(notification: SmartNotification): Promise<void> {
    const delay = notification.optimalTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Enviar inmediatamente
      await this.sendNotification(notification);
    } else {
      // Programar para más tarde
      setTimeout(async () => {
        await this.sendNotification(notification);
      }, delay);
    }
  }

  /**
   * Reintentar notificación
   */
  private async retryNotification(notification: SmartNotification): Promise<void> {
    const retryDelay = Math.pow(2, notification.retryCount) * 1000; // Backoff exponencial
    
    setTimeout(async () => {
      await this.sendNotification(notification);
    }, retryDelay);
  }

  /**
   * Obtener preferencias del usuario
   */
  async getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
    // En producción, esto vendría de la base de datos
    const defaultPrefs: UserNotificationPreferences = {
      userId,
      channels: {
        email: true,
        sms: true,
        push: true,
        whatsapp: false,
        in_app: true,
      },
      types: {
        payment_due: { enabled: true, priority: NotificationPriority.HIGH, channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
        payment_received: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
        maintenance_request: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
        maintenance_completed: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
        contract_expiring: { enabled: true, priority: NotificationPriority.HIGH, channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH] },
        contract_renewed: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
        property_viewed: { enabled: true, priority: NotificationPriority.LOW, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
        new_message: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP] },
        system_alert: { enabled: true, priority: NotificationPriority.HIGH, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP] },
        market_update: { enabled: true, priority: NotificationPriority.LOW, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
        recommendation: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.IN_APP] },
        reminder: { enabled: true, priority: NotificationPriority.MEDIUM, channels: [NotificationChannel.EMAIL, NotificationChannel.PUSH] },
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'America/Santiago',
      },
      frequency: 'immediate',
      language: 'es',
      personalization: {
        name: 'Usuario',
        preferredContact: NotificationChannel.EMAIL,
        timezone: 'America/Santiago',
      },
    };

    return this.userPreferences.get(userId) || defaultPrefs;
  }

  /**
   * Actualizar preferencias del usuario
   */
  async updateUserPreferences(
    userId: string, 
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const currentPrefs = await this.getUserPreferences(userId);
    const updatedPrefs = { ...currentPrefs, ...preferences };
    this.userPreferences.set(userId, updatedPrefs);
    
         logger.info('Preferencias de notificación actualizadas', { userId, preferences });
  }

  /**
   * Obtener analytics
   */
  getAnalytics(): NotificationAnalytics {
    return { ...this.analytics };
  }

  /**
   * Actualizar analytics
   */
  private async updateAnalytics(
    notification: SmartNotification, 
    event: 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    this.analytics[event]++;
    
    // Actualizar métricas por canal
    const channelPerf = this.analytics.channelPerformance[notification.optimalChannel];
    if (channelPerf) {
      channelPerf[event]++;
      channelPerf.openRate = channelPerf.read / channelPerf.sent;
    }
    
    // Actualizar métricas por tipo
    const typePerf = this.analytics.typePerformance[notification.type];
    if (typePerf) {
      typePerf[event]++;
      typePerf.openRate = typePerf.read / typePerf.sent;
    }
    
    // Actualizar métricas de tiempo
    const hour = notification.sentAt?.getHours() || new Date().getHours();
    this.analytics.timePerformance.hourly[hour] = 
      (this.analytics.timePerformance.hourly[hour] || 0) + 1;
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      isRead?: boolean;
      type?: NotificationType;
    }
  ): Promise<SmartNotification[]> {
    // En producción, esto se consultaría desde la base de datos
    let userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Filtrar por estado de lectura
    if (options?.isRead !== undefined) {
      userNotifications = userNotifications.filter(n => 
        options.isRead ? n.status === 'read' : n.status !== 'read'
      );
    }
    
    // Filtrar por tipo
    if (options?.type) {
      userNotifications = userNotifications.filter(n => n.type === options.type);
    }
    
    // Aplicar paginación
    if (options?.offset) {
      userNotifications = userNotifications.slice(options.offset);
    }
    
    if (options?.limit) {
      userNotifications = userNotifications.slice(0, options.limit);
    }
    
    return userNotifications;
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.status = 'read';
      notification.readAt = new Date();
      await this.updateNotification(notification);
      this.updateAnalytics(notification, 'read');
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const userNotifications = await this.getUserNotifications(userId);
    return userNotifications.filter(n => n.status !== 'read').length;
  }

  /**
   * Crear notificación desde template
   */
  async createFromTemplate(
    templateId: string,
    userId: string,
    variables: Record<string, any> = {}
  ): Promise<SmartNotification> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template no encontrado: ${templateId}`);
    }

    return this.createSmartNotification(
      userId,
      template.type,
      variables,
      {
        priority: template.priority,
        channels: template.channels,
      }
    );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = await this.getUserNotifications(userId);
    const unreadNotifications = userNotifications.filter(n => n.status !== 'read');
    
    for (const notification of unreadNotifications) {
      await this.markAsRead(notification.id);
    }
  }

  /**
   * Métodos auxiliares
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveNotification(notification: SmartNotification): Promise<void> {
         // En producción, esto se guardaría en la base de datos
     logger.info('Notificación guardada', { id: notification.id });
  }

  private async updateNotification(notification: SmartNotification): Promise<void> {
         // En producción, esto se actualizaría en la base de datos
     logger.info('Notificación actualizada', { 
       id: notification.id, 
       status: notification.status 
     });
  }
}

// Instancia singleton
export const notificationService = new AdvancedNotificationService();

// Hook personalizado para React
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<SmartNotification[]>([]);
  const [preferences, setPreferences] = React.useState<UserNotificationPreferences | null>(null);
  const [loading, setLoading] = React.useState(false);

  const sendNotification = async (
    userId: string,
    type: NotificationType,
    metadata: Record<string, any> = {},
    options: any = {}
  ) => {
    setLoading(true);
    try {
      const notification = await notificationService.createSmartNotification(
        userId,
        type,
        metadata,
        options
      );
      setNotifications(prev => [notification, ...prev]);
      return notification;
    } catch (error) {
      logger.error('Error enviando notificación:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (
    userId: string,
    newPreferences: Partial<UserNotificationPreferences>
  ) => {
    await notificationService.updateUserPreferences(userId, newPreferences);
    if (preferences) {
      setPreferences({ ...preferences, ...newPreferences });
    }
  };

  const getAnalytics = () => {
    return notificationService.getAnalytics();
  };

  return {
    notifications,
    preferences,
    loading,
    sendNotification,
    updatePreferences,
    getAnalytics,
  };
};
