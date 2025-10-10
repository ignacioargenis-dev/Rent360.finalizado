'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';
import { useUserState } from '@/hooks/useUserState';
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
  const { user, loading: userLoading } = useUserState();

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
        // Detectar si es un usuario nuevo (menos de 1 hora desde creación)
        const isNewUser =
          !user?.createdAt || Date.now() - new Date(user.createdAt).getTime() < 3600000;

        // SIEMPRE mostrar dashboard vacío para usuarios nuevos
        // Los datos mock solo aparecen para usuarios seed con @rent360.cl (para testing)
        if (isNewUser || !user?.email?.includes('@rent360.cl')) {
          // Usuario nuevo O usuario real (no seed) - mostrar dashboard vacío con bienvenida
          setStats({
            totalVisits: 0,
            completedVisits: 0,
            pendingVisits: 0,
            monthlyEarnings: 0,
            averageRating: 0,
            responseTime: 0,
          });
          setTodayVisits([]);
          setPerformanceMetrics([]);
          setLoading(false);
          return;
        } else {
          // Solo usuarios seed con @rent360.cl ven datos mock (para testing)
          setStats({
            totalVisits: 156,
            completedVisits: 142,
            pendingVisits: 4,
            monthlyEarnings: 450000,
            averageRating: 4.9,
            responseTime: 15,
          });

          setTodayVisits([
            {
              id: '1',
              propertyTitle: 'Departamento Las Condes',
              address: 'Av. Apoquindo 3400, Las Condes',
              clientName: 'Carlos Ramírez',
              clientPhone: '+56 9 1234 5678',
              scheduledDate: '2024-03-15',
              scheduledTime: '10:00',
              status: 'PENDING',
              priority: 'HIGH',
              estimatedDuration: 30,
              notes: 'Cliente necesita ver estacionamiento y bodega',
            },
            {
              id: '2',
              propertyTitle: 'Oficina Providencia',
              address: 'Av. Providencia 1245, Providencia',
              clientName: 'Ana Martínez',
              clientPhone: '+56 9 8765 4321',
              scheduledDate: '2024-03-15',
              scheduledTime: '14:30',
              status: 'PENDING',
              priority: 'MEDIUM',
              estimatedDuration: 45,
            },
            {
              id: '3',
              propertyTitle: 'Casa Vitacura',
              address: 'Av. Vitacura 8900, Vitacura',
              clientName: 'Pedro Silva',
              clientPhone: '+56 9 2345 6789',
              scheduledDate: '2024-03-15',
              scheduledTime: '16:00',
              status: 'COMPLETED',
              priority: 'LOW',
              estimatedDuration: 60,
            },
          ]);

          setRecentActivity([
            {
              id: '1',
              type: 'visit',
              title: 'Visita completada',
              description: 'Visita a Casa Vitacura finalizada exitosamente',
              date: '2024-03-15 16:45',
              status: 'COMPLETED',
            },
            {
              id: '2',
              type: 'rating',
              title: 'Excelente calificación',
              description: 'Pedro Silva te calificó con 5 estrellas',
              date: '2024-03-15 17:00',
            },
            {
              id: '3',
              type: 'payment',
              title: 'Pago recibido',
              description: 'Pago por visita a Casa Vitacura: $15.000',
              date: '2024-03-15 17:30',
              status: 'COMPLETED',
            },
            {
              id: '4',
              type: 'message',
              title: 'Nuevo mensaje',
              description: 'Mensaje de Ana Martínez sobre visita de mañana',
              date: '2024-03-15 18:00',
            },
          ]);

          setPerformanceMetrics([
            {
              label: 'Tasa de Completitud',
              value: '91%',
              change: '+3%',
              trend: 'up',
            },
            {
              label: 'Tiempo Promedio',
              value: '42 min',
              change: '-5 min',
              trend: 'up',
            },
            {
              label: 'Satisfacción',
              value: '4.9/5',
              change: '+0.2',
              trend: 'up',
            },
            {
              label: 'Ingresos Mensuales',
              value: '$450.000',
              change: '+12%',
              trend: 'up',
            },
          ]);

          setLoading(false);
        }
      } catch (error) {
        logger.error('Error loading runner data:', {
          error: error instanceof Error ? error.message : String(error),
        });
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
    router.push(`/runner/visits/${visitId}`);
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Mis Visitas</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona tus visitas programadas</p>
              <div className="flex items-center justify-between">
                <Link
                  href="/runner/visits"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                >
                  Ver visitas
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                {stats.pendingVisits > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {stats.pendingVisits} pendientes
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
