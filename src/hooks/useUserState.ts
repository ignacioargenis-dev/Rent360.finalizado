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

        // First, try to get user from API with timeout
        let response;
        try {
          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          response = await fetch('/api/auth/me', {
            credentials: 'include',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
        } catch (fetchError) {
          // Handle network errors, timeouts, or aborted requests
          logger.warn('Network error during auth check', {
            error: fetchError instanceof Error ? fetchError.message : String(fetchError),
          });

          // Don't redirect for network errors, try localStorage fallback
          response = null;
        }

        if (response && response.ok) {
          const data = await response.json();
          const userWithDates = convertDatesToObjects(data.user);
          setUser(userWithDates);
          setError(null);

          // Update localStorage as backup
          localStorage.setItem('user', JSON.stringify(data.user));
        } else if (response && response.status === 401) {
          // User not authenticated - clear localStorage and redirect if required
          setUser(null);
          localStorage.removeItem('user');
          if (requireAuth) {
            window.location.href = redirectUrl;
          }
        } else if (response && (response.status === 503 || response.status === 500)) {
          // Server errors - don't redirect, try localStorage fallback
          logger.warn('Server error during auth check', {
            status: response.status,
            statusText: response.statusText,
          });

          // Try localStorage as fallback for server errors
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              const userWithDates = convertDatesToObjects(parsedUser);
              setUser(userWithDates);
              logger.info('Using localStorage fallback due to server error');
            } catch (parseErr) {
              logger.warn('Failed to parse user data from localStorage', {
                error: parseErr instanceof Error ? parseErr.message : String(parseErr),
              });
              localStorage.removeItem('user');
            }
          }
          // Don't redirect for server errors - let user try again
        } else if (response) {
          // Other API errors - set error but don't redirect
          const errorText = `API returned status ${response.status}`;
          setError(errorText);
          logger.error('API auth check failed with unexpected status', {
            status: response.status,
            statusText: response.statusText,
          });
        } else {
          // Network error - try localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              const userWithDates = convertDatesToObjects(parsedUser);
              setUser(userWithDates);
              logger.info('Using localStorage fallback due to network error');
            } catch (parseErr) {
              logger.warn('Failed to parse user data from localStorage', {
                error: parseErr instanceof Error ? parseErr.message : String(parseErr),
              });
              localStorage.removeItem('user');
            }
          }
          // Don't redirect for network errors
        }
      } catch (err) {
        // Catch any unexpected errors in the entire try block
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        logger.error('Unexpected error in loadUser', {
          error: errorMessage,
        });

        // Try localStorage as last resort
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            const userWithDates = convertDatesToObjects(parsedUser);
            setUser(userWithDates);
            logger.info('Using localStorage fallback due to unexpected error');
          } catch (parseErr) {
            logger.warn('Failed to parse user data from localStorage', {
              error: parseErr instanceof Error ? parseErr.message : String(parseErr),
            });
            localStorage.removeItem('user');
          }
        }

        // Don't redirect for unexpected errors to prevent crashes
        setError('Connection error - please try again');
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
