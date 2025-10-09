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
  AlertCircle,
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

import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

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

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadTickets();
  }, [statusFilter, priorityFilter, categoryFilter, searchTerm]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener datos reales de la API
      try {
        const params = new URLSearchParams();
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (priorityFilter !== 'all') params.append('priority', priorityFilter);
        if (categoryFilter !== 'all') params.append('category', categoryFilter);
        if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`/api/tickets?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setTickets(data.data.tickets || []);
            setStats(data.data.stats || {
              total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, escalated: 0
            });
            return;
          }
        }
      } catch (apiError) {
        console.warn('API no disponible, usando datos simulados:', apiError);
      }

      // Usar datos simulados si la API no está disponible
      const mockTickets: Ticket[] = generateMockTickets();

      // Filter tickets based on search and filters
      let filteredTickets = mockTickets;

      if (searchTerm) {
        filteredTickets = filteredTickets.filter(
          ticket =>
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.clientEmail.toLowerCase().includes(searchTerm.toLowerCase())
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
      await new Promise(resolve => setTimeout(resolve, 800));
    } catch (error) {
      logger.error('Error loading tickets:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  const generateMockTickets = (): Ticket[] => {
    const categories = ['Pagos', 'Sistema', 'Contratos', 'Propiedades', 'Cuenta', 'Mantenimiento', 'Legal', 'General'];
    const statuses: Ticket['status'][] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'];
    const priorities: Ticket['priority'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const agents = ['María González', 'Juan Pérez', 'Ana Martínez', 'Carlos Rodríguez', 'Soporte Senior', 'Luis Torres'];

    const tickets: Ticket[] = [];

    for (let i = 0; i < 85; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)] || 'GENERAL';
      const status = statuses[Math.floor(Math.random() * statuses.length)] || 'OPEN';
      const priority = priorities[Math.floor(Math.random() * priorities.length)] || 'MEDIUM';
      const assignedTo = Math.random() > 0.2 ? agents[Math.floor(Math.random() * agents.length)] : undefined;

      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30));

      const updatedDate = new Date(createdDate);
      updatedDate.setHours(updatedDate.getHours() + Math.floor(Math.random() * 48) + 1);

      const estimatedResolution = status !== 'RESOLVED' && status !== 'CLOSED'
        ? new Date(updatedDate.getTime() + Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000)
        : undefined;

      const ticketData: Ticket = {
        id: String(i + 1),
        title: generateTicketTitle(category),
        description: generateTicketDescription(category),
        clientName: `Cliente ${i + 1}`,
        clientEmail: `cliente${i + 1}@ejemplo.com`,
        category,
        priority,
        status,
        createdAt: createdDate.toISOString(),
        updatedAt: updatedDate.toISOString(),
      };

      if (assignedTo) {
        ticketData.assignedTo = assignedTo;
      }

      if (estimatedResolution) {
        ticketData.estimatedResolution = estimatedResolution.toISOString();
      }

      tickets.push(ticketData);
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const generateTicketTitle = (category: string): string => {
    const titles: Record<string, string[]> = {
      'Pagos': ['Problema con pago en línea', 'Error en transacción', 'Pago no procesado', 'Reembolso pendiente', 'Problema con tarjeta'],
      'Sistema': ['Error en sistema de calificaciones', 'No puedo acceder a mi cuenta', 'Aplicación se congela', 'Error al cargar página', 'Notificaciones no llegan'],
      'Contratos': ['Solicitud de devolución de depósito', 'Modificación de contrato', 'Problema con firma digital', 'Acuerdo de terminación', 'Actualización de términos'],
      'Propiedades': ['Problema de acceso a propiedad', 'Daños reportados', 'Llaves perdidas', 'Inspección requerida', 'Mantenimiento urgente'],
      'Cuenta': ['Actualización de información de contacto', 'Cambio de contraseña', 'Verificación de identidad', 'Perfil incompleto', 'Preferencias no guardan'],
      'Mantenimiento': ['Reparación de grifería', 'Problema eléctrico', 'Puerta atascada', 'Calefacción no funciona', 'Filtración de agua'],
      'Legal': ['Disputa contractual', 'Problemas legales', 'Reclamo formal', 'Mediación requerida', 'Consulta legal'],
      'General': ['Consulta general', 'Sugerencia de mejora', 'Pregunta frecuente', 'Comentarios', 'Soporte adicional']
    };

    const categoryTitles = titles[category] || titles['General'] || ['Consulta general'];
    return categoryTitles[Math.floor(Math.random() * categoryTitles.length)] || 'Consulta general';
  };

  const generateTicketDescription = (category: string): string => {
    const descriptions: Record<string, string[]> = {
      'Pagos': ['El cliente no puede realizar el pago de su arriendo mensual', 'La transacción fue rechazada por el banco', 'El sistema muestra error al procesar el pago', 'Necesito recuperar un pago fallido', 'La tarjeta fue rechazada sin motivo aparente'],
      'Sistema': ['No puedo calificar a mi inquilino después del contrato', 'La aplicación se cierra inesperadamente', 'Los cambios no se guardan correctamente', 'No recibo las notificaciones por email', 'El sitio web carga muy lentamente'],
      'Contratos': ['Cliente solicita devolución de depósito por terminación de contrato', 'Necesito modificar las condiciones del contrato actual', 'La firma digital no se está procesando correctamente', 'Solicito acuerdo mutuo para terminación anticipada', 'Los términos del contrato necesitan actualización'],
      'Propiedades': ['Inquilino reporta que no puede acceder a la propiedad arrendada', 'Se detectaron daños que no estaban en el inventario inicial', 'Las llaves de repuesto se perdieron y necesito duplicados', 'Se requiere inspección urgente por daños en el techo', 'La propiedad necesita mantenimiento inmediato'],
      'Cuenta': ['Cliente necesita actualizar su información de contacto', 'No puedo cambiar mi contraseña por problemas técnicos', 'El proceso de verificación de identidad falló', 'Mi perfil muestra información incorrecta', 'Las preferencias de notificación no se guardan'],
      'Mantenimiento': ['La grifería del baño principal está goteando constantemente', 'Los interruptores eléctricos no funcionan correctamente', 'La puerta principal se atasca y no cierra bien', 'El sistema de calefacción no enciende en las mañanas', 'Hay una filtración de agua en el techo del living'],
      'Legal': ['Hay una disputa contractual que requiere resolución legal', 'Necesito asistencia legal para un problema contractual', 'El inquilino presentó un reclamo formal por daños', 'Se requiere mediación para resolver diferencias', 'Consulta legal sobre términos contractuales'],
      'General': ['Tengo una consulta general sobre el funcionamiento de la plataforma', 'Quisiera sugerir una mejora en la interfaz de usuario', 'Tengo una pregunta frecuente sobre los servicios', 'Me gustaría dejar un comentario sobre la atención', 'Necesito soporte adicional para entender una funcionalidad']
    };

    const categoryDescriptions = descriptions[category] || descriptions['General'] || ['Consulta general del usuario'];
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)] || 'Consulta general del usuario';
  };

  // Funciones handle para los botones
  const handleNewTicket = () => {
    // Navigate to new ticket creation page
    window.location.href = '/support/tickets/new';
  };

  const handleViewTicket = (ticketId: string) => {
    // Navigate to ticket detail view
    window.location.href = `/support/tickets/${ticketId}`;
  };

  const handleUpdateStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      // Update local state first for immediate UI feedback
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
        )
      );

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        [newStatus.toLowerCase()]: prevStats[newStatus.toLowerCase() as keyof TicketStats] as number + 1,
        [tickets.find(t => t.id === ticketId)?.status?.toLowerCase() || 'total']: (prevStats[tickets.find(t => t.id === ticketId)?.status?.toLowerCase() as keyof TicketStats] as number) - 1
      }));

      // Try to update via API
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          setSuccessMessage(`Estado del ticket ${ticketId} actualizado a: ${newStatus}`);
        } else {
          throw new Error('Error en la API');
        }
      } catch (apiError) {
        console.warn('API no disponible, cambio aplicado localmente:', apiError);
        setSuccessMessage(`Estado del ticket ${ticketId} actualizado localmente a: ${newStatus}`);
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al actualizar el estado del ticket');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    const agents = ['María González', 'Juan Pérez', 'Ana Martínez', 'Carlos Rodríguez', 'Soporte Senior', 'Luis Torres'];
    const currentAgent = tickets.find(t => t.id === ticketId)?.assignedTo;

    // Create a simple dropdown selection
    const agentOptions = agents.map((agent, index) =>
      `${index + 1}. ${agent}${currentAgent === agent ? ' (actual)' : ''}`
    ).join('\n');

    const selection = prompt(
      `Seleccionar agente para asignar el ticket:\n\n${agentOptions}\n\nIngrese el número (1-${agents.length}):`
    );

    if (selection) {
      const agentIndex = parseInt(selection) - 1;
      if (agentIndex >= 0 && agentIndex < agents.length) {
        const selectedAgent = agents[agentIndex];

        try {
          // Update local state first
          setTickets(prevTickets =>
            prevTickets.map(ticket => {
              if (ticket.id === ticketId) {
                const updatedTicket = { ...ticket };
                if (selectedAgent) {
                  updatedTicket.assignedTo = selectedAgent;
                } else {
                  delete updatedTicket.assignedTo;
                }
                return updatedTicket;
              }
              return ticket;
            })
          );

          // Try to update via API
          try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ assignedTo: selectedAgent })
            });

            if (response.ok) {
              setSuccessMessage(`Ticket asignado exitosamente a: ${selectedAgent}`);
            } else {
              throw new Error('Error en la API');
            }
          } catch (apiError) {
            console.warn('API no disponible, cambio aplicado localmente:', apiError);
            setSuccessMessage(`Ticket asignado localmente a: ${selectedAgent}`);
          }

          setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
          setErrorMessage('Error al asignar el ticket');
          setTimeout(() => setErrorMessage(''), 5000);
        }
      } else {
        setErrorMessage('Selección inválida');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    }
  };

  const handleExportTickets = () => {
    // Export tickets data to CSV
    if (tickets.length === 0) {
      setErrorMessage('No hay tickets para exportar');
      setTimeout(() => setErrorMessage(''), 5000);
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
      <UnifiedDashboardLayout title="Tickets" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tickets...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Tickets" subtitle="Error al cargar la página">
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
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Tickets de Soporte"
      subtitle="Gestiona y visualiza todos los tickets del sistema"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Legal">Legal</option>
                <option value="General">General</option>
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

        {/* Tabs para diferentes vistas */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Lista de Tickets</TabsTrigger>
            <TabsTrigger value="board">Vista Tablero</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          {/* Vista de Lista */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Tickets ({tickets.length})</CardTitle>
                    <CardDescription>Lista de tickets filtrados según tus criterios</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportTickets}>
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
          </TabsContent>

          {/* Vista de Tablero Kanban */}
          <TabsContent value="board" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Columna ABIERTOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Abiertos ({tickets.filter(t => t.status === 'OPEN').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {tickets.filter(t => t.status === 'OPEN').slice(0, 10).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg border mb-2 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-sm mb-1 truncate">{ticket.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ticket.clientName}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Columna EN PROGRESO */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    En Progreso ({tickets.filter(t => t.status === 'IN_PROGRESS').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {tickets.filter(t => t.status === 'IN_PROGRESS').slice(0, 10).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg border mb-2 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-sm mb-1 truncate">{ticket.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ticket.clientName}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Columna RESUELTOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    Resueltos ({tickets.filter(t => t.status === 'RESOLVED').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {tickets.filter(t => t.status === 'RESOLVED').slice(0, 10).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg border mb-2 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-sm mb-1 truncate">{ticket.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ticket.clientName}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Columna ESCALADOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Escalados ({tickets.filter(t => t.status === 'ESCALATED').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {tickets.filter(t => t.status === 'ESCALATED').slice(0, 10).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg border mb-2 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-sm mb-1 truncate">{ticket.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ticket.clientName}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Columna CERRADOS */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    Cerrados ({tickets.filter(t => t.status === 'CLOSED').length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ScrollArea className="h-[400px]">
                    {tickets.filter(t => t.status === 'CLOSED').slice(0, 10).map(ticket => (
                      <div key={ticket.id} className="p-3 bg-gray-50 rounded-lg border mb-2 hover:shadow-sm transition-shadow">
                        <h4 className="font-medium text-sm mb-1 truncate">{ticket.title}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{ticket.clientName}</span>
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vista de Análisis */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Tasa de Resolución */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tasa de Resolución</CardTitle>
                  <CardDescription>Eficiencia del equipo de soporte</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats.total > 0 ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100) : 0}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {stats.resolved + stats.closed} de {stats.total} tickets resueltos
                  </p>
                </CardContent>
              </Card>

              {/* Tiempo Promedio de Respuesta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiempo Promedio</CardTitle>
                  <CardDescription>Respuesta inicial</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(tickets.reduce((sum, t) => {
                      const created = new Date(t.createdAt);
                      const updated = new Date(t.updatedAt);
                      return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
                    }, 0) / Math.max(tickets.length, 1))}h
                  </div>
                  <p className="text-sm text-gray-600">
                    Tiempo promedio de primera respuesta
                  </p>
                </CardContent>
              </Card>

              {/* Tickets por Categoría */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categorías Más Comunes</CardTitle>
                  <CardDescription>Distribución por tipo de problema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(
                      tickets.reduce((acc, ticket) => {
                        acc[ticket.category] = (acc[ticket.category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([category, count]) => (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm">{category}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Tendencias */}
            <Card>
              <CardHeader>
                <CardTitle>Tendencias de los Últimos 7 Días</CardTitle>
                <CardDescription>Volumen de tickets por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const dayTickets = tickets.filter(t => {
                      const ticketDate = new Date(t.createdAt);
                      return ticketDate.toDateString() === date.toDateString();
                    });

                    return (
                      <div key={i} className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {dayTickets.length}
                        </div>
                        <div className="text-xs text-gray-600">
                          {date.toLocaleDateString('es-CL', { weekday: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

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
    </UnifiedDashboardLayout>
  );
}
