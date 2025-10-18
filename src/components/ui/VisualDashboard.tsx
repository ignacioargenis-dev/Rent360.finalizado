'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Home, 
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface DashboardStats {
  totalUsers?: number;
  totalProperties?: number;
  totalContracts?: number;
  totalPayments?: number;
  monthlyRevenue?: number;
  activeUsers?: number;
  newUsers?: number;
  pendingTickets?: number;
  completedTasks?: number;
  pendingTasks?: number;
  totalEarnings?: number;
  pendingPayments?: number;
  completedRequests?: number;
  averageRating?: number;
  totalReviews?: number;
}

interface VisualDashboardProps {
  userRole: string;
  userId: string;
  period?: '7d' | '30d' | '90d' | '1y';
}

export function VisualDashboard({ userRole, userId, period = '30d' }: VisualDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/dashboard-stats?period=${selectedPeriod}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setStats(result.data);
          return;
        }
      }
      
      // Fallback a datos mock para desarrollo
      logger.warn('API falló, usando datos mock para dashboard visual');
      setStats(getMockStats(userRole));
    } catch (error) {
      logger.error('Error cargando estadísticas:', error);
      setStats(getMockStats(userRole));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriod, userRole, userId]);

  const getMockStats = (role: string): DashboardStats => {
    const baseStats = {
      totalUsers: 1250,
      totalProperties: 340,
      totalContracts: 180,
      totalPayments: 156,
      monthlyRevenue: 45000000,
      activeUsers: 890,
      newUsers: 45,
      pendingTickets: 12,
    };

    switch (role) {
      case 'OWNER':
        return {
          ...baseStats,
          totalProperties: 8,
          totalContracts: 6,
          totalPayments: 18,
          monthlyRevenue: 2400000,
          completedTasks: 15,
          pendingTasks: 3,
        };
      case 'BROKER':
        return {
          ...baseStats,
          totalProperties: 25,
          totalContracts: 18,
          totalPayments: 54,
          monthlyRevenue: 1800000,
          completedTasks: 22,
          pendingTasks: 5,
        };
      case 'TENANT':
        return {
          totalContracts: 2,
          totalPayments: 6,
          completedTasks: 8,
          pendingTasks: 1,
        };
      case 'RUNNER':
        return {
          completedTasks: 45,
          pendingTasks: 8,
          totalEarnings: 850000,
          pendingPayments: 120000,
        };
      case 'PROVIDER':
      case 'MAINTENANCE':
        return {
          completedRequests: 32,
          totalEarnings: 1200000,
          pendingPayments: 180000,
          averageRating: 4.7,
          totalReviews: 28,
        };
      default:
        return baseStats;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const getRoleSpecificCards = () => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalUsers || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+{stats.newUsers || 0}</span> nuevos este mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalProperties || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalContracts || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8%</span> desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+15%</span> desde el mes pasado
                </p>
              </CardContent>
            </Card>
          </>
        );

      case 'OWNER':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Propiedades</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalProperties || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.totalContracts || 0}</span> con contratos activos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.totalPayments || 0}</span> pagos recibidos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.completedTasks || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{stats.pendingTasks || 0}</span> pendientes
                </p>
              </CardContent>
            </Card>
          </>
        );

      case 'BROKER':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Propiedades Gestionadas</CardTitle>
                <Home className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalProperties || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.totalContracts || 0}</span> contratos activos
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisiones Mensuales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> desde el mes pasado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.completedTasks || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{stats.pendingTasks || 0}</span> pendientes
                </p>
              </CardContent>
            </Card>
          </>
        );

      case 'TENANT':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.totalContracts || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.totalPayments || 0}</span> pagos realizados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes de Mantenimiento</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.completedTasks || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{stats.pendingTasks || 0}</span> pendientes
                </p>
              </CardContent>
            </Card>
          </>
        );

      case 'RUNNER':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.completedTasks || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{stats.pendingTasks || 0}</span> pendientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{formatCurrency(stats.pendingPayments || 0)}</span> pendientes
                </p>
              </CardContent>
            </Card>
          </>
        );

      case 'PROVIDER':
      case 'MAINTENANCE':
        return (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Servicios Completados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(stats.completedRequests || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8</span> este mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-orange-600">{formatCurrency(stats.pendingPayments || 0)}</span> pendientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calificación Promedio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.averageRating?.toFixed(1) || '0.0'}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">{stats.totalReviews || 0}</span> reseñas
                </p>
              </CardContent>
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Visual</h2>
          <div className="flex space-x-2">
            {['7d', '30d', '90d', '1y'].map((p) => (
              <Button
                key={p}
                variant={selectedPeriod === p ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(p as any)}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard Visual</h2>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map((p) => (
            <Button
              key={p}
              variant={selectedPeriod === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(p as any)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="performance">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {getRoleSpecificCards()}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de tendencias</p>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribución
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2" />
                    <p>Gráfico de distribución</p>
                    <p className="text-sm">Próximamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Métricas de Rendimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Eficiencia</span>
                    <Badge variant="secondary">85%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Tiempo Promedio</span>
                    <Badge variant="secondary">2.3h</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Satisfacción</span>
                    <Badge variant="secondary">4.7/5</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Meta Mensual</span>
                    <Badge variant="outline">75%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progreso Semanal</span>
                    <Badge variant="outline">60%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Objetivo Anual</span>
                    <Badge variant="outline">45%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
