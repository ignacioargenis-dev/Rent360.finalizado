'use client';

import { logger } from '@/lib/logger';

import { useState } from 'react';
import { User } from '@/types';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface UseUserStateOptions {
  requireAuth?: boolean;
  redirectUrl?: string;
}

export function useUserState(options: UseUserStateOptions = {}) {
  const { requireAuth = true, redirectUrl = '/auth/login' } = options;

  // Use AuthProvider for centralized auth management
  const { user, loading } = useAuth();

  // For backward compatibility, maintain error and initialized states
  const [error] = useState<string | null>(null);
  const [initialized] = useState(true); // Always initialized since AuthProvider handles this

  // AuthProvider handles all auth logic - maintain backward compatibility
  // No additional effects needed

  // For backward compatibility - provide no-op functions
  const updateUser = (newUser: User | null) => {
    logger.warn('updateUser is deprecated - use AuthProvider instead');
  };

  const clearUser = () => {
    logger.warn('clearUser is deprecated - use AuthProvider instead');
  };

  return {
    user,
    loading,
    error,
    initialized,
    updateUser,
    clearUser,
  };
}
