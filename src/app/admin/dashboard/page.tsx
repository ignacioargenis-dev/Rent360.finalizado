'use client';

import { logger } from '@/lib/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Building,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  UserPlus,
  Eye,
  RefreshCw,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Search,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  BarChart3,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  CalendarDays,
  Timer,
  Phone,
  Video,
  Slack,
  Repeat,
  CalendarClock,
  BellRing,
  BellOff,
  VolumeX,
  UserCheck,
  Banknote,
  Receipt,
  Calculator,
  Percent,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  SkipBack,
  Pause,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import Link from 'next/link';
import { User, Property, Payment } from '@/types';

import { QuickActionCard } from '@/components/dashboard/QuickActionCard';
import { useRouter } from 'next/navigation';

interface SystemStats {
  totalUsers: number;
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  pendingTickets: number;
  systemHealth: 'good' | 'warning' | 'error';
}

interface RecentActivity {
  id: string;
  type: 'user' | 'property' | 'contract' | 'payment' | 'ticket' | 'system';
  title: string;
  description: string;
  date: string;
  severity?: 'low' | 'medium' | 'high';
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActivity: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  date: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [_aiEnabled, setAiEnabled] = useState(true);
  const [_automationEnabled, setAutomationEnabled] = useState(true);

  const [user, setUser] = useState<User | null>(null);

  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalProperties: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    pendingTickets: 0,
    systemHealth: 'good',
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [recentUsers, setRecentUsers] = useState<UserSummary[]>([]);

  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  const [loading, setLoading] = useState(true);

  const [activities, setActivities] = useState<RecentActivity[]>([]);

  const router = useRouter();

  // Función para refrescar datos del dashboard
  const refreshDashboard = async () => {
    setLoading(true);
    await loadDashboardData();
    setLoading(false);
  };

  useEffect(() => {
    // Load user data from API
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

    // Load dashboard data from APIs
    const loadDashboardData = async () => {
      try {
        // Load users
        const usersResponse = await fetch('/api/users?limit=1000', {
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          const totalUsers = usersData.users
            ? usersData.users.length
            : Array.isArray(usersData)
              ? usersData.length
              : 0;

          // Load properties
          const propertiesResponse = await fetch('/api/properties?limit=1000', {
            headers: {
              'Cache-Control': 'no-cache',
              Pragma: 'no-cache',
            },
          });
          if (propertiesResponse.ok) {
            const propertiesData = await propertiesResponse.json();
            const totalProperties = propertiesData.properties.length;
            const activeContracts = propertiesData.properties.filter(
              (p: Property) => p.status === 'RENTED'
            ).length;

            // Load tickets
            const ticketsResponse = await fetch('/api/tickets?status=open&limit=1000', {
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            });
            if (ticketsResponse.ok) {
              const ticketsData = await ticketsResponse.json();
              const pendingTickets = ticketsData.tickets.length;

              // Calculate actual monthly revenue from payments
              const paymentsResponse = await fetch('/api/payments?status=completed&limit=1000', {
                headers: {
                  'Cache-Control': 'no-cache',
                  Pragma: 'no-cache',
                },
              });
              let monthlyRevenue = 0;
              if (paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();

                monthlyRevenue = paymentsData.payments
                  .filter((payment: Payment) => {
                    if (!payment.paidDate) {
                      return false;
                    }
                    const paymentDate = new Date(payment.paidDate);
                    return (
                      paymentDate.getMonth() === currentMonth &&
                      paymentDate.getFullYear() === currentYear
                    );
                  })
                  .reduce((sum: number, payment: Payment) => sum + (payment.amount || 0), 0);
              }

              setStats({
                totalUsers,
                totalProperties,
                activeContracts,
                monthlyRevenue,
                pendingTickets,
                systemHealth: 'good',
              });

              // Set recent users (last 4)
              const usersArray = usersData.users || usersData;
              setRecentUsers(
                usersArray.slice(0, 4).map((user: User) => ({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  role: getRoleDisplayName(user.role),
                  status: 'Activo',
                  lastActivity: formatRelativeTime(new Date(user.createdAt)),
                }))
              );

              // Set recent activity based on actual data
              const activities: RecentActivity[] = [];

              // Add user creation activities
              usersData.users.slice(0, 3).forEach((user: User) => {
                activities.push({
                  id: `user-${user.id}`,
                  type: 'user' as const,
                  title: 'Nuevo usuario registrado',
                  description: user.email,
                  date: user.createdAt.toISOString(),
                  severity: 'low' as const,
                });
              });

              // Add property creation activities
              propertiesData.properties.slice(0, 3).forEach((property: Property) => {
                activities.push({
                  id: `property-${property.id}`,
                  type: 'property' as const,
                  title: 'Nueva propiedad agregada',
                  description: property.title,
                  date: property.createdAt.toISOString(),
                  severity: 'low' as const,
                });
              });

              // Add high priority tickets
              ticketsData.tickets
                .filter((ticket: any) => ticket.priority === 'HIGH')
                .slice(0, 2)
                .forEach((ticket: any) => {
                  activities.push({
                    id: `ticket-${ticket.id}`,
                    type: 'ticket' as const,
                    title: 'Nuevo ticket creado',
                    description: ticket.title,
                    date: ticket.createdAt,
                    severity: 'high' as const,
                  });
                });

              // Sort activities by date
              activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              setRecentActivity(activities.slice(0, 10));
            }
          }
        }

        setLoading(false);
      } catch (error) {
        logger.error('Error loading dashboard data:', {
          error: error instanceof Error ? error.message : String(error),
          context: 'admin_dashboard',
          userId: user?.id,
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadDashboardData();
  }, []);

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'tenant':
        return 'Inquilino';
      case 'owner':
        return 'Propietario';
      case 'broker':
        return 'Corredor';
      case 'runner':
        return 'Runner360';
      case 'support':
        return 'Soporte';
      default:
        return role;
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${days}d ago`;
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-5 h-5" />;
      case 'property':
        return <Building className="w-5 h-5" />;
      case 'contract':
        return <FileText className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'ticket':
        return <Ticket className="w-5 h-5" />;
      case 'system':
        return <Database className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string, severity?: string) => {
    if (severity === 'high') {
      return 'text-red-600 bg-red-50';
    }
    if (severity === 'medium') {
      return 'text-yellow-600 bg-yellow-50';
    }

    switch (type) {
      case 'user':
        return 'text-blue-600 bg-blue-50';
      case 'property':
        return 'text-green-600 bg-green-50';
      case 'contract':
        return 'text-purple-600 bg-purple-50';
      case 'payment':
        return 'text-orange-600 bg-orange-50';
      case 'ticket':
        return 'text-red-600 bg-red-50';
      case 'system':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return null;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'good':
        return <Badge className="bg-green-100 text-green-800">Bueno</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Panel de Administración"
      subtitle="Gestiona todo el sistema Rent360"
      notificationCount={stats.pendingTickets}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={refreshDashboard}
            disabled={loading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar Datos
          </Button>
        </div>

        {/* System Alerts */}
        {systemAlerts.length > 0 && (
          <div className="mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              {systemAlerts.map(alert => (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.type === 'error'
                      ? 'border-red-500 bg-red-50'
                      : alert.type === 'warning'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{alert.description}</p>
                        <p className="text-xs text-gray-500 mt-2">{alert.date}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        Ver detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.monthlyRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tickets Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingTickets}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={UserPlus}
              title="Gestionar Usuarios"
              description="Administra todos los usuarios del sistema"
              color="blue"
              onClick={() => router.push('/admin/users')}
            />
            <QuickActionCard
              icon={Building}
              title="Gestionar Propiedades"
              description="Administrar propiedades y contratos"
              color="blue"
              onClick={() => router.push('/admin/properties')}
            />
            <QuickActionCard
              icon={Ticket}
              title="Tickets de Soporte"
              description="Revisar y gestionar tickets"
              color="orange"
              onClick={() => router.push('/admin/tickets')}
            />
            <QuickActionCard
              icon={BarChart3}
              title="Reportes"
              description="Generar reportes y estadísticas"
              color="purple"
              onClick={() => router.push('/admin/reports')}
            />
          </div>
        </div>

        {/* Recent Activity and Users */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas actividades en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div
                      className={`p-2 rounded-lg ${getActivityColor(activity.type, activity.severity)}`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{formatDateTime(activity.date)}</p>
                    </div>
                    {getSeverityBadge(activity.severity)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Recientes</CardTitle>
                <CardDescription>Últimos usuarios registrados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">{user.lastActivity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
                <CardDescription>Estado y métricas del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Versión</span>
                    <span className="font-medium">2.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Último actualización</span>
                    <span className="font-medium">15 Mar 2024</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Base de datos</span>
                    <span className="font-medium text-green-600">Conectada</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Gateway</span>
                    <span className="font-medium text-green-600">Operativo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uso de CPU</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: '45%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Memoria</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: '68%' }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">68%</span>
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
