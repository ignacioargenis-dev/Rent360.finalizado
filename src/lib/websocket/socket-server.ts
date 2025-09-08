import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../logger';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface NotificationData {
  id: string;
  type: 'contract_created' | 'payment_received' | 'message_received' | 'property_updated' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp: Date;
}

class WebSocketServer {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private reconnectingUsers: Map<string, NodeJS.Timeout> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  initialize(httpServer: HTTPServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      // Configuración de reconexión
      pingTimeout: 60000, // 60 segundos
      pingInterval: 25000, // 25 segundos
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e8,
      allowEIO3: true,
      // Configuración de reconexión del cliente
      connectTimeout: 20000,
      forceNew: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    logger.info('WebSocket server initialized');
  }

  private setupMiddleware(): void {
    if (!this.io) return;

    // Middleware de autenticación
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verificar token JWT
        const decoded = jwt.verify(token as string, process.env.JWT_SECRET || 'default-secret') as any;

        // Adjuntar información del usuario al socket
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      const userRole = socket.userRole!;

      logger.info('User connected to WebSocket', {
        userId,
        userRole,
        socketId: socket.id
      });

      // Registrar usuario conectado
      this.connectedUsers.set(userId, socket);

      // Unirse a salas específicas
      socket.join(`user:${userId}`);
      socket.join(`role:${userRole}`);

      // Manejar eventos del cliente
      socket.on('join-room', (roomName: string) => {
        socket.join(roomName);
        logger.info('User joined room', { userId, roomName });
      });

      socket.on('leave-room', (roomName: string) => {
        socket.leave(roomName);
        logger.info('User left room', { userId, roomName });
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date() });
      });

      // Manejar mensajes de chat
      socket.on('send-message', (data: any) => {
        this.handleChatMessage(socket, data);
      });

      // Manejar actualización de presencia
      socket.on('update-presence', (data: any) => {
        this.handlePresenceUpdate(socket, data);
      });

      // Manejar desconexión
      socket.on('disconnect', (reason) => {
        logger.info('User disconnected from WebSocket', {
          userId,
          reason,
          socketId: socket.id
        });

        this.connectedUsers.delete(userId);
      });
    });
  }

  // Enviar notificación a un usuario específico
  sendToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to user', { userId, event });
  }

  // Enviar notificación a todos los usuarios con un rol específico
  sendToRole(role: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to role', { role, event });
  }

  // Enviar notificación a todos los usuarios conectados
  broadcast(event: string, data: any): void {
    if (!this.io) return;

    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Broadcast notification sent', { event });
  }

  // Enviar notificación a una sala específica
  sendToRoom(roomName: string, event: string, data: any): void {
    if (!this.io) return;

    this.io.to(roomName).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to room', { roomName, event });
  }

  // Manejar mensajes de chat
  private handleChatMessage(socket: AuthenticatedSocket, data: any): void {
    const { toUserId, message, conversationId } = data;

    // Enviar mensaje al destinatario
    this.sendToUser(toUserId, 'new-message', {
      fromUserId: socket.userId,
      message,
      conversationId,
      timestamp: new Date()
    });

    // Confirmar envío al remitente
    socket.emit('message-sent', {
      toUserId,
      message,
      conversationId,
      timestamp: new Date()
    });

    logger.info('Chat message sent', {
      fromUserId: socket.userId,
      toUserId,
      conversationId
    });
  }

  // Manejar actualizaciones de presencia
  private handlePresenceUpdate(socket: AuthenticatedSocket, data: any): void {
    const { status, lastSeen } = data;

    // Notificar a otros usuarios sobre el cambio de presencia
    socket.to('presence-updates').emit('user-presence-changed', {
      userId: socket.userId,
      status,
      lastSeen: lastSeen || new Date()
    });

    logger.info('User presence updated', {
      userId: socket.userId,
      status
    });
  }

  // Obtener estadísticas de conexiones
  getConnectionStats(): {
    totalConnections: number;
    connectedUsers: number;
    activeRooms: number;
  } {
    if (!this.io) {
      return { totalConnections: 0, connectedUsers: 0, activeRooms: 0 };
    }

    const rooms = this.io.sockets.adapter.rooms;
    const activeRooms = Array.from(rooms.keys()).filter(room =>
      !room.startsWith('/#') // Excluir rooms de socket individuales
    ).length;

    return {
      totalConnections: this.io.sockets.sockets.size,
      connectedUsers: this.connectedUsers.size,
      activeRooms
    };
  }

  // Verificar si un usuario está conectado
  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Obtener lista de usuarios conectados
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Cerrar servidor WebSocket
  close(): void {
    if (this.io) {
      this.io.close();
      this.io = null;
      this.connectedUsers.clear();
      logger.info('WebSocket server closed');
    }
  }
}

// Instancia singleton
export const websocketServer = new WebSocketServer();

// Funciones de conveniencia para enviar notificaciones
export const sendNotification = (userId: string, type: string, data: any) => {
  websocketServer.sendToUser(userId, 'notification', { type, ...data });
};

export const sendContractNotification = (userId: string, contractData: any) => {
  websocketServer.sendToUser(userId, 'contract-update', contractData);
};

export const sendPaymentNotification = (userId: string, paymentData: any) => {
  websocketServer.sendToUser(userId, 'payment-update', paymentData);
};

export const broadcastSystemAlert = (alertData: any) => {
  websocketServer.broadcast('system-alert', alertData);
};

export const sendToAdmins = (event: string, data: any) => {
  websocketServer.sendToRole('ADMIN', event, data);
};
