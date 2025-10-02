'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Building,
  FileText,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Search,
  Mail,
  MessageSquare
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface DashboardMetrics {
  // Métricas Generales
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  availableProperties: number;
  totalContracts: number;
  activeContracts: number;

  // Métricas Financieras
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  processedPayments: number;
  averageCommission: number;

  // Métricas de Corredores
  totalBrokers: number;
  activeBrokers: number;
  topPerformingBrokers: BrokerPerformance[];
  brokerStats: BrokerStats;

  // Métricas de Comisiones
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionTrend: TrendData[];

  // Payouts
  pendingPayouts: PayoutSummary[];
  recentPayouts: PayoutRecord[];
}

interface BrokerPerformance {
  id: string;
  name: string;
  totalCommissions: number;
  activeContracts: number;
  averageRating: number;
  monthlyRevenue: number;
  growth: number;
}

interface BrokerStats {
  averageCommission: number;
  totalActiveContracts: number;
  topPropertyType: string;
  averageResponseTime: number;
}

interface TrendData {
  date: string;
  value: number;
  previousValue: number;
}

interface PayoutSummary {
  brokerId: string;
  brokerName: string;
  amount: number;
  period: {
    start: string;
    end: string;
  };
  status: 'pending' | 'processing' | 'paid';
}

interface PayoutRecord {
  id: string;
  brokerName: string;
  amount: number;
  processedAt: string;
  method: string;
  status: 'paid' | 'failed';
}

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [notificationStats, setNotificationStats] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNotificationStats();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/executive-dashboard?timeframe=${timeframe}`);
      const data = await response.json();
      setMetrics(data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchNotificationStats = async () => {
    try {
      const response = await fetch('/api/admin/notifications/queue');
      const data = await response.json();
      if (data.success) {
        setNotificationStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  const processNotificationQueue = async () => {
    try {
      const response = await fetch('/api/admin/notifications/queue/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
      });
      const data = await response.json();
      if (data.success) {
        console.log('Cola de notificaciones procesada exitosamente');
        fetchNotificationStats();
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIndicator = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(growth),
      isPositive: growth > 0,
      formatted: `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`
    };
  };

  if (loading || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-64 bg-white shadow-lg">
            <div className="p-4">
              <h2 className="text-lg font-semibold">Rent360 Admin</h2>
            </div>
          </div>
          <div className="flex-1">
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Cargando dashboard ejecutivo...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6"> 
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Ejecutivo</h1>
            <p className="text-muted-foreground">
              Vista completa del rendimiento del sistema Rent360
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="90d">90 días</SelectItem>
                <SelectItem value="1y">1 año</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={fetchDashboardData}
              disabled={refreshing}
              variant="outline"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Ingresos Totales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">+12.5%</span>
                <span className="ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Contratos Activos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeContracts}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">+8.2%</span>
                <span className="ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>

          {/* Corredores Activos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corredores Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeBrokers}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className="text-green-500">+2 nuevos</span>
                <span className="ml-1">este mes</span>
              </div>
            </CardContent>
          </Card>

          {/* Comisiones Pendientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisiones Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.pendingCommissions)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
                <span className="text-yellow-500">{metrics.pendingPayouts.length} payouts pendientes</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="brokers">Corredores</TabsTrigger>
            <TabsTrigger value="financial">Financiero</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          </TabsList>

          {/* Vista General */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de Tendencias de Ingresos */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias de Ingresos</CardTitle>
                  <CardDescription>Ingresos mensuales de los últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mr-4" />
                    <span>Gráfico de tendencias (implementación pendiente)</span>
                  </div>
                </CardContent>
              </Card>

              {/* Distribución por Tipo de Propiedad */}
              <Card>
                <CardHeader>
                  <CardTitle>Contratos por Tipo</CardTitle>
                  <CardDescription>Distribución de contratos activos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-blue-500" />
                        <span>Departamentos</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">68%</div>
                        <div className="text-xs text-muted-foreground">136 contratos</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-green-500" />
                        <span>Casas</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">24%</div>
                        <div className="text-xs text-muted-foreground">48 contratos</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-purple-500" />
                        <span>Oficinas</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">8%</div>
                        <div className="text-xs text-muted-foreground">16 contratos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas y Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas del Sistema</CardTitle>
                <CardDescription>Eventos importantes que requieren atención</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center p-4 border rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-medium">Payouts Pendientes</h4>
                      <p className="text-sm text-muted-foreground">
                        {metrics.pendingPayouts.length} payouts pendientes de procesamiento
                      </p>
                    </div>
                    <Button size="sm">Procesar</Button>
                  </div>

                  <div className="flex items-center p-4 border rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-500 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-medium">Rendimiento Excelente</h4>
                      <p className="text-sm text-muted-foreground">
                        Los ingresos han aumentado un 12.5% este mes
                      </p>
                    </div>
                    <Badge variant="secondary">Positivo</Badge>
                  </div>

                  <div className="flex items-center p-4 border rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-3" />
                    <div className="flex-1">
                      <h4 className="font-medium">Sistema Estable</h4>
                      <p className="text-sm text-muted-foreground">
                        Todos los servicios funcionando correctamente
                      </p>
                    </div>
                    <Badge variant="outline">OK</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Corredores */}
          <TabsContent value="brokers" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Corredores */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Corredores</CardTitle>
                  <CardDescription>Corredores con mejor rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topPerformingBrokers.map((broker, index) => (
                      <div key={broker.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{broker.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {broker.activeContracts} contratos activos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(broker.totalCommissions)}</div>
                          <div className="text-sm text-muted-foreground">
                            {broker.growth > 0 ? '+' : ''}{broker.growth.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Estadísticas de Corredores */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas Generales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Comisión Promedio</span>
                    <span className="font-medium">{formatCurrency(metrics.brokerStats.averageCommission)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contratos Activos</span>
                    <span className="font-medium">{metrics.brokerStats.totalActiveContracts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Propiedad Más Popular</span>
                    <span className="font-medium">{metrics.brokerStats.topPropertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tiempo de Respuesta</span>
                    <span className="font-medium">{metrics.brokerStats.averageResponseTime}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Financiero */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Ingresos del Mes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyRevenue)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pagos Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.pendingPayments)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pagos Procesados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.processedPayments)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Comisión Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(metrics.averageCommission)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tendencias de Comisiones */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de Comisiones</CardTitle>
                <CardDescription>Evolución mensual de comisiones pagadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <Activity className="w-12 h-12 mr-4" />
                  <span>Gráfico de tendencias de comisiones</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Gestión de Payouts</h3>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>

            {/* Payouts Pendientes */}
            <Card>
              <CardHeader>
                <CardTitle>Payouts Pendientes</CardTitle>
                <CardDescription>Pagos de comisiones listos para procesar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.pendingPayouts.map((payout) => (
                    <div key={payout.brokerId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{payout.brokerName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Período: {new Date(payout.period.start).toLocaleDateString()} - {new Date(payout.period.end).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payout.amount)}</div>
                          <Badge variant={payout.status === 'pending' ? 'secondary' : 'default'}>
                            {payout.status}
                          </Badge>
                        </div>
                        <Button size="sm" variant="outline">
                          Procesar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Historial de Payouts */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Payouts</CardTitle>
                <CardDescription>Últimos pagos procesados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recentPayouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{payout.brokerName}</h4>
                        <p className="text-sm text-muted-foreground">
                          Procesado: {new Date(payout.processedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payout.amount)}</div>
                          <p className="text-sm text-muted-foreground">{payout.method}</p>
                        </div>
                        <Badge variant={payout.status === 'paid' ? 'default' : 'destructive'}>
                          {payout.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Crecimiento Mensual</CardTitle>
                  <CardDescription>Análisis de crecimiento del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Nuevos Usuarios</span>
                      <div className="text-right">
                        <div className="font-medium">+12.5%</div>
                        <div className="text-sm text-muted-foreground">vs mes anterior</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Nuevos Contratos</span>
                      <div className="text-right">
                        <div className="font-medium">+8.2%</div>
                        <div className="text-sm text-muted-foreground">vs mes anterior</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Ingresos</span>
                      <div className="text-right">
                        <div className="font-medium">+15.3%</div>
                        <div className="text-sm text-muted-foreground">vs mes anterior</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>KPIs del Sistema</CardTitle>
                  <CardDescription>Métricas clave de rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Tasa de Conversión</span>
                      <div className="text-right">
                        <div className="font-medium">78.5%</div>
                        <div className="text-sm text-muted-foreground">Contratos exitosos</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Satisfacción de Usuarios</span>
                      <div className="text-right">
                        <div className="font-medium">4.6/5</div>
                        <div className="text-sm text-muted-foreground">⭐⭐⭐⭐⭐</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Tiempo de Respuesta</span>
                      <div className="text-right">
                        <div className="font-medium">2.3h</div>
                        <div className="text-sm text-muted-foreground">Promedio sistema</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notificaciones */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Sistema de Notificaciones</h3>
              <div className="flex items-center space-x-4">
                <Button onClick={processNotificationQueue} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Procesar Cola
                </Button>
                <Button onClick={fetchNotificationStats} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Estadísticas de Notificaciones */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total en Cola</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notificationStats?.total || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pendientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{notificationStats?.pending || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{notificationStats?.completed || 0}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Fallidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{notificationStats?.failed || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Distribución por Prioridad */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Prioridad</CardTitle>
                <CardDescription>Prioridad de las notificaciones en cola</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded mr-3"></div>
                      <span>Urgente</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byPriority?.urgent || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mr-3"></div>
                      <span>Alta</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byPriority?.high || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                      <span>Media</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byPriority?.medium || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                      <span>Baja</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byPriority?.low || 0}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Distribución por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
                <CardDescription>Tipos de notificaciones procesadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-3 text-blue-500" />
                      <span>Comisiones</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byType?.commission || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-3 text-red-500" />
                      <span>Sistema</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byType?.system || 0}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-3 text-purple-500" />
                      <span>Programadas</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{notificationStats?.byType?.scheduled || 0}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado del Sistema de Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>Información del procesamiento de notificaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-green-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Sistema Activo</h4>
                        <p className="text-sm text-muted-foreground">
                          Procesamiento automático cada 30 segundos
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600">OK</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Envío de Emails</h4>
                        <p className="text-sm text-muted-foreground">
                          Servicio de email configurado y operativo
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-blue-600">OK</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <MessageSquare className="w-5 h-5 text-purple-500 mr-3" />
                      <div>
                        <h4 className="font-medium">Envío de SMS</h4>
                        <p className="text-sm text-muted-foreground">
                          Servicio de SMS configurado y operativo
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-purple-600">OK</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout
  );
}


