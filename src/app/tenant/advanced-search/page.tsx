'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
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
  Settings,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function BúsquedaAvanzadaPage() {
  const router = useRouter();

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

      // Cargar datos de propiedades para búsqueda avanzada
      const propertiesResponse = await fetch('/api/properties?limit=100');
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        // Aquí se procesarían los datos para la búsqueda avanzada
        logger.debug('Propiedades cargadas para búsqueda avanzada:', {
          count: propertiesData.properties?.length || 0,
        });
      }

      // Cargar filtros disponibles
      const filtersResponse = await fetch('/api/properties/filters');
      if (filtersResponse.ok) {
        const filtersData = await filtersResponse.json();
        // Aquí se configurarían los filtros disponibles
        logger.debug('Filtros cargados para búsqueda avanzada:', { filters: filtersData });
      }
    } catch (error) {
      logger.error('Error cargando datos de búsqueda avanzada:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = () => {
    // Mock data for saved search
    const currentFilters = {
      location: 'Las Condes',
      priceRange: { min: 300000, max: 600000 },
      bedrooms: 2,
      bathrooms: 1,
      propertyType: 'APARTMENT',
      features: ['parking', 'elevator']
    };

    // Save to localStorage for demo (in real app this would go to API)
    const savedSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
    const newSearch = {
      id: Date.now().toString(),
      name: `Búsqueda ${new Date().toLocaleDateString()}`,
      filters: currentFilters,
      createdAt: new Date().toISOString()
    };

    savedSearches.push(newSearch);
    localStorage.setItem('savedSearches', JSON.stringify(savedSearches));

    alert('Búsqueda guardada exitosamente');
  };

  const handleOpenFilters = () => {
    // Scroll to filter section or open modal
    const filterSection = document.querySelector('[data-filters]');
    if (filterSection) {
      filterSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If no filter section exists, navigate to properties search
      router.push('/properties/search');
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Búsqueda Avanzada" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Búsqueda Avanzada" subtitle="Error al cargar la página">
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
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Búsqueda Avanzada"
      subtitle="Gestiona y visualiza la información de búsqueda avanzada"
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
            <CardTitle>Búsqueda Avanzada</CardTitle>
            <CardDescription>
              Aquí puedes gestionar y visualizar toda la información relacionada con búsqueda
              avanzada.
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
                label="Nueva Búsqueda"
                description="Buscar propiedad"
                onClick={() => {
                  // Reset search and scroll to top
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar propiedades"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.value = '';
                    searchInput.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              />

              <QuickActionButton
                icon={Filter}
                label="Filtros"
                description="Aplicar filtros"
                onClick={handleOpenFilters}
              />

              <QuickActionButton
                icon={Download}
                label="Guardar"
                description="Guardar búsqueda"
                onClick={handleSaveSearch}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Comparar"
                description="Ver análisis"
                onClick={() => router.push('/tenant/reports')}
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
                description="Nueva búsqueda"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
