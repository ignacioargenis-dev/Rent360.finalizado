'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, 
  TrendingUp, 
  Users, Building, DollarSign, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Star,
  Target,
  Activity,
  PieChart,
  LineChart as LineChartIcon,
  Clock,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  AlertTriangle, 
  Wrench
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AnalyticsData {
  totalProperties: number;
  availableProperties: number;
  rentedProperties: number;
  totalViews: number;
  totalInquiries: number;
  conversionRate: number;
  averageResponseTime: number;
  totalRevenue: number;
  monthlyRevenue: number;
  topProperties: { id: string; title: string; views: number; inquiries: number; revenue: number }[];
  performanceByMonth: { month: string; views: number; inquiries: number; conversions: number; revenue: number }[];
  propertyTypeStats: { type: string; count: number; avgPrice: number; occupancy: number }[];
  neighborhoodStats: { neighborhood: string; properties: number; avgPrice: number; demand: number }[];
}

export default function BrokerAnalytics() {

  const [user, setUser] = useState<User | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalProperties: 0,
    availableProperties: 0,
    rentedProperties: 0,
    totalViews: 0,
    totalInquiries: 0,
    conversionRate: 0,
    averageResponseTime: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    topProperties: [],
    performanceByMonth: [],
    propertyTypeStats: [],
    neighborhoodStats: [],
  });

  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadAnalyticsData = async () => {
      try {
        // Mock analytics data
        const mockAnalytics: AnalyticsData = {
          totalProperties: 24,
          availableProperties: 18,
          rentedProperties: 6,
          totalViews: 45670,
          totalInquiries: 1234,
          conversionRate: 8.5,
          averageResponseTime: 2.5,
          totalRevenue: 28500000,
          monthlyRevenue: 2350000,
          topProperties: [
            { id: '1', title: 'Departamento Amoblado Centro', views: 1250, inquiries: 45, revenue: 5400000 },
            { id: '2', title: 'Casa Las Condes', views: 890, inquiries: 23, revenue: 14400000 },
            { id: '3', title: 'Oficina Vitacura', views: 567, inquiries: 12, revenue: 9600000 },
            { id: '4', title: 'Departamento Playa', views: 1100, inquiries: 34, revenue: 7200000 },
            { id: '5', title: 'Casa Familiar La Reina', views: 780, inquiries: 19, revenue: 10800000 },
          ],
          performanceByMonth: [
            { month: 'Ene', views: 3200, inquiries: 85, conversions: 7, revenue: 1800000 },
            { month: 'Feb', views: 3800, inquiries: 92, conversions: 8, revenue: 2100000 },
            { month: 'Mar', views: 4200, inquiries: 110, conversions: 9, revenue: 2350000 },
            { month: 'Abr', views: 3900, inquiries: 98, conversions: 8, revenue: 2200000 },
            { month: 'May', views: 4500, inquiries: 125, conversions: 11, revenue: 2850000 },
            { month: 'Jun', views: 4800, inquiries: 134, conversions: 12, revenue: 3200000 },
          ],
          propertyTypeStats: [
            { type: 'apartment', count: 15, avgPrice: 550000, occupancy: 75 },
            { type: 'house', count: 6, avgPrice: 950000, occupancy: 83 },
            { type: 'office', count: 2, avgPrice: 750000, occupancy: 50 },
            { type: 'commercial', count: 1, avgPrice: 1500000, occupancy: 100 },
          ],
          neighborhoodStats: [
            { neighborhood: 'Providencia', properties: 8, avgPrice: 520000, demand: 85 },
            { neighborhood: 'Las Condes', properties: 6, avgPrice: 1100000, demand: 92 },
            { neighborhood: 'Vitacura', properties: 4, avgPrice: 780000, demand: 78 },
            { neighborhood: 'La Reina', properties: 3, avgPrice: 850000, demand: 70 },
            { neighborhood: 'Viña del Mar', properties: 2, avgPrice: 650000, demand: 88 },
            { neighborhood: 'Santiago Centro', properties: 1, avgPrice: 450000, demand: 95 },
          ],
        };

        setAnalytics(mockAnalytics);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading analytics data:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadAnalyticsData();
  }, [dateRange]);

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

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'apartment':
        return 'Departamentos';
      case 'house':
        return 'Casas';
      case 'office':
        return 'Oficinas';
      case 'commercial':
        return 'Comerciales';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Analíticas"
      subtitle="Estadísticas y rendimiento de tu actividad"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analíticas de Rendimiento</h1>
            <p className="text-gray-600">Métricas clave y estadísticas de tu actividad</p>
          </div>
          <div className="flex gap-2">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalProperties}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {analytics.availableProperties} disponibles
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vistas Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</p>
                  <p className="text-xs text-blue-600 flex items-center mt-1">
                    <Eye className="w-3 h-3 mr-1" />
                    {formatNumber(analytics.totalInquiries)} consultas
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPercentage(analytics.conversionRate)}</p>
                  <p className="text-xs text-orange-600 flex items-center mt-1">
                    <Target className="w-3 h-3 mr-1" />
                    {analytics.averageResponseTime}h resp. promedio
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(analytics.monthlyRevenue)}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Total: {formatPrice(analytics.totalRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChartIcon className="w-5 h-5" />
                Rendimiento Mensual
              </CardTitle>
              <CardDescription>Evolución de vistas, consultas y conversiones</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={analytics.performanceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#3b82f6" name="Vistas" strokeWidth={2} />
                  <Line type="monotone" dataKey="inquiries" stroke="#f59e0b" name="Consultas" strokeWidth={2} />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversiones" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Ingresos Mensuales
              </CardTitle>
              <CardDescription>Evolución de ingresos por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={analytics.performanceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ingresos']}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Properties and Property Types */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Más Populares</CardTitle>
              <CardDescription>Basado en vistas, consultas y revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topProperties.map((property, index) => (
                  <div key={property.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-100 text-blue-800">#{index + 1}</Badge>
                        <h4 className="font-medium text-sm">{property.title}</h4>
                      </div>
                      <div className="flex gap-4 mt-2 text-xs text-gray-600">
                        <span>{property.views} vistas</span>
                        <span>{property.inquiries} consultas</span>
                        <span className="font-medium">{formatPrice(property.revenue)}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Ver</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Property Types */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Tipo</CardTitle>
              <CardDescription>Estadísticas por tipo de propiedad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.propertyTypeStats.map((typeStat, index) => (
                  <div key={typeStat.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Building className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getTypeName(typeStat.type)}</p>
                        <p className="text-xs text-gray-600">{typeStat.count} propiedades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatPrice(typeStat.avgPrice)}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                          <div 
                            className="h-2 bg-green-600 rounded-full" 
                            style={{ width: `${typeStat.occupancy}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{typeStat.occupancy}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Neighborhood Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Rendimiento por Barrio
            </CardTitle>
            <CardDescription>Demanda y precios por ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.neighborhoodStats.map((neighborhood, index) => (
                <div key={neighborhood.neighborhood} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{neighborhood.neighborhood}</h4>
                    <Badge variant="outline" className="text-xs">
                      {neighborhood.properties} props
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Precio promedio:</span>
                      <span className="font-medium">{formatPrice(neighborhood.avgPrice)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Demanda:</span>
                      <div className="flex items-center gap-1">
                        <div className="w-12 h-2 bg-gray-200 rounded-full">
                          <div 
                            className="h-2 bg-blue-600 rounded-full" 
                            style={{ width: `${neighborhood.demand}%` }}
                          ></div>
                        </div>
                        <span>{neighborhood.demand}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}
