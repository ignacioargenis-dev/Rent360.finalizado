'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { logger } from '@/lib/logger-minimal';

interface WebSocketMessage {
  type: 'notification' | 'update' | 'error' | 'ping' | 'pong';
  data?: any;
  userId?: string;
  timestamp: number;
}

interface WebSocketHookOptions {
  userId: string;
  role: string;
  onNotification?: (notification: any) => void;
  onUpdate?: (update: any) => void;
  onError?: (error: any) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket({
  userId,
  role,
  onNotification,
  onUpdate,
  onError,
  autoReconnect = true,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: WebSocketHookOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // En desarrollo, usar WebSocket local
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3000/ws'
        : `wss://${window.location.host}/ws`;

      const ws = new WebSocket(`${wsUrl}?userId=${userId}&role=${role}`);
      
      ws.onopen = () => {
        logger.info('WebSocket connected', { userId, role });
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        
        // Iniciar ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
            lastPingRef.current = Date.now();
          }
        }, 30000); // Ping cada 30 segundos
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              if (onNotification) {
                onNotification(message.data);
              }
              break;
            
            case 'update':
              if (onUpdate) {
                onUpdate(message.data);
              }
              break;
            
            case 'error':
              if (onError) {
                onError(message.data);
              }
              break;
            
            case 'pong':
              // Respuesta al ping, actualizar timestamp
              lastPingRef.current = Date.now();
              break;
            
            default:
              logger.debug('WebSocket message received', { type: message.type });
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        logger.info('WebSocket disconnected', { userId, code: event.code, reason: event.reason });
        setIsConnected(false);
        
        // Limpiar ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Intentar reconectar si está habilitado
        if (autoReconnect && reconnectAttempts < maxReconnectAttempts) {
          setReconnectAttempts(prev => prev + 1);
          setConnectionError(`Reconectando... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('No se pudo reconectar después de varios intentos');
        }
      };

      ws.onerror = (error) => {
        logger.error('WebSocket error:', { userId, error });
        setConnectionError('Error de conexión WebSocket');
      };

      wsRef.current = ws;
    } catch (error) {
      logger.error('Error creating WebSocket connection:', error);
      setConnectionError('Error al crear conexión WebSocket');
    }
  }, [userId, role, onNotification, onUpdate, onError, autoReconnect, reconnectInterval, maxReconnectAttempts, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
    setReconnectAttempts(0);
  }, []);

  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        timestamp: Date.now()
      };
      
      wsRef.current.send(JSON.stringify(fullMessage));
      return true;
    }
    
    logger.warn('WebSocket not connected, cannot send message');
    return false;
  }, []);

  const sendNotification = useCallback((notification: any) => {
    return sendMessage({
      type: 'notification',
      data: notification,
      userId
    });
  }, [sendMessage, userId]);

  const sendUpdate = useCallback((update: any) => {
    return sendMessage({
      type: 'update',
      data: update
    });
  }, [sendMessage]);

  // Conectar al montar el componente
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    reconnectAttempts,
    sendMessage,
    sendNotification,
    sendUpdate,
    connect,
    disconnect
  };
}
