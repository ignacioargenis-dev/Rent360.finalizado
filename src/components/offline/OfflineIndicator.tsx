'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { offlineQueueService } from '@/lib/offline/offline-queue-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [queueSize, setQueueSize] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Estado inicial
    setIsOnline(navigator.onLine);
    updateQueueSize();

    // Listeners de conexión
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listeners de la cola offline
    const handleQueueChange = () => {
      updateQueueSize();
    };

    const handleSyncStarted = () => {
      setIsSyncing(true);
    };

    const handleSyncCompleted = () => {
      setIsSyncing(false);
      setLastSyncTime(new Date());
      updateQueueSize();
    };

    window.addEventListener('offline-queue-action-enqueued', handleQueueChange);
    window.addEventListener('offline-queue-action-synced', handleQueueChange);
    window.addEventListener('offline-queue-action-removed', handleQueueChange);
    window.addEventListener('offline-queue-sync-started', handleSyncStarted);
    window.addEventListener('offline-queue-sync-completed', handleSyncCompleted);

    // Actualizar cola periódicamente
    const interval = setInterval(updateQueueSize, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-action-enqueued', handleQueueChange);
      window.removeEventListener('offline-queue-action-synced', handleQueueChange);
      window.removeEventListener('offline-queue-action-removed', handleQueueChange);
      window.removeEventListener('offline-queue-sync-started', handleSyncStarted);
      window.removeEventListener('offline-queue-sync-completed', handleSyncCompleted);
      clearInterval(interval);
    };
  }, []);

  const updateQueueSize = async () => {
    try {
      const size = await offlineQueueService.getQueueSize();
      setQueueSize(size);
    } catch (error) {
      console.error('Failed to update queue size:', error);
    }
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) {
      return;
    }

    setIsSyncing(true);
    try {
      await offlineQueueService.processQueue();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // No mostrar nada si está online y no hay cola
  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-300 ${
        showDetails ? 'h-auto' : 'h-12'
      }`}
    >
      <div className={`w-full ${isOnline ? 'bg-blue-600' : 'bg-red-600'} text-white shadow-lg`}>
        {/* Barra principal */}
        <div
          className="h-12 px-4 flex items-center justify-between cursor-pointer"
          onClick={() => setShowDetails(!showDetails)}
        >
          <div className="flex items-center gap-3">
            {/* Icono de estado */}
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5 animate-pulse" />
            )}

            {/* Texto de estado */}
            <span className="font-medium">
              {isOnline ? (
                queueSize > 0 ? (
                  isSyncing ? (
                    <>Sincronizando...</>
                  ) : (
                    <>Conectado - {queueSize} acciones pendientes</>
                  )
                ) : (
                  <>Conectado</>
                )
              ) : (
                <>Sin conexión - Modo Offline</>
              )}
            </span>

            {/* Badge con número de acciones */}
            {queueSize > 0 && (
              <Badge variant="secondary" className="bg-white text-blue-600">
                {queueSize}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de sincronización */}
            {isOnline && queueSize > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={e => {
                  e.stopPropagation();
                  handleSync();
                }}
                disabled={isSyncing}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            )}

            {/* Indicador de detalles */}
            <div className="text-xs opacity-75">
              {showDetails ? '▼ Ocultar' : '▶ Ver detalles'}
            </div>
          </div>
        </div>

        {/* Panel de detalles expandible */}
        {showDetails && (
          <div className="border-t border-white/20 p-4 bg-black/10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Estado de conexión */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-semibold">Estado de Conexión</div>
                    <div className="text-sm opacity-90">
                      {isOnline ? 'Conectado a internet' : 'Sin conexión a internet'}
                    </div>
                  </div>
                </div>

                {/* Acciones pendientes */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    {queueSize > 0 ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">Acciones Pendientes</div>
                    <div className="text-sm opacity-90">
                      {queueSize === 0
                        ? 'Todo sincronizado'
                        : `${queueSize} ${queueSize === 1 ? 'acción pendiente' : 'acciones pendientes'}`}
                    </div>
                  </div>
                </div>

                {/* Última sincronización */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="font-semibold">Última Sincronización</div>
                    <div className="text-sm opacity-90">
                      {isSyncing
                        ? 'Sincronizando ahora...'
                        : lastSyncTime
                          ? lastSyncTime.toLocaleTimeString()
                          : 'Nunca'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Consejos y avisos */}
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <div className="text-sm">
                  {isOnline ? (
                    queueSize > 0 ? (
                      <>
                        <strong>💡 Consejo:</strong> Las acciones realizadas sin conexión se están
                        sincronizando automáticamente. Puedes seguir trabajando con normalidad.
                      </>
                    ) : (
                      <>
                        <strong>✅ Todo sincronizado:</strong> Todos tus cambios están guardados en
                        el servidor.
                      </>
                    )
                  ) : (
                    <>
                      <strong>⚠️ Modo Offline:</strong> Trabajas sin conexión. Los cambios se
                      guardarán localmente y se sincronizarán automáticamente cuando recuperes la
                      conexión.
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
