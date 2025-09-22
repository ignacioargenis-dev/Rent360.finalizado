import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { logger } from '@/lib/logger';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface NotificationSettings {
  userId: string;
  enabled: boolean;
  token?: string;
  topics: string[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  categories: {
    payments: boolean;
    messages: boolean;
    jobs: boolean;
    ratings: boolean;
    promotions: boolean;
  };
}

class FirebaseNotificationService {
  private static instance: FirebaseNotificationService;
  private app: any;
  private messaging: Messaging | null = null;
  private vapidKey: string;

  private constructor() {
    this.vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
  }

  static getInstance(): FirebaseNotificationService {
    if (!FirebaseNotificationService.instance) {
      FirebaseNotificationService.instance = new FirebaseNotificationService();
    }
    return FirebaseNotificationService.instance;
  }

  async initialize(firebaseConfig: FirebaseConfig): Promise<void> {
    try {
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);

      // Initialize Firebase Cloud Messaging
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging(this.app);

        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        logger.info('Service Worker registered for push notifications');

        // Handle incoming messages when app is in foreground
        onMessage(this.messaging, (payload) => {
          logger.info('Received foreground message:', payload);
          this.handleForegroundMessage(payload);
        });
      }
    } catch (error) {
      logger.error('Error initializing Firebase:', error as Error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        logger.info('Notification permission granted');
        return true;
      } else {
        logger.warn('Notification permission denied');
        return false;
      }
    } catch (error) {
      logger.error('Error requesting notification permission:', error as Error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase messaging not initialized');
      }

      const currentToken = await getToken(this.messaging, {
        vapidKey: this.vapidKey
      });

      if (currentToken) {
        logger.info('Registration token available');
        return currentToken;
      } else {
        logger.warn('No registration token available');
        return null;
      }
    } catch (error) {
      logger.error('Error retrieving registration token:', error as Error);
      return null;
    }
  }

  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic }),
      });

      if (response.ok) {
        logger.info(`Successfully subscribed to topic: ${topic}`);
        return true;
      } else {
        throw new Error('Failed to subscribe to topic');
      }
    } catch (error) {
      logger.error(`Error subscribing to topic ${topic}:`, error as Error);
      return false;
    }
  }

  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, topic }),
      });

      if (response.ok) {
        logger.info(`Successfully unsubscribed from topic: ${topic}`);
        return true;
      } else {
        throw new Error('Failed to unsubscribe from topic');
      }
    } catch (error) {
      logger.error(`Error unsubscribing from topic ${topic}:`, error as Error);
      return false;
    }
  }

  async sendNotification(
    token: string,
    payload: PushNotificationPayload,
    options?: {
      priority?: 'normal' | 'high';
      timeToLive?: number;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          payload,
          options
        }),
      });

      if (response.ok) {
        logger.info('Notification sent successfully');
        return true;
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      logger.error('Error sending notification:', error as Error);
      return false;
    }
  }

  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload,
    options?: {
      priority?: 'normal' | 'high';
      timeToLive?: number;
    }
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send-to-topic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          payload,
          options
        }),
      });

      if (response.ok) {
        logger.info(`Notification sent to topic ${topic} successfully`);
        return true;
      } else {
        throw new Error('Failed to send notification to topic');
      }
    } catch (error) {
      logger.error(`Error sending notification to topic ${topic}:`, error as Error);
      return false;
    }
  }

  private handleForegroundMessage(payload: any): void {
    const { title, body, data } = payload.data || {};

    if (title && body) {
      // Show browser notification
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data
      });

      notification.onclick = () => {
        // Handle notification click
        if (data?.url) {
          window.open(data.url, '_blank');
        }
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  isQuietHour(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = settings.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime < endTime) {
      // Same day range
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Overnight range
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  shouldSendNotification(settings: NotificationSettings, category: string): boolean {
    if (!settings.enabled) return false;
    if (this.isQuietHour(settings)) return false;

    // Check category-specific settings
    switch (category) {
      case 'payments':
        return settings.categories.payments;
      case 'messages':
        return settings.categories.messages;
      case 'jobs':
        return settings.categories.jobs;
      case 'ratings':
        return settings.categories.ratings;
      case 'promotions':
        return settings.categories.promotions;
      default:
        return false;
    }
  }

  // Utility methods for common notifications
  async notifyPaymentApproved(userId: string, amount: number, transactionId: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    if (!settings || !this.shouldSendNotification(settings, 'payments')) return;

    if (settings.token) {
      await this.sendNotification(settings.token, {
        title: '¡Pago Aprobado!',
        body: `Tu pago de $${amount.toLocaleString('es-CL')} ha sido aprobado exitosamente.`,
        icon: '/icon-payment-success.png',
        data: {
          type: 'payment_approved',
          transactionId,
          url: `/payments/${transactionId}`
        }
      });
    }
  }

  async notifyNewMessage(userId: string, senderName: string, conversationId: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    if (!settings || !this.shouldSendNotification(settings, 'messages')) return;

    if (settings.token) {
      await this.sendNotification(settings.token, {
        title: 'Nuevo Mensaje',
        body: `${senderName} te ha enviado un mensaje.`,
        icon: '/icon-message.png',
        data: {
          type: 'new_message',
          conversationId,
          url: `/chat?conversation=${conversationId}`
        }
      });
    }
  }

  async notifyJobUpdate(userId: string, jobId: string, status: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    if (!settings || !this.shouldSendNotification(settings, 'jobs')) return;

    if (settings.token) {
      await this.sendNotification(settings.token, {
        title: 'Actualización de Trabajo',
        body: `El estado de tu trabajo ha cambiado a: ${status}`,
        icon: '/icon-job-update.png',
        data: {
          type: 'job_update',
          jobId,
          url: `/jobs/${jobId}`
        }
      });
    }
  }

  async notifyNewRating(userId: string, providerName: string, rating: number): Promise<void> {
    const settings = await this.getUserSettings(userId);
    if (!settings || !this.shouldSendNotification(settings, 'ratings')) return;

    if (settings.token) {
      await this.sendNotification(settings.token, {
        title: 'Nueva Calificación',
        body: `${providerName} recibió una calificación de ${rating} estrellas.`,
        icon: '/icon-rating.png',
        data: {
          type: 'new_rating',
          providerName,
          url: '/ratings'
        }
      });
    }
  }

  // Mock method - in real implementation, this would fetch from database
  private async getUserSettings(userId: string): Promise<NotificationSettings | null> {
    // This is a mock implementation
    // In real implementation, fetch from database
    return {
      userId,
      enabled: true,
      token: 'mock-token',
      topics: ['general'],
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      categories: {
        payments: true,
        messages: true,
        jobs: true,
        ratings: true,
        promotions: false
      }
    };
  }
}

export const firebaseNotificationService = FirebaseNotificationService.getInstance();
export type { NotificationSettings, PushNotificationPayload, FirebaseConfig };
