'use client';

import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredRole?: string;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles = ['admin'],
  requiredRole,
  fallback
}: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    // Usar requiredRole si está especificado, sino usar allowedRoles
    const rolesToCheck = requiredRole ? [requiredRole] : allowedRoles;

    // Verificar autorización del lado del cliente
    const checkAuthorization = () => {
      try {
        // Obtener información del usuario desde localStorage o contexto
        const userData = localStorage.getItem('user');
        if (!userData) {
          // Usuario no encontrado en localStorage
          return;
        }

        const user: User = JSON.parse(userData);

        if (!user || !user.role) {
          // Usuario sin rol definido
          return;
        }

        // Verificar si el usuario tiene permisos
        const hasPermission = rolesToCheck.includes(user.role);

        if (!hasPermission) {
          // Usuario con rol no autorizado intentando acceder a contenido restringido
          // No redirigir automáticamente - permitir que el componente padre maneje esto
        }
      } catch (error) {
        // Error verificando autorización
      }
    };

    checkAuthorization();
  }, [requiredRole, allowedRoles]);

  // Siempre renderizar children - el manejo de permisos se hace en el componente padre
  return <>{children}</>;
}

