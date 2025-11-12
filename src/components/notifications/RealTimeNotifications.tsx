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

      const newNotifications = wsNotifications.map((wsNotif: any) => {
        console.log('🚨🚨🚨 [REAL TIME NOTIFICATIONS] Processing notification:', wsNotif);

        return {
          id: wsNotif.id || `ws_${Date.now()}_${Math.random()}`,
          type: wsNotif.type || 'unknown',
          title: wsNotif.title || 'Nueva notificación',
          message: wsNotif.message || '',
          data: wsNotif,
          priority: wsNotif.priority || 'medium',
          timestamp: new Date(wsNotif.timestamp || Date.now()),
          read: false,
        };
      });

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
        const notificationsWithDates = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
        setLocalNotifications(notificationsWithDates);
        setUnreadCount(notificationsWithDates.filter((n: NotificationItem) => !n.read).length);
      } catch (error) {
        logger.error('Error loading notifications:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, []);

  // Manejar nuevas notificaciones desde WebSocket
  useEffect(() => {
    if (wsNotifications.length > 0) {
      const newNotifications: NotificationItem[] = wsNotifications.map(wsNotif => ({
        id: wsNotif.id || `notif_${Date.now()}_${Math.random()}`,
        type: wsNotif.type || 'system_alert',
        title: wsNotif.title || 'Nueva Notificación',
        message: wsNotif.message || wsNotif.content || 'Tienes una nueva notificación',
        data: wsNotif.data,
        priority: wsNotif.priority || 'medium',
        timestamp: new Date(wsNotif.timestamp || Date.now()),
        read: false,
      }));

      setLocalNotifications(prev => {
        const updated = [...newNotifications, ...prev];
        // Limitar a 100 notificaciones
        const limited = updated.slice(0, 100);

        // Guardar en localStorage
        localStorage.setItem('rent360_notifications', JSON.stringify(limited));

        return limited;
      });

      setUnreadCount(prev => prev + newNotifications.length);

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

    return timestamp.toLocaleDateString();
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
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificaciones
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadMessagesCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                      Marcar todas como leídas
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setShowPanel(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
                {unreadMessagesCount > 0 && (
                  <Badge variant="outline" className="ml-auto">
                    {unreadMessagesCount}
                  </Badge>
                )}
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
                  <ScrollArea className="h-64">
                    <div className="space-y-1">
                      {localNotifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 border-l-4 ${getPriorityColor(notification.priority || 'low')} ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 ml-2" />
                                )}
                              </div>

                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>

                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>

                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsRead(notification.id)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  )}

                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteNotification(notification.id)}
                                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Separator />

                  <div className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllNotifications}
                      className="w-full text-red-600 hover:text-red-700"
                    >
                      Limpiar todas las notificaciones
                    </Button>
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
