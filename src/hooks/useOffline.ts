import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

interface OfflineState {
  isOnline: boolean;
  isPWAInstalled: boolean;
  canInstallPWA: boolean;
  lastSyncTime: Date | null;
  pendingActions: string[];
  cachedData: any[];
}

interface OfflineActions {
  syncPendingActions: () => Promise<void>;
  cacheData: (data: any, key?: string) => Promise<void>;
  getCachedData: (key?: string) => Promise<any[]>;
  clearCache: () => Promise<void>;
  installPWA: () => Promise<void>;
}

export function useOffline(): OfflineState & OfflineActions {
  const [isOnline, setIsOnline] = useState(true);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const [cachedData, setCachedData] = useState<any[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Verificar estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Intentar sincronización automática
      syncPendingActions();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Estado inicial
    setIsOnline(navigator.onLine);

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar si es PWA instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    // Escuchar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Cargar datos offline
    loadOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Cargar datos offline desde localStorage
  const loadOfflineData = useCallback(() => {
    try {
      const lastSync = localStorage.getItem('rent360_lastSync');
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }

      const pending = localStorage.getItem('rent360_pendingActions');
      if (pending) {
        setPendingActions(JSON.parse(pending));
      }

      const cached = localStorage.getItem('rent360_cachedData');
      if (cached) {
        setCachedData(JSON.parse(cached));
      }
    } catch (error) {
      logger.error('Error loading offline data:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  // Sincronizar acciones pendientes
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    try {
      logger.info('Sincronizando acciones pendientes:', { count: pendingActions.length });

      // Aquí iría la lógica para sincronizar con el servidor
      // Por ahora simulamos la sincronización
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpiar acciones pendientes después de sincronización exitosa
      setPendingActions([]);
      setLastSyncTime(new Date());

      // Actualizar localStorage
      localStorage.setItem('rent360_lastSync', new Date().toISOString());
      localStorage.removeItem('rent360_pendingActions');

      // Notificar al service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SYNC_COMPLETED',
          data: { timestamp: Date.now() }
        });
      }

    } catch (error) {
      logger.error('Error sincronizando acciones pendientes:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, [isOnline, pendingActions]);

  // Cachear datos localmente
  const cacheData = useCallback(async (data: any, key?: string) => {
    try {
      const cacheKey = key || `cache_${Date.now()}`;
      const cacheEntry = {
        key: cacheKey,
        data,
        timestamp: new Date().toISOString(),
      };

      // Agregar a estado
      setCachedData(prev => [...prev, cacheEntry]);

      // Guardar en localStorage
      const existingCache = JSON.parse(localStorage.getItem('rent360_cachedData') || '[]');
      existingCache.push(cacheEntry);
      localStorage.setItem('rent360_cachedData', JSON.stringify(existingCache));

      // Notificar al service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_DATA',
          data: cacheEntry,
        });
      }

    } catch (error) {
      logger.error('Error cacheando datos:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  // Obtener datos cacheados
  const getCachedData = useCallback(async (key?: string) => {
    try {
      if (key) {
        return cachedData.filter(item => item.key === key);
      }
      return cachedData;
    } catch (error) {
      logger.error('Error obteniendo datos cacheados:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }, [cachedData]);

  // Limpiar cache
  const clearCache = useCallback(async () => {
    try {
      setCachedData([]);
      localStorage.removeItem('rent360_cachedData');

      // Notificar al service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CLEAR_CACHE',
        });
      }
    } catch (error) {
      logger.error('Error limpiando cache:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        logger.info('PWA instalada exitosamente');
        setIsPWAInstalled(true);
      }

      setDeferredPrompt(null);
      setCanInstallPWA(false);
    } catch (error) {
      logger.error('Error instalando PWA:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, [deferredPrompt]);

  return {
    // Estado
    isOnline,
    isPWAInstalled,
    canInstallPWA,
    lastSyncTime,
    pendingActions,
    cachedData,

    // Acciones
    syncPendingActions,
    cacheData,
    getCachedData,
    clearCache,
    installPWA,
  };
}

// Hook específico para manejar acciones offline
export function useOfflineActions() {
  const [pendingActions, setPendingActions] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('rent360_pendingActions');
    if (stored) {
      setPendingActions(JSON.parse(stored));
    }
  }, []);

  const addPendingAction = useCallback((action: string) => {
    setPendingActions(prev => {
      const updated = [...prev, action];
      localStorage.setItem('rent360_pendingActions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removePendingAction = useCallback((index: number) => {
    setPendingActions(prev => {
      const updated = prev.filter((_, i) => i !== index);
      localStorage.setItem('rent360_pendingActions', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    localStorage.removeItem('rent360_pendingActions');
  }, []);

  return {
    pendingActions,
    addPendingAction,
    removePendingAction,
    clearPendingActions,
  };
}

// Hook para detectar cambios de conexión
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Detectar tipo de conexión
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection.effectiveType || 'unknown');

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType || 'unknown');
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, connectionType };
}

// Hook para manejar service worker
export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    // Temporalmente deshabilitado para evitar errores con APIs que requieren autenticación
    logger.info('Service Worker registration disabled to prevent API errors');
    setIsSupported(false); // Indicar que no está soportado para evitar confusiones
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
        setUpdateAvailable(false);
      });
    }
  };

  const skipWaiting = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isSupported,
    isRegistered,
    isActive,
    updateAvailable,
    updateServiceWorker,
    skipWaiting,
  };
}
