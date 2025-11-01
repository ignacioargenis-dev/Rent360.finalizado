'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import {
  ArrowLeft,
  User,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  Award,
  Activity,
} from 'lucide-react';

interface RunnerActivity {
  id: string;
  type: string;
  propertyTitle: string;
  propertyAddress: string;
  scheduledAt: string;
  status: string;
  earnings?: number;
  photosTaken?: number;
  rating?: number;
  feedback?: string;
}

interface RunnerIncentive {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string;
  amount: number;
  earnedAt: string;
}

export default function RunnerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const runnerId = params?.id as string;
  const { user } = useAuth();

  const [runner, setRunner] = useState<{ id: string; name: string } | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<RunnerActivity[]>([]);
  const [incentives, setIncentives] = useState<RunnerIncentive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (runnerId) {
      loadRunnerActivity();
    }
  }, [runnerId]);

  const loadRunnerActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/owner/runners/${runnerId}/activity`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Runner no encontrado');
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();

      if (data.success) {
        setRunner(data.runner);
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
        setIncentives(data.incentives || []);
      } else {
        throw new Error(data.error || 'Error al cargar datos del runner');
      }
    } catch (error) {
      logger.error('Error loading runner activity:', { error });
      setError('Error al cargar la información del runner');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      SCHEDULED: { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
    };
    const defaultConfig: { label: string; color: string } = { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
    const config = statusConfig[status] || defaultConfig;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando información del runner...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !runner) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Runner no encontrado'}
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'El runner solicitado no existe o no tienes acceso a él.'}
            </p>
            <Button onClick={() => router.push('/owner/runners')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Runners
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/owner/runners')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{runner.name}</h1>
            <p className="text-gray-600">Detalles y actividad del runner</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Visitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Completadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedVisits || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Ganancias Totales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  ${(stats.totalEarnings || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Calificación Promedio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold">
                    {(stats.averageRating || 0).toFixed(1)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>
              Últimas visitas y acciones realizadas por el runner
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 10).map(activity => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{activity.propertyTitle}</h3>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-sm text-gray-600">{activity.propertyAddress}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(activity.scheduledAt).toLocaleDateString('es-CL')}
                        </span>
                        {activity.earnings && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ${activity.earnings.toLocaleString()}
                          </span>
                        )}
                        {activity.rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            {activity.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {activity.feedback && (
                        <p className="text-xs text-gray-500 mt-2 italic">"{activity.feedback}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No hay actividad reciente</p>
            )}
          </CardContent>
        </Card>

        {/* Incentives */}
        {incentives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Incentivos Ganados
              </CardTitle>
              <CardDescription>Recompensas e incentivos obtenidos por el runner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incentives.map(incentive => (
                  <div
                    key={incentive.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-semibold">{incentive.name}</h3>
                      <p className="text-sm text-gray-600">{incentive.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(incentive.earnedAt).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                    {incentive.amount > 0 && (
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">
                          ${incentive.amount.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}

