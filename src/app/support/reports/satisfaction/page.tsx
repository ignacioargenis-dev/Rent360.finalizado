'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
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
  Star,
  Heart,
  Smile,
  Frown,
  Meh,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface SatisfactionData {
  ticketId: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  resolutionTime: number;
  satisfactionRating: number;
  feedbackText: string | undefined;
  userType: 'TENANT' | 'OWNER' | 'BROKER' | 'SUPPORT' | 'ADMIN';
  agent: string;
  resolutionDate: string;
  followUpRequired: boolean;
  npsScore: number | undefined; // Net Promoter Score
}

interface SatisfactionStats {
  overallRating: number;
  totalResponses: number;
  responseRate: number;
  npsScore: number;
  promoters: number;
  passives: number;
  detractors: number;
  ratingDistribution: { rating: number; count: number; percentage: number }[];
  categorySatisfaction: { category: string; avgRating: number; responseCount: number }[];
  agentPerformance: { agent: string; avgRating: number; ticketCount: number }[];
  monthlyTrends: { month: string; avgRating: number; responseCount: number }[];
  prioritySatisfaction: { priority: string; avgRating: number; count: number }[];
  followUpRequired: number;
}

export default function SatisfactionReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionData[]>([]);
  const [stats, setStats] = useState<SatisfactionStats | null>({
    overallRating: 0,
    totalResponses: 0,
    responseRate: 0,
    npsScore: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    ratingDistribution: [],
    categorySatisfaction: [],
    agentPerformance: [],
    monthlyTrends: [],
    prioritySatisfaction: [],
    followUpRequired: 0,
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    loadPageData();
  }, [selectedPeriod]);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Llamar a la API real de reportes de satisfacción
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);

      const response = await fetch(`/api/support/reports/satisfaction?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error al cargar reportes de satisfacción: ${response.status}`);
      }

      const data = await response.json();

      setSatisfactionData(data.data || []);
      setStats(data.stats || null);

      logger.info('Reportes de satisfacción cargados desde API:', {
        responseCount: data.data?.length || 0,
        overallRating: data.stats?.overallRating || 0,
      });
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateMockSatisfactionData = (): SatisfactionData[] => {
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

    const feedbackTexts = [
      'Excelente servicio, muy rápido y eficiente',
      'Buen trabajo, pero podría ser más rápido',
      'Satisfecho con la resolución',
      'El proceso fue claro y profesional',
      'Necesita mejorar la comunicación',
      'Muy buena atención al cliente',
      'Podrían ser más proactivos',
      'Servicio aceptable, pero no excepcional',
      'Excelente resolución del problema',
      'El tiempo de respuesta fue adecuado',
    ];

    const tickets: SatisfactionData[] = [];

    // Generar 120 respuestas de satisfacción de los últimos 30 días
    for (let i = 0; i < 120; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const resolutionDate = new Date();
      resolutionDate.setDate(resolutionDate.getDate() - daysAgo);

      const categoryIndex = Math.floor(Math.random() * categories.length);
      const priorityIndex = Math.floor(Math.random() * priorities.length);
      const userTypeIndex = Math.floor(Math.random() * userTypes.length);

      const category = categories[categoryIndex]!;
      const priority = priorities[priorityIndex]!;
      const userType = userTypes[userTypeIndex]!;

      // Calcular rating de satisfacción basado en tiempo de resolución y prioridad
      let baseRating = 4; // rating base
      const resolutionTime = Math.random() * 48 + 1; // 1-49 horas

      if (resolutionTime < 4) {
        baseRating += 0.5;
      } else if (resolutionTime > 24) {
        baseRating -= 0.5;
      }

      if (priority === 'HIGH' || priority === 'URGENT') {
        baseRating += 0.3;
      }

      // Añadir variabilidad
      let satisfactionRating = Math.max(1, Math.min(5, baseRating + (Math.random() - 0.5) * 1.5));
      satisfactionRating = Math.round(satisfactionRating * 10) / 10;

      // Calcular NPS (solo para algunos usuarios)
      let npsScore: number | undefined;
      if (Math.random() > 0.6) {
        npsScore = Math.floor(Math.random() * 11); // 0-10
      }

      // Feedback text (solo para algunos)
      let feedbackText: string | undefined;
      if (Math.random() > 0.4) {
        feedbackText = feedbackTexts[Math.floor(Math.random() * feedbackTexts.length)];
      }

      tickets.push({
        ticketId: `TICK-${String(1000 + i).padStart(4, '0')}`,
        category,
        priority,
        resolutionTime: Math.round(resolutionTime * 100) / 100,
        satisfactionRating,
        feedbackText,
        userType,
        agent: `Agente ${Math.floor(Math.random() * 8) + 1}`,
        resolutionDate: resolutionDate.toISOString(),
        followUpRequired: Math.random() > 0.85, // 15% requieren seguimiento
        npsScore,
      });
    }

    return tickets.sort(
      (a, b) => new Date(b.resolutionDate).getTime() - new Date(a.resolutionDate).getTime()
    );
  };

  const calculateSatisfactionStats = (data: SatisfactionData[]): SatisfactionStats => {
    const totalResponses = data.length;
    const overallRating =
      data.reduce((sum, item) => sum + item.satisfactionRating, 0) / totalResponses;

    // NPS Calculation
    const npsResponses = data.filter(item => item.npsScore !== undefined);
    const promoters = npsResponses.filter(item => (item.npsScore || 0) >= 9).length;
    const passives = npsResponses.filter(
      item => (item.npsScore || 0) >= 7 && (item.npsScore || 0) <= 8
    ).length;
    const detractors = npsResponses.filter(item => (item.npsScore || 0) <= 6).length;
    const npsScore =
      npsResponses.length > 0 ? ((promoters - detractors) / npsResponses.length) * 100 : 0;

    // Response rate (simulado)
    const responseRate = 78; // 78% de tickets reciben respuesta de satisfacción

    // Rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const count = data.filter(item => Math.floor(item.satisfactionRating) === rating).length;
      return {
        rating,
        count,
        percentage: Math.round((count / totalResponses) * 100),
      };
    });

    // Category satisfaction
    const categoryMap = new Map<string, { total: number; sum: number }>();
    data.forEach(item => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, { total: 0, sum: 0 });
      }
      const stats = categoryMap.get(item.category)!;
      stats.total++;
      stats.sum += item.satisfactionRating;
    });

    const categorySatisfaction = Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        avgRating: Math.round((stats.sum / stats.total) * 100) / 100,
        responseCount: stats.total,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // Agent performance
    const agentMap = new Map<string, { total: number; sum: number }>();
    data.forEach(item => {
      if (!agentMap.has(item.agent)) {
        agentMap.set(item.agent, { total: 0, sum: 0 });
      }
      const stats = agentMap.get(item.agent)!;
      stats.total++;
      stats.sum += item.satisfactionRating;
    });

    const agentPerformance = Array.from(agentMap.entries())
      .map(([agent, stats]) => ({
        agent,
        avgRating: Math.round((stats.sum / stats.total) * 100) / 100,
        ticketCount: stats.total,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    // Monthly trends (últimos 6 meses)
    const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      const monthData = data.filter(item => item.resolutionDate.startsWith(monthKey));
      const avgRating =
        monthData.length > 0
          ? monthData.reduce((sum, item) => sum + item.satisfactionRating, 0) / monthData.length
          : 0;

      return {
        month: date.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
        avgRating: Math.round(avgRating * 100) / 100,
        responseCount: monthData.length,
      };
    }).reverse();

    // Priority satisfaction
    const priorityMap = new Map<string, { total: number; sum: number }>();
    data.forEach(item => {
      if (!priorityMap.has(item.priority)) {
        priorityMap.set(item.priority, { total: 0, sum: 0 });
      }
      const stats = priorityMap.get(item.priority)!;
      stats.total++;
      stats.sum += item.satisfactionRating;
    });

    const prioritySatisfaction = Array.from(priorityMap.entries())
      .map(([priority, stats]) => ({
        priority,
        avgRating: Math.round((stats.sum / stats.total) * 100) / 100,
        count: stats.total,
      }))
      .sort((a, b) => b.avgRating - a.avgRating);

    const followUpRequired = data.filter(item => item.followUpRequired).length;

    return {
      overallRating: Math.round(overallRating * 100) / 100,
      totalResponses,
      responseRate,
      npsScore: Math.round(npsScore),
      promoters,
      passives,
      detractors,
      ratingDistribution,
      categorySatisfaction,
      agentPerformance,
      monthlyTrends,
      prioritySatisfaction,
      followUpRequired,
    };
  };

  const getRatingIcon = (rating: number) => {
    if (rating >= 4.5) {
      return <Smile className="w-5 h-5 text-green-500" />;
    }
    if (rating >= 3.5) {
      return <Meh className="w-5 h-5 text-yellow-500" />;
    }
    return <Frown className="w-5 h-5 text-red-500" />;
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) {
      return 'text-green-600';
    }
    if (rating >= 3.5) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  const handleExportReport = () => {
    const csvData = satisfactionData.map(item => ({
      'ID Ticket': item.ticketId,
      Categoría: item.category,
      Prioridad: item.priority,
      'Tiempo Resolución (hrs)': item.resolutionTime,
      Satisfacción: item.satisfactionRating,
      Feedback: item.feedbackText || '',
      'Tipo Usuario': item.userType,
      Agente: item.agent,
      'Fecha Resolución': formatDate(item.resolutionDate),
      'Requiere Seguimiento': item.followUpRequired ? 'Sí' : 'No',
      NPS: item.npsScore || '',
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
      `satisfaccion-clientes-${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Satisfacción del Cliente" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando análisis de satisfacción...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Satisfacción del Cliente" subtitle="Error al cargar la página">
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
      title="Reportes de Satisfacción del Cliente"
      subtitle="Análisis completo de experiencia y retroalimentación del usuario"
    >
      <div className="space-y-6">
        {/* Header con filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Satisfacción del Cliente</h1>
            <p className="text-gray-600">Métricas de experiencia y retroalimentación</p>
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
                <CardTitle className="text-sm font-medium">Satisfacción General</CardTitle>
                <Heart className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overallRating}/5.0</div>
                <p className="text-xs text-muted-foreground">Rating promedio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.npsScore}</div>
                <p className="text-xs text-muted-foreground">Net Promoter Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Respuestas</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalResponses}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.responseRate}% tasa de respuesta
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seguimiento Requerido</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.followUpRequired}</div>
                <p className="text-xs text-muted-foreground">Casos críticos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="ratings">Calificaciones</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <>
                {/* NPS Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Net Promoter Score (NPS)</CardTitle>
                    <CardDescription>
                      Distribución de promotores, pasivos y detractores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {stats.promoters}
                        </div>
                        <p className="text-sm text-gray-600">Promotores</p>
                        <p className="text-xs text-gray-500">(9-10)</p>
                      </div>

                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-600 mb-2">
                          {stats.passives}
                        </div>
                        <p className="text-sm text-gray-600">Pasivos</p>
                        <p className="text-xs text-gray-500">(7-8)</p>
                      </div>

                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-3xl font-bold text-red-600 mb-2">
                          {stats.detractors}
                        </div>
                        <p className="text-sm text-gray-600">Detractores</p>
                        <p className="text-xs text-gray-500">(0-6)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencias Mensuales de Satisfacción</CardTitle>
                    <CardDescription>Evolución del rating promedio mensual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {stats.monthlyTrends.map((month, index) => (
                        <div key={month.month} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{month.month}</h4>
                            <div className="flex items-center gap-1">
                              {getRatingIcon(month.avgRating)}
                              <span className="font-bold">{month.avgRating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{month.responseCount} respuestas</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="ratings" className="space-y-4">
            {stats && (
              <>
                {/* Rating Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Calificaciones</CardTitle>
                    <CardDescription>
                      Porcentaje de respuestas por cada nivel de satisfacción
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.ratingDistribution.map((rating, index) => (
                        <div
                          key={rating.rating}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < rating.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-medium">
                              {rating.rating} estrella{rating.rating !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold">{rating.count}</span>
                            <p className="text-sm text-gray-500">{rating.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Satisfaction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Satisfacción por Prioridad</CardTitle>
                    <CardDescription>
                      Rating promedio según nivel de urgencia del ticket
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.prioritySatisfaction.map((priority, index) => (
                        <div
                          key={priority.priority}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge className={getPriorityBadge(priority.priority)}>
                              {priority.priority === 'LOW'
                                ? 'Baja'
                                : priority.priority === 'MEDIUM'
                                  ? 'Media'
                                  : priority.priority === 'HIGH'
                                    ? 'Alta'
                                    : 'Urgente'}
                            </Badge>
                            <span className="font-medium">{priority.count} tickets</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRatingIcon(priority.avgRating)}
                            <span className={`font-bold ${getRatingColor(priority.avgRating)}`}>
                              {priority.avgRating}/5.0
                            </span>
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
            {stats && (
              <>
                {/* Category Satisfaction */}
                <Card>
                  <CardHeader>
                    <CardTitle>Satisfacción por Categoría</CardTitle>
                    <CardDescription>
                      Rating promedio por tipo de problema reportado
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.categorySatisfaction.map((category, index) => (
                        <div
                          key={category.category}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium">{category.category}</h4>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="text-sm">
                                <span className="text-gray-600">Rating promedio:</span>
                                <span
                                  className={`font-medium ml-1 ${getRatingColor(category.avgRating)}`}
                                >
                                  {category.avgRating}/5.0
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-600">Respuestas:</span>
                                <span className="font-medium ml-1">{category.responseCount}</span>
                              </div>
                            </div>
                          </div>
                          {getRatingIcon(category.avgRating)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Agente</CardTitle>
                    <CardDescription>Satisfacción promedio por agente de soporte</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.agentPerformance.map((agent, index) => (
                        <div
                          key={agent.agent}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <div>
                              <h4 className="font-medium">{agent.agent}</h4>
                              <p className="text-sm text-gray-600">
                                {agent.ticketCount} tickets atendidos
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRatingIcon(agent.avgRating)}
                            <span className={`font-bold ${getRatingColor(agent.avgRating)}`}>
                              {agent.avgRating}/5.0
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            {/* Feedback List */}
            <Card>
              <CardHeader>
                <CardTitle>Comentarios y Feedback</CardTitle>
                <CardDescription>Retroalimentación detallada de los usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {satisfactionData
                      .filter(item => item.feedbackText)
                      .slice(0, 30)
                      .map((item, index) => (
                        <div key={item.ticketId} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">{item.ticketId}</span>
                                <Badge className={getPriorityBadge(item.priority)}>
                                  {item.priority === 'LOW'
                                    ? 'Baja'
                                    : item.priority === 'MEDIUM'
                                      ? 'Media'
                                      : item.priority === 'HIGH'
                                        ? 'Alta'
                                        : 'Urgente'}
                                </Badge>
                                <Badge variant="outline">{item.category}</Badge>
                              </div>
                              <p className="text-gray-700 mb-2">
                                &ldquo;{item.feedbackText}&rdquo;
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>Agente: {item.agent}</span>
                                <span>Tiempo: {item.resolutionTime}h</span>
                                <span className="flex items-center gap-1">
                                  Satisfacción:
                                  <div className="flex ml-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3 h-3 ${
                                          i < item.satisfactionRating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-1">({item.satisfactionRating})</span>
                                </span>
                              </div>
                            </div>
                            {item.followUpRequired && (
                              <Badge variant="destructive" className="ml-2">
                                Requiere Seguimiento
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
