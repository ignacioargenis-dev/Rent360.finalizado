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

  // DESACTIVADO: Auth check automático que causa problemas
  // useEffect(() => {
  //   const checkAuth = async () => {
  //     try {
  //       const response = await fetch('/api/auth/me', { credentials: 'include' });
  //       if (response.ok) {
  //         const userData = await response.json();
  //         setUser({
  //           id: userData.user?.id || 'unknown',
  //           email: userData.user?.email || 'unknown@example.com',
  //           password: '',
  //           name: userData.user?.name || 'Unknown',
  //           phone: userData.user?.phone || null,
  //           phoneSecondary: null,
  //           emergencyContact: null,
  //           emergencyPhone: null,
  //           rut: userData.user?.rut || null,
  //           rutVerified: false,
  //           dateOfBirth: null,
  //           gender: null,
  //           nationality: null,
  //           address: null,
  //           city: null,
  //           commune: null,
  //           region: null,
  //           role: userData.user?.role || 'tenant',
  //           avatar: userData.user?.avatar || null,
  //           isActive: true,
  //           emailVerified: true,
  //           phoneVerified: false,
  //           lastLogin: null,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         });
  //       }
  //     } catch (error) {
  //       console.warn('Auth check failed:', error);
  //     }
  //   };
  //   checkAuth();
  // }, []);

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
