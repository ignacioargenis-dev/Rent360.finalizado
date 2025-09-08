import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { logger } from '../logger';

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
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners: Map<string, Function[]> = new Map();
  private isConnected = false;

  connect(token?: string): void {
    if (this.socket?.connected) return;

    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';

    this.socket = io(serverUrl, {
      auth: {
        token: token || localStorage.getItem('authToken')
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.info('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Emitir evento de conexión
      this.emitEvent('connect');
    });

    this.socket.on('disconnect', (reason) => {
      logger.warn('WebSocket disconnected', { reason });
      this.isConnected = false;

      // Intentar reconexión automática
      if (reason === 'io server disconnect' || reason === 'io client disconnect') {
        this.attemptReconnect();
      }

      this.emitEvent('disconnect');
    });

    this.socket.on('connect_error', (error) => {
      logger.error('WebSocket connection error', error);
      this.attemptReconnect();
    });

    // Manejadores de eventos de negocio
    this.socket.on('notification', (data) => {
      logger.info('Notification received', data);
      this.emitEvent('notification', data);
    });

    this.socket.on('contract-update', (data) => {
      logger.info('Contract update received', data);
      this.emitEvent('contract-update', data);
    });

    this.socket.on('payment-update', (data) => {
      logger.info('Payment update received', data);
      this.emitEvent('payment-update', data);
    });

    this.socket.on('new-message', (data) => {
      logger.info('New message received', data);
      this.emitEvent('new-message', data);
    });

    this.socket.on('system-alert', (data) => {
      logger.info('System alert received', data);
      this.emitEvent('system-alert', data);
    });

    this.socket.on('pong', (data) => {
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

    logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

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
  }

  off<T extends keyof SocketEvents>(event: T, callback?: SocketEvents[T]): void {
    if (!this.eventListeners.has(event)) return;

    const listeners = this.eventListeners.get(event)!;
    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      listeners.length = 0;
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
        timestamp: new Date()
      });
    }
  }

  updatePresence(status: string): void {
    if (this.socket?.connected) {
      this.socket.emit('update-presence', {
        status,
        lastSeen: new Date()
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
    return this.isConnected && this.socket?.connected === true;
  }

  get socketId(): string | undefined {
    return this.socket?.id;
  }

  // Cerrar conexión
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      logger.info('WebSocket client disconnected');
    }
  }
}

// Instancia singleton del cliente WebSocket
export const websocketClient = new WebSocketClient();

// Hook de React para usar WebSocket
export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(websocketClient.isConnected);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    // Conectar al WebSocket
    websocketClient.connect();

    // Configurar event listeners
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleNotification = (data: any) => {
      setNotifications(prev => [data, ...prev]);
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
    sendMessage: websocketClient.sendMessage.bind(websocketClient),
    joinRoom: websocketClient.joinRoom.bind(websocketClient),
    leaveRoom: websocketClient.leaveRoom.bind(websocketClient),
    updatePresence: websocketClient.updatePresence.bind(websocketClient),
    clearNotifications: () => setNotifications([])
  };
}

// Funciones de conveniencia
export const connectWebSocket = (token?: string) => websocketClient.connect(token);
export const disconnectWebSocket = () => websocketClient.disconnect();
export const isWebSocketConnected = () => websocketClient.isConnected;
