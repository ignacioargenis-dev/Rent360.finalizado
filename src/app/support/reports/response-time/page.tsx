'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Users,
  MessageSquare,
  Activity,
  Timer,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface ResponseTimeData {
  ticketId: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  createdAt: string;
  firstResponseTime: number; // minutos
  resolutionTime: number; // horas
  slaCompliance: boolean;
  agent: string;
  userType: 'TENANT' | 'OWNER' | 'BROKER' | 'SUPPORT' | 'ADMIN';
}

interface ResponseTimeStats {
  avgFirstResponseTime: number;
  avgResolutionTime: number;
  slaComplianceRate: number;
  totalTickets: number;
  slaBreachedCount: number;
  hourlyBreakdown: Array<{ hour: number; avgResponse: number; count: number }>;
  categoryStats: Array<{ category: string; avgResponse: number; slaRate: number }>;
  priorityStats: Array<{ priority: string; avgResponse: number; targetTime: number }>;
  dailyTrends: Array<{ date: string; avgResponse: number; slaRate: number }>;
}

export default function TiempodeRespuestaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<ResponseTimeData[]>([]);
  const [stats, setStats] = useState<ResponseTimeStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadPageData();
  }, [selectedPeriod]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar datos simulados de tiempos de respuesta
      const mockResponseData: ResponseTimeData[] = generateMockResponseTimeData();
      setResponseData(mockResponseData);

      // Calcular estadísticas
      const calculatedStats = calculateResponseTimeStats(mockResponseData);
      setStats(calculatedStats);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateMockResponseTimeData = (): ResponseTimeData[] => {
    const categories = [
      'Problemas de Pago',
      'Mantenimiento',
      'Documentación',
      'Acceso a Propiedad',
      'Contratos',
      'Verificación',
      'Soporte Técnico',
      'Consultas Generales',
    ];

    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
    const userTypes = ['TENANT', 'OWNER', 'BROKER', 'SUPPORT'] as const;

    const tickets: ResponseTimeData[] = [];

    // Generar 200 tickets de los últimos 30 días
    for (let i = 0; (i = 200); i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      const category = categories[Math.floor(Math.random() * categories.length)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];
      const userType = userTypes[Math.floor(Math.random() * userTypes.length)];

      // Calcular tiempo de primera respuesta basado en prioridad y carga
      let baseFirstResponseTime = 30; // minutos base
      if (priority === 'HIGH') {
        baseFirstResponseTime = 15;
      }
      if (priority === 'URGENT') {
        baseFirstResponseTime = 5;
      }

      // Añadir variabilidad
      const firstResponseTime = Math.max(
        1,
        baseFirstResponseTime + (Math.random() - 0.5) * baseFirstResponseTime * 0.8
      );

      // Calcular tiempo de resolución
      let baseResolutionTime = 4; // horas base
      if (priority === 'HIGH') {
        baseResolutionTime *= 1.5;
      }
      if (priority === 'URGENT') {
        baseResolutionTime *= 2;
      }
      if (category === 'Documentación') {
        baseResolutionTime *= 1.3;
      }
      if (category === 'Mantenimiento') {
        baseResolutionTime *= 1.8;
      }

      const resolutionTime = Math.max(
        0.5,
        baseResolutionTime + (Math.random() - 0.5) * baseResolutionTime * 0.6
      );

      // Determinar cumplimiento SLA
      const slaTarget =
        priority === 'URGENT' ? 60 : priority === 'HIGH' ? 120 : priority === 'MEDIUM' ? 240 : 480; // minutos
      const slaCompliance = firstResponseTime <= slaTarget;

      tickets.push({
        ticketId: `TICK-${String(1000 + i).padStart(4, '0')}`,
        category,
        priority,
        createdAt: createdAt.toISOString(),
        firstResponseTime: Math.round(firstResponseTime),
        resolutionTime: Math.round(resolutionTime * 100) / 100,
        slaCompliance,
        agent: `Agente ${Math.floor(Math.random() * 8) + 1}`,
        userType,
      });
    }

    return tickets.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const calculateResponseTimeStats = (tickets: ResponseTimeData[]): ResponseTimeStats => {
    const totalTickets = tickets.length;

    // Tiempos promedio
    const avgFirstResponseTime =
      tickets.reduce((sum, t) => sum + t.firstResponseTime, 0) / totalTickets;
    const avgResolutionTime = tickets.reduce((sum, t) => sum + t.resolutionTime, 0) / totalTickets;

    // Cumplimiento SLA
    const slaComplianceRate = (tickets.filter(t => t.slaCompliance).length / totalTickets) * 100;
    const slaBreachedCount = tickets.filter(t => !t.slaCompliance).length;

    // Desglose por hora del día
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourTickets = tickets.filter(t => new Date(t.createdAt).getHours() === hour);
      const avgResponse =
        hourTickets.length > 0
          ? hourTickets.reduce((sum, t) => sum + t.firstResponseTime, 0) / hourTickets.length
          : 0;

      return {
        hour,
        avgResponse: Math.round(avgResponse),
        count: hourTickets.length,
      };
    });

    // Estadísticas por categoría
    const categoryMap = new Map<string, { total: number; responses: number; compliant: number }>();
    tickets.forEach(ticket => {
      if (!categoryMap.has(ticket.category)) {
        categoryMap.set(ticket.category, { total: 0, responses: 0, compliant: 0 });
      }
      const stats = categoryMap.get(ticket.category)!;
      stats.total++;
      stats.responses += ticket.firstResponseTime;
      if (ticket.slaCompliance) {
        stats.compliant++;
      }
    });

    const categoryStats = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        avgResponse: Math.round(stats.responses / stats.total),
        slaRate: Math.round((stats.compliant / stats.total) * 100),
      }))
      .sort((a, b) => b.avgResponse - a.avgResponse);

    // Estadísticas por prioridad
    const priorityMap = new Map<string, { total: number; responses: number }>();
    tickets.forEach(ticket => {
      if (!priorityMap.has(ticket.priority)) {
        priorityMap.set(ticket.priority, { total: 0, responses: 0 });
      }
      const stats = priorityMap.get(ticket.priority)!;
      stats.total++;
      stats.responses += ticket.firstResponseTime;
    });

    const priorityStats = Array.from(priorityMap.entries())
      .map(([priority, stats]) => ({
        priority,
        avgResponse: Math.round(stats.responses / stats.total),
        targetTime:
          priority === 'URGENT'
            ? 60
            : priority === 'HIGH'
              ? 120
              : priority === 'MEDIUM'
                ? 240
                : 480,
      }))
      .sort((a, b) => a.targetTime - b.targetTime);

    // Tendencias diarias (últimos 7 días)
    const dailyTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTickets = tickets.filter(t => t.createdAt.startsWith(dateStr));
      const avgResponse =
        dayTickets.length > 0
          ? dayTickets.reduce((sum, t) => sum + t.firstResponseTime, 0) / dayTickets.length
          : 0;
      const slaRate =
        dayTickets.length > 0
          ? (dayTickets.filter(t => t.slaCompliance).length / dayTickets.length) * 100
          : 0;

      return {
        date: date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' }),
        avgResponse: Math.round(avgResponse),
        slaRate: Math.round(slaRate),
      };
    }).reverse();

    return {
      avgFirstResponseTime: Math.round(avgFirstResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      slaComplianceRate: Math.round(slaComplianceRate),
      totalTickets,
      slaBreachedCount,
      hourlyBreakdown,
      categoryStats,
      priorityStats,
      dailyTrends,
    };
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getSlaStatusBadge = (compliant: boolean) => {
    return compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const handleExportReport = () => {
    const csvData = responseData.map(ticket => ({
      'ID Ticket': ticket.ticketId,
      Categoría: ticket.category,
      Prioridad: ticket.priority,
      'Fecha Creación': formatDate(ticket.createdAt),
      'Primera Respuesta (min)': ticket.firstResponseTime,
      'Tiempo Resolución (hrs)': ticket.resolutionTime,
      'Cumple SLA': ticket.slaCompliance ? 'Sí' : 'No',
      Agente: ticket.agent,
      'Tipo Usuario': ticket.userType,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData
        .map(row =>
          Object.values(row)
            .map(val => `"${val}"`)
            .join(',')
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `tiempos-respuesta-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Tiempos de Respuesta" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando análisis de tiempos de respuesta...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Tiempos de Respuesta" subtitle="Error al cargar la página">
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
      title="Reportes de Tiempos de Respuesta"
      subtitle="Análisis completo de SLA y eficiencia del soporte"
    >
      <div className="space-y-6">
        {/* Header con filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tiempos de Respuesta</h1>
            <p className="text-gray-600">Métricas de SLA y eficiencia del equipo de soporte</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensual</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadPageData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Estadísticas principales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Respuesta Promedio</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.avgFirstResponseTime}min
                </div>
                <p className="text-xs text-muted-foreground">Tiempo primera respuesta</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cumplimiento SLA</CardTitle>
                <Target className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.slaComplianceRate}%</div>
                <p className="text-xs text-muted-foreground">Tickets en tiempo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <MessageSquare className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalTickets}</div>
                <p className="text-xs text-muted-foreground">Últimos 30 días</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SLA Incumplidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.slaBreachedCount}</div>
                <p className="text-xs text-muted-foreground">Fuera de tiempo</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                {/* SLA por prioridad */}
                <Card>
                  <CardHeader>
                    <CardTitle>Cumplimiento SLA por Prioridad</CardTitle>
                    <CardDescription>
                      Tiempos objetivos vs reales por nivel de urgencia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.priorityStats.map((priority, index) => (
                        <div
                          key={priority.priority}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Badge className={getPriorityBadge(priority.priority)}>
                              {priority.priority === 'LOW'
                                ? 'Baja'
                                : priority.priority === 'MEDIUM'
                                  ? 'Media'
                                  : priority.priority === 'HIGH'
                                    ? 'Alta'
                                    : 'Urgente'}
                            </Badge>
                            <div>
                              <p className="font-medium">Objetivo: {priority.targetTime}min</p>
                              <p className="text-sm text-gray-600">
                                Real: {priority.avgResponse}min
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-lg font-bold ${
                                priority.avgResponse <= priority.targetTime
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {priority.avgResponse <= priority.targetTime ? '✓' : '✗'}
                            </div>
                            <p className="text-xs text-gray-500">
                              {Math.abs(priority.avgResponse - priority.targetTime)}min
                              {priority.avgResponse <= priority.targetTime
                                ? ' bajo objetivo'
                                : ' sobre objetivo'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Distribución horaria */}
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad por Hora del Día</CardTitle>
                    <CardDescription>Tiempos de respuesta según momento del día</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {stats.hourlyBreakdown.slice(8, 20).map(hour => (
                        <div key={hour.hour} className="text-center p-3 border rounded-lg">
                          <p className="text-sm font-medium">
                            {hour.hour.toString().padStart(2, '0')}:00
                          </p>
                          <p className="text-lg font-bold text-blue-600">{hour.avgResponse}min</p>
                          <p className="text-xs text-gray-500">{hour.count} tickets</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            {stats && (
              <>
                {/* Rendimiento por categoría */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Categoría</CardTitle>
                    <CardDescription>
                      Tiempos de respuesta y cumplimiento SLA por tipo de problema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.categoryStats.map((category, index) => (
                        <div
                          key={category.category}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{category.category}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="text-sm">
                                <span className="text-gray-600">Tiempo promedio:</span>
                                <span className="font-medium ml-1">{category.avgResponse}min</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Cumplimiento SLA:</span>
                                <span
                                  className={`font-medium ml-1 ${
                                    category.slaRate >= 80
                                      ? 'text-green-600'
                                      : category.slaRate >= 60
                                        ? 'text-yellow-600'
                                        : 'text-red-600'
                                  }`}
                                >
                                  {category.slaRate}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Indicadores de Rendimiento</CardTitle>
                <CardDescription>Métricas clave de eficiencia del soporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats?.slaComplianceRate}%
                    </div>
                    <p className="text-sm text-gray-600">Cumplimiento SLA</p>
                    <p className="text-xs text-gray-500 mt-1">Meta: &gt; 85%</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats?.avgFirstResponseTime}min
                    </div>
                    <p className="text-sm text-gray-600">Respuesta Promedio</p>
                    <p className="text-xs text-gray-500 mt-1">Meta: &lt; 30min</p>
                  </div>

                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {stats?.avgResolutionTime}h
                    </div>
                    <p className="text-sm text-gray-600">Resolución Promedio</p>
                    <p className="text-xs text-gray-500 mt-1">Meta: &lt; 8h</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Tiempos de Respuesta</CardTitle>
                <CardDescription>Análisis de eficiencia por rangos de tiempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">&lt; 15 minutos (Urgente)</span>
                    <span className="font-bold text-green-600">
                      {responseData.filter(t => t.firstResponseTime < 15).length} tickets
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">15-60 minutos (Alta)</span>
                    <span className="font-bold text-blue-600">
                      {
                        responseData.filter(
                          t => t.firstResponseTime >= 15 && t.firstResponseTime < 60
                        ).length
                      }{' '}
                      tickets
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="font-medium">1-4 horas (Media)</span>
                    <span className="font-bold text-yellow-600">
                      {
                        responseData.filter(
                          t => t.firstResponseTime >= 60 && t.firstResponseTime < 240
                        ).length
                      }{' '}
                      tickets
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">&gt; 4 horas (Baja)</span>
                    <span className="font-bold text-red-600">
                      {responseData.filter(t => t.firstResponseTime >= 240).length} tickets
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {stats && (
              <>
                {/* Tendencias diarias */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencias de los Últimos 7 Días</CardTitle>
                    <CardDescription>
                      Evolución de tiempos de respuesta y cumplimiento SLA
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.dailyTrends.map((day, index) => (
                        <div
                          key={day.date}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium w-16">{day.date}</span>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">{day.avgResponse}min promedio</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-500" />
                            <Badge variant={day.slaRate >= 80 ? 'default' : 'destructive'}>
                              {day.slaRate}% SLA
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
