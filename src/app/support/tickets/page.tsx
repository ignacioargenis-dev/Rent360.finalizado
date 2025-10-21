'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
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
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Filter, Search } from 'lucide-react';
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

export default function SupportTicketsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      const response = await fetch('/api/support/tickets', {
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
      if (data.success) {
        setTickets(data.data || []);
      } else {
        logger.error('Error cargando tickets:', { error: data.error });
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
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newTicket),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setShowCreateDialog(false);
        setNewTicket({ subject: '', description: '', priority: 'medium', category: 'general' });
        loadTickets();
        logger.info('Ticket creado exitosamente');
      } else {
        logger.error('Error creando ticket:', { error: data.error });
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
      const response = await fetch(`/api/support/tickets/${selectedTicket.id}/responses`, {
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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600">
            Debes iniciar sesión para acceder a los tickets de soporte.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets de Soporte</h1>
          <p className="text-gray-600 mt-2">Gestiona tus solicitudes de ayuda y soporte técnico</p>
        </div>

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
                      <span>Creado: {new Date(ticket.createdAt).toLocaleDateString('es-CL')}</span>
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
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedTicket.description}</p>
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
                    <div className="flex justify-end gap-2">
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
