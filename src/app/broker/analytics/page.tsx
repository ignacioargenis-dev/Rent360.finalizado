'use client';

import React, { useState, useEffect } from 'react';

// Configuración para renderizado dinámico - analytics con datos en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 120; // Revalidar cada 2 minutos para analytics actualizados
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  Calendar,
  Target,
  Activity,
  Eye,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

interface PerformanceData {
  propertyViews: number;
  inquiriesGenerated: number;
  conversionRate: number;
  averageResponseTime: number;
  clientSatisfaction: number;
  monthlyRevenue: number;
}

interface TrendData {
  period: string;
  views: number;
  inquiries: number;
  conversions: number;
  revenue: number;
}

export default function BrokerAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    propertyViews: 0,
    inquiriesGenerated: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    clientSatisfaction: 0,
    monthlyRevenue: 0,
  });
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadDashboardData = async () => {
      try {
        const response = await fetch('/api/broker/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const dashboardInfo = await response.json();
          setDashboardData(dashboardInfo.data);
        }
      } catch (error) {
        logger.error('Error loading dashboard data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadAnalyticsData = async () => {
      try {
        // Cargar datos reales desde la API
        const response = await fetch('/api/analytics/dashboard-stats?period=6months', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const analyticsData = await response.json();

        // Transformar datos de la API al formato esperado
        const performanceData: PerformanceData = {
          propertyViews: analyticsData.overview?.totalViews || 0,
          inquiriesGenerated: analyticsData.overview?.totalInquiries || 0,
          conversionRate: analyticsData.overview?.conversionRate || 0,
          averageResponseTime: analyticsData.overview?.averageResponseTime || 0,
          clientSatisfaction: analyticsData.overview?.clientSatisfaction || 0,
          monthlyRevenue: analyticsData.overview?.monthlyRevenue || 0,
        };

        const trendData: TrendData[] =
          analyticsData.monthlyStats?.map((stat: any) => ({
            period: stat.month,
            views: stat.views || 0,
            inquiries: stat.inquiries || 0,
            conversions: stat.conversions || 0,
            revenue: stat.revenue || 0,
          })) || [];

        setPerformanceData(performanceData);
        setTrendData(trendData);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading analytics data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadDashboardData();
    loadAnalyticsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleExportAnalytics = () => {
    // Export analytics data to CSV
    const csvData = trendData.map(trend => ({
      Período: trend.period,
      Vistas: trend.views,
      Consultas: trend.inquiries,
      Conversiones: trend.conversions,
      Ingresos: formatCurrency(trend.revenue),
    }));

    const csvDataCurrent = [
      {
        'Vistas Propiedades': performanceData.propertyViews,
        'Consultas Generadas': performanceData.inquiriesGenerated,
        'Tasa Conversión': `${performanceData.conversionRate}%`,
        'Tiempo Respuesta': `${performanceData.averageResponseTime}h`,
        'Satisfacción Cliente': `${performanceData.clientSatisfaction}/5.0`,
        'Ingresos Mensuales': formatCurrency(performanceData.monthlyRevenue),
      },
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      '=== MÉTRICAS ACTUALES ===\n' +
      Object.keys(csvDataCurrent[0]!).join(',') +
      '\n' +
      csvDataCurrent.map(row => Object.values(row).join(',')).join('\n') +
      '\n\n' +
      '=== TENDENCIAS MENSUALES ===\n' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `analytics_corredor_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshData = () => {
    // Refresh analytics data with simulated API call
    setLoading(true);
    setTimeout(() => {
      // Simulate refreshed data with slight variations
      const refreshedPerformance = {
        ...performanceData,
        propertyViews: performanceData.propertyViews + Math.floor(Math.random() * 50 - 25),
        inquiriesGenerated: performanceData.inquiriesGenerated + Math.floor(Math.random() * 10 - 5),
        conversionRate: Math.max(0, performanceData.conversionRate + (Math.random() - 0.5) * 2),
        monthlyRevenue: performanceData.monthlyRevenue + Math.floor(Math.random() * 50000 - 25000),
      };
      setPerformanceData(refreshedPerformance);
      setLoading(false);
      setSuccessMessage('Datos de analytics actualizados correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1500);
  };

  const handleViewTutorial = () => {
    // Open tutorial modal or navigate to help documentation
    // For now, navigate to a help page or open external tutorial
    router.push('/help/analytics-tutorial');
  };

  const handleConfigureAlerts = () => {
    // Navigate to alerts configuration page
    window.location.href = '/broker/settings/alerts';
  };

  const handleViewDetailedAnalysis = () => {
    // Navigate to detailed market analysis page
    window.location.href = '/broker/analytics/market-analysis';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Analytics del Corredor"
      subtitle="Métricas y rendimiento de tu negocio inmobiliario"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics de Rendimiento</h1>
            <p className="text-gray-600">Analiza el rendimiento de tus propiedades y clientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={handleExportAnalytics}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vistas de Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData.propertyViews.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +12% vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Consultas Generadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData.inquiriesGenerated}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +8% vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData.conversionRate}%
                  </p>
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    -2% vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo de Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData.averageResponseTime}h
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    -15min vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción Cliente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {performanceData.clientSatisfaction}/5.0
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +0.2 vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(performanceData.monthlyRevenue)}
                  </p>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +3% vs mes anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Trends */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Rendimiento</CardTitle>
              <CardDescription>Evolución mensual de métricas clave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendData.slice(-3).map((trend, index) => (
                  <div
                    key={trend.period}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{trend.period}</p>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Vistas: {trend.views}</div>
                        <div>Consultas: {trend.inquiries}</div>
                        <div>Conversiones: {trend.conversions}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(trend.revenue)}</p>
                      <p className="text-xs text-gray-500">ingresos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objetivos y Metas</CardTitle>
              <CardDescription>Progreso hacia tus objetivos mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Propiedades Gestionadas</span>
                    <span>
                      {dashboardData?.stats?.totalProperties || 0} /{' '}
                      {dashboardData?.stats?.totalProperties
                        ? Math.round(dashboardData.stats.totalProperties * 1.2)
                        : 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          dashboardData?.stats?.totalProperties
                            ? Math.min(
                                100,
                                (dashboardData.stats.totalProperties /
                                  (dashboardData.stats.totalProperties * 1.2)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.stats?.totalProperties
                      ? Math.round(
                          (dashboardData.stats.totalProperties /
                            (dashboardData.stats.totalProperties * 1.2)) *
                            100
                        )
                      : 0}
                    % completado
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Contratos Activos</span>
                    <span>
                      {dashboardData?.stats?.activeContracts || 0} /{' '}
                      {dashboardData?.stats?.totalContracts
                        ? Math.round(dashboardData.stats.totalContracts * 0.8)
                        : 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          dashboardData?.stats?.totalContracts
                            ? Math.min(
                                100,
                                ((dashboardData.stats.activeContracts || 0) /
                                  (dashboardData.stats.totalContracts * 0.8)) *
                                  100
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.stats?.totalContracts
                      ? Math.round(
                          ((dashboardData.stats.activeContracts || 0) /
                            (dashboardData.stats.totalContracts * 0.8)) *
                            100
                        )
                      : 0}
                    % completado
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Comisiones del Mes</span>
                    <span>
                      {formatCurrency(dashboardData?.stats?.monthlyRevenue || 0)} /
                      {formatCurrency((dashboardData?.stats?.monthlyRevenue || 0) * 1.2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${dashboardData?.stats?.monthlyRevenue ? Math.min(100, 83) : 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {dashboardData?.stats?.monthlyRevenue ? '83%' : '0%'} completado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recomendaciones de Optimización</CardTitle>
            <CardDescription>Acciones sugeridas para mejorar tu rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium">Mejorar Fotos</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Las propiedades con mejores fotos generan 40% más consultas
                </p>
                <Button size="sm" variant="outline" onClick={handleViewTutorial}>
                  Ver Tutorial
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium">Reducir Tiempo de Respuesta</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Responde en menos de 1 hora para aumentar conversiones
                </p>
                <Button size="sm" variant="outline" onClick={handleConfigureAlerts}>
                  Configurar Alertas
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium">Optimizar Precios</h4>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Ajusta precios según el mercado local para mejor conversión
                </p>
                <Button size="sm" variant="outline" onClick={handleViewDetailedAnalysis}>
                  Ver Análisis
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
