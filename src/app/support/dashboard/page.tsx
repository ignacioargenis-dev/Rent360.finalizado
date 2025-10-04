'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import {
  Ticket,
  Users,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  BarChart3,
  Headphones,
  HelpCircle,
  Star,
  ThumbsUp,
  Activity,
  ChevronRight,
  Eye,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { useUserState } from '@/hooks/useUserState';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  averageResponseTime: number;
  customerSatisfaction: number;
  escalatedTickets: number;
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedResolution?: string;
}

interface RecentActivity {
  id: string;
  type: 'ticket' | 'resolution' | 'escalation' | 'feedback';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface PerformanceMetric {
  label: string;
  value: string;
  target: string;
  status: 'good' | 'warning' | 'poor';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  activeTickets: number;
  status: 'available' | 'busy' | 'offline';
}

export default function SupportDashboard() {
  const router = useRouter();
  const { user, loading: userLoading } = useUserState();

  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    averageResponseTime: 0,
    customerSatisfaction: 0,
    escalatedTickets: 0,
  });

  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setStats({
        totalTickets: 1247,
        openTickets: 23,
        resolvedTickets: 1189,
        pendingTickets: 35,
        averageResponseTime: 2.5,
        customerSatisfaction: 4.6,
        escalatedTickets: 8,
      });

      setRecentTickets([
        {
          id: '1',
          title: 'Problema con pago en línea',
          description: 'El cliente no puede realizar el pago de su arriendo mensual',
          clientName: 'Carlos Ramírez',
          clientEmail: 'carlos@ejemplo.com',
          category: 'Pagos',
          priority: 'HIGH',
          status: 'OPEN',
          assignedTo: 'María González',
          createdAt: '2024-03-15 09:30',
          updatedAt: '2024-03-15 10:15',
          estimatedResolution: '2024-03-15 18:00',
        },
        {
          id: '2',
          title: 'Error en sistema de calificaciones',
          description: 'No puedo calificar a mi inquilino después del contrato',
          clientName: 'Ana Martínez',
          clientEmail: 'ana@ejemplo.com',
          category: 'Sistema',
          priority: 'MEDIUM',
          status: 'IN_PROGRESS',
          assignedTo: 'Juan Pérez',
          createdAt: '2024-03-15 08:45',
          updatedAt: '2024-03-15 11:30',
        },
        {
          id: '3',
          title: 'Solicitud de devolución de depósito',
          description: 'Cliente solicita devolución de depósito por terminación de contrato',
          clientName: 'Pedro Silva',
          clientEmail: 'pedro@ejemplo.com',
          category: 'Contratos',
          priority: 'MEDIUM',
          status: 'OPEN' as any,
          createdAt: '2024-03-14 16:20',
          updatedAt: '2024-03-14 16:20',
        },
      ]);

      setRecentActivity([
        {
          id: '1',
          type: 'ticket',
          title: 'Nuevo ticket creado',
          description: 'Carlos Ramírez reportó problema con pagos',
          date: '2024-03-15 09:30',
          status: 'OPEN',
        },
        {
          id: '2',
          type: 'resolution',
          title: 'Ticket resuelto',
          description: 'Problema de inicio de sesión resuelto para María López',
          date: '2024-03-15 08:45',
          status: 'RESOLVED',
        },
        {
          id: '3',
          type: 'escalation',
          title: 'Ticket escalado',
          description: 'Problema crítico de sistema escalado a desarrollo',
          date: '2024-03-14 17:30',
          status: 'ESCALATED',
        },
        {
          id: '4',
          type: 'feedback',
          title: 'Feedback positivo',
          description: 'Cliente calificó el servicio con 5 estrellas',
          date: '2024-03-14 16:00',
        },
      ]);

      setPerformanceMetrics([
        {
          label: 'Tiempo de Respuesta',
          value: '2.5 horas',
          target: '< 3 horas',
          status: 'good',
        },
        {
          label: 'Resolución Primer Contacto',
          value: '78%',
          target: '> 80%',
          status: 'warning',
        },
        {
          label: 'Satisfacción del Cliente',
          value: '4.6/5',
          target: '> 4.5',
          status: 'good',
        },
        {
          label: 'Tickets Abiertos',
          value: '23',
          target: '< 25',
          status: 'good',
        },
      ]);

      setTeamMembers([
        {
          id: '1',
          name: 'María González',
          role: 'Soporte Nivel 2',
          activeTickets: 8,
          status: 'available',
        },
        {
          id: '2',
          name: 'Juan Pérez',
          role: 'Soporte Nivel 1',
          activeTickets: 12,
          status: 'busy',
        },
        {
          id: '3',
          name: 'Ana Martínez',
          role: 'Especialista Pagos',
          activeTickets: 3,
          status: 'available',
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

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
      case 'ticket':
        return <Ticket className="w-5 h-5" />;
      case 'resolution':
        return <CheckCircle className="w-5 h-5" />;
      case 'escalation':
        return <AlertCircle className="w-5 h-5" />;
      case 'feedback':
        return <Star className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'text-blue-600 bg-blue-50';
      case 'resolution':
        return 'text-green-600 bg-green-50';
      case 'escalation':
        return 'text-red-600 bg-red-50';
      case 'feedback':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-blue-100 text-blue-800">Abierto</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-100 text-yellow-800">En Progreso</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
      case 'CLOSED':
        return <Badge className="bg-gray-100 text-gray-800">Cerrado</Badge>;
      case 'ESCALATED':
        return <Badge className="bg-red-100 text-red-800">Escalado</Badge>;
      case 'PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getTeamStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'busy':
        return <Badge className="bg-yellow-100 text-yellow-800">Ocupado</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Desconectado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard de soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Panel de Control de Soporte"
      subtitle="Gestiona tickets y métricas de soporte"
      showNotifications={true}
      notificationCount={stats.openTickets}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Ticket className="w-8 h-8 text-blue-100" />
              <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
                <Ticket className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-1">Tickets Totales</h3>
            <p className="text-2xl font-bold">{stats.totalTickets}</p>
            <p className="text-xs text-blue-100 mt-1">{stats.resolvedTickets} resueltos</p>
            <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.resolvedTickets / stats.totalTickets) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-100" />
              <div className="bg-yellow-400 bg-opacity-30 rounded-full p-2">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-yellow-100 mb-1">Tickets Abiertos</h3>
            <p className="text-2xl font-bold">{stats.openTickets}</p>
            <p className="text-xs text-yellow-100 mt-1">{stats.escalatedTickets} escalados</p>
            <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.openTickets / 50) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-green-100" />
              <div className="bg-green-400 bg-opacity-30 rounded-full p-2">
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-green-100 mb-1">Tiempo de Respuesta</h3>
            <p className="text-2xl font-bold">{stats.averageResponseTime}h</p>
            <p className="text-xs text-green-100 mt-1">Promedio</p>
            <div className="mt-2 h-1 bg-green-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${((5 - stats.averageResponseTime) / 5) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <ThumbsUp className="w-8 h-8 text-amber-100" />
              <div className="bg-amber-400 bg-opacity-30 rounded-full p-2">
                <ThumbsUp className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-amber-100 mb-1">Satisfacción</h3>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{stats.customerSatisfaction}</p>
              <Star className="w-5 h-5 text-yellow-300 fill-current" />
            </div>
            <div className="mt-2 h-1 bg-amber-400 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${(stats.customerSatisfaction / 5) * 100}%` }}
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
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Nuevo Ticket</h3>
              <p className="text-sm text-gray-600 mb-4">Crear un nuevo ticket de soporte</p>
              <Link
                href="/support/tickets/new"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
              >
                Crear ticket
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
              <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Buscar Tickets</h3>
              <p className="text-sm text-gray-600 mb-4">Buscar y gestionar tickets existentes</p>
              <div className="flex items-center justify-between">
                <Link
                  href="/support/tickets"
                  className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                >
                  Ver tickets
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
                {stats.openTickets > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs">
                    {stats.openTickets} abiertos
                  </Badge>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Base de Conocimiento</h3>
              <p className="text-sm text-gray-600 mb-4">Artículos y guías de ayuda</p>
              <Link
                href="/support/knowledge"
                className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
              >
                Explorar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
              <p className="text-sm text-gray-600 mb-4">Analizar métricas de soporte</p>
              <Link
                href="/support/reports"
                className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center"
              >
                Ver reportes
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Tickets */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Tickets Recientes</h2>
                    <p className="text-blue-100 text-sm">Tickets que requieren tu atención</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar
                    </Button>
                    <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{ticket.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="font-medium">{ticket.clientName}</span>
                            <span>{ticket.clientEmail}</span>
                            <span className="bg-gray-100 px-2 py-1 rounded">{ticket.category}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {getPriorityBadge(ticket.priority)}
                          {getStatusBadge(ticket.status)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 font-medium">Asignado a</p>
                          <p className="font-bold text-blue-800">
                            {ticket.assignedTo || 'Sin asignar'}
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 font-medium">Creado</p>
                          <p className="font-bold text-green-800">
                            {formatDateTime(ticket.createdAt)}
                          </p>
                        </div>
                      </div>

                      {ticket.estimatedResolution && (
                        <div className="bg-yellow-50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-600 font-medium">Resolución estimada</p>
                          <p className="font-bold text-yellow-800">
                            {formatDateTime(ticket.estimatedResolution)}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver detalles
                        </Button>
                        {ticket.status === 'OPEN' && (
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Tomar ticket
                          </Button>
                        )}
                        {ticket.status === 'IN_PROGRESS' && (
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                <p className="text-purple-100 text-sm">Últimas acciones en el sistema</p>
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
                <h2 className="text-xl font-bold text-white">Estado del Equipo</h2>
                <p className="text-green-100 text-sm">Disponibilidad del equipo de soporte</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-800">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-xs text-gray-500">
                          {member.activeTickets} tickets activos
                        </p>
                      </div>
                      {getTeamStatusBadge(member.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
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
                      <div>
                        <p className="text-sm font-medium text-gray-700">{metric.label}</p>
                        <p className="text-xs text-gray-500">Objetivo: {metric.target}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getMetricStatusColor(metric.status)}`}>
                          {metric.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Acciones Rápidas</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <QuickActionButton
                    icon={Download}
                    label="Exportar Reporte"
                    description="Descargar estadísticas"
                    onClick={() => {
                      const csvData = [
                        {
                          Métrica: 'Tickets Totales',
                          Valor: stats.totalTickets,
                          Fecha: new Date().toLocaleDateString('es-CL'),
                        },
                        {
                          Métrica: 'Tickets Abiertos',
                          Valor: stats.openTickets,
                          Fecha: new Date().toLocaleDateString('es-CL'),
                        },
                        {
                          Métrica: 'Tiempo de Respuesta',
                          Valor: `${stats.averageResponseTime}h`,
                          Fecha: new Date().toLocaleDateString('es-CL'),
                        },
                        {
                          Métrica: 'Satisfacción',
                          Valor: `${stats.customerSatisfaction}/5`,
                          Fecha: new Date().toLocaleDateString('es-CL'),
                        },
                      ];

                      const csvContent =
                        'data:text/csv;charset=utf-8,' +
                        Object.keys(csvData[0]!).join(',') +
                        '\n' +
                        csvData.map(row => Object.values(row).join(',')).join('\n');

                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute(
                        'download',
                        `reporte_soporte_${new Date().toISOString().split('T')[0]}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  />

                  <QuickActionButton
                    icon={Headphones}
                    label="Centro de Llamadas"
                    description="Atención telefónica"
                    onClick={() => {
                      // Open VoIP application or redirect to calls page
                      window.open('/support/calls', '_blank');
                    }}
                  />

                  <QuickActionButton
                    icon={Mail}
                    label="Gestión de Emails"
                    description="Bandeja de correos"
                    onClick={() => {
                      // Open email management page
                      window.open('/support/emails', '_blank');
                    }}
                  />

                  <QuickActionButton
                    icon={HelpCircle}
                    label="Base de Conocimiento"
                    description="Preguntas frecuentes"
                    onClick={() => router.push('/support/knowledge')}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
