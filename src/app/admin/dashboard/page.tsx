'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';

import { logger } from '@/lib/logger-edge-runtime';
import { useAdminDashboardSync } from '@/hooks/useDashboardSync';
import { RoleGuard } from '@/components/auth/RoleGuard';
import UnifiedDashboardLayout, {
  useDashboardUser,
} from '@/components/layout/UnifiedDashboardLayout';

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
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
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

  const [user, setUser] = useState<User | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const router = useRouter();

  // Sistema de sincronización en tiempo real
  const {
    stats: statsData,
    recentUsers: recentUsersData,
    recentActivity: recentActivityData,
    isLoading,
    hasError,
    lastUpdated,
    isConnected,
    refreshDashboard,
    invalidateUserData,
  } = useAdminDashboardSync();

  // Mapeo de datos del nuevo sistema
  const statsDataObj = statsData.data || {};
  const stats = {
    totalUsers: (statsDataObj as any).totalUsers || 0,
    totalProperties: (statsDataObj as any).totalProperties || 0,
    activeContracts: (statsDataObj as any).activeContracts || 0,
    monthlyRevenue: (statsDataObj as any).monthlyRevenue || 0,
    pendingTickets: (statsDataObj as any).pendingTickets || 0,
    systemHealth: (statsDataObj as any).systemHealth || 'good',
  };

  const recentUsers = (recentUsersData.data || []) as UserSummary[];
  const recentActivity = (recentActivityData.data || []) as RecentActivity[];
  const systemAlerts: SystemAlert[] = []; // Se pueden agregar alertas del sistema aquí

  // Función para refrescar manualmente
  const handleRefresh = () => {
    refreshDashboard();
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

    loadUserData();
    loadUnreadMessagesCount();

    // Actualizar contador cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getRoleDisplayName = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'Administrador';
      case 'OWNER':
        return 'Propietario';
      case 'TENANT':
        return 'Inquilino';
      case 'BROKER':
        return 'Corredor';
      case 'RUNNER':
        return 'Runner360';
      case 'SUPPORT':
        return 'Soporte';
      case 'MAINTENANCE':
      case 'MAINTENANCE_PROVIDER':
        return 'Servicio de Mantenimiento';
      case 'PROVIDER':
      case 'SERVICE_PROVIDER':
        return 'Proveedor de Servicios';
      default:
        return role;
    }
  };

  const getActivityColor = (type: string, severity?: string) => {
    if (severity === 'high') {
      return 'bg-red-100 text-red-600';
    }
    if (severity === 'medium') {
      return 'bg-yellow-100 text-yellow-600';
    }
    if (severity === 'low') {
      return 'bg-blue-100 text-blue-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserPlus className="w-4 h-4" />;
      case 'contract':
        return <FileText className="w-4 h-4" />;
      case 'payment':
        return <DollarSign className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={`text-xs ${colors[severity as keyof typeof colors] || colors.low}`}>
        {(severity || 'low').toUpperCase()}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard administrativo...</p>
        </div>
      </div>
    );
  }

  // Verificar que el usuario esté autenticado y tenga permisos de admin
  const hasAdminAccess = user && user.role === 'ADMIN';

  if (!user || !hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              {user
                ? `Tu rol actual es "${user.role}". Esta página requiere permisos de administrador.`
                : 'Debes iniciar sesión para acceder a esta página.'}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Debug Info:</strong>
                <br />
                Usuario: {user ? JSON.stringify(user, null, 2) : 'No autenticado'}
                <br />
                Rol requerido: &apos;admin&apos; (case insensitive)
                <br />
                Acceso permitido: {hasAdminAccess ? '✅ Sí' : '❌ No'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {!user ? (
              <Button onClick={() => (window.location.href = '/auth/login')} className="w-full">
                Iniciar Sesión
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = '/')} className="w-full">
                Ir al Inicio
              </Button>
            )}
          </div>

          {user && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Si crees que deberías tener permisos de administrador, contacta al soporte técnico.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Panel de Administración"
      subtitle="Gestiona todo el sistema Rent360"
      notificationCount={stats.pendingTickets}
      unreadMessagesCount={unreadMessagesCount}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Connection Status & Refresh */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Última actualización: {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                    ${stats.monthlyRevenue?.toLocaleString() || '0'}
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

        {/* Sección de Diagnóstico */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Diagnóstico de Autenticación
              </CardTitle>
              <CardDescription>
                Verifica tu estado de autenticación y corrige problemas de roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Usuario actual</p>
                    <p className="text-sm text-gray-600">
                      {user ? `${user.name} (${user.role})` : 'No autenticado'}
                    </p>
                  </div>
                  <Badge variant={user?.role === 'admin' ? 'default' : 'destructive'}>
                    {user?.role || 'Sin rol'}
                  </Badge>
                </div>

                {user?.role !== 'admin' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Tu rol actual es <strong>{user?.role}</strong>. Si deberías ser
                      administrador, contacta al soporte técnico o verifica tu configuración de
                      autenticación.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/diagnostics');
                        const data = await response.json();
                        logger.info('Diagnóstico obtenido:', data);
                        alert('Revisa la consola del navegador para ver el diagnóstico completo');
                      } catch (error) {
                        logger.error('Error obteniendo diagnóstico:', error);
                      }
                    }}
                  >
                    Ver Diagnóstico Técnico
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.clear();
                      window.location.href = '/auth/login';
                    }}
                  >
                    Limpiar Sesión y Reintentar
                  </Button>
                  {user?.role !== 'admin' && (
                    <Button
                      variant="default"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/user-role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ role: 'admin' }),
                          });

                          if (response.ok) {
                            alert('Rol actualizado a admin. Recarga la página.');
                            window.location.reload();
                          } else {
                            const error = await response.json();
                            alert('Error actualizando rol: ' + error.error);
                          }
                        } catch (error) {
                          logger.error('Error actualizando rol:', error);
                          alert('Error actualizando rol. Revisa la consola.');
                        }
                      }}
                    >
                      Forzar Rol Admin
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const email = prompt('Email para admin de prueba (debe contener "admin"):');
                        const password = prompt('Password:');
                        const name = prompt('Nombre:');

                        if (!email || !password || !name) {
                          alert('Todos los campos son requeridos');
                          return;
                        }

                        const response = await fetch('/api/admin/create-test-admin', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email, password, name }),
                        });

                        const result = await response.json();

                        if (response.ok) {
                          alert('Usuario admin creado. Usa las credenciales para iniciar sesión.');
                          logger.info('Credenciales de admin creadas:', { email });
                        } else {
                          alert('Error: ' + result.error);
                        }
                      } catch (error) {
                        logger.error('Error creando admin de prueba:', error);
                        alert('Error creando admin de prueba');
                      }
                    }}
                  >
                    Crear Admin de Prueba
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Corrección de Roles de Usuarios Existentes */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Corrección de Roles de Usuarios Existentes
              </CardTitle>
              <CardDescription>
                Si los usuarios existentes tienen problemas de permisos, usa esta herramienta para
                corregir sus roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Problema Detectado</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Los usuarios existentes pueden tener roles incorrectos (ej: &ldquo;tenant&rdquo;
                    en lugar de &ldquo;admin&rdquo;). Esta herramienta permite corregir los roles de
                    usuarios existentes.
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/fix-user-roles');
                          const data = await response.json();

                          if (response.ok) {
                            alert(
                              `Se encontraron ${data.total} usuarios. Revisa la consola para ver la lista.`
                            );
                            // eslint-disable-next-line no-console
                            console.log('Usuarios con problemas de roles:', data.users);
                          } else {
                            alert('Error obteniendo usuarios: ' + data.error);
                          }
                        } catch (error) {
                          // eslint-disable-next-line no-console
                          console.error('Error obteniendo usuarios:', error);
                          alert('Error obteniendo usuarios');
                        }
                      }}
                      className="w-full"
                    >
                      Ver Usuarios con Problemas de Roles
                    </Button>
                    <Button
                      variant="default"
                      onClick={async () => {
                        const userId = prompt('Ingrese el ID del usuario a corregir:');
                        const newRole = prompt(
                          'Ingrese el nuevo rol (admin, tenant, owner, broker, provider, maintenance, runner, support):'
                        );

                        if (!userId || !newRole) {
                          alert('Ambos campos son requeridos');
                          return;
                        }

                        try {
                          const response = await fetch('/api/admin/fix-user-roles', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, newRole }),
                          });

                          const result = await response.json();

                          if (response.ok) {
                            alert('Rol actualizado correctamente. Recarga la página.');
                            window.location.reload();
                          } else {
                            alert('Error: ' + result.error);
                          }
                        } catch (error) {
                          // eslint-disable-next-line no-console
                          console.error('Error actualizando rol:', error);
                          alert('Error actualizando rol');
                        }
                      }}
                      className="w-full"
                    >
                      Corregir Rol de Usuario Específico
                    </Button>
                  </div>
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
                          {getRoleDisplayName(user.role)}
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
                    <span className="text-sm text-gray-600">Estado de Conexión</span>
                    <span
                      className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {isConnected ? 'En línea' : 'Fuera de línea'}
                    </span>
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
