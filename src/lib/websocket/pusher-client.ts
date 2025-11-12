// Pusher WebSocket client - separate file to avoid build issues
import { logger } from '../logger';

export class PusherWebSocketClient {
  private pusher: any = null;
  private channel: any = null;
  private pusherChannel: any = null; // ✅ Para compatibilidad con socket-client.ts
  private eventListeners: Map<string, Function[]> = new Map();
  private _isConnected = false;
  private _connectionAttempts = 0;
  private userId: string = '';

  constructor() {
    // ✅ Log en constructor para confirmar que la clase se instancia
    if (typeof window !== 'undefined') {
      window.console.log('🚨🚨🚨🚨🚨 [PUSHER] PusherWebSocketClient CONSTRUCTOR CALLED 🚨🚨🚨🚨🚨');
    }
    console.log('🚨🚨🚨🚨🚨 [PUSHER CLASS] PusherWebSocketClient instance created 🚨🚨🚨🚨🚨');
    console.log('🚨🚨🚨 [PUSHER] File loaded and class instantiated successfully');
  }

  async connect(userId?: string, token?: string): Promise<boolean> {
    // Guardar el userId para filtrar notificaciones
    if (userId) {
      this.userId = userId;
    }

    this._connectionAttempts++;

    // Usar window.console para asegurar que se muestre en producción
    if (typeof window !== 'undefined') {
      window.console.log(
        '🚨🚨🚨🚨🚨 [PUSHER] connect() METHOD CALLED! Attempt #' + this._connectionAttempts
      );
    }

    console.log(
      '🚨🚨🚨🚨🚨 [PUSHER DEBUG] connect() CALLED, attempt #' +
        this._connectionAttempts +
        ' 🚨🚨🚨🚨🚨'
    );
    console.log('🚨 [PUSHER] Browser info:', {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
      online: typeof navigator !== 'undefined' ? navigator.onLine : 'N/A',
      cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : 'N/A',
    });
    console.trace('🚨🚨🚨🚨🚨 [PUSHER DEBUG] Call stack: 🚨🚨🚨🚨🚨');
    try {
      // Import Pusher dynamically
      let Pusher: any;
      try {
        Pusher = (await import('pusher-js')).default;
        console.log('🔥 [PUSHER DEBUG] pusher-js imported successfully');
      } catch (importError) {
        console.error('🔥 [PUSHER DEBUG] Failed to import pusher-js:', importError);
        logger.warn('⚠️ [PUSHER] Failed to import pusher-js:', { error: importError });
        return false;
      }

      if (!Pusher) {
        console.error('🔥 [PUSHER DEBUG] Pusher is null after import');
        logger.warn('⚠️ [PUSHER] Pusher not available after import');
        return false;
      }

      // ✅ ACTIVAR LOGS DE PUSHER SIEMPRE (para debugging en producción)
      if (typeof window !== 'undefined') {
        console.log('🚨🚨🚨 [PUSHER DEBUG] ACTIVATING PUSHER CONSOLE LOGS 🚨🚨🚨');
        (Pusher as any).logToConsole = true;
        console.log('🚨🚨🚨 [PUSHER DEBUG] Pusher.logToConsole set to true 🚨🚨🚨');
      }

      // Verificar configuración de Pusher
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

      console.log('🔥 [PUSHER DEBUG] Configuration check:', {
        hasKey: !!pusherKey,
        keyPrefix: pusherKey?.substring(0, 8),
        cluster: pusherCluster,
        hasToken: !!token,
        nodeEnv: process.env.NODE_ENV,
      });

      if (!pusherKey || !pusherCluster) {
        console.error('🔥 [PUSHER DEBUG] Missing Pusher configuration');
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

      console.log('🔥 [PUSHER DEBUG] Creating Pusher instance with config:', {
        key: pusherKey.substring(0, 8) + '...',
        cluster: pusherCluster,
        forceTLS: true,
        authEndpoint: '/api/pusher/auth',
      });

      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        useTLS: true, // ✅ Usar useTLS (recomendado por Pusher)
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            Authorization: `Bearer ${token || this.getTokenFromCookies() || ''}`,
          },
          // ✅ SIN params - Pusher envía socket_id y channel_name automáticamente
        },
      });

      // ✅ IMPORTANTE: Agregar binding global para manejar suscripciones correctamente
      this.pusher.bind('pusher:subscription_succeeded', (channel: any) => {
        console.log('🔥 [PUSHER GLOBAL] Subscription succeeded for channel:', channel?.name);
        if (channel?.name === 'private-user') {
          this.pusherChannel = channel; // ✅ Asignar el canal válido
          console.log(
            '🔥 [PUSHER GLOBAL] pusherChannel assigned successfully:',
            !!this.pusherChannel
          );
        }
      });

      this.pusher.bind('pusher:subscription_error', (error: any, channel: any) => {
        console.error('🔥 [PUSHER GLOBAL] Subscription error:', {
          error,
          channelName: channel?.name,
        });
      });

      console.log('🔥 [PUSHER DEBUG] Pusher instance created');
      console.log('🔥 [PUSHER DEBUG] Connection state:', this.pusher.connection.state);
      logger.info('🔧 [PUSHER] Pusher instance created, waiting for connection...');

      // ✅ ESPERAR A QUE PUSHER SE CONECTE Y AUTENTIQUE EL CANAL
      return new Promise(resolve => {
        console.log('🔥 [PUSHER DEBUG] Setting up event listeners');

        // Escuchar cambios de estado de conexión para debugging
        this.pusher.connection.bind('state_change', (states: any) => {
          console.log('🔥 [PUSHER DEBUG] State change:', states);
          logger.info('🔄 [PUSHER] State change:', {
            previous: states.previous,
            current: states.current,
          });
        });

        // Escuchar cuando Pusher comienza a conectar
        this.pusher.connection.bind('connecting', () => {
          console.log('🔥 [PUSHER DEBUG] Pusher is connecting to server...');
          logger.info('🔌 [PUSHER] Pusher is connecting to server...');
        });

        // Escuchar evento de conexión exitosa
        this.pusher.connection.bind('connected', () => {
          if (typeof window !== 'undefined') {
            window.console.log('🔥🔥🔥🔥🔥 [PUSHER] CONNECTED EVENT FIRED! 🔥🔥🔥🔥🔥');
            window.console.log('🔥 [PUSHER] Socket ID:', this.pusher.connection.socket_id);
          }
          console.log(
            '🔥 [PUSHER DEBUG] Pusher connected! Socket ID:',
            this.pusher.connection.socket_id
          );
          logger.info(
            '✅ [PUSHER] Connection established, socket_id:',
            this.pusher.connection.socket_id
          );

          // AHORA suscribirse al canal privado (después de tener socket_id)
          if (typeof window !== 'undefined') {
            window.console.log('🔥🔥🔥 [PUSHER] About to subscribe to private-user channel');
          }
          console.log('🔥 [PUSHER DEBUG] Subscribing to private-user channel...');
          this.channel = this.pusher.subscribe('private-user');

          if (typeof window !== 'undefined') {
            window.console.log('🔥 [PUSHER] Channel subscribed, registering callbacks...');
            window.console.log('🔥 [PUSHER] Channel object:', this.channel);
          }

          // ✅ Escuchar suscripción exitosa
          this.channel.bind('pusher:subscription_succeeded', () => {
            if (typeof window !== 'undefined') {
              window.console.log('🔥🔥🔥🔥🔥 [PUSHER] SUBSCRIPTION SUCCEEDED! 🔥🔥🔥🔥🔥');
              window.console.log('🔥 [PUSHER] Marking as connected and emitting connect event');
            }
            console.log('🔥🔥🔥 [PUSHER DEBUG] Subscription SUCCEEDED! Marking as connected');
            logger.info('✅ [PUSHER] Subscription successful');
            this._isConnected = true;
            console.log('🔥 [PUSHER] _isConnected set to:', this._isConnected);
            this.emit('connect');
            console.log('🔥 [PUSHER] connect event emitted');
            resolve(true);
          });

          // ❌ Escuchar errores de suscripción
          this.channel.bind('pusher:subscription_error', (error: any) => {
            console.error('🔥 [PUSHER DEBUG] Subscription error:', error);
            logger.error('❌ [PUSHER] Subscription error:', error);
            this._isConnected = false;
            this.emit('disconnect');
            resolve(false);
          });

          // Bind standard events
          this.channel.bind('new-message', (data: any) => {
            console.log('🔥 [PUSHER DEBUG] new-message event received:', data);
            this.emit('new-message', data);
          });
          this.channel.bind('notification', (data: any) => {
            console.log('🔥 [PUSHER DEBUG] notification event received:', data);

            // Filtrar notificaciones solo para el usuario actual
            if (data.userId === this.userId) {
              console.log('🔥 [PUSHER DEBUG] notification is for current user, emitting');
              this.emit('notification', data);
            } else {
              console.log('🔥 [PUSHER DEBUG] notification is for different user, ignoring');
            }
          });
        });

        // Manejar errores de conexión
        this.pusher.connection.bind('error', (error: any) => {
          console.error('🔥 [PUSHER DEBUG] Connection error:', error);
          logger.error('❌ [PUSHER] Connection error:', error);
          resolve(false);
        });

        // Manejar otros eventos importantes
        this.pusher.connection.bind('failed', () => {
          console.error('🔥 [PUSHER DEBUG] Connection failed permanently');
          resolve(false);
        });

        this.pusher.connection.bind('unavailable', () => {
          console.error('🔥 [PUSHER DEBUG] Connection unavailable');
          resolve(false);
        });

        // Timeout de seguridad (15 segundos)
        setTimeout(() => {
          if (!this._isConnected) {
            console.error('🔥 [PUSHER DEBUG] Connection timeout after 15 seconds');
            console.log('🔥 [PUSHER DEBUG] Final connection state:', this.pusher.connection.state);
            console.log('🔥 [PUSHER DEBUG] Channel state:', this.channel?.state);
            logger.error('❌ [PUSHER] Connection timeout');
            resolve(false);
          }
        }, 15000);

        console.log(
          '🔥 [PUSHER DEBUG] Event listeners bound, current state:',
          this.pusher.connection.state
        );
      });
    } catch (error) {
      console.error('🔥 [PUSHER DEBUG] Exception in connect:', error);
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
