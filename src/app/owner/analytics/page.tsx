'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
          averageRent: 375000
        },
        monthlyStats: [
          { month: 'Ene', revenue: 4200000, occupancy: 85 },
          { month: 'Feb', revenue: 4450000, occupancy: 88 },
          { month: 'Mar', revenue: 4600000, occupancy: 90 },
          { month: 'Abr', revenue: 4350000, occupancy: 82 },
          { month: 'May', revenue: 4500000, occupancy: 83 },
          { month: 'Jun', revenue: 4650000, occupancy: 87 }
        ],
        topProperties: [
          { name: 'Departamento Las Condes', revenue: 550000, occupancy: 95 },
          { name: 'Casa Providencia', revenue: 650000, occupancy: 100 },
          { name: 'Estudio Centro', revenue: 320000, occupancy: 88 }
        ],
        tenantSatisfaction: 4.2,
        maintenanceRequests: 8,
        paymentDelays: 2
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
    if (!data) return;

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
      ['Satisfacción de Inquilinos', data.tenantSatisfaction.toString()]
    ];

    const csvString = csvContent.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics_propietario_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <UnifiedDashboardLayout
      title="Analytics"
      subtitle="Visualiza el rendimiento de tus propiedades"
    >
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
              <p className="text-xs text-muted-foreground">
                +2.1% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.overview.monthlyRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                +5.2% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Renta Promedio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.overview.averageRent || 0)}</div>
              <p className="text-xs text-muted-foreground">
                Por propiedad ocupada
              </p>
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
                      minHeight: '20px'
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
                      <div className="text-sm text-gray-600">
                        {property.occupancy}% ocupación
                      </div>
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
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <RefreshCw className="w-6 h-6 mb-2" />
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

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <BarChart3 className="w-6 h-6 mb-2" />
                <span>Reportes Detallados</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Settings className="w-6 h-6 mb-2" />
                <span>Configurar Alertas</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <TrendingUp className="w-6 h-6 mb-2" />
                <span>Análisis Predictivo</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Target className="w-6 h-6 mb-2" />
                <span>Metas y Objetivos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
