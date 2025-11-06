// Pusher WebSocket client - separate file to avoid build issues
import { logger } from '../logger';

export class PusherWebSocketClient {
  private pusher: any = null;
  private channel: any = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private _isConnected = false;

  async connect(token?: string): Promise<boolean> {
    try {
      // Try to get Pusher from global scope (must be loaded externally)
      const Pusher: any = (globalThis as any).Pusher;

      if (!Pusher) {
        logger.warn('⚠️ [PUSHER] Pusher not available. Make sure pusher-js is loaded externally');
        return false;
      }

      logger.info('🚀 [PUSHER] Initializing Pusher client');

      this.pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        encrypted: true,
        authEndpoint: '/api/pusher/auth',
        auth: {
          headers: {
            Authorization: token || this.getTokenFromCookies() || '',
          },
        },
      });

      // Subscribe to private user channel
      this.channel = this.pusher.subscribe('private-user');

      return new Promise(resolve => {
        this.channel.bind('pusher:subscription_succeeded', () => {
          logger.info('✅ [PUSHER] Connected successfully');
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
