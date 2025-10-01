'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { logger } from '@/lib/logger';
import UnifiedSidebar from './UnifiedSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

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
        logger.warn('User not authenticated, redirecting to login');
        router.push('/auth/login');
      } else {
        setError('Error checking authentication status');
        logger.error('Auth check failed:', { status: response.status });
        router.push('/auth/login');
      }
    } catch (error) {
      logger.error('Error checking auth:', { error: error instanceof Error ? error.message : String(error) });
      setError('Network error checking authentication');
      router.push('/auth/login');
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

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">
            {error || 'Usuario no autenticado'}
          </p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  return (
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
  );
}
