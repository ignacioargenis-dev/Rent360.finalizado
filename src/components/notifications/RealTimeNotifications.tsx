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
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { isConnected, notifications: wsNotifications, unreadMessagesCount } = useWebSocket();
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
  });

  console.log('🎯 [REAL TIME NOTIFICATIONS] COMPONENT RENDERED AT:', new Date().toISOString());
  console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Component render:', {
    isConnected,
    wsNotificationsLength: wsNotifications?.length,
    unreadMessagesCount,
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

  // Procesar notificaciones que llegan desde WebSocket
  useEffect(() => {
    console.log(
      '🚨🚨🚨 [REAL TIME NOTIFICATIONS] Processing WebSocket notifications - useEffect triggered'
    );
    console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] wsNotifications:', wsNotifications);
    console.log(
      '🚨🚨🚨 [REAL TIME NOTIFICATIONS] wsNotifications length:',
      wsNotifications?.length
    );

    if (wsNotifications && wsNotifications.length > 0) {
      console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Found notifications to process!');

      const newNotifications = wsNotifications
        .map((wsNotif: any) => {
          try {
            console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Processing notification:', wsNotif);

            // Validar campos requeridos
            if (!wsNotif || typeof wsNotif !== 'object') {
              console.error('🚨 [REAL TIME NOTIFICATIONS] Invalid notification object:', wsNotif);
              return null;
            }

            if (!wsNotif.title && !wsNotif.message) {
              console.error(
                '🚨 [REAL TIME NOTIFICATIONS] Notification missing title and message:',
                wsNotif
              );
              return null;
            }

            return {
              id: wsNotif.id || `ws_${Date.now()}_${Math.random()}`,
              type: wsNotif.type || 'unknown',
              title: wsNotif.title || 'Nueva notificación',
              message: wsNotif.message || '',
              // No guardar el objeto completo para evitar problemas de serialización
              link: wsNotif.link || undefined,
              priority: typeof wsNotif.priority === 'string' ? wsNotif.priority : 'medium',
              timestamp: parseTimestamp(wsNotif.timestamp),
              read: false,
            };
          } catch (error) {
            console.error(
              '🚨 [REAL TIME NOTIFICATIONS] Error processing individual notification:',
              error,
              wsNotif
            );
            return null;
          }
        })
        .filter(notification => notification !== null); // Filtrar notificaciones inválidas

      console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Created new notifications:', newNotifications);

      setLocalNotifications(prev => {
        // Evitar duplicados
        const existingIds = prev.map(n => n.id);
        const uniqueNew = newNotifications.filter(n => !existingIds.includes(n.id));
        console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Unique new notifications:', uniqueNew.length);
        const result = [...uniqueNew, ...prev];
        console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Final notifications list:', result.length);
        return result;
      });

      // Incrementar contador de no leídas
      console.log(
        '🚨🚨🚨 [REAL TIME NOTIFICATIONS] Incrementing unread count by:',
        newNotifications.length
      );
      setUnreadCount(prev => {
        const newCount = prev + newNotifications.length;
        console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] New unread count:', newCount);
        return newCount;
      });
    } else {
      console.log(
        '🚨🚨🚨 [REAL TIME NOTIFICATIONS] No notifications to process or wsNotifications is empty'
      );
    }
  }, [wsNotifications]);

  // Cargar notificaciones desde localStorage al iniciar
  useEffect(() => {
    const savedNotifications = localStorage.getItem('rent360_notifications');
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        const notificationsWithDates = parsed
          .map((n: any) => {
            try {
              // Validar y convertir timestamp de forma segura
              const timestamp = parseTimestamp(n.timestamp);
              return {
                ...n,
                timestamp,
              };
            } catch (error) {
              console.error(
                '🚨 [REAL TIME NOTIFICATIONS] Error parsing saved notification timestamp:',
                error,
                n
              );
              return null;
            }
          })
          .filter((n: any) => n !== null); // Filtrar notificaciones inválidas

        setLocalNotifications(notificationsWithDates);
        setUnreadCount(notificationsWithDates.filter((n: NotificationItem) => !n.read).length);

        // Marcar las notificaciones cargadas como procesadas para evitar reprocesamiento
        setProcessedNotificationIds(prev => {
          const newSet = new Set(prev);
          notificationsWithDates.forEach((notif: NotificationItem) => {
            if (notif.id) {
              newSet.add(notif.id);
            }
          });
          return newSet;
        });
      } catch (error) {
        console.error(
          '🚨 [REAL TIME NOTIFICATIONS] Error loading notifications from localStorage:',
          error
        );
        // Limpiar localStorage corrupto
        localStorage.removeItem('rent360_notifications');
      }
    }
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

  // Estado para rastrear notificaciones procesadas y evitar duplicados
  // Usar sessionStorage para persistir entre re-renders
  const getProcessedIds = (): Set<string> => {
    try {
      const stored = sessionStorage.getItem('processed_notification_ids');
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const saveProcessedIds = (ids: Set<string>) => {
    try {
      sessionStorage.setItem('processed_notification_ids', JSON.stringify([...ids]));
    } catch (error) {
      console.error('Error saving processed notification IDs:', error);
    }
  };

  const [processedNotificationIds, setProcessedNotificationIds] =
    useState<Set<string>>(getProcessedIds());

  // Manejar nuevas notificaciones desde WebSocket
  useEffect(() => {
    if (wsNotifications.length > 0) {
      // Filtrar notificaciones que ya han sido procesadas
      const unprocessedNotifications = wsNotifications.filter(
        wsNotif => wsNotif.id && !processedNotificationIds.has(wsNotif.id)
      );

      if (unprocessedNotifications.length === 0) {
        console.log('🚨 [REAL TIME NOTIFICATIONS] All notifications already processed');
        return;
      }

      console.log(
        '🚨 [REAL TIME NOTIFICATIONS] Processing new notifications:',
        unprocessedNotifications.length
      );

      const newNotifications: NotificationItem[] = unprocessedNotifications.map(wsNotif => ({
        id: wsNotif.id || `notif_${Date.now()}_${Math.random()}`,
        type: wsNotif.type || 'system_alert',
        title: wsNotif.title || 'Nueva Notificación',
        message: wsNotif.message || wsNotif.content || 'Tienes una nueva notificación',
        data: wsNotif.data,
        priority: wsNotif.priority || 'medium',
        timestamp: parseTimestamp(wsNotif.timestamp),
        read: false,
      }));

      setLocalNotifications(prev => {
        const updated = [...newNotifications, ...prev];
        // Limitar a 100 notificaciones
        return updated.slice(0, 100);
      });

      setUnreadCount(prev => prev + newNotifications.length);

      // Marcar estas notificaciones como procesadas
      setProcessedNotificationIds(prev => {
        const newSet = new Set(prev);
        newNotifications.forEach(notif => {
          if (notif.id) {
            newSet.add(notif.id);
          }
        });
        // Guardar en sessionStorage
        saveProcessedIds(newSet);
        return newSet;
      });

      // Mostrar notificación del sistema si es importante
      const highPriorityNotif = newNotifications.find(n => n.priority === 'high');
      if (highPriorityNotif) {
        console.log(
          '🚨🚨🚨 [REAL TIME NOTIFICATIONS] Showing high priority toast:',
          highPriorityNotif.title
        );
        success('Notificación', highPriorityNotif.title);
      }

      // Mostrar toast para todas las notificaciones nuevas
      console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Showing toast for new notifications');
      success('Nueva notificación', `Tienes ${newNotifications.length} nueva(s) notificación(es)`);
    }
  }, [wsNotifications, success]);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    if (localNotifications.length > 0) {
      localStorage.setItem('rent360_notifications', JSON.stringify(localNotifications));
    }
  }, [localNotifications]);

  const markAsRead = (notificationId: string) => {
    setLocalNotifications(prev =>
      prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setLocalNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId: string) => {
    setLocalNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== notificationId);
      localStorage.setItem('rent360_notifications', JSON.stringify(updated));
      return updated;
    });

    // Actualizar contador de no leídas
    const deletedNotif = localNotifications.find(n => n.id === notificationId);
    if (deletedNotif && !deletedNotif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setLocalNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('rent360_notifications');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract_created':
      case 'contract_signed':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'payment_received':
      case 'payment_overdue':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'message_received':
      case 'NEW_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'property_updated':
        return <Settings className="h-4 w-4 text-orange-600" />;
      case 'system_alert':
      case 'SYSTEM_ALERT':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'invitation_received':
      case 'INVITATION_RECEIVED':
        return <Users className="h-4 w-4 text-indigo-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
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

  console.log(
    '🎯 [REAL TIME NOTIFICATIONS] Rendering button, unreadMessagesCount:',
    unreadMessagesCount
  );

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
          <Bell className="h-4 w-4" />
          {unreadMessagesCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
            </Badge>
          )}
        </Button>

        {/* Estado de conexión WebSocket */}
        <div className="flex items-center gap-2 ml-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-600" />
          )}
        </div>

        {/* Panel de notificaciones */}
        {showPanel && (
          <Card className="absolute top-8 right-0 w-96 max-h-96 shadow-lg border z-50">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Notificaciones
                    </CardTitle>
                    {unreadMessagesCount > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        {unreadMessagesCount} sin leer
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadMessagesCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Marcar todas
                    </Button>
                  )}
                  <button
                    onClick={() => setShowPanel(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <div
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    isConnected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                  />
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {localNotifications.length === 0 ? (
                <div className="text-center py-8">
                  <BellOff className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">No tienes notificaciones</p>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-80">
                    <div className="p-2 space-y-3">
                      {localNotifications
                        .filter(
                          notification => notification && notification.id && notification.timestamp
                        )
                        .map(notification => (
                          <div
                            key={notification.id}
                            className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md hover:scale-[1.02] ${
                              !notification.read
                                ? 'ring-2 ring-blue-500/20 bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-950/20 dark:to-gray-800'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                            }`}
                          >
                            {/* Indicador de no leído */}
                            {!notification.read && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600" />
                            )}

                            <div className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Icono con fondo circular */}
                                <div
                                  className={`flex-shrink-0 p-2 rounded-full ${
                                    !notification.read
                                      ? 'bg-blue-100 dark:bg-blue-900/30'
                                      : 'bg-gray-100 dark:bg-gray-700'
                                  }`}
                                >
                                  <div
                                    className={`${
                                      !notification.read
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400'
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
                                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 animate-pulse" />
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
                                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
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
                  </ScrollArea>

                  <Separator />

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={clearAllNotifications}
                      className="w-full py-2 px-4 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      🗑️ Limpiar todas las notificaciones
                    </button>
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
