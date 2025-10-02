'use client';


import React from 'react';
import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Filter,
  MoreHorizontal, 
  Eye, 
  Reply,
  ArrowRight, 
  User
} from 'lucide-react';
import { User as UserType } from '@/types';


interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  createdBy: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  lastReply?: string;
  attachments: number;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  critical: number;
}

export default function AdminTicketsPage() {

  const [user, setUser] = useState<any>(null);

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('');

  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [ticketsPerPage] = useState(10);

  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
  });

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    loadUserData();
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      // Mock tickets data for demonstration
      const mockTickets: Ticket[] = [
        {
          id: '1',
          title: 'Problema con pago de arriendo',
          description: 'El sistema no está procesando los pagos de arriendo correctamente',
          status: 'open',
          priority: 'high',
          category: 'Pagos',
          createdBy: 'Juan Pérez',
          assignedTo: 'Soporte Técnico',
          createdAt: '2024-01-15T10:30:00Z',
          updatedAt: '2024-01-15T10:30:00Z',
          lastReply: '2024-01-15T11:15:00Z',
          attachments: 2,
        },
        {
          id: '2',
          title: 'No puedo subir fotos de propiedad',
          description: 'Al intentar subir fotos de mi propiedad, el sistema muestra un error',
          status: 'in_progress',
          priority: 'medium',
          category: 'Propiedades',
          createdBy: 'María González',
          assignedTo: 'Equipo de Desarrollo',
          createdAt: '2024-01-14T15:45:00Z',
          updatedAt: '2024-01-15T09:20:00Z',
          lastReply: '2024-01-15T09:20:00Z',
          attachments: 1,
        },
        {
          id: '3',
          title: 'Solicitud de verificación de cuenta',
          description: 'Necesito que verifiquen mi cuenta de propietario',
          status: 'resolved',
          priority: 'low',
          category: 'Cuenta',
          createdBy: 'Carlos Rodríguez',
          assignedTo: 'Administración',
          createdAt: '2024-01-13T08:20:00Z',
          updatedAt: '2024-01-14T16:30:00Z',
          lastReply: '2024-01-14T16:30:00Z',
          attachments: 0,
        },
        {
          id: '4',
          title: 'Error crítico en el sistema',
          description: 'El sistema se cae cuando intento generar un contrato',
          status: 'open',
          priority: 'critical',
          category: 'Sistema',
          createdBy: 'Ana Martínez',
          assignedTo: 'Soporte Crítico',
          createdAt: '2024-01-15T14:10:00Z',
          updatedAt: '2024-01-15T14:10:00Z',
          attachments: 3,
        },
        {
          id: '5',
          title: 'Consulta sobre comisiones',
          description: 'Tengo una duda sobre cómo se calculan las comisiones',
          status: 'closed',
          priority: 'low',
          category: 'Facturación',
          createdBy: 'Luis Silva',
          assignedTo: 'Ventas',
          createdAt: '2024-01-12T11:30:00Z',
          updatedAt: '2024-01-13T10:15:00Z',
          lastReply: '2024-01-13T10:15:00Z',
          attachments: 0,
        },
      ];

      setTickets(mockTickets);
      
      // Calculate stats
      const ticketStats: TicketStats = {
        total: mockTickets.length,
        open: mockTickets.filter(t => t.status === 'open').length,
        inProgress: mockTickets.filter(t => t.status === 'in_progress').length,
        resolved: mockTickets.filter(t => t.status === 'resolved').length,
        closed: mockTickets.filter(t => t.status === 'closed').length,
        critical: mockTickets.filter(t => t.priority === 'critical').length,
      };
      
      setStats(ticketStats);
    } catch (error) {
      logger.error('Error fetching tickets:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.createdBy.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Abierto', className: 'bg-red-100 text-red-800' },
      in_progress: { label: 'En Progreso', className: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resuelto', className: 'bg-blue-100 text-blue-800' },
      closed: { label: 'Cerrado', className: 'bg-green-100 text-green-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
      { label: status, className: 'bg-gray-100 text-gray-800' };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', className: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', className: 'bg-blue-100 text-blue-800' },
      high: { label: 'Alta', className: 'bg-orange-100 text-orange-800' },
      critical: { label: 'Crítica', className: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || 
      { label: priority, className: 'bg-gray-100 text-gray-800' };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setTickets(tickets.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: newStatus as any, updatedAt: new Date().toISOString() }
          : ticket,
      ));
    } catch (error) {
      logger.error('Error updating ticket status:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deleteTicket = async (ticketId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este ticket? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setTickets(tickets.filter(ticket => ticket.id !== ticketId));
    } catch (error) {
      logger.error('Error deleting ticket:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  // Pagination
  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tickets...</p>
        </div>
      </div>
    );
  }

  return (
        <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <div className="w-64 bg-white shadow-lg">
          <div className="p-4">
            <h2 className="text-lg font-semibold">Rent360 Admin</h2>
          </div>
        </div>
        <div className="flex-1">
          <div className="p-6">
      
      title="Gestión de Tickets"
      subtitle="Administra todos los tickets de soporte del sistema"
      notificationCount={stats.open}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Tickets</h1>
                <p className="text-gray-600">Administra todos los tickets de soporte de la plataforma</p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ticket
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Abiertos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.open}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resueltos</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Críticos</p>
                    <p className="text-2xl font-bold text-red-800">{stats.critical}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-800" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar tickets..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="Pagos">Pagos</SelectItem>
                    <SelectItem value="Propiedades">Propiedades</SelectItem>
                    <SelectItem value="Cuenta">Cuenta</SelectItem>
                    <SelectItem value="Sistema">Sistema</SelectItem>
                    <SelectItem value="Facturación">Facturación</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                    setPriorityFilter('');
                    setCategoryFilter('');
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Limpiar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Lista de Tickets</span>
                <span className="text-sm text-gray-500">
                  Mostrando {currentTickets.length} de {filteredTickets.length} tickets
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Creador</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Categoría</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Prioridad</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Última Actividad</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{ticket.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {ticket.description}
                            </div>
                            {ticket.attachments > 0 && (
                              <div className="text-xs text-gray-400 mt-1">
                                {ticket.attachments} archivo(s) adjunto(s)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                {ticket.createdBy.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-sm">{ticket.createdBy}</div>
                              <div className="text-xs text-gray-500">
                                {formatDate(ticket.createdAt)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{ticket.category}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          {getPriorityBadge(ticket.priority)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(ticket.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {ticket.lastReply ? formatRelativeTime(ticket.lastReply) : formatRelativeTime(ticket.createdAt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Reply className="w-4 h-4" />
                            </Button>
                            <Select onValueChange={(value) => updateTicketStatus(ticket.id, value)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Estado" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Abierto</SelectItem>
                                <SelectItem value="in_progress">En Progreso</SelectItem>
                                <SelectItem value="resolved">Resuelto</SelectItem>
                                <SelectItem value="closed">Cerrado</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteTicket(ticket.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredTickets.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron tickets</h3>
                  <p className="text-gray-600">
                    No hay tickets que coincidan con tus criterios de búsqueda
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <div className="text-sm text-gray-700">
                    Mostrando página {currentPage} de {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout
  );
}




