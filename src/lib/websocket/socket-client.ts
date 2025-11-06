import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { logger } from '../logger';

// Pusher client - loaded dynamically
let PusherClient: any = null;
let pusherClientLoaded = false;

// FORZAR LOG PARA CONFIRMAR QUE EL ARCHIVO SE CARGA
if (typeof window !== 'undefined') {
  console.log('🚨 [DEBUG] WebSocket client file loaded successfully');
}

const loadPusherClient = async () => {
  if (pusherClientLoaded) {
    return PusherClient;
  }
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const { PusherWebSocketClient } = await import('./pusher-client');
    PusherClient = PusherWebSocketClient;
    pusherClientLoaded = true;
    logger.info('✅ [PUSHER] Pusher client loaded successfully');
    return PusherClient;
  } catch (error) {
    logger.warn('⚠️ [PUSHER] Pusher client not available', { error });
    return null;
  }
};

interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  notification: (data: any) => void;
  'contract-update': (data: any) => void;
  'payment-update': (data: any) => void;
  'new-message': (data: any) => void;
  'system-alert': (data: any) => void;
  pong: (data: any) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private pusherChannel: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private _isConnected = false;
  private _usingPusher = false;

  // Determinar si usar Pusher o Socket.io
  private shouldUsePusher(): boolean {
    // Check if Pusher is available and configured
    return !!(
      process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER &&
      (globalThis as any).Pusher
    );
  }

  async connect(token?: string): Promise<void> {
    // Si ya está conectado, no hacer nada
    if (this._isConnected) {
      return;
    }

    // Logging para debugging
    logger.info('🔌 [WEBSOCKET] Attempting connection', {
      hasToken: !!token,
      hasPusherKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
      hasPusherCluster: !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      shouldUsePusher: this.shouldUsePusher(),
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
      wsUrl: process.env.NEXT_PUBLIC_WS_URL,
    });

    if (this.shouldUsePusher()) {
      this.connectWithPusher(token).catch(async error => {
        logger.error('❌ [PUSHER] Failed to connect with Pusher, falling back to Socket.io', {
          error,
        });
        await this.connectWithSocketIO(token);
      });
    } else {
      await this.connectWithSocketIO(token);
    }
  }

  private async connectWithPusher(token?: string): Promise<void> {
    try {
      logger.info('🚀 [PUSHER] Connecting with Pusher');

      // Load Pusher client dynamically
      const PusherWebSocketClient = await loadPusherClient();
      if (!PusherWebSocketClient) {
        throw new Error('Pusher client not available');
      }

      // Create and connect Pusher client
      const pusherInstance = new PusherWebSocketClient();
      const connected = await pusherInstance.connect(token);

      if (!connected) {
        throw new Error('Pusher connection failed');
      }

      // Store reference and setup event forwarding
      this.pusherChannel = pusherInstance;

      // Forward events to our event system
      pusherInstance.on('connect', () => {
        this._isConnected = true;
        this._usingPusher = true;
        this.emitEvent('connect');
      });

      pusherInstance.on('disconnect', () => {
        this._isConnected = false;
        this.emitEvent('disconnect');
      });

      pusherInstance.on('new-message', (data: any) => {
        this.emitEvent('new-message', data);
      });

      pusherInstance.on('notification', (data: any) => {
        this.emitEvent('notification', data);
      });

      logger.info('✅ [PUSHER] Connected successfully');
    } catch (error) {
      logger.error('❌ [PUSHER] Connection failed', { error });
      throw error; // Dejar que el catch en connect maneje el fallback
    }
  }

  private async getTokenFromAPI(): Promise<string | null> {
    try {
      console.log('🔑 [WS AUTH] Fetching token from API endpoint');

      const response = await fetch('/api/ws-token', {
        credentials: 'include',
      });

      if (!response.ok) {
        console.log('❌ [WS AUTH] Failed to fetch token from API:', response.status);
        return null;
      }

      const data = await response.json();
      if (data.success && data.token) {
        console.log('✅ [WS AUTH] Token obtained from API, length:', data.token.length);
        return data.token;
      }

      console.log('❌ [WS AUTH] API returned success but no token');
      return null;
    } catch (error) {
      console.log('❌ [WS AUTH] Error fetching token from API:', error);
      return null;
    }
  }

  private async connectWithSocketIO(token?: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    logger.info('🔌 [SOCKET.IO] Connecting with Socket.io');

    // Usar la URL actual del navegador en lugar de localhost hardcodeado
    const serverUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    // Obtener token para autenticación WebSocket
    const authToken = token || (await this.getTokenFromAPI());

    this.socket = io(serverUrl, {
      auth: {
        token: authToken,
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on('connect', () => {
      logger.info('WebSocket connected');
      this._isConnected = true;
      this.reconnectAttempts = 0;

      // Emitir evento de conexión
      this.emitEvent('connect');
    });

    this.socket.on('disconnect', reason => {
      logger.warn('WebSocket disconnected', { reason });
      this._isConnected = false;

      // Intentar reconexión automática
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.attemptReconnect();
      }

      this.emitEvent('disconnect');
    });

    this.socket.on('connect_error', error => {
      logger.error('WebSocket connection error', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.attemptReconnect();
    });

    // Manejadores de eventos de negocio - SINCRONIZADOS con servidor
    this.socket.on('notification', data => {
      logger.info('Notification received', { data });
      this.emitEvent('notification', data);
    });

    this.socket.on('contract-update', data => {
      logger.info('Contract update received', { data });
      this.emitEvent('contract-update', data);
    });

    this.socket.on('payment-update', data => {
      logger.info('Payment update received', { data });
      this.emitEvent('payment-update', data);
    });

    // CORREGIDO: Servidor envía 'new-message', cliente ahora escucha correctamente
    this.socket.on('new-message', data => {
      logger.info('New message received', { data });
      this.emitEvent('new-message', data);
    });

    this.socket.on('system-alert', data => {
      logger.info('System alert received', { data });
      this.emitEvent('system-alert', data);
    });

    this.socket.on('pong', data => {
      this.emitEvent('pong', data);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      if (this.socket && !this.socket.connected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Métodos para manejar eventos
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // Si ya está conectado, intentar bind inmediato para Pusher
    if (this._usingPusher && this.pusherChannel && this._isConnected) {
      try {
        this.pusherChannel.bind(event, callback);
      } catch (error) {
        logger.warn('Could not bind Pusher event immediately', { event, error });
      }
    }
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
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

    // Unbind de Pusher si está conectado
    if (this._usingPusher && this.pusherChannel) {
      try {
        if (callback) {
          this.pusherChannel.unbind(event, callback);
        } else {
          // Para remover todos los listeners, necesitamos unbind específico
          // Pusher no tiene un método directo para remover todos
        }
      } catch (error) {
        logger.warn('Could not unbind Pusher event', { event, error });
      }
    }
  }

  private emitEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          logger.error('Error in event listener', { event, error });
        }
      });
    }
  }

  // Métodos para enviar eventos al servidor
  joinRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-room', roomName);
    }
  }

  leaveRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', roomName);
    }
  }

  sendMessage(toUserId: string, message: string, conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('send-message', {
        toUserId,
        message,
        conversationId,
        timestamp: new Date(),
      });
    }
  }

  updatePresence(status: string): void {
    if (this.socket?.connected) {
      this.socket.emit('update-presence', {
        status,
        lastSeen: new Date(),
      });
    }
  }

  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  // Estado de conexión
  get isConnected(): boolean {
    if (this._usingPusher) {
      return this._isConnected && !!this.pusherChannel;
    }
    return this._isConnected && this.socket?.connected === true;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  get isUsingPusher(): boolean {
    return this._usingPusher;
  }

  // Cerrar conexión
  disconnect(): void {
    if (this._usingPusher && this.pusherChannel) {
      logger.info('🚪 [PUSHER] Disconnecting from Pusher');
      this.pusherChannel.disconnect();
      this.pusherChannel = null;
    } else if (this.socket) {
      logger.info('🚪 [SOCKET.IO] Disconnecting from Socket.io');
      this.socket.disconnect();
      this.socket = null;
    }

    this._isConnected = false;
    this._usingPusher = false;
    this.eventListeners.clear();
    logger.info('WebSocket client disconnected');
  }
}

// Instancia singleton del cliente WebSocket
export const websocketClient = new WebSocketClient();

// Hook de React para usar WebSocket
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(websocketClient.isConnected);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useEffect(() => {
    // Conectar al WebSocket
    const connectWebSocket = async () => {
      await websocketClient.connect();
    };
    connectWebSocket();

    // Configurar event listeners
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleNotification = (data: any) => {
      console.log('📨 [WEBSOCKET CLIENT] Notification received:', data);
      setNotifications(prev => [data, ...prev]);

      // Incrementar contador de mensajes no leídos si es una notificación de mensaje nuevo
      if (data.type === 'NEW_MESSAGE' || data.type === 'new-message') {
        console.log('📨 [WEBSOCKET CLIENT] Incrementing unread messages count');
        setUnreadMessagesCount(prev => prev + 1);
      }
    };

    const handleNewMessage = (data: any) => {
      setMessages(prev => [data, ...prev]);
    };

    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);
    websocketClient.on('notification', handleNotification);
    websocketClient.on('new-message', handleNewMessage);

    // Cleanup
    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
      websocketClient.off('notification', handleNotification);
      websocketClient.off('new-message', handleNewMessage);
    };
  }, []);

  return {
    isConnected,
    notifications,
    messages,
    unreadMessagesCount,
    sendMessage: websocketClient.sendMessage.bind(websocketClient),
    joinRoom: websocketClient.joinRoom.bind(websocketClient),
    leaveRoom: websocketClient.leaveRoom.bind(websocketClient),
    updatePresence: websocketClient.updatePresence.bind(websocketClient),
    clearNotifications: () => setNotifications([]),
  };
}

// Funciones de conveniencia
export const connectWebSocket = async (token?: string) => await websocketClient.connect(token);
export const disconnectWebSocket = () => websocketClient.disconnect();
export const isWebSocketConnected = () => websocketClient.isConnected;
