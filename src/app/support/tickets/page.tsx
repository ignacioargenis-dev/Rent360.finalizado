'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Info,
  Plus,
  Filter,
  RefreshCw,
  Download,
  BarChart3,
  Settings,
  Search,
  Eye,
  Edit,
  MessageSquare,
  User,
  Calendar,
  Tag,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import DashboardLayout from '@/components/layout/DashboardLayout';

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

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  escalated: number;
}

export default function TicketsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    escalated: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demo - in production this would come from API
      const mockTickets: Ticket[] = [
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
          status: 'OPEN',
          createdAt: '2024-03-14 16:20',
          updatedAt: '2024-03-14 16:20',
        },
        {
          id: '4',
          title: 'Problema de acceso a propiedad',
          description: 'Inquilino reporta que no puede acceder a la propiedad arrendada',
          clientName: 'María López',
          clientEmail: 'maria@ejemplo.com',
          category: 'Propiedades',
          priority: 'CRITICAL',
          status: 'ESCALATED',
          assignedTo: 'Soporte Senior',
          createdAt: '2024-03-14 14:10',
          updatedAt: '2024-03-14 15:45',
        },
        {
          id: '5',
          title: 'Actualización de información de contacto',
          description: 'Cliente necesita actualizar su información de contacto',
          clientName: 'Roberto Díaz',
          clientEmail: 'roberto@ejemplo.com',
          category: 'Cuenta',
          priority: 'LOW',
          status: 'RESOLVED',
          assignedTo: 'Ana Martínez',
          createdAt: '2024-03-13 11:20',
          updatedAt: '2024-03-13 12:15',
        },
      ];

      // Filter tickets based on search and filters
      let filteredTickets = mockTickets;

      if (searchTerm) {
        filteredTickets = filteredTickets.filter(
          ticket =>
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (statusFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.status === statusFilter);
      }

      if (priorityFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === priorityFilter);
      }

      if (categoryFilter !== 'all') {
        filteredTickets = filteredTickets.filter(ticket => ticket.category === categoryFilter);
      }

      setTickets(filteredTickets);

      // Calculate stats
      const newStats: TicketStats = {
        total: mockTickets.length,
        open: mockTickets.filter(t => t.status === 'OPEN').length,
        inProgress: mockTickets.filter(t => t.status === 'IN_PROGRESS').length,
        resolved: mockTickets.filter(t => t.status === 'RESOLVED').length,
        closed: mockTickets.filter(t => t.status === 'CLOSED').length,
        escalated: mockTickets.filter(t => t.status === 'ESCALATED').length,
      };

      setStats(newStats);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.error('Error loading tickets:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  // Funciones handle para los botones
  const handleNewTicket = () => {
    // Navigate to new ticket creation page
    window.open('/support/tickets/new', '_blank');
  };

  const handleViewTicket = (ticketId: string) => {
    // Navigate to ticket detail view
    window.open(`/support/tickets/${ticketId}`, '_blank');
  };

  const handleUpdateStatus = (ticketId: string, newStatus: string) => {
    // Update ticket status
    alert(`Estado del ticket ${ticketId} actualizado a: ${newStatus}`);
  };

  const handleAssignTicket = (ticketId: string) => {
    // Assign ticket to support agent
    const agent = prompt('Asignar ticket a:', 'soporte@rent360.cl');
    if (agent) {
      alert(`Ticket asignado exitosamente a: ${agent}`);
    }
  };

  const handleExportTickets = () => {
    // Export tickets data to CSV
    if (tickets.length === 0) {
      alert('No hay tickets para exportar');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Título,Cliente,Email,Categoría,Prioridad,Estado,Asignado,Creado,Actualizado\n' +
      tickets
        .map(
          ticket =>
            `${ticket.id},"${ticket.title}","${ticket.clientName}","${ticket.clientEmail}","${ticket.category}","${ticket.priority}","${ticket.status}","${ticket.assignedTo || 'Sin asignar'}","${ticket.createdAt}","${ticket.updatedAt}"`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tickets_soporte_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  if (loading) {
    return (
      <DashboardLayout title="Tickets" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tickets...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Tickets" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadTickets}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Tickets de Soporte"
      subtitle="Gestiona y visualiza todos los tickets del sistema"
    >
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Tickets registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abiertos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Siendo atendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Solucionados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Escalados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.escalated}</div>
              <p className="text-xs text-muted-foreground">Requieren atención especial</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cerrados</CardTitle>
              <Building className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
              <p className="text-xs text-muted-foreground">Archivados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra los tickets por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por título, descripción o cliente..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Todos los estados</option>
                <option value="OPEN">Abierto</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="RESOLVED">Resuelto</option>
                <option value="CLOSED">Cerrado</option>
                <option value="ESCALATED">Escalado</option>
              </select>

              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Todas las prioridades</option>
                <option value="CRITICAL">Crítico</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Media</option>
                <option value="LOW">Baja</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Todas las categorías</option>
                <option value="Pagos">Pagos</option>
                <option value="Sistema">Sistema</option>
                <option value="Contratos">Contratos</option>
                <option value="Propiedades">Propiedades</option>
                <option value="Cuenta">Cuenta</option>
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleNewTicket}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ticket
              </Button>
              <Button
                onClick={() => (window.location.href = '/support/tickets/board')}
                variant="outline"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Vista Tablero
              </Button>
              <Button onClick={loadTickets} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button onClick={handleExportTickets} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de tickets */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Tickets ({tickets.length})</CardTitle>
                <CardDescription>Lista de tickets filtrados según tus criterios</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Link href="/support/tickets/new">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Ticket
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron tickets
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No hay tickets que coincidan con los criterios de búsqueda.
                    </p>
                    <Button onClick={clearFilters}>Limpiar Filtros</Button>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{ticket.title}</h3>
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>

                          <p className="text-gray-600 mb-3">{ticket.description}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>
                                {ticket.clientName} ({ticket.clientEmail})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Tag className="w-4 h-4" />
                              <span>{ticket.category}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Creado: {formatDateTime(ticket.createdAt)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <User className="w-4 h-4" />
                              <span>Asignado: {ticket.assignedTo || 'Sin asignar'}</span>
                            </div>
                          </div>

                          {ticket.estimatedResolution && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-700">
                              <span className="font-medium">Resolución estimada:</span>{' '}
                              {formatDateTime(ticket.estimatedResolution)}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTicket(ticket.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Responder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssignTicket(ticket.id)}
                          >
                            <User className="w-4 h-4 mr-1" />
                            Asignar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolver
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Nuevo Ticket</h3>
                <p className="text-sm text-gray-600 mb-4">Crear un ticket manualmente</p>
                <Link href="/support/tickets/new">
                  <Button className="w-full">Crear Ticket</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
                <p className="text-sm text-gray-600 mb-4">Ver estadísticas y métricas</p>
                <Link href="/support/reports">
                  <Button variant="outline" className="w-full">
                    Ver Reportes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Configuración</h3>
                <p className="text-sm text-gray-600 mb-4">Ajustes del sistema de soporte</p>
                <Link href="/support/settings">
                  <Button variant="outline" className="w-full">
                    Configurar
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Exportar</h3>
                <p className="text-sm text-gray-600 mb-4">Descargar datos de tickets</p>
                <Button variant="outline" className="w-full">
                  Exportar Datos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
