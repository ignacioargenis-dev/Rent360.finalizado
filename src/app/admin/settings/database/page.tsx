'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Database,
  Server,
  HardDrive,
  Activity,
  RefreshCw,
  Save,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface DatabaseSettings {
  host: string;
  port: number;
  database: string;
  username: string;
  connectionPool: {
    min: number;
    max: number;
    idleTimeout: number;
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    compression: boolean;
  };
  performance: {
    queryTimeout: number;
    slowQueryThreshold: number;
    cacheEnabled: boolean;
    cacheSize: number;
  };
  maintenance: {
    autoVacuum: boolean;
    autoAnalyze: boolean;
    maintenanceWindow: string;
  };
}

interface DatabaseMetrics {
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
  };
  storage: {
    used: number;
    total: number;
    tables: number;
    indexes: number;
  };
  performance: {
    queriesPerSecond: number;
    averageQueryTime: number;
    cacheHitRatio: number;
    deadTuplesRatio: number;
  };
  backups: {
    lastBackup: string;
    nextBackup: string;
    backupSize: number;
    successRate: number;
  };
}

export default function DatabaseSettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState<DatabaseSettings>({
    host: 'localhost',
    port: 5432,
    database: 'rent360_prod',
    username: 'rent360_user',
    connectionPool: {
      min: 2,
      max: 20,
      idleTimeout: 30000,
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30,
      compression: true,
    },
    performance: {
      queryTimeout: 30000,
      slowQueryThreshold: 1000,
      cacheEnabled: true,
      cacheSize: 512,
    },
    maintenance: {
      autoVacuum: true,
      autoAnalyze: true,
      maintenanceWindow: '02:00-04:00',
    },
  });

  const [metrics, setMetrics] = useState<DatabaseMetrics>({
    status: 'online',
    uptime: '7d 14h 32m',
    connections: {
      active: 12,
      idle: 8,
      total: 20,
      max: 50,
    },
    storage: {
      used: 2.4,
      total: 10,
      tables: 45,
      indexes: 23,
    },
    performance: {
      queriesPerSecond: 245,
      averageQueryTime: 45,
      cacheHitRatio: 94.5,
      deadTuplesRatio: 12.3,
    },
    backups: {
      lastBackup: '2024-12-05T02:00:00Z',
      nextBackup: '2024-12-06T02:00:00Z',
      backupSize: 1.2,
      successRate: 100,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadDatabaseMetrics();
  }, []);

  const loadDatabaseMetrics = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Metrics are already set in state
    } catch (error) {
      logger.error('Error al cargar métricas de base de datos', { error });
    }
  };

  const handleSettingChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setSettings(prev => ({
        ...prev,
        [parent as keyof typeof prev]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child as any]: value,
        },
      }));
    } else {
      setSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Configuración de base de datos guardada', { settings });
      setSuccessMessage('Configuración de base de datos guardada exitosamente');
    } catch (error) {
      logger.error('Error al guardar configuración de base de datos', { error });
      setErrorMessage('Error al guardar la configuración. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async () => {
    setIsLoading(true);
    try {
      // Simular connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSuccessMessage('Conexión a la base de datos exitosa');
    } catch (error) {
      setErrorMessage('Error al conectar con la base de datos');
    } finally {
      setIsLoading(false);
    }
  };

  const runMaintenance = async (type: 'vacuum' | 'analyze' | 'reindex') => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      setSuccessMessage(`Mantenimiento ${type} completado exitosamente`);
    } catch (error) {
      setErrorMessage(`Error al ejecutar mantenimiento ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createBackup = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 5000));
      setSuccessMessage('Backup creado exitosamente');
      // Update last backup time
      setMetrics(prev => ({
        ...prev,
        backups: {
          ...prev.backups,
          lastBackup: new Date().toISOString(),
        },
      }));
    } catch (error) {
      setErrorMessage('Error al crear backup');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">En Línea</Badge>;
      case 'offline':
        return <Badge variant="destructive">Fuera de Línea</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Mantenimiento</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
      return '0 B';
    }
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuración de Base de Datos</h1>
            <p className="text-gray-600">Gestión y monitoreo de la base de datos del sistema</p>
          </div>
          <Button onClick={loadDatabaseMetrics} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Estado de la Base de Datos */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Estado</p>
                  <div className="mt-1">{getStatusBadge(metrics.status)}</div>
                </div>
                <Database className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Uptime</p>
                  <p className="text-lg font-bold text-gray-900">{metrics.uptime}</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Conexiones Activas */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conexiones</p>
                  <p className="text-lg font-bold text-purple-600">
                    {metrics.connections.active}/{metrics.connections.max}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Uso de Almacenamiento */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Almacenamiento</p>
                  <p className="text-lg font-bold text-orange-600">
                    {metrics.storage.used}GB/{metrics.storage.total}GB
                  </p>
                  <Progress
                    value={(metrics.storage.used / metrics.storage.total) * 100}
                    className="mt-1"
                  />
                </div>
                <HardDrive className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Conexión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={settings.host}
                      onChange={e => handleSettingChange('host', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="port">Puerto</Label>
                    <Input
                      id="port"
                      type="number"
                      value={settings.port}
                      onChange={e => handleSettingChange('port', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="database">Base de Datos</Label>
                    <Input
                      id="database"
                      value={settings.database}
                      onChange={e => handleSettingChange('database', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Usuario</Label>
                    <Input
                      id="username"
                      value={settings.username}
                      onChange={e => handleSettingChange('username', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={testConnection} disabled={isLoading} variant="outline">
                    <Zap className="w-4 h-4 mr-2" />
                    Probar Conexión
                  </Button>
                  <Button onClick={saveSettings} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Pool de Conexiones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="poolMin">Mínimo</Label>
                  <Input
                    id="poolMin"
                    type="number"
                    value={settings.connectionPool.min}
                    onChange={e =>
                      handleSettingChange('connectionPool.min', parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="poolMax">Máximo</Label>
                  <Input
                    id="poolMax"
                    type="number"
                    value={settings.connectionPool.max}
                    onChange={e =>
                      handleSettingChange('connectionPool.max', parseInt(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="idleTimeout">Timeout Idle (ms)</Label>
                  <Input
                    id="idleTimeout"
                    type="number"
                    value={settings.connectionPool.idleTimeout}
                    onChange={e =>
                      handleSettingChange('connectionPool.idleTimeout', parseInt(e.target.value))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración de Backup */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Backup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="backupEnabled"
                  checked={settings.backup.enabled}
                  onCheckedChange={checked => handleSettingChange('backup.enabled', checked)}
                />
                <Label htmlFor="backupEnabled">Backups Automáticos</Label>
              </div>

              <div>
                <Label htmlFor="backupFrequency">Frecuencia</Label>
                <Select
                  value={settings.backup.frequency}
                  onValueChange={value => handleSettingChange('backup.frequency', value)}
                  disabled={!settings.backup.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupRetention">Retención (días)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={settings.backup.retention}
                    onChange={e =>
                      handleSettingChange('backup.retention', parseInt(e.target.value))
                    }
                    disabled={!settings.backup.enabled}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="backupCompression"
                    checked={settings.backup.compression}
                    onCheckedChange={checked => handleSettingChange('backup.compression', checked)}
                    disabled={!settings.backup.enabled}
                  />
                  <Label htmlFor="backupCompression">Compresión</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createBackup} disabled={isLoading} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Crear Backup Ahora
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rendimiento */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="queryTimeout">Timeout de Consultas (ms)</Label>
                <Input
                  id="queryTimeout"
                  type="number"
                  value={settings.performance.queryTimeout}
                  onChange={e =>
                    handleSettingChange('performance.queryTimeout', parseInt(e.target.value))
                  }
                />
              </div>

              <div>
                <Label htmlFor="slowQueryThreshold">Umbral Consulta Lenta (ms)</Label>
                <Input
                  id="slowQueryThreshold"
                  type="number"
                  value={settings.performance.slowQueryThreshold}
                  onChange={e =>
                    handleSettingChange('performance.slowQueryThreshold', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="cacheEnabled"
                  checked={settings.performance.cacheEnabled}
                  onCheckedChange={checked =>
                    handleSettingChange('performance.cacheEnabled', checked)
                  }
                />
                <Label htmlFor="cacheEnabled">Cache Habilitado</Label>
              </div>

              {settings.performance.cacheEnabled && (
                <div>
                  <Label htmlFor="cacheSize">Tamaño Cache (MB)</Label>
                  <Input
                    id="cacheSize"
                    type="number"
                    value={settings.performance.cacheSize}
                    onChange={e =>
                      handleSettingChange('performance.cacheSize', parseInt(e.target.value))
                    }
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mantenimiento */}
          <Card>
            <CardHeader>
              <CardTitle>Mantenimiento Automático</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoVacuum"
                  checked={settings.maintenance.autoVacuum}
                  onCheckedChange={checked =>
                    handleSettingChange('maintenance.autoVacuum', checked)
                  }
                />
                <Label htmlFor="autoVacuum">Auto Vacuum</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoAnalyze"
                  checked={settings.maintenance.autoAnalyze}
                  onCheckedChange={checked =>
                    handleSettingChange('maintenance.autoAnalyze', checked)
                  }
                />
                <Label htmlFor="autoAnalyze">Auto Analyze</Label>
              </div>

              <div>
                <Label htmlFor="maintenanceWindow">Ventana de Mantenimiento</Label>
                <Input
                  id="maintenanceWindow"
                  value={settings.maintenance.maintenanceWindow}
                  onChange={e =>
                    handleSettingChange('maintenance.maintenanceWindow', e.target.value)
                  }
                  placeholder="02:00-04:00"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => runMaintenance('vacuum')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Vacuum
                </Button>
                <Button
                  onClick={() => runMaintenance('analyze')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Analyze
                </Button>
                <Button
                  onClick={() => runMaintenance('reindex')}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  Reindex
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Información del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Version PostgreSQL</span>
                  <span className="text-sm font-medium">14.5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tablas</span>
                  <span className="text-sm font-medium">{metrics.storage.tables}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Índices</span>
                  <span className="text-sm font-medium">{metrics.storage.indexes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">QPS</span>
                  <span className="text-sm font-medium">
                    {metrics.performance.queriesPerSecond}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cache Hit Ratio</span>
                  <span className="text-sm font-medium">{metrics.performance.cacheHitRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dead Tuples</span>
                  <span className="text-sm font-medium">
                    {metrics.performance.deadTuplesRatio}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Último Backup */}
        <Card>
          <CardHeader>
            <CardTitle>Información de Backups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Último Backup</Label>
                <p className="text-sm text-gray-600">
                  {new Date(metrics.backups.lastBackup).toLocaleString('es-CL')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Próximo Backup</Label>
                <p className="text-sm text-gray-600">
                  {new Date(metrics.backups.nextBackup).toLocaleString('es-CL')}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tamaño</Label>
                <p className="text-sm text-gray-600">{metrics.backups.backupSize} GB</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Tasa de Éxito</Label>
                <p className="text-sm text-green-600 font-medium">{metrics.backups.successRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
