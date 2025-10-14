'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredRole?: string;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles = ['ADMIN'],
  requiredRole,
  fallback,
}: RoleGuardProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    // Usar requiredRole si está especificado, sino usar allowedRoles
    const rolesToCheck = requiredRole ? [requiredRole] : allowedRoles;

    // Verificar autorización del lado del cliente
    const checkAuthorization = () => {
      try {
        // Obtener información del usuario desde localStorage o contexto
        const userData = localStorage.getItem('user');
        if (!userData) {
          setHasAccess(false);
          return;
        }

        const user: User = JSON.parse(userData);

        if (!user || !user.role) {
          setHasAccess(false);
          return;
        }

        // Normalizar roles a MAYÚSCULAS para comparación
        const normalizedUserRole = user.role.toUpperCase();
        const normalizedAllowedRoles = rolesToCheck.map(r => r.toUpperCase());

        // Verificar si el usuario tiene permisos
        const hasPermission = normalizedAllowedRoles.includes(normalizedUserRole);
        setHasAccess(hasPermission);

        if (!hasPermission) {
          // Redirigir después de un breve delay
          setTimeout(() => {
            router.push('/auth/access-denied');
          }, 100);
        }
      } catch (error) {
        // Error verificando autorización
        setHasAccess(false);
      }
    };

    checkAuthorization();
  }, [requiredRole, allowedRoles, router]);

  // Mostrar loading mientras verifica
  if (hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, mostrar fallback o mensaje por defecto
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <svg
              className="w-16 h-16 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">No tienes permisos para acceder a esta sección.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar children
  return <>{children}</>;
}
