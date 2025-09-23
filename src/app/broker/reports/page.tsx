'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar, 
  DollarSign, 
  Home,
  Users,
  FileText,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Star,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Settings,
  Printer,
  Mail,
  Hand,
  Award,
  Trophy,
  Zap,
  UserCheck, 
  Building, 
  Briefcase
} from 'lucide-react';
import { User } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface ReportMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface PerformanceData {
  totalProperties: number;
  activeContracts: number;
  totalClients: number;
  totalRevenue: number;
  totalCommission: number;
  averageCommissionRate: number;
  successRate: number;
  clientSatisfaction: number;
  propertiesSold: number;
  propertiesRented: number;
  averageTimeToClose: number;
}

interface TopPerformer {
  id: string;
  name: string;
  type: 'property' | 'client';
  value: number;
  metric: string;
  change: string;
}

interface MonthlyData {
  month: string;
  contracts: number;
  revenue: number;
  commission: number;
  clients: number;
}

export default function BrokerReportsPage() {
  const { user } = useUserState();
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [performance, setPerformance] = useState<PerformanceData>({
    totalProperties: 0,
    activeContracts: 0,
    totalClients: 0,
    totalRevenue: 0,
    totalCommission: 0,
    averageCommissionRate: 0,
    successRate: 0,
    clientSatisfaction: 0,
    propertiesSold: 0,
    propertiesRented: 0,
    averageTimeToClose: 0,
  });
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('last30days');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setMetrics([
        {
          label: 'Ingresos Totales',
          value: '$45.2M',
          change: '+18.5%',
          trend: 'up',
          icon: DollarSign,
          color: 'text-green-600',
        },
        {
          label: 'Comisiones',
          value: '$2.7M',
          change: '+22.3%',
          trend: 'up',
          icon: Hand,
          color: 'text-purple-600',
        },
        {
          label: 'Clientes',
          value: '156',
          change: '+12.1%',
          trend: 'up',
          icon: Users,
          color: 'text-blue-600',
        },
        {
          label: 'Propiedades',
          value: '89',
          change: '+8.7%',
          trend: 'up',
          icon: Building,
          color: 'text-orange-600',
        },
        {
          label: 'Contratos',
          value: '67',
          change: '+15.2%',
          trend: 'up',
          icon: FileText,
          color: 'text-indigo-600',
        },
        {
          label: 'Satisfacción',
          value: '4.8/5',
          change: '+0.4',
          trend: 'up',
          icon: Star,
          color: 'text-yellow-600',
        },
      ]);

      setPerformance({
        totalProperties: 89,
        activeContracts: 45,
        totalClients: 156,
        totalRevenue: 45200000,
        totalCommission: 2710000,
        averageCommissionRate: 6.0,
        successRate: 89.2,
        clientSatisfaction: 4.8,
        propertiesSold: 12,
        propertiesRented: 33,
        averageTimeToClose: 14,
      });

      setTopPerformers([
        {
          id: '1',
          name: 'Departamento Las Condes',
          type: 'property',
          value: 550000,
          metric: 'Comisión mensual',
          change: '+5.2%',
        },
        {
          id: '2',
          name: 'María González',
          type: 'client',
          value: 1650000,
          metric: 'Comisión total',
          change: '+12.8%',
        },
        {
          id: '3',
          name: 'Oficina Providencia',
          type: 'property',
          value: 350000,
          metric: 'Comisión mensual',
          change: '+3.1%',
        },
        {
          id: '4',
          name: 'Empresa Soluciones Ltda.',
          type: 'client',
          value: 840000,
          metric: 'Comisión total',
          change: '+8.5%',
        },
      ]);

      setMonthlyData([
        { month: 'Ene', contracts: 8, revenue: 3200000, commission: 192000, clients: 12 },
        { month: 'Feb', contracts: 12, revenue: 4800000, commission: 288000, clients: 18 },
        { month: 'Mar', contracts: 15, revenue: 6100000, commission: 366000, clients: 22 },
        { month: 'Abr', contracts: 10, revenue: 4100000, commission: 246000, clients: 15 },
        { month: 'May', contracts: 13, revenue: 5300000, commission: 318000, clients: 19 },
        { month: 'Jun', contracts: 9, revenue: 3700000, commission: 222000, clients: 14 },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

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
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Reportes y Análisis"
        subtitle="Analiza tu desempeño como corredor"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Header Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Período de Reporte</h2>
                <div className="flex gap-2">
                  {['last7days', 'last30days', 'last90days', 'thisYear', 'lastYear'].map((range) => (
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
              <div className="flex gap-2">
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar PDF
                </Button>
                <Button variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center ${metric.color}`}>
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
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Resumen de Desempeño
              </CardTitle>
              <CardDescription>
                Métricas clave de tu rendimiento como corredor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performance.totalClients}
                  </div>
                  <div className="text-sm text-green-700">Total Clientes</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {performance.activeContracts}
                  </div>
                  <div className="text-sm text-blue-700">Contratos Activos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPrice(performance.totalCommission)}
                  </div>
                  <div className="text-sm text-purple-700">Comisión Total</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {performance.successRate}%
                  </div>
                  <div className="text-sm text-orange-700">Tasa de Éxito</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo promedio de cierre</span>
                  <span className="font-semibold">{performance.averageTimeToClose} días</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Comisión promedio</span>
                  <span className="font-semibold">{performance.averageCommissionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satisfacción del cliente</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{performance.clientSatisfaction}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Types Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Rendimiento por Tipo
              </CardTitle>
              <CardDescription>
                Desglose de propiedades arrendadas vs vendidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Home className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold">Propiedades Arrendadas</p>
                      <p className="text-sm text-gray-600">{performance.propertiesRented} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {Math.round((performance.propertiesRented / (performance.propertiesRented + performance.propertiesSold)) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">del total</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold">Propiedades Vendidas</p>
                      <p className="text-sm text-gray-600">{performance.propertiesSold} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {Math.round((performance.propertiesSold / (performance.propertiesRented + performance.propertiesSold)) * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">del total</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total de propiedades gestionadas</span>
                    <span className="text-lg font-bold text-gray-900">
                      {performance.propertiesRented + performance.propertiesSold}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Mejores Performers
                </CardTitle>
                <CardDescription>
                  Propiedades y clientes con mejor rendimiento
                </CardDescription>
              </div>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        performer.type === 'property' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {performer.type === 'property' ? (
                          <Building className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Users className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{performer.name}</h3>
                        <p className="text-sm text-gray-600">
                          {performer.type === 'property' ? 'Propiedad' : 'Cliente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">{performer.change}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">{performer.metric}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {performer.type === 'property' ? formatPrice(performer.value) : formatPrice(performer.value)}
                      </p>
                    </div>
                    <Badge className={`${index === 0 ? 'bg-yellow-100 text-yellow-800' : index === 1 ? 'bg-gray-100 text-gray-800' : 'bg-orange-100 text-orange-800'}`}>
                      #{index + 1}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tendencia Mensual
            </CardTitle>
            <CardDescription>
              Evolución de tus métricas clave en los últimos meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-16 text-center">
                      <p className="text-sm font-medium text-gray-600">{data.month}</p>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Contratos</p>
                        <p className="font-semibold">{data.contracts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Ingresos</p>
                        <p className="font-semibold">{formatPrice(data.revenue)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Comisión</p>
                        <p className="font-semibold text-purple-600">{formatPrice(data.commission)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Clientes</p>
                        <p className="font-semibold">{data.clients}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && monthlyData[index - 1] && (() => {
                      const prevData = monthlyData[index - 1]!;
                      return (
                        <>
                          {data.contracts > prevData.contracts && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          {data.commission > prevData.commission && (
                            <DollarSign className="w-4 h-4 text-green-600" />
                          )}
                        </>
                      );
                    })()}
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
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Reporte Personalizado
                </Button>
                <Button>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
