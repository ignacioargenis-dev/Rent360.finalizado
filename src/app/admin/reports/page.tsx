'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building,
  DollarSign,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  MoreHorizontal,
  Activity,
  Target,
  PieChart,
  Clock,
  Eye,
} from 'lucide-react';
import { User } from '@/types';

interface ReportData {
  totalUsers: number;
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  totalPayments: number;
  pendingTickets: number;
  userGrowth: number;
  propertyGrowth: number;
  revenueGrowth: number;
}

interface TopProperty {
  id: string;
  title: string;
  views: number;
  inquiries: number;
  conversionRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
}

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);

  const [reportData, setReportData] = useState<ReportData | null>(null);

  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    // Load user data
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

    // Load report data
    const loadReportData = async () => {
      try {
        // Fetch real data from multiple APIs
        const [usersResponse, propertiesResponse, contractsResponse, paymentsResponse] = await Promise.all([
          fetch('/api/users?limit=1000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          }),
          fetch('/api/properties/list?limit=1000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          }),
          fetch('/api/contracts?limit=1000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          }),
          fetch('/api/payments/list?limit=1000', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            credentials: 'include',
          }),
        ]);

        const [usersData, propertiesData, contractsData, paymentsData] = await Promise.all([
          usersResponse.ok ? usersResponse.json() : { users: [] },
          propertiesResponse.ok ? propertiesResponse.json() : { properties: [] },
          contractsResponse.ok ? contractsResponse.json() : { contracts: [] },
          paymentsResponse.ok ? paymentsResponse.json() : { payments: [] },
        ]);

        // Calculate real statistics
        const totalUsers = usersData.users?.length || 0;
        const totalProperties = propertiesData.properties?.length || 0;
        const activeContracts = contractsData.contracts?.filter((c: any) => c.status === 'ACTIVE').length || 0;
        
        // Calculate monthly revenue from payments
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = paymentsData.payments?.filter((p: any) => {
          const paymentDate = new Date(p.paidDate || p.dueDate);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 p.status === 'PAID';
        }).reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

        const totalPayments = paymentsData.payments?.length || 0;
        const pendingTickets = 0; // TODO: Implement tickets system

        // Calculate growth (simplified - would need historical data for real calculation)
        const userGrowth = 0; // TODO: Calculate based on historical data
        const propertyGrowth = 0; // TODO: Calculate based on historical data
        const revenueGrowth = 0; // TODO: Calculate based on historical data

        const realReportData: ReportData = {
          totalUsers,
          totalProperties,
          activeContracts,
          monthlyRevenue,
          totalPayments,
          pendingTickets,
          userGrowth,
          propertyGrowth,
          revenueGrowth,
        };

        // Get top properties (simplified - would need view/analytics data)
        const topProperties: TopProperty[] = propertiesData.properties?.slice(0, 5).map((property: any, index: number) => ({
          id: property.id,
          title: property.title || 'Propiedad sin título',
          views: Math.floor(Math.random() * 1000) + 100, // TODO: Get real view data
          inquiries: Math.floor(Math.random() * 50) + 10, // TODO: Get real inquiry data
          conversionRate: Math.random() * 10, // TODO: Calculate real conversion rate
        })) || [];

        const mockTopProperties: TopProperty[] = [
          {
            id: '1',
            title: 'Departamento Las Condes',
            views: 1245,
            inquiries: 89,
            conversionRate: 7.1,
          },
          {
            id: '2',
            title: 'Casa Vitacura',
            views: 987,
            inquiries: 76,
            conversionRate: 7.7,
          },
          {
            id: '3',
            title: 'Oficina Providencia',
            views: 856,
            inquiries: 45,
            conversionRate: 5.3,
          },
          {
            id: '4',
            title: 'Estudio Centro',
            views: 743,
            inquiries: 38,
            conversionRate: 5.1,
          },
          {
            id: '5',
            title: 'Departamento �u�oa',
            views: 632,
            inquiries: 29,
            conversionRate: 4.6,
          },
        ];

        const mockRecentActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'user',
            title: 'Crecimiento de usuarios',
            description: 'Incremento del 12.5% en nuevos usuarios este mes',
            date: '2024-03-20',
            impact: 'high',
          },
          {
            id: '2',
            type: 'revenue',
            title: 'Record de ingresos',
            description: 'Se alcanz� el m�ximo hist�rico de ingresos mensuales',
            date: '2024-03-18',
            impact: 'high',
          },
          {
            id: '3',
            type: 'property',
            title: 'Nuevas propiedades',
            description: '67 nuevas propiedades agregadas esta semana',
            date: '2024-03-15',
            impact: 'medium',
          },
          {
            id: '4',
            type: 'contract',
            title: 'Contratos activos',
            description: '423 contratos activos, un 8% m�s que el mes anterior',
            date: '2024-03-12',
            impact: 'medium',
          },
        ];

        setReportData(realReportData);
        setTopProperties(topProperties);
        setRecentActivity(recentActivity);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading report data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadReportData();
  }, [loadReportData]);

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

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medio</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Bajo</Badge>;
      default:
        return <Badge>{impact}</Badge>;
    }
  };

  if (loading || !reportData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes Generales"
      subtitle="An�lisis completo del sistema Rent360"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with period selector */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reportes Generales</h1>
            <p className="text-gray-600 mt-2">Vista general del desempe�o del sistema</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="7d">�ltimos 7 d�as</option>
              <option value="30d">�ltimos 30 d�as</option>
              <option value="90d">�ltimos 90 d�as</option>
              <option value="1y">�ltimo a�o</option>
            </select>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(reportData.totalUsers)}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 ${getGrowthColor(reportData.userGrowth)}`}
                  >
                    {getGrowthIcon(reportData.userGrowth)}
                    <span className="text-sm font-medium">{reportData.userGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(reportData.totalProperties)}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 ${getGrowthColor(reportData.propertyGrowth)}`}
                  >
                    {getGrowthIcon(reportData.propertyGrowth)}
                    <span className="text-sm font-medium">{reportData.propertyGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatNumber(reportData.activeContracts)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Target className="w-4 h-4" />
                    <span>Tasa de ocupaci�n: 49.4%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatPrice(reportData.monthlyRevenue)}
                  </p>
                  <div
                    className={`flex items-center gap-1 mt-2 ${getGrowthColor(reportData.revenueGrowth)}`}
                  >
                    {getGrowthIcon(reportData.revenueGrowth)}
                    <span className="text-sm font-medium">{reportData.revenueGrowth}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Top Properties */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Propiedades M�s Populares
                </CardTitle>
                <CardDescription>
                  Las propiedades con mayor n�mero de vistas y conversiones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProperties.map((property, index) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              <span>{formatNumber(property.views)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{formatNumber(property.inquiries)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                          {property.conversionRate}%
                        </div>
                        <div className="text-xs text-gray-500">Conversi�n</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>Eventos importantes del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="border-l-4 border-l-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        {getImpactBadge(activity.impact)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(activity.date).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(reportData.totalPayments)}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Tickets Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData.pendingTickets}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa de Conversi�n</p>
                  <p className="text-2xl font-bold text-gray-900">6.2%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
