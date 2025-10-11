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
  Zap,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BarChart3,
  TrendingUp,
  Settings,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger';

interface IntegrationSummary {
  totalIntegrations: number;
  activeIntegrations: number;
  inactiveIntegrations: number;
  failedIntegrations: number;
  totalApiCalls: number;
  averageResponseTime: number;
  monthlyGrowth: number;
}

interface IntegrationRecord {
  id: string;
  name: string;
  type: 'payment' | 'banking' | 'communication' | 'analytics' | 'other';
  provider: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  lastSync: string;
  apiCallsToday: number;
  averageResponseTime: number;
  successRate: number;
  totalCalls: number;
  errorsToday: number;
  configuration: {
    apiKey: boolean;
    webhookUrl: boolean;
    credentials: boolean;
  };
}

export default function IntegrationsReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<IntegrationSummary>({
    totalIntegrations: 0,
    activeIntegrations: 0,
    inactiveIntegrations: 0,
    failedIntegrations: 0,
    totalApiCalls: 0,
    averageResponseTime: 0,
    monthlyGrowth: 0,
  });
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);

  // Mock data for integrations
  const mockIntegrations: IntegrationRecord[] = [
    {
      id: '1',
      name: 'Stripe Payments',
      type: 'payment',
      provider: 'Stripe',
      status: 'active',
      lastSync: '2024-12-05T10:30:00Z',
      apiCallsToday: 1250,
      averageResponseTime: 245,
      successRate: 99.8,
      totalCalls: 45280,
      errorsToday: 3,
      configuration: {
        apiKey: true,
        webhookUrl: true,
        credentials: true,
      },
    },
    {
      id: '2',
      name: 'Banco Estado API',
      type: 'banking',
      provider: 'Banco Estado',
      status: 'active',
      lastSync: '2024-12-05T09:45:00Z',
      apiCallsToday: 890,
      averageResponseTime: 320,
      successRate: 98.5,
      totalCalls: 23450,
      errorsToday: 12,
      configuration: {
        apiKey: true,
        webhookUrl: false,
        credentials: true,
      },
    },
    {
      id: '3',
      name: 'Twilio SMS',
      type: 'communication',
      provider: 'Twilio',
      status: 'error',
      lastSync: '2024-12-04T15:20:00Z',
      apiCallsToday: 0,
      averageResponseTime: 0,
      successRate: 0,
      totalCalls: 15670,
      errorsToday: 0,
      configuration: {
        apiKey: true,
        webhookUrl: false,
        credentials: false,
      },
    },
    {
      id: '4',
      name: 'Google Analytics',
      type: 'analytics',
      provider: 'Google',
      status: 'active',
      lastSync: '2024-12-05T08:00:00Z',
      apiCallsToday: 567,
      averageResponseTime: 180,
      successRate: 100,
      totalCalls: 8920,
      errorsToday: 0,
      configuration: {
        apiKey: true,
        webhookUrl: false,
        credentials: true,
      },
    },
    {
      id: '5',
      name: 'Mercado Pago',
      type: 'payment',
      provider: 'Mercado Pago',
      status: 'inactive',
      lastSync: '2024-12-01T12:00:00Z',
      apiCallsToday: 0,
      averageResponseTime: 0,
      successRate: 0,
      totalCalls: 1234,
      errorsToday: 0,
      configuration: {
        apiKey: false,
        webhookUrl: false,
        credentials: false,
      },
    },
    {
      id: '6',
      name: 'SendGrid Email',
      type: 'communication',
      provider: 'SendGrid',
      status: 'active',
      lastSync: '2024-12-05T11:15:00Z',
      apiCallsToday: 2340,
      averageResponseTime: 150,
      successRate: 99.9,
      totalCalls: 67890,
      errorsToday: 2,
      configuration: {
        apiKey: true,
        webhookUrl: true,
        credentials: true,
      },
    },
  ];

  useEffect(() => {
    loadIntegrationsData();
  }, [dateRange, typeFilter, statusFilter]);

  const loadIntegrationsData = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter integrations based on criteria
      let filteredIntegrations = mockIntegrations;

      if (typeFilter !== 'all') {
        filteredIntegrations = filteredIntegrations.filter(i => i.type === typeFilter);
      }

      if (statusFilter !== 'all') {
        filteredIntegrations = filteredIntegrations.filter(i => i.status === statusFilter);
      }

      setIntegrations(filteredIntegrations);

      // Calculate summary
      const totalIntegrations = filteredIntegrations.length;
      const activeIntegrations = filteredIntegrations.filter(i => i.status === 'active').length;
      const inactiveIntegrations = filteredIntegrations.filter(i => i.status === 'inactive').length;
      const failedIntegrations = filteredIntegrations.filter(i => i.status === 'error').length;
      const totalApiCalls = filteredIntegrations.reduce((sum, i) => sum + i.apiCallsToday, 0);
      const averageResponseTime = filteredIntegrations
        .filter(i => i.status === 'active')
        .reduce((sum, i, _, arr) => sum + i.averageResponseTime / arr.length, 0);

      setSummary({
        totalIntegrations,
        activeIntegrations,
        inactiveIntegrations,
        failedIntegrations,
        totalApiCalls,
        averageResponseTime: Math.round(averageResponseTime),
        monthlyGrowth: 15.2, // Mock growth percentage
      });
    } catch (error) {
      logger.error('Error al cargar datos de integraciones', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'ID',
        'Nombre',
        'Tipo',
        'Proveedor',
        'Estado',
        'Última Sincronización',
        'Llamadas Hoy',
        'Tiempo Respuesta Promedio',
        'Tasa Éxito',
        'Total Llamadas',
        'Errores Hoy',
      ],
      ...integrations.map(integration => [
        integration.id,
        integration.name,
        integration.type === 'payment'
          ? 'Pago'
          : integration.type === 'banking'
            ? 'Bancario'
            : integration.type === 'communication'
              ? 'Comunicación'
              : integration.type === 'analytics'
                ? 'Analítica'
                : 'Otro',
        integration.provider,
        integration.status === 'active'
          ? 'Activo'
          : integration.status === 'inactive'
            ? 'Inactivo'
            : integration.status === 'error'
              ? 'Error'
              : 'Mantenimiento',
        new Date(integration.lastSync).toLocaleString('es-CL'),
        integration.apiCallsToday.toLocaleString(),
        `${integration.averageResponseTime}ms`,
        `${integration.successRate}%`,
        integration.totalCalls.toLocaleString(),
        integration.errorsToday.toString(),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `reporte-integraciones-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Reporte de integraciones exportado', { totalRecords: integrations.length });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Mantenimiento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      payment: 'bg-blue-100 text-blue-800',
      banking: 'bg-green-100 text-green-800',
      communication: 'bg-purple-100 text-purple-800',
      analytics: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      payment: 'Pago',
      banking: 'Bancario',
      communication: 'Comunicación',
      analytics: 'Analítica',
      other: 'Otro',
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.other}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const formatTime = (milliseconds: number) => {
    return `${milliseconds}ms`;
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Integraciones</h1>
            <p className="text-gray-600">
              Monitoreo y análisis de todas las integraciones del sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadIntegrationsData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportReport} disabled={integrations.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <Label htmlFor="typeFilter">Tipo de Integración</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="payment">Pagos</SelectItem>
                    <SelectItem value="banking">Bancario</SelectItem>
                    <SelectItem value="communication">Comunicación</SelectItem>
                    <SelectItem value="analytics">Analítica</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="details">Detalles de Integraciones</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Integraciones</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {summary.totalIntegrations}
                      </p>
                    </div>
                    <Settings className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary.activeIntegrations}
                      </p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Con Errores</p>
                      <p className="text-2xl font-bold text-red-600">
                        {summary.failedIntegrations}
                      </p>
                    </div>
                    <AlertTriangle className="w-12 h-12 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Llamadas API Hoy</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {summary.totalApiCalls.toLocaleString()}
                      </p>
                    </div>
                    <Zap className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas de Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tiempo Respuesta Promedio</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatTime(summary.averageResponseTime)}
                      </p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Crecimiento Mensual</p>
                      <p className="text-2xl font-bold text-green-600">+{summary.monthlyGrowth}%</p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Estados */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Activas</span>
                    </div>
                    <span className="font-semibold">{summary.activeIntegrations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="text-sm">Inactivas</span>
                    </div>
                    <span className="font-semibold">{summary.inactiveIntegrations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Con Errores</span>
                    </div>
                    <span className="font-semibold">{summary.failedIntegrations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">En Mantenimiento</span>
                    </div>
                    <span className="font-semibold">
                      {integrations.filter(i => i.status === 'maintenance').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Integraciones por Llamadas */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Integraciones por Llamadas API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations
                      .filter(i => i.status === 'active')
                      .sort((a, b) => b.apiCallsToday - a.apiCallsToday)
                      .slice(0, 5)
                      .map((integration, index) => (
                        <div key={integration.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{integration.name}</span>
                              <p className="text-xs text-gray-500">{integration.provider}</p>
                            </div>
                          </div>
                          <span className="font-semibold">
                            {integration.apiCallsToday.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Integraciones con Más Errores */}
              <Card>
                <CardHeader>
                  <CardTitle>Integraciones con Más Errores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {integrations
                      .filter(i => i.errorsToday > 0)
                      .sort((a, b) => b.errorsToday - a.errorsToday)
                      .slice(0, 5)
                      .map((integration, index) => (
                        <div key={integration.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-semibold text-red-600">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-sm font-medium">{integration.name}</span>
                              <p className="text-xs text-gray-500">{integration.provider}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-red-600">
                              {integration.errorsToday}
                            </span>
                            <p className="text-xs text-gray-500">errores hoy</p>
                          </div>
                        </div>
                      ))}
                    {integrations.filter(i => i.errorsToday > 0).length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        No hay errores reportados hoy
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tasa de Éxito por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Tasa de Éxito por Tipo de Integración</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    integrations.reduce(
                      (acc, integration) => {
                        if (!acc[integration.type]) {
                          acc[integration.type] = { total: 0, success: 0 };
                        }
                        acc[integration.type]!.total += 1;
                        if (integration.status === 'active' && integration.successRate > 95) {
                          acc[integration.type]!.success += 1;
                        }
                        return acc;
                      },
                      {} as Record<string, { total: number; success: number }>
                    )
                  ).map(([type, stats]) => {
                    const successRate = stats.total > 0 ? (stats.success / stats.total) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeBadge(type)}
                          <span className="text-sm font-medium">
                            {type === 'payment'
                              ? 'Pagos'
                              : type === 'banking'
                                ? 'Bancario'
                                : type === 'communication'
                                  ? 'Comunicación'
                                  : type === 'analytics'
                                    ? 'Analítica'
                                    : 'Otro'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600">
                            {stats.success}/{stats.total}
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${successRate >= 95 ? 'bg-green-600' : successRate >= 80 ? 'bg-yellow-600' : 'bg-red-600'}`}
                              style={{ width: `${successRate}%` }}
                            ></div>
                          </div>
                          <span
                            className={`text-sm font-semibold ${successRate >= 95 ? 'text-green-600' : successRate >= 80 ? 'text-yellow-600' : 'text-red-600'}`}
                          >
                            {successRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Integraciones</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando datos...
                  </div>
                ) : integrations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron integraciones para los filtros seleccionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Integración</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Llamadas Hoy</TableHead>
                          <TableHead>Tiempo Respuesta</TableHead>
                          <TableHead>Tasa Éxito</TableHead>
                          <TableHead>Última Sync</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {integrations.map(integration => (
                          <TableRow key={integration.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{integration.name}</div>
                                <div className="text-sm text-gray-500">{integration.provider}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getTypeBadge(integration.type)}</TableCell>
                            <TableCell>{getStatusBadge(integration.status)}</TableCell>
                            <TableCell>
                              <div className="text-right">
                                <div className="font-semibold">
                                  {integration.apiCallsToday.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Total: {integration.totalCalls.toLocaleString()}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {integration.averageResponseTime > 0
                                ? formatTime(integration.averageResponseTime)
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  integration.successRate >= 99
                                    ? 'text-green-600'
                                    : integration.successRate >= 95
                                      ? 'text-yellow-600'
                                      : 'text-red-600'
                                }`}
                              >
                                {integration.successRate > 0 ? `${integration.successRate}%` : '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(integration.lastSync).toLocaleString('es-CL', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
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
