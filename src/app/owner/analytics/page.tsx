'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Modal states
  const [showDetailedReportsModal, setShowDetailedReportsModal] = useState(false);
  const [showAlertsConfigModal, setShowAlertsConfigModal] = useState(false);
  const [showPredictiveModal, setShowPredictiveModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

  // Success/Error states
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Alerts configuration
  const [alertsConfig, setAlertsConfig] = useState({
    occupancyAlert: true,
    paymentDelayAlert: true,
    maintenanceAlert: true,
    lowRatingAlert: true,
    occupancyThreshold: 80,
    paymentDelayDays: 5,
    maintenanceThreshold: 3,
    ratingThreshold: 3.5,
  });

  // Goals configuration
  const [goalsConfig, setGoalsConfig] = useState({
    targetOccupancy: 95,
    targetRevenue: 5000000,
    targetRating: 4.5,
    targetMaintenanceResponse: 24,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock analytics data for owner
      const mockAnalytics = {
        overview: {
          totalProperties: 12,
          occupiedProperties: 10,
          totalRevenue: 4500000,
          monthlyRevenue: 375000,
          occupancyRate: 83.3,
          averageRent: 375000,
        },
        monthlyStats: [
          { month: 'Ene', revenue: 4200000, occupancy: 85 },
          { month: 'Feb', revenue: 4450000, occupancy: 88 },
          { month: 'Mar', revenue: 4600000, occupancy: 90 },
          { month: 'Abr', revenue: 4350000, occupancy: 82 },
          { month: 'May', revenue: 4500000, occupancy: 83 },
          { month: 'Jun', revenue: 4650000, occupancy: 87 },
        ],
        topProperties: [
          { name: 'Departamento Las Condes', revenue: 550000, occupancy: 95 },
          { name: 'Casa Providencia', revenue: 650000, occupancy: 100 },
          { name: 'Estudio Centro', revenue: 320000, occupancy: 88 },
        ],
        tenantSatisfaction: 4.2,
        maintenanceRequests: 8,
        paymentDelays: 2,
      };

      setData(mockAnalytics);

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
      <UnifiedDashboardLayout title="Analytics" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Analytics" subtitle="Error al cargar la página">
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleExportAnalytics = () => {
    if (!data) {
      return;
    }

    const csvContent = [
      ['Métrica', 'Valor'],
      ['Propiedades Totales', data.overview.totalProperties.toString()],
      ['Propiedades Ocupadas', data.overview.occupiedProperties.toString()],
      ['Tasa de Ocupación', `${data.overview.occupancyRate}%`],
      ['Ingresos Totales', formatCurrency(data.overview.totalRevenue)],
      ['Ingresos Mensuales', formatCurrency(data.overview.monthlyRevenue)],
      ['Renta Promedio', formatCurrency(data.overview.averageRent)],
      ['Solicitudes de Mantenimiento', data.maintenanceRequests.toString()],
      ['Retrasos de Pago', data.paymentDelays.toString()],
      ['Satisfacción de Inquilinos', data.tenantSatisfaction.toString()],
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `analytics_propietario_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para actualizar datos
  const handleRefreshData = async () => {
    setLoading(true);
    setSuccessMessage('');

    try {
      await loadPageData();
      setSuccessMessage('Datos actualizados correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error al actualizar datos:', { error });
      setErrorMessage('Error al actualizar los datos');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Función para reportes detallados
  const handleDetailedReports = () => {
    setShowDetailedReportsModal(true);
  };

  // Función para configurar alertas
  const handleAlertsConfig = () => {
    setShowAlertsConfigModal(true);
  };

  // Función para análisis predictivo
  const handlePredictiveAnalysis = () => {
    setShowPredictiveModal(true);
  };

  // Función para metas y objetivos
  const handleGoalsAndObjectives = () => {
    setShowGoalsModal(true);
  };

  // Función para guardar configuración de alertas
  const handleSaveAlertsConfig = async () => {
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.info('Configuración de alertas guardada:', { alertsConfig });
      setSuccessMessage('Configuración de alertas guardada correctamente');
      setShowAlertsConfigModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error al guardar configuración de alertas:', { error });
      setErrorMessage('Error al guardar la configuración');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  // Función para guardar metas y objetivos
  const handleSaveGoalsConfig = async () => {
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      logger.info('Metas y objetivos guardados:', { goalsConfig });
      setSuccessMessage('Metas y objetivos guardados correctamente');
      setShowGoalsModal(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error al guardar metas y objetivos:', { error });
      setErrorMessage('Error al guardar las metas');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  return (
    <UnifiedDashboardLayout
      title="Analytics"
      subtitle="Visualiza el rendimiento de tus propiedades"
    >
      {/* Success/Error Messages */}
      {successMessage && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {errorMessage && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{errorMessage}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Propiedades Totales</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.totalProperties || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.overview.occupiedProperties || 0} ocupadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.occupancyRate || 0}%</div>
              <p className="text-xs text-muted-foreground">+2.1% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.overview.monthlyRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">+5.2% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renta Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.overview.averageRent || 0)}
              </div>
              <p className="text-xs text-muted-foreground">Por propiedad ocupada</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de ingresos mensuales */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
            <CardDescription>Ingresos mensuales de los últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between space-x-2">
              {data?.monthlyStats.map((stat: any, index: number) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t w-full mb-2"
                    style={{
                      height: `${(stat.revenue / 5000000) * 200}px`,
                      minHeight: '20px',
                    }}
                  ></div>
                  <div className="text-xs text-gray-600 text-center">
                    <div className="font-medium">{stat.month}</div>
                    <div>{formatCurrency(stat.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Propiedades más rentables */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Más Rentables</CardTitle>
              <CardDescription>Top 3 propiedades por ingresos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.topProperties.map((property: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{property.name}</div>
                      <div className="text-sm text-gray-600">{property.occupancy}% ocupación</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(property.revenue)}</div>
                      <div className="text-sm text-gray-600">mensual</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Indicadores clave */}
          <Card>
            <CardHeader>
              <CardTitle>Indicadores Clave</CardTitle>
              <CardDescription>Métricas importantes de rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Satisfacción de Inquilinos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold">{data?.tenantSatisfaction || 0}</span>
                    <span className="text-sm text-gray-600">/5.0</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-orange-500" />
                    <span>Solicitudes de Mantenimiento</span>
                  </div>
                  <div className="font-bold text-orange-600">{data?.maintenanceRequests || 0}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span>Retrasos de Pago</span>
                  </div>
                  <div className="font-bold text-red-600">{data?.paymentDelays || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                onClick={handleRefreshData}
                disabled={loading}
              >
                <RefreshCw className={`w-6 h-6 mb-2 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleExportAnalytics}
              >
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Reporte</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleDetailedReports}
              >
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>Reportes Detallados</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleAlertsConfig}
              >
                <Settings className="w-6 h-6 mb-2" />
                <span>Configurar Alertas</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handlePredictiveAnalysis}
              >
                <TrendingUp className="w-6 h-6 mb-2" />
                <span>Análisis Predictivo</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleGoalsAndObjectives}
              >
                <Target className="w-6 h-6 mb-2" />
                <span>Metas y Objetivos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modales */}
        {/* Modal de Reportes Detallados */}
        <Dialog open={showDetailedReportsModal} onOpenChange={setShowDetailedReportsModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Reportes Detallados de Analytics</DialogTitle>
              <DialogDescription>
                Visualiza reportes detallados y análisis profundos de tus propiedades
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="properties">Propiedades</TabsTrigger>
                <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
                <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
                <TabsTrigger value="financial">Financiero</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis por Propiedad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data?.properties?.map((property: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-4 border rounded-lg"
                        >
                          <div>
                            <h4 className="font-semibold">{property.title}</h4>
                            <p className="text-sm text-gray-600">{property.location}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(property.revenue)}</p>
                            <p className="text-sm text-gray-600">{property.occupancy}% ocupado</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tenants" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis de Inquilinos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {data?.tenantSatisfaction || 4.2}
                        </div>
                        <div className="text-sm text-gray-600">Satisfacción Promedio</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {data?.tenants?.length || 12}
                        </div>
                        <div className="text-sm text-gray-600">Inquilinos Activos</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {data?.paymentDelays || 2}
                        </div>
                        <div className="text-sm text-gray-600">Retrasos de Pago</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reporte de Mantenimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {data?.maintenanceRequests || 8}
                        </div>
                        <div className="text-sm text-gray-600">Solicitudes Pendientes</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">2.4 días</div>
                        <div className="text-sm text-gray-600">Tiempo Promedio de Respuesta</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">94%</div>
                        <div className="text-sm text-gray-600">Resolución Satisfactoria</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análisis Financiero Detallado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Ingresos por Mes</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Enero 2024</span>
                            <span className="font-semibold">{formatCurrency(4500000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Febrero 2024</span>
                            <span className="font-semibold">{formatCurrency(4800000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Marzo 2024</span>
                            <span className="font-semibold">{formatCurrency(5200000)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Gastos por Categoría</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Mantenimiento</span>
                            <span className="font-semibold">{formatCurrency(800000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Administración</span>
                            <span className="font-semibold">{formatCurrency(600000)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Impuestos</span>
                            <span className="font-semibold">{formatCurrency(1200000)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        {/* Modal de Configuración de Alertas */}
        <Dialog open={showAlertsConfigModal} onOpenChange={setShowAlertsConfigModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configurar Alertas de Analytics</DialogTitle>
              <DialogDescription>
                Personaliza las alertas que quieres recibir sobre el rendimiento de tus propiedades
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Alerta de Ocupación Baja</Label>
                    <p className="text-xs text-gray-600">
                      Notificar cuando la ocupación esté por debajo del umbral
                    </p>
                  </div>
                  <Switch
                    checked={alertsConfig.occupancyAlert}
                    onCheckedChange={checked =>
                      setAlertsConfig(prev => ({ ...prev, occupancyAlert: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Alerta de Retrasos de Pago</Label>
                    <p className="text-xs text-gray-600">Notificar cuando un pago esté atrasado</p>
                  </div>
                  <Switch
                    checked={alertsConfig.paymentDelayAlert}
                    onCheckedChange={checked =>
                      setAlertsConfig(prev => ({ ...prev, paymentDelayAlert: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Alerta de Solicitudes de Mantenimiento
                    </Label>
                    <p className="text-xs text-gray-600">
                      Notificar cuando haya muchas solicitudes pendientes
                    </p>
                  </div>
                  <Switch
                    checked={alertsConfig.maintenanceAlert}
                    onCheckedChange={checked =>
                      setAlertsConfig(prev => ({ ...prev, maintenanceAlert: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Alerta de Baja Calificación</Label>
                    <p className="text-xs text-gray-600">
                      Notificar cuando la satisfacción de inquilinos baje
                    </p>
                  </div>
                  <Switch
                    checked={alertsConfig.lowRatingAlert}
                    onCheckedChange={checked =>
                      setAlertsConfig(prev => ({ ...prev, lowRatingAlert: checked }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupancy-threshold">Umbral de Ocupación (%)</Label>
                  <Input
                    id="occupancy-threshold"
                    type="number"
                    value={alertsConfig.occupancyThreshold}
                    onChange={e =>
                      setAlertsConfig(prev => ({
                        ...prev,
                        occupancyThreshold: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="payment-delay-days">Días de Retraso</Label>
                  <Input
                    id="payment-delay-days"
                    type="number"
                    value={alertsConfig.paymentDelayDays}
                    onChange={e =>
                      setAlertsConfig(prev => ({
                        ...prev,
                        paymentDelayDays: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAlertsConfigModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveAlertsConfig}>Guardar Configuración</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Análisis Predictivo */}
        <Dialog open={showPredictiveModal} onOpenChange={setShowPredictiveModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Análisis Predictivo</DialogTitle>
              <DialogDescription>
                Predicciones basadas en datos históricos para optimizar tus decisiones
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predicción de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Mes actual</span>
                        <span className="font-semibold">
                          {formatCurrency(data?.overview?.monthlyRevenue || 4800000)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Próximo mes (predicho)</span>
                        <span className="font-semibold text-blue-600">
                          {formatCurrency(5200000)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Crecimiento esperado</span>
                        <span className="font-semibold text-green-600">+8.3%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tendencias de Mercado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Demanda actual</span>
                        <Badge className="bg-green-100 text-green-800">Alta</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Precio promedio zona</span>
                        <span className="font-semibold">{formatCurrency(450000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tendencia precios</span>
                        <span className="font-semibold text-green-600">↗️ +3.2%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recomendaciones IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">
                        <strong>💡 Recomendación:</strong> Considera aumentar las rentas en un 5% en
                        las propiedades con ocupación del 100% durante los últimos 6 meses.
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm">
                        <strong>⚠️ Alerta:</strong> 3 propiedades tienen riesgo de desocupación en
                        los próximos 2 meses basado en patrones históricos.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm">
                        <strong>✅ Oportunidad:</strong> El mercado muestra tendencia alcista.
                        Considera adquirir nuevas propiedades en las zonas identificadas.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Metas y Objetivos */}
        <Dialog open={showGoalsModal} onOpenChange={setShowGoalsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Metas y Objetivos</DialogTitle>
              <DialogDescription>
                Establece y sigue tus objetivos de rendimiento para optimizar tus inversiones
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="occupancy-goal">Meta de Ocupación (%)</Label>
                  <Input
                    id="occupancy-goal"
                    type="number"
                    value={goalsConfig.targetOccupancy}
                    onChange={e =>
                      setGoalsConfig(prev => ({
                        ...prev,
                        targetOccupancy: parseInt(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Actual: {data?.overview?.occupancyRate || 87}%
                  </p>
                </div>

                <div>
                  <Label htmlFor="revenue-goal">Meta de Ingresos Mensuales</Label>
                  <Input
                    id="revenue-goal"
                    type="number"
                    value={goalsConfig.targetRevenue}
                    onChange={e =>
                      setGoalsConfig(prev => ({ ...prev, targetRevenue: parseInt(e.target.value) }))
                    }
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Actual: {formatCurrency(data?.overview?.monthlyRevenue || 4800000)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="rating-goal">Meta de Calificación</Label>
                  <Input
                    id="rating-goal"
                    type="number"
                    step="0.1"
                    value={goalsConfig.targetRating}
                    onChange={e =>
                      setGoalsConfig(prev => ({
                        ...prev,
                        targetRating: parseFloat(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Actual: {data?.tenantSatisfaction || 4.2}/5
                  </p>
                </div>

                <div>
                  <Label htmlFor="maintenance-goal">Meta de Tiempo de Respuesta (horas)</Label>
                  <Input
                    id="maintenance-goal"
                    type="number"
                    value={goalsConfig.targetMaintenanceResponse}
                    onChange={e =>
                      setGoalsConfig(prev => ({
                        ...prev,
                        targetMaintenanceResponse: parseInt(e.target.value),
                      }))
                    }
                  />
                  <p className="text-xs text-gray-600 mt-1">Actual: 2.4 días promedio</p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progreso de Metas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ocupación</span>
                      <span className="text-sm font-semibold">
                        {data?.overview?.occupancyRate || 87}% / {goalsConfig.targetOccupancy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((data?.overview?.occupancyRate || 87) / goalsConfig.targetOccupancy) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Ingresos</span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(data?.overview?.monthlyRevenue || 4800000)} /{' '}
                        {formatCurrency(goalsConfig.targetRevenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(((data?.overview?.monthlyRevenue || 4800000) / goalsConfig.targetRevenue) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowGoalsModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveGoalsConfig}>Guardar Metas</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
