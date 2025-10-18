import { logger } from './logger-minimal';

interface WebSocketMessage {
  type: 'notification' | 'update' | 'error' | 'ping' | 'pong';
  data?: any;
  userId?: string;
  timestamp: number;
}

interface WebSocketConnection {
  id: string;
  userId: string;
  role: string;
  socket: WebSocket;
  lastPing: number;
  isAlive: boolean;
}

class WebSocketManager {
  private connections = new Map<string, WebSocketConnection>();
  private userConnections = new Map<string, Set<string>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startPingInterval();
  }

  addConnection(connectionId: string, userId: string, role: string, socket: WebSocket) {
    const connection: WebSocketConnection = {
      id: connectionId,
      userId,
      role,
      socket,
      lastPing: Date.now(),
      isAlive: true
    };

    this.connections.set(connectionId, connection);

    // Agregar a las conexiones del usuario
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    // Configurar event listeners
    socket.on('message', (data) => {
      this.handleMessage(connectionId, data);
    });

    socket.on('close', () => {
      this.removeConnection(connectionId);
    });

    socket.on('error', (error) => {
      logger.error('WebSocket error:', { connectionId, userId, error });
      this.removeConnection(connectionId);
    });

    logger.info('WebSocket connection added', { connectionId, userId, role });
  }

  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remover de las conexiones del usuario
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    this.connections.delete(connectionId);
    logger.info('WebSocket connection removed', { connectionId, userId: connection.userId });
  }

  sendToUser(userId: string, message: WebSocketMessage) {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return;

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const connectionId of userConnections) {
      const connection = this.connections.get(connectionId);
      if (connection && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Error sending WebSocket message:', { connectionId, error });
          this.removeConnection(connectionId);
        }
      }
    }

    logger.debug('WebSocket message sent to user', { userId, sentCount, messageType: message.type });
  }

  sendToRole(role: string, message: WebSocketMessage) {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.role === role && connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          logger.error('Error sending WebSocket message to role:', { connectionId: connection.id, error });
          this.removeConnection(connection.id);
        }
      }
    }

    logger.debug('WebSocket message sent to role', { role, sentCount, messageType: message.type });
  }

  broadcast(message: WebSocketMessage) {
    let sentCount = 0;

    for (const connection of this.connections.values()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        try {
          connection.socket.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          logger.error('Error broadcasting WebSocket message:', { connectionId: connection.id, error });
          this.removeConnection(connection.id);
        }
      }
    }

    logger.debug('WebSocket message broadcasted', { sentCount, messageType: message.type });
  }

  private handleMessage(connectionId: string, data: any) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          connection.lastPing = Date.now();
          connection.isAlive = true;
          this.sendToConnection(connectionId, {
            type: 'pong',
            timestamp: Date.now()
          });
          break;
        
        case 'pong':
          connection.lastPing = Date.now();
          connection.isAlive = true;
          break;
        
        default:
          logger.debug('WebSocket message received', { connectionId, messageType: message.type });
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', { connectionId, error });
    }
  }

  private sendToConnection(connectionId: string, message: WebSocketMessage) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) return;

    try {
      connection.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error('Error sending WebSocket message to connection:', { connectionId, error });
      this.removeConnection(connectionId);
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 segundos

      for (const [connectionId, connection] of this.connections.entries()) {
        if (now - connection.lastPing > timeout) {
          logger.info('WebSocket connection timeout, removing', { connectionId, userId: connection.userId });
          this.removeConnection(connectionId);
        } else if (connection.socket.readyState === WebSocket.OPEN) {
          // Enviar ping
          this.sendToConnection(connectionId, {
            type: 'ping',
            timestamp: now
          });
        }
      }
    }, 10000); // Ping cada 10 segundos
  }

  getStats() {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      connectionsByRole: this.getConnectionsByRole(),
      averageConnectionsPerUser: this.userConnections.size > 0 ? 
        this.connections.size / this.userConnections.size : 0
    };
  }

  private getConnectionsByRole() {
    const roleCounts: Record<string, number> = {};
    
    for (const connection of this.connections.values()) {
      roleCounts[connection.role] = (roleCounts[connection.role] || 0) + 1;
    }
    
    return roleCounts;
  }

  destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Cerrar todas las conexiones
    for (const connection of this.connections.values()) {
      if (connection.socket.readyState === WebSocket.OPEN) {
        connection.socket.close();
      }
    }

    this.connections.clear();
    this.userConnections.clear();
  }
}

// Instancia global del WebSocket manager
export const wsManager = new WebSocketManager();

// Funciones de utilidad para notificaciones
export function sendNotificationToUser(userId: string, notification: any) {
  wsManager.sendToUser(userId, {
    type: 'notification',
    data: notification,
    userId,
    timestamp: Date.now()
  });
}

export function sendNotificationToRole(role: string, notification: any) {
  wsManager.sendToRole(role, {
    type: 'notification',
    data: notification,
    timestamp: Date.now()
  });
}

export function broadcastSystemUpdate(update: any) {
  wsManager.broadcast({
    type: 'update',
    data: update,
    timestamp: Date.now()
  });
}

export function sendErrorToUser(userId: string, error: any) {
  wsManager.sendToUser(userId, {
    type: 'error',
    data: error,
    userId,
    timestamp: Date.now()
  });
}

// Función para crear notificaciones estándar
export function createNotification(
  type: 'info' | 'success' | 'warning' | 'error',
  title: string,
  message: string,
  data?: any
) {
  return {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    title,
    message,
    data,
    timestamp: Date.now(),
    read: false
  };
}

// Función para enviar notificaciones de eventos del sistema
export function notifySystemEvent(
  event: string,
  userId?: string,
  role?: string,
  data?: any
) {
  const notification = createNotification(
    'info',
    'Evento del Sistema',
    `Nuevo evento: ${event}`,
    data
  );

  if (userId) {
    sendNotificationToUser(userId, notification);
  } else if (role) {
    sendNotificationToRole(role, notification);
  } else {
    broadcastSystemUpdate(notification);
  }
}

export default wsManager;
