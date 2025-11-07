'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { websocketClient } from '@/lib/websocket/socket-client';

// 🚨 LOG A NIVEL DE MÓDULO (se ejecuta una vez cuando se importa)
console.log('🚨🚨🚨🚨🚨 [CONNECTION STATUS MODULE] ConnectionStatus.tsx LOADED 🚨🚨🚨🚨🚨');
console.log('🚨 [CONNECTION STATUS] Module loaded at:', new Date().toISOString());
console.log('🚨 [CONNECTION STATUS] typeof window:', typeof window);
console.log('🚨 [CONNECTION STATUS] websocketClient available:', !!websocketClient);

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function ConnectionStatus({
  showDetails = false,
  className = '',
}: ConnectionStatusProps) {
  // 🚨 LOG EN CADA RENDER
  console.log('🚨🚨🚨🚨🚨 [CONNECTION STATUS] COMPONENT RENDERED 🚨🚨🚨🚨🚨');
  console.log('🚨 [CONNECTION STATUS] Render at:', new Date().toISOString());
  console.log('🚨 [CONNECTION STATUS] Current props:', { showDetails, className });

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(() => {
    const connected = websocketClient.isConnected;
    console.log('🚨 [CONNECTION STATUS] Initial isConnected state:', connected);
    return connected;
  });

  // Escuchar cambios en el estado de conexión
  useEffect(() => {
    const handleConnect = () => {
      console.log('🔥 [CONNECTION STATUS] Connect event received, setting connected to true');
      setIsConnected(true);
    };
    const handleDisconnect = () => {
      console.log('🔥 [CONNECTION STATUS] Disconnect event received, setting connected to false');
      setIsConnected(false);
    };

    websocketClient.on('connect', handleConnect);
    websocketClient.on('disconnect', handleDisconnect);

    // Verificar estado inicial
    console.log(
      '🔥 [CONNECTION STATUS] Initial state - websocketClient.isConnected:',
      websocketClient.isConnected
    );
    setIsConnected(websocketClient.isConnected);

    return () => {
      websocketClient.off('connect', handleConnect);
      websocketClient.off('disconnect', handleDisconnect);
    };
  }, []);

  const handleReconnect = () => {
    setIsReconnecting(true);

    // Desconectar y reconectar
    websocketClient.disconnect();

    // Intentar reconectar después de un breve delay
    setTimeout(async () => {
      await websocketClient.connect(); // Sin userId para reconexión
      setIsReconnecting(false);
    }, 1000);
  };

  const getStatusText = () => {
    if (isReconnecting) {
      return 'Reconectando...';
    }
    if (isConnected) {
      return 'Conectado';
    }
    return 'Desconectado';
  };

  const getStatusIcon = () => {
    if (isReconnecting) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (isConnected) {
      return <CheckCircle className="w-4 h-4" />;
    }
    return <WifiOff className="w-4 h-4" />;
  };

  const getStatusColor = () => {
    if (isReconnecting) {
      return 'bg-yellow-500';
    }
    if (isConnected) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  };

  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-xs text-gray-600">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-medium">Estado de Conexión</h3>
        </div>
        <Badge className={getStatusColor()}>{getStatusText()}</Badge>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Socket.IO:</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Activo</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Inactivo</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Notificaciones:</span>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Habilitadas</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600">Pendientes</span>
              </>
            )}
          </div>
        </div>

        {!isConnected && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Conexión perdida</p>
              <p className="text-xs">
                Las actualizaciones en tiempo real no están disponibles. Intenta reconectar para
                restaurar la funcionalidad completa.
              </p>
            </div>
          </div>
        )}

        {!isConnected && (
          <Button onClick={handleReconnect} disabled={isReconnecting} className="w-full" size="sm">
            {isReconnecting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reconectando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reconectar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
