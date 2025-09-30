'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  DollarSign, 
  Home,
  Users,
  FileText,
  RefreshCw,
  Star,
  AlertTriangle,
  CheckCircle, Settings,
  Printer,
  Mail,
  Eye,
  Activity } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';
import { User } from '@/types';

interface ReportMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
}

interface PropertyPerformance {
  id: string;
  title: string;
  address: string;
  occupancyRate: number;
  monthlyRevenue: number;
  totalRevenue: number;
  averageRating: number;
  maintenanceCosts: number;
  netProfit: number;
}

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  yearOverYearGrowth: number;
  averageOccupancyRate: number;
}

interface TenantAnalysis {
  totalTenants: number;
  averageTenure: number;
  retentionRate: number;
  satisfactionScore: number;
  topPerformers: string[];
  atRiskTenants: string[];
}

export default function OwnerReportsPage() {
  const { user } = useUserState();
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    yearOverYearGrowth: 0,
    averageOccupancyRate: 0,
  });
  const [tenantAnalysis, setTenantAnalysis] = useState<TenantAnalysis>({
    totalTenants: 0,
    averageTenure: 0,
    retentionRate: 0,
    satisfactionScore: 0,
    topPerformers: [],
    atRiskTenants: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('last30days');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setMetrics([
        {
          label: 'Ingresos Totales',
          value: '$18.5M',
          change: '+12.5%',
          trend: 'up',
          icon: DollarSign,
          color: 'text-green-600',
        },
        {
          label: 'Tasa de Ocupación',
          value: '87%',
          change: '+3.2%',
          trend: 'up',
          icon: Home,
          color: 'text-blue-600',
        },
        {
          label: 'Satisfacción',
          value: '4.7/5',
          change: '+0.3',
          trend: 'up',
          icon: Star,
          color: 'text-yellow-600',
        },
        {
          label: 'Mantenimiento',
          value: '$2.1M',
          change: '-5.1%',
          trend: 'down',
          icon: AlertTriangle,
          color: 'text-red-600',
        },
      ]);

      setPropertyPerformance([
        {
          id: '1',
          title: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          occupancyRate: 95,
          monthlyRevenue: 550000,
          totalRevenue: 6600000,
          averageRating: 4.8,
          maintenanceCosts: 220000,
          netProfit: 6380000,
        },
        {
          id: '2',
          title: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          occupancyRate: 100,
          monthlyRevenue: 350000,
          totalRevenue: 4200000,
          averageRating: 4.6,
          maintenanceCosts: 168000,
          netProfit: 4032000,
        },
        {
          id: '3',
          title: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          occupancyRate: 75,
          monthlyRevenue: 1200000,
          totalRevenue: 10800000,
          averageRating: 4.9,
          maintenanceCosts: 648000,
          netProfit: 10152000,
        },
      ]);

      setFinancialSummary({
        totalRevenue: 21600000,
        totalExpenses: 1036000,
        netProfit: 20564000,
        profitMargin: 95.2,
        yearOverYearGrowth: 15.3,
        averageOccupancyRate: 87,
      });

      setTenantAnalysis({
        totalTenants: 156,
        averageTenure: 24,
        retentionRate: 92,
        satisfactionScore: 4.7,
        topPerformers: ['Carlos Ramírez', 'Ana Martínez', 'Empresa Soluciones Ltda.'],
        atRiskTenants: ['Pedro Silva'],
      });

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

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) {
return 'text-green-600 bg-green-100';
}
    if (rate >= 75) {
return 'text-yellow-600 bg-yellow-100';
}
    return 'text-red-600 bg-red-100';
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
        subtitle="Analiza el rendimiento de tus propiedades"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen Financiero
              </CardTitle>
              <CardDescription>
                Desglose de ingresos y gastos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(financialSummary.totalRevenue)}
                    </div>
                    <div className="text-sm text-green-700">Ingresos Totales</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatPrice(financialSummary.totalExpenses)}
                    </div>
                    <div className="text-sm text-red-700">Gastos Totales</div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Utilidad Neta</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(financialSummary.netProfit)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Margen de Utilidad</p>
                      <p className="text-xl font-bold text-green-600">
                        {financialSummary.profitMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">Crecimiento Anual</p>
                    <p className="text-lg font-semibold text-green-600">
                      +{financialSummary.yearOverYearGrowth}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Ocupación Promedio</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {financialSummary.averageOccupancyRate}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tenant Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Análisis de Inquilinos
              </CardTitle>
              <CardDescription>
                Métricas de rendimiento y satisfacción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(tenantAnalysis.totalTenants)}
                    </div>
                    <div className="text-sm text-blue-700">Total Inquilinos</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {tenantAnalysis.averageTenure} meses
                    </div>
                    <div className="text-sm text-purple-700">Permanencia Promedio</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Retención</p>
                    <p className="text-xl font-bold text-green-600">
                      {tenantAnalysis.retentionRate}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Satisfacción Promedio</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-yellow-600">
                        {tenantAnalysis.satisfactionScore}
                      </p>
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Mejores Inquilinos</p>
                    <div className="space-y-1">
                      {tenantAnalysis.topPerformers.map((tenant, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-700">{tenant}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {tenantAnalysis.atRiskTenants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Inquilinos en Riesgo</p>
                      <div className="space-y-1">
                        {tenantAnalysis.atRiskTenants.map((tenant, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-gray-700">{tenant}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Property Performance */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Rendimiento por Propiedad
                </CardTitle>
                <CardDescription>
                  Análisis detallado del rendimiento de cada propiedad
                </CardDescription>
              </div>
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalles
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {propertyPerformance.map((property) => (
                <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {property.title}
                          </h3>
                          <p className="text-gray-600 text-sm">{property.address}</p>
                        </div>
                        <Badge className={getOccupancyColor(property.occupancyRate)}>
                          {property.occupancyRate}% ocupado
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Ingreso Mensual</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(property.monthlyRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Ingreso Total</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(property.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Calificación</p>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-gray-900">
                              {property.averageRating}
                            </span>
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Utilidad Neta</p>
                          <p className="font-semibold text-green-600">
                            {formatPrice(property.netProfit)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Ver Reporte
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
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


