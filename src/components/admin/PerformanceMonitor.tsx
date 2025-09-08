'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface PerformanceMetrics {
  timestamp: number;
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    loadAverage: number;
  };
  database: {
    status: string;
    queryTime: number;
    slowQueries: number;
    connections: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictions: number;
    efficiency: string;
  };
  rateLimiting: {
    blockedRequests: number;
    activeKeys: number;
    memoryUsage: number;
  };
  api: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    throughput: number;
  };
  events: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  alerts: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  health: {
    current: any;
    history: any[];
  };
  summary?: {
    overallStatus: string;
    systemScore: number;
    issues: string[];
    recommendations: string[];
  };
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { success, error: showError } = useToast();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/performance?detailed=true');

      if (!response.ok) {
        throw new Error('Error obteniendo métricas de performance');
      }

      const data = await response.json();
      setMetrics(data.data);
    } catch (err) {
      showError('Error cargando métricas de performance: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

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

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></RefreshCw>
          <p className="mt-2 text-gray-600">Cargando métricas de performance...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No se pudieron cargar las métricas de performance.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Monitoreo de Performance</h1>
          <p className="text-gray-600">
            Métricas en tiempo real del sistema Rent360
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      {metrics.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(metrics.summary.overallStatus)}
              Estado del Sistema
            </CardTitle>
            <CardDescription>
              Puntuación general: {metrics.summary.systemScore}/100
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge className={getStatusColor(metrics.summary.overallStatus)}>
                {metrics.summary.overallStatus.toUpperCase()}
              </Badge>
              <div className="flex-1">
                <Progress value={metrics.summary.systemScore} className="h-2" />
              </div>
            </div>

            {metrics.summary.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-600 mb-2">Problemas Detectados:</h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {metrics.summary.issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            {metrics.summary.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Recomendaciones:</h4>
                <ul className="list-disc list-inside text-sm text-blue-600">
                  {metrics.summary.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* System Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Memoria:</span>
                <span className={metrics.system.memoryUsage > 80 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.system.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.system.memoryUsage} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>CPU:</span>
                <span className={metrics.system.cpuUsage > 70 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.system.cpuUsage.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.system.cpuUsage} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Uptime:</span>
                <span>{formatUptime(metrics.system.uptime)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estado:</span>
                <Badge className={getStatusColor(metrics.database.status)}>
                  {metrics.database.status}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tiempo Query:</span>
                <span>{metrics.database.queryTime.toFixed(0)}ms</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Consultas Lentas:</span>
                <span className={metrics.database.slowQueries > 5 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.database.slowQueries}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Conexiones:</span>
                <span>{metrics.database.connections}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Hit Rate:</span>
                <span className={metrics.cache.hitRate < 70 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.cache.hitRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.cache.hitRate} className="h-2" />

              <div className="flex justify-between text-sm">
                <span>Memoria:</span>
                <span>{formatBytes(metrics.cache.memoryUsage)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Evictions:</span>
                <span>{metrics.cache.evictions}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Eficiencia:</span>
                <Badge className={
                  metrics.cache.efficiency === 'excellent' ? 'bg-green-100 text-green-800' :
                  metrics.cache.efficiency === 'good' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }>
                  {metrics.cache.efficiency}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time:</span>
                <span className={metrics.api.averageResponseTime > 1000 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.api.averageResponseTime.toFixed(0)}ms
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Requests/sec:</span>
                <span>{metrics.api.requestsPerSecond.toFixed(1)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Error Rate:</span>
                <span className={metrics.api.errorRate > 2 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.api.errorRate.toFixed(1)}%
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Throughput:</span>
                <span>{metrics.api.throughput.toFixed(1)} req/s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span>{metrics.events.total}</span>
              </div>

              <div className="space-y-1">
                {Object.entries(metrics.events.byType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="capitalize">{type}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total:</span>
                <span>{metrics.alerts.total}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Activas:</span>
                <span className={metrics.alerts.active > 0 ? 'text-red-600' : 'text-green-600'}>
                  {metrics.alerts.active}
                </span>
              </div>

              <div className="space-y-1">
                {Object.entries(metrics.alerts.byType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-xs">
                    <span className="capitalize">{type.replace('_', ' ')}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle>Rate Limiting</CardTitle>
          <CardDescription>
            Control de tasa de requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {metrics.rateLimiting.blockedRequests}
              </div>
              <p className="text-sm text-gray-600">Requests Bloqueados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {metrics.rateLimiting.activeKeys}
              </div>
              <p className="text-sm text-gray-600">Keys Activas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(metrics.rateLimiting.memoryUsage)}
              </div>
              <p className="text-sm text-gray-600">Memoria Usada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
