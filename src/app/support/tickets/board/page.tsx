'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  ArrowLeft,
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

export default function SupportTicketsBoardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Mock support tickets data - filtered for support role
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
            assignedTo: 'Soporte Rent360',
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
            assignedTo: 'Soporte Rent360',
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
            assignedTo: 'Soporte Rent360',
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
            assignedTo: 'Soporte Rent360',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
          },
        ];

        setTickets(mockTickets);
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
        return 'border-l-blue-500 bg-blue-50';
      case 'in_progress':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'resolved':
        return 'border-l-green-500 bg-green-50';
      case 'closed':
        return 'border-l-gray-500 bg-gray-50';
      case 'escalated':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
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
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'closed':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Ticket className="w-4 h-4" />;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }

    return date.toLocaleDateString('es-CL');
  };

  const getTicketsByStatus = (status: string) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const handleViewTicket = (ticketId: string) => {
    router.push(`/support/tickets/${ticketId}`);
  };

  const handleNewTicket = () => {
    router.push('/support/tickets/new');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tablero de tickets...</p>
        </div>
      </div>
    );
  }

  const columns = [
    { status: 'open', title: 'Abiertos', color: 'border-blue-500' },
    { status: 'in_progress', title: 'En Progreso', color: 'border-yellow-500' },
    { status: 'escalated', title: 'Escalados', color: 'border-red-500' },
    { status: 'resolved', title: 'Resueltos', color: 'border-green-500' },
    { status: 'closed', title: 'Cerrados', color: 'border-gray-500' },
  ];

  return (
    <UnifiedDashboardLayout
      title="Tablero de Tickets"
      subtitle="Vista Kanban de tickets de soporte"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/support/tickets')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Lista
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Tablero de Soporte</h1>
              <p className="text-gray-600">Gestiona tickets en vista Kanban</p>
            </div>
          </div>
          <Button onClick={handleNewTicket} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Ticket
          </Button>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 min-h-[600px]">
          {columns.map(column => (
            <div key={column.status} className="flex flex-col">
              <Card className="flex flex-col h-full">
                <CardHeader className={`pb-3 border-l-4 ${column.color}`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      {getStatusIcon(column.status)}
                      <span className="truncate">{column.title}</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {getTicketsByStatus(column.status).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-3 pt-0 max-h-[500px]">
                  <div className="space-y-2">
                    {getTicketsByStatus(column.status).map(ticket => (
                      <Card
                        key={ticket.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getStatusColor(ticket.status)}`}
                        onClick={() => handleViewTicket(ticket.id)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div>
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                {ticket.title}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2 break-words">
                                {ticket.description}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {getPriorityBadge(ticket.priority)}
                              {getCategoryBadge(ticket.category)}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="w-3 h-3 shrink-0" />
                                <span className="truncate">{ticket.clientName}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  {formatRelativeTime(ticket.createdAt)}
                                </span>
                              </div>
                              {ticket.resolutionTime && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle className="w-3 h-3 shrink-0" />
                                  <span className="truncate">
                                    {ticket.resolutionTime}h resolución
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {getTicketsByStatus(column.status).length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay tickets</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
