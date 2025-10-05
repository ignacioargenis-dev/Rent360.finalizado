'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Zap,
  Cpu,
  Server,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function EstadísticasdeBasedeDatosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [databaseStats, setDatabaseStats] = useState<any>({
    overview: {
      totalTables: 45,
      totalRecords: 125430,
      databaseSize: '2.3 GB',
      connections: 23,
      uptime: '15d 8h 32m',
      version: 'PostgreSQL 15.4',
    },
    performance: {
      avgQueryTime: 45,
      slowQueries: 12,
      cacheHitRate: 94.2,
      activeConnections: 8,
      idleConnections: 15,
      waitingQueries: 2,
    },
    tables: [
      {
        name: 'users',
        records: 2341,
        size: '45.2 MB',
        growth: '+5.2%',
        lastModified: '2024-01-15T10:30:00',
      },
      {
        name: 'properties',
        records: 1256,
        size: '89.7 MB',
        growth: '+12.8%',
        lastModified: '2024-01-15T09:45:00',
      },
      {
        name: 'contracts',
        records: 892,
        size: '34.1 MB',
        growth: '+8.9%',
        lastModified: '2024-01-15T08:20:00',
      },
      {
        name: 'payments',
        records: 3456,
        size: '156.3 MB',
        growth: '+15.4%',
        lastModified: '2024-01-15T11:15:00',
      },
      {
        name: 'maintenance_requests',
        records: 567,
        size: '23.8 MB',
        growth: '+22.1%',
        lastModified: '2024-01-15T07:30:00',
      },
      {
        name: 'providers',
        records: 189,
        size: '12.4 MB',
        growth: '+3.7%',
        lastModified: '2024-01-14T16:45:00',
      },
      {
        name: 'tickets',
        records: 1234,
        size: '67.9 MB',
        growth: '+9.8%',
        lastModified: '2024-01-15T12:00:00',
      },
      {
        name: 'ratings',
        records: 2156,
        size: '41.2 MB',
        growth: '+18.3%',
        lastModified: '2024-01-15T10:00:00',
      },
    ],
    queries: [
      {
        query: 'SELECT * FROM users WHERE active = true',
        count: 1247,
        avgTime: 25,
        lastExecuted: '2024-01-15T12:30:00',
      },
      {
        query: 'SELECT * FROM properties WHERE city = $1',
        count: 892,
        avgTime: 45,
        lastExecuted: '2024-01-15T11:45:00',
      },
      {
        query: 'INSERT INTO payments (amount, user_id, ...) VALUES (...)',
        count: 456,
        avgTime: 12,
        lastExecuted: '2024-01-15T12:15:00',
      },
      {
        query: 'SELECT COUNT(*) FROM contracts WHERE status = $1',
        count: 2341,
        avgTime: 8,
        lastExecuted: '2024-01-15T12:00:00',
      },
      {
        query: 'UPDATE users SET last_login = NOW() WHERE id = $1',
        count: 3456,
        avgTime: 15,
        lastExecuted: '2024-01-15T12:45:00',
      },
    ],
    storage: {
      used: 2.3,
      total: 10,
      growth: '+12.5%',
      backups: 15,
      lastBackup: '2024-01-15T02:00:00',
    },
  });

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock database stats overview data
      const overviewData = {
        totalTables: databaseStats.overview.totalTables,
        totalRecords: databaseStats.overview.totalRecords,
        databaseSize: databaseStats.overview.databaseSize,
        connections: databaseStats.overview.connections,
        avgQueryTime: databaseStats.performance.avgQueryTime,
        cacheHitRate: databaseStats.performance.cacheHitRate,
      };

      setData(overviewData);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeDatabase = () => {
    setSuccessMessage('Optimización de base de datos iniciada. Esto puede tomar varios minutos.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRunBackup = () => {
    setSuccessMessage('Backup de base de datos iniciado. Se notificará cuando termine.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleClearCache = () => {
    setSuccessMessage('Caché de base de datos limpiado exitosamente.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportStats = () => {
    const csvContent = [['Tabla', 'Registros', 'Tamaño', 'Crecimiento', 'Última Modificación']];

    databaseStats.tables.forEach((table: any) => {
      csvContent.push([
        table.name,
        table.records.toString(),
        table.size,
        table.growth,
        new Date(table.lastModified).toLocaleDateString('es-CL'),
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `estadisticas_base_datos_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (rate: number) => {
    if (rate >= 95) {
      return 'text-green-600';
    }
    if (rate >= 85) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout
        title="Estadísticas de Base de Datos"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        title="Estadísticas de Base de Datos"
        subtitle="Error al cargar la página"
      >
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Estadísticas de Base de Datos"
      subtitle="Monitoreo y análisis del rendimiento de la base de datos"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header con estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tablas</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalTables || 0}</div>
              <p className="text-xs text-muted-foreground">Estructuras de datos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registros</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalRecords?.toLocaleString() || 0}</div>
              <p className="text-xs text-muted-foreground">+8.5% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamaño DB</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.databaseSize || '0 GB'}</div>
              <p className="text-xs text-muted-foreground">+12.3% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conexiones</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.connections || 0}</div>
              <p className="text-xs text-muted-foreground">Activas actualmente</p>
            </CardContent>
          </Card>
        </div>

        {/* Sistema de pestañas para métricas detalladas */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">General</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="tables">Tablas</TabsTrigger>
            <TabsTrigger value="queries">Consultas</TabsTrigger>
            <TabsTrigger value="storage">Almacenamiento</TabsTrigger>
          </TabsList>

          {/* Vista General */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Información del Sistema</CardTitle>
                  <CardDescription>Detalles técnicos de la base de datos</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Versión:</span>
                    <Badge variant="outline">{databaseStats.overview.version}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tiempo activo:</span>
                    <span className="text-sm text-gray-600">{databaseStats.overview.uptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conexiones activas:</span>
                    <span className="text-sm text-gray-600">
                      {databaseStats.performance.activeConnections}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conexiones idle:</span>
                    <span className="text-sm text-gray-600">
                      {databaseStats.performance.idleConnections}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Rendimiento</CardTitle>
                  <CardDescription>Indicadores clave de rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Tiempo promedio de consulta:</span>
                    <span className="text-sm text-gray-600">
                      {databaseStats.performance.avgQueryTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cache Hit Rate:</span>
                    <span
                      className={`text-sm font-medium ${getHealthColor(databaseStats.performance.cacheHitRate)}`}
                    >
                      {databaseStats.performance.cacheHitRate}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Consultas lentas (24h):</span>
                    <span className="text-sm text-gray-600">
                      {databaseStats.performance.slowQueries}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Consultas en espera:</span>
                    <span className="text-sm text-gray-600">
                      {databaseStats.performance.waitingQueries}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Rendimiento */}
          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tiempos de Respuesta</CardTitle>
                  <CardDescription>Latencia de consultas por hora</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Promedio</span>
                      <span className="font-medium">
                        {databaseStats.performance.avgQueryTime}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Mínimo</span>
                      <span className="font-medium">5ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Máximo</span>
                      <span className="font-medium">245ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Percentil 95</span>
                      <span className="font-medium">89ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado del Cache</CardTitle>
                  <CardDescription>Eficiencia del sistema de caché</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Cache Hit Rate</span>
                        <span className={getHealthColor(databaseStats.performance.cacheHitRate)}>
                          {databaseStats.performance.cacheHitRate}%
                        </span>
                      </div>
                      <Progress value={databaseStats.performance.cacheHitRate} className="h-2" />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Hit: 1,247,892 consultas</div>
                      <div>Miss: 76,543 consultas</div>
                      <div>Ratio: 94.2%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Conexiones Activas</CardTitle>
                  <CardDescription>Estado de conexiones a la base de datos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {databaseStats.performance.activeConnections}
                      </div>
                      <div className="text-sm text-gray-600">Activas</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Idle</span>
                        <span>{databaseStats.performance.idleConnections}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>En espera</span>
                        <span>{databaseStats.performance.waitingQueries}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total</span>
                        <span>{databaseStats.overview.connections}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tablas */}
          <TabsContent value="tables">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Tablas</CardTitle>
                <CardDescription>
                  Información detallada de cada tabla en la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {databaseStats.tables.map((table: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Database className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">{table.name}</span>
                          <Badge variant="outline">
                            {table.records.toLocaleString()} registros
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Tamaño:</span> {table.size}
                          </div>
                          <div>
                            <span className="font-medium">Crecimiento:</span> {table.growth}
                          </div>
                          <div>
                            <span className="font-medium">Última modificación:</span>{' '}
                            {new Date(table.lastModified).toLocaleDateString('es-CL')}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultas */}
          <TabsContent value="queries">
            <Card>
              <CardHeader>
                <CardTitle>Consultas Más Ejecutadas</CardTitle>
                <CardDescription>Las consultas SQL más frecuentes y su rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {databaseStats.queries.map((query: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <code className="text-sm bg-gray-100 p-2 rounded block mb-2 font-mono">
                            {query.query.length > 100
                              ? `${query.query.substring(0, 100)}...`
                              : query.query}
                          </code>
                          <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Ejecuciones:</span>{' '}
                              {query.count.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Tiempo promedio:</span> {query.avgTime}
                              ms
                            </div>
                            <div>
                              <span className="font-medium">Última ejecución:</span>{' '}
                              {new Date(query.lastExecuted).toLocaleDateString('es-CL')}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={
                            query.avgTime > 100
                              ? 'destructive'
                              : query.avgTime > 50
                                ? 'secondary'
                                : 'default'
                          }
                        >
                          {query.avgTime > 100 ? 'Lenta' : query.avgTime > 50 ? 'Media' : 'Rápida'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Almacenamiento */}
          <TabsContent value="storage">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Uso de Disco</CardTitle>
                  <CardDescription>Espacio utilizado vs disponible</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Espacio utilizado</span>
                        <span>
                          {databaseStats.storage.used} GB / {databaseStats.storage.total} GB
                        </span>
                      </div>
                      <Progress
                        value={(databaseStats.storage.used / databaseStats.storage.total) * 100}
                        className="h-3"
                      />
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Utilizado: {databaseStats.storage.used} GB</div>
                      <div>
                        Disponible:{' '}
                        {(databaseStats.storage.total - databaseStats.storage.used).toFixed(1)} GB
                      </div>
                      <div>Crecimiento: {databaseStats.storage.growth} (último mes)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Backups</CardTitle>
                  <CardDescription>Historial de respaldos automáticos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {databaseStats.storage.backups}
                      </div>
                      <div className="text-sm text-gray-600">Backups realizados</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Último backup</span>
                        <span>
                          {new Date(databaseStats.storage.lastBackup).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Frecuencia</span>
                        <span>Diaria</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Retención</span>
                        <span>30 días</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones de Mantenimiento</CardTitle>
            <CardDescription>
              Herramientas para optimización y mantenimiento de la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Target}
                label="Optimizar DB"
                description="Reindexar y vacuum"
                onClick={handleOptimizeDatabase}
              />

              <QuickActionButton
                icon={Download}
                label="Ejecutar Backup"
                description="Respaldo manual"
                onClick={handleRunBackup}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Limpiar Cache"
                description="Reset cache queries"
                onClick={handleClearCache}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Exportar Stats"
                description="Descargar métricas"
                onClick={handleExportStats}
              />

              <QuickActionButton
                icon={Activity}
                label="Monitor en Vivo"
                description="Ver actividad actual"
                onClick={() => router.push('/admin/monitoring')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Ajustes de BD"
                onClick={() => router.push('/admin/settings/database')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
