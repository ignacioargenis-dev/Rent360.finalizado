// Pusher WebSocket client - separate file to avoid build issues
import { logger } from '../logger';

export class PusherWebSocketClient {
  private pusher: any = null;
  private channel: any = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private _isConnected = false;
  private _connectionAttempts = 0;

  async connect(token?: string): Promise<boolean> {
    this._connectionAttempts++;
    console.log('🔥🔥🔥 [PUSHER DEBUG] connect() called, attempt #' + this._connectionAttempts);
    console.trace('🔥🔥🔥 [PUSHER DEBUG] Call stack:');
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
        console.log('🔥 [PUSHER DEBUG] Activating Pusher console logs');
        (Pusher as any).logToConsole = true;
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
        authorizer: (channel: any, options: any) => {
          return {
            authorize: (socketId: string, callback: Function) => {
              console.log('🔥 [PUSHER DEBUG] Authorizer called:', {
                socketId,
                channelName: channel.name,
                options,
              });

              // Llamar al auth endpoint
              fetch('/api/pusher/auth', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token || this.getTokenFromCookies() || ''}`,
                },
                body: JSON.stringify({
                  socket_id: socketId,
                  channel_name: channel.name,
                }),
              })
                .then(response => {
                  console.log('🔥 [PUSHER DEBUG] Auth response:', {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                  });
                  return response.json();
                })
                .then(data => {
                  console.log('🔥 [PUSHER DEBUG] Auth response data:', data);
                  if (data.error) {
                    console.error('🔥 [PUSHER DEBUG] Auth failed:', data.error);
                    this._isConnected = false;
                    callback(new Error(data.error), null);
                  } else {
                    console.log('🔥 [PUSHER DEBUG] Auth successful, marking as connected');
                    // ✅ MARCAR COMO CONECTADO CUANDO AUTH TENGA ÉXITO
                    this._isConnected = true;
                    console.log('🔥 [PUSHER DEBUG] About to emit connect event');
                    this.emit('connect');
                    console.log('🔥 [PUSHER DEBUG] Connect event emitted successfully');

                    // Asignar el canal autorizado
                    this.channel = channel;
                    // También asignar para compatibilidad con socket-client.ts
                    (this as any).pusherChannel = channel;

                    // Configurar event listeners para mensajes
                    console.log('🔥 [PUSHER DEBUG] Setting up message listeners');
                    this.channel.bind('new-message', (data: any) => this.emit('new-message', data));
                    this.channel.bind('notification', (data: any) =>
                      this.emit('notification', data)
                    );

                    callback(null, data);
                  }
                })
                .catch(error => {
                  console.error('🔥 [PUSHER DEBUG] Auth fetch error:', error);
                  this._isConnected = false;
                  callback(error, null);
                });
            },
          };
        },
      });

      console.log('🔥 [PUSHER DEBUG] Pusher instance created');
      console.log('🔥 [PUSHER DEBUG] Connection state:', this.pusher.connection.state);
      logger.info('🔧 [PUSHER] Pusher instance created, waiting for connection...');

      // ✅ ESPERAR A QUE LA AUTENTICACIÓN TENGA ÉXITO
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

        // Escuchar cuando Pusher comienza a conectar (para detectar peticiones prematuras)
        this.pusher.connection.bind('connecting', () => {
          console.log('🔥 [PUSHER DEBUG] Pusher is connecting to server...');
          logger.info('🔌 [PUSHER] Pusher is connecting to server...');
        });

        // Escuchar evento de conexión exitosa
        this.pusher.connection.bind('connected', () => {
          console.log(
            '🔥 [PUSHER DEBUG] Pusher connected! Socket ID:',
            this.pusher.connection.socket_id
          );
          logger.info(
            '✅ [PUSHER] Connection established, socket_id:',
            this.pusher.connection.socket_id
          );
        });

        // Escuchar nuestro evento personalizado de conexión exitosa (desde authorizer)
        this.on('connect', () => {
          console.log('🔥 [PUSHER DEBUG] Our custom connect event fired, resolving promise');
          resolve(true);
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

        // Intentar suscribirse al canal (esto activará el authorizer)
        console.log('🔥 [PUSHER DEBUG] Subscribing to private-user channel to trigger auth...');
        this.pusher.subscribe('private-user');

        // Timeout de seguridad (15 segundos - aumentado por auth)
        setTimeout(() => {
          if (!this._isConnected) {
            console.error('🔥 [PUSHER DEBUG] Connection timeout after 15 seconds');
            console.log('🔥 [PUSHER DEBUG] Final connection state:', this.pusher.connection.state);
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
