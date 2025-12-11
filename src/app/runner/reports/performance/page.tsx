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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

  const [goals, setGoals] = useState<
    Array<{
      id: string;
      goalType: string;
      targetValue: number;
      currentValue: number;
      period: string;
      periodStart: string;
      periodEnd: string;
      isActive: boolean;
      isAchieved: boolean;
      achievedAt: string | null;
      notes: string | null;
      progress: number;
    }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalForm, setGoalForm] = useState({
    goalType: 'VISITS',
    targetValue: '',
    period: 'MONTHLY',
    notes: '',
  });
  const [savingGoal, setSavingGoal] = useState(false);

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

        // Cargar metas desde la respuesta
        if (data.goals && Array.isArray(data.goals)) {
          setGoals(data.goals);
        } else {
          // Si no hay metas en la respuesta, cargarlas por separado
          await loadGoals();
        }
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

  // Cargar metas activas (mensuales por defecto)
  const loadGoals = async () => {
    try {
      const response = await fetch('/api/runner/goals?period=MONTHLY&isActive=true', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.goals) {
          setGoals(result.goals);
        }
      }
    } catch (error) {
      logger.error('Error cargando metas:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getGoalTypeName = (goalType: string) => {
    const names: Record<string, string> = {
      VISITS: 'Visitas',
      EARNINGS: 'Ganancias',
      RATING: 'Rating',
      CONVERSION_RATE: 'Tasa de Conversión',
      ON_TIME_RATE: 'Puntualidad',
      RESPONSE_TIME: 'Tiempo de Respuesta',
    };
    return names[goalType] || goalType;
  };

  const formatGoalValue = (goalType: string, value: number) => {
    switch (goalType) {
      case 'EARNINGS':
        return formatPrice(value);
      case 'RATING':
        return `${value.toFixed(1)}/5.0`;
      case 'CONVERSION_RATE':
      case 'ON_TIME_RATE':
        return `${value.toFixed(1)}%`;
      case 'RESPONSE_TIME':
        return `${value.toFixed(0)}m`;
      default:
        return value.toString();
    }
  };

  const handleOpenCreateGoal = () => {
    setEditingGoalId(null);
    setGoalForm({
      goalType: 'VISITS',
      targetValue: '',
      period: 'MONTHLY',
      notes: '',
    });
    setShowGoalDialog(true);
  };

  const handleEditGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      return;
    }
    setEditingGoalId(goalId);
    setGoalForm({
      goalType: goal.goalType,
      targetValue: goal.targetValue.toString(),
      period: goal.period,
      notes: goal.notes || '',
    });
    setShowGoalDialog(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const confirmDelete = window.confirm('¿Deseas desactivar esta meta?');
    if (!confirmDelete) {
      return;
    }
    try {
      const resp = await fetch(`/api/runner/goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (resp.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId));
      }
    } catch (error) {
      logger.error('Error desactivando meta:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSaveGoal = async () => {
    if (!goalForm.targetValue) {
      return;
    }
    setSavingGoal(true);
    try {
      const payload = {
        goalType: goalForm.goalType,
        targetValue: parseFloat(goalForm.targetValue),
        period: goalForm.period,
        notes: goalForm.notes || null,
      };

      const resp = await fetch(
        editingGoalId ? `/api/runner/goals/${editingGoalId}` : '/api/runner/goals',
        {
          method: editingGoalId ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (resp.ok) {
        const result = await resp.json();
        if (editingGoalId) {
          setGoals(prev => prev.map(g => (g.id === editingGoalId ? { ...g, ...result.goal } : g)));
        } else {
          setGoals(prev => [...prev, result.goal]);
        }
        setShowGoalDialog(false);
      }
    } catch (error) {
      logger.error('Error guardando meta:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSavingGoal(false);
    }
  };

  // Función para obtener el valor actual de la meta desde las métricas
  const getCurrentValueForGoal = (goalType: string) => {
    switch (goalType) {
      case 'VISITS':
        return metrics.completedVisits;
      case 'EARNINGS':
        return metrics.monthlyEarnings;
      case 'RATING':
        return metrics.overallRating;
      case 'CONVERSION_RATE':
        return metrics.conversionRate;
      case 'ON_TIME_RATE':
        return metrics.onTimeRate;
      case 'RESPONSE_TIME':
        return metrics.averageResponseTime;
      default:
        return 0;
    }
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
                {(() => {
                  // Calcular crecimiento basado en monthlyPerformance
                  const growth =
                    metrics.monthlyEarnings > 0 && monthlyPerformance.length >= 2
                      ? ((metrics.monthlyEarnings -
                          (monthlyPerformance[monthlyPerformance.length - 2]?.earnings || 0)) /
                          (monthlyPerformance[monthlyPerformance.length - 2]?.earnings || 1)) *
                        100
                      : 0;
                  return growth !== 0 ? (
                    <div
                      className={`text-xs mt-1 ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% vs mes anterior
                    </div>
                  ) : null;
                })()}
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
                        <span className="text-sm text-gray-600">
                          {new Date().toLocaleDateString('es-CL', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {(goals.length > 0 ? goals.slice(0, 4) : []).map(goal => (
                          <div key={goal.id}>
                            <div className="flex justify-between text-sm mb-1">
                              <span>{getGoalTypeName(goal.goalType)}</span>
                              <span>
                                {formatGoalValue(goal.goalType, goal.currentValue)} /{' '}
                                {formatGoalValue(goal.goalType, goal.targetValue)}
                              </span>
                            </div>
                            <Progress value={Math.min(100, goal.progress)} className="h-2" />
                            <div className="text-xs text-gray-600 mt-1">
                              {Math.min(100, Math.round(goal.progress))}% completado ·{' '}
                              {goal.isAchieved ? 'Completada' : 'En progreso'}
                            </div>
                          </div>
                        ))}
                        {goals.length === 0 && (
                          <p className="text-sm text-gray-500">
                            Aún no tienes metas activas. Crea una meta en la pestaña Metas.
                          </p>
                        )}
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
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Crea metas y haz seguimiento de tu avance.
                    </p>
                  </div>
                  <Button onClick={handleOpenCreateGoal}>Nueva meta</Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {goals.map(goal => {
                    const progress = Math.min(100, Math.round(goal.progress));
                    return (
                      <div key={goal.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase text-gray-500">{goal.period}</p>
                            <h4 className="font-semibold text-lg">
                              {getGoalTypeName(goal.goalType)}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatGoalValue(goal.goalType, goal.currentValue)} /{' '}
                              {formatGoalValue(goal.goalType, goal.targetValue)}
                            </p>
                          </div>
                          <Badge className={goal.isAchieved ? 'bg-green-100 text-green-800' : ''}>
                            {goal.isAchieved ? 'Completada' : 'En progreso'}
                          </Badge>
                        </div>

                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-gray-600">{progress}% completado</p>
                        <p className="text-xs text-gray-500">
                          {new Date(goal.periodStart).toLocaleDateString('es-CL')} -{' '}
                          {new Date(goal.periodEnd).toLocaleDateString('es-CL')}
                        </p>
                        {goal.notes && <p className="text-sm text-gray-700">Notas: {goal.notes}</p>}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditGoal(goal.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteGoal(goal.id)}
                          >
                            Desactivar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {goals.length === 0 && (
                  <p className="text-sm text-gray-500 mt-4">
                    No tienes metas activas. Crea tu primera meta para comenzar a medir tu progreso.
                  </p>
                )}

                <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingGoalId ? 'Editar meta' : 'Nueva meta'}</DialogTitle>
                      <DialogDescription>Define tus objetivos y su período.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Tipo de meta</Label>
                        <Select
                          value={goalForm.goalType}
                          onValueChange={value =>
                            setGoalForm(prev => ({ ...prev, goalType: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VISITS">Visitas</SelectItem>
                            <SelectItem value="EARNINGS">Ganancias</SelectItem>
                            <SelectItem value="RATING">Rating</SelectItem>
                            <SelectItem value="CONVERSION_RATE">Tasa de Conversión</SelectItem>
                            <SelectItem value="ON_TIME_RATE">Puntualidad</SelectItem>
                            <SelectItem value="RESPONSE_TIME">Tiempo de Respuesta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Valor objetivo</Label>
                        <Input
                          type="number"
                          value={goalForm.targetValue}
                          onChange={e =>
                            setGoalForm(prev => ({ ...prev, targetValue: e.target.value }))
                          }
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Período</Label>
                        <Select
                          value={goalForm.period}
                          onValueChange={value => setGoalForm(prev => ({ ...prev, period: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WEEKLY">Semanal</SelectItem>
                            <SelectItem value="MONTHLY">Mensual</SelectItem>
                            <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                            <SelectItem value="YEARLY">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Notas (opcional)</Label>
                        <Textarea
                          value={goalForm.notes}
                          onChange={e => setGoalForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveGoal} disabled={savingGoal}>
                        {savingGoal ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
