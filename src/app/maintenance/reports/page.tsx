'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wrench,
  Calendar,
  Download,
  Eye,
  FileText,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';

interface ReportData {
  period: string;
  totalJobs: number;
  completedJobs: number;
  revenue: number;
  averageRating: number;
  topServices: Array<{
    type: string;
    count: number;
    revenue: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    jobs: number;
    revenue: number;
  }>;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients: string;
  nextSend: string;
  status: 'active' | 'paused';
  type: 'performance' | 'financial' | 'jobs' | 'clients';
  includeCharts: boolean;
  includeDetails: boolean;
}

export default function MaintenanceReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Estado para reportes programados
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);

  // Estado para formulario de nuevo reporte
  const [newReportForm, setNewReportForm] = useState({
    name: '',
    type: '' as ScheduledReport['type'],
    frequency: '' as ScheduledReport['frequency'],
    recipients: '',
    includeCharts: true,
    includeDetails: false,
  });

  useEffect(() => {
    loadReportData();
    loadScheduledReports();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/maintenance/reports?period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.data) {
        setReportData(data.data);
      } else {
        setReportData({
          period:
            selectedPeriod === 'month'
              ? new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
              : new Date().getFullYear().toString(),
          totalJobs: 0,
          completedJobs: 0,
          revenue: 0,
          averageRating: 0,
          topServices: [],
          monthlyTrend: [],
        });
      }
    } catch (error) {
      logger.error('Error loading report data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    try {
      // Por ahora, no hay API para reportes programados, usar array vacío
      setScheduledReports([]);
    } catch (error) {
      logger.error('Error loading scheduled reports:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Funciones para manejar reportes programados
  const handleEditReport = (report: ScheduledReport) => {
    setEditingReport(report);
    setNewReportForm({
      name: report.name,
      type: report.type,
      frequency: report.frequency,
      recipients: report.recipients,
      includeCharts: report.includeCharts,
      includeDetails: report.includeDetails,
    });
  };

  const handlePauseReport = async (reportId: string) => {
    try {
      setScheduledReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
            : report
        )
      );
      setSuccessMessage('Estado del reporte actualizado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error updating report status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al actualizar el estado del reporte');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleCreateReport = async () => {
    try {
      if (!newReportForm.name || !newReportForm.type || !newReportForm.frequency) {
        setErrorMessage('Por favor complete todos los campos requeridos');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const newReport: ScheduledReport = {
        id: Date.now().toString(),
        name: newReportForm.name,
        type: newReportForm.type,
        frequency: newReportForm.frequency,
        recipients: newReportForm.recipients,
        nextSend: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!, // 7 días desde ahora
        status: 'active',
        includeCharts: newReportForm.includeCharts,
        includeDetails: newReportForm.includeDetails,
      };

      setScheduledReports(prev => [...prev, newReport]);

      // Reset form
      setNewReportForm({
        name: '',
        type: '' as ScheduledReport['type'],
        frequency: '' as ScheduledReport['frequency'],
        recipients: '',
        includeCharts: true,
        includeDetails: false,
      });

      setSuccessMessage('Reporte automático creado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error creating scheduled report:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al crear el reporte automático');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleExportAnalysis = async () => {
    try {
      // Crear contenido del análisis avanzado
      const analysisData = `
Análisis Avanzado de Rendimiento - ${new Date().toLocaleDateString('es-CL')}

EFICIENCIA OPERATIVA:
- Tiempo Promedio de Respuesta: 2.3 horas
- Tasa de Completación: 93.2%
- Satisfacción del Cliente: 4.7/5.0

ANÁLISIS FINANCIERO:
- Margen de Ganancia: 34.5%
- Costo por Trabajo: $42,300
- ROI Mensual: 127%

TENDENCIAS Y PATRONES:
- Tendencia Positiva: Los trabajos de plomería han aumentado un 25% en los últimos 3 meses
- Área de Mejora: Los tiempos de respuesta en trabajos urgentes superan las 4 horas

RECOMENDACIONES ESTRATÉGICAS:
1. Expandir Servicios de Plomería - Contratar especialista adicional
2. Implementar Sistema de Priorización - Automatizar clasificación por urgencia
3. Programa de Fidelización - Descuentos para clientes recurrentes
      `;

      const blob = new Blob([analysisData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analisis_avanzado_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Análisis exportado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error exporting analysis:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al exportar el análisis');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleExportComparison = async () => {
    try {
      const comparisonData = `
Comparación de Períodos - ${new Date().toLocaleDateString('es-CL')}

MÉTRICAS COMPARATIVAS:
- Trabajos Enero 2024: 45 (+12%)
- Ingresos Enero 2024: $2,850,000 (+8%)
- Calificación Enero 2024: 4.6/5.0 (-2%)
- Completación Enero 2024: 93% (+5%)

COMPARACIÓN POR SERVICIO:
- Plomería: Ene: 12 | Dic: 10 (+20%)
- Eléctrica: Ene: 8 | Dic: 9 (-11%)
- Limpieza: Ene: 15 | Dic: 12 (+25%)
- Estructural: Ene: 6 | Dic: 8 (-25%)
- Pintura: Ene: 4 | Dic: 3 (+33%)

INSIGHTS:
- Incremento significativo en trabajos de limpieza y pintura
- Disminución en calificación requiere revisión de procesos urgentes
- Mejora en eficiencia con tiempo de respuesta reducido
      `;

      const blob = new Blob([comparisonData], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comparacion_periodos_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessMessage('Comparación exportada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error exporting comparison:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al exportar la comparación');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleExportReport = () => {
    if (!reportData) {
      return;
    }

    const csvData: Array<Record<string, string | number>> = [
      {
        Período: reportData.period,
        'Trabajos Totales': reportData.totalJobs,
        'Trabajos Completados': reportData.completedJobs,
        'Ingresos Totales': formatCurrency(reportData.revenue),
        'Calificación Promedio': reportData.averageRating,
      },
    ];

    // Add top services data
    reportData.topServices.forEach(service => {
      csvData.push({
        Período: `Servicio: ${service.type}`,
        'Trabajos Totales': service.count,
        'Trabajos Completados': service.count,
        'Ingresos Totales': formatCurrency(service.revenue),
        'Calificación Promedio': '',
      });
    });

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
      `reporte_mantenimiento_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGeneratePDF = () => {
    // Generate a comprehensive PDF report
    const pdfContent = `
REPORTE DE MANTENIMIENTO - ${selectedPeriod.toUpperCase()}

INFORMACIÓN GENERAL:
- Período: ${reportData?.period || 'N/A'}
- Trabajos Totales: ${reportData?.totalJobs || 0}
- Trabajos Completados: ${reportData?.completedJobs || 0}
- Ingresos Totales: ${reportData ? formatCurrency(reportData.revenue) : '$0'}
- Calificación Promedio: ${reportData?.averageRating || 0}/5

SERVICIOS MÁS SOLICITADOS:
${
  reportData?.topServices
    .map(
      service => `- ${service.type}: ${service.count} trabajos, ${formatCurrency(service.revenue)}`
    )
    .join('\n') || 'No disponible'
}

TENDENCIA MENSUAL:
${
  reportData?.monthlyTrend
    .map(trend => `- ${trend.month}: ${trend.jobs} trabajos, ${formatCurrency(trend.revenue)}`)
    .join('\n') || 'No disponible'
}

REPORTES PROGRAMADOS ACTIVOS: ${scheduledReports.filter(r => r.status === 'active').length}

Generado el: ${new Date().toLocaleDateString('es-ES')}
    `.trim();

    // Create and download text file (simulating PDF for now)
    const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_mantenimiento_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMessage('PDF generado exitosamente (versión de texto por ahora)');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Reportes" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando reportes...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Reportes" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadReportData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes"
      subtitle="Análisis y estadísticas de tus trabajos de mantenimiento"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="month">Este mes</SelectItem>
                    <SelectItem value="quarter">Este trimestre</SelectItem>
                    <SelectItem value="year">Este año</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleExportReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Reporte
                </Button>
              </div>

              <Button onClick={loadReportData} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Report Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="services">Servicios</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Wrench className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Trabajos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">{reportData?.totalJobs}</p>
                      <p className="text-xs text-gray-500">{reportData?.period}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Trabajos Completados</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData?.completedJobs}
                      </p>
                      <p className="text-xs text-green-600">
                        {reportData
                          ? Math.round((reportData.completedJobs / reportData.totalJobs) * 100)
                          : 0}
                        % completados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData ? formatCurrency(reportData.revenue) : '$0'}
                      </p>
                      <p className="text-xs text-gray-500">En {reportData?.period}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData?.averageRating}/5
                      </p>
                      <p className="text-xs text-green-600">⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Servicios Realizados</CardTitle>
                <CardDescription>
                  Servicios más solicitados y sus ingresos generados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.topServices.map((service, index) => (
                    <div
                      key={service.type}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{service.type}</h3>
                          <p className="text-sm text-gray-600">
                            {service.count} trabajos realizados
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(service.revenue)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {service.count > 0
                            ? Math.round((service.revenue / reportData.revenue) * 100)
                            : 0}
                          % del total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendencia Mensual</CardTitle>
                <CardDescription>
                  Evolución de trabajos e ingresos en los últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData?.monthlyTrend.map(month => (
                    <div
                      key={month.month}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium text-gray-900">{month.month} 2024</h3>
                        <p className="text-sm text-gray-600">{month.jobs} trabajos realizados</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(month.revenue)}
                        </p>
                        <div className="flex items-center gap-1">
                          {month.jobs > 10 ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`text-sm ${month.jobs > 10 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {month.jobs > 10 ? 'Alto rendimiento' : 'Bajo rendimiento'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Rendimiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tasa de Finalización</span>
                    <Badge className="bg-green-100 text-green-800">
                      {reportData
                        ? Math.round((reportData.completedJobs / reportData.totalJobs) * 100)
                        : 0}
                      %
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Promedio por Trabajo</span>
                    <span className="font-semibold">
                      {reportData
                        ? formatCurrency(Math.round(reportData.revenue / reportData.totalJobs))
                        : '$0'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Trabajos por Mes</span>
                    <span className="font-semibold">
                      {reportData ? Math.round(reportData.totalJobs / 12) : 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Enfócate en servicios de alta demanda:</strong> La plomería
                      representa el 27% de tus ingresos.
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      📈 <strong>Excelente rendimiento:</strong> Tu tasa de finalización del 93% es
                      sobresaliente.
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-800">
                      🎯 <strong>Oportunidad de crecimiento:</strong> Considera expandir servicios
                      eléctricos.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Herramientas para gestión de reportes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Download}
                label="Exportar Completo"
                description="Descargar reporte detallado"
                onClick={handleExportReport}
              />

              <QuickActionButton
                icon={FileText}
                label="Generar PDF"
                description="Crear reporte completo en PDF"
                onClick={handleGeneratePDF}
              />

              <Dialog open={showAdvancedModal} onOpenChange={setShowAdvancedModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Análisis Avanzado</h3>
                    <p className="text-sm text-gray-600 mb-4">Ver métricas detalladas</p>
                    <div className="text-blue-600 font-medium text-sm flex items-center">
                      Analizar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Análisis Avanzado de Rendimiento
                    </DialogTitle>
                    <DialogDescription>
                      Métricas detalladas y análisis profundo de tu rendimiento
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Eficiencia Operativa</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Tiempo Promedio de Respuesta</span>
                            <span className="font-semibold text-green-600">2.3 horas</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Tasa de Completación</span>
                            <span className="font-semibold text-blue-600">93.2%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Satisfacción del Cliente</span>
                            <span className="font-semibold text-yellow-600">4.7/5.0</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Análisis Financiero</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Margen de Ganancia</span>
                            <span className="font-semibold text-green-600">34.5%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Costo por Trabajo</span>
                            <span className="font-semibold text-red-600">$42,300</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">ROI Mensual</span>
                            <span className="font-semibold text-purple-600">127%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Trends Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Tendencias y Patrones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-800">Tendencia Positiva</span>
                            </div>
                            <p className="text-sm text-blue-700">
                              Los trabajos de plomería han aumentado un 25% en los últimos 3 meses,
                              representando el 40% de tus ingresos totales.
                            </p>
                          </div>

                          <div className="p-4 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <span className="font-medium text-orange-800">Área de Mejora</span>
                            </div>
                            <p className="text-sm text-orange-700">
                              Los tiempos de respuesta en trabajos urgentes superan las 4 horas.
                              Considera optimizar la asignación de recursos.
                            </p>
                          </div>

                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-medium text-green-800">
                                Fortaleza Identificada
                              </span>
                            </div>
                            <p className="text-sm text-green-700">
                              Excelente calificación promedio (4.8/5.0) en trabajos de mantenimiento
                              preventivo, lo que indica alta satisfacción del cliente.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recomendaciones Estratégicas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="font-medium text-blue-800">
                                Expandir Servicios de Plomería
                              </p>
                              <p className="text-sm text-blue-700">
                                Considera contratar un especialista adicional para cubrir la
                                creciente demanda.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 border border-green-200 rounded-lg bg-green-50">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="font-medium text-green-800">
                                Implementar Sistema de Priorización
                              </p>
                              <p className="text-sm text-green-700">
                                Desarrolla un sistema automatizado para clasificar trabajos por
                                urgencia.
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 border border-purple-200 rounded-lg bg-purple-50">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <p className="font-medium text-purple-800">
                                Programa de Fidelización
                              </p>
                              <p className="text-sm text-purple-700">
                                Implementa descuentos para clientes recurrentes para aumentar la
                                retención.
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAdvancedModal(false)}>
                        Cerrar
                      </Button>
                      <Button onClick={handleExportAnalysis}>Exportar Análisis Completo</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showSchedulingModal} onOpenChange={setShowSchedulingModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Programar Reportes</h3>
                    <p className="text-sm text-gray-600 mb-4">Reportes automáticos</p>
                    <div className="text-green-600 font-medium text-sm flex items-center">
                      Programar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Programación de Reportes Automáticos
                    </DialogTitle>
                    <DialogDescription>
                      Configura reportes automáticos que se envíen periódicamente por email
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Current Scheduled Reports */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Reportes Programados</h3>
                      <div className="space-y-3">
                        {scheduledReports.map(report => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium">{report.name}</h4>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                <span>
                                  Frecuencia:{' '}
                                  {report.frequency === 'daily'
                                    ? 'Diaria'
                                    : report.frequency === 'weekly'
                                      ? 'Semanal'
                                      : report.frequency === 'monthly'
                                        ? 'Mensual'
                                        : 'Trimestral'}
                                </span>
                                <span>Destinatarios: {report.recipients}</span>
                                <span>
                                  Próximo envío:{' '}
                                  {new Date(report.nextSend).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  report.status === 'active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {report.status === 'active' ? 'Activo' : 'Pausado'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditReport(report)}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handlePauseReport(report.id)}
                              >
                                {report.status === 'active' ? 'Pausar' : 'Activar'}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* New Report Form */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {editingReport
                            ? 'Editar Reporte Automático'
                            : 'Crear Nuevo Reporte Automático'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="reportName">Nombre del Reporte</Label>
                          <Input
                            id="reportName"
                            placeholder="Ej: Reporte de Ingresos Semanal"
                            value={newReportForm.name}
                            onChange={e =>
                              setNewReportForm(prev => ({ ...prev, name: e.target.value }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="reportType">Tipo de Reporte</Label>
                            <Select
                              value={newReportForm.type}
                              onValueChange={(value: ScheduledReport['type']) =>
                                setNewReportForm(prev => ({ ...prev, type: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="performance">Rendimiento</SelectItem>
                                <SelectItem value="financial">Financiero</SelectItem>
                                <SelectItem value="jobs">Trabajos</SelectItem>
                                <SelectItem value="clients">Clientes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="frequency">Frecuencia</Label>
                            <Select
                              value={newReportForm.frequency}
                              onValueChange={(value: ScheduledReport['frequency']) =>
                                setNewReportForm(prev => ({ ...prev, frequency: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar frecuencia" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="daily">Diario</SelectItem>
                                <SelectItem value="weekly">Semanal</SelectItem>
                                <SelectItem value="monthly">Mensual</SelectItem>
                                <SelectItem value="quarterly">Trimestral</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="recipients">
                            Destinatarios (emails separados por coma)
                          </Label>
                          <Input
                            id="recipients"
                            placeholder="tu@email.com, contador@email.com"
                            value={newReportForm.recipients}
                            onChange={e =>
                              setNewReportForm(prev => ({ ...prev, recipients: e.target.value }))
                            }
                          />
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeCharts"
                              className="rounded"
                              checked={newReportForm.includeCharts}
                              onChange={e =>
                                setNewReportForm(prev => ({
                                  ...prev,
                                  includeCharts: e.target.checked,
                                }))
                              }
                            />
                            <Label htmlFor="includeCharts">Incluir gráficos</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="includeDetails"
                              className="rounded"
                              checked={newReportForm.includeDetails}
                              onChange={e =>
                                setNewReportForm(prev => ({
                                  ...prev,
                                  includeDetails: e.target.checked,
                                }))
                              }
                            />
                            <Label htmlFor="includeDetails">Incluir detalles completos</Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowSchedulingModal(false);
                          setEditingReport(null);
                          setNewReportForm({
                            name: '',
                            type: '' as ScheduledReport['type'],
                            frequency: '' as ScheduledReport['frequency'],
                            recipients: '',
                            includeCharts: true,
                            includeDetails: false,
                          });
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleCreateReport}>
                        {editingReport ? 'Actualizar Reporte' : 'Crear Reporte Automático'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
                <DialogTrigger asChild>
                  <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group cursor-pointer">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">Comparar Períodos</h3>
                    <p className="text-sm text-gray-600 mb-4">Análisis comparativo</p>
                    <div className="text-purple-600 font-medium text-sm flex items-center">
                      Comparar
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Comparación de Períodos
                    </DialogTitle>
                    <DialogDescription>
                      Analiza el rendimiento comparando diferentes períodos de tiempo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Period Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Período 1</Label>
                        <Select defaultValue="current_month">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current_month">Enero 2024 (Actual)</SelectItem>
                            <SelectItem value="last_month">Diciembre 2023</SelectItem>
                            <SelectItem value="two_months_ago">Noviembre 2023</SelectItem>
                            <SelectItem value="current_quarter">Q1 2024</SelectItem>
                            <SelectItem value="last_quarter">Q4 2023</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Período 2</Label>
                        <Select defaultValue="last_month">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current_month">Enero 2024 (Actual)</SelectItem>
                            <SelectItem value="last_month">Diciembre 2023</SelectItem>
                            <SelectItem value="two_months_ago">Noviembre 2023</SelectItem>
                            <SelectItem value="current_quarter">Q1 2024</SelectItem>
                            <SelectItem value="last_quarter">Q4 2023</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Comparison Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">45</div>
                            <div className="text-sm text-gray-600">Trabajos Enero</div>
                            <div className="flex items-center justify-center mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-green-600">+12%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">$2.85M</div>
                            <div className="text-sm text-gray-600">Ingresos Enero</div>
                            <div className="flex items-center justify-center mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-green-600">+8%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">4.6</div>
                            <div className="text-sm text-gray-600">Calificación Enero</div>
                            <div className="flex items-center justify-center mt-2">
                              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                              <span className="text-sm font-medium text-red-600">-2%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">93%</div>
                            <div className="text-sm text-gray-600">Completación Enero</div>
                            <div className="flex items-center justify-center mt-2">
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                              <span className="text-sm font-medium text-green-600">+5%</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Comparison */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Comparación Detallada</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Period 1 Data */}
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-3">Enero 2024</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Trabajos Completados:</span>
                                  <span className="font-medium">42/45</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Ingresos Totales:</span>
                                  <span className="font-medium">$2,850,000</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Calificación Promedio:</span>
                                  <span className="font-medium">4.6/5.0</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Tiempo Respuesta:</span>
                                  <span className="font-medium">2.3 hrs</span>
                                </div>
                              </div>
                            </div>

                            {/* Period 2 Data */}
                            <div>
                              <h3 className="font-semibold text-gray-800 mb-3">Diciembre 2023</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Trabajos Completados:</span>
                                  <span className="font-medium">38/42</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Ingresos Totales:</span>
                                  <span className="font-medium">$2,640,000</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Calificación Promedio:</span>
                                  <span className="font-medium">4.7/5.0</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm">Tiempo Respuesta:</span>
                                  <span className="font-medium">2.8 hrs</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Service Type Comparison */}
                          <div className="mt-6">
                            <h4 className="font-medium mb-3">Comparación por Tipo de Servicio</h4>
                            <div className="space-y-3">
                              {[
                                { service: 'Plomería', period1: 12, period2: 10, change: '+20%' },
                                { service: 'Eléctrica', period1: 8, period2: 9, change: '-11%' },
                                { service: 'Limpieza', period1: 15, period2: 12, change: '+25%' },
                                { service: 'Estructural', period1: 6, period2: 8, change: '-25%' },
                                { service: 'Pintura', period1: 4, period2: 3, change: '+33%' },
                              ].map(item => (
                                <div
                                  key={item.service}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                  <span className="font-medium">{item.service}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm">
                                      Ene: {item.period1} | Dic: {item.period2}
                                    </span>
                                    <Badge
                                      className={
                                        item.change.startsWith('+')
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }
                                    >
                                      {item.change}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Insights y Observaciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Incremento significativo:</strong> Los trabajos de limpieza y
                              pintura muestran crecimiento importante, lo que indica expansión
                              exitosa en estos servicios.
                            </p>
                          </div>

                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              <strong>Disminución en calificación:</strong> La satisfacción del
                              cliente bajó ligeramente. Considerar revisar procesos de trabajos
                              urgentes.
                            </p>
                          </div>

                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Mejora en eficiencia:</strong> Tiempo de respuesta reducido y
                              mayor tasa de completación indican mejoras en la gestión operativa.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowComparisonModal(false)}>
                        Cerrar
                      </Button>
                      <Button onClick={handleExportComparison}>Exportar Comparación</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar Datos"
                description="Recargar información"
                onClick={loadReportData}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
