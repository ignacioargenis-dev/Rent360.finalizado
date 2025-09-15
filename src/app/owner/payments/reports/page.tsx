'use client';

import { logger } from '@/lib/logger-edge';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, 
  TrendingDown, 
  DollarSign, Building, Calendar, 
  Users,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  CreditCard } from 'lucide-react';
interface PropertyRevenue {
  propertyId: string;
  propertyName: string;
  totalRevenue: number;
  paidAmount: number;
  pendingAmount: number;
  occupancyRate: number;
  tenantName: string;
  monthlyRent: number;
}

interface MonthlyRevenue {
  month: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  growth: number;
  transactionCount: number;
}

interface PaymentTrend {
  period: string;
  onTime: number;
  late: number;
  overdue: number;
  total: number;
}

export default function OwnerPaymentReportsPage() {
  const [revenueData, setRevenueData] = useState<PropertyRevenue[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [paymentTrends, setPaymentTrends] = useState<PaymentTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6months');
  const [selectedProperty, setSelectedProperty] = useState('all');

  useEffect(() => {
    fetchReportData();
  }, [timeRange, selectedProperty]);

  const fetchReportData = async () => {
    try {
      // Simular datos de reportes para propietario
      const mockRevenueData: PropertyRevenue[] = [
        {
          propertyId: '1',
          propertyName: 'Departamento Centro',
          totalRevenue: 4200000,
          paidAmount: 3850000,
          pendingAmount: 350000,
          occupancyRate: 95,
          tenantName: 'Juan Pérez',
          monthlyRent: 350000,
        },
        {
          propertyId: '2',
          propertyName: 'Casa Las Condes',
          totalRevenue: 5100000,
          paidAmount: 5100000,
          pendingAmount: 0,
          occupancyRate: 100,
          tenantName: 'María González',
          monthlyRent: 850000,
        },
        {
          propertyId: '3',
          propertyName: 'Oficina Providencia',
          totalRevenue: 2700000,
          paidAmount: 2250000,
          pendingAmount: 450000,
          occupancyRate: 85,
          tenantName: 'Carlos Rodríguez',
          monthlyRent: 450000,
        },
      ];

      const mockMonthlyData: MonthlyRevenue[] = [
        {
          month: 'Enero 2024',
          totalRevenue: 8500000,
          paidRevenue: 8000000,
          pendingRevenue: 500000,
          growth: 5.2,
          transactionCount: 3,
        },
        {
          month: 'Febrero 2024',
          totalRevenue: 8500000,
          paidRevenue: 8200000,
          pendingRevenue: 300000,
          growth: 2.5,
          transactionCount: 3,
        },
        {
          month: 'Marzo 2024',
          totalRevenue: 8500000,
          paidRevenue: 8350000,
          pendingRevenue: 150000,
          growth: 1.8,
          transactionCount: 3,
        },
        {
          month: 'Abril 2024',
          totalRevenue: 8500000,
          paidRevenue: 8200000,
          pendingRevenue: 300000,
          growth: -1.8,
          transactionCount: 3,
        },
        {
          month: 'Mayo 2024',
          totalRevenue: 8500000,
          paidRevenue: 8300000,
          pendingRevenue: 200000,
          growth: 1.2,
          transactionCount: 3,
        },
        {
          month: 'Junio 2024',
          totalRevenue: 8500000,
          paidRevenue: 8150000,
          pendingRevenue: 350000,
          growth: -1.8,
          transactionCount: 3,
        },
      ];

      const mockPaymentTrends: PaymentTrend[] = [
        {
          period: 'Enero',
          onTime: 2,
          late: 1,
          overdue: 0,
          total: 3,
        },
        {
          period: 'Febrero',
          onTime: 3,
          late: 0,
          overdue: 0,
          total: 3,
        },
        {
          period: 'Marzo',
          onTime: 2,
          late: 1,
          overdue: 0,
          total: 3,
        },
        {
          period: 'Abril',
          onTime: 2,
          late: 0,
          overdue: 1,
          total: 3,
        },
        {
          period: 'Mayo',
          onTime: 3,
          late: 0,
          overdue: 0,
          total: 3,
        },
        {
          period: 'Junio',
          onTime: 2,
          late: 1,
          overdue: 0,
          total: 3,
        },
      ];

      setRevenueData(mockRevenueData);
      setMonthlyData(mockMonthlyData);
      setPaymentTrends(mockPaymentTrends);
    } catch (error) {
      logger.error('Error fetching report data:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return revenueData.reduce((acc, property) => ({
      totalRevenue: acc.totalRevenue + property.totalRevenue,
      paidAmount: acc.paidAmount + property.paidAmount,
      pendingAmount: acc.pendingAmount + property.pendingAmount,
      averageOccupancy: acc.averageOccupancy + property.occupancyRate,
    }), {
      totalRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      averageOccupancy: 0,
    });
  };

  const totals = calculateTotals();
  const collectionRate = totals.totalRevenue > 0 ? (totals.paidAmount / totals.totalRevenue) * 100 : 0;
  const averageOccupancy = revenueData.length > 0 ? totals.averageOccupancy / revenueData.length : 0;

  const exportReport = () => {
    const headers = ['Propiedad', 'Inquilino', 'Ingreso Total', 'Pagado', 'Pendiente', 'Tasa de Ocupación', 'Arriendo Mensual'];
    const csvContent = [
      headers.join(','),
      ...revenueData.map(property => [
        property.propertyName,
        property.tenantName,
        property.totalRevenue,
        property.paidAmount,
        property.pendingAmount,
        `${property.occupancyRate}%`,
        property.monthlyRent,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_pagos_propietario.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Reportes de Pagos" subtitle="Análisis de ingresos y rendimiento de tus propiedades">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout title="Reportes de Pagos" subtitle="Análisis de ingresos y rendimiento de tus propiedades">
      <div className="space-y-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Configuración de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rango de Tiempo</label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">Último mes</SelectItem>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                    <SelectItem value="1year">Último año</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Propiedad</label>
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las propiedades</SelectItem>
                    {revenueData.map(property => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button onClick={fetchReportData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={exportReport}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {revenueData.length} propiedades
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {collectionRate >= 95 ? 'Excelente' : collectionRate >= 85 ? 'Bueno' : 'Mejorable'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                ${totals.pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {((totals.pendingAmount / totals.totalRevenue) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageOccupancy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Promedio de propiedades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rendimiento por Propiedad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Rendimiento por Propiedad
            </CardTitle>
            <CardDescription>
              Análisis detallado del rendimiento de cada propiedad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead className="text-right">Ingreso Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead className="text-right">Tasa Ocupación</TableHead>
                  <TableHead className="text-right">Arriendo Mensual</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((property) => {
                  const collectionRate = property.totalRevenue > 0 ? (property.paidAmount / property.totalRevenue) * 100 : 0;
                  return (
                    <TableRow key={property.propertyId}>
                      <TableCell className="font-medium">{property.propertyName}</TableCell>
                      <TableCell>{property.tenantName}</TableCell>
                      <TableCell className="text-right">${property.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">${property.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600">${property.pendingAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span>{property.occupancyRate}%</span>
                          {property.occupancyRate >= 95 && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {property.occupancyRate < 85 && <TrendingDown className="w-4 h-4 text-red-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${property.monthlyRent.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={collectionRate >= 95 ? 'default' : collectionRate >= 85 ? 'secondary' : 'destructive'}>
                          {collectionRate >= 95 ? 'Excelente' : collectionRate >= 85 ? 'Bueno' : 'Mejorable'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tendencias de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tendencias de Pagos
            </CardTitle>
            <CardDescription>
              Análisis de puntualidad en los pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">A Tiempo</TableHead>
                  <TableHead className="text-right">Tardíos</TableHead>
                  <TableHead className="text-right">Vencidos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Tasa Puntualidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentTrends.map((trend, index) => {
                  const onTimeRate = trend.total > 0 ? (trend.onTime / trend.total) * 100 : 0;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{trend.period}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-green-600">{trend.onTime}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-yellow-600">{trend.late}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-red-600">{trend.overdue}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">{trend.total}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={onTimeRate >= 80 ? 'text-green-600' : onTimeRate >= 60 ? 'text-yellow-600' : 'text-red-600'}>
                            {onTimeRate.toFixed(1)}%
                          </span>
                          {onTimeRate >= 80 && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {onTimeRate < 60 && <TrendingDown className="w-4 h-4 text-red-600" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Evolución Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Ingresos</CardTitle>
            <CardDescription>
              Tendencias mensuales de ingresos y cobros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Ingreso Total</TableHead>
                  <TableHead className="text-right">Cobrado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead className="text-right">Tasa de Cobro</TableHead>
                  <TableHead className="text-right">Crecimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.map((month, index) => {
                  const collectionRate = (month.paidRevenue / month.totalRevenue) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">${month.totalRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600">${month.paidRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-orange-600">${month.pendingRevenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className={collectionRate >= 95 ? 'text-green-600' : collectionRate >= 85 ? 'text-yellow-600' : 'text-red-600'}>
                            {collectionRate.toFixed(1)}%
                          </span>
                          {collectionRate >= 95 && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {collectionRate < 85 && <TrendingDown className="w-4 h-4 text-red-600" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {month.growth > 0 ? (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-green-600">+{month.growth}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-red-600">{month.growth}%</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
