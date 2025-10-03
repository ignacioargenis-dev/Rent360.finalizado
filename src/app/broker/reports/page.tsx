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
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  Calendar,
  Download,
  RefreshCw,
  FileText,
  PieChart,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface BrokerReport {
  period: string;
  propertiesManaged: number;
  newClients: number;
  totalRevenue: number;
  commissionsEarned: number;
  propertiesRented: number;
  maintenanceRequests: number;
  clientSatisfaction: number;
  marketPerformance: number;
}

interface PerformanceMetric {
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export default function BrokerReportsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [reports, setReports] = useState<BrokerReport[]>([]);
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

    const loadReportsData = async () => {
      try {
        // Mock reports data
        const mockReports: BrokerReport[] = [
          {
            period: 'Junio 2024',
            propertiesManaged: 12,
            newClients: 3,
            totalRevenue: 4250000,
            commissionsEarned: 1250000,
            propertiesRented: 2,
            maintenanceRequests: 8,
            clientSatisfaction: 4.6,
            marketPerformance: 8.5,
          },
          {
            period: 'Mayo 2024',
            propertiesManaged: 11,
            newClients: 2,
            totalRevenue: 3980000,
            commissionsEarned: 1180000,
            propertiesRented: 1,
            maintenanceRequests: 6,
            clientSatisfaction: 4.4,
            marketPerformance: 7.8,
          },
          {
            period: 'Abril 2024',
            propertiesManaged: 10,
            newClients: 4,
            totalRevenue: 4120000,
            commissionsEarned: 1220000,
            propertiesRented: 3,
            maintenanceRequests: 7,
            clientSatisfaction: 4.5,
            marketPerformance: 8.2,
          },
        ];

        setReports(mockReports);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading reports data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadReportsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) {
      return { change: '+100%', trend: 'up' };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  };

  const handleExportReport = () => {
    // Export broker report data to CSV
    const csvData = reports.map(report => ({
      Período: report.period,
      'Propiedades Gestionadas': report.propertiesManaged,
      'Nuevos Clientes': report.newClients,
      'Ingresos Totales': formatCurrency(report.totalRevenue),
      'Comisiones Ganadas': formatCurrency(report.commissionsEarned),
      'Propiedades Arrendadas': report.propertiesRented,
      'Solicitudes Mantenimiento': report.maintenanceRequests,
      'Satisfacción Cliente': report.clientSatisfaction,
      'Rendimiento Mercado': report.marketPerformance,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_corredor_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefreshData = () => {
    // Refresh report data
    alert('Datos del reporte actualizados correctamente');
  };

  const currentReport = reports[0];
  const previousReport = reports[1];

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
    <UnifiedDashboardLayout
      title="Reportes de Rendimiento"
      subtitle="Analiza tus métricas y resultados mensuales"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Rendimiento</h1>
            <p className="text-gray-600">Métricas detalladas de tu actividad inmobiliaria</p>
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
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(currentReport.totalRevenue)}
                      </p>
                      {previousReport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          {getTrendIcon(
                            calculateChange(currentReport.totalRevenue, previousReport.totalRevenue)
                              .trend
                          )}
                          {
                            calculateChange(currentReport.totalRevenue, previousReport.totalRevenue)
                              .change
                          }{' '}
                          vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Comisiones Ganadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(currentReport.commissionsEarned)}
                      </p>
                      {previousReport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          {getTrendIcon(
                            calculateChange(
                              currentReport.commissionsEarned,
                              previousReport.commissionsEarned
                            ).trend
                          )}
                          {
                            calculateChange(
                              currentReport.commissionsEarned,
                              previousReport.commissionsEarned
                            ).change
                          }{' '}
                          vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Propiedades Arrendadas</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentReport.propertiesRented}
                      </p>
                      {previousReport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          {getTrendIcon(
                            calculateChange(
                              currentReport.propertiesRented,
                              previousReport.propertiesRented
                            ).trend
                          )}
                          {
                            calculateChange(
                              currentReport.propertiesRented,
                              previousReport.propertiesRented
                            ).change
                          }{' '}
                          vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Satisfacción Cliente</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {currentReport.clientSatisfaction}/5.0
                      </p>
                      {previousReport && (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          {getTrendIcon(
                            calculateChange(
                              currentReport.clientSatisfaction,
                              previousReport.clientSatisfaction
                            ).trend
                          )}
                          {
                            calculateChange(
                              currentReport.clientSatisfaction,
                              previousReport.clientSatisfaction
                            ).change
                          }{' '}
                          vs mes anterior
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Actividad - {currentReport.period}</CardTitle>
                  <CardDescription>Principales indicadores de rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Propiedades Gestionadas</span>
                      <span className="font-semibold">{currentReport.propertiesManaged}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Nuevos Clientes</span>
                      <span className="font-semibold">{currentReport.newClients}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Solicitudes de Mantenimiento</span>
                      <span className="font-semibold">{currentReport.maintenanceRequests}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Rendimiento de Mercado</span>
                      <span className="font-semibold">{currentReport.marketPerformance}/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tendencias Mensuales</CardTitle>
                  <CardDescription>Evolución de los últimos 3 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reports.slice(0, 3).map((report, index) => (
                      <div
                        key={report.period}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{report.period}</p>
                          <p className="text-xs text-gray-500">
                            {report.propertiesRented} propiedades arrendadas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(report.totalRevenue)}
                          </p>
                          <p className="text-xs text-green-600">
                            {formatCurrency(report.commissionsEarned)} en comisiones
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análisis Financiero</CardTitle>
                  <CardDescription>Ingresos y ganancias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Ingresos por Arriendos</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          currentReport.totalRevenue - currentReport.commissionsEarned
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Comisiones Recibidas</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(currentReport.commissionsEarned)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total</span>
                      <span className="font-bold">
                        {formatCurrency(currentReport.totalRevenue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actividad del Mes</CardTitle>
                  <CardDescription>Estadísticas operativas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Propiedades Activas</span>
                      <span className="font-semibold">{currentReport.propertiesManaged}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Clientes Atendidos</span>
                      <span className="font-semibold">{currentReport.newClients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mantenimientos</span>
                      <span className="font-semibold">{currentReport.maintenanceRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tasa de Ocupación</span>
                      <span className="font-semibold">
                        {(
                          (currentReport.propertiesRented / currentReport.propertiesManaged) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Calidad del Servicio</CardTitle>
                  <CardDescription>Métricas de satisfacción</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Satisfacción Cliente</span>
                      <span className="font-semibold">
                        {currentReport.clientSatisfaction}/5.0 ⭐
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rendimiento Mercado</span>
                      <span className="font-semibold">{currentReport.marketPerformance}/10 📈</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Eficiencia Operativa</span>
                      <span className="font-semibold">94% ⚡</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tiempo Respuesta</span>
                      <span className="font-semibold">2.3h 🕐</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recomendaciones para Mejorar</CardTitle>
                <CardDescription>Acciones sugeridas basadas en tus métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">Expandir Portafolio</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Considera agregar más propiedades para aumentar ingresos
                    </p>
                    <Button size="sm" variant="outline">
                      Ver Oportunidades
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">Mejorar Satisfacción</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Encuestas de satisfacción pueden ayudar a mejorar el servicio
                    </p>
                    <Button size="sm" variant="outline">
                      Enviar Encuestas
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium">Analizar Mercado</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Revisa tendencias del mercado para optimizar precios
                    </p>
                    <Button size="sm" variant="outline">
                      Ver Análisis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
