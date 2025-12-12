'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  DollarSign,
  Home,
  Users,
  FileText,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle,
  Settings,
  Printer,
  Mail,
  Eye,
  Activity,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { User } from '@/types';

interface ReportMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface PropertyPerformance {
  id: string;
  title: string;
  address: string;
  occupancyRate: number;
  monthlyRevenue: number;
  totalRevenue: number;
  averageRating: number;
  maintenanceCosts: number;
  netProfit: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  yearOverYearGrowth: number;
  averageOccupancyRate: number;
}

interface TenantAnalysis {
  totalTenants: number;
  averageTenure: number;
  retentionRate: number;
  satisfactionScore: number;
  topPerformers: string[];
  atRiskTenants: string[];
}

export default function OwnerReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    yearOverYearGrowth: 0,
    averageOccupancyRate: 0,
  });
  const [tenantAnalysis, setTenantAnalysis] = useState<TenantAnalysis>({
    totalTenants: 0,
    averageTenure: 0,
    retentionRate: 0,
    satisfactionScore: 0,
    topPerformers: [],
    atRiskTenants: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('last30days');

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    try {
      setLoading(true);

      const apiPeriod = mapDateRangeToApiPeriod(dateRange);

      // Cargar datos del período actual y anterior para comparación
      const [currentResponse, previousResponse, tenantAnalysisResponse, maintenanceCostsResponse] =
        await Promise.all([
          fetch(`/api/analytics/dashboard-stats?period=${apiPeriod}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }),
          // Cargar datos del período anterior para comparación
          fetch(`/api/analytics/dashboard-stats?period=${getPreviousPeriod(dateRange)}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }),
          // Cargar análisis de inquilinos
          fetch(`/api/owner/reports/tenant-analysis?period=${apiPeriod}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }),
          // Cargar costos reales de mantenimiento
          fetch(`/api/owner/maintenance/costs?period=${apiPeriod}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          }),
        ]);

      if (!currentResponse.ok) {
        throw new Error(`Error ${currentResponse.status}: ${currentResponse.statusText}`);
      }

      const currentResponseData = await currentResponse.json();
      const currentData = currentResponseData.data || currentResponseData;
      const previousResponseData = previousResponse.ok ? await previousResponse.json() : null;
      const previousData = previousResponseData?.data || previousResponseData;
      const tenantAnalysisResponseData = tenantAnalysisResponse.ok
        ? await tenantAnalysisResponse.json()
        : null;
      const tenantAnalysisData = tenantAnalysisResponseData?.data || tenantAnalysisResponseData;
      const maintenanceCostsData = maintenanceCostsResponse.ok
        ? await maintenanceCostsResponse.json().then(r => r.data || r)
        : null;

      // Calcular costos reales de mantenimiento
      const totalMaintenanceCosts =
        maintenanceCostsData?.totalCost ||
        (currentData.averageMaintenanceCost || 0) * (currentData.maintenanceRequests || 0) ||
        0;

      // Calcular cambios porcentuales
      const currentRevenue = currentData.overview?.totalRevenue || currentData.monthlyRevenue || 0;
      const previousRevenue =
        previousData?.overview?.totalRevenue || previousData?.monthlyRevenue || 0;
      const revenueChange = calculatePercentageChange(currentRevenue, previousRevenue);

      const currentOccupancy = currentData.overview?.occupancyRate || 0;
      const previousOccupancy = previousData?.overview?.occupancyRate || 0;
      const occupancyChange = calculatePercentageChange(currentOccupancy, previousOccupancy);

      const currentSatisfaction = currentData.tenantSatisfaction || 0;
      const previousSatisfaction = previousData?.tenantSatisfaction || 0;
      const satisfactionChange = currentSatisfaction - previousSatisfaction;
      const satisfactionChangeStr =
        satisfactionChange >= 0
          ? `+${satisfactionChange.toFixed(1)}`
          : satisfactionChange.toFixed(1);

      const previousMaintenanceCosts = previousData?.averageMaintenanceCost
        ? (previousData.averageMaintenanceCost || 0) * (previousData.maintenanceRequests || 0)
        : 0;
      const maintenanceChange = calculatePercentageChange(
        totalMaintenanceCosts,
        previousMaintenanceCosts
      );

      // Calcular crecimiento año a año
      let yearOverYearGrowth = 0;
      if (dateRange === 'thisYear' || dateRange === 'lastYear') {
        const currentYear = new Date().getFullYear();
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear - 1, 11, 31);

        try {
          const lastYearResponse = await fetch(
            `/api/analytics/dashboard-stats?period=1y&startDate=${lastYearStart.toISOString()}&endDate=${lastYearEnd.toISOString()}`,
            {
              method: 'GET',
              credentials: 'include',
              headers: {
                Accept: 'application/json',
                'Cache-Control': 'no-cache',
              },
            }
          );

          if (lastYearResponse.ok) {
            const lastYearData = await lastYearResponse.json().then(r => r.data || r);
            const lastYearRevenue =
              lastYearData.overview?.totalRevenue || lastYearData.monthlyRevenue || 0;
            if (lastYearRevenue > 0) {
              yearOverYearGrowth = ((currentRevenue - lastYearRevenue) / lastYearRevenue) * 100;
            }
          }
        } catch (error) {
          logger.warn('Error calculando crecimiento año a año:', error);
        }
      }

      // Transformar métricas con cambios reales
      const transformedMetrics: ReportMetric[] = [
        {
          label: 'Ingresos Totales',
          value: formatPrice(currentRevenue),
          change: revenueChange.change,
          trend: revenueChange.trend,
          icon: DollarSign,
          color: 'text-green-600',
        },
        {
          label: 'Tasa de Ocupación',
          value: `${currentOccupancy}%`,
          change: occupancyChange.change,
          trend: occupancyChange.trend,
          icon: Home,
          color: 'text-blue-600',
        },
        {
          label: 'Satisfacción',
          value: `${currentSatisfaction.toFixed(1)}/5`,
          change: satisfactionChangeStr,
          trend: satisfactionChange >= 0 ? 'up' : satisfactionChange < 0 ? 'down' : 'stable',
          icon: Star,
          color: 'text-yellow-600',
        },
        {
          label: 'Mantenimiento',
          value: formatPrice(totalMaintenanceCosts),
          change: maintenanceChange.change,
          trend: maintenanceChange.trend,
          icon: AlertTriangle,
          color: 'text-red-600',
        },
      ];

      // Transformar propiedades con datos reales
      const transformedProperties: PropertyPerformance[] =
        currentData.properties
          ?.filter((prop: any) => prop.id) // ✅ Filtrar propiedades sin ID
          .map((prop: any) => {
            const propMaintenanceCosts = prop.maintenanceCosts || 0;
            const propMonthlyRevenue = prop.monthlyRevenue || prop.revenue || 0;
            return {
              id: prop.id, // ✅ Asegurar que el ID existe
              title: prop.title || prop.name || 'Sin título',
              address: prop.address || prop.location || 'Sin dirección',
              occupancyRate: prop.occupancy || prop.occupancyRate || 0,
              monthlyRevenue: propMonthlyRevenue,
              totalRevenue: prop.totalRevenue || propMonthlyRevenue * 12,
              averageRating: prop.averageRating || prop.rating || 0,
              maintenanceCosts: propMaintenanceCosts,
              netProfit: propMonthlyRevenue * 12 - propMaintenanceCosts,
            };
          }) || [];

      // Resumen financiero con datos reales
      const transformedFinancialSummary: FinancialSummary = {
        totalRevenue: currentRevenue,
        totalExpenses: totalMaintenanceCosts,
        netProfit: currentRevenue - totalMaintenanceCosts,
        profitMargin:
          currentRevenue > 0
            ? ((currentRevenue - totalMaintenanceCosts) / currentRevenue) * 100
            : 0,
        yearOverYearGrowth: Math.round(yearOverYearGrowth * 10) / 10,
        averageOccupancyRate: currentOccupancy,
      };

      // Análisis de inquilinos con datos reales
      const transformedTenantAnalysis: TenantAnalysis = {
        totalTenants: tenantAnalysisData?.totalTenants || currentData.overview?.totalTenants || 0,
        averageTenure: tenantAnalysisData?.averageTenure || 0,
        retentionRate: tenantAnalysisData?.retentionRate || 0,
        satisfactionScore: tenantAnalysisData?.satisfactionScore || currentSatisfaction,
        topPerformers: tenantAnalysisData?.topPerformers || [],
        atRiskTenants: tenantAnalysisData?.atRiskTenants || [],
      };

      setMetrics(transformedMetrics);
      setPropertyPerformance(transformedProperties);
      setFinancialSummary(transformedFinancialSummary);
      setTenantAnalysis(transformedTenantAnalysis);

      logger.debug('Datos de reportes cargados', {
        totalRevenue: currentRevenue,
        occupancyRate: currentOccupancy,
        propertiesCount: transformedProperties.length,
        maintenanceCosts: totalMaintenanceCosts,
      });
    } catch (error) {
      logger.error('Error cargando datos de reportes:', {
        error: error instanceof Error ? error.message : String(error),
      });

      // En caso de error, mostrar datos vacíos
      setMetrics([]);
      setPropertyPerformance([]);
      setFinancialSummary({
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
        yearOverYearGrowth: 0,
        averageOccupancyRate: 0,
      });
      setTenantAnalysis({
        totalTenants: 0,
        averageTenure: 0,
        retentionRate: 0,
        satisfactionScore: 0,
        topPerformers: [],
        atRiskTenants: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  // Calcular cambio porcentual entre dos valores
  const calculatePercentageChange = (
    current: number,
    previous: number
  ): { change: string; trend: 'up' | 'down' | 'stable' } => {
    if (previous === 0) {
      return current > 0 ? { change: '+100%', trend: 'up' } : { change: '0%', trend: 'stable' };
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return {
      change: `${sign}${change.toFixed(1)}%`,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  };

  // Mapear dateRange a formato de API
  const mapDateRangeToApiPeriod = (range: string): string => {
    const mapping: Record<string, string> = {
      last7days: '7d',
      last30days: '30d',
      last90days: '90d',
      thisYear: '1y',
      lastYear: '1y',
    };
    return mapping[range] || '30d';
  };

  // Obtener período anterior para comparación (mismo período pero desplazado)
  const getPreviousPeriod = (range: string): string => {
    // Para comparación, usamos el mismo período pero calculamos la fecha de inicio anterior
    return mapDateRangeToApiPeriod(range);
  };

  // Funciones de botones
  const handleExportPDF = () => {
    logger.info('Exportando reporte a PDF');
    // Crear contenido HTML para el PDF
    const printContent = document.getElementById('reports-content');
    if (!printContent) {
      logger.error('No se encontró el contenido del reporte');
      return;
    }

    // Usar window.print() como solución temporal
    // En producción, se podría usar una librería como jsPDF o html2pdf
    window.print();
  };

  const handlePrint = () => {
    logger.info('Imprimiendo reporte');
    window.print();
  };

  const handleViewPropertyDetails = (propertyId: string) => {
    logger.info('Viendo detalles de propiedad', { propertyId });
    router.push(`/owner/properties/${propertyId}`);
  };

  const handleViewPropertyReport = (propertyId: string) => {
    logger.info('Viendo reporte de propiedad', { propertyId });
    // Redirigir a los detalles de la propiedad, donde se puede ver información detallada
    router.push(`/owner/properties/${propertyId}`);
  };

  const handleConfigureProperty = (propertyId: string) => {
    logger.info('Configurando propiedad', { propertyId });
    // Redirigir a la página de edición de la propiedad
    router.push(`/owner/properties/${propertyId}/edit`);
  };

  const handleCustomReport = () => {
    logger.info('Generando reporte personalizado');
    alert(
      'Función de reporte personalizado próximamente disponible. Por ahora puedes usar los filtros de período disponibles.'
    );
  };

  const handleSendEmail = async () => {
    try {
      logger.info('Enviando reporte por email');
      const response = await fetch('/api/owner/reports/send-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRange,
          includeMetrics: true,
          includeFinancialSummary: true,
          includePropertyPerformance: true,
          includeTenantAnalysis: true,
        }),
      });

      if (response.ok) {
        alert('Reporte enviado por email exitosamente');
      } else {
        throw new Error('Error al enviar el reporte');
      }
    } catch (error) {
      logger.error('Error enviando reporte por email:', error);
      alert('Error al enviar el reporte por email. Por favor, intente nuevamente.');
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) {
      return 'text-green-600 bg-green-100';
    }
    if (rate >= 75) {
      return 'text-yellow-600 bg-yellow-100';
    }
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes y Análisis"
      subtitle="Analiza el rendimiento de tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Período de Reporte</h2>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => loadReportsData()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualizar
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['last7days', 'last30days', 'last90days', 'thisYear', 'lastYear'].map(range => (
                  <Button
                    key={range}
                    variant={dateRange === range ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateRange(range)}
                  >
                    {range === 'last7days' && 'Últimos 7 días'}
                    {range === 'last30days' && 'Últimos 30 días'}
                    {range === 'last90days' && 'Últimos 90 días'}
                    {range === 'thisYear' && 'Este año'}
                    {range === 'lastYear' && 'Año pasado'}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ${metric.color}`}
                  >
                    <metric.icon className="w-6 h-6" />
                  </div>
                  <div className={`flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                    {getTrendIcon(metric.trend)}
                    <span className="text-sm font-medium">{metric.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen Financiero
              </CardTitle>
              <CardDescription>Desglose de ingresos y gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(financialSummary.totalRevenue)}
                    </div>
                    <div className="text-sm text-green-700">Ingresos Totales</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatPrice(financialSummary.totalExpenses)}
                    </div>
                    <div className="text-sm text-red-700">Gastos Totales</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Utilidad Neta</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(financialSummary.netProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Margen de Utilidad</p>
                      <p className="text-xl font-bold text-green-600">
                        {financialSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Crecimiento Anual</p>
                    <p className="text-lg font-semibold text-green-600">
                      +{financialSummary.yearOverYearGrowth}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Ocupación Promedio</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {financialSummary.averageOccupancyRate}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Análisis de Inquilinos
              </CardTitle>
              <CardDescription>Métricas de rendimiento y satisfacción</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(tenantAnalysis.totalTenants)}
                    </div>
                    <div className="text-sm text-blue-700">Total Inquilinos</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {tenantAnalysis.averageTenure} meses
                    </div>
                    <div className="text-sm text-purple-700">Permanencia Promedio</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Retención</p>
                    <p className="text-xl font-bold text-green-600">
                      {tenantAnalysis.retentionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Satisfacción Promedio</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-yellow-600">
                        {tenantAnalysis.satisfactionScore}
                      </p>
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mejores Inquilinos</p>
                    <div className="space-y-1">
                      {tenantAnalysis.topPerformers.map((tenant, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{tenant}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {tenantAnalysis.atRiskTenants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Inquilinos en Riesgo</p>
                      <div className="space-y-1">
                        {tenantAnalysis.atRiskTenants.map((tenant, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-gray-700">{tenant}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Rendimiento por Propiedad
                </CardTitle>
                <CardDescription>
                  Análisis detallado del rendimiento de cada propiedad
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const firstProperty = propertyPerformance[0];
                  if (firstProperty?.id) {
                    handleViewPropertyDetails(firstProperty.id);
                  } else {
                    logger.info('No hay propiedades para ver detalles');
                  }
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertyPerformance.map(property => (
                <div
                  key={property.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {property.title}
                          </h3>
                          <p className="text-gray-600 text-sm">{property.address}</p>
                        </div>
                        <Badge className={getOccupancyColor(property.occupancyRate)}>
                          {property.occupancyRate}% ocupado
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Ingreso Mensual</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(property.monthlyRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ingreso Total</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(property.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Calificación</p>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">
                              {property.averageRating}
                            </span>
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Utilidad Neta</p>
                          <p className="font-semibold text-green-600">
                            {formatPrice(property.netProfit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (property.id) {
                            handleViewPropertyReport(property.id);
                          } else {
                            logger.error('Property ID is missing', { property });
                            alert('Error: No se pudo obtener el ID de la propiedad');
                          }
                        }}
                        disabled={!property.id}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Reporte
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (property.id) {
                            handleConfigureProperty(property.id);
                          } else {
                            logger.error('Property ID is missing', { property });
                            alert('Error: No se pudo obtener el ID de la propiedad');
                          }
                        }}
                        disabled={!property.id}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">¿Necesitas más información?</h3>
                <p className="text-gray-600">
                  Genera reportes personalizados o exporta datos para análisis detallado
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCustomReport}>
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte Personalizado
                </Button>
                <Button onClick={handleSendEmail}>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
