'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { logger } from '@/lib/logger';
import UnifiedSidebar from './UnifiedSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showNotifications?: boolean;
  notificationCount?: number;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  showNotifications = true,
  notificationCount = 0,
}: DashboardLayoutProps) {

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

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
        setUser(data.user);
      } else if (response.status === 401) {
        // User not authenticated, redirect to login
        router.push('/auth/login');
      } else {
        setError('Error checking authentication status');
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
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error de autenticación</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
