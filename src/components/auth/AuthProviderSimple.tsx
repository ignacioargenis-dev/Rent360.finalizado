'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';
import { logger } from '@/lib/logger-edge-runtime';

// AuthProvider simplificado que no cause crashes
interface AuthContextType {
  user: User | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Iniciar con loading true

  // Función para verificar autenticación
  const checkAuth = async () => {
    try {
      setLoading(true);

      // ⚠️ TEMPORALMENTE DESHABILITADO: Verificación de API que causa problemas de hidratación
      // TODO: Re-habilitar cuando se confirme que el dashboard funciona

      // ⚠️ TEMPORALMENTE: Simular usuario no autenticado para permitir hidratación
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
      }
    } catch (error) {
      logger.warn('Auth check failed:', error);
      // ⚠️ TEMPORALMENTE: Simular usuario no autenticado para permitir hidratación
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Auth check automático al cargar el AuthProvider
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;

    // PRIMERO: Intentar cargar desde localStorage inmediatamente
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('user');
        const userLoginTime = localStorage.getItem('userLoginTime');

        if (cachedUser && userLoginTime) {
          const loginTime = parseInt(userLoginTime);
          const now = Date.now();
          const timeSinceLogin = now - loginTime;

          // Solo usar localStorage si el login fue hace menos de 15 minutos
          if (timeSinceLogin < 15 * 60 * 1000) {
            const parsedUser = JSON.parse(cachedUser);
            // Validar que tenga la estructura correcta
            if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
              // Normalizar rol a MAYÚSCULAS
              const normalizedRole = (parsedUser.role || 'TENANT').toUpperCase();

              const completeUser = {
                ...parsedUser,
                role: normalizedRole,
                createdAt: parsedUser.createdAt ? new Date(parsedUser.createdAt) : new Date(),
                updatedAt: new Date(),
              };

              setUser(completeUser);
              setLoading(false); // Usuario cargado, no necesitamos loading
            }
          } else {
            // localStorage expirado, limpiar
            localStorage.removeItem('user');
            localStorage.removeItem('userLoginTime');
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
      }
    }

    // SEGUNDO: Verificar con el servidor para datos frescos (solo si no hay usuario en localStorage)
    const performAuthCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // Si falla, programar un reintento en 3 segundos
        if (typeof window !== 'undefined') {
          retryTimeout = setTimeout(async () => {
            try {
              await checkAuth();
            } catch (retryError) {
              console.warn('Auth retry también falló:', retryError);
            }
          }, 3000);
        }
      }
    };

    // Solo verificar con servidor si no tenemos usuario de localStorage
    if (!user) {
      performAuthCheck();
    }

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      // CRÍTICO: Limpiar localStorage ANTES de hacer login para evitar datos antiguos
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
        console.log('🧹 localStorage limpiado antes del login');
      }

      const response = await fetch(
        `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en el login');
      }

      const data = await response.json();

      // CRÍTICO: Normalizar rol a MAYÚSCULAS SIEMPRE
      const normalizedRole = (data.user?.role || 'TENANT').toUpperCase();

      // Crear objeto de usuario completo
      const completeUserData = {
        id: data.user?.id || 'unknown',
        email: data.user?.email || 'unknown@example.com',
        password: '',
        name: data.user?.name || 'Unknown',
        phone: data.user?.phone || null,
        phoneSecondary: null,
        emergencyContact: null,
        emergencyPhone: null,
        rut: data.user?.rut || null,
        rutVerified: false,
        dateOfBirth: null,
        gender: null,
        nationality: null,
        address: null,
        city: null,
        commune: null,
        region: null,
        role: normalizedRole,
        avatar: data.user?.avatar || null,
        isActive: true,
        emailVerified: true,
        phoneVerified: false,
        lastLogin: new Date(),
        createdAt: data.user?.createdAt ? new Date(data.user?.createdAt) : new Date(),
        updatedAt: new Date(),
      };

      console.log('🔐 Login exitoso:', {
        email: completeUserData.email,
        role: completeUserData.role,
        id: completeUserData.id,
        originalRole: data.user?.role,
      });

      // IMPORTANTE: Guardar PRIMERO en localStorage con timestamp ANTES de setUser
      // Esto evita el problema de timing con checkAuth
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(completeUserData));
        localStorage.setItem('userLoginTime', Date.now().toString());
        console.log(
          '💾 Usuario guardado en localStorage ANTES de setUser para evitar timing issues'
        );
      }

      // Ahora sí actualizar el estado - esto puede disparar checkAuth en otros componentes
      // pero localStorage ya tiene los datos correctos
      setUser(completeUserData);
      setLoading(false);

      // Pequeño delay para asegurar que las cookies estén disponibles antes de cualquier checkAuth posterior
      await new Promise(resolve => setTimeout(resolve, 100)); // Asegurar que loading está en false después del login
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch(
        `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/logout`,
        {
          method: 'POST',
          headers: { Accept: 'application/json' },
        }
      );
      setUser(null);

      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
      }
    } catch (error) {
      logger.error('Logout error:', error);
      // Limpiar localStorage incluso si hay error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
      }
    }
  };

  const register = async (userData: any) => {
    const response = await fetch(
      `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error en el registro');
    }

    const data = await response.json();

    // CRÍTICO: Normalizar rol a MAYÚSCULAS SIEMPRE
    const normalizedRole = (data.user?.role || 'TENANT').toUpperCase();

    // Crear objeto de usuario completo
    const completeUserData = {
      id: data.user?.id || 'unknown',
      email: data.user?.email || 'unknown@example.com',
      password: '',
      name: data.user?.name || 'Unknown',
      phone: data.user?.phone || null,
      phoneSecondary: null,
      emergencyContact: null,
      emergencyPhone: null,
      rut: data.user?.rut || null,
      rutVerified: false,
      dateOfBirth: null,
      gender: null,
      nationality: null,
      address: null,
      city: null,
      commune: null,
      region: null,
      role: normalizedRole,
      avatar: data.user?.avatar || null,
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      lastLogin: new Date(),
      createdAt: data.user?.createdAt ? new Date(data.user?.createdAt) : new Date(),
      updatedAt: new Date(),
    };

    setUser(completeUserData);

    // Guardar en localStorage para persistencia
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(completeUserData));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, checkAuth, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
