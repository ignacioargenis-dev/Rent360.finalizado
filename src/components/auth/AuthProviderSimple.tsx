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

      // Validar rol en localStorage
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            // VALIDACIÓN: El rol DEBE estar en MAYÚSCULAS
            if (parsedUser.role && parsedUser.role !== parsedUser.role.toUpperCase()) {
              console.warn('🔄 LocalStorage tiene rol en formato incorrecto, limpiando...', {
                storedRole: parsedUser.role,
                expectedRole: parsedUser.role.toUpperCase(),
              });
              localStorage.clear();
            }
          } catch (e) {
            logger.warn('Error parsing cached user from localStorage', e);
            localStorage.clear();
          }
        }
      }

      // Verificar autenticación con el servidor
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (response.ok) {
        const userData = await response.json();

        if (userData.user && userData.user.id) {
          // Normalizar rol a MAYÚSCULAS
          const normalizedRole = (userData.user.role || 'TENANT').toUpperCase();

          const completeUser = {
            id: userData.user.id,
            email: userData.user.email || 'unknown@example.com',
            password: '',
            name: userData.user.name || 'Usuario',
            phone: userData.user.phone || null,
            phoneSecondary: null,
            emergencyContact: null,
            emergencyPhone: null,
            rut: userData.user.rut || null,
            rutVerified: false,
            dateOfBirth: null,
            gender: null,
            nationality: null,
            address: null,
            city: null,
            commune: null,
            region: null,
            role: normalizedRole,
            avatar: userData.user.avatar || null,
            isActive: true,
            emailVerified: true,
            phoneVerified: false,
            lastLogin: null,
            createdAt: userData.user.createdAt ? new Date(userData.user.createdAt) : new Date(),
            updatedAt: new Date(),
          };

          setUser(completeUser);

          // Actualizar localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(completeUser));
            // Actualizar timestamp cuando verificamos con éxito
            localStorage.setItem('userLoginTime', Date.now().toString());
          }
        }
      } else if (response.status === 401) {
        if (typeof window !== 'undefined') {
          // Verificar si es un problema de timing
          const cachedUser = localStorage.getItem('user');
          const userLoginTime = localStorage.getItem('userLoginTime');
          const currentTime = Date.now();

          // Si el usuario se logueó hace menos de 10 segundos, es probable timing issue
          const isRecentLogin = userLoginTime && currentTime - parseInt(userLoginTime) < 10000;

          if (cachedUser && isRecentLogin) {
            // Mantener usuario de localStorage (timing issue)
            try {
              const parsedUser = JSON.parse(cachedUser);
              const normalizedRole = (parsedUser.role || 'TENANT').toUpperCase();
              const completeUser = {
                ...parsedUser,
                role: normalizedRole,
                createdAt: parsedUser.createdAt ? new Date(parsedUser.createdAt) : new Date(),
                updatedAt: new Date(),
              };
              setUser(completeUser);
              console.log(
                '⏱️ [AUTH] Manteniendo usuario local (timing issue, login hace',
                Math.round((currentTime - parseInt(userLoginTime)) / 1000),
                'segundos)'
              );
              return; // Salir sin limpiar
            } catch (e) {
              console.error('Error parsing cached user:', e);
            }
          }

          // Si no es timing issue, limpiar sesión
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('userLoginTime');
          console.log('🧹 [AUTH] Sesión no autenticada limpiada');
        }
      }
    } catch (error) {
      logger.warn('Auth check failed:', error);
      // Si falla y tenemos usuario en localStorage reciente, mantenerlo
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('user');
        const userLoginTime = localStorage.getItem('userLoginTime');
        if (cachedUser && userLoginTime) {
          const timeSinceLogin = Date.now() - parseInt(userLoginTime);
          if (timeSinceLogin < 10000) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              const normalizedRole = (parsedUser.role || 'TENANT').toUpperCase();
              setUser({
                ...parsedUser,
                role: normalizedRole,
                createdAt: parsedUser.createdAt ? new Date(parsedUser.createdAt) : new Date(),
                updatedAt: new Date(),
              });
              return; // Mantener usuario en caso de error de red temporal
            } catch (e) {
              // Si falla el parsing, continuar con limpiar
            }
          }
        }
      }
      // Solo limpiar si no hay usuario válido en cache
      if (!user) {
        setUser(null);
      }
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
        if (cachedUser) {
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
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
      }
    }

    // SEGUNDO: Verificar con el servidor para datos frescos
    const performAuthCheck = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // Si falla, programar un reintento en 2 segundos
        if (typeof window !== 'undefined') {
          retryTimeout = setTimeout(async () => {
            try {
              await checkAuth();
            } catch (retryError) {
              console.warn('Auth retry también falló:', retryError);
            }
          }, 2000);
        }
      }
    };

    performAuthCheck();

    // Cleanup timeout on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // CRÍTICO: Limpiar localStorage ANTES de hacer login para evitar datos antiguos
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('userLoginTime');
        console.log('🧹 localStorage limpiado antes del login');
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

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
      setLoading(false); // Asegurar que loading está en false después del login
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

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
