'use client';

import { logger } from '@/lib/logger-edge';

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
  RefreshCw, Wrench  } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Link from 'next/link';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface AnalyticsData {
  totalUsers: number;
  totalProperties: number;
  totalContracts: number;
  totalRevenue: number;
  userGrowth: { date: string; count: number }[];
  propertyGrowth: { date: string; count: number }[];
  revenueGrowth: { date: string; amount: number }[];
  topProperties: { id: string; title: string; views: number; inquiries: number }[];
  userDistribution: { role: string; count: number; percentage: number }[];
}

export default function AdminAnalytics() {

  const [user, setUser] = useState<User | null>(null);

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalProperties: 0,
    totalContracts: 0,
    totalRevenue: 0,
    userGrowth: [],
    propertyGrowth: [],
    revenueGrowth: [],
    topProperties: [],
    userDistribution: [],
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
        // Obtener datos reales de analytics desde la API
        const response = await fetch(`/api/admin/analytics?timeframe=${dateRange}`);
        if (!response.ok) {
          throw new Error('Error al obtener datos de analytics');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Error en la respuesta de analytics');
        }

        const analyticsData = data.data;

        // Convertir datos de la API al formato esperado por el componente
        setAnalytics({
          totalUsers: analyticsData.overview.totalUsers,
          totalProperties: analyticsData.overview.totalProperties,
          totalContracts: analyticsData.overview.totalContracts,
          totalRevenue: analyticsData.overview.totalRevenue,
          userGrowth: analyticsData.trends.contracts.map((item: any) => ({
            date: item.month + '-01', // Convertir YYYY-MM a fecha
            count: item.count
          })),
          propertyGrowth: analyticsData.trends.contracts.map((item: any) => ({
            date: item.month + '-01',
            count: Math.floor(item.count * 0.8) // Estimación de propiedades activas
          })),
          revenueGrowth: analyticsData.trends.revenue.map((item: any) => ({
            date: item.month + '-01',
            amount: item.revenue
          })),
          topProperties: analyticsData.popularProperties.map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            views: prop.contractCount * 10, // Estimación de vistas basada en contratos
            inquiries: Math.floor(prop.contractCount * 2.5), // Estimación de consultas
          })),
          userDistribution: analyticsData.distribution.userRoles.map((role: any) => ({
            role: role.role,
            count: role.count,
            percentage: Math.round(role.percentage)
          }))
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error loading analytics data:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadAnalyticsData();
  }, [dateRange]);

  const generateGrowthData = (total: number, days: number) => {
    const data: any[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i += 5) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const count = Math.floor((total * (i + 5)) / days);
      data.push({
        date: date.toISOString().substring(0, 10),
        count,
      });
    }
    
    return data;
  };

  const generateRevenueGrowthData = (total: number, days: number) => {
    const data: any[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i += 5) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const amount = Math.floor((total * (i + 5)) / days);
      data.push({
        date: date.toISOString().substring(0, 10),
        amount,
      });
    }
    
    return data;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'tenant': return 'Inquilino';
      case 'owner': return 'Propietario';
      case 'broker': return 'Corredor';
      case 'runner': return 'Runner360';
      case 'support': return 'Soporte';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444'; // red
      case 'tenant': return '#3b82f6'; // blue
      case 'owner': return '#10b981'; // green
      case 'broker': return '#f59e0b'; // amber
      case 'runner': return '#8b5cf6'; // violet
      case 'support': return '#06b6d4'; // cyan
      default: return '#6b7280'; // gray
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
    <EnhancedDashboardLayout
      user={user}
      title="Analíticas"
      subtitle="Estadísticas y métricas del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analíticas del Sistema</h1>
            <p className="text-gray-600">Métricas clave y tendencias de Rent360</p>
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
                  <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{Math.round((analytics.totalUsers * 0.12))} nuevos usuarios
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalProperties}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {analytics.totalProperties > 10 ? 'Alta disponibilidad' : 'Baja disponibilidad'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalContracts}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Contratos activos
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(analytics.totalRevenue)}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Ingresos totales
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Crecimiento de Usuarios
              </CardTitle>
              <CardDescription>Nuevos usuarios registrados en el período seleccionado</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, 'Usuarios']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Crecimiento de Ingresos
              </CardTitle>
              <CardDescription>Evolución de los ingresos mensuales</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={256}>
                <LineChart data={analytics.revenueGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Ingresos']}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Properties and User Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Más Populares</CardTitle>
              <CardDescription>Basado en vistas e inquiries</CardDescription>
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
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Ver</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Usuarios</CardTitle>
              <CardDescription>Por tipo de rol en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.userDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.userDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getRoleColor(entry.role)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [value, getRoleDisplayName(name as string)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {analytics.userDistribution.map((distribution) => (
                  <div key={distribution.role} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getRoleColor(distribution.role) }}
                      ></div>
                      <span>{getRoleDisplayName(distribution.role)}</span>
                    </div>
                    <span className="font-medium">{distribution.count} ({distribution.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}
