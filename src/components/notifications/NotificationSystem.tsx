'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, createContext, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, 
  CheckCircle, 
  AlertCircle, Info, X,
  Mail,
  MessageSquare,
  DollarSign,
  Clock,
  RefreshCw,
  Filter,
  Trash2,
  FileText,
  Wrench,
  } from 'lucide-react';
interface Notification {
  id: string
  type: string
  title: string
  message: string
  createdAt: string
  isRead: boolean
  actionUrl?: string
  actionText?: string
  metadata?: string
  expiresAt?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    logger.error('useNotifications must be used within a NotificationProvider');
    // Retornar un contexto por defecto para evitar crashes
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => { /* Implementation */ },
      removeNotification: () => {},
      clearAll: () => {},
      refreshNotifications: () => {},
    };
  }
  return context;
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      logger.error('Error fetching notifications:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Mantener máximo 50 notificaciones
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAsRead' }),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n),
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      logger.error('Error marking notification as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function NotificationBell() {
  const { unreadCount, notifications, loading, refreshNotifications } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'CONTRACT':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'SIGNATURE':
        return <Wrench className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
return 'Ahora';
}
    if (minutes < 60) {
return `Hace ${minutes} min`;
}
    if (hours < 24) {
return `Hace ${hours} h`;
}
    if (days < 7) {
return `Hace ${days} días`;
}
    return date.toLocaleDateString('es-CL');
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificaciones</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 10).map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setIsOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {}}
                className="w-full"
              >
                Marcar todas como leídas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  // Navegar a la página de notificaciones según el rol del usuario
                  const userRole = localStorage.getItem('user-role') || 'tenant';
                  const notificationsUrl = `/${userRole}/notifications`;
                  window.location.href = notificationsUrl;
                }}
                className="w-full"
              >
                Ver todas las notificaciones
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification
  onClose: () => void
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, removeNotification } = useNotifications();

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const handleRemove = () => {
    removeNotification(notification.id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'PAYMENT':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'CONTRACT':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'MAINTENANCE':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'SIGNATURE':
        return <Wrench className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
return 'Ahora';
}
    if (minutes < 60) {
return `Hace ${minutes} min`;
}
    if (hours < 24) {
return `Hace ${hours} h`;
}
    if (days < 7) {
return `Hace ${days} días`;
}
    return date.toLocaleDateString('es-CL');
  };

  return (
    <div 
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        notification.isRead 
          ? 'bg-gray-50 border-gray-200' 
          : 'bg-blue-50 border-blue-200'
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                notification.isRead ? 'text-gray-900' : 'text-blue-900'
              }`}>
                {notification.title}
              </p>
              <p className={`text-sm mt-1 ${
                notification.isRead ? 'text-gray-600' : 'text-blue-700'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {formatTimestamp(notification.createdAt)}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {notification.actionUrl && notification.actionText && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                // Navegar a la URL de la acción
                if (notification.actionUrl) {
                  window.location.href = notification.actionUrl;
                }
              }}
            >
              {notification.actionText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook para mostrar notificaciones toast
export function useToast() {
  const { addNotification } = useNotifications();

  const showToast = (type: string, title: string, message: string) => {
    addNotification({
      type,
      title,
      message,
    });
  };

  return {
    success: (title: string, message: string) => showToast('SUCCESS', title, message),
    error: (title: string, message: string) => showToast('ERROR', title, message),
    warning: (title: string, message: string) => showToast('WARNING', title, message),
    info: (title: string, message: string) => showToast('INFO', title, message),
  };
}
