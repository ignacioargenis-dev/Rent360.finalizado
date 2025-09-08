// PWA Service - Gestión de Progressive Web App
import { logger } from './logger';
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
  private isOnline = navigator.onLine;
  private config: PWAConfig = {
    name: 'Rent360 - Plataforma de Arrendamiento Inteligente',
    shortName: 'Rent360',
    description: 'Plataforma completa de arrendamiento con gestión de propiedades, contratos, pagos y servicios de mantenimiento.',
    themeColor: '#059669',
    backgroundColor: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    startUrl: '/',
  };

  constructor() {
    this.initializePWA();
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
    // Verificar si la app está en modo standalone (instalada)
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true;
    
    // Verificar si está en la pantalla de inicio
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        this.isInstalled = apps.length > 0;
      });
    }
  }

  private listenForInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.dispatchEvent('pwa-install-available');
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.dispatchEvent('pwa-installed');
    });
  }

  private listenForConnectivityChanges() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.dispatchEvent('pwa-online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.dispatchEvent('pwa-offline');
    });
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        logger.info('Service Worker registrado:', { scope: registration.scope });
        
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
        logger.error('Error al registrar Service Worker:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  private async setupOfflineCache() {
    // Configurar cache para recursos críticos
    const criticalResources = [
      '/',
      '/offline',
      '/api/properties',
      '/api/contracts',
      '/api/payments',
      '/api/user/profile',
    ];

    if ('caches' in window) {
      try {
        const cache = await caches.open('rent360-critical-v1');
        await cache.addAll(criticalResources);
      } catch (error) {
        logger.error('Error al configurar cache offline:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  // Métodos públicos
  public async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      
      return outcome === 'accepted';
    } catch (error) {
      logger.error('Error al mostrar prompt de instalación:', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  public canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled;
  }

  public isPWAInstalled(): boolean {
    return this.isInstalled;
  }

  public isOnlineMode(): boolean {
    return this.isOnline;
  }

  public async updateApp(): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  }

  public async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
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
    const event = new CustomEvent(eventName, { detail });
    window.dispatchEvent(event);
  }

  public on(eventName: string, callback: (event: CustomEvent) => void) {
    window.addEventListener(eventName, callback as EventListener);
  }

  public off(eventName: string, callback: (event: CustomEvent) => void) {
    window.removeEventListener(eventName, callback as EventListener);
  }

  // Métodos de utilidad
  public async shareData(data: ShareData): Promise<boolean> {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        logger.error('Error al compartir:', { error: error instanceof Error ? error.message : String(error) });
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
        logger.error('Error al obtener información de batería:', { error: error instanceof Error ? error.message : String(error) });
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
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
        return true;
      } catch (error) {
        logger.error('Error al enviar notificación:', { error: error instanceof Error ? error.message : String(error) });
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

// Importar useState y useEffect para el hook
import { useState, useEffect } from 'react';
