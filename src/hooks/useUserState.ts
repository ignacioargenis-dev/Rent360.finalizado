'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { User } from '@/types';

interface UseUserStateOptions {
  requireAuth?: boolean;
  redirectUrl?: string;
}

function convertDatesToObjects(user: any): User {
  return {
    ...user,
    createdAt: new Date(user.createdAt),
    updatedAt: new Date(user.updatedAt),
  };
}

export function useUserState(options: UseUserStateOptions = {}) {
  const { requireAuth = true, redirectUrl = '/auth/login' } = options;

  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // First, try to get user from API
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const userWithDates = convertDatesToObjects(data.user);
          setUser(userWithDates);
          setError(null);

          // Update localStorage as backup
          localStorage.setItem('user', JSON.stringify(data.user));
        } else if (response.status === 401) {
          // If API fails, try localStorage as fallback
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              const userWithDates = convertDatesToObjects(parsedUser);
              setUser(userWithDates);
            } catch (parseErr) {
              logger.error('Error parsing user data from localStorage:', {
                error: parseErr instanceof Error ? parseErr.message : String(parseErr),
              });
              localStorage.removeItem('user');
              if (requireAuth) {
                window.location.href = redirectUrl;
              }
            }
          } else if (requireAuth) {
            // No user found and auth is required
            window.location.href = redirectUrl;
          }
        } else {
          setError('Failed to load user data');
        }
      } catch (err) {
        logger.error('Error loading user state:', {
          error: err instanceof Error ? err.message : String(err),
        });

        // Fallback to localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            const userWithDates = convertDatesToObjects(parsedUser);
            setUser(userWithDates);
          } catch (parseErr) {
            logger.error('Error parsing user data from localStorage:', {
              error: parseErr instanceof Error ? parseErr.message : String(parseErr),
            });
            setError('Invalid user data');
            localStorage.removeItem('user');
            if (requireAuth) {
              window.location.href = redirectUrl;
            }
          }
        } else if (requireAuth) {
          window.location.href = redirectUrl;
        }
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();
  }, [requireAuth, redirectUrl]);

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      // Store without date conversion for localStorage
      const userForStorage = {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      };
      localStorage.setItem('user', JSON.stringify(userForStorage));
    } else {
      localStorage.removeItem('user');
    }
  };

  const clearUser = () => {
    setUser(null);
    localStorage.removeItem('user');
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
