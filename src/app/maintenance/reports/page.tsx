'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
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

export default function MaintenanceReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockData: ReportData = {
        period: selectedPeriod === 'month' ? 'Enero 2024' : '2024',
        totalJobs: 45,
        completedJobs: 42,
        revenue: 2850000,
        averageRating: 4.6,
        topServices: [
          { type: 'Plomería', count: 12, revenue: 850000 },
          { type: 'Eléctrica', count: 8, revenue: 720000 },
          { type: 'Limpieza', count: 15, revenue: 675000 },
          { type: 'Estructural', count: 5, revenue: 425000 },
          { type: 'Otro', count: 5, revenue: 175000 },
        ],
        monthlyTrend: [
          { month: 'Ene', jobs: 8, revenue: 520000 },
          { month: 'Feb', jobs: 12, revenue: 780000 },
          { month: 'Mar', jobs: 15, revenue: 950000 },
          { month: 'Abr', jobs: 10, revenue: 600000 },
        ],
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setReportData(mockData);
    } catch (error) {
      logger.error('Error loading report data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
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
                description="Crear reporte en PDF"
                onClick={() => {
                  setSuccessMessage(
                    'Generando reporte en PDF... Esta funcionalidad estará disponible próximamente.'
                  );
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Análisis Avanzado"
                description="Ver métricas detalladas"
                onClick={() => {
                  setSuccessMessage('Análisis avanzado próximamente disponible.');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={Calendar}
                label="Programar Reportes"
                description="Reportes automáticos"
                onClick={() => {
                  setSuccessMessage('Programación de reportes próximamente disponible.');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

              <QuickActionButton
                icon={Eye}
                label="Comparar Períodos"
                description="Análisis comparativo"
                onClick={() => {
                  setSuccessMessage('Comparación de períodos próximamente disponible.');
                  setTimeout(() => setSuccessMessage(''), 3000);
                }}
              />

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
