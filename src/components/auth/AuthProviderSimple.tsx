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

      // CRÍTICO: Limpiar SIEMPRE localStorage al inicio para forzar recarga fresca
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            // VALIDACIÓN CRÍTICA: El rol DEBE estar en MAYÚSCULAS
            if (parsedUser.role && parsedUser.role !== parsedUser.role.toUpperCase()) {
              console.warn('🔄 LocalStorage tiene rol en formato incorrecto, limpiando TODO...', {
                storedRole: parsedUser.role,
                expectedRole: parsedUser.role.toUpperCase(),
              });
              localStorage.clear(); // Limpiar TODO el localStorage
            }
          } catch (e) {
            logger.warn('Error parsing cached user from localStorage', e);
            localStorage.clear(); // Limpiar TODO si hay error
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
          // CRÍTICO: Normalizar rol a MAYÚSCULAS SIEMPRE
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

          console.log('✅ Usuario autenticado desde servidor:', {
            email: completeUser.email,
            role: completeUser.role,
            id: completeUser.id,
            originalRole: userData.user.role,
          });

          setUser(completeUser);

          // Actualizar localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(completeUser));
            console.log('💾 Usuario guardado en localStorage con rol:', completeUser.role);
          }
        }
      } else if (response.status === 401) {
        console.warn('⚠️ No autorizado (401), limpiando sesión');
        setUser(null);
        // Limpiar localStorage si no autenticado
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      logger.warn('Auth check failed:', error);
      // Si falla la verificación pero tenemos usuario en cache, mantenerlo
      // Solo establecer null si no hay usuario en absoluto
      if (!user) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // ACTIVADO: Auth check automático al cargar el AuthProvider
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // CRÍTICO: Limpiar localStorage ANTES de hacer login para evitar datos antiguos
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
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

      setUser(completeUserData);

      // Guardar en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(completeUserData));
        console.log('💾 Usuario guardado en localStorage después del login');
      }
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
      }
    } catch (error) {
      logger.error('Logout error:', error);
      // Limpiar localStorage incluso si hay error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
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
