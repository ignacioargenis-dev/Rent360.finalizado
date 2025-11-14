import { io, Socket } from 'socket.io-client';
import { useState, useEffect } from 'react';
import { logger } from '../logger';

// Pusher client - loaded dynamically
let PusherClient: any = null;
let pusherClientLoaded = false;

// 🚨 FORZAR LOG PARA CONFIRMAR QUE EL ARCHIVO SE CARGA
console.log('🚨🚨🚨🚨🚨 [SOCKET-CLIENT MODULE] socket-client.ts LOADED 🚨🚨🚨🚨🚨');
console.log('🚨 [SOCKET-CLIENT] Module loaded at:', new Date().toISOString());
console.log('🚨 [SOCKET-CLIENT] Running in:', typeof window !== 'undefined' ? 'BROWSER' : 'SERVER');
if (typeof window !== 'undefined') {
  console.log('🚨 [SOCKET-CLIENT] Window location:', window.location.href);
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
  private _userId: string | undefined;

  // Determinar si usar Pusher o Socket.io
  private shouldUsePusher(): boolean {
    try {
      // Check if Pusher is available and configured
      // In Next.js, NEXT_PUBLIC_* vars are injected at build time
      // They should be available directly in the code
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
      // For Pusher, we just need the config vars - we'll import the library dynamically
      const canUsePusher = !!(pusherKey && pusherCluster);

      logger.info('🔍 [PUSHER CHECK]', {
        pusherKey: pusherKey ? pusherKey.substring(0, 8) + '...' : 'NOT SET',
        pusherCluster: pusherCluster || 'NOT SET',
        canUsePusher,
        isBrowser: typeof window !== 'undefined',
      });

      return canUsePusher;
    } catch (error) {
      logger.warn('Error checking Pusher availability:', { error });
      return false;
    }
  }

  async connect(userId?: string, token?: string): Promise<void> {
    console.log('🚨🚨🚨🚨🚨 [WEBSOCKET CLIENT] connect() METHOD CALLED 🚨🚨🚨🚨🚨');
    console.log('🚨 [WEBSOCKET] Called at:', new Date().toISOString());

    // Almacenar userId para uso posterior
    this._userId = userId;

    // Si ya está conectado, no hacer nada
    if (this._isConnected) {
      console.log('🚨 [WEBSOCKET] Already connected, skipping reconnection');
      return;
    }

    // Logging para debugging
    const connectionInfo = {
      userId: this._userId,
      hasToken: !!token,
      hasPusherKey: !!process.env.NEXT_PUBLIC_PUSHER_KEY,
      pusherKeyValue: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 8) + '...',
      hasPusherCluster: !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      shouldUsePusher: this.shouldUsePusher(),
      currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'server',
      wsUrl: process.env.NEXT_PUBLIC_WS_URL,
    };

    console.log('🚨 [WEBSOCKET] Connection info:', connectionInfo);
    logger.info('🔌 [WEBSOCKET] Attempting connection', connectionInfo);

    if (this.shouldUsePusher()) {
      console.log('🚨 [WEBSOCKET] Should use PUSHER, attempting Pusher connection...');
      this.connectWithPusher(token).catch(async error => {
        console.error('🚨 [WEBSOCKET] Pusher connection failed, falling back to Socket.io');
        logger.error('❌ [PUSHER] Failed to connect with Pusher, falling back to Socket.io', {
          error,
        });
        await this.connectWithSocketIO(token);
      });
    } else {
      console.log('🚨 [WEBSOCKET] Should use SOCKET.IO, attempting Socket.io connection...');
      await this.connectWithSocketIO(token);
    }
  }

  private async connectWithPusher(token?: string): Promise<void> {
    try {
      console.log('🚨 [PUSHER] connectWithPusher() called');
      logger.info('🚀 [PUSHER] Connecting with Pusher');

      // Load Pusher client dynamically
      console.log('🚨 [PUSHER] Loading Pusher client dynamically...');
      const PusherWebSocketClient = await loadPusherClient();
      if (!PusherWebSocketClient) {
        console.error('🚨 [PUSHER] PusherWebSocketClient class not available!');
        throw new Error('Pusher client not available');
      }
      console.log('🚨 [PUSHER] PusherWebSocketClient loaded successfully');

      // Create and connect Pusher client
      console.log('🚨 [PUSHER] Creating new PusherWebSocketClient instance...');
      const pusherInstance = new PusherWebSocketClient();
      console.log('🚨 [PUSHER] Instance created');

      // Store reference immediately
      this.pusherChannel = pusherInstance;

      // ✅ CRÍTICO: Registrar event listeners ANTES de llamar connect()
      // para no perder el evento 'connect' que se emite dentro del Promise
      console.log('🚨 [SOCKET-CLIENT] Setting up event forwarding BEFORE connect()...');
      pusherInstance.on('connect', () => {
        console.log('🚨🚨🚨🚨🚨 [SOCKET-CLIENT] ✅ RECEIVED CONNECT EVENT! 🚨🚨🚨🚨🚨');
        this._isConnected = true;
        this._usingPusher = true;
        console.log('🚨 [SOCKET-CLIENT] Emitting connect event to listeners...');
        this.emitEvent('connect');
        console.log('🚨 [SOCKET-CLIENT] Connect event emitted successfully');
      });

      pusherInstance.on('disconnect', () => {
        console.log('🚨 [SOCKET-CLIENT] Received DISCONNECT event from pusherInstance');
        this._isConnected = false;
        this.emitEvent('disconnect');
      });

      pusherInstance.on('new-message', (data: any) => {
        console.log('🚨 [SOCKET-CLIENT] Received new-message event');
        this.emitEvent('new-message', data);
      });

      // Forward Pusher events to socket-client listeners
      pusherInstance.on('connect', () => {
        console.log('🔌 [SOCKET-CLIENT] Pusher connected, forwarding to listeners...');
        this.emitEvent('connect');
      });

      pusherInstance.on('disconnect', () => {
        console.log('🔌 [SOCKET-CLIENT] Pusher disconnected, forwarding to listeners...');
        this.emitEvent('disconnect');
      });

      pusherInstance.on('notification', (data: any) => {
        console.log('🚨🚨🚨 [SOCKET-CLIENT] PUSHER NOTIFICATION RECEIVED!');
        console.log('🚨 [SOCKET-CLIENT] Notification data:', JSON.stringify(data, null, 2));
        console.log('🚨 [SOCKET-CLIENT] Emitting notification event to listeners...');
        this.emitEvent('notification', data);
        console.log('🚨 [SOCKET-CLIENT] Notification event emitted successfully');
      });

      pusherInstance.on('new-message', (data: any) => {
        console.log('💬 [SOCKET-CLIENT] New message received, forwarding...');
        this.emitEvent('new-message', data);
      });

      console.log('🚨 [SOCKET-CLIENT] Event forwarding setup complete, NOW calling connect()...');

      // Ahora sí, llamar a connect()
      const connected = await pusherInstance.connect(this._userId, token);
      console.log('🚨 [PUSHER] connect() returned:', connected);

      if (!connected) {
        console.error('🚨 [PUSHER] Connection failed (returned false)');
        throw new Error('Pusher connection failed');
      }
      console.log('🚨🚨🚨 [PUSHER] Connection successful! 🚨🚨🚨');
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
    if (
      this._usingPusher &&
      this.pusherChannel &&
      this._isConnected &&
      typeof this.pusherChannel.bind === 'function'
    ) {
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
    if (
      this._usingPusher &&
      this.pusherChannel &&
      typeof this.pusherChannel.unbind === 'function'
    ) {
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
    console.log('🚨 [SOCKET-CLIENT] emitEvent called:', {
      event,
      hasListeners: this.eventListeners.has(event),
      listenersCount: this.eventListeners.get(event)?.length || 0,
    });

    const listeners = this.eventListeners.get(event);
    if (listeners) {
      console.log(`🚨 [SOCKET-CLIENT] Calling ${listeners.length} listener(s) for event: ${event}`);
      listeners.forEach((callback, index) => {
        try {
          console.log(`🚨 [SOCKET-CLIENT] Calling listener #${index + 1} for ${event}`);
          callback(...args);
          console.log(`🚨 [SOCKET-CLIENT] Listener #${index + 1} completed successfully`);
        } catch (error) {
          console.error(`🚨 [SOCKET-CLIENT] Error in listener #${index + 1}:`, error);
          logger.error('Error in event listener', { event, error });
        }
      });
    } else {
      console.warn(`🚨 [SOCKET-CLIENT] No listeners registered for event: ${event}`);
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

// Función para mapear tipos de notificación a secciones del sidebar
// Funciona para todos los roles según el tipo de notificación
function getNotificationSection(
  type: string
): 'messages' | 'requests' | 'tickets' | 'ratings' | null {
  const normalizedType = type?.toUpperCase() || '';

  // Mensajes - NEW_MESSAGE, mensajes directos
  if (
    normalizedType === 'NEW_MESSAGE' ||
    normalizedType === 'NEW-MESSAGE' ||
    normalizedType.includes('MESSAGE') ||
    normalizedType === 'DIRECT_MESSAGE'
  ) {
    return 'messages';
  }

  // Solicitudes/Cotizaciones - Service requests, quotes, invitations, prospects, recomendaciones, visitas
  if (
    normalizedType.includes('SERVICE_REQUEST') ||
    normalizedType.includes('QUOTE') ||
    normalizedType === 'SERVICE_REQUEST_RECEIVED' ||
    normalizedType === 'SERVICE_REQUEST_RESPONSE' ||
    normalizedType === 'SERVICE_REQUEST_ACCEPTED' ||
    normalizedType === 'SERVICE_REQUEST_REJECTED' ||
    normalizedType === 'QUOTE_ACCEPTED' ||
    normalizedType === 'QUOTE_REJECTED' ||
    normalizedType === 'INVITATION_RECEIVED' ||
    normalizedType === 'INVITATION_ACCEPTED' ||
    normalizedType === 'INVITATION_REJECTED' ||
    normalizedType === 'PROSPECT_CONVERTED' ||
    normalizedType === 'PROSPECT_ACTIVITY' ||
    normalizedType === 'NEW_RECOMMENDATIONS' ||
    normalizedType === 'VISIT_REJECTED' ||
    normalizedType === 'VISIT_SCHEDULED' ||
    normalizedType.includes('VISIT') ||
    normalizedType.includes('SERVICE') ||
    normalizedType.includes('REQUEST') ||
    normalizedType.includes('PROSPECT') ||
    normalizedType.includes('RECOMMENDATION')
  ) {
    return 'requests';
  }

  // Tickets - Soporte, tickets, casos legales, pagos/comisiones, alertas del sistema
  if (
    normalizedType.includes('TICKET') ||
    normalizedType.includes('SUPPORT') ||
    normalizedType.includes('LEGAL_CASE') ||
    normalizedType === 'SYSTEM_ALERT' ||
    normalizedType === 'ADMIN_ALERT' ||
    normalizedType === 'COMMISSION_CALCULATED' ||
    normalizedType === 'COMMISSION_PAID' ||
    normalizedType === 'PAYOUT_READY' ||
    normalizedType === 'PROVIDER_PAYOUT_APPROVED' ||
    normalizedType.includes('COMMISSION') ||
    normalizedType.includes('PAYOUT') ||
    normalizedType.includes('PAYMENT')
  ) {
    return 'tickets';
  }

  // Calificaciones - Ratings, reviews, evaluaciones, incentivos
  if (
    normalizedType.includes('RATING') ||
    normalizedType.includes('REVIEW') ||
    normalizedType === 'RUNNER_RATING_UPDATED' ||
    normalizedType === 'RATING_RECEIVED' ||
    normalizedType === 'RATING_UPDATED' ||
    normalizedType === 'RUNNER_INCENTIVE_ACHIEVED' ||
    normalizedType.includes('INCENTIVE')
  ) {
    return 'ratings';
  }

  return null;
}

// Hook de React para usar WebSocket
export function useWebSocket() {
  // LOG MUY VISIBLE PARA EL HOOK
  console.log('🚨🚨🚨 [USE WEBSOCKET] HOOK INITIALIZED 🚨🚨🚨');

  const [isConnected, setIsConnected] = useState(websocketClient.isConnected);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  const [unreadTicketsCount, setUnreadTicketsCount] = useState(0);
  const [unreadRatingsCount, setUnreadRatingsCount] = useState(0);

  // Función para cargar notificaciones no leídas desde la base de datos
  const loadUnreadNotificationsFromDB = async () => {
    try {
      console.log('📥 [USE WEBSOCKET] Loading unread notifications from database...');
      const response = await fetch('/api/notifications', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && Array.isArray(data.data)) {
          console.log(
            '📥 [USE WEBSOCKET] Loaded',
            data.data.length,
            'unread notifications from DB'
          );

          // Inicializar contadores según el tipo de cada notificación
          let messagesCount = 0;
          let requestsCount = 0;
          let ticketsCount = 0;
          let ratingsCount = 0;

          data.data.forEach((notification: any) => {
            const section = getNotificationSection(notification.type);
            switch (section) {
              case 'messages':
                messagesCount++;
                break;
              case 'requests':
                requestsCount++;
                break;
              case 'tickets':
                ticketsCount++;
                break;
              case 'ratings':
                ratingsCount++;
                break;
            }
          });

          // Actualizar contadores
          setUnreadMessagesCount(messagesCount);
          setUnreadRequestsCount(requestsCount);
          setUnreadTicketsCount(ticketsCount);
          setUnreadRatingsCount(ratingsCount);

          console.log('📊 [USE WEBSOCKET] Initialized counters from DB:', {
            messages: messagesCount,
            requests: requestsCount,
            tickets: ticketsCount,
            ratings: ratingsCount,
          });

          // Agregar notificaciones al estado
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('❌ [USE WEBSOCKET] Error loading unread notifications from DB:', error);
    }
  };

  useEffect(() => {
    console.log('🔌 [USE WEBSOCKET] Setting up WebSocket connection...');

    // ⚠️ NO conectar automáticamente aquí - la conexión se maneja desde AuthProviderSimple.tsx
    // para evitar conexiones duplicadas y asegurar que el userId esté disponible
    console.log(
      '🔌 [USE WEBSOCKET] Skipping automatic connection - will be handled by AuthProvider'
    );

    // Cargar notificaciones no leídas cuando el componente se monta
    loadUnreadNotificationsFromDB();

    // Configurar event listeners
    const handleConnect = () => {
      setIsConnected(true);
      // Cuando se conecta, cargar notificaciones pendientes
      loadUnreadNotificationsFromDB();
    };
    const handleDisconnect = () => setIsConnected(false);

    const handleNotification = (data: any) => {
      try {
        console.log('🚨🚨🚨 [WEBSOCKET CLIENT] Notification received:', data);
        console.log('🚨 [WEBSOCKET CLIENT] Notification type:', data.type);

        // Validar que los datos sean válidos
        if (!data || typeof data !== 'object') {
          console.error('🚨 [WEBSOCKET CLIENT] Invalid notification data:', data);
          return;
        }

        // Validar campos requeridos
        if (!data.id || !data.title || !data.message) {
          console.error('🚨 [WEBSOCKET CLIENT] Notification missing required fields:', data);
          return;
        }

        console.log(
          '🚨 [WEBSOCKET CLIENT] Current notifications before adding:',
          notifications.length
        );

        // Usar callback seguro para actualizar estado
        setNotifications(prev => {
          try {
            // Verificar que prev sea un array válido
            const currentNotifications = Array.isArray(prev) ? prev : [];
            const newNotifications = [data, ...currentNotifications];
            console.log(
              '🚨 [WEBSOCKET CLIENT] New notifications array length:',
              newNotifications.length
            );
            return newNotifications;
          } catch (stateError) {
            console.error('🚨 [WEBSOCKET CLIENT] Error updating notifications state:', stateError);
            return prev; // Retornar estado anterior si hay error
          }
        });

        // Incrementar contador según el tipo de notificación
        try {
          const section = getNotificationSection(data.type);
          console.log('📊 [WEBSOCKET CLIENT] Notification type:', data.type, '→ Section:', section);

          switch (section) {
            case 'messages':
              console.log('📨 [WEBSOCKET CLIENT] Incrementing unread messages count');
              setUnreadMessagesCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
              break;
            case 'requests':
              console.log('📋 [WEBSOCKET CLIENT] Incrementing unread requests count');
              setUnreadRequestsCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
              break;
            case 'tickets':
              console.log('🎫 [WEBSOCKET CLIENT] Incrementing unread tickets count');
              setUnreadTicketsCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
              break;
            case 'ratings':
              console.log('⭐ [WEBSOCKET CLIENT] Incrementing unread ratings count');
              setUnreadRatingsCount(prev => (typeof prev === 'number' ? prev + 1 : 1));
              break;
            default:
              console.log(
                'ℹ️ [WEBSOCKET CLIENT] Notification type does not map to any sidebar section'
              );
          }
        } catch (countError) {
          console.error('🚨 [WEBSOCKET CLIENT] Error updating unread count:', countError);
        }
      } catch (error) {
        console.error('🚨🚨🚨 [WEBSOCKET CLIENT] CRITICAL ERROR in handleNotification:', error);
        console.error('🚨 [WEBSOCKET CLIENT] Notification data that caused error:', data);
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

  // Función para recargar contadores desde la base de datos (útil cuando se marca como leída)
  const refreshCounters = async () => {
    await loadUnreadNotificationsFromDB();
  };

  return {
    isConnected,
    notifications,
    messages,
    unreadMessagesCount,
    unreadRequestsCount,
    unreadTicketsCount,
    unreadRatingsCount,
    refreshCounters,
    sendMessage: websocketClient.sendMessage.bind(websocketClient),
    joinRoom: websocketClient.joinRoom.bind(websocketClient),
    leaveRoom: websocketClient.leaveRoom.bind(websocketClient),
    updatePresence: websocketClient.updatePresence.bind(websocketClient),
    clearNotifications: () => setNotifications([]),
  };
}

// Funciones de conveniencia
export const connectWebSocket = async (userId?: string, token?: string) =>
  await websocketClient.connect(userId, token);
export const disconnectWebSocket = () => websocketClient.disconnect();
export const isWebSocketConnected = () => websocketClient.isConnected;
