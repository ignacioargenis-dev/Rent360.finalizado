'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
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

export default function TareasPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState(null);

  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Simulated API call
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Error al cargar los datos');
      }
      const data = await response.json();
      setData(data);
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

  return (
    <UnifiedDashboardLayout title="Tareas" subtitle="Gestiona y visualiza la información de tareas">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">+0% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas</CardTitle>
            <CardDescription>
              Aquí puedes gestionar y visualizar toda la información relacionada con tareas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Contenido en desarrollo</h3>
              <p className="text-gray-600 mb-4">
                Esta página está siendo desarrollada. Pronto tendrás acceso a todas las
                funcionalidades.
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Nuevo
              </Button>
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
                onClick={() => alert('Funcionalidad: Abrir formulario para crear nueva tarea')}
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
                    alert('No hay tareas para exportar');
                    return;
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
      </div>
    </UnifiedDashboardLayout>
  );
}
