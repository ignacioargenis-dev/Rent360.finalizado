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

  // Auth check asíncrono que no bloquea el render
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (response.ok) {
          const userData = await response.json();
          setUser({
            id: userData.user?.id || 'unknown',
            name: userData.user?.name || 'Unknown',
            email: userData.user?.email || 'unknown@example.com',
            role: userData.user?.role || 'tenant',
            phone: null,
            avatar: userData.user?.avatar,
            bio: null,
            isActive: true,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            password: '',
            rut: null,
            rutVerified: false,
            dateOfBirth: null,
            gender: null,
            nationality: null,
            address: null,
            emergencyContactName: null,
            emergencyContactPhone: null,
            bankAccountNumber: null,
            bankName: null,
            accountType: null,
            verificationStatus: 'PENDING',
            lastLoginAt: null,
            loginAttempts: 0,
            lockedUntil: null,
          } as User);
        }
      } catch (error) {
        console.warn('Auth check failed:', error);
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
      name: data.user?.name || 'Unknown',
      email: data.user?.email || 'unknown@example.com',
      role: data.user?.role || 'tenant',
      phone: null,
      avatar: data.user?.avatar,
      bio: null,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: '',
      rut: null,
      rutVerified: false,
      dateOfBirth: null,
      gender: null,
      nationality: null,
      address: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      bankAccountNumber: null,
      bankName: null,
      accountType: null,
      verificationStatus: 'PENDING',
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
    } as User);
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
      name: data.user?.name || 'Unknown',
      email: data.user?.email || 'unknown@example.com',
      role: data.user?.role || 'tenant',
      phone: null,
      avatar: data.user?.avatar,
      bio: null,
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      password: '',
      rut: null,
      rutVerified: false,
      dateOfBirth: null,
      gender: null,
      nationality: null,
      address: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      bankAccountNumber: null,
      bankName: null,
      accountType: null,
      verificationStatus: 'PENDING',
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
    } as User);
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
