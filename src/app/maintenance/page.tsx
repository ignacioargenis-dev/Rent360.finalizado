'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, Building, FileText, 
  CreditCard, 
  Star, 
  MessageCircle, 
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
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { User, Property, Contract, Payment } from '@/types';
import { ActivityItem } from '@/components/dashboard/ActivityItem';
import DashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { useUserState } from '@/hooks/useUserState';

interface DashboardStats {
  activeJobs: number;
  totalProperties: number;
  monthlyRevenue: number;
  completedJobs: number;
  averageRating: number;
  pendingJobs: number;
}

interface RecentActivity {
  id: string;
  type: 'property' | 'contract' | 'payment' | 'message' | 'rating';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface PropertySummary {
  id: string;
  title: string;
  address: string;
  status: string;
  monthlyRent: number;
  tenant?: string;
  contractEnd?: string;
}

export default function MaintenanceDashboard() {
  const { user } = useUserState();
  const [stats, setStats] = useState<DashboardStats>({
    activeJobs: 8,
    totalProperties: 156,
    monthlyRevenue: 3100000,
    completedJobs: 47,
    averageRating: 4.9,
    pendingJobs: 5,
  });
  const [recentProperties, setRecentProperties] = useState<PropertySummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setStats({
        totalProperties: 3,
        activeContracts: 2,
        monthlyRevenue: 900000,
        pendingPayments: 1,
        averageRating: 4.7,
        totalTenants: 2,
      });

      setRecentProperties([
        {
          id: '1',
          title: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          status: 'RENTED',
          monthlyRent: 550000,
          tenant: 'Carlos Ramírez',
          contractEnd: '2024-12-31',
        },
        {
          id: '2',
          title: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          status: 'RENTED',
          monthlyRent: 350000,
          tenant: 'Empresa Soluciones Ltda.',
          contractEnd: '2025-02-14',
        },
        {
          id: '3',
          title: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          status: 'AVAILABLE',
          monthlyRent: 1200000,
        },
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'payment',
          title: 'Pago recibido',
          description: 'Carlos Ramírez pagó arriendo de marzo',
          date: '2024-03-15',
          status: 'COMPLETED',
        },
        {
          id: '2',
          type: 'contract',
          title: 'Nuevo contrato',
          description: 'Contrato firmado con Empresa Soluciones Ltda.',
          date: '2024-03-10',
          status: 'ACTIVE',
        },
        {
          id: '3',
          type: 'rating',
          title: 'Nueva calificación',
          description: 'Carlos Ramírez te calificó con 5 estrellas',
          date: '2024-03-08',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-800">Activo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Icon mapping for activity items
  const iconMap = {
    property: Building,
    contract: FileText,
    payment: CreditCard,
    message: MessageCircle,
    rating: Star,
    default: Star,
  };

  // Color mapping for activity items
  const colorMap = {
    property: 'text-blue-600 bg-blue-50',
    contract: 'text-purple-600 bg-purple-50',
    payment: 'text-green-600 bg-green-50',
    message: 'text-orange-600 bg-orange-50',
    rating: 'text-yellow-600 bg-yellow-50',
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
    <DashboardLayout
      user={user}
      title="Dashboard Mantenimiento"
      subtitle="Gestiona mantenimientos preventivos y correctivos"
      showNotifications={true}
      notificationCount={3}
    >

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Building className="w-8 h-8 text-blue-100" />
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
                <Building className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">Trabajos Activos</h3>
            <p className="text-2xl font-bold">{stats.activeJobs}</p>
            <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.activeJobs / 10) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-purple-100" />
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
                <FileText className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-1">Propiedades</h3>
            <p className="text-2xl font-bold">{stats.totalProperties}</p>
            <div className="mt-2 h-1 bg-purple-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.totalProperties / 200) * 100}%` }}></div>
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
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.monthlyRevenue / 2000000) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-100" />
              <div className="bg-yellow-400 bg-opacity-30 rounded-full p-2">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-yellow-100 mb-1">Trabajos Completados</h3>
            <p className="text-2xl font-bold">{stats.completedJobs}</p>
            <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.completedJobs / 60) * 100}%` }}></div>
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
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.pendingJobs / 10) * 100}%` }}></div>
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
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.averageRating / 5) * 100}%` }}></div>
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
              <h3 className="font-semibold text-gray-800 mb-2">Programar Mantenimiento</h3>
              <p className="text-sm text-gray-600 mb-4">Agenda un nuevo trabajo de mantenimiento</p>
              <Link href="/maintenance/jobs/new" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                Programar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Trabajos Activos</h3>
              <p className="text-sm text-gray-600 mb-4">Revisa el progreso de tus trabajos</p>
              <Link href="/maintenance/jobs" className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                Ver trabajos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Propiedades</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona las propiedades a cargo</p>
              <Link href="/maintenance/properties" className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center">
                Ver propiedades
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Calendario</h3>
              <p className="text-sm text-gray-600 mb-4">Agenda y programa tus mantenimientos</p>
              <Link href="/maintenance/calendar" className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center">
                Ver calendario
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Properties */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Trabajos de Mantenimiento</h2>
                    <p className="text-blue-100 text-sm">Trabajos activos y próximos</p>
                  </div>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Trabajo
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Ejemplo de trabajos de mantenimiento */}
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Revisión de Calefacción</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          Calle Falsa 123, Providencia
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">En Progreso</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Tipo</p>
                        <p className="font-bold text-blue-800">Preventivo</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Técnico</p>
                        <p className="font-bold text-green-800">Juan Pérez</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-yellow-50 rounded-lg p-3">
                      <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                      <span className="font-medium">Fecha programada: 15 Dic 2024</span>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Reparación de Fuga</h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          Avenida Siempre Viva 742, Las Condes
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">Pendiente</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Tipo</p>
                        <p className="font-bold text-blue-800">Correctivo</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Urgencia</p>
                        <p className="font-bold text-green-800">Alta</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-4 bg-red-50 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                      <span className="font-medium">Fecha límite: 20 Dic 2024</span>
                    </div>
                  </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-gray-300 hover:border-blue-500 hover:text-blue-600">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalles
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-500 hover:text-purple-600">
                        <Clock className="w-4 h-4 mr-1" />
                        Actualizar progreso
                      </Button>
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
                <h2 className="text-xl font-bold text-white">Alertas y Notificaciones</h2>
                <p className="text-purple-100 text-sm">Trabajos urgentes y actualizaciones</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-red-800">Trabajo Urgente</h4>
                      <p className="text-sm text-red-600">Reparación de fuga en Calle Falsa 123 debe completarse hoy</p>
                      <p className="text-xs text-red-500 mt-1">Hace 2 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-yellow-800">Próximo Mantenimiento</h4>
                      <p className="text-sm text-yellow-600">Revisión de calefacción programada para mañana</p>
                      <p className="text-xs text-yellow-500 mt-1">Hace 4 horas</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800">Trabajo Completado</h4>
                      <p className="text-sm text-green-600">Pintura interior en Avenida Siempre Viva finalizada</p>
                      <p className="text-xs text-green-500 mt-1">Hace 1 día</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Estadísticas de Mantenimiento
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Trabajos Completados</span>
                    <span className="font-bold text-blue-600">{stats.completedJobs}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Ingresos del Mes</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.monthlyRevenue)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Trabajos Pendientes</span>
                    <span className="font-bold text-yellow-600">{stats.pendingJobs}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">Calificación Promedio</span>
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
    </DashboardLayout>
  );
}
