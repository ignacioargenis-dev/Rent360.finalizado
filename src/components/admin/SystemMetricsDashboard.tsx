'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  MemoryStick, // Corregido: Memory por MemoryStick
  Monitor, 
  RefreshCw, 
  Server, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Zap,
  Cpu,
  Network,
  HardDriveIcon
} from 'lucide-react';

interface SystemMetrics {
  summary: {
    overallStatus: 'healthy' | 'warning' | 'critical';
    healthScore: number;
    criticalIssues: number;
    warnings: number;
    recommendations: string[];
  };
  quickMetrics: {
    memoryUsage: number;
    cpuUsage: number;
    cacheHitRate: number;
    activeAlerts: number;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  };
  performance: {
    cache: {
      hitRate: number;
      memoryUsage: number;
      totalRequests: number;
      efficiency: 'excellent' | 'good' | 'poor';
    };
    rateLimiting: {
      blockedRequests: number;
      activeKeys: number;
      memoryUsage: number;
      efficiency: 'excellent' | 'good' | 'poor';
    };
    database: {
      status: string;
      connections: number;
      queryTime: number;
      slowQueries: number;
    };
  };
  systemInfo: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    environment: string;
    timestamp: number;
  };
  activeAlerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'critical';
    title: string;
    message: string;
    timestamp: number;
  }>;
}

const SystemMetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // Actualizar cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-metrics');
      
      if (!response.ok) {
        throw new Error('Error al obtener métricas del sistema');
      }

      const data = await response.json();
      setMetrics(data.data);
      setLastUpdate(new Date());
      setError(null);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/system-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });

      if (!response.ok) {
        throw new Error('Error al resolver alerta');
      }

      // Recargar métricas
      fetchMetrics();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resolver alerta');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEfficiencyColor = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getEfficiencyIcon = (efficiency: string) => {
    switch (efficiency) {
      case 'excellent': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'poor': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando métricas del sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Error: {error}</p>
          <Button onClick={fetchMetrics} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Métricas del Sistema</h1>
          <p className="text-gray-600">
            Monitoreo en tiempo real del rendimiento y salud del sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Resumen Ejecutivo */}
      <Card className="border-l-4 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resumen Ejecutivo
          </CardTitle>
          <CardDescription>
            Estado general del sistema y recomendaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold mb-1">{metrics.summary.healthScore}%</div>
              <div className="text-sm text-gray-600">Puntuación de Salud</div>
              <Badge className={`mt-2 ${getStatusColor(metrics.summary.overallStatus)}`}>
                {metrics.summary.overallStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 mb-1">
                {metrics.summary.criticalIssues}
              </div>
              <div className="text-sm text-gray-600">Problemas Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600 mb-1">
                {metrics.summary.warnings}
              </div>
              <div className="text-sm text-gray-600">Advertencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {metrics.activeAlerts.length}
              </div>
              <div className="text-sm text-gray-600">Alertas Activas</div>
            </div>
          </div>
          
          {metrics.summary.recommendations.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Recomendaciones:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {metrics.summary.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de Memoria</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quickMetrics.memoryUsage}%</div>
            <Progress value={metrics.quickMetrics.memoryUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.quickMetrics.memoryUsage > 80 ? 'Alto uso' : 'Uso normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de CPU</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quickMetrics.cpuUsage}%</div>
            <Progress value={metrics.quickMetrics.cpuUsage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.quickMetrics.cpuUsage > 70 ? 'Alto uso' : 'Uso normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quickMetrics.cacheHitRate}%</div>
            <Progress value={metrics.quickMetrics.cacheHitRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.quickMetrics.cacheHitRate > 80 ? 'Excelente' : 'Mejorable'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.quickMetrics.activeAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.quickMetrics.activeAlerts === 0 ? 'Sin alertas' : 'Requieren atención'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance del Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Performance del Cache
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Hit Rate</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{metrics.performance.cache.hitRate}%</span>
                {getEfficiencyIcon(metrics.performance.cache.efficiency)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uso de Memoria</span>
              <span className="font-bold">{metrics.performance.cache.memoryUsage} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de Requests</span>
              <span className="font-bold">{metrics.performance.cache.totalRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Eficiencia</span>
              <Badge className={getEfficiencyColor(metrics.performance.cache.efficiency)}>
                {metrics.performance.cache.efficiency.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Requests Bloqueados</span>
              <span className="font-bold text-red-600">{metrics.performance.rateLimiting.blockedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Claves Activas</span>
              <span className="font-bold">{metrics.performance.rateLimiting.activeKeys}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uso de Memoria</span>
              <span className="font-bold">{metrics.performance.rateLimiting.memoryUsage} MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Eficiencia</span>
              <Badge className={getEfficiencyColor(metrics.performance.rateLimiting.efficiency)}>
                {metrics.performance.rateLimiting.efficiency.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Versión Node.js</span>
              <p className="font-medium">{metrics.systemInfo.nodeVersion}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Plataforma</span>
              <p className="font-medium">{metrics.systemInfo.platform}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Arquitectura</span>
              <p className="font-medium">{metrics.systemInfo.arch}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Tiempo Activo</span>
              <p className="font-medium">{formatUptime(metrics.systemInfo.uptime)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Entorno</span>
              <p className="font-medium">{metrics.systemInfo.environment}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Última Actualización</span>
              <p className="font-medium">
                {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Activas */}
      {metrics.activeAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Alertas Activas
            </CardTitle>
            <CardDescription>
              Problemas que requieren atención inmediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical' ? 'border-red-500 bg-red-50' :
                    alert.type === 'error' ? 'border-orange-500 bg-orange-50' :
                    'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        className={
                          alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.type === 'error' ? 'bg-orange-100 text-orange-800' :
                          'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {alert.type.toUpperCase()}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemMetricsDashboard;
