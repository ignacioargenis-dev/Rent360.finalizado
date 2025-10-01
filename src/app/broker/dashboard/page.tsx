'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Users, 
  FileText, 
  CreditCard, 
  Star, 
  MessageCircle, 
  Settings, 
  Bell,
  Search,
  TrendingUp,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Hand,
  Target,
  Award,
  ChevronRight,
  MapPin
} from 'lucide-react';
import Link from 'next/link';
import { User, Property, Contract, Payment } from '@/types';
import { useUserState } from '@/hooks/useUserState';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  pendingClients: number;
  averageRating: number;
  totalClients: number;
  commissionRate: number;
}

interface RecentActivity {
  id: string;
  type: 'property' | 'contract' | 'client' | 'payment' | 'rating';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  type: 'OWNER' | 'TENANT';
  status: string;
  lastContact: string;
}

interface PropertySummary {
  id: string;
  title: string;
  address: string;
  status: string;
  price: number;
  owner: string;
  views: number;
  inquiries: number;
}

export default function BrokerDashboard() {
  const { user, loading: userLoading } = useUserState();

  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    pendingClients: 0,
    averageRating: 0,
    totalClients: 0,
    commissionRate: 0,
  });

  const [recentClients, setRecentClients] = useState<ClientSummary[]>([]);

  const [recentProperties, setRecentProperties] = useState<PropertySummary[]>([]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setStats({
        totalProperties: 45,
        activeContracts: 28,
        monthlyRevenue: 2500000,
        pendingClients: 8,
        averageRating: 4.8,
        totalClients: 156,
        commissionRate: 5,
      });

      setRecentClients([
        {
          id: '1',
          name: 'María González',
          email: 'maria@ejemplo.com',
          type: 'OWNER',
          status: 'ACTIVE',
          lastContact: 'Hace 2 días',
        },
        {
          id: '2',
          name: 'Carlos Ramírez',
          email: 'carlos@ejemplo.com',
          type: 'TENANT',
          status: 'PENDING',
          lastContact: 'Hace 1 semana',
        },
        {
          id: '3',
          name: 'Ana Martínez',
          email: 'ana@ejemplo.com',
          type: 'OWNER',
          status: 'ACTIVE',
          lastContact: 'Hace 3 días',
        },
      ]);

      setRecentProperties([
        {
          id: '1',
          title: 'Departamento Las Condes',
          address: 'Av. Apoquindo 3400, Las Condes',
          status: 'AVAILABLE',
          price: 550000,
          owner: 'María González',
          views: 245,
          inquiries: 18,
        },
        {
          id: '2',
          title: 'Oficina Providencia',
          address: 'Av. Providencia 1245, Providencia',
          status: 'RENTED',
          price: 350000,
          owner: 'Empresa Soluciones Ltda.',
          views: 189,
          inquiries: 12,
        },
        {
          id: '3',
          title: 'Casa Vitacura',
          address: 'Av. Vitacura 8900, Vitacura',
          status: 'AVAILABLE',
          price: 1200000,
          owner: 'Pedro Silva',
          views: 312,
          inquiries: 25,
        },
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'contract',
          title: 'Nuevo contrato firmado',
          description: 'Contrato entre María González y Carlos Ramírez',
          date: '2024-03-15',
          status: 'ACTIVE',
        },
        {
          id: '2',
          type: 'client',
          title: 'Nuevo cliente registrado',
          description: 'Pedro Silva se registró como propietario',
          date: '2024-03-14',
        },
        {
          id: '3',
          type: 'property',
          title: 'Nueva propiedad publicada',
          description: 'Casa en Vitacura publicada exitosamente',
          date: '2024-03-13',
        },
        {
          id: '4',
          type: 'rating',
          title: 'Excelente calificación',
          description: 'María González te calificó con 5 estrellas',
          date: '2024-03-12',
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property':
        return <Building className="w-5 h-5" />;
      case 'contract':
        return <FileText className="w-5 h-5" />;
      case 'client':
        return <Users className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'rating':
        return <Star className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property':
        return 'text-blue-600 bg-blue-50';
      case 'contract':
        return 'text-purple-600 bg-purple-50';
      case 'client':
        return 'text-green-600 bg-green-50';
      case 'payment':
        return 'text-orange-600 bg-orange-50';
      case 'rating':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-gray-100 text-gray-800">Completado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getClientTypeBadge = (type: string) => {
    switch (type) {
      case 'OWNER':
        return <Badge className="bg-blue-100 text-blue-800">Propietario</Badge>;
      case 'TENANT':
        return <Badge className="bg-purple-100 text-purple-800">Inquilino</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard de corredor...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Panel de Corredor"
      subtitle="Gestiona tu negocio inmobiliario"
    >

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.totalProperties / 100) * 100}%` }}></div>
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
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.activeContracts / 50) * 100}%` }}></div>
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
            <p className="text-xs text-green-100 mt-1">Comisión: {stats.commissionRate}%</p>
            <div className="mt-2 h-1 bg-green-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.monthlyRevenue / 5000000) * 100}%` }}></div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-orange-100" />
              <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-1">Clientes</h3>
            <p className="text-2xl font-bold">{stats.totalClients}</p>
            <p className="text-xs text-orange-100 mt-1">{stats.pendingClients} pendientes</p>
            <div className="mt-2 h-1 bg-orange-400 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${(stats.totalClients / 200) * 100}%` }}></div>
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
              <p className="text-sm text-gray-600 mb-4">Publica una nueva propiedad</p>
              <Link href="/broker/properties/new" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center">
                Comenzar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Clientes</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona tu cartera de clientes</p>
              <div className="flex items-center justify-between">
                <Link href="/broker/clients" className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center">
                  Ver clientes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                {stats.pendingClients > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">{stats.pendingClients} pendientes</Badge>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Hand className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Contratos</h3>
              <p className="text-sm text-gray-600 mb-4">Gestiona contratos de arriendo</p>
              <Link href="/broker/contracts" className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center">
                Ver contratos
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
              <p className="text-sm text-gray-600 mb-4">Analiza tu desempeño</p>
              <Link href="/broker/reports" className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center">
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
                    <h2 className="text-xl font-bold text-white">Propiedades Recientes</h2>
                    <p className="text-blue-100 text-sm">Propiedades que has gestionado recientemente</p>
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
                          <p className="text-xs text-blue-600 font-medium">Precio</p>
                          <p className="font-bold text-blue-800">{formatPrice(property.price)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Propietario</p>
                          <p className="font-bold text-green-800">{property.owner}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-purple-600 font-medium">Vistas</p>
                          <p className="font-bold text-purple-800">{property.views}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-orange-600 font-medium">Consultas</p>
                          <p className="font-bold text-orange-800">{property.inquiries}</p>
                        </div>
                      </div>

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
                            <Target className="w-4 h-4 mr-1" />
                            Promocionar
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
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{activity.title}</h4>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{formatDate(activity.date)}</p>
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
                <h2 className="text-xl font-bold text-white">Clientes Recientes</h2>
                <p className="text-green-100 text-sm">Nuevos clientes en tu cartera</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div key={client.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-300 hover:border-green-300">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800">{client.name}</h4>
                          <p className="text-sm text-gray-600">{client.email}</p>
                        </div>
                        {getClientTypeBadge(client.type)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">{client.lastContact}</span>
                        {getStatusBadge(client.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Resumen de Desempeño
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Calificación Promedio</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-600">{stats.averageRating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Tasa de Éxito</span>
                    <span className="font-bold text-green-600">62%</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium text-purple-800">Tiempo Promedio</span>
                    <span className="font-bold text-purple-600">15 días</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}
