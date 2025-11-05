'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Check,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle,
  Bell,
  MessageSquare,
  Star,
  DollarSign,
  Calendar,
  Wrench,
  MapPin,
  User,
  Building,
  FileText,
} from 'lucide-react';
import { websocketClient } from '@/lib/websocket/socket-client';

interface ToastNotification {
  id: string;
  type:
    | 'success'
    | 'error'
    | 'warning'
    | 'info'
    | 'message'
    | 'system'
    | 'rating'
    | 'payment'
    | 'visit'
    | 'maintenance'
    | 'property'
    | 'contract'
    | 'user';
  title: string;
  message: string;
  data?: any;
  timestamp: string;
  autoClose?: boolean;
  duration?: number;
}

const getToastIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'message':
      return <MessageSquare className="w-5 h-5 text-blue-500" />;
    case 'rating':
      return <Star className="w-5 h-5 text-yellow-500" />;
    case 'payment':
      return <DollarSign className="w-5 h-5 text-green-500" />;
    case 'visit':
      return <Calendar className="w-5 h-5 text-blue-500" />;
    case 'maintenance':
      return <Wrench className="w-5 h-5 text-orange-500" />;
    case 'property':
      return <Building className="w-5 h-5 text-purple-500" />;
    case 'contract':
      return <FileText className="w-5 h-5 text-indigo-500" />;
    case 'user':
      return <User className="w-5 h-5 text-gray-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const getToastColor = (type: string) => {
  switch (type) {
    case 'success':
      return 'border-green-200 bg-green-50';
    case 'error':
      return 'border-red-200 bg-red-50';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50';
    case 'message':
      return 'border-blue-200 bg-blue-50';
    case 'rating':
      return 'border-yellow-200 bg-yellow-50';
    case 'payment':
      return 'border-green-200 bg-green-50';
    case 'visit':
      return 'border-blue-200 bg-blue-50';
    case 'maintenance':
      return 'border-orange-200 bg-orange-50';
    case 'property':
      return 'border-purple-200 bg-purple-50';
    case 'contract':
      return 'border-indigo-200 bg-indigo-50';
    case 'user':
      return 'border-gray-200 bg-gray-50';
    default:
      return 'border-gray-200 bg-gray-50';
  }
};

interface ToastNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

export default function ToastNotifications({
  position = 'top-right',
  maxToasts = 5,
}: ToastNotificationsProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    // Escuchar notificaciones del WebSocket
    const handleNotification = (notification: any) => {
      let toastType: ToastNotification['type'] = 'info';

      // Determinar el tipo de toast basado en el tipo de notificación
      if (notification.type.includes('success') || notification.type.includes('completed')) {
        toastType = 'success';
      } else if (notification.type.includes('error') || notification.type.includes('failed')) {
        toastType = 'error';
      } else if (notification.type.includes('warning') || notification.type.includes('alert')) {
        toastType = 'warning';
      } else if (notification.type.includes('message') || notification.type.includes('dm')) {
        toastType = 'message';
      } else if (notification.type.includes('rating')) {
        toastType = 'rating';
      } else if (notification.type.includes('payment')) {
        toastType = 'payment';
      } else if (notification.type.includes('visit')) {
        toastType = 'visit';
      } else if (notification.type.includes('maintenance')) {
        toastType = 'maintenance';
      } else if (notification.type.includes('property')) {
        toastType = 'property';
      } else if (notification.type.includes('contract')) {
        toastType = 'contract';
      } else if (notification.type.includes('user')) {
        toastType = 'user';
      }

      const toast: ToastNotification = {
        id: `toast_${Date.now()}_${Math.random()}`,
        type: toastType,
        title: getNotificationTitle(notification.type),
        message: notification.message,
        data: notification.data,
        timestamp: notification.timestamp || new Date().toISOString(),
        autoClose: true,
        duration: 5000,
      };

      // Agregar el toast manteniendo el límite máximo
      setToasts(prev => [toast, ...prev.slice(0, maxToasts - 1)]);
    };

    // Registrar listener
    websocketClient.on('notification', handleNotification);

    return () => {
      // Limpiar listener
      websocketClient.off('notification', handleNotification);
    };
  }, [maxToasts]);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'user_connected':
        return 'Usuario Conectado';
      case 'user_disconnected':
        return 'Usuario Desconectado';
      case 'property_created':
        return 'Nueva Propiedad';
      case 'property_updated':
        return 'Propiedad Actualizada';
      case 'contract_signed':
        return 'Contrato Firmado';
      case 'contract_updated':
        return 'Contrato Actualizado';
      case 'direct_message':
        return 'Nuevo Mensaje';
      case 'security_alert':
        return 'Alerta de Seguridad';
      case 'payment_received':
        return 'Pago Recibido';
      case 'payment_failed':
        return 'Pago Fallido';
      case 'visit_scheduled':
        return 'Visita Programada';
      case 'visit_completed':
        return 'Visita Completada';
      case 'rating_received':
        return 'Nueva Calificación';
      case 'maintenance_request':
        return 'Solicitud de Mantenimiento';
      case 'maintenance_updated':
        return 'Mantenimiento Actualizado';
      case 'property_visit':
        return 'Visita a Propiedad';
      default:
        return 'Notificación';
    }
  };

  const removeToast = (toastId: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={`fixed z-50 ${getPositionClasses()} space-y-2`}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: ToastNotification;
  onRemove: () => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (toast.autoClose && toast.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onRemove, 300); // Esperar a que termine la animación
      }, toast.duration);

      return () => clearTimeout(timer);
    }
    // No cleanup needed when autoClose is disabled
    return undefined;
  }, [toast.autoClose, toast.duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onRemove, 300);
  };

  return (
    <Card
      className={`w-96 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getToastColor(toast.type)} border shadow-lg`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getToastIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">{toast.title}</h4>
                <p className="text-sm text-gray-600">{toast.message}</p>
                {toast.data?.actionUrl && (
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-xs"
                    onClick={() => {
                      window.location.href = toast.data.actionUrl;
                    }}
                  >
                    Ver detalles
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="p-1 h-auto flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
