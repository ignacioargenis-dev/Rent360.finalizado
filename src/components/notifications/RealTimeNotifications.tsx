'use client';

// 🚨 LOGS DE DEBUG PARA IDENTIFICAR DÓNDE FALLA EL COMPONENTE
console.log('🎯 [REAL TIME NOTIFICATIONS] FILE LOADED - STARTING IMPORTS');

import React, { useState, useEffect } from 'react';
console.log('🎯 [REAL TIME NOTIFICATIONS] React imported successfully');

import { logger } from '@/lib/logger-minimal';
console.log('🎯 [REAL TIME NOTIFICATIONS] Logger imported successfully');

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
console.log('🎯 [REAL TIME NOTIFICATIONS] UI components imported successfully');

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellOff,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  MessageSquare,
  DollarSign,
  FileText,
  Users,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
console.log('🎯 [REAL TIME NOTIFICATIONS] Lucide icons imported successfully');

import { useWebSocket } from '@/lib/websocket/socket-client';
console.log('🎯 [REAL TIME NOTIFICATIONS] useWebSocket imported successfully');

import { useToast } from '@/components/notifications/NotificationSystem';
console.log('🎯 [REAL TIME NOTIFICATIONS] useToast imported successfully');

interface NotificationItem {
  id: string;
  type: string; // Cambiar a string para aceptar cualquier tipo
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high';
  timestamp: Date;
  read?: boolean;
}

export default function RealTimeNotifications() {
  console.log('🎯 [REAL TIME NOTIFICATIONS] FUNCTION CALLED - COMPONENT MOUNTING');

  // Log inmediato para confirmar que el componente se ejecuta
  console.log('🎯 [REAL TIME NOTIFICATIONS] COMPONENT EXECUTING RIGHT NOW');

  console.log('🎯 [REAL TIME NOTIFICATIONS] About to execute hooks...');

  // Mover hooks fuera del try-catch para cumplir con las reglas de React
  console.log('🎯 [REAL TIME NOTIFICATIONS] Executing useState hooks...');
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  console.log('🎯 [REAL TIME NOTIFICATIONS] useState hooks executed successfully');

  console.log('🎯 [REAL TIME NOTIFICATIONS] About to execute useWebSocket hook...');
  const {
    isConnected,
    notifications: wsNotifications,
    unreadMessagesCount,
    unreadRequestsCount,
    unreadTicketsCount,
    unreadRatingsCount,
    refreshCounters,
  } = useWebSocket();
  console.log('🎯 [REAL TIME NOTIFICATIONS] useWebSocket hook executed successfully');

  console.log('🎯 [REAL TIME NOTIFICATIONS] About to execute useToast hook...');
  const { success } = useToast();
  console.log('🎯 [REAL TIME NOTIFICATIONS] useToast hook executed successfully');

  console.log(
    '🎯 [REAL TIME NOTIFICATIONS] All hooks executed successfully - proceeding to useEffect'
  );

  console.log('🎯 [REAL TIME NOTIFICATIONS] useWebSocket hook result:', {
    isConnected,
    wsNotificationsCount: wsNotifications?.length,
    unreadMessagesCount,
    unreadRequestsCount,
    unreadTicketsCount,
    unreadRatingsCount,
  });

  console.log('🎯 [REAL TIME NOTIFICATIONS] COMPONENT RENDERED AT:', new Date().toISOString());
  console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Component render:', {
    isConnected,
    wsNotificationsLength: wsNotifications?.length,
    unreadMessagesCount,
    unreadRequestsCount,
    unreadTicketsCount,
    unreadRatingsCount,
    localNotificationsLength: localNotifications.length,
  });

  // Log adicional para verificar que el componente se está ejecutando
  console.log('🎯 [REAL TIME NOTIFICATIONS] === COMPONENT IS ACTIVE ===');
  console.log('🎯 [REAL TIME NOTIFICATIONS] Current state:', {
    showPanel,
    unreadCount,
    isConnected,
    hasNotifications: localNotifications.length > 0,
  });

  // Función para validar y normalizar timestamp
  const parseTimestamp = (ts: any): Date => {
    if (!ts) {
      return new Date();
    }
    if (ts instanceof Date) {
      return ts;
    }
    if (typeof ts === 'number') {
      return new Date(ts);
    }
    if (typeof ts === 'string') {
      const parsed = new Date(ts);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date(); // fallback para cualquier otro tipo
  };

  // Estado para rastrear notificaciones procesadas y evitar duplicados
  // Usar sessionStorage para persistir entre re-renders
  const getProcessedIds = (): Set<string> => {
    if (typeof window === 'undefined') {
      return new Set<string>();
    }
    try {
      const stored = sessionStorage.getItem('processed_notification_ids');
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const saveProcessedIds = (ids: Set<string>) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      sessionStorage.setItem('processed_notification_ids', JSON.stringify([...ids]));
    } catch (error) {
      console.error('Error saving processed notification IDs:', error);
    }
  };

  const [processedNotificationIds, setProcessedNotificationIds] =
    useState<Set<string>>(getProcessedIds());

  // Procesar notificaciones que llegan desde WebSocket - UN SOLO useEffect para evitar duplicados
  useEffect(() => {
    if (!wsNotifications || wsNotifications.length === 0) {
      return;
    }

    console.log(
      '🚨🚨🚨 [REAL TIME NOTIFICATIONS] Processing WebSocket notifications - useEffect triggered'
    );
    console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] wsNotifications length:', wsNotifications.length);

    // Filtrar notificaciones que ya han sido procesadas usando el Set de IDs procesados
    const unprocessedNotifications = wsNotifications.filter(
      wsNotif => wsNotif.id && !processedNotificationIds.has(wsNotif.id)
    );

    if (unprocessedNotifications.length === 0) {
      console.log('🚨 [REAL TIME NOTIFICATIONS] All notifications already processed');
      return;
    }

    console.log(
      '🚨🚨🚨 [REAL TIME NOTIFICATIONS] Processing',
      unprocessedNotifications.length,
      'new notifications'
    );

    const newNotifications = unprocessedNotifications
      .map((wsNotif: any) => {
        try {
          // Validar campos requeridos
          if (!wsNotif || typeof wsNotif !== 'object' || !wsNotif.id) {
            return null;
          }

          if (!wsNotif.title && !wsNotif.message) {
            return null;
          }

          return {
            id: wsNotif.id,
            type: wsNotif.type || 'unknown',
            title: wsNotif.title || 'Nueva notificación',
            message: wsNotif.message || '',
            link: wsNotif.link || undefined,
            priority: typeof wsNotif.priority === 'string' ? wsNotif.priority : 'medium',
            timestamp: parseTimestamp(wsNotif.timestamp),
            read: false,
          };
        } catch (error) {
          console.error(
            '🚨 [REAL TIME NOTIFICATIONS] Error processing notification:',
            error,
            wsNotif
          );
          return null;
        }
      })
      .filter(notification => notification !== null) as NotificationItem[];

    if (newNotifications.length === 0) {
      return;
    }

    // Actualizar estado evitando duplicados
    setLocalNotifications(prev => {
      const existingIds = new Set(prev.map(n => n.id));
      const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
      return [...uniqueNew, ...prev].slice(0, 100); // Limitar a 100 notificaciones
    });

    // Actualizar contador
    setUnreadCount(prev => prev + newNotifications.length);

    // Marcar como procesadas
    setProcessedNotificationIds(prev => {
      const newSet = new Set(prev);
      newNotifications.forEach(notif => {
        if (notif.id) {
          newSet.add(notif.id);
        }
      });
      saveProcessedIds(newSet);
      return newSet;
    });

    // Mostrar toast solo para alta prioridad
    const highPriorityNotif = newNotifications.find(n => n.priority === 'high');
    if (highPriorityNotif) {
      success('Notificación importante', highPriorityNotif.title);
    }
  }, [wsNotifications, processedNotificationIds, success]);

  // Cargar notificaciones desde la base de datos al iniciar (para usuarios que estaban desconectados)
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        console.log(
          '📥 [REAL TIME NOTIFICATIONS] Loading unread notifications from DB on mount...'
        );
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
              '📥 [REAL TIME NOTIFICATIONS] Loaded',
              data.data.length,
              'unread notifications from DB'
            );

            // Convertir notificaciones de BD al formato local
            const dbNotifications: NotificationItem[] = data.data
              .map((n: any) => {
                try {
                  return {
                    id: n.id,
                    type: n.type || 'unknown',
                    title: n.title || 'Nueva notificación',
                    message: n.message || '',
                    link: n.link || undefined,
                    priority: typeof n.priority === 'string' ? n.priority : 'medium',
                    timestamp: parseTimestamp(n.createdAt || n.timestamp),
                    read: n.isRead || false,
                  };
                } catch (error) {
                  console.error('Error processing DB notification:', error, n);
                  return null;
                }
              })
              .filter((n: any) => n !== null) as NotificationItem[];

            // Actualizar estado local con notificaciones de BD
            setLocalNotifications(dbNotifications);
            setUnreadCount(dbNotifications.filter(n => !n.read).length);

            // Marcar como procesadas
            setProcessedNotificationIds(prev => {
              const newSet = new Set(prev);
              dbNotifications.forEach(notif => {
                if (notif.id) {
                  newSet.add(notif.id);
                }
              });
              saveProcessedIds(newSet);
              return newSet;
            });

            // Guardar en localStorage para persistencia
            try {
              localStorage.setItem('rent360_notifications', JSON.stringify(dbNotifications));
            } catch (storageError) {
              console.error('Error saving to localStorage:', storageError);
            }
          }
        }
      } catch (error) {
        console.error(
          '❌ [REAL TIME NOTIFICATIONS] Error loading from DB, trying localStorage:',
          error
        );
        // Fallback: cargar desde localStorage si falla la BD
        const savedNotifications = localStorage.getItem('rent360_notifications');
        if (savedNotifications) {
          try {
            const parsed = JSON.parse(savedNotifications);
            const notificationsWithDates = parsed
              .map((n: any) => {
                try {
                  const timestamp = parseTimestamp(n.timestamp);
                  return {
                    ...n,
                    timestamp,
                  };
                } catch (error) {
                  return null;
                }
              })
              .filter((n: any) => n !== null);

            setLocalNotifications(notificationsWithDates);
            setUnreadCount(notificationsWithDates.filter((n: NotificationItem) => !n.read).length);
          } catch (parseError) {
            console.error('Error parsing localStorage notifications:', parseError);
            localStorage.removeItem('rent360_notifications');
          }
        }
      }
    };

    loadInitialNotifications();
  }, []);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    if (localNotifications.length > 0) {
      try {
        localStorage.setItem('rent360_notifications', JSON.stringify(localNotifications));
      } catch (error) {
        console.error(
          '🚨 [REAL TIME NOTIFICATIONS] Error saving notifications to localStorage:',
          error
        );
      }
    }
  }, [localNotifications]);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    if (localNotifications.length > 0) {
      localStorage.setItem('rent360_notifications', JSON.stringify(localNotifications));
    }
  }, [localNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Actualizar estado local inmediatamente
      setLocalNotifications(prev =>
        prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Enviar al servidor
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      // Recargar contadores desde la base de datos para mantener sincronización
      if (refreshCounters) {
        await refreshCounters();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Actualizar estado local inmediatamente
      setLocalNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);

      // Enviar al servidor
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });

      // Recargar contadores desde la base de datos
      if (refreshCounters) {
        await refreshCounters();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const deletedNotif = localNotifications.find(n => n.id === notificationId);
      const wasUnread = deletedNotif && !deletedNotif.read;

      // Actualizar estado local inmediatamente
      setLocalNotifications(prev => {
        const updated = prev.filter(notif => notif.id !== notificationId);
        localStorage.setItem('rent360_notifications', JSON.stringify(updated));
        return updated;
      });

      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Enviar al servidor
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      // Recargar contadores desde la base de datos
      if (refreshCounters) {
        await refreshCounters();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Actualizar estado local inmediatamente
      setLocalNotifications([]);
      setUnreadCount(0);
      localStorage.removeItem('rent360_notifications');

      // Marcar todas como leídas en el servidor
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });

      // Recargar contadores desde la base de datos
      if (refreshCounters) {
        await refreshCounters();
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract_created':
      case 'contract_signed':
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case 'payment_received':
      case 'payment_overdue':
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case 'message_received':
      case 'NEW_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-emerald-600" />;
      case 'property_updated':
        return <Settings className="h-4 w-4 text-emerald-600" />;
      case 'system_alert':
      case 'SYSTEM_ALERT':
        return <AlertCircle className="h-4 w-4 text-emerald-600" />;
      case 'invitation_received':
      case 'INVITATION_RECEIVED':
        return <Users className="h-4 w-4 text-emerald-600" />;
      default:
        return <Info className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
      case 'medium':
        return 'border-l-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/15';
      case 'low':
        return 'border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10';
      default:
        return 'border-l-emerald-300 bg-emerald-50/30 dark:bg-emerald-900/10';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    // Validar que el timestamp sea un Date válido
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      console.warn(
        '🚨 [REAL TIME NOTIFICATIONS] Invalid timestamp provided to formatTimestamp:',
        timestamp
      );
      return 'Fecha desconocida';
    }

    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
      return 'Ahora';
    }
    if (minutes < 60) {
      return `Hace ${minutes}m`;
    }
    if (hours < 24) {
      return `Hace ${hours}h`;
    }
    if (days < 7) {
      return `Hace ${days}d`;
    }

    try {
      return timestamp.toLocaleDateString();
    } catch (error) {
      console.error('🚨 [REAL TIME NOTIFICATIONS] Error formatting date:', error, timestamp);
      return 'Fecha inválida';
    }
  };

  // Calcular total de notificaciones no leídas
  const totalUnreadNotifications =
    unreadMessagesCount + unreadRequestsCount + unreadTicketsCount + unreadRatingsCount;

  console.log('🎯 [REAL TIME NOTIFICATIONS] Rendering button, total unread:', {
    totalUnreadNotifications,
    unreadMessagesCount,
    unreadRequestsCount,
    unreadTicketsCount,
    unreadRatingsCount,
  });

  try {
    return (
      <>
        {/* Botón de notificaciones */}
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => {
            console.log('🎯 [REAL TIME NOTIFICATIONS] Button clicked, toggling panel');
            setShowPanel(!showPanel);
          }}
        >
          <Bell className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          {totalUnreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-600 text-white border-0">
              {totalUnreadNotifications > 99 ? '99+' : totalUnreadNotifications}
            </Badge>
          )}
        </Button>

        {/* Estado de conexión WebSocket */}
        <div className="flex items-center gap-2 ml-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-emerald-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </div>

        {/* Panel de notificaciones */}
        {showPanel && (
          <Card className="absolute top-8 right-0 w-96 shadow-lg border border-emerald-200 dark:border-emerald-800 z-50 bg-white dark:bg-gray-900 flex flex-col max-h-[600px] overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900 border-b border-emerald-200 dark:border-emerald-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                    <Bell className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notificaciones
                    </CardTitle>
                    {totalUnreadNotifications > 0 && (
                      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                        {totalUnreadNotifications} sin leer
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalUnreadNotifications > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 dark:text-emerald-400"
                    >
                      Marcar todas
                    </Button>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}
                  />
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {localNotifications.length === 0 ? (
                <div className="text-center py-8 flex-shrink-0">
                  <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <>
                  <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                    <div className="p-2 space-y-3">
                      {localNotifications
                        .filter(
                          notification => notification && notification.id && notification.timestamp
                        )
                        .map(notification => (
                          <div
                            key={notification.id}
                            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800 overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                              !notification.read
                                ? 'ring-2 ring-emerald-500/20 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800'
                                : 'hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                            }`}
                          >
                            {/* Indicador de no leído */}
                            {!notification.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600" />
                            )}

                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Icono con fondo circular */}
                                <div
                                  className={`flex-shrink-0 p-2 rounded-full ${
                                    !notification.read
                                      ? 'bg-emerald-100 dark:bg-emerald-900/40'
                                      : 'bg-emerald-50 dark:bg-emerald-900/20'
                                  }`}
                                >
                                  <div
                                    className={`${
                                      !notification.read
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-emerald-600 dark:text-emerald-500'
                                    }`}
                                  >
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Header con título y punto de no leído */}
                                  <div className="flex items-start justify-between mb-2">
                                    <h4
                                      className={`text-sm font-semibold truncate pr-2 ${
                                        !notification.read
                                          ? 'text-gray-900 dark:text-white'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}
                                    >
                                      {notification.title}
                                    </h4>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1 animate-pulse" />
                                    )}
                                  </div>

                                  {/* Mensaje */}
                                  <p
                                    className={`text-sm leading-relaxed mb-3 ${
                                      !notification.read
                                        ? 'text-gray-700 dark:text-gray-200'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    {notification.message}
                                  </p>

                                  {/* Footer con timestamp y acciones */}
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      {formatTimestamp(notification.timestamp)}
                                    </span>

                                    <div className="flex items-center gap-1">
                                      {!notification.read && (
                                        <button
                                          onClick={() => markAsRead(notification.id)}
                                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 dark:text-emerald-400 rounded-full transition-colors"
                                          title="Marcar como leída"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => deleteNotification(notification.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                        title="Eliminar notificación"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="border-t border-emerald-200 dark:border-emerald-800">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50">
                      <button
                        onClick={clearAllNotifications}
                        className="w-full py-3 px-4 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        🗑️ Limpiar todas las notificaciones
                      </button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </>
    );
  } catch (error) {
    console.error('🚨🚨🚨 [REAL TIME NOTIFICATIONS] ERROR in component:', error);
    console.error('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });

    // Return a fallback UI
    return (
      <div style={{ background: 'red', color: 'white', padding: '10px', margin: '10px' }}>
        ❌ RealTimeNotifications Error: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
}
