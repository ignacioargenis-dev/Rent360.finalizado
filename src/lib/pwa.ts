// PWA Service - Gestión de Progressive Web App
import { logger } from './logger';
import { useState, useEffect } from 'react'; // IMPORTAR ANTES DE USAR
export interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'portrait' | 'landscape' | 'portrait-primary' | 'landscape-primary';
  scope: string;
  startUrl: string;
}

class PWAService {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private isInstalled = false;
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isInitialized = false;
  private config: PWAConfig = {
    name: 'Rent360 - Plataforma de Arrendamiento Inteligente',
    shortName: 'Rent360',
    description:
      'Plataforma completa de arrendamiento con gestión de propiedades, contratos, pagos y servicios de mantenimiento.',
    themeColor: '#059669',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    startUrl: '/',
  };

  constructor() {
    // No inicializar automáticamente para evitar problemas de SSR
    // La inicialización se hará de forma lazy cuando se necesite
  }

  private initializePWA() {
    // Detectar si la PWA ya está instalada
    this.checkInstallation();

    // Escuchar eventos de instalación
    this.listenForInstallPrompt();

    // Escuchar cambios de conectividad
    this.listenForConnectivityChanges();

    // Registrar service worker
    this.registerServiceWorker();

    // Configurar cache offline
    this.setupOfflineCache();
  }

  private checkInstallation() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Verificar si la app está en modo standalone (instalada)
      this.isInstalled =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      // Verificar si está en la pantalla de inicio
      if ('getInstalledRelatedApps' in navigator) {
        (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
          this.isInstalled = apps.length > 0;
        });
      }
    } catch (error) {
      this.isInstalled = false;
    }
  }

  private listenForInstallPrompt() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // ⚡ OPTIMIZACIÓN: Usar passive listeners para mejor performance
      window.addEventListener(
        'beforeinstallprompt',
        e => {
          e.preventDefault();
          this.deferredPrompt = e as any;
          this.dispatchEvent('pwa-install-available');
        },
        { passive: false }
      );

      window.addEventListener(
        'appinstalled',
        () => {
          this.isInstalled = true;
          this.deferredPrompt = null;
          this.dispatchEvent('pwa-installed');
        },
        { passive: true }
      );
    } catch (error) {
      // Ignore errors in SSR
    }
  }

  private listenForConnectivityChanges() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // ⚡ OPTIMIZACIÓN: Usar passive listeners y throttling para eventos de conectividad
      let lastConnectivityChange = 0;
      const CONNECTIVITY_THROTTLE_MS = 1000; // Throttle connectivity changes to max 1 per second

      window.addEventListener(
        'online',
        () => {
          const now = Date.now();
          if (now - lastConnectivityChange < CONNECTIVITY_THROTTLE_MS) {
            return;
          }
          lastConnectivityChange = now;

          this.isOnline = true;
          this.dispatchEvent('pwa-online');
        },
        { passive: true }
      );

      window.addEventListener(
        'offline',
        () => {
          const now = Date.now();
          if (now - lastConnectivityChange < CONNECTIVITY_THROTTLE_MS) {
            return;
          }
          lastConnectivityChange = now;

          this.isOnline = false;
          this.dispatchEvent('pwa-offline');
        },
        { passive: true }
      );
    } catch (error) {
      // Ignore errors in SSR
    }
  }

  private async registerServiceWorker() {
    // ⚠️ TEMPORALMENTE DESHABILITADO: Service Worker que causa errores 404
    // TODO: Re-habilitar cuando se confirme que el dashboard funciona
    /*
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('Service Worker registrado:', { scope: registration.scope });

        // Escuchar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.dispatchEvent('pwa-update-available');
              }
            });
          }
        });
      } catch (error) {
        console.warn('Error al registrar Service Worker:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    */
  }

  private async setupOfflineCache() {
    // DESACTIVAR temporalmente el cache offline que causa errores
    // Solo ejecutar en el navegador, no durante SSR
    if (typeof window === 'undefined') {
      return;
    }

    // Cache mínimo solo para recursos críticos existentes
    const criticalResources = [
      '/offline', // Solo página offline
    ];

    if ('caches' in window) {
      try {
        const cache = await caches.open('rent360-minimal-v1');
        // Solo cachear recursos que existen
        for (const resource of criticalResources) {
          try {
            await cache.add(resource);
          } catch (error) {
            // Ignorar errores individuales de recursos
            console.warn(`No se pudo cachear: ${resource}`);
          }
        }
      } catch (error) {
        console.warn('Error al configurar cache mínimo:', error);
      }
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.isInitialized = true;
      this.initializePWA();
    }
  }

  // Métodos públicos
  public async showInstallPrompt(): Promise<boolean> {
    this.ensureInitialized();
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;

      return outcome === 'accepted';
    } catch (error) {
      console.warn('Error al mostrar prompt de instalación:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  public canInstall(): boolean {
    this.ensureInitialized();
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  public isPWAInstalled(): boolean {
    this.ensureInitialized();
    return this.isInstalled;
  }

  public isOnlineMode(): boolean {
    this.ensureInitialized();
    return this.isOnline;
  }

  public async updateApp(): Promise<void> {
    this.ensureInitialized();
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }

  public async clearCache(): Promise<void> {
    this.ensureInitialized();
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
  }

  public getConfig(): PWAConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<PWAConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Eventos personalizados
  private dispatchEvent(eventName: string, detail?: any) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    } catch (error) {
      // Ignore errors in SSR
    }
  }

  public on(eventName: string, callback: (event: CustomEvent) => void) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.addEventListener(eventName, callback as EventListener);
    } catch (error) {
      // Ignore errors in SSR
    }
  }

  public off(eventName: string, callback: (event: CustomEvent) => void) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.removeEventListener(eventName, callback as EventListener);
    } catch (error) {
      // Ignore errors in SSR
    }
  }

  // Métodos de utilidad
  public async shareData(data: ShareData): Promise<boolean> {
    this.ensureInitialized();
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.warn('Error al compartir:', {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }
    return false;
  }

  public async getBatteryInfo(): Promise<any | null> {
    if ('getBattery' in navigator) {
      try {
        return await (navigator as any).getBattery();
      } catch (error) {
        console.warn('Error al obtener información de batería:', {
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }
    }
    return null;
  }

  public async getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      deviceMemory: (navigator as any).deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      vendor: navigator.vendor,
    };
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  public async sendNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    this.ensureInitialized();
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, options);
        return true;
      } catch (error) {
        console.warn('Error al enviar notificación:', {
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }
    return false;
  }
}

// Instancia singleton
export const pwaService = new PWAService();

// Hook personalizado para React
export const usePWA = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const updateState = () => {
      setCanInstall(pwaService.canInstall());
      setIsInstalled(pwaService.isPWAInstalled());
      setIsOnline(pwaService.isOnlineMode());
    };

    // Estado inicial
    updateState();

    // Escuchar eventos
    const handleInstallAvailable = () => setCanInstall(true);
    const handleInstalled = () => setIsInstalled(true);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleUpdateAvailable = () => setHasUpdate(true);

    pwaService.on('pwa-install-available', handleInstallAvailable);
    pwaService.on('pwa-installed', handleInstalled);
    pwaService.on('pwa-online', handleOnline);
    pwaService.on('pwa-offline', handleOffline);
    pwaService.on('pwa-update-available', handleUpdateAvailable);

    return () => {
      pwaService.off('pwa-install-available', handleInstallAvailable);
      pwaService.off('pwa-installed', handleInstalled);
      pwaService.off('pwa-online', handleOnline);
      pwaService.off('pwa-offline', handleOffline);
      pwaService.off('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  return {
    canInstall,
    isInstalled,
    isOnline,
    hasUpdate,
    showInstallPrompt: pwaService.showInstallPrompt.bind(pwaService),
    updateApp: pwaService.updateApp.bind(pwaService),
    clearCache: pwaService.clearCache.bind(pwaService),
    shareData: pwaService.shareData.bind(pwaService),
    sendNotification: pwaService.sendNotification.bind(pwaService),
  };
};
