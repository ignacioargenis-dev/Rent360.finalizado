import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface SidebarStats {
  totalUsers: number;
  pendingTickets: number;
  legalCases: number;
  warrantyDisputes: number;
  pendingProperties: number;
  pendingContracts: number;
  pendingPayments: number;
  maintenanceRequests: number;
  isLoading: boolean;
  error: string | null;
}

export function useSidebarStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SidebarStats>({
    totalUsers: 0,
    pendingTickets: 0,
    legalCases: 0,
    warrantyDisputes: 0,
    pendingProperties: 0,
    pendingContracts: 0,
    pendingPayments: 0,
    maintenanceRequests: 0,
    isLoading: true,
    error: null,
  });

  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      // Cargar estadísticas según el rol del usuario
      const response = await fetch('/api/sidebar/stats', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setStats({
        totalUsers: data.totalUsers || 0,
        pendingTickets: data.pendingTickets || 0,
        legalCases: data.legalCases || 0,
        warrantyDisputes: data.warrantyDisputes || 0,
        pendingProperties: data.pendingProperties || 0,
        pendingContracts: data.pendingContracts || 0,
        pendingPayments: data.pendingPayments || 0,
        maintenanceRequests: data.maintenanceRequests || 0,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    ...stats,
    refreshStats: loadStats,
  };
}
