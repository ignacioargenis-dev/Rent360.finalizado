'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { websocketClient } from '@/lib/websocket/socket-client';
import { logger } from '@/lib/logger-minimal';

interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * Provider global para inicializar y gestionar la conexión WebSocket
 * Se conecta automáticamente cuando el usuario está autenticado
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Solo conectar si el usuario está autenticado y no está cargando
    if (!loading && user) {
      logger.info('Inicializando WebSocket client', { userId: user.id });

      // Conectar al WebSocket
      websocketClient.connect();

      // Escuchar notificaciones
      const handleNotification = (data: any) => {
        logger.info('Notificación recibida via WebSocket', { data });
        // Aquí puedes agregar lógica para mostrar toasts o actualizar contadores
        // Por ejemplo, usando el sistema de notificaciones existente
      };

      const handleConnect = () => {
        logger.info('WebSocket conectado exitosamente');
      };

      const handleDisconnect = () => {
        logger.warn('WebSocket desconectado');
      };

      // Registrar listeners
      websocketClient.on('connect', handleConnect);
      websocketClient.on('disconnect', handleDisconnect);
      websocketClient.on('notification', handleNotification);

      // Cleanup al desmontar
      return () => {
        websocketClient.off('connect', handleConnect);
        websocketClient.off('disconnect', handleDisconnect);
        websocketClient.off('notification', handleNotification);
        // No desconectamos aquí para mantener la conexión activa
        // Solo limpiamos los listeners
      };
    } else if (!loading && !user) {
      // Si no está autenticado, desconectar
      logger.info('Usuario no autenticado, desconectando WebSocket');
      websocketClient.disconnect();
      return undefined;
    }

    // Si está cargando, no hacer nada
    return undefined;
  }, [loading, user]);

  return <>{children}</>;
}
