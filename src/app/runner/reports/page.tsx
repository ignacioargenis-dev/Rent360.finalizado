'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export default function ReportesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<any>(null);

  const [error, setError] = useState<string | null>(null);

  const [showFiltersDialog, setShowFiltersDialog] = useState(false);

  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    reportType: 'all',
    status: 'all',
    minRating: '',
    maxRating: '',
  });

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.reportType, filters.dateFrom, filters.dateTo]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORREGIDO: Obtener datos reales desde la API
      const params = new URLSearchParams();
      params.append('type', filters.reportType !== 'all' ? filters.reportType : 'performance');
      if (filters.dateFrom) params.append('startDate', filters.dateFrom);
      if (filters.dateTo) params.append('endDate', filters.dateTo);

      const response = await fetch(`/api/runner/reports?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar reportes: ${response.status}`);
      }

      const result = await response.json();
      const reportData = result.data || {};

      // Transformar datos al formato esperado (adaptable según lo que devuelva el servicio)
      const transformedData = {
        overview: reportData.overview || {
          totalVisits: reportData.totalVisits || 0,
          totalConversions: reportData.totalConversions || 0,
          conversionRate: reportData.conversionRate || 0,
          avgVisitDuration: reportData.averageDuration || 0,
          topPerformingAreas: reportData.topAreas || [],
          monthlyGrowth: reportData.growth || 0,
        },
        conversions: reportData.conversions || {
          byType: reportData.conversionsByType || [],
          byProperty: reportData.conversionsByProperty || [],
        },
        visits: reportData.visits || {
          byDay: reportData.visitsByDay || [],
          byTime: reportData.visitsByTime || [],
        },
        performance: reportData.performance || {
          avgRating: reportData.averageRating || 0,
          totalPhotos: reportData.totalPhotos || 0,
          reportsSubmitted: reportData.reportsSubmitted || 0,
          tasksCompleted: reportData.tasksCompleted || 0,
        },
      };

      setData(transformedData);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Reportes" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Reportes" subtitle="Error al cargar la página">
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

  const handleOpenFilters = () => {
    setShowFiltersDialog(true);
  };

  const handleApplyFilters = () => {
    // Apply filters logic here
    setShowFiltersDialog(false);
    logger.debug('Filtros aplicados:', filters);
  };

  const handleResetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      reportType: 'all',
      status: 'all',
      minRating: '',
      maxRating: '',
    });
  };

  const handleExportReports = () => {
    if (!data) {
      return;
    }

    const csvContent = [
      ['Métrica', 'Valor'],
      ['Visitas Totales', data.overview.totalVisits.toString()],
      ['Conversiones Totales', data.overview.totalConversions.toString()],
      ['Tasa de Conversión', `${data.overview.conversionRate}%`],
      ['Duración Promedio Visita', `${data.overview.avgVisitDuration} min`],
      ['Crecimiento Mensual', `${data.overview.monthlyGrowth}%`],
      ['Calificación Promedio', data.performance.avgRating.toString()],
      ['Fotos Totales', data.performance.totalPhotos.toString()],
      ['Reportes Enviados', data.performance.reportsSubmitted.toString()],
      ['Tareas Completadas', data.performance.tasksCompleted.toString()],
    ];

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes_runner_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <UnifiedDashboardLayout title="Mis Reportes" subtitle="Visualiza tu rendimiento y estadísticas">
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visitas Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.totalVisits || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{data?.overview.monthlyGrowth || 0}% este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.totalConversions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Tasa: {data?.overview.conversionRate || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.overview.avgVisitDuration || 0} min</div>
              <p className="text-xs text-muted-foreground">Por visita</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.performance.avgRating || 0}</div>
              <p className="text-xs text-muted-foreground">Promedio de clientes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversiones por tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Conversiones por Tipo</CardTitle>
              <CardDescription>Distribución de conversiones según el tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data?.conversions.byType.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium">{item.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-xs text-gray-600">{item.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visitas por día */}
          <Card>
            <CardHeader>
              <CardTitle>Visitas por Día</CardTitle>
              <CardDescription>Distribución semanal de visitas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.visits.byDay.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.day}</span>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">{item.visits} visitas</div>
                      <div className="text-sm font-medium text-green-600">
                        {item.conversions} conv.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rendimiento general */}
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento General</CardTitle>
              <CardDescription>Métricas de desempeño del mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-500" />
                    <span>Fotos tomadas</span>
                  </div>
                  <div className="font-bold">{data?.performance.totalPhotos || 0}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    <span>Reportes enviados</span>
                  </div>
                  <div className="font-bold">{data?.performance.reportsSubmitted || 0}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <span>Tareas completadas</span>
                  </div>
                  <div className="font-bold">{data?.performance.tasksCompleted || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zonas más activas */}
          <Card>
            <CardHeader>
              <CardTitle>Zonas Más Activas</CardTitle>
              <CardDescription>Áreas con mayor actividad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data?.overview.topPerformingAreas.map((area: string, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-sm">{area}</span>
                    </div>
                    <Badge variant="outline">#{index + 1}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

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
                label="Nuevo Reporte"
                description="Crear reporte"
                onClick={() => router.push('/runner/reports/new')}
              />

              <Dialog open={showFiltersDialog} onOpenChange={setShowFiltersDialog}>
                <DialogTrigger asChild>
                  <QuickActionButton
                    icon={Filter}
                    label="Filtrar"
                    description="Buscar reportes"
                    onClick={handleOpenFilters}
                  />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Filtros de Reportes</DialogTitle>
                    <DialogDescription>
                      Aplica filtros para personalizar tus reportes.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="date-from">Fecha Desde</Label>
                        <Input
                          id="date-from"
                          type="date"
                          value={filters.dateFrom}
                          onChange={e => setFilters({ ...filters, dateFrom: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date-to">Fecha Hasta</Label>
                        <Input
                          id="date-to"
                          type="date"
                          value={filters.dateTo}
                          onChange={e => setFilters({ ...filters, dateTo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo de Reporte</Label>
                      <Select
                        value={filters.reportType}
                        onValueChange={value => setFilters({ ...filters, reportType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="visits">Visitas</SelectItem>
                          <SelectItem value="performance">Rendimiento</SelectItem>
                          <SelectItem value="earnings">Ganancias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={filters.status}
                        onValueChange={value => setFilters({ ...filters, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="completed">Completado</SelectItem>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Calificación Mínima</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={filters.minRating}
                          onChange={e => setFilters({ ...filters, minRating: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Calificación Máxima</Label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={filters.maxRating}
                          onChange={e => setFilters({ ...filters, maxRating: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleApplyFilters} className="flex-1">
                        Aplicar Filtros
                      </Button>
                      <Button variant="outline" onClick={handleResetFilters}>
                        Limpiar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar datos"
                onClick={handleExportReports}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Análisis"
                description="Ver tendencias"
                onClick={() => router.push('/runner/reports/performance')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Ajustes de reportes"
                onClick={() => router.push('/runner/settings')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
