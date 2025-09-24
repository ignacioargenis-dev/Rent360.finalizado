'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  HardDrive,
  Zap,
  Users,
  DollarSign,
  FileText,
  Shield,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Settings,
  Bell,
  BarChart3,
  Server,
  Globe,
  Cpu,
  MemoryStick
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface SystemOverview {
  health: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    uptime: number;
  };
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalProperties: number;
    availableProperties: number;
    totalContracts: number;
    activeContracts: number;
    totalPayments: number;
    pendingPayments: number;
    overduePayments: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
  alerts: {
    total: number;
    active: number;
    critical: number;
    recent: any[];
  };
  backups: {
    lastBackup: string;
    status: string;
    size: number;
  };
}

export default function MonitoringDashboard() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { success, error: showError } = useToast();

  const fetchOverview = async () => {
    try {
      setLoading(true);

      // Obtener datos reales del sistema
      const response = await fetch('/api/admin/system-metrics');
      if (!response.ok) {
        throw new Error('Error obteniendo métricas del sistema');
      }

      const systemMetrics = await response.json();
      const data = systemMetrics.data;

      // Transformar datos para el formato esperado
      const processedData: SystemOverview = {
        health: {
          status: data.summary.overallStatus,
          score: data.summary.healthScore,
          issues: data.summary.recommendations,
          uptime: data.systemInfo.uptime,
        },
        metrics: {
          totalUsers: data.database?.counts?.users || 0,
          activeUsers: data.database?.active?.activeUsers || 0,
          totalProperties: data.database?.counts?.properties || 0,
          availableProperties: data.database?.active?.availableProperties || 0,
          totalContracts: data.database?.counts?.contracts || 0,
          activeContracts: data.database?.active?.activeContracts || 0,
          totalPayments: data.database?.counts?.payments || 0,
          pendingPayments: data.database?.active?.pendingPayments || 0,
          overduePayments: 0, // Calcular de payments con status OVERDUE
        },
        performance: {
          memoryUsage: data.quickMetrics.memoryUsage,
          cpuUsage: data.quickMetrics.cpuUsage,
          responseTime: data.performance?.database?.queryTime || 0,
          errorRate: 0, // Calcular basado en alertas
          cacheHitRate: data.performance?.cache?.hitRate || 0,
        },
        alerts: {
          total: data.activeAlerts?.length || 0,
          active: data.activeAlerts?.filter((a: any) => a.type === 'critical' || a.type === 'warning').length || 0,
          critical: data.activeAlerts?.filter((a: any) => a.type === 'critical').length || 0,
          recent: data.activeAlerts || [],
        },
        backups: {
          lastBackup: 'Sistema actualizado', // Placeholder
          status: 'success',
          size: 0,
        },
      };

      setOverview(processedData);
    } catch (err) {
      showError('Error', 'Error cargando datos del dashboard: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></RefreshCw>
          <p className="mt-2 text-gray-600">Cargando dashboard de monitoreo...</p>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se pudieron cargar los datos del dashboard de monitoreo.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Monitoreo</h1>
          <p className="text-gray-600">
            Estado general del sistema Rent360
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(overview.health.status)}>
            {getStatusIcon(overview.health.status)}
            Sistema {overview.health.status.toUpperCase()}
          </Badge>
          <Button variant="outline" onClick={fetchOverview}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Estado General del Sistema
          </CardTitle>
          <CardDescription>
            Puntuación de salud: {overview.health.score}/100 • Uptime: {formatUptime(overview.health.uptime)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <Progress value={overview.health.score} className="h-3" />
            </div>
            <span className="text-sm font-medium">{overview.health.score}%</span>
          </div>

          {overview.health.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-600">Problemas Detectados:</h4>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
                {overview.health.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Usuarios</p>
                <p className="text-2xl font-bold">{overview.metrics.totalUsers}</p>
                <p className="text-xs text-green-600">
                  {overview.metrics.activeUsers} activos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Propiedades</p>
                <p className="text-2xl font-bold">{overview.metrics.totalProperties}</p>
                <p className="text-xs text-green-600">
                  {overview.metrics.availableProperties} disponibles
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Contratos</p>
                <p className="text-2xl font-bold">{overview.metrics.totalContracts}</p>
                <p className="text-xs text-blue-600">
                  {overview.metrics.activeContracts} activos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pagos</p>
                <p className="text-2xl font-bold">{overview.metrics.totalPayments}</p>
                <p className="text-xs text-orange-600">
                  {overview.metrics.pendingPayments} pendientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memoria</span>
                    <span className={overview.performance.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'}>
                      {overview.performance.memoryUsage}%
                    </span>
                  </div>
                  <Progress value={overview.performance.memoryUsage} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span className={overview.performance.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'}>
                      {overview.performance.cpuUsage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={overview.performance.cpuUsage} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span className={overview.performance.cacheHitRate < 70 ? 'text-red-600' : 'text-green-600'}>
                      {overview.performance.cacheHitRate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={overview.performance.cacheHitRate} className="h-2" />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Tiempo de Respuesta</span>
                    <span className={overview.performance.responseTime > 1000 ? 'text-red-600' : 'text-green-600'}>
                      {overview.performance.responseTime.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Tasa de Error</span>
                    <span className={overview.performance.errorRate > 2 ? 'text-red-600' : 'text-green-600'}>
                      {overview.performance.errorRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Backup completado</p>
                      <p className="text-xs text-gray-500">Hace 2 horas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Nuevo usuario registrado</p>
                      <p className="text-xs text-gray-500">Hace 3 horas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Alto uso de memoria detectado</p>
                      <p className="text-xs text-gray-500">Hace 5 horas</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Consulta lenta optimizada</p>
                      <p className="text-xs text-gray-500">Hace 6 horas</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memoria</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.performance.memoryUsage}%</div>
                <p className="text-xs text-muted-foreground">Uso actual</p>
                <div className="mt-2">
                  <Progress value={overview.performance.memoryUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.performance.cpuUsage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Uso actual</p>
                <div className="mt-2">
                  <Progress value={overview.performance.cpuUsage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview.performance.cacheHitRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Hit rate</p>
                <div className="mt-2">
                  <Progress value={overview.performance.cacheHitRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Sistema de Alertas
              </CardTitle>
              <CardDescription>
                Alertas activas y recientes del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{overview.alerts.critical}</div>
                  <p className="text-sm text-gray-600">Críticas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{overview.alerts.active}</div>
                  <p className="text-sm text-gray-600">Activas</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{overview.alerts.total}</div>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>

              <div className="space-y-3">
                {overview.alerts.recent.length > 0 ? (
                  overview.alerts.recent.map((alert: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="text-xs text-gray-500">{alert.message}</p>
                      </div>
                      <Badge className={getStatusColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <p className="text-gray-500">No hay alertas activas</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Estado de Backups
              </CardTitle>
              <CardDescription>
                Información sobre los backups automáticos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {overview.backups.lastBackup !== 'Nunca' ?
                      new Date(overview.backups.lastBackup).toLocaleDateString() :
                      'Nunca'
                    }
                  </div>
                  <p className="text-sm text-gray-600">Último Backup</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold">{formatBytes(overview.backups.size)}</div>
                  <p className="text-sm text-gray-600">Tamaño</p>
                </div>
                <div className="text-center">
                  <Badge className={getStatusColor(overview.backups.status)}>
                    {overview.backups.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Estado</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Gestionar Backups
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs del Sistema
              </CardTitle>
              <CardDescription>
                Logs recientes y estadísticas de logging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">1,245</div>
                    <p className="text-sm text-gray-600">Logs Totales</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">892</div>
                    <p className="text-sm text-gray-600">Info</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-yellow-600">234</div>
                    <p className="text-sm text-gray-600">Warnings</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">119</div>
                    <p className="text-sm text-gray-600">Errors</p>
                  </div>
                </div>

                <div className="border rounded-lg">
                  <div className="p-4 border-b">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Logs Recientes</span>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <Badge className="bg-green-100 text-green-800">INFO</Badge>
                      <span className="flex-1">Usuario autenticado exitosamente</span>
                      <span className="text-gray-500">2 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge className="bg-yellow-100 text-yellow-800">WARN</Badge>
                      <span className="flex-1">Alto uso de memoria detectado</span>
                      <span className="text-gray-500">15 min ago</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge className="bg-red-100 text-red-800">ERROR</Badge>
                      <span className="flex-1">Error al procesar pago</span>
                      <span className="text-gray-500">1 hour ago</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Ver Todos los Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
