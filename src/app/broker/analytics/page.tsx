'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
  const [user, setUser] = useState<User | null>(null);
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

    const loadAnalyticsData = async () => {
      try {
        // Mock analytics data
        const mockPerformance: PerformanceData = {
          propertyViews: 1250,
          inquiriesGenerated: 89,
          conversionRate: 7.1,
          averageResponseTime: 2.3,
          clientSatisfaction: 4.6,
          monthlyRevenue: 425000,
        };

        const mockTrends: TrendData[] = [
          { period: 'Enero', views: 980, inquiries: 65, conversions: 6, revenue: 380000 },
          { period: 'Febrero', views: 1100, inquiries: 72, conversions: 7, revenue: 395000 },
          { period: 'Marzo', views: 1180, inquiries: 78, conversions: 8, revenue: 410000 },
          { period: 'Abril', views: 1220, inquiries: 82, conversions: 8, revenue: 418000 },
          { period: 'Mayo', views: 1190, inquiries: 85, conversions: 9, revenue: 422000 },
          { period: 'Junio', views: 1250, inquiries: 89, conversions: 9, revenue: 425000 },
        ];

        setPerformanceData(mockPerformance);
        setTrendData(mockTrends);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading analytics data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
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
    console.log('Export analytics data');
  };

  const handleRefreshData = () => {
    console.log('Refresh analytics data');
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
                    <span>Vistas de Propiedades</span>
                    <span>1,250 / 1,500</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '83%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">83% completado</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Consultas Generadas</span>
                    <span>89 / 100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">89% completado</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ingresos Mensuales</span>
                    <span>$425K / $450K</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500">94% completado</p>
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
                <Button size="sm" variant="outline">
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
                <Button size="sm" variant="outline">
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
                <Button size="sm" variant="outline">
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
