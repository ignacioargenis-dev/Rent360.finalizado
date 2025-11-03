'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Trophy,
  Target,
  Star,
  Award,
  Gift,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Zap,
  Users,
} from 'lucide-react';
import { User } from '@/types';

interface Incentive {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'bonus' | 'reward' | 'milestone';
  category: 'performance' | 'efficiency' | 'quality' | 'loyalty';
  value: number;
  currency: 'CLP' | 'points';
  status: 'earned' | 'in_progress' | 'available' | 'expired';
  earnedDate?: string;
  progress?: number;
  target?: number;
  expiresAt?: string;
}

interface IncentiveStats {
  totalEarned: number;
  activeIncentives: number;
  completedThisMonth: number;
  pointsBalance: number;
  nextMilestone: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  requirements: string[];
}

export default function RunnerIncentivesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [availableRules, setAvailableRules] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<IncentiveStats>({
    totalEarned: 0,
    activeIncentives: 0,
    completedThisMonth: 0,
    pointsBalance: 0,
    nextMilestone: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const loadIncentivesData = async () => {
      try {
        setLoading(true);
        // ✅ Obtener incentivos otorgados desde la API
        const response = await fetch('/api/runner/incentives', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar incentivos: ${response.status}`);
        }

        const result = await response.json();
        const incentivesData = result.data || [];

        // ✅ Obtener reglas disponibles con progreso
        const availableResponse = await fetch('/api/runner/incentives/available', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        let availableRulesData: any[] = [];
        if (availableResponse.ok) {
          const availableResult = await availableResponse.json();
          availableRulesData = availableResult.rules || [];
        }

        // Transformar datos al formato esperado
        const transformedIncentives: Incentive[] = incentivesData.map((inc: any) => {
          const achievementData = inc.achievementData || {};
          const rewardsGranted = inc.rewardsGranted || {};

          // Mapear tipo de incentivo
          const typeMap: Record<string, 'achievement' | 'bonus' | 'reward' | 'milestone'> = {
            performance: 'milestone',
            rating: 'achievement',
            volume: 'bonus',
            loyalty: 'reward',
            seasonal: 'achievement',
          };

          // Mapear categoría
          const categoryMap: Record<string, 'performance' | 'efficiency' | 'quality' | 'loyalty'> =
            {
              bronze: 'performance',
              silver: 'efficiency',
              gold: 'quality',
              platinum: 'quality',
              diamond: 'loyalty',
            };

          const statusMap: Record<string, 'earned' | 'in_progress' | 'available' | 'expired'> = {
            EARNED: 'earned',
            GRANTED: 'earned',
            CLAIMED: 'earned',
            EXPIRED: 'expired',
          };

          return {
            id: inc.id,
            title: inc.incentiveRule?.name || 'Incentivo',
            description: inc.incentiveRule?.description || '',
            type: typeMap[inc.incentiveRule?.type || 'performance'] || 'achievement',
            category: categoryMap[inc.incentiveRule?.category || 'bronze'] || 'performance',
            value: rewardsGranted.bonusAmount || inc.incentiveRule?.rewardAmount || 0,
            currency: 'CLP',
            status: statusMap[inc.status] || 'available',
            earnedDate: inc.earnedAt ? new Date(inc.earnedAt).toISOString() : undefined,
            progress: achievementData.visitsCompleted,
            target: achievementData.target,
            expiresAt: inc.expiresAt ? new Date(inc.expiresAt).toISOString() : undefined,
          };
        });

        // Calcular estadísticas
        const earnedIncentives = transformedIncentives.filter(i => i.status === 'earned');
        const activeIncentives = transformedIncentives.filter(
          i => i.status === 'in_progress' || i.status === 'available'
        ).length;
        const completedThisMonth = earnedIncentives.filter(i => {
          if (!i.earnedDate) {
            return false;
          }
          const earnedDate = new Date(i.earnedDate);
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);
          return earnedDate >= monthStart;
        }).length;
        const totalEarnedMoney = earnedIncentives
          .filter(i => i.currency === 'CLP')
          .reduce((sum, i) => sum + i.value, 0);

        setIncentives(transformedIncentives);
        setStats({
          totalEarned: earnedIncentives.length,
          activeIncentives,
          completedThisMonth,
          pointsBalance: totalEarnedMoney,
          nextMilestone:
            transformedIncentives.find(i => i.status === 'available')?.title || 'Ninguno',
        });

        // Achievements data (puede mejorarse después con datos reales desde base de datos)
        const achievements: Achievement[] = transformedIncentives
          .filter(i => i.status === 'earned')
          .map(i => {
            const achievement: Achievement = {
              id: i.id,
              name: i.title,
              description: i.description,
              icon:
                i.category === 'quality' ? 'star' : i.category === 'performance' ? 'trophy' : 'zap',
              unlocked: true,
              requirements: [i.description],
            };
            if (i.earnedDate) {
              achievement.unlockedDate = i.earnedDate;
            }
            return achievement;
          });

        setAchievements(achievements);
        setAvailableRules(availableRulesData);

        // Actualizar estadísticas con reglas disponibles
        const availableCount = availableRulesData.filter(
          r => r?.isAvailable && !r?.isEarned
        ).length;
        setStats(prev => ({
          ...prev,
          activeIncentives: prev.activeIncentives + availableCount,
        }));
      } catch (error) {
        logger.error('Error loading incentives data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadIncentivesData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'earned':
        return <Badge className="bg-green-100 text-green-800">Ganado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'available':
        return <Badge className="bg-yellow-100 text-yellow-800">Disponible</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800">Expirado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance':
        return <Target className="w-5 h-5 text-blue-600" />;
      case 'efficiency':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      case 'quality':
        return <Star className="w-5 h-5 text-green-600" />;
      case 'loyalty':
        return <Award className="w-5 h-5 text-purple-600" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'star':
        return <Star className="w-8 h-8 text-yellow-500" />;
      case 'trophy':
        return <Trophy className="w-8 h-8 text-yellow-600" />;
      case 'zap':
        return <Zap className="w-8 h-8 text-blue-500" />;
      case 'award':
        return <Award className="w-8 h-8 text-purple-600" />;
      default:
        return <Trophy className="w-8 h-8" />;
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'CLP') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(value);
    }
    return `${value} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando incentivos y logros...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mis Recompensas"
      subtitle="Bonificaciones monetarias y reconocimientos por tu rendimiento"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Recompensas</h1>
            <p className="text-gray-600">
              Bonificaciones monetarias y reconocimientos por tu excelente rendimiento
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Cambiar a la pestaña de "Disponibles"
                const availableTab = document.querySelector(
                  '#incentives-tabs [value="available"]'
                ) as HTMLElement;
                if (availableTab) {
                  availableTab.click();
                }
              }}
            >
              <Target className="w-4 h-4 mr-2" />
              Ver Incentivos Disponibles
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganados</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEarned}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeIncentives}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEarned * 10000, 'CLP')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Incentives List */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="earned" className="w-full" id="incentives-tabs">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="earned">Ganados ({incentives.length})</TabsTrigger>
                <TabsTrigger value="available">
                  Disponibles ({availableRules.filter(r => !r.isEarned).length})
                </TabsTrigger>
              </TabsList>

              {/* Pestaña: Incentivos Ganados */}
              <TabsContent value="earned">
                <Card>
                  <CardHeader>
                    <CardTitle>Incentivos Ganados</CardTitle>
                    <CardDescription>Tus logros y recompensas obtenidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {incentives.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>Aún no has ganado ningún incentivo</p>
                          <p className="text-sm mt-2">
                            Completa más visitas y mejora tu rendimiento para ganar recompensas
                          </p>
                        </div>
                      ) : (
                        incentives.map(incentive => (
                          <Card key={incentive.id} className="border">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="p-2 bg-gray-100 rounded-lg">
                                    {getCategoryIcon(incentive.category)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-gray-900">
                                        {incentive.title}
                                      </h3>
                                      {getStatusBadge(incentive.status)}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      {incentive.description}
                                    </p>

                                    {incentive.progress !== undefined && incentive.target && (
                                      <div className="mb-2">
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                          <span>Progreso</span>
                                          <span>
                                            {incentive.progress}/{incentive.target}
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                              width: `${(incentive.progress / incentive.target) * 100}%`,
                                            }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="w-3 h-3" />
                                        <span className="font-medium">
                                          {formatCurrency(incentive.value, incentive.currency)}
                                        </span>
                                      </div>
                                      {incentive.earnedDate && (
                                        <div className="flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          <span>{formatDate(incentive.earnedDate)}</span>
                                        </div>
                                      )}
                                      {incentive.expiresAt && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>Expira: {formatDate(incentive.expiresAt)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Pestaña: Incentivos Disponibles */}
              <TabsContent value="available">
                <Card>
                  <CardHeader>
                    <CardTitle>Incentivos Disponibles</CardTitle>
                    <CardDescription>
                      Reglas de incentivos activas y tu progreso hacia cada una
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {availableRules.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p>No hay incentivos disponibles en este momento</p>
                        </div>
                      ) : (
                        availableRules
                          .filter(rule => !rule.isEarned)
                          .map(rule => {
                            const rewardValue =
                              rule.rewards.bonusAmount ||
                              (rule.rewards.bonusPercentage
                                ? `${rule.rewards.bonusPercentage}%`
                                : 'Recompensa especial');

                            return (
                              <Card
                                key={rule.id}
                                className="border-2 border-dashed border-gray-200"
                              >
                                <CardContent className="pt-6">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                      <div className="p-2 bg-emerald-100 rounded-lg">
                                        <Trophy className="w-5 h-5 text-emerald-600" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h3 className="font-semibold text-gray-900">
                                            {rule.name}
                                          </h3>
                                          <Badge
                                            variant={rule.isAvailable ? 'default' : 'secondary'}
                                            className={
                                              rule.isAvailable
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : ''
                                            }
                                          >
                                            {rule.isAvailable ? '¡Disponible!' : 'En Progreso'}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-3">
                                          {rule.description}
                                        </p>

                                        {/* Progreso */}
                                        <div className="mb-3">
                                          <div className="flex justify-between text-xs text-gray-600 mb-2">
                                            <span className="font-medium">Progreso</span>
                                            <span className="font-bold">
                                              {Math.round(rule.progress)}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                              className={`h-3 rounded-full transition-all ${
                                                rule.isAvailable
                                                  ? 'bg-green-500'
                                                  : rule.progress > 50
                                                    ? 'bg-blue-500'
                                                    : 'bg-yellow-500'
                                              }`}
                                              style={{
                                                width: `${Math.min(100, rule.progress)}%`,
                                              }}
                                            />
                                          </div>
                                        </div>

                                        {/* Detalles de progreso */}
                                        <div className="space-y-1 mb-3">
                                          {rule.progressDetails?.visits && (
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-600">Visitas:</span>
                                              <span className="font-medium">
                                                {rule.progressDetails.visits.current}/
                                                {rule.progressDetails.visits.target}
                                              </span>
                                            </div>
                                          )}
                                          {rule.progressDetails?.rating && (
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-600">Calificación:</span>
                                              <span className="font-medium">
                                                {rule.progressDetails.rating.current.toFixed(1)}/
                                                {rule.progressDetails.rating.target}
                                              </span>
                                            </div>
                                          )}
                                          {rule.progressDetails?.earnings && (
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-600">Ganancias:</span>
                                              <span className="font-medium">
                                                $
                                                {rule.progressDetails.earnings.current.toLocaleString()}
                                                / $
                                                {rule.progressDetails.earnings.target.toLocaleString()}
                                              </span>
                                            </div>
                                          )}
                                          {rule.progressDetails?.completionRate && (
                                            <div className="flex justify-between text-xs">
                                              <span className="text-gray-600">
                                                Tasa de Completitud:
                                              </span>
                                              <span className="font-medium">
                                                {rule.progressDetails.completionRate.current}%/
                                                {rule.progressDetails.completionRate.target}%
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        {/* Recompensa */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                                          <div className="flex items-center gap-2">
                                            <Gift className="w-4 h-4 text-emerald-600" />
                                            <span className="font-semibold text-emerald-700">
                                              {typeof rewardValue === 'number'
                                                ? formatCurrency(rewardValue, 'CLP')
                                                : rewardValue}
                                            </span>
                                            {rule.rewards.badge && (
                                              <span className="text-xl">{rule.rewards.badge}</span>
                                            )}
                                          </div>
                                          {rule.isAvailable && (
                                            <Badge className="bg-green-100 text-green-800 animate-pulse">
                                              ¡Listo para reclamar!
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Achievements Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Logros</CardTitle>
                <CardDescription>Insignias y reconocimientos especiales</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border ${
                        achievement.unlocked
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`p-2 rounded-full ${
                            achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                          }`}
                        >
                          {achievement.unlocked ? (
                            getAchievementIcon(achievement.icon)
                          ) : (
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 text-xs">?</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                          {achievement.unlocked && achievement.unlockedDate && (
                            <p className="text-xs text-green-600">
                              Desbloqueado: {formatDate(achievement.unlockedDate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      {!achievement.unlocked && (
                        <div className="text-xs text-gray-500">
                          <strong>Requisitos:</strong>
                          <ul className="mt-1 ml-4 list-disc">
                            {achievement.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Next Milestone */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Próximo Hito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <Target className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">{stats.nextMilestone}</p>
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          alert(
                            'Próximo objetivo: Conviértete en el corredor del mes completando 25% más visitas este mes para ganar $100.000 adicionales.'
                          )
                        }
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
