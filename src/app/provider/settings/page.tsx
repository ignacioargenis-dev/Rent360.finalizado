'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  Bell,
  RefreshCw,
  AlertTriangle,
  Save,
  User,
  Settings,
  Zap,
  Info,
  Lock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [, ] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar carga de datos específicos de la página
      // const response = await fetch('/api/provider/settings');
      // const result = await response.json();
      // setData(result);
      
      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      logger.error('Error loading page data:', { error: error instanceof Error ? error.message : String(error) });
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout 
        title="Configuración del Proveedor"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout 
        title="Configuración del Proveedor"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Configuración del Proveedor"
      subtitle="Configura tu perfil y preferencias como proveedor"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuraciones Activas</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">18</div>
              <p className="text-xs text-muted-foreground">
                +2 desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Configurados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +1 desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notificaciones</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6</div>
              <p className="text-xs text-muted-foreground">
                +1 desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Integraciones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                +0 desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Proveedor</CardTitle>
            <CardDescription>
              Configura tu perfil y preferencias como proveedor en Rent360.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido en desarrollo</h3>
              <p className="text-gray-600 mb-4">
                Esta página está siendo desarrollada. Pronto tendrás acceso a todas las opciones de configuración del proveedor.
              </p>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Accede rápidamente a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <User className="w-6 h-6 mb-2" />
                <span>Perfil</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Bell className="w-6 h-6 mb-2" />
                <span>Notificaciones</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Shield className="w-6 h-6 mb-2" />
                <span>Seguridad</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Zap className="w-6 h-6 mb-2" />
                <span>Integraciones</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Lock className="w-6 h-6 mb-2" />
                <span>Privacidad</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

