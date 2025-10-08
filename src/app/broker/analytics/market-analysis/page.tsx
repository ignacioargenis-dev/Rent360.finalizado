'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MapPin,
  Home,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  Download,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { User } from '@/types';

interface MarketData {
  location: string;
  averageRent: number;
  demandLevel: 'low' | 'medium' | 'high';
  occupancyRate: number;
  priceTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  competitorCount: number;
  averageResponseTime: number;
  popularPropertyTypes: string[];
}

interface MarketInsight {
  type: 'opportunity' | 'warning' | 'trend';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export default function MarketAnalysisPage() {
  const [user, setUser] = useState<User | null>(null);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
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
        logger.error('Error loading user data:', { error });
      }
    };

    const loadMarketData = async () => {
      try {
        // Mock market data
        const mockMarketData: MarketData[] = [
          {
            location: 'Las Condes',
            averageRent: 850000,
            demandLevel: 'high',
            occupancyRate: 95,
            priceTrend: 'up',
            trendPercentage: 8.5,
            competitorCount: 45,
            averageResponseTime: 1.2,
            popularPropertyTypes: ['1 dormitorio', '2 dormitorios', '3 dormitorios'],
          },
          {
            location: 'Providencia',
            averageRent: 720000,
            demandLevel: 'high',
            occupancyRate: 92,
            priceTrend: 'up',
            trendPercentage: 6.2,
            competitorCount: 38,
            averageResponseTime: 1.8,
            popularPropertyTypes: ['1 dormitorio', '2 dormitorios', 'Oficina'],
          },
          {
            location: 'Vitacura',
            averageRent: 950000,
            demandLevel: 'medium',
            occupancyRate: 88,
            priceTrend: 'stable',
            trendPercentage: 2.1,
            competitorCount: 28,
            averageResponseTime: 2.1,
            popularPropertyTypes: ['2 dormitorios', '3 dormitorios', 'Casa'],
          },
          {
            location: 'Ñuñoa',
            averageRent: 650000,
            demandLevel: 'medium',
            occupancyRate: 85,
            priceTrend: 'up',
            trendPercentage: 4.8,
            competitorCount: 52,
            averageResponseTime: 2.5,
            popularPropertyTypes: ['1 dormitorio', '2 dormitorios'],
          },
          {
            location: 'La Reina',
            averageRent: 580000,
            demandLevel: 'medium',
            occupancyRate: 82,
            priceTrend: 'down',
            trendPercentage: -3.2,
            competitorCount: 31,
            averageResponseTime: 3.1,
            popularPropertyTypes: ['2 dormitorios', '3 dormitorios', 'Casa'],
          },
          {
            location: 'Santiago Centro',
            averageRent: 450000,
            demandLevel: 'low',
            occupancyRate: 75,
            priceTrend: 'stable',
            trendPercentage: 0.8,
            competitorCount: 67,
            averageResponseTime: 4.2,
            popularPropertyTypes: ['1 dormitorio', 'Oficina'],
          },
        ];

        const mockInsights: MarketInsight[] = [
          {
            type: 'opportunity',
            title: 'Alta demanda en Las Condes',
            description:
              'La comuna de Las Condes muestra una demanda excepcionalmente alta con una tasa de ocupación del 95%.',
            impact: 'high',
            recommendation:
              'Considera aumentar tu portafolio en esta zona. Los precios están subiendo un 8.5% anual.',
          },
          {
            type: 'warning',
            title: 'Competencia creciente en Santiago Centro',
            description:
              '67 competidores activos en Santiago Centro, con tiempos de respuesta promedio de 4.2 horas.',
            impact: 'medium',
            recommendation:
              'Diferénciate ofreciendo respuestas más rápidas y mejor calidad en las fotografías.',
          },
          {
            type: 'trend',
            title: 'Tendencia a la baja en La Reina',
            description:
              'Los precios en La Reina han bajado un 3.2% en el último año, con una ocupación del 82%.',
            impact: 'medium',
            recommendation:
              'Monitorea esta zona. Podría ser una oportunidad para adquirir propiedades a precios atractivos.',
          },
          {
            type: 'opportunity',
            title: 'Segmento de oficinas creciendo',
            description:
              'Aumento del 15% en demanda de oficinas en comunas céntricas durante el último trimestre.',
            impact: 'high',
            recommendation:
              'Considera diversificar tu portafolio incluyendo más propiedades comerciales.',
          },
        ];

        setMarketData(mockMarketData);
        setInsights(mockInsights);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading market data:', { error });
        setLoading(false);
      }
    };

    loadUserData();
    loadMarketData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <TrendingDown className="w-5 h-5 text-orange-600" />;
      case 'trend':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  const filteredData =
    selectedLocation === 'all'
      ? marketData
      : marketData.filter(item => item.location === selectedLocation);

  const handleExportAnalysis = () => {
    const csvData = marketData.map(item => ({
      Ubicación: item.location,
      'Arriendo Promedio': formatCurrency(item.averageRent),
      'Nivel de Demanda': item.demandLevel,
      'Tasa de Ocupación': `${item.occupancyRate}%`,
      'Tendencia de Precio': item.priceTrend,
      'Porcentaje de Cambio': `${item.trendPercentage}%`,
      Competidores: item.competitorCount,
      'Tiempo de Respuesta Promedio': `${item.averageResponseTime}h`,
      'Tipos Populares': item.popularPropertyTypes.join(', '),
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analisis_mercado_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Análisis de Mercado" subtitle="Cargando datos...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis de mercado...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Análisis de Mercado Detallado"
      subtitle="Información completa del mercado inmobiliario por comuna"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/broker/analytics">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Analytics
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Análisis de Mercado</h1>
              <p className="text-gray-600">Datos actualizados del mercado inmobiliario chileno</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las comunas</SelectItem>
                {marketData.map(item => (
                  <SelectItem key={item.location} value={item.location}>
                    {item.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportAnalysis}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredData.reduce((sum, item) => sum + item.averageRent, 0) /
                        filteredData.length
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      filteredData.reduce((sum, item) => sum + item.occupancyRate, 0) /
                        filteredData.length
                    )}
                    %
                  </p>
                </div>
                <Home className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Competidores Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredData.reduce((sum, item) => sum + item.competitorCount, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Zonas de Alta Demanda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {filteredData.filter(item => item.demandLevel === 'high').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Market Data Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Datos por Comuna</CardTitle>
            <CardDescription>
              Información detallada del mercado inmobiliario por ubicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ubicación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Arriendo Promedio
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Demanda</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Ocupación</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Tendencia</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Competidores</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Tiempo Respuesta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item, index) => (
                    <tr key={item.location} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{item.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatCurrency(item.averageRent)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getDemandColor(item.demandLevel)}>
                          {item.demandLevel === 'high'
                            ? 'Alta'
                            : item.demandLevel === 'medium'
                              ? 'Media'
                              : 'Baja'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{item.occupancyRate}%</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {getTrendIcon(item.priceTrend)}
                          <span
                            className={
                              item.trendPercentage > 0
                                ? 'text-green-600'
                                : item.trendPercentage < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }
                          >
                            {item.trendPercentage > 0 ? '+' : ''}
                            {item.trendPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{item.competitorCount}</td>
                      <td className="py-3 px-4">{item.averageResponseTime}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Market Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights y Recomendaciones</CardTitle>
            <CardDescription>
              Análisis inteligente del mercado basado en datos actuales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.map((insight, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge
                          variant="outline"
                          className={
                            insight.impact === 'high'
                              ? 'border-red-300 text-red-700'
                              : insight.impact === 'medium'
                                ? 'border-yellow-300 text-yellow-700'
                                : 'border-gray-300 text-gray-700'
                          }
                        >
                          Impacto{' '}
                          {insight.impact === 'high'
                            ? 'Alto'
                            : insight.impact === 'medium'
                              ? 'Medio'
                              : 'Bajo'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-2">{insight.description}</p>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-blue-800 text-sm">
                          <strong>Recomendación:</strong> {insight.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
