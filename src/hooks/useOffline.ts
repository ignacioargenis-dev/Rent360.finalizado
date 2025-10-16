import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger-minimal';

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

  // Verificar estado de conexión - simplificado para evitar errores
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true);
    }

    // Escuchar evento de instalación PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Cargar datos offline desde localStorage - simplificado
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
      console.warn('Error loading offline data:', error);
    }
  }, []);

  // Sincronizar acciones pendientes - simplificado
  const syncPendingActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) {
      return;
    }

    try {
      console.log('Sincronizando acciones pendientes:', { count: pendingActions.length });

      // Aquí iría la lógica para sincronizar con el servidor
      // Por ahora simulamos la sincronización
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpiar acciones pendientes después de sincronización exitosa
      setPendingActions([]);
      setLastSyncTime(new Date());

      // Actualizar localStorage
      localStorage.setItem('rent360_lastSync', new Date().toISOString());
      localStorage.removeItem('rent360_pendingActions');
    } catch (error) {
      console.warn('Error sincronizando acciones pendientes:', error);
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
      console.warn('Error cacheando datos:', error);
    }
  }, []);

  // Obtener datos cacheados
  const getCachedData = useCallback(
    async (key?: string) => {
      try {
        if (key) {
          return cachedData.filter(item => item.key === key);
        }
        return cachedData;
      } catch (error) {
        console.warn('Error obteniendo datos cacheados:', error);
        return [];
      }
    },
    [cachedData]
  );

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
      console.warn('Error limpiando cache:', error);
    }
  }, []);

  // Instalar PWA
  const installPWA = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('PWA instalada exitosamente');
        setIsPWAInstalled(true);
      }

      setDeferredPrompt(null);
      setCanInstallPWA(false);
    } catch (error) {
      console.warn('Error instalando PWA:', error);
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
    // ⚠️ TEMPORALMENTE DESHABILITADO: Service Worker que causa errores 404
    // TODO: Re-habilitar cuando se confirme que el dashboard funciona
    /*
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');

      console.log('Service Worker registrado:', { scope: registration.scope });

      setIsRegistered(true);

      // Verificar si hay actualización disponible
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });

      // Verificar estado del service worker
      if (navigator.serviceWorker.controller) {
        setIsActive(true);
      } else {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setIsActive(true);
        });
      }

      // ⚡ OPTIMIZACIÓN: Escuchar mensajes del service worker con throttling
      let lastMessageTime = 0;
      const MESSAGE_THROTTLE_MS = 100; // Throttle messages to max 10 per second
      
      navigator.serviceWorker.addEventListener('message', event => {
        const now = Date.now();
        if (now - lastMessageTime < MESSAGE_THROTTLE_MS) {
          return; // Skip this message to prevent spam
        }
        lastMessageTime = now;

        try {
          const { type, data } = event.data;

          switch (type) {
            case 'SYNC_COMPLETED':
              console.log('Sincronización completada:', { data });
              break;
            case 'SYNC_FAILED':
              console.warn('Sincronización fallida:', { data });
              break;
            default:
              console.debug('Mensaje del Service Worker:', { type, data });
          }
        } catch (error) {
          console.warn('Error procesando mensaje del Service Worker:', error);
        }
      });
    } catch (error) {
      console.warn('Error registrando Service Worker:', error);
    }
    */
  };

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
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
