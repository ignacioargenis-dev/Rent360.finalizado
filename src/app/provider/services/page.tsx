'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Wrench,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Edit,
  Eye,
  TrendingUp,
  Users,
  Star,
  Settings,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function ProviderServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadPageData();

    // Escuchar eventos de actualización de servicios
    const handleServiceUpdate = () => {
      console.log(
        '🔄 [PROVIDER SERVICES] Evento de actualización de servicios detectado, recargando...'
      );
      loadPageData();
    };

    window.addEventListener('r360-service-created', handleServiceUpdate);
    window.addEventListener('focus', handleServiceUpdate); // Recargar al volver a la pestaña

    return () => {
      window.removeEventListener('r360-service-created', handleServiceUpdate);
      window.removeEventListener('focus', handleServiceUpdate);
    };
  }, []);

  const loadPageData = async () => {
    try {
      console.log('🔄 [PROVIDER SERVICES] Iniciando carga de datos...');
      setLoading(true);
      setError(null);

      // Cargar servicios reales desde la API - agregar timestamp para evitar caché
      const url = `/api/provider/services?t=${Date.now()}`;
      console.log('📡 [PROVIDER SERVICES] Llamando a API:', url);

      const response = await fetch(url, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      console.log('📥 [PROVIDER SERVICES] Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const apiData = await response.json();
        // ✅ Logs en consola del navegador para diagnóstico
        console.log('📦 [PROVIDER SERVICES] Datos recibidos de API de servicios:', {
          success: apiData.success,
          servicesCount: apiData.services?.length || 0,
          services: apiData.services,
          fullResponse: apiData,
        });

        if (apiData.success && apiData.services) {
          // ✅ Asegurar que services sea un array válido
          const servicesArray = Array.isArray(apiData.services) ? apiData.services : [];

          console.log('✅ [PROVIDER SERVICES] Servicios procesados:', {
            count: servicesArray.length,
            services: servicesArray,
          });

          setServices(servicesArray);

          // Calcular estadísticas
          const overviewData = {
            totalServices: servicesArray.length,
            activeServices: servicesArray.filter((s: any) => s.active).length,
            pendingServices: servicesArray.filter((s: any) => !s.active).length,
            totalRevenue: servicesArray.reduce(
              (sum: number, s: any) => sum + (s.price * s.totalJobs || 0),
              0
            ),
          };

          console.log('📊 [PROVIDER SERVICES] Estadísticas calculadas:', overviewData);
          setData(overviewData);
        } else {
          console.warn('⚠️ [PROVIDER SERVICES] API no devolvió servicios válidos:', {
            success: apiData.success,
            hasServices: !!apiData.services,
            response: apiData,
          });
          setServices([]);
          setData({
            totalServices: 0,
            activeServices: 0,
            pendingServices: 0,
            totalRevenue: 0,
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [PROVIDER SERVICES] Error en respuesta de API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        setServices([]);
        setData({
          totalServices: 0,
          activeServices: 0,
          pendingServices: 0,
          totalRevenue: 0,
        });
      }
    } catch (error) {
      console.error('❌ [PROVIDER SERVICES] Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
      setServices([]);
      setData({
        totalServices: 0,
        activeServices: 0,
        pendingServices: 0,
        totalRevenue: 0,
      });
    } finally {
      console.log('✅ [PROVIDER SERVICES] Carga de datos finalizada');
      setLoading(false);
    }
  };

  const handleToggleService = async (
    serviceId: string,
    serviceName: string,
    currentActive: boolean
  ) => {
    try {
      console.log('🔄 [PROVIDER SERVICES] Activando/desactivando servicio:', {
        serviceId,
        serviceName,
        currentActive,
        newActive: !currentActive,
      });

      // Actualizar estado local inmediatamente para feedback visual
      setServices(prev =>
        prev.map(service =>
          service.id === serviceId ? { ...service, active: !service.active } : service
        )
      );

      // Llamar a la API para actualizar en el backend
      const response = await fetch(`/api/provider/services/${encodeURIComponent(serviceName)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          active: !currentActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el servicio');
      }

      // Recargar datos para asegurar sincronización
      await loadPageData();

      console.log('✅ [PROVIDER SERVICES] Servicio actualizado exitosamente');
    } catch (error) {
      console.error('❌ [PROVIDER SERVICES] Error al actualizar servicio:', error);

      // Revertir cambio local en caso de error
      setServices(prev =>
        prev.map(service =>
          service.id === serviceId ? { ...service, active: currentActive } : service
        )
      );

      // Mostrar error al usuario
      setError(
        error instanceof Error
          ? error.message
          : 'Error al actualizar el estado del servicio. Por favor intente nuevamente.'
      );
    }
  };

  const handleUpdatePrice = (serviceId: string, newPrice: number) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, price: newPrice, lastUpdated: new Date().toISOString().split('T')[0] }
          : service
      )
    );
  };

  const handleExportServices = () => {
    const csvContent = [
      [
        'Nombre',
        'Categoría',
        'Precio',
        'Estado',
        'Trabajos Totales',
        'Calificación',
        'Última Actualización',
      ],
    ];

    services.forEach(service => {
      csvContent.push([
        service.name,
        service.category,
        service.price.toString(),
        service.active ? 'Activo' : 'Inactivo',
        service.totalJobs.toString(),
        service.avgRating.toString(),
        service.lastUpdated,
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `servicios_proveedor_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mis Servicios" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Mis Servicios" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
      title="Mis Servicios"
      subtitle="Gestiona los servicios que ofreces como proveedor"
    >
      <div className="space-y-6">
        {/* Alerta de precios no configurados */}
        {services.filter(s => s.price <= 0).length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">
                    Servicios sin precios configurados
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Tienes {services.filter(s => s.price <= 0).length} servicio(s) sin precio
                    definido. Los clientes no podrán ver cuánto cuestan estos servicios.
                    <span className="font-medium">
                      {' '}
                      Configura los precios en la pestaña "Gestionar Servicios".
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servicios</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalServices || 0}</div>
              <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Servicios Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.activeServices || 0}</div>
              <p className="text-xs text-muted-foreground">+1 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pendingServices || 0}</div>
              <p className="text-xs text-muted-foreground">-1 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Estimados</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">+15% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de servicios */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="manage">Gestionar Servicios</TabsTrigger>
            <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
          </TabsList>

          {/* Vista General */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {services.map(service => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{service.name}</h3>
                          <Badge variant="outline">{service.category}</Badge>
                          <Badge
                            className={
                              service.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {service.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      </div>
                      <Switch
                        checked={service.active}
                        onCheckedChange={() =>
                          handleToggleService(service.id, service.name, service.active)
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign
                          className={`w-4 h-4 ${service.price > 0 ? 'text-green-500' : 'text-red-500'}`}
                        />
                        <span className={service.price > 0 ? '' : 'text-red-600 font-medium'}>
                          {service.price > 0
                            ? formatCurrency(service.price)
                            : 'Precio no configurado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>{service.duration || service.responseTime || 'No especificado'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span>{service.totalJobs} trabajos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{service.avgRating}/5.0</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(`/provider/services/${encodeURIComponent(service.name)}`)
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/provider/services/${encodeURIComponent(service.name)}/edit`
                            )
                          }
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gestionar Servicios */}
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Servicios</CardTitle>
                <CardDescription>
                  Ajusta precios, disponibilidad y configuraciones de tus servicios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {services.map(service => (
                    <Card key={service.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{service.name}</h4>
                            <p className="text-sm text-gray-600">{service.category}</p>
                          </div>
                          <Badge
                            className={
                              service.active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {service.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label htmlFor={`price-${service.id}`}>Precio (CLP)</Label>
                            <Input
                              id={`price-${service.id}`}
                              type="number"
                              value={service.price}
                              onChange={e =>
                                handleUpdatePrice(service.id, parseInt(e.target.value))
                              }
                              className="mt-1"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={service.availability.weekdays}
                              onCheckedChange={checked => {
                                // Update availability logic would go here
                              }}
                            />
                            <Label>Días de semana</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={service.availability.weekends}
                              onCheckedChange={checked => {
                                // Update availability logic would go here
                              }}
                            />
                            <Label>Fines de semana</Label>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500">
                          Última actualización:{' '}
                          {new Date(service.lastUpdated).toLocaleDateString('es-CL')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estadísticas */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Trabajos por Servicio</CardTitle>
                  <CardDescription>Distribución de trabajos realizados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{service.totalJobs}</div>
                          <div className="text-xs text-gray-600">{service.avgRating}⭐</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ingresos por Servicio</CardTitle>
                  <CardDescription>Ingresos estimados por servicio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{service.name}</span>
                        <div className="text-right">
                          <div className="font-bold">
                            {formatCurrency(service.price * service.totalJobs)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {service.price.toLocaleString()} x {service.totalJobs}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/services/new')}
              >
                <Plus className="w-6 h-6 mb-2" />
                <span>Agregar Servicio</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleExportServices}
              >
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Servicios</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/earnings')}
              >
                <DollarSign className="w-6 h-6 mb-2" />
                <span>Ver Ganancias</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/ratings')}
              >
                <Star className="w-6 h-6 mb-2" />
                <span>Ver Calificaciones</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/settings')}
              >
                <Settings className="w-6 h-6 mb-2" />
                <span>Configuración</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={loadPageData}
              >
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
