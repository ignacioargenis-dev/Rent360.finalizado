'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Progress } from '@/components/ui/progress';
import {
  Database,
  HardDrive,
  Activity,
  Clock,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  databaseSize: string;
  lastBackup: string;
  connections: number;
  queriesPerSecond: number;
  slowQueries: number;
  cacheHitRate: number;
}

interface TableInfo {
  name: string;
  records: number;
  size: string;
  lastModified: string;
  indexes: number;
}

interface PerformanceMetric {
  metric: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

export default function AdminDatabaseStatsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DatabaseStats>({
    totalTables: 0,
    totalRecords: 0,
    databaseSize: '0 MB',
    lastBackup: '',
    connections: 0,
    queriesPerSecond: 0,
    slowQueries: 0,
    cacheHitRate: 0,
  });
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);

  useEffect(() => {
    loadDatabaseStats();
  }, []);

  const loadDatabaseStats = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      setStats({
        totalTables: 45,
        totalRecords: 1250000,
        databaseSize: '2.4 GB',
        lastBackup: '2024-12-15 02:00:00',
        connections: 23,
        queriesPerSecond: 1450,
        slowQueries: 3,
        cacheHitRate: 94.2,
      });

      setTables([
        {
          name: 'users',
          records: 15420,
          size: '45.2 MB',
          lastModified: '2024-12-15 14:30:00',
          indexes: 5,
        },
        {
          name: 'properties',
          records: 3250,
          size: '128.7 MB',
          lastModified: '2024-12-15 14:25:00',
          indexes: 8,
        },
        {
          name: 'contracts',
          records: 8900,
          size: '67.3 MB',
          lastModified: '2024-12-15 14:20:00',
          indexes: 6,
        },
        {
          name: 'payments',
          records: 45600,
          size: '234.1 MB',
          lastModified: '2024-12-15 14:15:00',
          indexes: 9,
        },
        {
          name: 'maintenance',
          records: 12800,
          size: '89.6 MB',
          lastModified: '2024-12-15 14:10:00',
          indexes: 7,
        },
      ]);

      setPerformance([
        { metric: 'CPU Usage', value: '23%', status: 'good', trend: 'stable' },
        { metric: 'Memory Usage', value: '67%', status: 'warning', trend: 'up' },
        { metric: 'Disk I/O', value: '156 MB/s', status: 'good', trend: 'stable' },
        { metric: 'Network I/O', value: '45 MB/s', status: 'good', trend: 'down' },
        { metric: 'Query Response Time', value: '120ms', status: 'good', trend: 'stable' },
        { metric: 'Connection Pool Usage', value: '78%', status: 'warning', trend: 'up' },
      ]);
    } catch (error) {
      logger.error('Error al cargar estadísticas de base de datos', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimizeDatabase = () => {
    // Simulate database optimization
    logger.info('Optimización de base de datos iniciada');
    alert('Optimización de base de datos completada exitosamente.');
  };

  const handleBackupDatabase = () => {
    // Simulate database backup
    logger.info('Respaldo de base de datos iniciado');
    alert('Respaldo de base de datos creado exitosamente.');
  };

  const handleClearCache = () => {
    // Simulate cache clearing
    logger.info('Limpieza de caché iniciada');
    alert('Caché limpiado exitosamente.');
  };

  const handleExportStats = () => {
    const csvContent = [
      ['Métrica', 'Valor', 'Estado', 'Tendencia'],
      ...performance.map(metric => [metric.metric, metric.value, metric.status, metric.trend]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `estadisticas-base-datos-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Estadísticas de base de datos exportadas');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-500">Bueno</Badge>;
      case 'warning':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Advertencia
          </Badge>
        );
      case 'critical':
        return <Badge variant="destructive">Crítico</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <span className="text-red-500">↑</span>;
      case 'down':
        return <span className="text-green-500">↓</span>;
      case 'stable':
        return <span className="text-blue-500">→</span>;
      default:
        return <span>{trend}</span>;
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando estadísticas de base de datos...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estadísticas de Base de Datos</h1>
            <p className="text-gray-600">
              Monitoreo y análisis del rendimiento de la base de datos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDatabaseStats} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportStats}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="tables">Tablas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Database Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Tablas</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTables}</p>
                    </div>
                    <Database className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Registros</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalRecords.toLocaleString()}
                      </p>
                    </div>
                    <HardDrive className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tamaño DB</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.databaseSize}</p>
                    </div>
                    <Activity className="w-12 h-12 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Conexiones</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.connections}</p>
                    </div>
                    <Clock className="w-12 h-12 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Queries/segundo</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.queriesPerSecond}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Queries Lentos</p>
                      <p className="text-2xl font-bold text-red-600">{stats.slowQueries}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                      <p className="text-2xl font-bold text-green-600">{stats.cacheHitRate}%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Last Backup Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de Respaldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Último Respaldo</p>
                    <p className="text-lg font-semibold">{stats.lastBackup}</p>
                  </div>
                  <Button onClick={handleBackupDatabase}>
                    <Database className="w-4 h-4 mr-2" />
                    Crear Respaldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {performance.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="font-medium">{metric.metric}</div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(metric.status)}
                          {getTrendIcon(metric.trend)}
                        </div>
                      </div>
                      <div className="font-semibold text-lg">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={handleOptimizeDatabase} className="h-20">
                    <Database className="w-6 h-6 mr-2" />
                    Optimizar Base de Datos
                  </Button>
                  <Button onClick={handleBackupDatabase} variant="outline" className="h-20">
                    <HardDrive className="w-6 h-6 mr-2" />
                    Crear Respaldo
                  </Button>
                  <Button onClick={handleClearCache} variant="outline" className="h-20">
                    <RefreshCw className="w-6 h-6 mr-2" />
                    Limpiar Caché
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de Tablas</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Registros</TableHead>
                      <TableHead>Tamaño</TableHead>
                      <TableHead>Índices</TableHead>
                      <TableHead>Última Modificación</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((table, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{table.name}</TableCell>
                        <TableCell>{table.records.toLocaleString()}</TableCell>
                        <TableCell>{table.size}</TableCell>
                        <TableCell>{table.indexes}</TableCell>
                        <TableCell>{table.lastModified}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
