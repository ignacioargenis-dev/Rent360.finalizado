'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Building,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Plus,
  Search,
  FileText,
  BarChart3,
  Target,
  Star,
  MessageSquare,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  status: 'available' | 'rented' | 'pending';
  type: string;
  owner: string;
  createdAt: string;
  views: number;
  inquiries: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  type: 'owner' | 'tenant';
  status: 'active' | 'prospect';
  lastContact: string;
  properties: number;
}

interface BrokerStats {
  totalProperties: number;
  activeClients: number;
  totalCommissions: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  newInquiries: number;
  conversionRate: number;
  averageCommission: number;
}

interface RecentActivity {
  id: string;
  type: 'property_view' | 'inquiry' | 'appointment' | 'commission';
  description: string;
  timestamp: string;
  amount?: number;
}

export default function BrokerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [stats, setStats] = useState<BrokerStats>({
    totalProperties: 0,
    activeClients: 0,
    totalCommissions: 0,
    monthlyRevenue: 0,
    pendingAppointments: 0,
    newInquiries: 0,
    conversionRate: 0,
    averageCommission: 0,
  });
  const [loading, setLoading] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    averageResponseTime: '0 horas',
    clientSatisfaction: '0/5 ⭐',
    clientRetention: '0%',
  });

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

    const loadUnreadMessagesCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadMessagesCount(data.unreadCount);
          }
        }
      } catch (error) {
        logger.error('Error loading unread messages count:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadBrokerData = async () => {
      try {
        // Detectar si es un usuario nuevo (menos de 1 hora desde creación)
        const isNewUser =
          !user?.createdAt || Date.now() - new Date(user.createdAt).getTime() < 3600000;

        // SIEMPRE mostrar dashboard vacío para usuarios nuevos
        // Los datos mock solo aparecen para usuarios seed con @rent360.cl (para testing)
        if (isNewUser || !user?.email?.includes('@rent360.cl')) {
          // Usuario nuevo O usuario real (no seed) - mostrar dashboard vacío con bienvenida
          setProperties([]);
          setClients([]);
          setRecentActivities([
            {
              id: 'welcome',
              type: 'commission',
              description:
                '¡Bienvenido a Rent360! Tu cuenta de corredor ha sido creada exitosamente.',
              timestamp: new Date().toISOString(),
            },
          ]);
          setStats({
            totalProperties: 0,
            activeClients: 0,
            totalCommissions: 0,
            monthlyRevenue: 0,
            pendingAppointments: 0,
            newInquiries: 0,
            conversionRate: 0,
            averageCommission: 0,
          });
          setLoading(false);
          return;
        }

        // ✅ CORREGIDO: Cargar datos reales del dashboard del corredor
        const response = await fetch('/api/broker/dashboard');
        if (response.ok) {
          const result = await response.json();
          const data = result.data;

          // Transformar datos para el formato esperado por el componente
          const transformedProperties: Property[] = data.recentProperties.map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            address: prop.address,
            price: prop.price,
            status: prop.status.toLowerCase(),
            type: 'propiedad', // Default type
            owner: 'Propietario',
            createdAt: prop.createdAt,
            views: prop.inquiriesCount || 0,
            inquiries: prop.inquiriesCount || 0,
          }));

          const transformedClients: Client[] = data.recentContracts.map((contract: any) => ({
            id: contract.id,
            name: contract.tenantName,
            email: 'cliente@email.com', // Mock email
            type: 'tenant',
            status: 'active',
            lastContact: contract.createdAt,
            properties: 1,
          }));

          const transformedActivities: RecentActivity[] = [
            ...data.recentCommissions.map((commission: any) => ({
              id: commission.id,
              type: 'commission' as const,
              description: `Comisión generada: ${commission.propertyTitle}`,
              timestamp: commission.createdAt,
              amount: commission.amount,
            })),
            ...data.recentActivity.slice(0, 5).map((activity: any) => ({
              id: activity.id,
              type: 'property_view' as const,
              description: `${activity.action} - ${activity.entityType}`,
              timestamp: activity.createdAt,
            })),
          ].slice(0, 10);

          setProperties(transformedProperties);
          setClients(transformedClients);
          setRecentActivities(transformedActivities);

          // Usar estadísticas reales de la API
          setStats({
            totalProperties: data.stats.totalProperties,
            activeClients: data.stats.activeContracts,
            totalCommissions: data.stats.totalCommissions,
            monthlyRevenue: data.stats.monthlyRevenue,
            pendingAppointments: 0, // No disponible en la API actual
            newInquiries: data.stats.recentInquiries,
            conversionRate: data.stats.conversionRate,
            averageCommission: data.stats.averageCommission,
          });

          // Cargar métricas de rendimiento reales
          try {
            const performanceResponse = await fetch('/api/broker/performance-metrics');
            if (performanceResponse.ok) {
              const performanceData = await performanceResponse.json();
              setPerformanceMetrics({
                averageResponseTime: performanceData.averageResponseTime || '0 horas',
                clientSatisfaction: performanceData.clientSatisfaction || '0/5 ⭐',
                clientRetention: performanceData.clientRetention || '0%',
              });
            }
          } catch (error) {
            logger.warn('Could not load performance metrics, using defaults');
          }
        } else {
          // Si la API falla, mostrar datos vacíos en lugar de mock
          logger.warn('API dashboard failed, showing empty data');
          setProperties([]);
          setClients([]);
          setRecentActivities([]);
          setStats({
            totalProperties: 0,
            activeClients: 0,
            totalCommissions: 0,
            monthlyRevenue: 0,
            pendingAppointments: 0,
            newInquiries: 0,
            conversionRate: 0,
            averageCommission: 0,
          });
        }

        setLoading(false);
      } catch (error) {
        logger.error('Error loading broker data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, mostrar datos vacíos
        setProperties([]);
        setClients([]);
        setRecentActivities([]);
        setStats({
          totalProperties: 0,
          activeClients: 0,
          totalCommissions: 0,
          monthlyRevenue: 0,
          pendingAppointments: 0,
          newInquiries: 0,
          conversionRate: 0,
          averageCommission: 0,
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadBrokerData();
    loadUnreadMessagesCount();

    // Actualizar contador cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'commission':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'appointment':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'property_view':
        return <Eye className="w-4 h-4 text-orange-600" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard del corredor...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Panel del Corredor"
      subtitle="Gestiona tus propiedades, clientes y comisiones"
      unreadMessagesCount={unreadMessagesCount}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido de vuelta, {user?.name?.split(' ')[0] || 'Corredor'}!
          </h1>
          <p className="text-gray-600">Aquí tienes un resumen de tu actividad reciente</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.monthlyRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics Section */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Métricas de Rendimiento
              </CardTitle>
              <CardDescription>Indicadores clave de tu desempeño como corredor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">Comisión Promedio</span>
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(stats.averageCommission)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">Por contrato cerrado</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-700">Consultas Recientes</span>
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{stats.newInquiries}</p>
                  <p className="text-xs text-green-600 mt-1">Últimos 7 días</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">
                      Comisiones Pendientes
                    </span>
                    <Clock className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(stats.pendingAppointments * 35000)} {/* Mock calculation */}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Por procesar</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-orange-700">Tasa de Éxito</span>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{stats.conversionRate}%</p>
                  <p className="text-xs text-orange-600 mt-1">Consultas → Contratos</p>
                </div>
              </div>

              {/* Additional Performance Insights */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tiempo de respuesta promedio:</span>
                    <span className="font-medium">{performanceMetrics.averageResponseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Satisfacción de clientes:</span>
                    <span className="font-medium">{performanceMetrics.clientSatisfaction}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Retención de clientes:</span>
                    <span className="font-medium">{performanceMetrics.clientRetention}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Herramientas para gestionar tu negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickActionButton
                    icon={Plus}
                    label="Nueva Propiedad"
                    description="Publicar inmueble"
                    onClick={() => router.push('/broker/properties/new')}
                  />

                  <QuickActionButton
                    icon={Users}
                    label="Clientes"
                    description="Gestionar contactos"
                    onClick={() => router.push('/broker/clients')}
                  />

                  <QuickActionButton
                    icon={Calendar}
                    label="Citas"
                    description="Agenda y visitas"
                    onClick={() => router.push('/broker/appointments')}
                  />

                  <QuickActionButton
                    icon={DollarSign}
                    label="Comisiones"
                    description="Seguimiento de pagos"
                    onClick={() => router.push('/broker/commissions')}
                  />

                  <QuickActionButton
                    icon={Search}
                    label="Buscar"
                    description="Propiedades disponibles"
                    onClick={() => router.push('/broker/properties')}
                  />

                  <QuickActionButton
                    icon={BarChart3}
                    label="Reportes"
                    description="Estadísticas y análisis"
                    onClick={() => router.push('/broker/reports')}
                  />

                  <QuickActionButton
                    icon={AlertTriangle}
                    label="Soporte"
                    description="Contactar soporte técnico"
                    onClick={() => router.push('/support/tickets')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas acciones en tu cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map(activity => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="mt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(activity.timestamp)}
                        </p>
                        {activity.amount && (
                          <p className="text-xs font-medium text-green-600">
                            {formatCurrency(activity.amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Mis Propiedades</CardTitle>
                <CardDescription>Propiedades que tienes a cargo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map(property => (
                    <Card key={property.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-blue-50">
                              <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{property.title}</h3>
                                {getStatusBadge(property.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm text-gray-600">{property.address}</p>
                                  <p className="text-sm text-gray-600">
                                    Propietario: {property.owner}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {formatCurrency(property.price)}/mes
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" />
                                      {property.views}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="w-3 h-3" />
                                      {property.inquiries}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>Estadísticas de tu desempeño</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">Comisiones Totales</p>
                      <p className="text-xs text-green-600">Este mes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">
                        {formatCurrency(stats.totalCommissions)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Comisión Promedio</p>
                      <p className="text-xs text-blue-600">Por arriendo</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">
                        {formatCurrency(stats.averageCommission)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Citas Pendientes</p>
                      <p className="text-xs text-purple-600">Para esta semana</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-800">
                        {stats.pendingAppointments}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Nuevas Consultas</p>
                      <p className="text-xs text-orange-600">Esta semana</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-800">{stats.newInquiries}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
