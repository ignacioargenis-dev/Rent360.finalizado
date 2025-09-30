'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings
} from 'lucide-react';

import DashboardLayout from '@/components/layout/DashboardLayout';

export default function SatisfacciónPage() {

  const [loading, setLoading] = useState(true);



  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar carga de datos específicos de la página
      // const response = await fetch(`/api/support/reports/satisfaction`);
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
        title="Satisfacción"
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
        title="Satisfacción"
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
      title="Satisfacción"
      subtitle="Gestiona y visualiza la información de satisfacción"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                +0% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Satisfacción</CardTitle>
            <CardDescription>
              Aquí puedes gestionar y visualizar toda la información relacionada con satisfacción.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Satisfacción del Cliente</h3>
              <p className="text-gray-600 mb-4">
                Métricas de satisfacción, calificaciones y feedback de los usuarios del sistema.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Button variant="outline" className="flex flex-col items-center p-6">
                  <div className="text-2xl mb-2">4.6</div>
                  <span className="font-medium">Calificación Promedio</span>
                  <span className="text-sm text-gray-500">Sobre 5 estrellas</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-6">
                  <div className="text-2xl mb-2">89%</div>
                  <span className="font-medium">Clientes Satisfechos</span>
                  <span className="text-sm text-gray-500">4+ estrellas</span>
                </Button>
                <Button variant="outline" className="flex flex-col items-center p-6">
                  <div className="text-2xl mb-2">📈</div>
                  <span className="font-medium">Tendencia</span>
                  <span className="text-sm text-gray-500">+5% este mes</span>
                </Button>
              </div>
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
                <Plus className="w-6 h-6 mb-2" />
                <span>Agregar Nuevo</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Filter className="w-6 h-6 mb-2" />
                <span>Filtrar</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>Reportes</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Settings className="w-6 h-6 mb-2" />
                <span>Configuración</span>
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
