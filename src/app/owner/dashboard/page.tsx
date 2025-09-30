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
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useUserState } from '@/hooks/useUserState';

interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  pendingPayments: number;
  averageRating: number;
  totalTenants: number;
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

export default function OwnerDashboard() {
  const { user, loading: userLoading } = useUserState();
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    averageRating: 0,
    totalTenants: 0,
  });
  const [recentProperties, setRecentProperties] = useState<PropertySummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    } else if (!userLoading) {
      // Usuario no autenticado, mostrar datos vacíos
      setLoading(false);
    }
  }, [user, userLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Intentar cargar datos reales del usuario
      // Por ahora, si es un usuario nuevo, mostrar datos vacíos
      const isNewUser = !user?.createdAt || (new Date() - new Date(user.createdAt)) < 60000; // Menos de 1 minuto desde creación

      if (isNewUser) {
        // Usuario nuevo - mostrar dashboard vacío con bienvenida
        setStats({
          totalProperties: 0,
          activeContracts: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          averageRating: 0,
          totalTenants: 0,
        });
        setRecentProperties([]);
        setRecentActivity([{
          id: 'welcome',
          type: 'message',
          title: '¡Bienvenido a Rent360!',
          description: 'Tu cuenta ha sido creada exitosamente. Comienza agregando tu primera propiedad.',
          date: new Date().toISOString().split('T')[0],
          status: 'INFO'
        }]);
      } else {
        // Usuario existente - mostrar datos de ejemplo (temporal hasta implementar API real)
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
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
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

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Usuario no autenticado</p>
          <p className="text-gray-600 mt-2">Por favor, inicia sesión nuevamente</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Panel de Control de Propietario"
      subtitle="Gestiona tus propiedades e ingresos"
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
            <h3 className="text-sm font-medium text-blue-100 mb-1">Propiedades</h3>
            <p className="text-2xl font-bold">{stats.totalProperties}</p>
            <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.totalProperties / 10) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-purple-100" />
              <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
                <FileText className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-1">Contratos Activos</h3>
            <p className="text-2xl font-bold">{stats.activeContracts}</p>
            <div className="mt-2 h-1 bg-purple-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.activeContracts / 5) * 100}%` }}></div>
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
            <h3 className="text-sm font-medium text-yellow-100 mb-1">Pagos Pendientes</h3>
            <p className="text-2xl font-bold">{stats.pendingPayments}</p>
            <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.pendingPayments / 5) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-100" />
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-1">Inquilinos</h3>
            <p className="text-2xl font-bold">{stats.totalTenants}</p>
            <div className="mt-2 h-1 bg-orange-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.totalTenants / 10) * 100}%` }}></div>
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
              <h3 className="font-semibold text-gray-800 mb-2">Nueva Propiedad</h3>
              <p className="text-sm text-gray-600 mb-4">Agrega una nueva propiedad a tu catálogo</p>
              <Link href="/owner/properties/new" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                Comenzar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Contratos</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona tus contratos de arriendo</p>
              <Link href="/owner/contracts" className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                Ver contratos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Pagos</h3>
              <p className="text-sm text-gray-600 mb-4">Revisa el historial de pagos recibidos</p>
              <Link href="/owner/payments" className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center">
                Ver pagos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
              <p className="text-sm text-gray-600 mb-4">Analiza el rendimiento de tus propiedades</p>
              <Link href="/owner/reports" className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center">
                Ver reportes
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
                    <h2 className="text-xl font-bold text-white">Mis Propiedades</h2>
                    <p className="text-blue-100 text-sm">Estado actual de tus propiedades</p>
                  </div>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Propiedad
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentProperties.map((property) => (
                    <div key={property.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{property.title}</h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {property.address}
                          </p>
                        </div>
                        {getStatusBadge(property.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium">Arriendo mensual</p>
                          <p className="font-bold text-blue-800">{formatPrice(property.monthlyRent)}</p>
                        </div>
                        {property.tenant && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-green-600 font-medium">Inquilino</p>
                            <p className="font-bold text-green-800">{property.tenant}</p>
                          </div>
                        )}
                      </div>

                      {property.contractEnd && (
                        <div className="flex items-center text-sm text-gray-600 mb-4 bg-yellow-50 rounded-lg p-3">
                          <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
                          <span className="font-medium">Fin del contrato: {formatDate(property.contractEnd)}</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-300 hover:border-blue-500 hover:text-blue-600">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver detalles
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-300 hover:border-purple-500 hover:text-purple-600">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        {property.status === 'AVAILABLE' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <Users className="w-4 h-4 mr-1" />
                            Buscar inquilino
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
                  {recentActivity.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      id={activity.id}
                      type={activity.type === 'property' ? 'system' : activity.type as 'payment' | 'maintenance' | 'contract' | 'message' | 'system'}
                      title={activity.title}
                      description={activity.description}
                      user={{
                        id: '1',
                        name: 'Usuario',
                        email: 'usuario@ejemplo.com'
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
                    <span className="text-sm font-medium text-blue-800">Tasa de Ocupación</span>
                    <span className="font-bold text-blue-600">67%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Ingresos Anuales</span>
                    <span className="font-bold text-green-600">{formatPrice(stats.monthlyRevenue * 12)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Propiedades Disponibles</span>
                    <span className="font-bold text-yellow-600">
                      {recentProperties.filter(p => p.status === 'AVAILABLE').length}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">Satisfacción de Inquilinos</span>
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

