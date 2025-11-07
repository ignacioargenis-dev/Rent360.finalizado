// Pusher WebSocket client - separate file to avoid build issues
import { logger } from '../logger';

export class PusherWebSocketClient {
  private pusher: any = null;
  private channel: any = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private _isConnected = false;

  async connect(token?: string): Promise<boolean> {
    try {
      // Import Pusher dynamically
      let Pusher: any;
      try {
        Pusher = (await import('pusher-js')).default;
      } catch (importError) {
        logger.warn('⚠️ [PUSHER] Failed to import pusher-js:', { error: importError });
        return false;
      }

      if (!Pusher) {
        logger.warn('⚠️ [PUSHER] Pusher not available after import');
        return false;
      }

      // Habilitar logs de Pusher para debugging (solo en desarrollo)
      if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        (Pusher as any).logToConsole = true;
      }

      // Verificar configuración de Pusher
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      if (!pusherKey || !pusherCluster) {
        logger.error('❌ [PUSHER] Missing Pusher configuration', {
          hasKey: !!pusherKey,
          hasCluster: !!pusherCluster,
          keyPrefix: pusherKey?.substring(0, 8),
        });
        return false;
      }

      logger.info('🚀 [PUSHER] Initializing Pusher client', {
        key: pusherKey.substring(0, 8) + '...',
        cluster: pusherCluster,
        hasToken: !!token,
        nodeEnv: process.env.NODE_ENV,
      });

      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        forceTLS: true, // ✅ Cambio: usar forceTLS en lugar de encrypted (deprecado)
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            Authorization: `Bearer ${token || this.getTokenFromCookies() || ''}`,
          },
          // ✅ Cambio: REMOVER params - Pusher envía socket_id y channel_name automáticamente
        },
      });

      logger.info('🔧 [PUSHER] Pusher instance created, waiting for connection...');

      // ✅ ESPERAR A QUE PUSHER SE CONECTE PRIMERO ANTES DE SUSCRIBIRSE
      return new Promise(resolve => {
        // Escuchar cambios de estado de conexión para debugging
        this.pusher.connection.bind('state_change', (states: any) => {
          logger.info('🔄 [PUSHER] State change:', {
            previous: states.previous,
            current: states.current,
          });
        });

        // Escuchar cuando Pusher comienza a conectar (para detectar peticiones prematuras)
        this.pusher.connection.bind('connecting', () => {
          logger.info('🔌 [PUSHER] Pusher is connecting to server...');
        });

        // Escuchar evento de conexión exitosa
        this.pusher.connection.bind('connected', () => {
          logger.info(
            '✅ [PUSHER] Connection established, socket_id:',
            this.pusher.connection.socket_id
          );

          // AHORA suscribirse al canal privado (después de tener socket_id)
          this.channel = this.pusher.subscribe('private-user');

          this.channel.bind('pusher:subscription_succeeded', () => {
            logger.info('✅ [PUSHER] Subscription successful');
            this._isConnected = true;
            this.emit('connect');
            resolve(true);
          });

          this.channel.bind('pusher:subscription_error', (error: any) => {
            logger.error('❌ [PUSHER] Subscription error:', error);
            this._isConnected = false;
            this.emit('disconnect');
            resolve(false);
          });

          // Bind standard events
          this.channel.bind('new-message', (data: any) => this.emit('new-message', data));
          this.channel.bind('notification', (data: any) => this.emit('notification', data));
        });

        // Manejar errores de conexión
        this.pusher.connection.bind('error', (error: any) => {
          logger.error('❌ [PUSHER] Connection error:', error);
          resolve(false);
        });

        // Timeout de seguridad (10 segundos)
        setTimeout(() => {
          if (!this._isConnected) {
            logger.error('❌ [PUSHER] Connection timeout');
            resolve(false);
          }
        }, 10000);
      });

      logger.info('🎯 [PUSHER] Event listeners bound, waiting for connection events...');
    } catch (error) {
      logger.error('❌ [PUSHER] Failed to initialize', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  private getTokenFromCookies(): string | null {
    if (typeof document === 'undefined') {
      return null;
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth-token' || name === 'next-auth.session-token' || name === 'token') {
        return value ? decodeURIComponent(value) : null;
      }
    }
    return null;
  }

  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Bind to Pusher channel if connected
    if (this.channel && this._isConnected) {
      this.channel.bind(event, callback);
    }
  }

  off(event: string, callback?: Function): void {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const listeners = this.eventListeners.get(event)!;
    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      listeners.length = 0;
    }

    // Unbind from Pusher
    if (this.channel) {
      if (callback) {
        this.channel.unbind(event, callback);
      } else {
        this.channel.unbind(event);
      }
    }
  }

  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(...args));
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.unbind_all();
      this.pusher.unsubscribe('private-user');
    }
    if (this.pusher) {
      this.pusher.disconnect();
    }
    this._isConnected = false;
    this.eventListeners.clear();
    logger.info('🚪 [PUSHER] Disconnected');
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
}
