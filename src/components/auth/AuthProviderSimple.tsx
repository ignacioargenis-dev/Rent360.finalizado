'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

// AuthProvider simplificado que no cause crashes
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // No bloquear render inicial

  // Auth check automático mejorado para producción
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const userData = await response.json();

          // Validar que el usuario tenga datos válidos
          if (userData.user && userData.user.id) {
            setUser({
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
              role: userData.user.role || 'tenant',
              avatar: userData.user.avatar || null,
              isActive: true,
              emailVerified: true,
              phoneVerified: false,
              lastLogin: null,
              createdAt: userData.user.createdAt ? new Date(userData.user.createdAt) : new Date(),
              updatedAt: new Date(),
            });
          }
        } else if (response.status === 401) {
          // Usuario no autenticado - estado normal para páginas públicas
          console.log('Usuario no autenticado - estado normal');
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
        // No establecer error crítico - permitir funcionamiento sin autenticación
      }
    };

    checkAuth();
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
    setUser({
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
      role: data.user?.role || 'tenant',
      avatar: data.user?.avatar || null,
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
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
    setUser({
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
      role: data.user?.role || 'tenant',
      avatar: data.user?.avatar || null,
      isActive: true,
      emailVerified: true,
      phoneVerified: false,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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
