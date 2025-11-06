'use client';

import { useState, useEffect } from 'react';

import { logger } from '@/lib/logger-minimal';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Calendar,
  Clock,
  Star,
  MessageCircle,
  Bell,
  CheckCircle,
  Camera,
  DollarSign,
  TrendingUp,
  Phone,
  Mail,
  Car,
  Award,
  Target,
  ChevronRight,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface DashboardStats {
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  monthlyEarnings: number;
  averageRating: number;
  responseTime: number;
}

interface Visit {
  id: string;
  propertyTitle: string;
  address: string;
  clientName: string;
  clientPhone: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  estimatedDuration: number;
  notes?: string;
}

interface RecentActivity {
  id: string;
  type: 'visit' | 'rating' | 'message' | 'payment';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
}

export default function RunnerDashboard() {
  const { user, loading: userLoading } = useAuth();

  const [stats, setStats] = useState<DashboardStats>({
    totalVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
    monthlyEarnings: 0,
    averageRating: 0,
    responseTime: 0,
  });

  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRunnerData = async () => {
      try {
        // ✅ CORREGIDO: Obtener datos reales desde la API
        const response = await fetch('/api/runner/dashboard', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar dashboard: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
          // Transformar visitas de hoy
          const transformedTodayVisits = (result.todayVisits || []).map((visit: any) => ({
            id: visit.id,
            propertyTitle: visit.propertyTitle || 'Sin título',
            address: visit.address || '',
            clientName: visit.clientName || 'Sin cliente',
            clientPhone: visit.clientPhone || 'No disponible',
            scheduledDate: visit.scheduledDate?.split('T')[0] || '',
            scheduledTime: visit.scheduledTime || '',
            status: visit.status || 'PENDING',
            priority: visit.priority || 'MEDIUM',
            estimatedDuration: visit.estimatedDuration || 30,
            notes: visit.notes || '',
          }));

          // Transformar actividad reciente
          const transformedRecentActivity = (result.recentActivity || []).map((activity: any) => ({
            id: activity.id,
            type: activity.type || 'visit',
            title: activity.title || 'Actividad',
            description: activity.description || '',
            date: activity.date || new Date().toISOString(),
            status: activity.status,
          }));

          setStats({
            totalVisits: result.stats?.totalVisits || 0,
            completedVisits: result.stats?.completedVisits || 0,
            pendingVisits: result.stats?.pendingVisits || 0,
            monthlyEarnings: result.stats?.monthlyEarnings || 0,
            averageRating: result.stats?.averageRating || 0,
            responseTime: result.stats?.responseTime || 0,
          });

          setTodayVisits(transformedTodayVisits);
          setRecentActivity(transformedRecentActivity);
          setPerformanceMetrics(result.performanceMetrics || []);
        } else {
          // Si no hay datos, mostrar dashboard vacío
          setStats({
            totalVisits: 0,
            completedVisits: 0,
            pendingVisits: 0,
            monthlyEarnings: 0,
            averageRating: 0,
            responseTime: 0,
          });
          setTodayVisits([]);
          setRecentActivity([]);
          setPerformanceMetrics([]);
        }
      } catch (error) {
        logger.error('Error loading runner data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, mostrar dashboard vacío
        setStats({
          totalVisits: 0,
          completedVisits: 0,
          pendingVisits: 0,
          monthlyEarnings: 0,
          averageRating: 0,
          responseTime: 0,
        });
        setTodayVisits([]);
        setRecentActivity([]);
        setPerformanceMetrics([]);
      } finally {
        setLoading(false);
      }
    };

    loadRunnerData();
  }, []);

  const router = useRouter();

  // Handler functions for buttons
  const handleViewCalendar = () => {
    router.push('/runner/schedule');
  };

  const handleStartVisit = (visitId: string) => {
    // Simulate starting a visit - update status and navigate to visit details
    setTodayVisits(prevVisits =>
      prevVisits.map(visit =>
        visit.id === visitId ? { ...visit, status: 'IN_PROGRESS' as const } : visit
      )
    );
    router.push(`/runner/visits/${visitId}`);
  };

  const handleCallClient = (phoneNumber: string) => {
    // Open phone dialer
    window.open(`tel:${phoneNumber}`);
  };

  const handleViewVisitDetails = (visitId: string) => {
    router.push(`/runner/tasks/${visitId}`);
  };

  const handleUploadPhotos = (visitId: string) => {
    router.push(`/runner/photos?visitId=${visitId}`);
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return <MapPin className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'payment':
        return <DollarSign className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'text-blue-600 bg-blue-50';
      case 'rating':
        return 'text-yellow-600 bg-yellow-50';
      case 'message':
        return 'text-purple-600 bg-purple-50';
      case 'payment':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <span className="w-4 h-4 text-gray-400">—</span>;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard de Runner360...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Panel de Control de Runner"
      subtitle="Gestiona tus visitas y ganancias"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <MapPin className="w-8 h-8 text-blue-100" />
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
                <MapPin className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">Visitas Totales</h3>
            <p className="text-2xl font-bold">{stats.totalVisits}</p>
            <p className="text-xs text-blue-100 mt-1">{stats.completedVisits} completadas</p>
            <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.completedVisits / stats.totalVisits) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-yellow-100" />
              <div className="bg-yellow-400 bg-opacity-30 rounded-full p-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-yellow-100 mb-1">Visitas Pendientes</h3>
            <p className="text-2xl font-bold">{stats.pendingVisits}</p>
            <p className="text-xs text-yellow-100 mt-1">Para hoy</p>
            <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.pendingVisits / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-100" />
              <div className="bg-green-400 bg-opacity-30 rounded-full p-2">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-green-100 mb-1">Ganancias Mensuales</h3>
            <p className="text-2xl font-bold">{formatPrice(stats.monthlyEarnings)}</p>
            <div className="mt-2 h-1 bg-green-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.monthlyEarnings / 1000000) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-amber-100" />
              <div className="bg-amber-400 bg-opacity-30 rounded-full p-2">
                <Award className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-amber-100 mb-1">Calificación</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats.averageRating}</p>
              <Star className="w-5 h-5 text-yellow-300 fill-current" />
            </div>
            <div className="mt-2 h-1 bg-amber-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.averageRating / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Acciones Rápidas</h2>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-1 mx-4"></div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mis Visitas</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona tus visitas programadas</p>
              <div className="flex items-center justify-between">
                <Link
                  href={`/runner/visits${stats.pendingVisits > 0 ? '?status=PENDING' : ''}`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                >
                  Ver visitas
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                {stats.pendingVisits > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {stats.pendingVisits} pendiente{stats.pendingVisits !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Nueva Visita</h3>
              <p className="text-sm text-gray-600 mb-4">Agenda una nueva visita</p>
              <Link
                href="/runner/visits/new"
                className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
              >
                Agendar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reportes Fotográficos</h3>
              <p className="text-sm text-gray-600 mb-4">Sube fotos de tus visitas</p>
              <Link
                href="/runner/photos"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
              >
                Subir fotos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mis Ingresos</h3>
              <p className="text-sm text-gray-600 mb-4">Revisa tus ganancias</p>
              <Link
                href="/runner/earnings"
                className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center"
              >
                Ver ingresos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-red-200 group">
              <div className="bg-gradient-to-br from-red-500 to-red-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Soporte</h3>
              <p className="text-sm text-gray-600 mb-4">Contacta al equipo de soporte</p>
              <Link
                href="/support/tickets"
                className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"
              >
                Contactar soporte
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Visits */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Visitas de Hoy</h2>
                    <p className="text-blue-100 text-sm">Visitas programadas para hoy</p>
                  </div>
                  <Button
                    className="bg-white text-blue-600 hover:bg-blue-50 border-0"
                    onClick={handleViewCalendar}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Ver Calendario
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {todayVisits.map(visit => (
                    <div
                      key={visit.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{visit.propertyTitle}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {visit.address}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(visit.priority)}
                          {getStatusBadge(visit.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium">Cliente</p>
                          <p className="font-bold text-blue-800">{visit.clientName}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Teléfono</p>
                          <p className="font-bold text-green-800">{visit.clientPhone}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-purple-600 font-medium">Fecha</p>
                          <p className="font-bold text-purple-800">
                            {formatDate(visit.scheduledDate)}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3">
                          <p className="text-xs text-yellow-600 font-medium">Hora</p>
                          <p className="font-bold text-yellow-800">{visit.scheduledTime}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-orange-600 font-medium">Duración</p>
                          <p className="font-bold text-orange-800">{visit.estimatedDuration} min</p>
                        </div>
                      </div>

                      {visit.notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-gray-600 font-medium">Notas</p>
                          <p className="text-sm text-gray-800">{visit.notes}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {visit.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleStartVisit(visit.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Iniciar Visita
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-red-500 hover:text-red-600"
                              onClick={() => handleCallClient(visit.clientPhone)}
                            >
                              <Phone className="w-4 h-4 mr-1" />
                              Llamar
                            </Button>
                          </>
                        )}
                        {visit.status === 'COMPLETED' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                              onClick={() => handleViewVisitDetails(visit.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-300 hover:border-purple-500 hover:text-purple-600"
                              onClick={() => handleUploadPhotos(visit.id)}
                            >
                              <Camera className="w-4 h-4 mr-1" />
                              Subir Fotos
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity and Performance */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                <p className="text-purple-100 text-sm">Últimas acciones en tu cuenta</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}
                      >
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{formatDateTime(activity.date)}</p>
                          {activity.status && getStatusBadge(activity.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Métricas de Desempeño
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {performanceMetrics.map((metric, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{metric.value}</span>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(metric.trend)}
                          <span
                            className={`text-xs font-medium ${
                              metric.trend === 'up'
                                ? 'text-green-600'
                                : metric.trend === 'down'
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                            }`}
                          >
                            {metric.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Estado del Servicio</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Disponibilidad</span>
                    <Badge className="bg-green-100 text-green-800">Disponible</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Tiempo de Respuesta</span>
                    <span className="font-bold text-blue-600">{stats.responseTime} min</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">Visitas Hoy</span>
                    <span className="font-bold text-purple-600">{todayVisits.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
