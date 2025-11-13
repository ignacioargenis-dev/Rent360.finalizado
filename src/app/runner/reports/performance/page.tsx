'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect } from 'react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Star,
  TrendingUp,
  Clock,
  Award,
  Target,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Download,
  Trophy,
  Zap,
} from 'lucide-react';
import { User } from '@/types';

interface PerformanceMetrics {
  overallRating: number;
  totalVisits: number;
  completedVisits: number;
  averageResponseTime: number;
  onTimeRate: number;
  clientSatisfaction: number;
  monthlyEarnings: number;
  totalEarnings: number;
  conversionRate: number;
}

interface MonthlyPerformance {
  month: string;
  rating: number;
  visits: number;
  earnings: number;
  onTimeRate: number;
  responseTime: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  date?: string;
  value?: number;
}

interface Feedback {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  date: string;
  propertyTitle: string;
}

export default function RunnerPerformanceReport() {
  const [user, setUser] = useState<User | null>(null);

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    overallRating: 0,
    totalVisits: 0,
    completedVisits: 0,
    averageResponseTime: 0,
    onTimeRate: 0,
    clientSatisfaction: 0,
    monthlyEarnings: 0,
    totalEarnings: 0,
    conversionRate: 0,
  });

  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);

  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const [feedback, setFeedback] = useState<Feedback[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    // Load performance data
    const loadPerformanceData = async () => {
      try {
        // Obtener datos reales desde la API
        const response = await fetch('/api/runner/reports?type=performance', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        const data = result.data;

        if (!data) {
          throw new Error('No se recibieron datos del servidor');
        }

        // Transformar métricas al formato esperado
        const performanceMetrics: PerformanceMetrics = {
          overallRating: data.averageRating || 0,
          totalVisits: data.totalVisits || 0,
          completedVisits: data.completedVisits || 0,
          averageResponseTime: data.responseTimeAverage || 0,
          onTimeRate: data.onTimeRate || 0,
          clientSatisfaction: data.clientSatisfactionScore || 0,
          monthlyEarnings: data.monthlyEarnings || 0,
          totalEarnings: data.totalEarnings || 0,
          conversionRate: data.completionRate || 0,
        };

        // Transformar datos mensuales
        const monthlyData: MonthlyPerformance[] = (data.monthlyPerformance || []).map(
          (month: any) => ({
            month: month.month,
            rating: month.rating || 0,
            visits: month.visits || 0,
            earnings: month.earnings || 0,
            onTimeRate: month.onTimeRate || 0,
            responseTime: month.responseTime || 0,
          })
        );

        // Transformar achievements
        const achievementsData: Achievement[] = (data.achievements || []).map((ach: any) => ({
          id: ach.id,
          title: ach.title,
          description: ach.description,
          icon: ach.icon,
          achieved: ach.achieved || false,
          date: ach.date,
          value: ach.value,
        }));

        // Transformar feedback
        const feedbackData: Feedback[] = (data.feedback || []).map((fb: any) => ({
          id: fb.id,
          clientName: fb.clientName || 'Usuario',
          rating: fb.rating || 0,
          comment: fb.comment || '',
          date: fb.date || new Date().toISOString(),
          propertyTitle: fb.propertyTitle || 'Propiedad',
        }));

        setMetrics(performanceMetrics);
        setMonthlyPerformance(monthlyData);
        setAchievements(achievementsData);
        setFeedback(feedbackData);
      } catch (error) {
        logger.error('Error loading performance data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, usar valores por defecto
        setMetrics({
          overallRating: 0,
          totalVisits: 0,
          completedVisits: 0,
          averageResponseTime: 0,
          onTimeRate: 0,
          clientSatisfaction: 0,
          monthlyEarnings: 0,
          totalEarnings: 0,
          conversionRate: 0,
        });
        setMonthlyPerformance([]);
        setAchievements([]);
        setFeedback([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadPerformanceData();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) {
      return 'text-green-600';
    }
    if (rating >= 4.0) {
      return 'text-blue-600';
    }
    if (rating >= 3.5) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getPerformanceBadge = (value: number, type: 'rating' | 'percentage' | 'time') => {
    if (type === 'rating') {
      if (value >= 4.5) {
        return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
      }
      if (value >= 4.0) {
        return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
      }
      if (value >= 3.5) {
        return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
      }
      return <Badge className="bg-red-100 text-red-800">Mejorable</Badge>;
    } else if (type === 'percentage') {
      if (value >= 90) {
        return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
      }
      if (value >= 80) {
        return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
      }
      if (value >= 70) {
        return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
      }
      return <Badge className="bg-red-100 text-red-800">Mejorable</Badge>;
    } else {
      if (value <= 15) {
        return <Badge className="bg-green-100 text-green-800">Excelente</Badge>;
      }
      if (value <= 20) {
        return <Badge className="bg-blue-100 text-blue-800">Bueno</Badge>;
      }
      if (value <= 25) {
        return <Badge className="bg-yellow-100 text-yellow-800">Regular</Badge>;
      }
      return <Badge className="bg-red-100 text-red-800">Lento</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reporte de rendimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <DashboardHeader
        user={user}
        title="Reporte de Rendimiento"
        subtitle="Análisis completo de tu desempeño como Runner360"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getRatingColor(metrics.overallRating)} mb-2`}>
                  {metrics.overallRating}/5
                </div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(metrics.overallRating) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <div className="text-sm text-gray-600">Calificación General</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatPrice(metrics.monthlyEarnings)}
                </div>
                <div className="text-sm text-gray-600">Ganancias Mensuales</div>
                <div className="text-xs text-green-600 mt-1">
                  ↑ {(((metrics.monthlyEarnings - 720000) / 720000) * 100).toFixed(1)}% vs mes
                  anterior
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Tasa de Conversión</div>
                <Progress value={metrics.conversionRate} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="monthly">Mensual</TabsTrigger>
            <TabsTrigger value="achievements">Logros</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Métricas de Desempeño
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <h4 className="font-medium">Visitas Completadas</h4>
                          <p className="text-sm text-gray-600">
                            De un total de {metrics.totalVisits}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {metrics.completedVisits}
                        </p>
                        <p className="text-sm text-gray-600">
                          {((metrics.completedVisits / metrics.totalVisits) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <h4 className="font-medium">Tiempo de Respuesta</h4>
                          <p className="text-sm text-gray-600">Promedio de respuesta</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {metrics.averageResponseTime}m
                        </p>
                        {getPerformanceBadge(metrics.averageResponseTime, 'time')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <div>
                          <h4 className="font-medium">Puntualidad</h4>
                          <p className="text-sm text-gray-600">Tasa de puntualidad</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600">
                          {metrics.onTimeRate.toFixed(1)}%
                        </p>
                        {getPerformanceBadge(metrics.onTimeRate, 'percentage')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium">Satisfacción del Cliente</h4>
                          <p className="text-sm text-gray-600">Calificación promedio</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-600">
                          {metrics.clientSatisfaction.toFixed(1)}%
                        </p>
                        {getPerformanceBadge(metrics.clientSatisfaction, 'percentage')}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Progresos y Logros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Progreso Mensual</h4>
                        <span className="text-sm text-gray-600">Junio 2024</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Meta de visitas</span>
                            <span>62/60</span>
                          </div>
                          <Progress value={103} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Meta de ganancias</span>
                            <span>
                              {formatPrice(metrics.monthlyEarnings)}/{formatPrice(800000)}
                            </span>
                          </div>
                          <Progress
                            value={(metrics.monthlyEarnings / 800000) * 100}
                            className="h-2"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Meta de rating</span>
                            <span>{metrics.overallRating}/4.5</span>
                          </div>
                          <Progress value={(metrics.overallRating / 5) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Logros Recientes</h4>
                      <div className="space-y-2">
                        {achievements
                          .filter(a => a.achieved)
                          .slice(0, 3)
                          .map(achievement => (
                            <div
                              key={achievement.id}
                              className="flex items-center gap-3 p-2 bg-green-50 rounded-lg"
                            >
                              <span className="text-lg">{achievement.icon}</span>
                              <div className="flex-1">
                                <h5 className="font-medium text-sm">{achievement.title}</h5>
                                <p className="text-xs text-gray-600">{achievement.description}</p>
                              </div>
                              <Trophy className="w-4 h-4 text-green-600" />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Desempeño Mensual
                </CardTitle>
                <CardDescription>Evolución de tus métricas mes a mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyPerformance.map(month => (
                    <div key={month.month} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{month.month}</h3>
                        {getPerformanceBadge(month.rating, 'rating')}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Rating</p>
                          <p className={`font-semibold ${getRatingColor(month.rating)}`}>
                            {month.rating}/5
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Visitas</p>
                          <p className="font-semibold">{month.visits}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Ganancias</p>
                          <p className="font-semibold text-green-600">
                            {formatPrice(month.earnings)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Puntualidad</p>
                          <p className="font-semibold">{month.onTimeRate.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Tiempo de respuesta</p>
                          <Progress
                            value={Math.max(0, 100 - (month.responseTime / 30) * 100)}
                            className="h-2"
                          />
                          <p className="text-xs text-gray-600 mt-1">{month.responseTime} minutos</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Puntualidad</p>
                          <Progress value={month.onTimeRate} className="h-2" />
                          <p className="text-xs text-gray-600 mt-1">
                            {month.onTimeRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Logros y Trofeos
                </CardTitle>
                <CardDescription>Tus accomplishments como Runner360</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`border rounded-lg p-4 ${achievement.achieved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`text-2xl ${achievement.achieved ? '' : 'grayscale opacity-50'}`}
                        >
                          {achievement.icon}
                        </span>
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center gap-2">
                            {achievement.title}
                            {achievement.achieved ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>

                          {achievement.achieved && achievement.date && (
                            <p className="text-xs text-green-600">
                              Logrado: {formatDateTime(achievement.date)}
                            </p>
                          )}

                          {achievement.value && !achievement.achieved && (
                            <div className="mt-2">
                              <Progress
                                value={(metrics.totalVisits / achievement.value) * 100}
                                className="h-2"
                              />
                              <p className="text-xs text-gray-600 mt-1">
                                Progreso: {metrics.totalVisits}/{achievement.value}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Feedback de Clientes
                </CardTitle>
                <CardDescription>Comentarios y calificaciones de tus clientes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{item.clientName}</h3>
                          <p className="text-sm text-gray-600">{item.propertyTitle}</p>
                          <p className="text-xs text-gray-500">{formatDateTime(item.date)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < item.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">&ldquo;{item.comment}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Metas y Objetivos
                </CardTitle>
                <CardDescription>Establece y sigue tus metas de rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-4">Metas del Mes Actual</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Visitas Mensuales</h5>
                          <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 mb-2">62/60</p>
                        <Progress value={103} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">103% completado</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Ganancias Mensuales</h5>
                          <Badge className="bg-green-100 text-green-800">Superado</Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          {formatPrice(metrics.monthlyEarnings)}
                        </p>
                        <Progress
                          value={(metrics.monthlyEarnings / 800000) * 100}
                          className="h-2"
                        />
                        <p className="text-xs text-gray-600 mt-1">Meta: {formatPrice(800000)}</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Rating Promedio</h5>
                          <Badge className="bg-yellow-100 text-yellow-800">Casi</Badge>
                        </div>
                        <p className="text-2xl font-bold text-yellow-600 mb-2">
                          {metrics.overallRating}/5.0
                        </p>
                        <Progress value={(metrics.overallRating / 5) * 100} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">Meta: 5.0</p>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">Tasa de Conversión</h5>
                          <Badge className="bg-green-100 text-green-800">Superado</Badge>
                        </div>
                        <p className="text-2xl font-bold text-green-600 mb-2">
                          {metrics.conversionRate.toFixed(1)}%
                        </p>
                        <Progress value={metrics.conversionRate} className="h-2" />
                        <p className="text-xs text-gray-600 mt-1">Meta: 75%</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="font-semibold mb-4">Recomendaciones de Mejora</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-blue-900">
                            Reduce el tiempo de respuesta
                          </h5>
                          <p className="text-sm text-blue-700">
                            Actualmente respondes en {metrics.averageResponseTime} minutos. Intenta
                            reducirlo a menos de 10 minutos para mejorar tu rating.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-green-900">
                            Mantén el excelente rendimiento
                          </h5>
                          <p className="text-sm text-green-700">
                            Tu tasa de conversión del {metrics.conversionRate.toFixed(1)}% está
                            excelente. Sigue así para alcanzar el logro &ldquo;Experto en Conversión
                            Plus&rdquo;.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <Target className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h5 className="font-medium text-yellow-900">Mejora la puntualidad</h5>
                          <p className="text-sm text-yellow-700">
                            Tu puntualidad del {metrics.onTimeRate.toFixed(1)}% es buena, pero
                            puedes alcanzar el 98% para desbloquear el logro &ldquo;Perfect
                            Timing&rdquo;.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <Button
                      onClick={() => {
                        alert(
                          'Descargando reporte de rendimiento en PDF... La descarga comenzará en breve.'
                        );
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar Reporte Completo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
