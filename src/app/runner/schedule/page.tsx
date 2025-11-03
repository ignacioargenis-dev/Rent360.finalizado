'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
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
  Building,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function HorarioPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  // Refrescar datos periódicamente cada 30 segundos (silencioso)
  useEffect(() => {
    if (loading) {
      return;
    }
    const interval = setInterval(() => {
      // Recarga silenciosa sin mostrar loading
      const silentLoad = async () => {
        try {
          const response = await fetch('/api/runner/schedule', {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
              'Cache-Control': 'no-cache',
            },
          });

          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              setData({
                overview: result.overview || {},
                todaySchedule: result.todaySchedule || [],
                weekSchedule: result.weekSchedule || [],
              });
            }
          }
        } catch (error) {
          // Silenciosamente ignorar errores en refresh automático
          logger.debug('Error en refresh silencioso:', error);
        }
      };
      silentLoad();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loading]);

  const loadPageData = async (weekStart?: string) => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORREGIDO: Obtener datos reales desde la API
      const url = weekStart 
        ? `/api/runner/schedule?weekStart=${weekStart}`
        : '/api/runner/schedule';
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar horario: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setData({
          overview: result.overview || {},
          todaySchedule: result.todaySchedule || [],
          weekSchedule: result.weekSchedule || [],
        });
      } else {
        throw new Error('Error en respuesta de la API');
      }
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadPageDataWithWeek = async (weekStart: string) => {
    await loadPageData(weekStart);
  };

  const handlePreviousWeek = async () => {
    const currentWeek = new Date();
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    const weekStart = newWeek.toISOString().split('T')[0];
    if (weekStart) {
      await loadPageDataWithWeek(weekStart);
    }
  };

  const handleNextWeek = async () => {
    const currentWeek = new Date();
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    const weekStart = newWeek.toISOString().split('T')[0];
    if (weekStart) {
      await loadPageDataWithWeek(weekStart);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Horario" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Horario" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => loadPageData()}>
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
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handleNewVisit = () => {
    router.push('/runner/visits/new');
  };

  const handleViewVisit = (visitId: string) => {
    router.push(`/runner/tasks/${visitId}`);
  };

  const handleExportSchedule = () => {
    if (!data) return;

    const csvContent = [
      ['Hora', 'Tipo', 'Propiedad', 'Dirección', 'Cliente', 'Estado', 'Notas']
    ];

    data.todaySchedule.forEach((visit: any) => {
      csvContent.push([
        visit.time,
        visit.type,
        visit.property,
        visit.address,
        visit.client,
        visit.status,
        visit.notes
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `agenda_runner_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <UnifiedDashboardLayout
      title="Mi Horario"
      subtitle="Gestiona tus visitas y actividades programadas"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.todayVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.overview.completedToday || 0} completadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.weekVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Visitas programadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.pendingVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.monthVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total de visitas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Agenda del día */}
        <Card>
          <CardHeader>
            <CardTitle>Agenda de Hoy</CardTitle>
            <CardDescription>
              Tus visitas y actividades programadas para {new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.todaySchedule.map((visit: any, index: number) => (
                <Card key={visit.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex flex-col items-center">
                          <div className="text-lg font-bold text-blue-600">{visit.time}</div>
                          <div className="text-xs text-gray-500">{visit.duration}</div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{visit.type}</h3>
                            {getStatusBadge(visit.status)}
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" />
                              <span>{visit.property}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{visit.address}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>{visit.client}</span>
                            </div>
                          </div>

                          {visit.notes && (
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Notas:</strong> {visit.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewVisit(visit.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                        {visit.status !== 'completed' && (
                          <Button size="sm">
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

        {/* Resumen semanal */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resumen Semanal</CardTitle>
                <CardDescription>Visitas programadas por día de la semana</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousWeek}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Semana Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextWeek}
                >
                  Semana Siguiente
                  <Calendar className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {data?.weekSchedule && data.weekSchedule.length > 0 ? (
                data.weekSchedule.map((day: any, index: number) => (
                  <div key={index} className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">{day.day}</div>
                    <div className="space-y-1">
                      <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {day.visits || 0} programada{(day.visits || 0) !== 1 ? 's' : ''}
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        {day.completed || 0} completada{(day.completed || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-7 text-center py-4 text-gray-500">
                  No hay visitas programadas para esta semana
                </div>
              )}
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
                label="Nueva Visita"
                description="Agendar visita"
                onClick={handleNewVisit}
              />

              <QuickActionButton
                icon={Filter}
                label="Filtrar"
                description="Buscar visitas"
                onClick={() => {
                  // Focus on search input
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar visitas"]'
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
                description="Descargar agenda"
                onClick={handleExportSchedule}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Estadísticas"
                description="Ver rendimiento"
                onClick={() => router.push('/runner/reports')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Ajustes de horario"
                onClick={() => router.push('/runner/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar agenda"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
