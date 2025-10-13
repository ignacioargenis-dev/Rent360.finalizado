'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { logger } from '@/lib/logger-minimal';
import UnifiedSidebar from './UnifiedSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Contexto para compartir el usuario autenticado con las páginas hijas
const DashboardUserContext = createContext<User | null>(null);

export const useDashboardUser = () => {
  const user = useContext(DashboardUserContext);

  // Si no hay contexto disponible, devolver null en lugar de mock
  // Esto permitirá que las páginas manejen correctamente el estado no autenticado
  if (user === null) {
    return null;
  }

  return user;
};

export interface UnifiedDashboardLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function UnifiedDashboardLayout({
  children,
  user: propUser,
  title,
  subtitle,
  showNotifications = true,
  notificationCount = 0,
}: UnifiedDashboardLayoutProps) {

  const [user, setUser] = useState<User | null>(propUser || null);
  const [loading, setLoading] = useState(!propUser);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Si ya tenemos usuario por props, no necesitamos verificar auth
    if (propUser) {
      setUser(propUser);
      setLoading(false);
      return;
    }

    checkAuth();
  }, [propUser]);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        logger.info('UnifiedDashboardLayout - User authenticated:', { userId: data.user?.id });
        setUser(data.user);
      } else if (response.status === 401) {
        logger.warn('User not authenticated');
        // No redirigir automáticamente - dejar que las páginas hijas manejen el estado no autenticado
        setUser(null);
      } else {
        logger.error('Auth check failed:', { status: response.status });
        // No redirigir automáticamente - permitir funcionamiento sin autenticación
        setUser(null);
      }
    } catch (error) {
      logger.error('Error checking auth:', { error: error instanceof Error ? error.message : String(error) });
      // No redirigir automáticamente - permitir funcionamiento básico
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si hay error crítico, mostrar error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no hay usuario, permitir acceso básico con funcionalidad limitada
  // Esto evita redirecciones automáticas que pueden causar problemas

  return (
    <DashboardUserContext.Provider value={user}>
      <UnifiedSidebar
        user={user}
        showNotifications={showNotifications}
        notificationCount={notificationCount}
      >
        <div className="p-6">
          {(title || subtitle) && (
            <div className="mb-6">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </UnifiedSidebar>
    </DashboardUserContext.Provider>
  );
}
