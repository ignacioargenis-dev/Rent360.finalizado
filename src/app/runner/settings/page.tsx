'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Database,
  Download,
  Upload,
  RefreshCw,
  Calendar,
  Clock,
  HardDrive,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  Trash2, Eye, Play,
  Pause,
  Archive,
  Cloud,
  Server,
  Plus, Info
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';


interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'database' | 'files';
  size: number;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  createdAt: string;
  completedAt?: string;
  location: 'local' | 'cloud' | 'both';
  description: string;
  retentionDays: number;
  encrypted: boolean;
  checksum?: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: string;
  nextBackup: string;
  successRate: number;
  storageUsed: number;
  storageAvailable: number;
}

interface BackupSchedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  type: 'full' | 'incremental';
  enabled: boolean;
  nextRun: string;
  retention: number;
}

export default function RunnerSettingsPage() {

  const [user, setUser] = useState<User | null>(null);

  const [backups, setBackups] = useState<Backup[]>([]);

  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);

  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: '',
    nextBackup: '',
    successRate: 0,
    storageUsed: 0,
    storageAvailable: 0,
  });

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
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    const loadBackupData = async () => {
      try {
        // Mock backups data
        const mockBackups: Backup[] = [
          {
            id: '1',
            name: 'Backup Completo Diario',
            type: 'full',
            size: 2.5 * 1024 * 1024 * 1024, // 2.5 GB
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
            location: 'both',
            description: 'Backup completo del sistema incluyendo base de datos y archivos',
            retentionDays: 30,
            encrypted: true,
            checksum: 'a1b2c3d4e5f6...',
          },
          {
            id: '2',
            name: 'Backup Incremental',
            type: 'incremental',
            size: 150 * 1024 * 1024, // 150 MB
            status: 'completed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            completedAt: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
            location: 'cloud',
            description: 'Backup incremental con cambios desde el último backup completo',
            retentionDays: 7,
            encrypted: true,
          },
          {
            id: '3',
            name: 'Backup Base de Datos',
            type: 'database',
            size: 450 * 1024 * 1024, // 450 MB
            status: 'in_progress',
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            location: 'local',
            description: 'Backup exclusivo de la base de datos PostgreSQL',
            retentionDays: 14,
            encrypted: true,
          },
          {
            id: '4',
            name: 'Backup Archivos',
            type: 'files',
            size: 1.8 * 1024 * 1024 * 1024, // 1.8 GB
            status: 'failed',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            location: 'cloud',
            description: 'Backup de archivos de usuario y medios',
            retentionDays: 21,
            encrypted: true,
          },
          {
            id: '5',
            name: 'Backup Programado',
            type: 'full',
            size: 0,
            status: 'scheduled',
            createdAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
            location: 'both',
            description: 'Backup completo programado automáticamente',
            retentionDays: 30,
            encrypted: true,
          },
        ];

        // Mock schedules
        const mockSchedules: BackupSchedule[] = [
          {
            id: '1',
            name: 'Backup Diario Completo',
            frequency: 'daily',
            time: '02:00',
            type: 'full',
            enabled: true,
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
            retention: 30,
          },
          {
            id: '2',
            name: 'Backup Incremental Horario',
            frequency: 'daily',
            time: '06:00, 12:00, 18:00',
            type: 'incremental',
            enabled: true,
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 1).toISOString(),
            retention: 7,
          },
          {
            id: '3',
            name: 'Backup Semanal',
            frequency: 'weekly',
            time: 'domingo 03:00',
            type: 'full',
            enabled: true,
            nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
            retention: 90,
          },
        ];

        setBackups(mockBackups);
        setSchedules(mockSchedules);

        // Calculate stats
        const completedBackups = mockBackups.filter(b => b.status === 'completed');
        const totalSize = completedBackups.reduce((sum, backup) => sum + backup.size, 0);
        const successRate = completedBackups.length > 0 ? 
          (completedBackups.length / mockBackups.length) * 100 : 0;

        const backupStats: BackupStats = {
          totalBackups: mockBackups.length,
          totalSize,
          lastBackup: completedBackups.length > 0 ?
            completedBackups[completedBackups.length - 1]?.completedAt || '' : '',
          nextBackup: mockBackups.find(b => b.status === 'scheduled')?.createdAt || '',
          successRate,
          storageUsed: totalSize,
          storageAvailable: 10 * 1024 * 1024 * 1024 * 1024, // 10 TB
        };

        setStats(backupStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading backup data:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadBackupData();
  }, []);

  const createBackup = async (type: 'full' | 'incremental' | 'database' | 'files') => {
    const newBackup: Backup = {
      id: Date.now().toString(),
      name: `Backup ${type === 'full' ? 'Completo' : type === 'incremental' ? 'Incremental' : type === 'database' ? 'Base de Datos' : 'Archivos'}`,
      type,
      size: 0,
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      location: 'both',
      description: `Backup ${type} iniciado manualmente`,
      retentionDays: 30,
      encrypted: true,
    };

    setBackups(prev => [newBackup, ...prev]);
  };

  const deleteBackup = async (backupId: string) => {
    setBackups(prev => prev.filter(backup => backup.id !== backupId));
  };

  const toggleSchedule = async (scheduleId: string) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule,
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'scheduled':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-100 text-yellow-800">Programado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <Archive className="w-5 h-5" />;
      case 'incremental':
        return <RefreshCw className="w-5 h-5" />;
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'files':
        return <HardDrive className="w-5 h-5" />;
      default:
        return <Database className="w-5 h-5" />;
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'local':
        return <Server className="w-4 h-4" />;
      case 'cloud':
        return <Cloud className="w-4 h-4" />;
      case 'both':
        return <div className="flex gap-1">
          <Server className="w-4 h-4" />
          <Cloud className="w-4 h-4" />
        </div>;
      default:
        return <Server className="w-4 h-4" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
return '0 B';
}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de backups...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout title="Configuración" subtitle="Gestión de perfil y preferencias">
            <div className="container mx-auto px-4 py-6">
              {/* Header with actions */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                  <p className="text-gray-600">Gestiona y monitorea todas las copias de seguridad del sistema</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => createBackup('full')}>
                    <Play className="w-4 h-4 mr-2" />
                    Backup Completo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => createBackup('incremental')}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Backup Incremental
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Backups</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalBackups}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Archive className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Almacenamiento</p>
                        <p className="text-2xl font-bold text-gray-900">{formatBytes(stats.totalSize)}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HardDrive className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Próximo Backup</p>
                        <p className="text-sm font-bold text-gray-900">
                          {stats.nextBackup ? formatRelativeTime(stats.nextBackup) : 'No programado'}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Backup List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Historial de Backups</CardTitle>
                      <CardDescription>Todas las copias de seguridad realizadas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {backups.map((backup) => (
                          <Card key={backup.id} className={`border-l-4 ${getStatusColor(backup.status)}`}>
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`p-2 rounded-lg ${getStatusColor(backup.status)}`}>
                                    {getTypeIcon(backup.type)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-gray-900">{backup.name}</h3>
                                      {getStatusBadge(backup.status)}
                                      {backup.encrypted && (
                                        <Badge className="bg-blue-100 text-blue-800">
                                    <Shield className="w-3 h-3 mr-1" />
                                    Encriptado
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{backup.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <HardDrive className="w-3 h-3" />
                                  <span>{formatBytes(backup.size)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {getLocationIcon(backup.location)}
                                  <span className="capitalize">{backup.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatRelativeTime(backup.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{backup.retentionDays} días retención</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {backup.status === 'completed' && (
                              <Button size="sm" variant="outline">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteBackup(backup.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Backup Schedules */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Programación</CardTitle>
                <CardDescription>Backups automáticos programados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedules.map((schedule) => (
                    <Card key={schedule.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-sm">{schedule.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {schedule.frequency === 'daily' ? 'Diario' : 
                                 schedule.frequency === 'weekly' ? 'Semanal' : 'Mensual'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {schedule.type === 'full' ? 'Completo' : 'Incremental'}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={schedule.enabled ? 'default' : 'outline'}
                            onClick={() => toggleSchedule(schedule.id)}
                          >
                            {schedule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Horario:</span>
                            <span>{schedule.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Próxima ejecución:</span>
                            <span>{formatRelativeTime(schedule.nextRun)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Retención:</span>
                            <span>{schedule.retention} días</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Programación
                </Button>
              </CardContent>
            </Card>

            {/* Storage Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Almacenamiento</CardTitle>
                <CardDescription>Uso y disponibilidad de almacenamiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Usado</span>
                      <span>{formatBytes(stats.storageUsed)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(stats.storageUsed / stats.storageAvailable) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Disponible:</span>
                      <span>{formatBytes(stats.storageAvailable - stats.storageUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total:</span>
                      <span>{formatBytes(stats.storageAvailable)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}


