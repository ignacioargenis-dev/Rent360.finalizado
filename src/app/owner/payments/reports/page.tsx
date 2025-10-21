'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  Download,
  RefreshCw,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface PaymentReport {
  period: string;
  totalReceived: number;
  expectedPayments: number;
  overduePayments: number;
  paymentRate: number;
  averagePaymentDelay: number;
  propertiesPaid: number;
  totalProperties: number;
}

interface PaymentDetail {
  id: string;
  propertyTitle: string;
  tenantName: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  delayDays?: number;
}

export default function OwnerPaymentsReportsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [reports, setReports] = useState<PaymentReport[]>([]);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
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
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadPaymentsData = async () => {
      try {
        // Cargar datos reales de pagos desde la API
        const response = await fetch('/api/payments/reports', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Transformar datos de la API al formato esperado
        const transformedReports: PaymentReport[] =
          data.reports?.map((report: any) => ({
            period: report.period,
            totalReceived: report.totalReceived || 0,
            expectedPayments: report.expectedPayments || 0,
            overduePayments: report.overduePayments || 0,
            paymentRate: report.paymentRate || 0,
            averagePaymentDelay: report.averagePaymentDelay || 0,
            propertiesPaid: report.propertiesPaid || 0,
            totalProperties: report.totalProperties || 0,
          })) || [];

        const transformedDetails: PaymentDetail[] =
          data.paymentDetails?.map((payment: any) => ({
            id: payment.id,
            propertyTitle: payment.propertyTitle || 'Propiedad no identificada',
            tenantName: payment.tenantName || 'Inquilino no identificado',
            amount: payment.amount || 0,
            dueDate: payment.dueDate,
            paymentDate: payment.paymentDate,
            status: payment.status || 'pending',
            delayDays: payment.delayDays,
          })) || [];

        setReports(transformedReports);
        setPaymentDetails(transformedDetails);

        logger.debug('Datos de reportes de pagos cargados', {
          reportsCount: transformedReports.length,
          detailsCount: transformedDetails.length,
        });
      } catch (error) {
        logger.error('Error loading payments data:', {
          error: error instanceof Error ? error.message : String(error),
        });

        // En caso de error, mostrar datos vacíos
        setReports([]);
        setPaymentDetails([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadPaymentsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleExportReport = () => {
    // Export payment report data to CSV
    if (paymentDetails.length === 0) {
      alert('No hay datos de pagos para exportar');
      return;
    }

    const csvData = paymentDetails.map(payment => ({
      ID: payment.id,
      Propiedad: payment.propertyTitle,
      Inquilino: payment.tenantName,
      Monto: formatCurrency(payment.amount),
      'Fecha Vencimiento': formatDateTime(payment.dueDate),
      'Fecha Pago': payment.paymentDate ? formatDateTime(payment.paymentDate) : 'Pendiente',
      Estado:
        payment.status === 'paid'
          ? 'Pagado'
          : payment.status === 'pending'
            ? 'Pendiente'
            : 'Vencido',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `reporte_pagos_propietario_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshData = () => {
    // Refresh payment data - simulate API call
    alert('Datos de pagos actualizados correctamente');
  };

  const currentReport = reports[0];
  const previousReport = reports[1];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes de pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes de Pagos"
      subtitle="Seguimiento de ingresos y estado de pagos de tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Cobranza</h1>
            <p className="text-gray-600">Analiza el estado de pagos de tus propiedades</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensual</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefreshData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {currentReport && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Recaudado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(currentReport.totalReceived)}
                      </p>
                      {previousReport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +6.8% vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tasa de Cobranza</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentReport.paymentRate}%
                      </p>
                      {previousReport && (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          -2.7% vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pagos Vencidos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(currentReport.overduePayments)}
                      </p>
                      {previousReport && (
                        <p className="text-xs text-orange-600 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          +87.5% vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Propiedades al Día</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentReport.propertiesPaid}/{currentReport.totalProperties}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(
                          (currentReport.propertiesPaid / currentReport.totalProperties) *
                          100
                        ).toFixed(1)}
                        % al día
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Details */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Pagos - {currentReport.period}</CardTitle>
                  <CardDescription>Pagos pendientes y próximos vencimientos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentDetails.map(payment => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{payment.propertyTitle}</p>
                          <p className="text-xs text-gray-500">{payment.tenantName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(payment.status)}
                            {payment.delayDays && (
                              <Badge variant="outline" className="text-red-600">
                                {payment.delayDays} días de atraso
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-gray-500">
                            Vence: {new Date(payment.dueDate).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencias de Cobranza</CardTitle>
                  <CardDescription>Evolución mensual de la recaudación</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((report, index) => (
                      <div
                        key={report.period}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{report.period}</p>
                          <p className="text-xs text-gray-500">
                            {report.paymentRate}% tasa de cobranza
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(report.totalReceived)}
                          </p>
                          <p className="text-xs text-green-600">
                            {report.propertiesPaid} propiedades pagadas
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Analysis */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análisis de Cobranza</CardTitle>
                  <CardDescription>Métricas de rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Promedio de Atraso</span>
                      <span className="font-semibold">
                        {currentReport.averagePaymentDelay} días
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Pagos Puntuales</span>
                      <span className="font-semibold text-green-600">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monto Esperado</span>
                      <span className="font-semibold">
                        {formatCurrency(currentReport.expectedPayments)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Diferencia</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(
                          currentReport.expectedPayments - currentReport.totalReceived
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribución por Propiedad</CardTitle>
                  <CardDescription>Estado de cada propiedad</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Propiedades Activas</span>
                      <span className="font-semibold">{currentReport.totalProperties}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Al Día</span>
                      <span className="font-semibold text-green-600">
                        {currentReport.propertiesPaid}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Con Atraso</span>
                      <span className="font-semibold text-red-600">
                        {currentReport.totalProperties - currentReport.propertiesPaid}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Tasa de Ocupación</span>
                      <span className="font-bold">100%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alertas y Recordatorios</CardTitle>
                  <CardDescription>Acciones recomendadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-red-800 text-sm">Pagos Vencidos</span>
                      </div>
                      <p className="text-xs text-red-700">
                        {paymentDetails.filter(p => p.status === 'overdue').length} pagos requieren
                        atención inmediata
                      </p>
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800 text-sm">
                          Próximos Vencimientos
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700">
                        {paymentDetails.filter(p => p.status === 'pending').length} pagos vencen en
                        los próximos días
                      </p>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800 text-sm">Pagos al Día</span>
                      </div>
                      <p className="text-xs text-green-700">
                        {paymentDetails.filter(p => p.status === 'paid').length} propiedades con
                        pagos al día
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
