'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function TareasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // ✅ CORREGIDO: Obtener datos reales desde la API
      const response = await fetch('/api/runner/tasks?status=all&limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar tareas: ${response.status}`);
      }

      const result = await response.json();
      const tasks = result.tasks || result.data || [];

      // Calcular estadísticas desde los datos reales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      const completedTasks = tasks.filter(
        (t: any) => t.status === 'COMPLETED' || t.status === 'completed'
      ).length;
      const pendingTasks = tasks.filter(
        (t: any) =>
          t.status === 'SCHEDULED' ||
          t.status === 'scheduled' ||
          t.status === 'PENDING' ||
          t.status === 'pending'
      ).length;
      const inProgressTasks = tasks.filter(
        (t: any) => t.status === 'IN_PROGRESS' || t.status === 'in_progress'
      ).length;

      const todayTasks = tasks.filter((t: any) => {
        if (!t.scheduledDate) {
          return false;
        }
        const taskDate = new Date(t.scheduledDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }).length;

      const thisWeekTasks = tasks.filter((t: any) => {
        if (!t.scheduledDate) {
          return false;
        }
        const taskDate = new Date(t.scheduledDate);
        return taskDate >= weekStart;
      }).length;

      const transformedData = {
        overview: {
          totalTasks: tasks.length,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          todayTasks,
          thisWeekTasks,
        },
        tasks: tasks.map((task: any) => ({
          id: task.id,
          title: task.propertyTitle || task.title || 'Sin título',
          description: task.description || task.notes || '',
          status: task.status?.toLowerCase() || 'pending',
          priority: task.priority || 'medium',
          dueDate: task.scheduledDate || '',
          propertyAddress: task.propertyAddress || task.property?.address || '',
          clientName: task.clientName || task.tenant?.name || task.tenantName || 'Sin cliente',
          estimatedDuration: task.estimatedDuration || `${task.duration || 30} minutos`,
          propertyId: task.propertyId,
          tenantId: task.tenantId,
        })),
      };

      setData(transformedData);
      setError(null);
    } catch (error) {
      setError('Error al cargar los datos');
      logger.error('Error fetching tasks:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Tareas" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Tareas" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => {
                  // Reload data on error
                  const fetchTasks = async () => {
                    try {
                      setLoading(true);
                      const response = await fetch('/api/tasks');
                      if (!response.ok) {
                        throw new Error('Error al cargar los datos');
                      }
                      const data = await response.json();
                      setData(data);
                    } catch (error) {
                      setError('Error al cargar los datos');
                      logger.error('Error fetching tasks:', {
                        error: error instanceof Error ? error.message : String(error),
                      });
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchTasks();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', color: 'bg-green-100 text-green-800' },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleCreateTask = () => {
    router.push('/runner/tasks/new');
  };

  const handleViewTask = (taskId: string) => {
    router.push(`/runner/tasks/${taskId}`);
  };

  const handleMarkCompleted = async (taskId: string) => {
    try {
      const response = await fetch(`/api/runner/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'completed',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al completar la tarea');
      }

      const result = await response.json();

      if (result.success) {
        // Recargar las tareas para mostrar el estado actualizado
        await fetchTasks();
        logger.info('Tarea completada exitosamente', { taskId });
      } else {
        throw new Error(result.error || 'Error al completar la tarea');
      }
    } catch (error) {
      logger.error('Error completando tarea:', {
        error: error instanceof Error ? error.message : String(error),
        taskId,
      });
      alert('Error al completar la tarea. Por favor, inténtalo nuevamente.');
    }
  };

  const handleExportTasks = () => {
    logger.info('Abriendo opciones de exportación de tareas');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando tareas del runner', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/runner/tasks/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `tareas_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de tareas completada exitosamente');
    } catch (error) {
      logger.error('Error exportando tareas:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar las tareas. Por favor, intenta nuevamente.');
    }
  };

  return (
    <UnifiedDashboardLayout title="Tareas" subtitle="Gestiona tus tareas diarias">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.overview.completedTasks || 0} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.inProgressTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Activas actualmente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.pendingTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.todayTasks || 0}</div>
              <p className="text-xs text-muted-foreground">Para completar hoy</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de tareas */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Tareas</CardTitle>
            <CardDescription>
              Lista de todas tus tareas asignadas y su estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.tasks.map((task: any, index: number) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>

                        <p className="text-gray-600 mb-3">{task.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{task.propertyAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{task.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Vence: {new Date(task.dueDate).toLocaleDateString('es-CL')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Duración estimada: {task.estimatedDuration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => handleViewTask(task.id)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>

                        {task.status !== 'completed' && (
                          <Button size="sm" onClick={() => handleMarkCompleted(task.id)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Tarea"
                description="Crear tarea"
                onClick={handleCreateTask}
              />

              <QuickActionButton
                icon={Filter}
                label="Filtrar"
                description="Buscar tareas"
                onClick={() => {
                  // Focus on search input
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar tareas"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                    searchInput.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar tareas"
                onClick={() => {
                  // Mock data for export
                  const mockTasks = [
                    {
                      id: '1',
                      title: 'Visita inicial',
                      description: 'Primera visita al cliente',
                      status: 'Completada',
                      priority: 'Alta',
                      dueDate: '2024-01-15',
                    },
                    {
                      id: '2',
                      title: 'Mantenimiento',
                      description: 'Mantenimiento preventivo',
                      status: 'Pendiente',
                      priority: 'Media',
                      dueDate: '2024-01-20',
                    },
                  ];

                  if (mockTasks.length === 0) {
                    return; // No tasks to export
                  }

                  const csvData = mockTasks.map(task => ({
                    ID: task.id,
                    Título: task.title,
                    Descripción: task.description,
                    Estado: task.status,
                    Prioridad: task.priority,
                    'Fecha Límite': task.dueDate,
                  }));

                  const csvContent =
                    'data:text/csv;charset=utf-8,' +
                    Object.keys(csvData[0]!).join(',') +
                    '\n' +
                    csvData.map(row => Object.values(row).join(',')).join('\n');

                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement('a');
                  link.setAttribute('href', encodedUri);
                  link.setAttribute(
                    'download',
                    `tareas_${new Date().toISOString().split('T')[0]}.csv`
                  );
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Estadísticas"
                description="Ver progreso"
                onClick={() => router.push('/runner/reports')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Preferencias"
                onClick={() => router.push('/runner/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar tareas"
                onClick={() => fetchTasks()}
              />
            </div>
          </CardContent>
        </Card>

        {/* Modal de exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Tareas</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtra las tareas que deseas exportar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Archivo</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Filtrar por Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tareas</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completadas</SelectItem>
                    <SelectItem value="CANCELLED">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-start-date">Fecha Desde</Label>
                  <Input
                    id="export-start-date"
                    type="date"
                    value={exportOptions.startDate}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="export-end-date">Fecha Hasta</Label>
                  <Input
                    id="export-end-date"
                    type="date"
                    value={exportOptions.endDate}
                    onChange={e => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Se exportarán {data?.tasks?.length || 0} tareas
                  {exportOptions.format === 'csv'
                    ? ' en formato CSV compatible con Excel'
                    : ' en formato JSON'}
                  {exportOptions.status !== 'all' &&
                    ` filtradas por estado "${exportOptions.status}"`}
                  {(exportOptions.startDate || exportOptions.endDate) &&
                    ' en el rango de fechas seleccionado'}
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportOptions({
                    format: 'csv',
                    status: 'all',
                    startDate: '',
                    endDate: '',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Tareas
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
