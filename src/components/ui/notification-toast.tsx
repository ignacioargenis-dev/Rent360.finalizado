'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  X,
  Loader2
} from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface NotificationToastProps {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: (id: string) => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  action,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Aparecer con animación
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (persistent || type === 'loading') return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, persistent, type]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'info':
      case 'loading':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 min-w-80 max-w-md',
        'transform transition-all duration-300 ease-out',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isExiting && 'translate-x-full opacity-0'
      )}
      role="alert"
      aria-live="assertive"
    >
      <div
        className={cn(
          'bg-white border-l-4 rounded-lg shadow-lg p-4',
          'dark:bg-gray-800 dark:border-gray-700',
          getBorderColor()
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {title}
            </h4>

            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {message}
              </p>
            )}

            {action && (
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto mt-2 text-sm underline"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 h-6 w-6 p-0"
            onClick={handleClose}
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Barra de progreso para notificaciones temporales */}
        {!persistent && type !== 'loading' && duration > 0 && (
          <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
            <div
              className="bg-current h-1 rounded-full transition-all duration-100 ease-linear"
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
