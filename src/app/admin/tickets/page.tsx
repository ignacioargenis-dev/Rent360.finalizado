'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Ticket,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  UserCheck,
  TrendingUp,
  Calendar,
  Headphones,
  Zap,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  category: 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  resolutionTime?: number;
  satisfaction?: number;
}

interface TicketStats {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  pendingTickets: number;
  averageResolutionTime: number;
  customerSatisfaction: number;
  escalatedTickets: number;
}

export default function AdminTicketsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    pendingTickets: 0,
    averageResolutionTime: 0,
    customerSatisfaction: 0,
    escalatedTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  const handleNewTicket = () => {
    // Navigate to new ticket creation page
    window.open('/admin/tickets/new', '_blank');
  };

  const handleFilterTickets = () => {
    // Open advanced filter modal
    alert('Funcionalidad: Abrir filtros avanzados para tickets de soporte');
  };

  const handleExportTickets = () => {
    // Export tickets data to CSV
    const csvData = tickets.map(ticket => ({
      ID: ticket.id,
      Título: ticket.title,
      Cliente: ticket.clientName,
      Email: ticket.clientEmail,
      Teléfono: ticket.clientPhone,
      Categoría: ticket.category,
      Prioridad: ticket.priority,
      Estado: ticket.status,
      Asignado: ticket.assignedTo || 'Sin asignar',
      'Fecha Creación': formatDateTime(ticket.createdAt),
      'Fecha Actualización': formatDateTime(ticket.updatedAt),
      'Tiempo Resolución': ticket.resolutionTime ? `${ticket.resolutionTime}h` : 'N/A',
      Satisfacción: ticket.satisfaction || 'N/A',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tickets_soporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewTicket = (ticketId: string) => {
    // Navigate to ticket detail view
    window.open(`/admin/tickets/${ticketId}`, '_blank');
  };

  const handleAssignTicket = (ticketId: string) => {
    // Show assignment modal or redirect to assignment page
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const assignedTo = prompt(`Asignar ticket "${ticket.title}" a:`, 'soporte@rent360.cl');
      if (assignedTo) {
        alert(`Ticket asignado exitosamente a: ${assignedTo}`);
      }
    }
  };

  const handleCloseTicket = (ticketId: string) => {
    // Close ticket with confirmation
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      if (confirm(`¿Está seguro de cerrar el ticket "${ticket.title}"?`)) {
        alert('Ticket cerrado exitosamente');
      }
    }
  };

  const handleResolveTicket = (ticketId: string) => {
    // Resolve ticket with resolution note
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      const resolution = prompt(`Ingrese la resolución para el ticket "${ticket.title}":`);
      if (resolution) {
        alert('Ticket resuelto exitosamente');
      }
    }
  };

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

    const loadTicketData = async () => {
      try {
        // Mock support tickets data
        const mockTickets: SupportTicket[] = [
          {
            id: '1',
            title: 'Problema con pago en línea',
            description:
              'El cliente no puede realizar el pago de su arriendo mensual a través de la plataforma',
            clientName: 'Carlos Ramírez',
            clientEmail: 'carlos@email.com',
            clientPhone: '+56912345678',
            category: 'billing',
            priority: 'high',
            status: 'open',
            assignedTo: 'María González',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          },
          {
            id: '2',
            title: 'Error en sistema de calificaciones',
            description: 'No se pueden calificar a los inquilinos después de finalizar contratos',
            clientName: 'Ana Martínez',
            clientEmail: 'ana@email.com',
            category: 'technical',
            priority: 'medium',
            status: 'in_progress',
            assignedTo: 'Juan Pérez',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
          {
            id: '3',
            title: 'Solicitud de devolución de depósito',
            description:
              'Cliente solicita devolución de depósito por terminación anticipada de contrato',
            clientName: 'Pedro Silva',
            clientEmail: 'pedro@email.com',
            category: 'billing',
            priority: 'medium',
            status: 'open',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          },
          {
            id: '4',
            title: 'Problema de acceso a cuenta',
            description: 'Usuario no puede iniciar sesión, contraseña olvidada',
            clientName: 'María López',
            clientEmail: 'maria@email.com',
            category: 'account',
            priority: 'urgent',
            status: 'resolved',
            assignedTo: 'Carlos Rodríguez',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
            resolutionTime: 4,
            satisfaction: 5,
          },
          {
            id: '5',
            title: 'Error en generación de contratos',
            description: 'Los contratos no se generan correctamente en formato PDF',
            clientName: 'Roberto Díaz',
            clientEmail: 'roberto@email.com',
            category: 'technical',
            priority: 'high',
            status: 'escalated',
            assignedTo: 'Ana Soto',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
          },
        ];

        setTickets(mockTickets);

        // Calculate stats
        const openTickets = mockTickets.filter(t => t.status === 'open').length;
        const resolvedTickets = mockTickets.filter(t => t.status === 'resolved').length;
        const escalatedTickets = mockTickets.filter(t => t.status === 'escalated').length;
        const inProgressTickets = mockTickets.filter(t => t.status === 'in_progress').length;

        const ticketStats: TicketStats = {
          totalTickets: mockTickets.length,
          openTickets,
          resolvedTickets,
          pendingTickets: inProgressTickets,
          averageResolutionTime: 3.2,
          customerSatisfaction: 4.6,
          escalatedTickets,
        };

        setStats(ticketStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading ticket data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadTicketData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'closed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'escalated':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800">Abierto</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">En Progreso</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resuelto</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Cerrado</Badge>;
      case 'escalated':
        return <Badge className="bg-red-100 text-red-800">Escalado</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Media</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Baja</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'technical':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-300">
            Técnico
          </Badge>
        );
      case 'billing':
        return (
          <Badge variant="outline" className="text-green-600 border-green-300">
            Facturación
          </Badge>
        );
      case 'account':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-300">
            Cuenta
          </Badge>
        );
      case 'feature':
        return (
          <Badge variant="outline" className="text-indigo-600 border-indigo-300">
            Funcionalidad
          </Badge>
        );
      case 'bug':
        return (
          <Badge variant="outline" className="text-red-600 border-red-300">
            Bug
          </Badge>
        );
      case 'other':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-300">
            Otro
          </Badge>
        );
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-5 h-5 text-blue-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'closed':
        return <XCircle className="w-5 h-5 text-gray-600" />;
      case 'escalated':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Ticket className="w-5 h-5" />;
    }
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }

    return date.toLocaleDateString('es-CL');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tickets de soporte...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Gestión de Tickets de Soporte"
      subtitle="Administra todos los tickets de soporte del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Centro de Soporte</h1>
            <p className="text-gray-600">Gestiona y administra todos los tickets de soporte</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewTicket}>
              <Ticket className="w-4 h-4 mr-2" />
              Nuevo Ticket
            </Button>
            <Button size="sm" variant="outline" onClick={handleFilterTickets}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportTickets}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tickets Abiertos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Respuesta</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageResolutionTime}h</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Satisfacción</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.customerSatisfaction}/5</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets Recientes</CardTitle>
                <CardDescription>Todos los tickets de soporte del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <Card key={ticket.id} className={`border-l-4 ${getStatusColor(ticket.status)}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getStatusColor(ticket.status)}`}>
                              {getStatusIcon(ticket.status)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{ticket.title}</h3>
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.priority)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>

                              <div className="flex items-center gap-4 mb-2">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Users className="w-3 h-3" />
                                  <span>{ticket.clientName}</span>
                                </div>
                                {getCategoryBadge(ticket.category)}
                                {ticket.assignedTo && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <UserCheck className="w-3 h-3" />
                                    <span>{ticket.assignedTo}</span>
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>Creado: {formatRelativeTime(ticket.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Actualizado: {formatRelativeTime(ticket.updatedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTicket(ticket.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {ticket.status === 'open' && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleAssignTicket(ticket.id)}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Asignar
                              </Button>
                            )}
                            {ticket.status === 'resolved' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleCloseTicket(ticket.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Cerrar
                              </Button>
                            )}
                            {ticket.status === 'in_progress' && (
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleResolveTicket(ticket.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support Metrics & Performance */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Rendimiento</CardTitle>
                <CardDescription>Indicadores clave de soporte al cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">Tickets Resueltos</p>
                      <p className="text-xs text-green-600">Esta semana</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">{stats.resolvedTickets}</p>
                      <p className="text-xs text-green-600">+12% vs semana anterior</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Tiempo Promedio</p>
                      <p className="text-xs text-blue-600">De resolución</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">
                        {stats.averageResolutionTime}h
                      </p>
                      <p className="text-xs text-blue-600">-8% vs mes anterior</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Satisfacción</p>
                      <p className="text-xs text-purple-600">Promedio clientes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-800">
                        {stats.customerSatisfaction}/5
                      </p>
                      <p className="text-xs text-purple-600">⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-800">Tickets Escalados</p>
                      <p className="text-xs text-red-600">Requieren atención especial</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-800">{stats.escalatedTickets}</p>
                      <p className="text-xs text-red-600">Requieren revisión</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Herramientas para gestión de soporte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button size="sm" variant="outline" className="justify-start">
                    <Headphones className="w-4 h-4 mr-2" />
                    Centro de Llamadas
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Bandeja de Email
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat en Vivo
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reportes Avanzados
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Gestión de Agentes
                  </Button>
                  <Button size="sm" variant="outline" className="justify-start">
                    <Zap className="w-4 h-4 mr-2" />
                    Automatizaciones
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
