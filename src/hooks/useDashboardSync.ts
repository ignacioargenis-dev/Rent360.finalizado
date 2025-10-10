import { useCallback, useState, useEffect } from 'react';

// Hook específico para dashboard de administrador
export const useAdminDashboardSync = (userId?: string) => {
  const [stats, setStats] = useState<{
    data: any;
    isLoading: boolean;
    error: Error | null;
    lastUpdated: number | null;
  }>({
    data: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [recentUsers, setRecentUsers] = useState<{
    data: any[];
    isLoading: boolean;
    error: Error | null;
    lastUpdated: number | null;
  }>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [recentActivity, setRecentActivity] = useState<{
    data: any[];
    isLoading: boolean;
    error: Error | null;
    lastUpdated: number | null;
  }>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const [isConnected, setIsConnected] = useState(false);

  // Función para cargar estadísticas
  const loadStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/dashboard-stats', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      setStats({
        data,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, []);

  // Función para cargar usuarios recientes
  const loadRecentUsers = useCallback(async () => {
    try {
      setRecentUsers(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/users?limit=10&sortBy=createdAt&sortOrder=desc', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recent users');
      }

      const data = await response.json();
      setRecentUsers({
        data: data.users || data,
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setRecentUsers(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, []);

  // Función para cargar actividad reciente
  const loadRecentActivity = useCallback(async () => {
    try {
      setRecentActivity(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/admin/recent-activity?limit=20', {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        // Fallback a datos simulados si la API no existe aún
        setRecentActivity({
          data: generateMockActivity(),
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        });
        return;
      }

      const data = await response.json();
      setRecentActivity({
        data: data.activities || [],
        isLoading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (error) {
      setRecentActivity(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadStats();
    loadRecentUsers();
    loadRecentActivity();

    // Simular conexión (en producción esto vendría de un WebSocket real)
    setIsConnected(true);
  }, [loadStats, loadRecentUsers, loadRecentActivity]);

  // Función para refrescar todo el dashboard
  const refreshDashboard = useCallback(async () => {
    await Promise.all([loadStats(), loadRecentUsers(), loadRecentActivity()]);
  }, [loadStats, loadRecentUsers, loadRecentActivity]);

  // Función para invalidar datos relacionados con usuarios
  const invalidateUserData = useCallback(() => {
    loadRecentUsers();
    loadStats();
    loadRecentActivity();
  }, [loadRecentUsers, loadStats, loadRecentActivity]);

  // Función para invalidar todos los datos
  const invalidateAll = useCallback(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const isLoading = stats.isLoading || recentUsers.isLoading || recentActivity.isLoading;
  const hasError = stats.error || recentUsers.error || recentActivity.error;
  const lastUpdated =
    Math.max(
      stats.lastUpdated || 0,
      recentUsers.lastUpdated || 0,
      recentActivity.lastUpdated || 0
    ) || null;

  return {
    // Datos
    stats,
    recentUsers,
    recentActivity,

    // Estados
    isLoading,
    hasError,
    lastUpdated,
    isConnected,

    // Acciones
    refreshDashboard,
    invalidateUserData,
    invalidateAll,
  };
};

// Función auxiliar para generar actividad simulada (hasta que se implemente la API)
function generateMockActivity() {
  return [
    {
      id: '1',
      type: 'user',
      title: 'Nuevo usuario registrado',
      description: 'Juan Pérez se registró como propietario',
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      severity: 'low',
    },
    {
      id: '2',
      type: 'contract',
      title: 'Contrato firmado',
      description: 'Contrato entre Propietario García e Inquilino López',
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      severity: 'medium',
    },
    {
      id: '3',
      type: 'payment',
      title: 'Pago recibido',
      description: 'Pago mensual de $500.000 recibido',
      date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      severity: 'high',
    },
    {
      id: '4',
      type: 'maintenance',
      title: 'Solicitud de mantenimiento',
      description: 'Reparación de grifería en departamento 3B',
      date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      severity: 'medium',
    },
  ];
}
