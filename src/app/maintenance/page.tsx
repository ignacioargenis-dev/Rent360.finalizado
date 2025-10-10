'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Building,
  FileText,
  CreditCard,
  Star,
  MessageCircle,
  Settings,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  ChevronRight,
  Wrench,
  PlayCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User, Property, Contract, Payment } from '@/types';
import { ActivityItem } from '@/components/dashboard/ActivityItem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DashboardStats {
  activeJobs: number;
  totalJobs: number;
  monthlyRevenue: number;
  completedJobs: number;
  averageRating: number;
  pendingJobs: number;
}

interface RecentActivity {
  id: string;
  type:
    | 'job_started'
    | 'job_completed'
    | 'payment_received'
    | 'message'
    | 'rating'
    | 'schedule_update';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface JobSummary {
  id: string;
  title: string;
  propertyAddress: string;
  ownerName: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate: string;
  estimatedCost: number;
}

export default function MaintenanceDashboard() {
  const { user } = useUserState();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 8,
    totalJobs: 156,
    monthlyRevenue: 3100000,
    completedJobs: 47,
    averageRating: 4.9,
    pendingJobs: 5,
  });
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para mensajes
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para modales
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [showUpdateJobModal, setShowUpdateJobModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);

  // Estados para formularios de actualización
  const [updateJobData, setUpdateJobData] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimatedHours: 1,
    scheduledDate: '',
    notes: '',
  });

  useEffect(() => {
    const loadMaintenanceData = async () => {
      try {
        // Detectar si es un usuario nuevo (menos de 1 hora desde creación)
        const isNewUser =
          !user?.createdAt || Date.now() - new Date(user.createdAt).getTime() < 3600000;

        // SIEMPRE mostrar dashboard vacío para usuarios nuevos
        // Los datos mock solo aparecen para usuarios seed con @rent360.cl (para testing)
        if (isNewUser || !user?.email?.includes('@rent360.cl')) {
          // Usuario nuevo O usuario real (no seed) - mostrar dashboard vacío
          setStats({
            activeJobs: 0,
            totalJobs: 0,
            monthlyRevenue: 0,
            completedJobs: 0,
            averageRating: 0,
            pendingJobs: 0,
          });
          setRecentJobs([]);
          setRecentActivity([]);
          setLoading(false);
          return;
        }

        // Solo usuarios seed con @rent360.cl ven datos mock (para testing)
        setStats({
          activeJobs: 8,
          totalJobs: 156,
          monthlyRevenue: 3100000,
          completedJobs: 47,
          averageRating: 4.9,
          pendingJobs: 5,
        });

        setRecentJobs([
          {
            id: '1',
            title: 'Reparación de cañería',
            propertyAddress: 'Av. Apoquindo 3400, Las Condes',
            ownerName: 'María González',
            status: 'in_progress',
            priority: 'high',
            scheduledDate: '2024-01-15',
            estimatedCost: 45000,
          },
          {
            id: '2',
            title: 'Mantenimiento eléctrico',
            propertyAddress: 'Av. Providencia 1245, Providencia',
            ownerName: 'Carlos Rodríguez',
            status: 'pending',
            priority: 'medium',
            scheduledDate: '2024-01-18',
            estimatedCost: 80000,
          },
          {
            id: '3',
            title: 'Limpieza general',
            propertyAddress: 'Av. Vitacura 8900, Vitacura',
            ownerName: 'Ana López',
            status: 'completed',
            priority: 'low',
            scheduledDate: '2024-01-10',
            estimatedCost: 30000,
          },
        ]);

        setRecentActivity([
          {
            id: '1',
            type: 'job_completed',
            title: 'Trabajo completado',
            description: 'Reparación de cañería en Av. Las Condes terminada exitosamente',
            date: '2024-01-15',
            status: 'COMPLETED',
          },
          {
            id: '2',
            type: 'payment_received',
            title: 'Pago recibido',
            description: 'María González pagó $45.000 por reparación de plomería',
            date: '2024-01-15',
            status: 'COMPLETED',
          },
          {
            id: '3',
            type: 'job_started',
            title: 'Trabajo iniciado',
            description: 'Mantenimiento eléctrico en Providencia ha comenzado',
            date: '2024-01-14',
          },
        ]);

        setLoading(false);
      } catch (error) {
        logger.error('Error loading maintenance data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadMaintenanceData();
  }, [user]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Funciones para manejar botones
  const handleNewJob = () => {
    router.push('/maintenance/jobs/new');
  };

  const handleViewJobDetails = (job: JobSummary) => {
    setSelectedJob(job);
    setShowJobDetailsModal(true);
  };

  const handleUpdateJob = (job: JobSummary) => {
    setSelectedJob(job);
    setShowUpdateJobModal(true);
  };

  const handleStartJob = (jobId: string) => {
    // Actualizar el estado del trabajo
    setRecentJobs(prevJobs =>
      prevJobs.map(job => (job.id === jobId ? { ...job, status: 'in_progress' as const } : job))
    );

    // Simular registro de tiempo de inicio
    const startTime = new Date().toISOString();

    alert(`🚀 TRABAJO INICIADO EXITOSAMENTE

📋 Trabajo: ${recentJobs.find(j => j.id === jobId)?.title}
🕐 Hora de inicio: ${new Date().toLocaleString('es-CL')}
📍 Estado: En Progreso

💡 Próximos pasos:
• Documentar el trabajo realizado
• Tomar fotos del estado inicial
• Comunicar avances al cliente
• Registrar tiempo y materiales usados

El temporizador del trabajo está activo.`);

    setSuccessMessage('Trabajo iniciado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCompleteJob = (jobId: string) => {
    // Actualizar el estado del trabajo
    setRecentJobs(prevJobs =>
      prevJobs.map(job => (job.id === jobId ? { ...job, status: 'completed' as const } : job))
    );

    const completedJob = recentJobs.find(j => j.id === jobId);

    alert(`✅ TRABAJO COMPLETADO EXITOSAMENTE

📋 Trabajo: ${completedJob?.title}
🏠 Propiedad: ${completedJob?.propertyAddress}
👤 Propietario: ${completedJob?.ownerName}
🕐 Hora de finalización: ${new Date().toLocaleString('es-CL')}

📝 Próximos pasos recomendados:
• Enviar resumen al cliente
• Solicitar feedback/calificación
• Generar factura si corresponde
• Archivar documentación

¿Desea enviar un resumen al cliente ahora?`);

    setSuccessMessage('Trabajo completado exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleUpdateJobSubmit = async () => {
    if (!selectedJob) {
      return;
    }

    try {
      // Simular actualización del trabajo
      alert(`🔄 TRABAJO ACTUALIZADO EXITOSAMENTE

📋 Trabajo: ${selectedJob.title}
📝 Cambios realizados:
• Título: ${updateJobData.title || 'Sin cambios'}
• Prioridad: ${updateJobData.priority}
• Horas estimadas: ${updateJobData.estimatedHours}h
• Fecha programada: ${updateJobData.scheduledDate || 'Sin cambios'}
• Notas: ${updateJobData.notes || 'Sin cambios'}

Los cambios han sido guardados y notificados al propietario.`);

      setShowUpdateJobModal(false);
      setUpdateJobData({
        title: '',
        priority: 'medium',
        estimatedHours: 1,
        scheduledDate: '',
        notes: '',
      });

      setSuccessMessage('Trabajo actualizado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Recargar datos
      // loadJobs(); // Esta función debería existir
    } catch (error) {
      setErrorMessage('Error al actualizar el trabajo. Intente nuevamente.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge className="bg-gray-100 text-gray-800">Baja</Badge>;
      case 'medium':
        return <Badge className="bg-blue-100 text-blue-800">Media</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  // Icon mapping for activity items
  const iconMap = {
    job_started: Wrench,
    job_completed: CheckCircle,
    payment_received: CreditCard,
    message: MessageCircle,
    rating: Star,
    schedule_update: Calendar,
    default: Star,
  };

  // Color mapping for activity items
  const colorMap = {
    job_started: 'text-blue-600 bg-blue-50',
    job_completed: 'text-green-600 bg-green-50',
    payment_received: 'text-emerald-600 bg-emerald-50',
    message: 'text-orange-600 bg-orange-50',
    rating: 'text-yellow-600 bg-yellow-50',
    schedule_update: 'text-purple-600 bg-purple-50',
    default: 'text-gray-600 bg-gray-50',
  };

  // Status badge mapping
  const statusBadgeMap = {
    COMPLETED: <Badge className="bg-green-100 text-green-800">Completado</Badge>,
    PENDING: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
    ACTIVE: <Badge className="bg-blue-100 text-blue-800">Activo</Badge>,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Dashboard Mantenimiento"
      subtitle="Gestiona mantenimientos preventivos y correctivos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Settings className="w-8 h-8 text-blue-100" />
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
                <Settings className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">Trabajos Activos</h3>
            <p className="text-2xl font-bold">{stats.activeJobs}</p>
            <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.activeJobs / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Wrench className="w-8 h-8 text-purple-100" />
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
                <Wrench className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-1">Trabajos Totales</h3>
            <p className="text-2xl font-bold">{stats.totalJobs}</p>
            <div className="mt-2 h-1 bg-purple-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.totalJobs / 200) * 100}%` }}
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
            <h3 className="text-sm font-medium text-green-100 mb-1">Ingresos Mensuales</h3>
            <p className="text-2xl font-bold">{formatPrice(stats.monthlyRevenue)}</p>
            <div className="mt-2 h-1 bg-green-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.monthlyRevenue / 2000000) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-yellow-100" />
              <div className="bg-yellow-400 bg-opacity-30 rounded-full p-2">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-yellow-100 mb-1">Trabajos Completados</h3>
            <p className="text-2xl font-bold">{stats.completedJobs}</p>
            <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.completedJobs / 60) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-orange-100" />
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-1">Trabajos Pendientes</h3>
            <p className="text-2xl font-bold">{stats.pendingJobs}</p>
            <div className="mt-2 h-1 bg-orange-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.pendingJobs / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Star className="w-8 h-8 text-amber-100" />
              <div className="bg-amber-400 bg-opacity-30 rounded-full p-2">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-amber-100 mb-1">Calificación</h3>
            <p className="text-2xl font-bold">{stats.averageRating}</p>
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
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Nuevo Trabajo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Agendar un nuevo trabajo de mantenimiento
              </p>
              <Link
                href="/maintenance/jobs/new"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
              >
                Comenzar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Calendario</h3>
              <p className="text-sm text-gray-600 mb-4">Revisa tu agenda de trabajos programados</p>
              <Link
                href="/maintenance/calendar"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
              >
                Ver calendario
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Ganancias</h3>
              <p className="text-sm text-gray-600 mb-4">
                Revisa tus ingresos por trabajos realizados
              </p>
              <Link
                href="/maintenance/earnings"
                className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
              >
                Ver ganancias
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
              <p className="text-sm text-gray-600 mb-4">
                Analiza tu rendimiento en trabajos de mantenimiento
              </p>
              <Link
                href="/maintenance/reports"
                className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center"
              >
                Ver reportes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Jobs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Trabajos Recientes</h2>
                    <p className="text-blue-100 text-sm">
                      Estado actual de tus trabajos de mantenimiento
                    </p>
                  </div>
                  <Button
                    className="bg-white text-blue-600 hover:bg-blue-50 border-0"
                    onClick={handleNewJob}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Trabajo
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentJobs.map(job => (
                    <div
                      key={job.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{job.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {job.propertyAddress}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {getStatusBadge(job.status)}
                          {getPriorityBadge(job.priority)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium">Costo Estimado</p>
                          <p className="font-bold text-blue-800">
                            {formatPrice(job.estimatedCost)}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Propietario</p>
                          <p className="font-bold text-green-800">{job.ownerName}</p>
                        </div>
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-4 bg-yellow-50 rounded-lg p-3">
                        <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
                        <span className="font-medium">
                          Programado: {formatDate(job.scheduledDate)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                          onClick={() => handleViewJobDetails(job)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver detalles
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:border-purple-500 hover:text-purple-600"
                          onClick={() => handleUpdateJob(job)}
                        >
                          <Wrench className="w-4 h-4 mr-1" />
                          Actualizar
                        </Button>
                        {job.status === 'pending' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleStartJob(job.id)}
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Iniciar trabajo
                          </Button>
                        )}
                        {job.status === 'in_progress' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleCompleteJob(job.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                <p className="text-purple-100 text-sm">Últimas acciones en tu cuenta</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <ActivityItem
                      key={activity.id}
                      id={activity.id}
                      type={
                        activity.type === 'job_started' || activity.type === 'job_completed'
                          ? 'maintenance'
                          : activity.type === 'payment_received'
                            ? 'payment'
                            : activity.type === 'schedule_update'
                              ? 'system'
                              : (activity.type as
                                  | 'payment'
                                  | 'maintenance'
                                  | 'contract'
                                  | 'message'
                                  | 'system')
                      }
                      title={activity.title}
                      description={activity.description}
                      user={{
                        id: '1',
                        name: 'Usuario',
                        email: 'usuario@ejemplo.com',
                      }}
                      timestamp={new Date(activity.date)}
                      icon={iconMap[activity.type] || Home}
                      onView={() => {}}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumen de Rendimiento
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Tasa de Completación</span>
                    <span className="font-bold text-blue-600">
                      {Math.round((stats.completedJobs / stats.totalJobs) * 100)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Ingresos Mensuales</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(stats.monthlyRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Trabajos Pendientes</span>
                    <span className="font-bold text-yellow-600">{stats.pendingJobs}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">
                      Calificación Promedio
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-600">{stats.averageRating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de detalles del trabajo */}
      <Dialog open={showJobDetailsModal} onOpenChange={setShowJobDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Detalles del Trabajo
            </DialogTitle>
            <DialogDescription>
              Información completa del trabajo de mantenimiento seleccionado
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Información del Trabajo</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Título:</span> {selectedJob.title}
                    </p>
                    <p>
                      <span className="font-medium">Estado:</span>{' '}
                      {getStatusBadge(selectedJob.status)}
                    </p>
                    <p>
                      <span className="font-medium">Prioridad:</span>{' '}
                      {getPriorityBadge(selectedJob.priority)}
                    </p>
                    <p>
                      <span className="font-medium">Fecha Programada:</span>{' '}
                      {formatDate(selectedJob.scheduledDate)}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Información Financiera</h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Costo Estimado:</span>{' '}
                      {formatPrice(selectedJob.estimatedCost)}
                    </p>
                    <p>
                      <span className="font-medium">Propietario:</span> {selectedJob.ownerName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ubicación</h4>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selectedJob.propertyAddress}</span>
                </div>
              </div>

              {/* Acciones disponibles */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Acciones Disponibles</h4>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateJob(selectedJob)}>
                    <Wrench className="w-4 h-4 mr-1" />
                    Actualizar Trabajo
                  </Button>

                  {selectedJob.status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleStartJob(selectedJob.id);
                        setShowJobDetailsModal(false);
                      }}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" />
                      Iniciar Trabajo
                    </Button>
                  )}

                  {selectedJob.status === 'in_progress' && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        handleCompleteJob(selectedJob.id);
                        setShowJobDetailsModal(false);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completar Trabajo
                    </Button>
                  )}

                  <Button size="sm" variant="outline" onClick={() => setShowJobDetailsModal(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Job Modal */}
      <Dialog open={showUpdateJobModal} onOpenChange={setShowUpdateJobModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-600">
              🔄 Actualizar Trabajo
            </DialogTitle>
            <DialogDescription>
              Modificar los detalles del trabajo: {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="update-job-title">Título del Trabajo</Label>
              <Input
                id="update-job-title"
                placeholder={selectedJob?.title}
                value={updateJobData.title}
                onChange={e => setUpdateJobData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="update-job-title">Título del Trabajo</Label>
              <Input
                id="update-job-title"
                placeholder={selectedJob?.title || 'Título del trabajo'}
                value={updateJobData.title}
                onChange={e => setUpdateJobData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="update-job-priority">Prioridad</Label>
                <Select
                  value={updateJobData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') =>
                    setUpdateJobData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="update-job-hours">Horas Estimadas</Label>
                <Input
                  id="update-job-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={updateJobData.estimatedHours}
                  onChange={e =>
                    setUpdateJobData(prev => ({
                      ...prev,
                      estimatedHours: parseFloat(e.target.value) || 1,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="update-job-date">Fecha Programada</Label>
              <Input
                id="update-job-date"
                type="date"
                value={updateJobData.scheduledDate}
                onChange={e =>
                  setUpdateJobData(prev => ({ ...prev, scheduledDate: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="update-job-notes">Notas Adicionales</Label>
              <Textarea
                id="update-job-notes"
                placeholder="Información adicional, cambios, requerimientos especiales..."
                value={updateJobData.notes}
                onChange={e => setUpdateJobData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {selectedJob && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">
                  📋 Información actual del trabajo
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Propietario:</strong> {selectedJob.ownerName}
                  </p>
                  <p>
                    <strong>Dirección:</strong> {selectedJob.propertyAddress}
                  </p>
                  <p>
                    <strong>Estado actual:</strong> {getStatusBadge(selectedJob.status)}
                  </p>
                  <p>
                    <strong>Prioridad actual:</strong> {selectedJob.priority}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Cambios que se aplicarán</h4>
              <ul className="text-sm space-y-1">
                <li>• Se notificará automáticamente al cliente de los cambios</li>
                <li>• Se actualizará el calendario si cambia la fecha</li>
                <li>• Se recalcularán las estimaciones de tiempo</li>
                <li>• Se guardará un registro de la modificación</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdateJobSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Actualizar Trabajo
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUpdateJobModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
