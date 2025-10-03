'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function MantenimientoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
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
      // const response = await fetch(`/api/tenant/maintenance`);
      // const result = await response.json();
      // setData(result);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Mantenimiento" subtitle="Cargando información...">
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
      <DashboardLayout title="Mantenimiento" subtitle="Error al cargar la página">
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
      title="Mantenimiento"
      subtitle="Gestiona y visualiza la información de mantenimiento"
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
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Mantenimiento</CardTitle>
            <CardDescription>
              Aquí puedes gestionar y visualizar toda la información relacionada con mantenimiento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido en desarrollo</h3>
              <p className="text-gray-600 mb-4">
                Esta página está siendo desarrollada. Pronto tendrás acceso a todas las
                funcionalidades.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Solicitud"
                description="Reportar problema"
                onClick={() =>
                  alert('Funcionalidad: Abrir formulario para nueva solicitud de mantenimiento')
                }
              />

              <QuickActionButton
                icon={Filter}
                label="Filtrar"
                description="Buscar solicitudes"
                onClick={() => {
                  // Focus on search input
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar solicitudes"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar reportes"
                onClick={() => {
                  alert('Funcionalidad: Exportar historial de solicitudes en formato PDF');
                }}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Historial completo"
                onClick={() => router.push('/tenant/reports/maintenance')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Preferencias"
                onClick={() => router.push('/tenant/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
