"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { NotificationToast, NotificationType } from './notification-toast';
import { SplashScreen } from './SplashScreen';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface NotificationContextType {
  notify: (notification: Omit<Notification, 'id'>) => string;
  success: (title: string, message?: string, options?: Partial<Notification>) => string;
  error: (title: string, message?: string, options?: Partial<Notification>) => string;
  warning: (title: string, message?: string, options?: Partial<Notification>) => string;
  info: (title: string, message?: string, options?: Partial<Notification>) => string;
  loading: (title: string, message?: string, options?: Partial<Notification>) => string;
  remove: (id: string) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // En lugar de lanzar error, retornar un contexto vacío para evitar crashes
    // durante SSR o hidratación
    console.warn('useNotifications called outside NotificationProvider context');
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      addNotification: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      removeNotification: () => {},
      clearAll: () => {},
      refreshNotifications: () => {},
      notify: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
    };
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showSplash, setShowSplash] = useState<boolean>(false);

  // Splash solo al ingresar a la web (no en cada cambio de ruta)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const afterLogin = sessionStorage.getItem('r360_splash_after_login');
    if (afterLogin) {
      setShowSplash(true);
      sessionStorage.removeItem('r360_splash_after_login');
      return;
    }

    const alreadyShown = sessionStorage.getItem('r360_splash_initial_shown');
    if (!alreadyShown) {
      setShowSplash(true);
      sessionStorage.setItem('r360_splash_initial_shown', '1');
    }
  }, []);

  const generateId = () => `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const notify = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = { ...notification, id };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // Mantener solo las últimas N notificaciones
      return updated.slice(0, maxNotifications);
    });

    return id;
  }, [maxNotifications]);

  const success = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return notify({
      type: 'success',
      title,
      ...(message && { message }),
      duration: 5000,
      ...options
    });
  }, [notify]);

  const error = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return notify({
      type: 'error',
      title,
      ...(message && { message }),
      duration: 7000,
      persistent: true,
      ...options
    });
  }, [notify]);

  const warning = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return notify({
      type: 'warning',
      title,
      ...(message && { message }),
      duration: 6000,
      ...options
    });
  }, [notify]);

  const info = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return notify({
      type: 'info',
      title,
      ...(message && { message }),
      duration: 5000,
      ...options
    });
  }, [notify]);

  const loading = useCallback((title: string, message?: string, options?: Partial<Notification>) => {
    return notify({
      type: 'loading',
      title,
      ...(message && { message }),
      persistent: true,
      ...options
    });
  }, [notify]);

  const remove = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notify,
    success,
    error,
    warning,
    info,
    loading,
    remove,
    clear
  };

  return (
    <NotificationContext.Provider value={value}>
      <SplashScreen
        logoUrl={"/logo-rent360.png"}
        visible={showSplash}
        onHidden={() => setShowSplash(false)}
      />
      {children}

      {/* Portal para notificaciones */}
      <div className="fixed top-0 right-0 z-50 space-y-2 p-4">
        {notifications.map(notification => (
          <NotificationToast
            key={notification.id}
            {...notification}
            onClose={remove}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
