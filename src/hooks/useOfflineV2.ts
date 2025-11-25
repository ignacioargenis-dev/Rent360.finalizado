// Hook mejorado de Offline con IndexedDB y cola de acciones
'use client';

import { useState, useEffect, useCallback } from 'react';
import { indexedDBService } from '@/lib/offline/indexeddb-service';
import { offlineQueueService, SyncResult } from '@/lib/offline/offline-queue-service';
import { logger } from '@/lib/logger-minimal';

export interface OfflineStateV2 {
  isOnline: boolean;
  queueSize: number;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  cachedData: {
    properties: number;
    contracts: number;
    payments: number;
    maintenance: number;
    notifications: number;
    runnerDeliveries: number;
    supportTickets: number;
    maintenanceServices: number;
  };
  totalCacheSize: number;
}

export interface OfflineActionsV2 {
  // Acciones offline
  createOffline: (resource: string, endpoint: string, data: any) => Promise<string>;
  updateOffline: (resource: string, endpoint: string, data: any) => Promise<string>;
  deleteOffline: (resource: string, endpoint: string, id: string) => Promise<string>;

  // Sincronización
  syncNow: () => Promise<SyncResult>;
  getSyncStatus: () => Promise<{ success: number; failed: number }>;

  // Cache
  getCachedData: (resource: string) => Promise<any[]>;
  clearCache: () => Promise<void>;
  getCacheStats: () => Promise<any>;

  // Cola
  getQueueStats: () => Promise<any>;
  clearQueue: () => Promise<void>;
  removeFromQueue: (id: string) => Promise<void>;
}

export function useOfflineV2(): OfflineStateV2 & OfflineActionsV2 {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [cachedData, setCachedData] = useState({
    properties: 0,
    contracts: 0,
    payments: 0,
    maintenance: 0,
    notifications: 0,
    runnerDeliveries: 0,
    supportTickets: 0,
    maintenanceServices: 0,
  });
  const [totalCacheSize, setTotalCacheSize] = useState(0);

  // Actualizar estado del cache
  const updateCacheStats = useCallback(async () => {
    try {
      const stats = await indexedDBService.getStats();
      setCachedData({
        properties: stats.properties,
        contracts: stats.contracts,
        payments: stats.payments,
        maintenance: stats.maintenance,
        notifications: stats.notifications,
        runnerDeliveries: stats.runnerDeliveries,
        supportTickets: stats.supportTickets,
        maintenanceServices: stats.maintenanceServices,
      });
      setTotalCacheSize(stats.totalSize);
      setQueueSize(stats.queueLength);
    } catch (error) {
      logger.error('useOfflineV2: Failed to update cache stats', { error });
    }
  }, []);

  // Efectos de inicialización
  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    updateCacheStats();

    // Cargar última sincronización
    const lastSync = localStorage.getItem('rent360_lastSync');
    if (lastSync) {
      setLastSyncTime(new Date(lastSync));
    }

    // Listeners de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listeners de eventos de cola
    const handleQueueEvent = () => {
      updateCacheStats();
    };

    const handleSyncStarted = () => setIsSyncing(true);

    const handleSyncCompleted = (event: Event) => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      localStorage.setItem('rent360_lastSync', new Date().toISOString());
      updateCacheStats();
    };

    window.addEventListener('offline-queue-action-enqueued', handleQueueEvent);
    window.addEventListener('offline-queue-action-synced', handleQueueEvent);
    window.addEventListener('offline-queue-action-removed', handleQueueEvent);
    window.addEventListener('offline-queue-sync-started', handleSyncStarted);
    window.addEventListener('offline-queue-sync-completed', handleSyncCompleted);

    // Listener de mensajes del Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
          logger.info('useOfflineV2: Service Worker requested sync');
          offlineQueueService.processQueue();
        }
      });
    }

    // Actualizar stats periódicamente
    const interval = setInterval(updateCacheStats, 10000); // cada 10 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-action-enqueued', handleQueueEvent);
      window.removeEventListener('offline-queue-action-synced', handleQueueEvent);
      window.removeEventListener('offline-queue-action-removed', handleQueueEvent);
      window.removeEventListener('offline-queue-sync-started', handleSyncStarted);
      window.removeEventListener('offline-queue-sync-completed', handleSyncCompleted);
      clearInterval(interval);
    };
  }, [updateCacheStats]);

  // Crear recurso offline
  const createOffline = useCallback(
    async (resource: string, endpoint: string, data: any): Promise<string> => {
      logger.info('useOfflineV2: Creating resource offline', { resource, endpoint });

      // Generar ID temporal si no existe
      const tempId = data.id || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const resourceData = { ...data, id: tempId, _isOffline: true };

      // Guardar en IndexedDB inmediatamente
      await indexedDBService.cacheAPIResponse(resource, tempId, resourceData);

      // Agregar a la cola de sincronización
      const queueId = await offlineQueueService.enqueue({
        type: 'CREATE',
        resource,
        endpoint,
        data: resourceData,
      });

      updateCacheStats();
      return queueId;
    },
    [updateCacheStats]
  );

  // Actualizar recurso offline
  const updateOffline = useCallback(
    async (resource: string, endpoint: string, data: any): Promise<string> => {
      logger.info('useOfflineV2: Updating resource offline', { resource, endpoint });

      // Actualizar en IndexedDB
      await indexedDBService.cacheAPIResponse(resource, data.id, { ...data, _isOffline: true });

      // Agregar a la cola de sincronización
      const queueId = await offlineQueueService.enqueue({
        type: 'UPDATE',
        resource,
        endpoint,
        data,
      });

      updateCacheStats();
      return queueId;
    },
    [updateCacheStats]
  );

  // Eliminar recurso offline
  const deleteOffline = useCallback(
    async (resource: string, endpoint: string, id: string): Promise<string> => {
      logger.info('useOfflineV2: Deleting resource offline', { resource, endpoint, id });

      // Marcar como eliminado en IndexedDB (no eliminar aún por si falla sync)
      const cached = await indexedDBService.getCachedAPIResponse(resource, id);
      if (cached) {
        await indexedDBService.cacheAPIResponse(resource, id, {
          ...cached,
          _deleted: true,
          _isOffline: true,
        });
      }

      // Agregar a la cola de sincronización
      const queueId = await offlineQueueService.enqueue({
        type: 'DELETE',
        resource,
        endpoint,
        data: { id },
      });

      updateCacheStats();
      return queueId;
    },
    [updateCacheStats]
  );

  // Sincronizar ahora
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    logger.info('useOfflineV2: Manual sync triggered');
    return await offlineQueueService.processQueue();
  }, [isOnline]);

  // Obtener estado de sincronización
  const getSyncStatus = useCallback(async () => {
    const stats = await offlineQueueService.getStats();
    return {
      success: stats.total - stats.failed,
      failed: stats.failed,
    };
  }, []);

  // Obtener datos cacheados
  const getCachedData = useCallback(async (resource: string): Promise<any[]> => {
    return await indexedDBService.getAllCachedForResource(resource);
  }, []);

  // Limpiar cache
  const clearCache = useCallback(async (): Promise<void> => {
    await indexedDBService.clearAll();
    updateCacheStats();
    logger.info('useOfflineV2: Cache cleared');
  }, [updateCacheStats]);

  // Obtener estadísticas de cache
  const getCacheStats = useCallback(async () => {
    return await indexedDBService.getStats();
  }, []);

  // Obtener estadísticas de cola
  const getQueueStats = useCallback(async () => {
    return await offlineQueueService.getStats();
  }, []);

  // Limpiar cola
  const clearQueue = useCallback(async (): Promise<void> => {
    await offlineQueueService.clearQueue();
    updateCacheStats();
    logger.info('useOfflineV2: Queue cleared');
  }, [updateCacheStats]);

  // Eliminar de cola
  const removeFromQueue = useCallback(
    async (id: string): Promise<void> => {
      await offlineQueueService.removeAction(id);
      updateCacheStats();
    },
    [updateCacheStats]
  );

  return {
    // Estado
    isOnline,
    queueSize,
    isSyncing,
    lastSyncTime,
    cachedData,
    totalCacheSize,

    // Acciones offline
    createOffline,
    updateOffline,
    deleteOffline,

    // Sincronización
    syncNow,
    getSyncStatus,

    // Cache
    getCachedData,
    clearCache,
    getCacheStats,

    // Cola
    getQueueStats,
    clearQueue,
    removeFromQueue,
  };
}

// Hook simplificado solo para estado de conexión
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar tipo de conexión si está disponible
    if (
      'connection' in navigator ||
      'mozConnection' in navigator ||
      'webkitConnection' in navigator
    ) {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');

        const handleConnectionChange = () => {
          setConnectionType(connection.effectiveType || 'unknown');
        };

        connection.addEventListener('change', handleConnectionChange);

        return () => {
          connection.removeEventListener('change', handleConnectionChange);
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}
