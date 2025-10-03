'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
        // Mock payment reports data
        const mockReports: PaymentReport[] = [
          {
            period: 'Junio 2024',
            totalReceived: 4250000,
            expectedPayments: 4500000,
            overduePayments: 150000,
            paymentRate: 94.4,
            averagePaymentDelay: 1.2,
            propertiesPaid: 8,
            totalProperties: 9,
          },
          {
            period: 'Mayo 2024',
            totalReceived: 3980000,
            expectedPayments: 4100000,
            overduePayments: 80000,
            paymentRate: 97.1,
            averagePaymentDelay: 0.8,
            propertiesPaid: 7,
            totalProperties: 8,
          },
          {
            period: 'Abril 2024',
            totalReceived: 4120000,
            expectedPayments: 4200000,
            overduePayments: 120000,
            paymentRate: 95.2,
            averagePaymentDelay: 1.5,
            propertiesPaid: 9,
            totalProperties: 10,
          },
        ];

        const mockDetails: PaymentDetail[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Providencia',
            tenantName: 'Carlos Ramírez',
            amount: 450000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            status: 'paid',
          },
          {
            id: '2',
            propertyTitle: 'Casa Familiar Las Condes',
            tenantName: 'Ana López',
            amount: 850000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            status: 'overdue',
            delayDays: 3,
          },
          {
            id: '3',
            propertyTitle: 'Oficina Corporativa Centro',
            tenantName: 'Tech Solutions SpA',
            amount: 1200000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
            status: 'pending',
          },
        ];

        setReports(mockReports);
        setPaymentDetails(mockDetails);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading payments data:', {
          error: error instanceof Error ? error.message : String(error),
        });
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
    console.log('Export payment report');
  };

  const handleRefreshData = () => {
    console.log('Refresh payment data');
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
