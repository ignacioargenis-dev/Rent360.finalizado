'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Home,
  BarChart3,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Download,
  Info,
} from 'lucide-react';
import { User } from '@/types';

interface ExecutiveMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  totalUsers: number;
  activeProperties: number;
  conversionRate: number;
  customerSatisfaction: number;
  monthlyActiveUsers: number;
  churnRate: number;
  averageTransactionValue: number;
  topPerformingRegions: Array<{
    region: string;
    revenue: number;
    growth: number;
  }>;
  keyAlerts: Array<{
    id: string;
    type: 'warning' | 'critical' | 'info';
    message: string;
    priority: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    target: number;
  }>;
}

interface DashboardStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalUsers: number;
  userGrowth: number;
  activeProperties: number;
  propertyGrowth: number;
  conversionRate: number;
  satisfactionScore: number;
}

export default function AdminExecutiveDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<ExecutiveMetrics | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalUsers: 0,
    userGrowth: 0,
    activeProperties: 0,
    propertyGrowth: 0,
    conversionRate: 0,
    satisfactionScore: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleExportReport = async () => {
    alert(
      'Generando y descargando reporte ejecutivo... Esta funcionalidad estará disponible próximamente.'
    );
    // In a real app, this would generate a comprehensive PDF report
  };

  const handleConfigureDashboard = () => {
    alert(
      'Abriendo configuración del dashboard... Esta funcionalidad estará disponible próximamente.'
    );
    // In a real app, this would open a dashboard configuration modal
  };

  const handleGenerateReport = () => {
    alert(
      'Generando reporte ejecutivo completo... Esta funcionalidad estará disponible próximamente.'
    );
  };

  const handleReviewKPIs = () => {
    alert(
      'Abriendo revisión de KPIs del equipo... Esta funcionalidad estará disponible próximamente.'
    );
  };

  const handleScheduleMeeting = () => {
    alert(
      'Abriendo calendario para programar reunión estratégica... Esta funcionalidad estará disponible próximamente.'
    );
  };

  const handleMarketAnalysis = () => {
    alert('Abriendo análisis de mercado... Esta funcionalidad estará disponible próximamente.');
  };

  const handleConfigureObjectives = () => {
    alert(
      'Abriendo configuración de objetivos... Esta funcionalidad estará disponible próximamente.'
    );
  };

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
        // Mock executive dashboard data
        const mockMetrics: ExecutiveMetrics = {
          totalRevenue: 125000000,
          monthlyGrowth: 12.5,
          totalUsers: 15420,
          activeProperties: 2834,
          conversionRate: 24.7,
          customerSatisfaction: 4.6,
          monthlyActiveUsers: 8934,
          churnRate: 3.2,
          averageTransactionValue: 45000,
          topPerformingRegions: [
            { region: 'Santiago Centro', revenue: 35000000, growth: 18.5 },
            { region: 'Providencia', revenue: 28000000, growth: 15.2 },
            { region: 'Las Condes', revenue: 25000000, growth: 12.8 },
            { region: 'Vitacura', revenue: 22000000, growth: 9.4 },
            { region: 'Ñuñoa', revenue: 15000000, growth: 7.1 },
          ],
          keyAlerts: [
            {
              id: '1',
              type: 'warning',
              message: 'Tasa de abandono de usuarios aumentó 2.1% este mes',
              priority: 2,
            },
            {
              id: '2',
              type: 'critical',
              message: '5 contratos principales vencen en menos de 30 días',
              priority: 1,
            },
            {
              id: '3',
              type: 'info',
              message: 'Nuevo récord de propiedades activas esta semana',
              priority: 3,
            },
          ],
          revenueByMonth: [
            { month: 'Ene', revenue: 9500000, target: 10000000 },
            { month: 'Feb', revenue: 10200000, target: 10500000 },
            { month: 'Mar', revenue: 11800000, target: 11000000 },
            { month: 'Abr', revenue: 12500000, target: 12000000 },
            { month: 'May', revenue: 13200000, target: 12500000 },
            { month: 'Jun', revenue: 12800000, target: 13000000 },
          ],
        };

        setMetrics(mockMetrics);

        // Calculate summary stats
        const dashboardStats: DashboardStats = {
          totalRevenue: mockMetrics.totalRevenue,
          revenueGrowth: mockMetrics.monthlyGrowth,
          totalUsers: mockMetrics.totalUsers,
          userGrowth: 8.5, // Mock growth
          activeProperties: mockMetrics.activeProperties,
          propertyGrowth: 5.2, // Mock growth
          conversionRate: mockMetrics.conversionRate,
          satisfactionScore: mockMetrics.customerSatisfaction,
        };

        setStats(dashboardStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading dashboard data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadDashboardData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Información</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard ejecutivo...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Dashboard Ejecutivo"
      subtitle="Vista general del rendimiento del negocio y métricas clave"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Ejecutivo</h1>
            <p className="text-gray-600">Métricas clave y rendimiento del negocio</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
            <Button variant="outline" onClick={handleConfigureDashboard}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Dashboard
            </Button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{stats.revenueGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{stats.userGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades Activas</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.activeProperties.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">+{stats.propertyGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.satisfactionScore}/5.0</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-sm text-gray-600">⭐⭐⭐⭐⭐</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart & Performance */}
          <div className="lg:col-span-2 space-y-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tendencia de Ingresos
                </CardTitle>
                <CardDescription>Ingresos mensuales vs objetivos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.revenueByMonth.map((month, index) => {
                    const percentage = (month.revenue / month.target) * 100;
                    return (
                      <div key={month.month} className="flex items-center gap-4">
                        <div className="w-12 text-sm font-medium text-gray-600">{month.month}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-600">
                              {formatCurrency(month.revenue)} / {formatCurrency(month.target)}
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                percentage >= 100 ? 'text-green-600' : 'text-orange-600'
                              }`}
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Regions */}
            <Card>
              <CardHeader>
                <CardTitle>Regiones con Mejor Rendimiento</CardTitle>
                <CardDescription>Ingresos por región geográfica</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.topPerformingRegions.map((region, index) => (
                    <div
                      key={region.region}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : index === 1
                                ? 'bg-gray-100 text-gray-800'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{region.region}</p>
                          <p className="text-sm text-gray-600">{formatCurrency(region.revenue)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            +{region.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Quick Actions */}
          <div className="space-y-6">
            {/* Key Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas Importantes
                </CardTitle>
                <CardDescription>Problemas que requieren atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.keyAlerts
                    .sort((a, b) => a.priority - b.priority)
                    .map(alert => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border ${
                          alert.type === 'critical'
                            ? 'bg-red-50 border-red-200'
                            : alert.type === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                            <div className="mt-1">{getAlertBadge(alert.type)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Herramientas y acciones comunes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleGenerateReport}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Reporte Ejecutivo
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleReviewKPIs}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Revisar KPIs de Equipo
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleScheduleMeeting}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Programar Reunión Estratégica
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleMarketAnalysis}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Análisis de Mercado
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    onClick={handleConfigureObjectives}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar Objetivos
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Adicionales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasa de Conversión</span>
                    <span className="font-medium">{stats.conversionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Promedio Transacción</span>
                    <span className="font-medium">
                      {formatCurrency(metrics?.averageTransactionValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tasa de Abandono</span>
                    <span className="font-medium text-red-600">{metrics?.churnRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Usuarios Activos Mensuales</span>
                    <span className="font-medium">
                      {metrics?.monthlyActiveUsers.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
