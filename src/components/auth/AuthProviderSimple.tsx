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

      // Primero intentar cargar desde localStorage como fallback rápido
      if (typeof window !== 'undefined') {
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            // Validar que tenga los campos mínimos necesarios
            if (parsedUser.id && parsedUser.email && parsedUser.role) {
              setUser(parsedUser);
              // Continuar con la verificación en background
            }
          } catch (e) {
            logger.warn('Error parsing cached user from localStorage', e);
            localStorage.removeItem('user');
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
            role: userData.user.role || 'TENANT',
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
          }
        }
      } else if (response.status === 401) {
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
      role: data.user?.role || 'TENANT',
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
      role: data.user?.role || 'TENANT',
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
