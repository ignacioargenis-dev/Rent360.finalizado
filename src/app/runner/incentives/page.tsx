'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        // Mock incentives data
        const mockIncentives: Incentive[] = [
          {
            id: '1',
            title: 'Bonificación por Eficiencia',
            description: 'Completar 10 visitas en menos de 30 minutos cada una',
            type: 'bonus',
            category: 'efficiency',
            value: 25000,
            currency: 'CLP',
            status: 'earned',
            earnedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          },
          {
            id: '2',
            title: 'Cliente Satisfecho',
            description: 'Mantener un rating promedio de 4.8 o superior',
            type: 'achievement',
            category: 'quality',
            value: 5000,
            currency: 'CLP',
            status: 'earned',
            earnedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
          {
            id: '3',
            title: 'Corredor del Mes',
            description: 'Ser el corredor con mejor rendimiento del mes',
            type: 'milestone',
            category: 'performance',
            value: 100000,
            currency: 'CLP',
            status: 'in_progress',
            progress: 75,
            target: 100,
          },
          {
            id: '4',
            title: 'Primera Semana Perfecta',
            description: 'Completar todos los trabajos asignados en una semana sin retrasos',
            type: 'achievement',
            category: 'performance',
            value: 15000,
            currency: 'CLP',
            status: 'available',
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
          },
          {
            id: '5',
            title: 'Lealtad Premium',
            description: 'Trabajar con Rent360 por más de 6 meses',
            type: 'reward',
            category: 'loyalty',
            value: 50,
            currency: 'points',
            status: 'earned',
            earnedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          },
        ];

        // Mock achievements data
        const mockAchievements: Achievement[] = [
          {
            id: '1',
            name: 'Primer Trabajo',
            description: 'Completa tu primer trabajo exitosamente',
            icon: 'star',
            unlocked: true,
            unlockedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            requirements: ['Completar 1 trabajo'],
          },
          {
            id: '2',
            name: 'Cliente Feliz',
            description: 'Recibe tu primera calificación de 5 estrellas',
            icon: 'trophy',
            unlocked: true,
            unlockedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            requirements: ['Obtener calificación 5★'],
          },
          {
            id: '3',
            name: 'Eficiencia Máxima',
            description: 'Completa 50 trabajos en tiempo récord',
            icon: 'zap',
            unlocked: false,
            requirements: ['Completar 50 trabajos', 'Tiempo promedio < 25 min'],
          },
          {
            id: '4',
            name: 'Leyenda Rent360',
            description: 'Alcanza el estatus de corredor legendario',
            icon: 'award',
            unlocked: false,
            requirements: ['100 trabajos completados', 'Rating promedio 4.9+', '0 quejas'],
          },
        ];

        setIncentives(mockIncentives);
        setAchievements(mockAchievements);

        // Calculate stats
        const earnedIncentives = mockIncentives.filter(i => i.status === 'earned');
        const activeIncentives = mockIncentives.filter(i => i.status === 'in_progress').length;
        const completedThisMonth = earnedIncentives.filter(
          i =>
            i.earnedDate && new Date(i.earnedDate) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        ).length;
        const pointsBalance = earnedIncentives
          .filter(i => i.currency === 'points')
          .reduce((sum, i) => sum + i.value, 0);

        const incentiveStats: IncentiveStats = {
          totalEarned: earnedIncentives.length,
          activeIncentives,
          completedThisMonth,
          pointsBalance,
          nextMilestone: 'Corredor del Mes - 25% completado',
        };

        setStats(incentiveStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading incentives data:', {
          error: error instanceof Error ? error.message : String(error),
        });
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
      title="Mis Incentivos"
      subtitle="Logros, bonificaciones y recompensas por tu rendimiento"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Incentivos</h1>
            <p className="text-gray-600">Revisa tus logros, bonificaciones y próximos objetivos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Gift className="w-4 h-4 mr-2" />
              Canjear Puntos
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
                  <p className="text-sm font-medium text-gray-600">Puntos Disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pointsBalance}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Incentives List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Incentivos y Bonificaciones</CardTitle>
                <CardDescription>Tus logros y recompensas obtenidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {incentives.map(incentive => (
                    <Card key={incentive.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getCategoryIcon(incentive.category)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">{incentive.title}</h3>
                                {getStatusBadge(incentive.status)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{incentive.description}</p>

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
                  ))}
                </div>
              </CardContent>
            </Card>
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
                      <Button className="w-full mt-3" size="sm" variant="outline">
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
