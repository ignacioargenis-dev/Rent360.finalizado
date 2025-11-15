'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Check,
  X,
  Download,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'technical' | 'billing' | 'general' | 'bug_report' | 'feature_request';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  comments: SupportTicketResponse[];
}

interface SupportTicketResponse {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export default function MaintenanceTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState<string>('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Estados para el diálogo de exportación
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    status: 'all',
    priority: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
  });

  // Formulario para crear ticket
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    priority: 'medium' as const,
    category: 'general' as const,
  });

  // Formulario para responder ticket
  const [newResponse, setNewResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.tickets) {
        setTickets(data.tickets);
      } else {
        logger.error('Error cargando tickets: respuesta inesperada', { data });
      }
    } catch (error) {
      logger.error('Error cargando tickets:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    // Validar que la descripción tenga al menos 10 caracteres
    if (!newTicket.description || newTicket.description.trim().length < 10) {
      setValidationError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    // Limpiar error de validación si pasa la validación
    setValidationError('');

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newTicket.subject,
          description: newTicket.description,
          priority: newTicket.priority,
          category: newTicket.category,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.message && response.status === 201) {
        setShowCreateDialog(false);
        setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
        loadTickets();
        logger.info('Ticket creado exitosamente');
      } else {
        const errorMessage = data.error || 'Error desconocido al crear el ticket';
        logger.error('Error creando ticket:', { error: errorMessage });
        setValidationError(errorMessage);
      }
    } catch (error) {
      logger.error('Error creando ticket:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedTicket || !newResponse.trim()) {
      return;
    }

    try {
      setSubmittingResponse(true);
      const response = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: newResponse,
          isInternal: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setNewResponse('');
        loadTickets();
        // Recargar el ticket seleccionado
        const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
        if (updatedTicket) {
          setSelectedTicket(updatedTicket);
        }
        logger.info('Respuesta enviada exitosamente');
      } else {
        logger.error('Error enviando respuesta:', { error: data.error });
      }
    } catch (error) {
      logger.error('Error enviando respuesta:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ticketId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        loadTickets();
        // Actualizar el ticket seleccionado si es el mismo
        if (selectedTicket && selectedTicket.id === ticketId) {
          setSelectedTicket(prev =>
            prev ? { ...prev, status: newStatus.toUpperCase() as any } : null
          );
        }
        logger.info(`Ticket ${newStatus} exitosamente`);
      } else {
        logger.error('Error actualizando ticket:', { error: data.error });
      }
    } catch (error) {
      logger.error('Error actualizando ticket:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleExportTickets = () => {
    logger.info('Abriendo opciones de exportación de tickets de soporte');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando tickets de soporte', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.priority !== 'all') {
        params.append('priority', exportOptions.priority);
      }
      if (exportOptions.category !== 'all') {
        params.append('category', exportOptions.category);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/tickets/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `tickets_soporte_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        priority: 'all',
        category: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de tickets completada exitosamente');
    } catch (error) {
      logger.error('Error exportando tickets:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los tickets. Por favor, intenta nuevamente.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-orange-100 text-orange-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  if (!user) {
    return (
      <UnifiedDashboardLayout
        title="Mis Tickets"
        subtitle="Gestiona tus consultas sobre mantenimiento y soporte"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">Debes iniciar sesión para acceder a tus tickets.</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mis Tickets"
      subtitle="Gestiona tus consultas sobre mantenimiento y soporte"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div></div>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Ticket</DialogTitle>
                <DialogDescription>
                  Describe tu problema o consulta y nuestro equipo de soporte te ayudará.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Asunto</Label>
                  <Input
                    id="subject"
                    placeholder="Resumen breve del problema"
                    value={newTicket.subject}
                    onChange={e => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select
                    value={newTicket.category}
                    onValueChange={(value: any) =>
                      setNewTicket(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="billing">Facturación</SelectItem>
                      <SelectItem value="bug_report">Reporte de Error</SelectItem>
                      <SelectItem value="feature_request">Solicitud de Funcionalidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={(value: any) =>
                      setNewTicket(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe detalladamente tu problema o consulta..."
                    rows={6}
                    value={newTicket.description}
                    onChange={e => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  />
                  {validationError && (
                    <p className="text-sm text-red-600 mt-1">{validationError}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateTicket}
                    disabled={!newTicket.subject.trim() || !newTicket.description.trim()}
                  >
                    Crear Ticket
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar en tickets..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="open">Abierto</SelectItem>
                    <SelectItem value="in_progress">En Progreso</SelectItem>
                    <SelectItem value="resolved">Resuelto</SelectItem>
                    <SelectItem value="closed">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridad</Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="billing">Facturación</SelectItem>
                    <SelectItem value="bug_report">Reporte de Error</SelectItem>
                    <SelectItem value="feature_request">Solicitud de Funcionalidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de tickets */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tickets</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ||
                statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                categoryFilter !== 'all'
                  ? 'No se encontraron tickets que coincidan con los filtros aplicados.'
                  : 'Aún no has creado ningún ticket de soporte.'}
              </p>
              {!searchTerm &&
                statusFilter === 'all' &&
                priorityFilter === 'all' &&
                categoryFilter === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>Crear tu primer ticket</Button>
                )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map(ticket => (
              <Card
                key={ticket.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTicket(ticket);
                  setShowTicketDialog(true);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h3 className="text-lg font-medium text-gray-900">{ticket.title}</h3>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status === 'OPEN'
                            ? 'Abierto'
                            : ticket.status === 'IN_PROGRESS'
                              ? 'En Progreso'
                              : ticket.status === 'RESOLVED'
                                ? 'Resuelto'
                                : 'Cerrado'}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority === 'URGENT'
                            ? 'Urgente'
                            : ticket.priority === 'HIGH'
                              ? 'Alta'
                              : ticket.priority === 'MEDIUM'
                                ? 'Media'
                                : 'Baja'}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>
                          Creado: {new Date(ticket.createdAt).toLocaleDateString('es-CL')}
                        </span>
                        <span>
                          Actualizado: {new Date(ticket.updatedAt).toLocaleDateString('es-CL')}
                        </span>
                        <span>Respuestas: {ticket.comments.length}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para ver ticket */}
        <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    {getStatusIcon(selectedTicket.status)}
                    {selectedTicket.title}
                  </DialogTitle>
                  <DialogDescription>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(selectedTicket.status)}>
                        {selectedTicket.status === 'OPEN'
                          ? 'Abierto'
                          : selectedTicket.status === 'IN_PROGRESS'
                            ? 'En Progreso'
                            : selectedTicket.status === 'RESOLVED'
                              ? 'Resuelto'
                              : 'Cerrado'}
                      </Badge>
                      <Badge className={getPriorityColor(selectedTicket.priority)}>
                        {selectedTicket.priority === 'URGENT'
                          ? 'Urgente'
                          : selectedTicket.priority === 'HIGH'
                            ? 'Alta'
                            : selectedTicket.priority === 'MEDIUM'
                              ? 'Media'
                              : 'Baja'}
                      </Badge>
                    </div>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Descripción del ticket */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Respuestas */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Conversación</h4>
                    <div className="space-y-4">
                      {selectedTicket.comments.map(response => (
                        <div key={response.id} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">{response.user.name}</span>
                            <span className="text-sm text-gray-500">
                              {new Date(response.createdAt).toLocaleString('es-CL')}
                            </span>
                            {response.isInternal && (
                              <Badge variant="secondary" className="text-xs">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 whitespace-pre-wrap">{response.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formulario para responder */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Responder</h4>
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Escribe tu respuesta..."
                        rows={4}
                        value={newResponse}
                        onChange={e => setNewResponse(e.target.value)}
                      />
                      <div className="flex justify-between">
                        {/* Botones de acción para soporte/admin */}
                        {['ADMIN', 'SUPPORT'].includes(user?.role || '') && (
                          <div className="flex gap-2">
                            {selectedTicket.status !== 'IN_PROGRESS' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateTicketStatus(selectedTicket.id, 'in_progress')
                                }
                                className="flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4" />
                                En Progreso
                              </Button>
                            )}
                            {selectedTicket.status !== 'RESOLVED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateTicketStatus(selectedTicket.id, 'resolved')
                                }
                                className="flex items-center gap-2 text-green-600 hover:text-green-700"
                              >
                                <Check className="h-4 w-4" />
                                Marcar Resuelto
                              </Button>
                            )}
                            {selectedTicket.status !== 'CLOSED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUpdateTicketStatus(selectedTicket.id, 'closed')
                                }
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                                Cerrar
                              </Button>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowTicketDialog(false)}>
                            Cerrar
                          </Button>
                          <Button
                            onClick={handleSubmitResponse}
                            disabled={!newResponse.trim() || submittingResponse}
                          >
                            {submittingResponse ? 'Enviando...' : 'Enviar Respuesta'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Tickets de Soporte</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtros para exportar los tickets de soporte.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions({ ...exportOptions, format: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions({ ...exportOptions, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="OPEN">Abierto</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="RESOLVED">Resuelto</SelectItem>
                    <SelectItem value="CLOSED">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-priority">Prioridad</Label>
                <Select
                  value={exportOptions.priority}
                  onValueChange={value => setExportOptions({ ...exportOptions, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="LOW">Baja</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-category">Categoría</Label>
                <Select
                  value={exportOptions.category}
                  onValueChange={value => setExportOptions({ ...exportOptions, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="technical">Técnico</SelectItem>
                    <SelectItem value="billing">Facturación</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="bug_report">Reporte de Bug</SelectItem>
                    <SelectItem value="feature_request">Solicitud de Función</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Fecha Desde</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={exportOptions.startDate}
                    onChange={e =>
                      setExportOptions({ ...exportOptions, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Fecha Hasta</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={exportOptions.endDate}
                    onChange={e => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
