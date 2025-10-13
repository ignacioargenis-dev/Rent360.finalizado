'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  CreditCard,
  Users,
} from 'lucide-react';
import { Payment } from '@/types';

interface PaymentReport {
  month: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  transactionCount: number;
}

interface PropertyPerformance {
  propertyId: string;
  propertyTitle: string;
  totalRevenue: number;
  occupancyRate: number;
  averagePaymentTime: number;
  tenantName: string;
}

export default function AdminPaymentReportsPage() {
  const [reportData, setReportData] = useState<PaymentReport[]>([]);

  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);

  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState('6months');

  const [selectedProperty, setSelectedProperty] = useState('all');

  useEffect(() => {
    fetchReportData();
  }, [timeRange, selectedProperty]);

  const fetchReportData = async () => {
    try {
      // Simular datos de reporte
      const mockReportData: PaymentReport[] = [
        {
          month: 'Enero 2024',
          totalAmount: 8500000,
          paidAmount: 7800000,
          pendingAmount: 500000,
          overdueAmount: 200000,
          transactionCount: 25,
        },
        {
          month: 'Febrero 2024',
          totalAmount: 8200000,
          paidAmount: 7900000,
          pendingAmount: 200000,
          overdueAmount: 100000,
          transactionCount: 24,
        },
        {
          month: 'Marzo 2024',
          totalAmount: 8800000,
          paidAmount: 8500000,
          pendingAmount: 200000,
          overdueAmount: 100000,
          transactionCount: 26,
        },
        {
          month: 'Abril 2024',
          totalAmount: 9100000,
          paidAmount: 8700000,
          pendingAmount: 300000,
          overdueAmount: 100000,
          transactionCount: 27,
        },
        {
          month: 'Mayo 2024',
          totalAmount: 8900000,
          paidAmount: 8600000,
          pendingAmount: 200000,
          overdueAmount: 100000,
          transactionCount: 26,
        },
        {
          month: 'Junio 2024',
          totalAmount: 9200000,
          paidAmount: 8800000,
          pendingAmount: 300000,
          overdueAmount: 100000,
          transactionCount: 28,
        },
      ];

      const mockPropertyPerformance: PropertyPerformance[] = [
        {
          propertyId: '1',
          propertyTitle: 'Departamento Centro',
          totalRevenue: 2100000,
          occupancyRate: 95,
          averagePaymentTime: 3,
          tenantName: 'Juan P�rez',
        },
        {
          propertyId: '2',
          propertyTitle: 'Casa Las Condes',
          totalRevenue: 2550000,
          occupancyRate: 100,
          averagePaymentTime: 2,
          tenantName: 'Mar�a Gonz�lez',
        },
        {
          propertyId: '3',
          propertyTitle: 'Oficina Providencia',
          totalRevenue: 1800000,
          occupancyRate: 85,
          averagePaymentTime: 5,
          tenantName: 'Carlos Rodr�guez',
        },
      ];

      setReportData(mockReportData);
      setPropertyPerformance(mockPropertyPerformance);
    } catch (error) {
      logger.error('Error fetching report data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    return reportData.reduce(
      (acc, month) => ({
        totalAmount: acc.totalAmount + month.totalAmount,
        paidAmount: acc.paidAmount + month.paidAmount,
        pendingAmount: acc.pendingAmount + month.pendingAmount,
        overdueAmount: acc.overdueAmount + month.overdueAmount,
        transactionCount: acc.transactionCount + month.transactionCount,
      }),
      {
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        transactionCount: 0,
      }
    );
  };

  const totals = calculateTotals();
  const collectionRate =
    totals.totalAmount > 0 ? (totals.paidAmount / totals.totalAmount) * 100 : 0;

  const exportReport = () => {
    const headers = [
      'Mes',
      'Monto Total',
      'Monto Pagado',
      'Monto Pendiente',
      'Monto Vencido',
      'Cantidad Transacciones',
      'Tasa de Cobro',
    ];
    const csvContent = [
      headers.join(','),
      ...reportData.map(month =>
        [
          month.month,
          month.totalAmount,
          month.paidAmount,
          month.pendingAmount,
          month.overdueAmount,
          month.transactionCount,
          `${((month.paidAmount / month.totalAmount) * 100).toFixed(1)}%`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'reporte_pagos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Cargando reportes...</p>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Reportes de Pagos" subtitle="Análisis y reportes financieros">
      <div className="space-y-6">
        {/* Controles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Configuraci�n de Reporte
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
                    <SelectItem value="1month">�ltimo mes</SelectItem>
                    <SelectItem value="3months">�ltimos 3 meses</SelectItem>
                    <SelectItem value="6months">�ltimos 6 meses</SelectItem>
                    <SelectItem value="1year">�ltimo a�o</SelectItem>
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
                    {propertyPerformance.map(property => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.propertyTitle}
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

        {/* Resumen General */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totals.totalAmount.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{reportData.length} meses</p>
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
                {collectionRate >= 95
                  ? 'Excelente'
                  : collectionRate >= 85
                    ? 'Bueno'
                    : 'Necesita mejora'}
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
                ${(totals.pendingAmount + totals.overdueAmount).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {(
                  ((totals.pendingAmount + totals.overdueAmount) / totals.totalAmount) *
                  100
                ).toFixed(1)}
                % del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.transactionCount}</div>
              <p className="text-xs text-muted-foreground">
                {(totals.transactionCount / reportData.length).toFixed(0)} promedio/mes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Reporte Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Reporte Mensual de Ingresos</CardTitle>
            <CardDescription>Desglose mensual de ingresos y estado de cobros</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Monto Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Pendiente</TableHead>
                  <TableHead className="text-right">Vencido</TableHead>
                  <TableHead className="text-right">Tasa de Cobro</TableHead>
                  <TableHead className="text-right">Transacciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((month, index) => {
                  const monthCollectionRate = (month.paidAmount / month.totalAmount) * 100;
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">
                        ${month.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ${month.paidAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        ${month.pendingAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ${month.overdueAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              monthCollectionRate >= 95
                                ? 'text-green-600'
                                : monthCollectionRate >= 85
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }
                          >
                            {monthCollectionRate.toFixed(1)}%
                          </span>
                          {monthCollectionRate >= 95 && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          {monthCollectionRate < 85 && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{month.transactionCount}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Rendimiento por Propiedad */}
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento por Propiedad</CardTitle>
            <CardDescription>An�lisis de rendimiento y ocupaci�n por propiedad</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead className="text-right">Ingresos Totales</TableHead>
                  <TableHead className="text-right">Tasa de Ocupaci�n</TableHead>
                  <TableHead className="text-right">Tiempo Promedio de Pago</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propertyPerformance.map(property => (
                  <TableRow key={property.propertyId}>
                    <TableCell className="font-medium">{property.propertyTitle}</TableCell>
                    <TableCell>{property.tenantName}</TableCell>
                    <TableCell className="text-right">
                      ${property.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{property.occupancyRate}%</span>
                        {property.occupancyRate >= 95 && (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        )}
                        {property.occupancyRate < 85 && (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{property.averagePaymentTime} d�as</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          property.occupancyRate >= 95
                            ? 'default'
                            : property.occupancyRate >= 85
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {property.occupancyRate >= 95
                          ? 'Excelente'
                          : property.occupancyRate >= 85
                            ? 'Bueno'
                            : 'Mejorable'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
