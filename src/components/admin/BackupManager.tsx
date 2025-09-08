'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Download,
  Upload,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  HardDrive,
  Calendar,
  FileText
} from 'lucide-react';
import { useToast } from '@/components/notifications/NotificationSystem';

interface BackupResult {
  id: string;
  timestamp: string;
  type: 'manual' | 'daily' | 'weekly' | 'monthly';
  size: number;
  duration: number;
  status: 'success' | 'failed' | 'partial';
  path: string;
  error?: string;
}

interface BackupConfig {
  enabled: boolean;
  schedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    customCron?: string;
  };
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  storage: {
    local: boolean;
    remote: boolean;
  };
  compression: boolean;
  encryption: boolean;
}

interface BackupStats {
  total: number;
  successful: number;
  failed: number;
  byType: Record<string, number>;
  lastBackup: BackupResult | null;
  totalSize: number;
}

export default function BackupManager() {
  const [backups, setBackups] = useState<BackupResult[]>([]);
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const { success, error: showError } = useToast();

  const fetchBackupData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/backups');

      if (!response.ok) {
        throw new Error('Error obteniendo datos de backup');
      }

      const data = await response.json();
      setBackups(data.data.history);
      setConfig(data.data.config);
      setStats(data.data.stats);
    } catch (err) {
      showError('Error cargando datos de backup: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupData();
  }, []);

  const handleCreateBackup = async (type: 'manual' | 'daily' | 'weekly' | 'monthly') => {
    try {
      setCreatingBackup(true);
      const response = await fetch('/api/admin/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error creando backup');
      }

      const data = await response.json();
      success(data.message);

      // Actualizar lista de backups
      await fetchBackupData();
    } catch (err) {
      showError('Error creando backup: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleUpdateConfig = async (newConfig: Partial<BackupConfig>) => {
    try {
      const response = await fetch('/api/admin/backups/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error actualizando configuración');
      }

      const data = await response.json();
      success(data.message);
      setConfig(data.data);
    } catch (err) {
      showError('Error actualizando configuración: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    try {
      const response = await fetch('/api/admin/backups/restore', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error restaurando backup');
      }

      const data = await response.json();
      success(data.message);
    } catch (err) {
      showError('Error restaurando backup: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'partial': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'manual': return 'bg-blue-100 text-blue-800';
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-purple-100 text-purple-800';
      case 'monthly': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></RefreshCw>
          <p className="mt-2 text-gray-600">Cargando datos de backup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Backups</h1>
          <p className="text-gray-600">
            Administra los backups automáticos de la base de datos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchBackupData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => handleCreateBackup('manual')}
            disabled={creatingBackup}
          >
            {creatingBackup ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Crear Backup
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Backups</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exitosos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fallidos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <HardDrive className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tamaño Total</p>
                  <p className="text-2xl font-bold">{formatBytes(stats.totalSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Historial de Backups</TabsTrigger>
          <TabsTrigger value="config">Configuración</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          {backups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay backups disponibles</p>
                <Button
                  className="mt-4"
                  onClick={() => handleCreateBackup('manual')}
                  disabled={creatingBackup}
                >
                  Crear Primer Backup
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <Card key={backup.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(backup.status)}
                        <div>
                          <CardTitle className="text-lg">
                            Backup {backup.type.charAt(0).toUpperCase() + backup.type.slice(1)}
                          </CardTitle>
                          <CardDescription>
                            {new Date(backup.timestamp).toLocaleString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.status.toUpperCase()}
                        </Badge>
                        <Badge className={getTypeColor(backup.type)}>
                          {backup.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Tamaño</Label>
                        <p className="text-sm">{formatBytes(backup.size)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Duración</Label>
                        <p className="text-sm">{formatDuration(backup.duration)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">ID</Label>
                        <p className="text-sm font-mono text-xs">{backup.id}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Ubicación</Label>
                        <p className="text-sm font-mono text-xs truncate">{backup.path}</p>
                      </div>
                    </div>

                    {backup.error && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{backup.error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestoreBackup(backup.id)}
                        disabled={backup.status !== 'success'}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          {config && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Backup</CardTitle>
                <CardDescription>
                  Configura el comportamiento del sistema de backup automático
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Sistema Habilitado</Label>
                    <p className="text-sm text-gray-600">Activar/desactivar backups automáticos</p>
                  </div>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(enabled) => handleUpdateConfig({ enabled })}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Programación</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="daily">Backup Diario</Label>
                      <Switch
                        id="daily"
                        checked={config.schedule.daily}
                        onCheckedChange={(daily) => handleUpdateConfig({
                          schedule: { ...config.schedule, daily }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="weekly">Backup Semanal</Label>
                      <Switch
                        id="weekly"
                        checked={config.schedule.weekly}
                        onCheckedChange={(weekly) => handleUpdateConfig({
                          schedule: { ...config.schedule, weekly }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="monthly">Backup Mensual</Label>
                      <Switch
                        id="monthly"
                        checked={config.schedule.monthly}
                        onCheckedChange={(monthly) => handleUpdateConfig({
                          schedule: { ...config.schedule, monthly }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Retención (días)</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="daily-retention">Diarios</Label>
                      <Input
                        id="daily-retention"
                        type="number"
                        value={config.retention.daily}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, daily: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="weekly-retention">Semanales</Label>
                      <Input
                        id="weekly-retention"
                        type="number"
                        value={config.retention.weekly}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, weekly: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="monthly-retention">Mensuales</Label>
                      <Input
                        id="monthly-retention"
                        type="number"
                        value={config.retention.monthly}
                        onChange={(e) => handleUpdateConfig({
                          retention: { ...config.retention, monthly: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Opciones Avanzadas</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compression">Compresión</Label>
                      <Switch
                        id="compression"
                        checked={config.compression}
                        onCheckedChange={(compression) => handleUpdateConfig({ compression })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="encryption">Encriptación</Label>
                      <Switch
                        id="encryption"
                        checked={config.encryption}
                        onCheckedChange={(encryption) => handleUpdateConfig({ encryption })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <Badge className={getTypeColor(type)}>{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Último Backup</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.lastBackup ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Fecha:</span>
                        <span>{new Date(stats.lastBackup.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <Badge className={getTypeColor(stats.lastBackup.type)}>
                          {stats.lastBackup.type}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Estado:</span>
                        <Badge className={getStatusColor(stats.lastBackup.status)}>
                          {stats.lastBackup.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamaño:</span>
                        <span>{formatBytes(stats.lastBackup.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duración:</span>
                        <span>{formatDuration(stats.lastBackup.duration)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay backups disponibles</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
