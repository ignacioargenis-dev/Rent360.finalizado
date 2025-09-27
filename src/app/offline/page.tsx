'use client';

import React, { useState, useEffect } from 'react';

// Forzar renderizado dinámico para evitar errores de prerendering con APIs del navegador
export const dynamic = 'force-dynamic';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  WifiOff,
  RefreshCw,
  Home,
  Settings,
  MessageSquare,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingActions, setPendingActions] = useState<string[]>([]);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Verificar estado de conexión
    const checkOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    checkOnlineStatus();
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);

    // Cargar datos offline almacenados
    loadOfflineData();

    return () => {
      window.removeEventListener('online', checkOnlineStatus);
      window.removeEventListener('offline', checkOnlineStatus);
    };
  }, []);

  const loadOfflineData = async () => {
    try {
      // Intentar cargar datos desde cache/localStorage
      const cachedLastSync = localStorage.getItem('rent360_lastSync');
      if (cachedLastSync) {
        setLastSync(new Date(cachedLastSync));
      }

      const cachedPendingActions = localStorage.getItem('rent360_pendingActions');
      if (cachedPendingActions) {
        setPendingActions(JSON.parse(cachedPendingActions));
      }
    } catch (error) {
      logger.error('Error loading offline data:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const syncPendingActions = async () => {
    if (!navigator.onLine) return;

    try {
      // Aquí iría la lógica para sincronizar acciones pendientes
      logger.info('Sincronizando acciones pendientes...');

      // Simular sincronización
      setTimeout(() => {
        setPendingActions([]);
        setLastSync(new Date());
        localStorage.setItem('rent360_lastSync', new Date().toISOString());
        localStorage.removeItem('rent360_pendingActions');
      }, 2000);
    } catch (error) {
      logger.error('Error sincronizando:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {!isOnline ? (
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-bold">
            {!isOnline ? 'Sin Conexión a Internet' : 'Conexión Restaurada'}
          </CardTitle>

          <CardDescription className="text-lg">
            {!isOnline
              ? 'Rent360 funciona parcialmente sin conexión. Algunas funcionalidades pueden estar limitadas.'
              : '¡Excelente! Tu conexión ha sido restaurada.'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Estado de Conexión */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              {!isOnline ? (
                <WifiOff className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <span className="font-medium">
                {!isOnline ? 'Sin conexión' : 'Conectado'}
              </span>
            </div>
            <Badge variant={!isOnline ? 'destructive' : 'default'}>
              {!isOnline ? 'Offline' : 'Online'}
            </Badge>
          </div>

          {/* Última Sincronización */}
          {lastSync && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Última sincronización
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {lastSync.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Acciones Pendientes */}
          {pendingActions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Acciones Pendientes
                </CardTitle>
                <CardDescription>
                  Estas acciones se sincronizarán cuando recuperes la conexión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingActions.map((action, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">{action}</span>
                    </div>
                  ))}
                </div>

                {isOnline && (
                  <Button
                    onClick={syncPendingActions}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Sincronizar Ahora
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Funcionalidades Offline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Funcionalidades Disponibles Offline</CardTitle>
              <CardDescription>
                Puedes continuar usando estas funciones sin conexión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Home className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Ver Propiedades</p>
                    <p className="text-sm text-gray-600">Propiedades guardadas</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Ver Contratos</p>
                    <p className="text-sm text-gray-600">Contratos guardados</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Settings className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Configuración</p>
                    <p className="text-sm text-gray-600">Ajustes locales</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Mensajes</p>
                    <p className="text-sm text-gray-600">Mensajes offline</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleRetry}
              className="flex-1"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar Conexión
            </Button>

            <Button
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>

          {/* Información Adicional */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Rent360 está optimizado para funcionar sin conexión.</p>
            <p>Los cambios se sincronizarán automáticamente cuando recuperes la conexión.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
