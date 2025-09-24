import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw,
  AlertTriangle,
  HardDrive,
  Cpu,
  MemoryStick,
  Home,
  TrendingDown,
  Trash2,
  Activity,
  Clock,
  Database,
  Users,
  FileText,
  CreditCard,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemStats {
  timestamp: string;
  logging: {
    totalLogs: number;
    errors: number;
    warnings: number;
    info: number;
    debug: number;
    trace: number;
  };
  rateLimiting: {
    totalKeys: number;
    activeKeys: number;
    memoryUsage: number;
    redisConnected: boolean;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
    memoryUsage: number;
    hitRate: number;
  };
  database: {
    counts: {
      totalUsers: number;
      totalProperties: number;
      totalContracts: number;
      totalPayments: number;
      totalMaintenance: number;
      totalServiceJobs: number;
      totalNotifications: number;
      totalLogs: number;
    };
    active: {
      activeUsers: number;
      availableProperties: number;
      activeContracts: number;
      pendingPayments: number;
      pendingMaintenance: number;
      pendingServiceJobs: number;
      unreadNotifications: number;
    };
    byRole: Record<string, number>;
    logsByLevel: Record<string, number>;
  };
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
    uptime: number;
    memory: {
      total: number;
      free: number;
      used: number;
      process: {
        used: number;
        total: number;
        free: number;
        external: number;
        rss: number;
      };
    };
    cpu: {
      cores: number;
      loadAverage: number[];
    };
    environment: string;
    pid: number;
  };
  recentLogs: Array<{
    id: string;
    level: string;
    message: string;
    requestId?: string;
    userId?: string;
    ip?: string;
    path?: string;
    method?: string;
    duration?: number;
    createdAt: string;
  }>;
}

export default function SystemStats() {

  const [stats, setStats] = useState<SystemStats | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al obtener estadísticas',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al obtener estadísticas del sistema',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearOldLogs = async () => {
    try {
      const response = await fetch('/api/admin/system-stats?days=30', {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Éxito',
          description: `${data.deletedCount} logs antiguos eliminados`,
          variant: 'default'
        });
        fetchStats(); // Refrescar estadísticas
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al limpiar logs',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al limpiar logs antiguos',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {
return '0 B';
}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
return `${days}d ${hours}h ${minutes}m`;
}
    if (hours > 0) {
return `${hours}h ${minutes}m`;
}
    return `${minutes}m`;
  };

  const getLevelColor = (level: string): string => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARN': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'DEBUG': return 'bg-purple-100 text-purple-800';
      case 'TRACE': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Cargando estadísticas...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">No se pudieron cargar las estadísticas del sistema</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estadísticas del Sistema</h2>
          <p className="text-gray-600">
            Última actualización: {new Date(stats.timestamp).toLocaleString('es-CL')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setRefreshing(true);
              fetchStats();
            }}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            onClick={clearOldLogs}
            variant="outline"
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar Logs
          </Button>
        </div>
      </div>

      {/* Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">CPU</p>
                <p className="font-semibold">{stats.system.cpu.cores} cores</p>
                <p className="text-xs text-gray-500">
                  Load: {stats.system.cpu.loadAverage[0]?.toFixed(1) || '0.0'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MemoryStick className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Memoria</p>
                <p className="font-semibold">{formatBytes(stats.system.memory.used)}</p>
                <p className="text-xs text-gray-500">
                  {((stats.system.memory.used / stats.system.memory.total) * 100).toFixed(1)}% usado
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Proceso</p>
                <p className="font-semibold">{formatBytes(stats.system.memory.process.used)}</p>
                <p className="text-xs text-gray-500">
                  Heap: {formatBytes(stats.system.memory.process.total)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Uptime</p>
                <p className="font-semibold">{formatUptime(stats.system.uptime)}</p>
                <p className="text-xs text-gray-500">
                  PID: {stats.system.pid}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Base de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Base de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Usuarios</p>
                <p className="font-semibold">{stats.database.counts.totalUsers}</p>
                <p className="text-xs text-gray-500">
                  {stats.database.active.activeUsers} activos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Propiedades</p>
                <p className="font-semibold">{stats.database.counts.totalProperties}</p>
                <p className="text-xs text-gray-500">
                  {stats.database.active.availableProperties} disponibles
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Contratos</p>
                <p className="font-semibold">{stats.database.counts.totalContracts}</p>
                <p className="text-xs text-gray-500">
                  {stats.database.active.activeContracts} activos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pagos</p>
                <p className="font-semibold">{stats.database.counts.totalPayments}</p>
                <p className="text-xs text-gray-500">
                  {stats.database.active.pendingPayments} pendientes
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Usuarios por Rol</h4>
              <div className="space-y-1">
                {Object.entries(stats.database.byRole).map(([role, count]) => (
                  <div key={role} className="flex justify-between text-sm">
                    <span className="capitalize">{role.toLowerCase()}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Logs por Nivel</h4>
              <div className="space-y-1">
                {Object.entries(stats.database.logsByLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between text-sm">
                    <span className="capitalize">{level.toLowerCase()}</span>
                    <Badge className={getLevelColor(level)}>{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Actividad</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Mantenimiento</span>
                  <Badge variant="outline">{stats.database.active.pendingMaintenance} pendiente</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Servicios</span>
                  <Badge variant="outline">{stats.database.active.pendingServiceJobs} pendiente</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Notificaciones</span>
                  <Badge variant="outline">{stats.database.active.unreadNotifications} sin leer</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Claves activas</span>
                <Badge variant="outline">{stats.rateLimiting.activeKeys}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total de claves</span>
                <Badge variant="outline">{stats.rateLimiting.totalKeys}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Memoria</span>
                <span className="text-sm">{formatBytes(stats.rateLimiting.memoryUsage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Redis</span>
                <Badge className={stats.rateLimiting.redisConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {stats.rateLimiting.redisConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cache */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Caché
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Hit Rate</span>
                <Badge variant="outline">{stats.cache.hitRate.toFixed(1)}%</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Hits</span>
                <Badge variant="outline">{stats.cache.hits}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Misses</span>
                <Badge variant="outline">{stats.cache.misses}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Tamaño</span>
                <span className="text-sm">{stats.cache.size} entradas</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Memoria</span>
                <span className="text-sm">{formatBytes(stats.cache.memoryUsage)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Recientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs Recientes (Últimas 24h)
          </CardTitle>
          <CardDescription>
            Los últimos 50 logs del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-2 border rounded">
                <Badge className={getLevelColor(log.level)}>
                  {log.level}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    {log.path && (
                      <span className="flex items-center gap-1">
                        <span>{log.method} {log.path}</span>
                      </span>
                    )}
                    {log.duration && (
                      <span>{log.duration}ms</span>
                    )}
                    {log.ip && (
                      <span>{log.ip}</span>
                    )}
                    <span>{new Date(log.createdAt).toLocaleString('es-CL')}</span>
                  </div>
                </div>
              </div>
            ))}
            {stats.recentLogs.length === 0 && (
              <p className="text-center text-gray-500 py-4">No hay logs recientes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
