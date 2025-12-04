'use client';

import React, { useState, useEffect } from 'react';

// ✅ CORREGIDO: 'use client' no puede usar export const dynamic o revalidate
// Las páginas del cliente se renderizan dinámicamente por defecto en el navegador
// Los datos se cargan mediante fetch en useEffect, no durante el build
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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
        // Cargar datos reales desde la API
        const response = await fetch('/api/broker/reports', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          // La API devuelve { success: true, data: monthlyReports }
          const reportsData = data.data || data.reports || [];

          // Transformar datos de la API al formato esperado
          const transformedReports: BrokerReport[] = reportsData.map((report: any) => ({
            period: report.period || report.date || 'Periodo',
            propertiesManaged: report.propertiesManaged || report.properties || 0,
            newClients: report.newClients || report.clients || 0,
            totalRevenue: report.totalRevenue || report.revenue || 0,
            commissionsEarned: report.commissionsEarned || report.commissions || 0,
            propertiesRented: report.propertiesRented || report.rented || 0,
            maintenanceRequests: report.maintenanceRequests || report.maintenance || 0,
            clientSatisfaction: report.clientSatisfaction || report.satisfaction || 0,
            marketPerformance: report.marketPerformance || report.performance || 0,
          }));

          setReports(transformedReports);
        } else {
          // Si no hay datos reales, mostrar array vacío
          setReports([]);
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error loading reports data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, mostrar array vacío
        setReports([]);
        setLoading(false);
      }
    };

    loadUserData();
    loadReportsData();
  }, []);

  // Helper function to parse month name to date
  const parseMonthName = (monthName: string): Date | null => {
    try {
      // Format: "enero 2025", "febrero 2025", etc.
      const parts = monthName.toLowerCase().trim().split(' ');
      if (parts.length !== 2) {
        return null;
      }

      const monthPart = parts[0];
      const yearPart = parts[1];

      if (!monthPart || !yearPart) {
        return null;
      }

      const monthNames = [
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
      ];
      const monthIndex = monthNames.indexOf(monthPart);
      const year = parseInt(yearPart);

      if (monthIndex === -1 || isNaN(year)) {
        return null;
      }
      return new Date(year, monthIndex, 1);
    } catch {
      return null;
    }
  };

  // Helper function to get quarter from month (0-11)
  const getQuarter = (month: number): number => {
    return Math.floor(month / 3);
  };

  // Helper function to get quarter name
  const getQuarterName = (quarter: number, year: number): string => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return `${quarters[quarter]} ${year}`;
  };

  // Aggregate monthly reports into quarterly reports
  const aggregateQuarterlyReports = (): BrokerReport[] => {
    const quarterlyMap = new Map<string, BrokerReport>();

    reports.forEach(report => {
      const date = parseMonthName(report.period);
      if (!date) {
        return;
      }

      const quarter = getQuarter(date.getMonth());
      const quarterName = getQuarterName(quarter, date.getFullYear());

      if (!quarterlyMap.has(quarterName)) {
        quarterlyMap.set(quarterName, {
          period: quarterName,
          propertiesManaged: 0,
          newClients: 0,
          totalRevenue: 0,
          commissionsEarned: 0,
          propertiesRented: 0,
          maintenanceRequests: 0,
          clientSatisfaction: 0,
          marketPerformance: 0,
        });
      }

      const quarterly = quarterlyMap.get(quarterName)!;
      quarterly.propertiesManaged += report.propertiesManaged;
      quarterly.newClients += report.newClients;
      quarterly.totalRevenue += report.totalRevenue;
      quarterly.commissionsEarned += report.commissionsEarned;
      quarterly.propertiesRented += report.propertiesRented;
      quarterly.maintenanceRequests += report.maintenanceRequests;
      quarterly.clientSatisfaction += report.clientSatisfaction;
      quarterly.marketPerformance += report.marketPerformance;
    });

    // Calculate averages for satisfaction and performance
    quarterlyMap.forEach((quarterly, key) => {
      const monthCount = reports.filter(report => {
        const date = parseMonthName(report.period);
        if (!date) {
          return false;
        }
        const quarter = getQuarter(date.getMonth());
        const quarterName = getQuarterName(quarter, date.getFullYear());
        return quarterName === key;
      }).length;

      if (monthCount > 0) {
        quarterly.clientSatisfaction =
          Math.round((quarterly.clientSatisfaction / monthCount) * 10) / 10;
        quarterly.marketPerformance =
          Math.round((quarterly.marketPerformance / monthCount) * 10) / 10;
      }
    });

    return Array.from(quarterlyMap.values()).sort((a, b) => {
      // Parse "Q1 2025" format
      const parseQuarter = (period: string): { quarter: number; year: number } | null => {
        const match = period.match(/Q(\d)\s+(\d{4})/);
        if (!match || !match[1] || !match[2]) {
          return null;
        }
        const quarter = parseInt(match[1]);
        const year = parseInt(match[2]);
        if (isNaN(quarter) || isNaN(year)) {
          return null;
        }
        return { quarter: quarter - 1, year };
      };

      const qA = parseQuarter(a.period);
      const qB = parseQuarter(b.period);
      if (!qA || !qB) {
        return 0;
      }

      if (qA.year !== qB.year) {
        return qB.year - qA.year;
      }
      return qB.quarter - qA.quarter;
    });
  };

  // Aggregate monthly reports into yearly reports
  const aggregateYearlyReports = (): BrokerReport[] => {
    const yearlyMap = new Map<string, BrokerReport>();

    reports.forEach(report => {
      const date = parseMonthName(report.period);
      if (!date) {
        return;
      }

      const year = date.getFullYear().toString();

      if (!yearlyMap.has(year)) {
        yearlyMap.set(year, {
          period: year,
          propertiesManaged: 0,
          newClients: 0,
          totalRevenue: 0,
          commissionsEarned: 0,
          propertiesRented: 0,
          maintenanceRequests: 0,
          clientSatisfaction: 0,
          marketPerformance: 0,
        });
      }

      const yearly = yearlyMap.get(year)!;
      yearly.propertiesManaged += report.propertiesManaged;
      yearly.newClients += report.newClients;
      yearly.totalRevenue += report.totalRevenue;
      yearly.commissionsEarned += report.commissionsEarned;
      yearly.propertiesRented += report.propertiesRented;
      yearly.maintenanceRequests += report.maintenanceRequests;
      yearly.clientSatisfaction += report.clientSatisfaction;
      yearly.marketPerformance += report.marketPerformance;
    });

    // Calculate averages for satisfaction and performance
    yearlyMap.forEach((yearly, year) => {
      const monthCount = reports.filter(report => {
        const date = parseMonthName(report.period);
        return date && date.getFullYear().toString() === year;
      }).length;

      if (monthCount > 0) {
        yearly.clientSatisfaction = Math.round((yearly.clientSatisfaction / monthCount) * 10) / 10;
        yearly.marketPerformance = Math.round((yearly.marketPerformance / monthCount) * 10) / 10;
      }
    });

    return Array.from(yearlyMap.values()).sort((a, b) => {
      const yearA = parseInt(a.period);
      const yearB = parseInt(b.period);
      return yearB - yearA;
    });
  };

  // Filter reports based on selected period
  const getFilteredReports = (): BrokerReport[] => {
    if (reports.length === 0) {
      return [];
    }

    switch (selectedPeriod) {
      case 'month':
        // Return all monthly reports (they are already monthly)
        return reports.filter(report => {
          const date = parseMonthName(report.period);
          return date !== null;
        });
      case 'quarter':
        // Aggregate monthly reports into quarterly
        return aggregateQuarterlyReports();
      case 'year':
        // Aggregate monthly reports into yearly
        return aggregateYearlyReports();
      default:
        // Por defecto, mostrar todos los reportes mensuales
        return reports.filter(report => {
          const date = parseMonthName(report.period);
          return date !== null;
        });
    }
  };

  const filteredReports = getFilteredReports();
  const currentReport = filteredReports[0];
  const previousReport = filteredReports[1];

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
    // Refresh report data - simulate API call
    setLoading(true);
    setTimeout(() => {
      // Simulate refreshed data with slight variations
      const refreshedReports = reports.map(report => ({
        ...report,
        totalRevenue: report.totalRevenue + Math.floor(Math.random() * 100000 - 50000),
        commissionsEarned: report.commissionsEarned + Math.floor(Math.random() * 50000 - 25000),
        propertiesRented: Math.max(0, report.propertiesRented + Math.floor(Math.random() * 2 - 1)),
        newClients: Math.max(0, report.newClients + Math.floor(Math.random() * 2 - 1)),
      }));
      setReports(refreshedReports);
      setLoading(false);
    }, 1000);
  };

  const handleViewOpportunities = () => {
    // Navigate to market analysis to find expansion opportunities
    router.push('/broker/analytics/market-analysis');
  };

  const handleSendSurveys = async () => {
    try {
      // Send satisfaction surveys to active clients
      const response = await fetch('/api/broker/surveys/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyType: 'client_satisfaction',
          targetAudience: 'active_clients',
          brokerId: user?.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Encuestas enviadas correctamente a ${result.sentCount} clientes activos`);
      } else {
        const error = await response.json();
        alert(`Error al enviar encuestas: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error sending surveys:', { error });
      alert('Error al enviar encuestas. Por favor intenta nuevamente.');
    }
  };

  const handleViewAnalysis = () => {
    // Navigate to detailed market analysis
    router.push('/broker/analytics');
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
    <UnifiedDashboardLayout
      title="Reportes de Rendimiento"
      subtitle="Analiza tus métricas y resultados mensuales"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-end items-start lg:items-center mb-6 gap-4">
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

        {!currentReport && reports.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay reportes disponibles
              </h3>
              <p className="text-gray-600 mb-4">
                Los reportes se generarán automáticamente cuando tengas actividad registrada.
              </p>
              <p className="text-sm text-gray-500">
                Necesitas tener contratos activos o gestionar propiedades para generar reportes.
              </p>
            </CardContent>
          </Card>
        )}

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
                    {filteredReports.slice(0, 3).map((report, index) => (
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
                    <Button size="sm" variant="outline" onClick={handleViewOpportunities}>
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
                    <Button size="sm" variant="outline" onClick={handleSendSurveys}>
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
                    <Button size="sm" variant="outline" onClick={handleViewAnalysis}>
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
