'use client';

import { createContext, useContext } from 'react';
import { User } from '@/types';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import UnifiedSidebar from './UnifiedSidebar';
import { LoadingSpinner } from '@/components/ui/LoadingStates';

// Contexto para compartir el usuario autenticado con las páginas hijas
const DashboardUserContext = createContext<User | null>(null);

export const useDashboardUser = () => {
  const user = useContext(DashboardUserContext);
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
  // Usar AuthProvider como fuente única de verdad
  const { user: authUser, loading } = useAuth();

  // Usar propUser si se proporciona, sino usar authUser del contexto
  const user = propUser || authUser;

  // 🔥 LOGS DE DIAGNÓSTICO
  if (typeof window !== 'undefined') {
    window.console.error('🏢 [LAYOUT] UnifiedDashboardLayout rendering:', {
      hasAuthUser: !!authUser,
      authUserEmail: authUser?.email,
      authUserRole: authUser?.role,
      hasPropUser: !!propUser,
      propUserEmail: propUser?.email,
      propUserRole: propUser?.role,
      finalUser: !!user,
      finalUserEmail: user?.email,
      finalUserRole: user?.role,
      loading,
      title,
    });
  }

  if (loading) {
    if (typeof window !== 'undefined') {
      window.console.error('⏳ [LAYOUT] Still loading, showing spinner...');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (typeof window !== 'undefined') {
    window.console.error('✅ [LAYOUT] Rendering dashboard with user:', {
      hasUser: !!user,
      userEmail: user?.email,
      userRole: user?.role,
    });
  }

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
