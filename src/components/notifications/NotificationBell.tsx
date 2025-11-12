'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { websocketClient } from '@/lib/websocket/socket-client';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  priority: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones
  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Polling cada 30 segundos
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Escuchar notificaciones en tiempo real
  useEffect(() => {
    const handleNotification = (data: any) => {
      console.log('🔔 [NOTIFICATION BELL] Received real-time notification:', data);

      // Agregar la nueva notificación al estado local
      const newNotification: Notification = {
        id: data.id,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        isRead: false, // Las notificaciones en tiempo real siempre son no leídas
        createdAt: data.timestamp,
        priority: data.priority || 'medium',
      };

      setNotifications(prev => [newNotification, ...prev]);

      // Mostrar toast de notificación
      toast.success(data.title, {
        description: data.message,
        duration: 5000,
      });
    };

    // Suscribirse a eventos de notificación
    websocketClient.on('notification', handleNotification);

    return () => {
      websocketClient.off('notification', handleNotification);
    };
  }, []);

  // Marcar como leída
  const markAsRead = async (notificationId: string) => {
    try {
      // Actualizar estado local inmediatamente para mejor UX
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      // Enviar al servidor en background
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });

      // Recargar para asegurar sincronización
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revertir cambio si falló
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: false } : n))
      );
    }
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    setLoading(true);
    try {
      // Actualizar estado local inmediatamente para mejor UX
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      // Enviar al servidor en background
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        loadNotifications();
      } else {
        // Revertir si falló
        setNotifications(prev => prev.map(n => ({ ...n, isRead: false })));
        toast.error('Error al marcar notificaciones');
      }
    } catch (error) {
      // Revertir si falló
      setNotifications(prev => prev.map(n => ({ ...n, isRead: false })));
      toast.error('Error al marcar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar notificación
  const deleteNotification = async (notificationId: string) => {
    try {
      // Actualizar estado local inmediatamente para mejor UX
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Enviar al servidor en background
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      // Recargar para asegurar sincronización
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Recargar para restaurar el estado si falló
      loadNotifications();
    }
  };

  // Manejar click en notificación
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={loading}>
              Marcar todas
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div
                key={notification.id}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{notification.title}</p>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
