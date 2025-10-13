'use client';

import { logger } from '@/lib/logger-minimal';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  autoConnect?: boolean
  enableNotifications?: boolean
}

interface Notification {
  id: string
  type: string
  message: string
  data?: any
  timestamp: string
  read: boolean
}

export const useSocket = (options: UseSocketOptions = {}) => {
  const { autoConnect = true, enableNotifications = true } = options;
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}

    // Obtener token de autenticación
    const getToken = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          return user.token;
        }
      } catch (error) {
        logger.error('Error getting token:', { error: error instanceof Error ? error.message : String(error) });
      }
      return null;
    };

    const token = getToken();
    if (!token) {
return;
}

    // Configurar conexión Socket.IO
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    socketRef.current = io(socketUrl, {
      auth: {
        token,
      },
      autoConnect,
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    // Manejar conexión
    socket.on('connect', () => {
      logger.info('Socket connected');
      setIsConnected(true);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      logger.info('Socket disconnected');
      setIsConnected(false);
    });

    // Manejar error de conexión
    socket.on('connect_error', (error) => {
      logger.error('Socket connection error:', { error: error instanceof Error ? error.message : String(error) });
      setIsConnected(false);
      
      // Intentar reconexión automática después de un delay
      setTimeout(() => {
        if (socketRef.current && !socketRef.current.connected) {
          logger.info('Attempting to reconnect...');
          socketRef.current.connect();
        }
      }, 5000);
    });

    // Manejar notificaciones generales
    if (enableNotifications) {
      socket.on('notification', (data) => {
        const newNotification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          type: data.type,
          message: data.message,
          data: data.data,
          timestamp: data.timestamp,
          read: false,
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Mostrar notificación del navegador si está disponible
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Rent360 - Nueva Notificación', {
            body: data.message,
            icon: '/favicon.ico',
          });
        }
      });
    }

    // Manejar notificaciones de propiedades
    socket.on('property:notification', (data) => {
      const newNotification: Notification = {
        id: `prop_${Date.now()}_${Math.random()}`,
        type: data.type,
        message: data.message,
        data: data.data,
        timestamp: data.timestamp,
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rent360 - Actualización de Propiedad', {
          body: data.message,
          icon: '/favicon.ico',
        });
      }
    });

    // Manejar notificaciones de tickets
    socket.on('ticket:notification', (data) => {
      const newNotification: Notification = {
        id: `ticket_${Date.now()}_${Math.random()}`,
        type: data.type,
        message: data.message,
        data: data.data,
        timestamp: data.timestamp,
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rent360 - Actualización de Ticket', {
          body: data.message,
          icon: '/favicon.ico',
        });
      }
    });

    // Manejar mensajes directos
    socket.on('dm:received', (data) => {
      const newNotification: Notification = {
        id: `dm_${Date.now()}_${Math.random()}`,
        type: 'direct_message',
        message: `Nuevo mensaje de ${data.fromUserName}`,
        data: data,
        timestamp: data.timestamp,
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Rent360 - Nuevo Mensaje', {
          body: `Tienes un nuevo mensaje de ${data.fromUserName}`,
          icon: '/favicon.ico',
        });
      }
    });

    // Manejar conexión establecida
    socket.on('connection:established', (data) => {
      logger.info('Socket connection established:', { data });
    });

    // Solicitar permiso para notificaciones del navegador
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [autoConnect, enableNotifications]);

  // Funciones para interactuar con el socket
  const joinProperty = (propertyId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join:property', propertyId);
    }
  };

  const leaveProperty = (propertyId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:property', propertyId);
    }
  };

  const joinTicket = (ticketId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('join:ticket', ticketId);
    }
  };

  const leaveTicket = (ticketId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:ticket', ticketId);
    }
  };

  const sendDirectMessage = (toUserId: string, message: string, type = 'text') => {
    if (socketRef.current) {
      socketRef.current.emit('send:dm', { toUserId, message, type });
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif,
      ),
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return {
    socket: socketRef.current,
    isConnected,
    notifications,
    unreadCount,
    joinProperty,
    leaveProperty,
    joinTicket,
    leaveTicket,
    sendDirectMessage,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  };
};

export default useSocket;
