'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Home,
  Wrench,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { logger } from '@/lib/logger';

interface PaymentReport {
  id: string;
  date: string;
  type: 'rent' | 'maintenance' | 'deposit' | 'other';
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  propertyAddress: string;
}

interface MaintenanceReport {
  id: string;
  date: string;
  serviceType: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  rating?: number;
  description: string;
}

interface ReportSummary {
  totalPayments: number;
  totalMaintenance: number;
  totalSpent: number;
  averageMonthly: number;
  pendingPayments: number;
  upcomingMaintenance: number;
  monthlyTrend: number;
}

export default function TenantReportsPage() {
  const { user } = useUserState();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportType, setReportType] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ReportSummary>({
    totalPayments: 0,
    totalMaintenance: 0,
    totalSpent: 0,
    averageMonthly: 0,
    pendingPayments: 0,
    upcomingMaintenance: 0,
    monthlyTrend: 0,
  });
  const [payments, setPayments] = useState<PaymentReport[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceReport[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock data for reports
  const mockPayments: PaymentReport[] = [
    {
      id: '1',
      date: '2024-12-01',
      type: 'rent',
      amount: 450000,
      currency: 'CLP',
      status: 'paid',
      description: 'Alquiler mensual diciembre 2024',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '2',
      date: '2024-11-01',
      type: 'rent',
      amount: 450000,
      currency: 'CLP',
      status: 'paid',
      description: 'Alquiler mensual noviembre 2024',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '3',
      date: '2024-12-15',
      type: 'maintenance',
      amount: 25000,
      currency: 'CLP',
      status: 'paid',
      description: 'Reparación de grifería baño',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
    {
      id: '4',
      date: '2024-12-20',
      type: 'deposit',
      amount: 900000,
      currency: 'CLP',
      status: 'pending',
      description: 'Depósito de garantía',
      propertyAddress: 'Av. Providencia 123, Santiago',
    },
  ];

  const mockMaintenance: MaintenanceReport[] = [
    {
      id: '1',
      date: '2024-12-15',
      serviceType: 'Fontanería',
      provider: 'Servicios Eléctricos Ltda',
      amount: 25000,
      currency: 'CLP',
      status: 'completed',
      rating: 5,
      description: 'Reparación de grifería en baño principal',
    },
    {
      id: '2',
      date: '2024-12-20',
      serviceType: 'Electricidad',
      provider: 'Fontanería Express',
      amount: 35000,
      currency: 'CLP',
      status: 'scheduled',
      description: 'Revisión del sistema eléctrico',
    },
    {
      id: '3',
      date: '2024-11-10',
      serviceType: 'Limpieza',
      provider: 'Limpieza Express',
      amount: 45000,
      currency: 'CLP',
      status: 'completed',
      rating: 4,
      description: 'Limpieza profunda apartamento',
    },
  ];

  useEffect(() => {
    loadReports();
  }, [dateRange, reportType]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter data based on date range and type
      let filteredPayments = mockPayments.filter(p => {
        if (!dateRange.startDate || !dateRange.endDate) {
          return true;
        }
        return p.date >= dateRange.startDate && p.date <= dateRange.endDate;
      });

      let filteredMaintenance = mockMaintenance.filter(m => {
        if (!dateRange.startDate || !dateRange.endDate) {
          return true;
        }
        return m.date >= dateRange.startDate && m.date <= dateRange.endDate;
      });

      if (reportType === 'payments') {
        filteredMaintenance = [];
      } else if (reportType === 'maintenance') {
        filteredPayments = [];
      }

      setPayments(filteredPayments);
      setMaintenance(filteredMaintenance);

      // Calculate summary
      const totalPayments = filteredPayments.length;
      const totalMaintenance = filteredMaintenance.length;
      const totalSpent =
        filteredPayments.reduce((sum, p) => sum + p.amount, 0) +
        filteredMaintenance.reduce((sum, m) => sum + m.amount, 0);
      const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length;
      const upcomingMaintenance = filteredMaintenance.filter(m => m.status === 'scheduled').length;
      const averageMonthly = totalSpent / 3; // Based on 3 months
      const monthlyTrend = 8.5; // Mock trend percentage

      setSummary({
        totalPayments,
        totalMaintenance,
        totalSpent,
        averageMonthly,
        pendingPayments,
        upcomingMaintenance,
        monthlyTrend,
      });
    } catch (error) {
      logger.error('Error al cargar reportes', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = (
    type: 'payments' | 'maintenance' | 'all',
    format: 'csv' | 'pdf' | 'detailed' = 'csv'
  ) => {
    if (format === 'pdf') {
      // Simular generación de PDF
      const pdfContent = generatePDFReport(type);
      const blob = new Blob([pdfContent], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMessage('PDF generado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    if (format === 'detailed') {
      // Exportar reporte detallado con análisis
      const detailedReport = generateDetailedReport(type);
      const blob = new Blob([detailedReport], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-detallado-${type}-${new Date().toISOString().split('T')[0]}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccessMessage('Reporte detallado generado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    // Exportación CSV original
    let csvContent = '';

    if (type === 'payments' || type === 'all') {
      csvContent += 'Pagos\n';
      csvContent += 'Fecha,Tipo,Monto,Moneda,Estado,Descripción,Dirección\n';
      payments.forEach(payment => {
        csvContent += `${payment.date},${payment.type},${payment.amount},${payment.currency},${payment.status},${payment.description},${payment.propertyAddress}\n`;
      });
      csvContent += '\n';
    }

    if (type === 'maintenance' || type === 'all') {
      csvContent += 'Mantenimiento\n';
      csvContent += 'Fecha,Tipo Servicio,Proveedor,Monto,Moneda,Estado,Calificación,Descripción\n';
      maintenance.forEach(item => {
        csvContent += `${item.date},${item.serviceType},${item.provider},${item.amount},${item.currency},${item.status},${item.rating || ''},${item.description}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `reportes-inquilino-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMessage('CSV exportado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);

    logger.info('Reportes exportados', {
      type,
      format,
      totalRecords: payments.length + maintenance.length,
    });
  };

  const generatePDFReport = (type: string): string => {
    // Simular contenido de PDF
    return `REPORTE ${type.toUpperCase()} - ${new Date().toLocaleDateString('es-CL')}

RESUMEN EJECUTIVO
=================

Este es un reporte simulado en formato PDF.
En una implementación real, se generaría un PDF completo
con gráficos, tablas formateadas y análisis detallado.

DATOS INCLUIDOS:
- ${type === 'payments' ? payments.length : maintenance.length} registros
- Período: Últimos 3 meses
- Generado: ${new Date().toLocaleString('es-CL')}

Para una implementación completa, se recomienda usar bibliotecas como:
- jsPDF para generación de PDF
- Chart.js para gráficos
- html2canvas para capturas de pantalla

---
Fin del reporte simulado`;
  };

  const generateDetailedReport = (type: string): string => {
    const report = `ANÁLISIS DETALLADO - ${type.toUpperCase()}
Generado: ${new Date().toLocaleString('es-CL')}

${'='.repeat(50)}

ESTADÍSTICAS GENERALES
${'-'.repeat(30)}

${
  type === 'payments'
    ? `
Total de pagos: ${payments.length}
Pagos completados: ${payments.filter(p => p.status === 'paid').length}
Pagos pendientes: ${payments.filter(p => p.status === 'pending').length}
Pagos vencidos: ${payments.filter(p => p.status === 'overdue').length}
Monto total: ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
Promedio mensual: ${formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0) / 3)}
`
    : `
Solicitudes de mantenimiento: ${maintenance.length}
Completadas: ${maintenance.filter(m => m.status === 'completed').length}
En progreso: ${maintenance.filter(m => m.status === 'in_progress').length}
Programadas: ${maintenance.filter(m => m.status === 'scheduled').length}
Monto total invertido: ${formatCurrency(maintenance.reduce((sum, m) => sum + m.amount, 0))}
Calificación promedio: ${maintenance.length > 0 ? (maintenance.reduce((sum, m) => sum + (m.rating || 0), 0) / maintenance.length).toFixed(1) : 'N/A'} ⭐
`
}

ANÁLISIS DE TENDENCIAS
${'-'.repeat(30)}

${getMonthlySpending()
  .map(month => `${month.month}: ${formatCurrency(month.amount)}`)
  .join('\n')}

RECOMENDACIONES
${'-'.repeat(30)}

${
  type === 'payments'
    ? `• Mantenga un registro regular de pagos para evitar cargos por mora
• Considere configurar pagos automáticos para mayor comodidad
• Revise periódicamente los recibos de pago`
    : `• Priorice el mantenimiento preventivo para reducir costos futuros
• Solicite cotizaciones de múltiples proveedores
• Mantenga registros detallados de todos los trabajos realizados`
}

---
Fin del análisis detallado`;
    return report;
  };

  const getStatusBadge = (status: string, type: 'payment' | 'maintenance') => {
    if (type === 'payment') {
      switch (status) {
        case 'paid':
          return <Badge className="bg-green-500">Pagado</Badge>;
        case 'pending':
          return <Badge variant="secondary">Pendiente</Badge>;
        case 'overdue':
          return <Badge variant="destructive">Vencido</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'completed':
          return <Badge className="bg-green-500">Completado</Badge>;
        case 'in_progress':
          return <Badge variant="outline">En Progreso</Badge>;
        case 'scheduled':
          return <Badge variant="secondary">Programado</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'rent':
        return 'Alquiler';
      case 'maintenance':
        return 'Mantenimiento';
      case 'deposit':
        return 'Depósito';
      case 'other':
        return 'Otro';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getMonthlySpending = () => {
    const monthlyData = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' });
      const monthPayments = payments
        .filter(
          p =>
            new Date(p.date).getMonth() === date.getMonth() &&
            new Date(p.date).getFullYear() === date.getFullYear()
        )
        .reduce((sum, p) => sum + p.amount, 0);
      monthlyData.push({ month: monthName, amount: monthPayments });
    }
    return monthlyData;
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
            <p className="text-gray-600">Historial completo de pagos y mantenimiento</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadReports} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              onClick={() => handleExportReport('all')}
              disabled={payments.length === 0 && maintenance.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Todo
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="reportType">Tipo de Reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="payments">Solo Pagos</SelectItem>
                    <SelectItem value="maintenance">Solo Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Gastado</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.totalSpent)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pagos Realizados</p>
                      <p className="text-2xl font-bold text-blue-600">{summary.totalPayments}</p>
                    </div>
                    <FileText className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Servicios de Mantenimiento
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.totalMaintenance}
                      </p>
                    </div>
                    <Wrench className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promedio Mensual</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatCurrency(summary.averageMonthly)}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Tendencias Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencia de Gastos Mensuales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMonthlySpending().map((item, index) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium">{item.month}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min((item.amount / Math.max(...getMonthlySpending().map(d => d.amount))) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Estado de Pagos y Mantenimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estado de Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pagos Completados</span>
                      <span className="font-semibold text-green-600">
                        {payments.filter(p => p.status === 'paid').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pagos Pendientes</span>
                      <span className="font-semibold text-yellow-600">
                        {summary.pendingPayments}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Pagos Vencidos</span>
                      <span className="font-semibold text-red-600">
                        {payments.filter(p => p.status === 'overdue').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mantenimiento Programado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Servicios Completados</span>
                      <span className="font-semibold text-green-600">
                        {maintenance.filter(m => m.status === 'completed').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Servicios Programados</span>
                      <span className="font-semibold text-blue-600">
                        {summary.upcomingMaintenance}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">En Progreso</span>
                      <span className="font-semibold text-orange-600">
                        {maintenance.filter(m => m.status === 'in_progress').length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Gastos Mensuales */}
            <Card>
              <CardHeader>
                <CardTitle>Gastos Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getMonthlySpending().map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${(month.amount / Math.max(...getMonthlySpending().map(m => m.amount))) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-semibold w-24 text-right">
                          {formatCurrency(month.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            {/* Acciones de Pagos */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('payments', 'csv')}
                    disabled={payments.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('payments', 'pdf')}
                    disabled={payments.length === 0}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('payments', 'detailed')}
                    disabled={payments.length === 0}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Análisis Detallado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Historial de Pagos</CardTitle>
                  <Button
                    onClick={() => handleExportReport('payments')}
                    disabled={payments.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando pagos...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay pagos registrados en el período seleccionado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Propiedad</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.date).toLocaleDateString('es-CL')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getPaymentTypeLabel(payment.type)}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={payment.description}>
                              {payment.description}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status, 'payment')}</TableCell>
                            <TableCell
                              className="max-w-xs truncate"
                              title={payment.propertyAddress}
                            >
                              {payment.propertyAddress}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            {/* Acciones de Mantenimiento */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('maintenance', 'csv')}
                    disabled={maintenance.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('maintenance', 'pdf')}
                    disabled={maintenance.length === 0}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleExportReport('maintenance', 'detailed')}
                    disabled={maintenance.length === 0}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Análisis Detallado
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Servicios de Mantenimiento</CardTitle>
                  <Button
                    onClick={() => handleExportReport('maintenance')}
                    disabled={maintenance.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando mantenimiento...
                  </div>
                ) : maintenance.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No hay servicios de mantenimiento registrados en el período seleccionado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Calificación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenance.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>{new Date(item.date).toLocaleDateString('es-CL')}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.serviceType}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{item.provider}</TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(item.amount)}
                            </TableCell>
                            <TableCell>{getStatusBadge(item.status, 'maintenance')}</TableCell>
                            <TableCell>
                              {item.rating ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-sm font-medium">{item.rating}</span>
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <span
                                        key={star}
                                        className={`text-sm ${
                                          star <= item.rating! ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">No calificado</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
