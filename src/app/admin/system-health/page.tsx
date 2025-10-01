'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Database,
  Server,
  Wifi,
  HardDrive,
  MemoryStick,
  Cpu,
  RefreshCw,
  Settings,
  Monitor,
  Shield,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown, Info } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface SystemComponent {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  responseTime: number;
  lastCheck: string;
  description: string;
  icon: any;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    status: 'healthy' | 'warning' | 'error';
  };
  memory: {
    usage: number;
    available: number;
    total: number;
    status: 'healthy' | 'warning' | 'error';
  };
  disk: {
    usage: number;
    available: number;
    total: number;
    status: 'healthy' | 'warning' | 'error';
  };
  database: {
    connections: number;
    maxConnections: number;
    status: 'healthy' | 'warning' | 'error';
  };
  network: {
    latency: number;
    bandwidth: number;
    status: 'healthy' | 'warning' | 'error';
  };
}

interface HealthAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  timestamp: string;
  resolved: boolean;
}

export default function AdminSystemHealth() {

  const [user, setUser] = useState<User | null>(null);

  const [components, setComponents] = useState<SystemComponent[]>([]);

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, status: 'healthy' },
    memory: { usage: 0, available: 0, total: 0, status: 'healthy' },
    disk: { usage: 0, available: 0, total: 0, status: 'healthy' },
    database: { connections: 0, maxConnections: 0, status: 'healthy' },
    network: { latency: 0, bandwidth: 0, status: 'healthy' },
  });

  const [alerts, setAlerts] = useState<HealthAlert[]>([]);

  const [loading, setLoading] = useState(true);

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadSystemHealth = async () => {
      try {
        // Mock system components data
        const mockComponents: SystemComponent[] = [
          {
            name: 'API Server',
            status: 'healthy',
            responseTime: 45,
            lastCheck: new Date().toISOString(),
            description: 'Servidor principal de la API',
            icon: <Server className="w-5 h-5" />,
          },
          {
            name: 'Database',
            status: 'healthy',
            responseTime: 12,
            lastCheck: new Date().toISOString(),
            description: 'Base de datos principal PostgreSQL',
            icon: <Database className="w-5 h-5" />,
          },
          {
            name: 'Redis Cache',
            status: 'healthy',
            responseTime: 3,
            lastCheck: new Date().toISOString(),
            description: 'Sistema de caché en memoria',
            icon: <MemoryStick className="w-5 h-5" />,
          },
          {
            name: 'File Storage',
            status: 'warning',
            responseTime: 120,
            lastCheck: new Date().toISOString(),
            description: 'Almacenamiento de archivos y medios',
            icon: <HardDrive className="w-5 h-5" />,
          },
          {
            name: 'Email Service',
            status: 'healthy',
            responseTime: 25,
            lastCheck: new Date().toISOString(),
            description: 'Servicio de envío de correos',
            icon: <Monitor className="w-5 h-5" />,
          },
          {
            name: 'Security Service',
            status: 'healthy',
            responseTime: 8,
            lastCheck: new Date().toISOString(),
            description: 'Servicio de autenticación y seguridad',
            icon: <Shield className="w-5 h-5" />,
          },
          {
            name: 'Payment Gateway',
            status: 'error',
            responseTime: 5000,
            lastCheck: new Date().toISOString(),
            description: 'Pasarela de pagos y transacciones',
            icon: <Zap className="w-5 h-5" />,
          },
          {
            name: 'CDN Service',
            status: 'healthy',
            responseTime: 15,
            lastCheck: new Date().toISOString(),
            description: 'Red de distribución de contenido',
            icon: <Wifi className="w-5 h-5" />,
          },
        ];

        // Mock system metrics
        const mockMetrics: SystemMetrics = {
          cpu: { usage: 65, status: 'warning' },
          memory: { usage: 78, available: 2.2, total: 10, status: 'warning' },
          disk: { usage: 45, available: 550, total: 1000, status: 'healthy' },
          database: { connections: 45, maxConnections: 100, status: 'healthy' },
          network: { latency: 25, bandwidth: 85, status: 'healthy' },
        };

        // Mock health alerts
        const mockAlerts: HealthAlert[] = [
          {
            id: '1',
            type: 'critical',
            title: 'Payment Gateway Offline',
            description: 'La pasarela de pagos no responde. Los pagos pueden fallar.',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            resolved: false,
          },
          {
            id: '2',
            type: 'warning',
            title: 'Alto uso de CPU',
            description: 'El uso de CPU ha alcanzado el 65%. Monitorear el rendimiento.',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            resolved: false,
          },
          {
            id: '3',
            type: 'warning',
            title: 'Memoria alta',
            description: 'El uso de memoria está al 78%. Considerar optimización.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            resolved: false,
          },
          {
            id: '4',
            type: 'info',
            title: 'Mantenimiento programado',
            description: 'Mantenimiento programado para el servidor de archivos.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            resolved: true,
          },
        ];

        setComponents(mockComponents);
        setMetrics(mockMetrics);
        setAlerts(mockAlerts);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (error) {
        logger.error('Error loading system health:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadSystemHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSystemHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Saludable</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      case 'info':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
return '0 B';
}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) {
return `Hace ${diffMins} minutos`;
}
    if (diffHours < 24) {
return `Hace ${diffHours} horas`;
}
    if (diffDays < 7) {
return `Hace ${diffDays} días`;
}
    
    return date.toLocaleDateString('es-CL');
  };

  const overallHealth = components.every(c => c.status === 'healthy') ? 'healthy' :
                       components.some(c => c.status === 'error') ? 'error' : 'warning';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estado del sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Salud del Sistema"
      subtitle="Monitorea el estado y rendimiento de todos los componentes"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with overall status */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${getStatusColor(overallHealth)}`}>
              {getStatusIcon(overallHealth)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Salud del Sistema</h1>
              <p className="text-gray-600">
                Estado general: {overallHealth === 'healthy' ? 'Saludable' : 
                               overallHealth === 'warning' ? 'Advertencia' : 'Crítico'}
              </p>
              <p className="text-xs text-gray-500">
                Última actualización: {formatRelativeTime(lastUpdated.toISOString())}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Configuración
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU</span>
                </div>
                {getStatusBadge(metrics.cpu.status)}
              </div>
              <div className="text-2xl font-bold">{metrics.cpu.usage}%</div>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                {metrics.cpu.usage > 80 ? <TrendingUp className="w-3 h-3 mr-1 text-red-600" /> : <TrendingDown className="w-3 h-3 mr-1 text-green-600" />}
                {metrics.cpu.usage > 80 ? 'Alto uso' : 'Normal'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Memoria</span>
                </div>
                {getStatusBadge(metrics.memory.status)}
              </div>
              <div className="text-2xl font-bold">{metrics.memory.usage}%</div>
              <div className="text-xs text-gray-500">
                {metrics.memory.available}GB disponible
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Disco</span>
                </div>
                {getStatusBadge(metrics.disk.status)}
              </div>
              <div className="text-2xl font-bold">{metrics.disk.usage}%</div>
              <div className="text-xs text-gray-500">
                {metrics.disk.available}GB disponible
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Base de Datos</span>
                </div>
                {getStatusBadge(metrics.database.status)}
              </div>
              <div className="text-2xl font-bold">{metrics.database.connections}</div>
              <div className="text-xs text-gray-500">
                de {metrics.database.maxConnections} conexiones
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">Red</span>
                </div>
                {getStatusBadge(metrics.network.status)}
              </div>
              <div className="text-2xl font-bold">{metrics.network.latency}ms</div>
              <div className="text-xs text-gray-500">
                {metrics.network.bandwidth}% ancho de banda
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Alertas Activas</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {alerts.filter(alert => !alert.resolved).map((alert) => (
              <Card key={alert.id} className={`border-l-4 ${getAlertColor(alert.type)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <Badge className={
                          alert.type === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {alert.type === 'critical' ? 'Crítico' :
                           alert.type === 'warning' ? 'Advertencia' : 'Info'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(alert.timestamp)}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Resolver
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Components */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Componentes del Sistema</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {components.map((component) => (
              <Card key={component.name} className={`border-l-4 ${getStatusColor(component.status)}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getStatusColor(component.status)}`}>
                        {component.icon}
                      </div>
                      <h3 className="font-medium text-sm">{component.name}</h3>
                    </div>
                    {getStatusBadge(component.status)}
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-3">{component.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Tiempo de respuesta:</span>
                      <span className={component.responseTime > 100 ? 'text-red-600' : 'text-green-600'}>
                        {component.responseTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Última verificación:</span>
                      <span>{formatRelativeTime(component.lastCheck)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
            <CardDescription>Detalles técnicos y configuración</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">Versión del Sistema</p>
                <p className="text-gray-600">Rent360 v2.1.0</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Tiempo de Actividad</p>
                <p className="text-gray-600">{formatUptime(86400 * 15)}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Zona Horaria</p>
                <p className="text-gray-600">America/Santiago</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Entorno</p>
                <p className="text-gray-600">Producción</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}
