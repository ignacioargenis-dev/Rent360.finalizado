'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { logger } from '@/lib/logger';
import { User } from '@/types';

// Función helper para convertir datos básicos de API a User completo
function convertApiUserToUser(apiUser: any): User {
  try {
    return {
      id: String(apiUser.id || ''),
      name: String(apiUser.name || ''),
      email: String(apiUser.email || ''),
      role: String(apiUser.role || 'tenant') as any,
      avatar: apiUser.avatar ? String(apiUser.avatar) : undefined,
      phone: null,
      isActive: true,
      emailVerified: true,
      createdAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
      updatedAt: apiUser.createdAt ? new Date(apiUser.createdAt) : new Date(),
      // Campos requeridos por Prisma User model - valores por defecto
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
    };
  } catch (error) {
    console.error('Error converting API user:', error);
    // Retornar un usuario básico si hay error
    return {
      id: 'error',
      name: 'Error',
      email: 'error@example.com',
      role: 'tenant' as any,
      phone: null,
      isActive: false,
      emailVerified: false,
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
    };
  }
}

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar si hay un usuario autenticado al cargar la aplicación
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (err) {
        // Si hay un error crítico, al menos permitir que la app se renderice
        console.error('Auth initialization error:', err);
        setLoading(false);
        setError('Error de autenticación');
      }
    };

    initAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        const user = convertApiUserToUser(userData.user);
        setUser(user);
      } else if (response.status === 401) {
        // User not authenticated - this is normal
        setUser(null);
      } else if (response.status === 503 || response.status === 500) {
        // Server error - don't crash, just set loading to false
        logger.warn('Server error during auth check', {
          status: response.status,
          statusText: response.statusText,
        });
        setUser(null);
      } else {
        // Other errors - log but don't crash
        logger.warn('Unexpected auth check response', {
          status: response.status,
          statusText: response.statusText,
        });
        setUser(null);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.warn('Auth check timed out');
      } else {
        logger.error('Error checking auth:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en el login');
      }

      const data = await response.json();
      const user = convertApiUserToUser(data.user);
      setUser(user);
    } catch (error) {
      logger.error('Login error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      setUser(null);
    } catch (error) {
      logger.error('Logout error:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error en el registro');
      }

      const data = await response.json();
      const user = convertApiUserToUser(data.user);
      setUser(user);
    } catch (error) {
      logger.error('Register error:', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
