'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Award, Gift, TrendingUp, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { User } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface RunnerIncentive {
  id: string;
  incentiveRuleId: string;
  status: 'earned' | 'granted' | 'claimed' | 'expired';
  earnedAt: Date;
  grantedAt?: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  achievementData: {
    visitsCompleted?: number;
    ratingAchieved?: number;
    earningsGenerated?: number;
    rankingPosition?: number;
    periodStart: Date;
    periodEnd: Date;
  };
  rewardsGranted: {
    bonusAmount?: number;
    badge?: string;
    title?: string;
    features?: string[];
  };
  incentiveRule: {
    name: string;
    description: string;
    category: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    type: 'performance' | 'rating' | 'volume' | 'loyalty' | 'seasonal';
  };
}

interface IncentiveLeaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  rankings: {
    position: number;
    runnerId: string;
    runnerName: string;
    score: number;
    incentives: string[];
    totalRewards: number;
  }[];
  topPerformers: {
    category: string;
    runnerId: string;
    runnerName: string;
    achievement: string;
    reward: string;
  }[];
}

export default function RunnerIncentivesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [incentives, setIncentives] = useState<RunnerIncentive[]>([]);
  const [leaderboard, setLeaderboard] = useState<IncentiveLeaderboard | null>(null);
  const [activeTab, setActiveTab] = useState('my-incentives');
  const [claimingIncentive, setClaimingIncentive] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadIncentives();
    loadLeaderboard();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadIncentives = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/runner/incentives');
      if (response.ok) {
        const data = await response.json();
        setIncentives(data.data);
      }
    } catch (error) {
      console.error('Error loading incentives:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await fetch('/api/runner/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const claimIncentive = async (incentiveId: string) => {
    try {
      setClaimingIncentive(incentiveId);
      const response = await fetch(`/api/runner/incentives/${incentiveId}/claim`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert('¡Incentivo reclamado exitosamente! 🎉');

        // Recargar incentivos
        await loadIncentives();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error claiming incentive:', error);
      alert('Error reclamando incentivo');
    } finally {
      setClaimingIncentive(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL');
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      bronze: 'bg-amber-100 text-amber-800 border-amber-200',
      silver: 'bg-gray-100 text-gray-800 border-gray-200',
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      platinum: 'bg-purple-100 text-purple-800 border-purple-200',
      diamond: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[category as keyof typeof colors] || colors.bronze;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      earned: 'bg-blue-100 text-blue-800',
      granted: 'bg-green-100 text-green-800',
      claimed: 'bg-purple-100 text-purple-800',
      expired: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.earned;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'earned': return <Trophy className="w-4 h-4" />;
      case 'granted': return <Gift className="w-4 h-4" />;
      case 'claimed': return <CheckCircle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const availableIncentives = incentives.filter(i => i.status === 'granted');
  const claimedIncentives = incentives.filter(i => i.status === 'claimed');
  const expiredIncentives = incentives.filter(i => i.status === 'expired');

  return (
    <DashboardLayout title="Mis Incentivos" subtitle="Logros y recompensas por tu rendimiento">
      <DashboardHeader
        user={user}
        title="Mis Incentivos"
        subtitle="Celebra tus logros y reclama tus recompensas"
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Incentivos Disponibles</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {availableIncentives.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Incentivos Reclamados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {claimedIncentives.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Total Recompensas</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPrice(incentives.reduce((sum, i) => sum + (i.rewardsGranted.bonusAmount || 0), 0))}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Mi Posición</p>
                  <p className="text-2xl font-bold text-blue-900">
                    #{leaderboard?.rankings.find(r => r.runnerId === user?.id)?.position || 'N/A'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my-incentives">Mis Incentivos</TabsTrigger>
            <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
            <TabsTrigger value="achievements">Logros</TabsTrigger>
          </TabsList>

          {/* My Incentives Tab */}
          <TabsContent value="my-incentives" className="space-y-6">
            {/* Available Incentives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5" />
                  Incentivos Disponibles para Reclamar
                </CardTitle>
                <CardDescription>
                  Reclama tus recompensas por logros alcanzados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableIncentives.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay incentivos disponibles
                    </h3>
                    <p className="text-gray-600">
                      ¡Sigue trabajando duro para desbloquear nuevas recompensas!
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {availableIncentives.map((incentive) => (
                      <Card key={incentive.id} className="border-l-4 border-l-green-500">
                        <CardContent className="pt-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {incentive.incentiveRule.name}
                                  </h3>
                                  <p className="text-gray-600 text-sm mb-2">
                                    {incentive.incentiveRule.description}
                                  </p>
                                </div>
                                <Badge className={getCategoryColor(incentive.incentiveRule.category)}>
                                  {incentive.incentiveRule.category.toUpperCase()}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                {incentive.rewardsGranted.bonusAmount && (
                                  <div>
                                    <p className="text-sm text-gray-600">Bono</p>
                                    <p className="font-semibold text-green-600">
                                      {formatPrice(incentive.rewardsGranted.bonusAmount)}
                                    </p>
                                  </div>
                                )}
                                {incentive.achievementData.visitsCompleted && (
                                  <div>
                                    <p className="text-sm text-gray-600">Visitas</p>
                                    <p className="font-semibold">{incentive.achievementData.visitsCompleted}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Ganado: {formatDate(incentive.earnedAt)}
                                </div>
                                {incentive.expiresAt && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Expira: {formatDate(incentive.expiresAt)}
                                  </div>
                                )}
                              </div>
                            </div>

                            <Button
                              onClick={() => claimIncentive(incentive.id)}
                              disabled={claimingIncentive === incentive.id}
                              className="lg:ml-4"
                            >
                              {claimingIncentive === incentive.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Reclamando...
                                </>
                              ) : (
                                <>
                                  <Gift className="w-4 h-4 mr-2" />
                                  Reclamar Recompensa
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claimed Incentives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Incentivos Reclamados
                </CardTitle>
                <CardDescription>
                  Historial de recompensas obtenidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {claimedIncentives.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Aún no has reclamado ningún incentivo</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {claimedIncentives.map((incentive) => (
                      <Card key={incentive.id} className="bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {incentive.incentiveRule.name}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                Reclamado el {formatDate(incentive.claimedAt!)}
                              </p>
                              <div className="flex items-center gap-4">
                                {incentive.rewardsGranted.bonusAmount && (
                                  <span className="text-sm font-medium text-green-600">
                                    {formatPrice(incentive.rewardsGranted.bonusAmount)}
                                  </span>
                                )}
                                {incentive.rewardsGranted.badge && (
                                  <span className="text-sm">{incentive.rewardsGranted.badge}</span>
                                )}
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Reclamado
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="space-y-6">
            {leaderboard && (
              <>
                {/* Top Performers */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Top Performers de la Semana
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {leaderboard.topPerformers.map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-gray-900">{performer.runnerName}</h3>
                            <p className="text-sm text-gray-600">{performer.achievement}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getCategoryColor(performer.category)}>
                              {performer.category.toUpperCase()}
                            </Badge>
                            <p className="text-sm font-medium mt-1">{performer.reward}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Full Ranking */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Ranking Completo
                    </CardTitle>
                    <CardDescription>
                      Posición de todos los runners según incentivos obtenidos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.rankings.map((ranking) => (
                        <div key={ranking.runnerId} className={`flex items-center justify-between p-4 rounded-lg ${
                          ranking.runnerId === user?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              ranking.position <= 3 ? 'bg-yellow-500 text-white' : 'bg-gray-300 text-gray-700'
                            }`}>
                              {ranking.position}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{ranking.runnerName}</h3>
                              <p className="text-sm text-gray-600">
                                {ranking.incentives.length} incentivo{ranking.incentives.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{ranking.score} pts</p>
                            <p className="text-sm text-green-600">{formatPrice(ranking.totalRewards)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Achievement Categories */}
              {[
                { title: 'Super Runner', description: 'Completa 20+ visitas semanales', icon: '🏃‍♂️', category: 'bronze' },
                { title: 'Top Earner', description: 'Genera $100.000+ en ganancias semanales', icon: '💰', category: 'silver' },
                { title: 'Perfectionist', description: 'Mantén rating 4.9+ con 10+ visitas', icon: '⭐', category: 'gold' },
                { title: 'Rising Star', description: 'Mejora tu rating 0.3+ puntos mensuales', icon: '📈', category: 'silver' },
                { title: 'Loyalty Champion', description: 'Top 10 por 3 meses consecutivos', icon: '👑', category: 'platinum' },
                { title: 'Community Hero', description: 'Ayuda a nuevos runners', icon: '🤝', category: 'gold' }
              ].map((achievement, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-4">{achievement.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{achievement.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{achievement.description}</p>
                    <Badge className={getCategoryColor(achievement.category)}>
                      {achievement.category.toUpperCase()}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Achievement Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Mi Progreso
                </CardTitle>
                <CardDescription>
                  Avance hacia los próximos logros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Super Runner', current: 15, target: 20, unit: 'visitas' },
                    { name: 'Top Earner', current: 75000, target: 100000, unit: 'ganancias' },
                    { name: 'Perfectionist', current: 4.7, target: 4.9, unit: 'rating' }
                  ].map((progress, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{progress.name}</span>
                        <span className="text-gray-600">
                          {typeof progress.current === 'number' && progress.current > 1000
                            ? formatPrice(progress.current)
                            : progress.current
                          } / {typeof progress.target === 'number' && progress.target > 1000
                            ? formatPrice(progress.target)
                            : progress.target
                          } {progress.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(100, (progress.current / progress.target) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout
  );
}
