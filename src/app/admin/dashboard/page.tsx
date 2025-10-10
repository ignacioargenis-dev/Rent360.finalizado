'use client';

import { logger } from '@/lib/logger';
import { useAdminDashboardSync } from '@/hooks/useDashboardSync';
import { useConnectionManager } from '@/hooks/useConnectionManager';

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

  // Gestión de conexiones
  const connectionManager = useConnectionManager('websocket', {
    maxRetries: 3,
    retryDelay: 5000,
    heartbeatInterval: 30000,
  });

  // Mapeo de datos del nuevo sistema
  const stats = statsData.data
    ? {
        totalUsers: statsData.data.totalUsers || 0,
        totalProperties: statsData.data.totalProperties || 0,
        activeContracts: statsData.data.activeContracts || 0,
        monthlyRevenue: statsData.data.monthlyRevenue || 0,
        pendingTickets: statsData.data.pendingTickets || 0,
        systemHealth: statsData.data.systemHealth || 'good',
      }
    : {
        totalUsers: 0,
        totalProperties: 0,
        activeContracts: 0,
        monthlyRevenue: 0,
        pendingTickets: 0,
        systemHealth: 'good',
      };

  const recentUsers = recentUsersData.data || [];
  const recentActivity = recentActivityData.data || [];
  const systemAlerts: SystemAlert[] = []; // Se pueden agregar alertas del sistema aquí

  // Efecto para manejar errores
  useEffect(() => {
    if (hasError) {
      console.warn('Dashboard data loading error:', hasError);
    }
  }, [hasError]);

  // Función para refrescar manualmente
  const handleRefresh = () => {
    refreshDashboard();
    invalidateUserData();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'owner':
        return 'Propietario';
      case 'tenant':
        return 'Inquilino';
      case 'broker':
        return 'Corredor';
      case 'runner':
        return 'Runner360';
      case 'support':
        return 'Soporte';
      case 'maintenance':
        return 'Servicio de Mantenimiento';
      case 'provider':
        return 'Proveedor de Servicios';
      default:
        return role;
    }
  };

  const getActivityColor = (type: string, severity: string) => {
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

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };

    return (
      <Badge className={`text-xs ${colors[severity as keyof typeof colors] || colors.low}`}>
        {severity.toUpperCase()}
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

  return (
    <UnifiedDashboardLayout
      title="Panel de Administración"
      subtitle="Gestiona todo el sistema Rent360"
      notificationCount={stats.pendingTickets}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Connection Status & Refresh */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            {connectionManager.isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-600">
              {connectionManager.isConnected ? 'Conectado' : 'Desconectado'}
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
                      className={`font-medium ${connectionManager.isConnected ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {connectionManager.isConnected ? 'En línea' : 'Fuera de línea'}
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
