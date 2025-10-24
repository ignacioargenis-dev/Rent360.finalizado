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
  const [loading, setLoading] = useState(false); // ✅ CORREGIDO: Iniciar con loading false para evitar problemas de hidratación

  // Función para verificar autenticación
  const checkAuth = async () => {
    try {
      setLoading(true);

      // ✅ RESTAURADO: Verificación de API con manejo seguro de errores
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        if (userData && userData.id) {
          // Normalizar rol a MAYÚSCULAS
          const normalizedRole = (userData.role || 'TENANT').toUpperCase();

          const completeUser = {
            ...userData,
            role: normalizedRole,
            createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
            updatedAt: new Date(),
          };

          setUser(completeUser);

          // Guardar en localStorage de forma segura
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('user', JSON.stringify(completeUser));
              localStorage.setItem('userLoginTime', Date.now().toString());
            } catch (error) {
              logger.warn('Error saving to localStorage:', error);
            }
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
        // Limpiar localStorage si la autenticación falla
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('userLoginTime');
        }
      }
    } catch (error) {
      logger.warn('Auth check failed:', error);
      setUser(null);
      // Limpiar localStorage en caso de error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');

        // SEGURIDAD: Limpiar cualquier credencial que pueda estar en la URL
        const currentUrl = new URL(window.location.href);
        if (currentUrl.searchParams.has('email') || currentUrl.searchParams.has('password')) {
          console.warn('🚨 SEGURIDAD: Credenciales detectadas en URL durante auth check - limpiando');
          currentUrl.searchParams.delete('email');
          currentUrl.searchParams.delete('password');
          window.history.replaceState({}, '', currentUrl.pathname + currentUrl.hash);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ RESTAURADO: Auth check automático con manejo seguro de hidratación
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

    // ✅ SIMPLIFICADO: No hacer verificaciones automáticas del servidor para evitar problemas de hidratación
  }, []); // Solo ejecutar una vez al montar

  const login = async (email: string, password: string) => {
    try {
      // CRÍTICO: Limpiar localStorage ANTES de hacer login para evitar datos antiguos
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
        console.log('🧹 localStorage limpiado antes del login');
      }

      console.log('🔐 Iniciando login con email:', email);
      console.log('🔐 URL de API:', `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/login`);

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

      console.log('🔐 Respuesta de login - Status:', response.status, 'OK:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('🔐 Login fallido - Status:', response.status, 'Error:', errorData);

        // SEGURIDAD CRÍTICA: Nunca incluir datos sensibles en errores
        const errorMessage = errorData.error || 'Error en el login';
        throw new Error(errorMessage);
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
        bio: data.user?.bio || null,
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
      bio: data.user?.bio || null,
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
