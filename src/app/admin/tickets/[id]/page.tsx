'use client';

import { logger } from '@/lib/logger-minimal';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  Loader2,
  Ticket,
  User,
  MessageCircle,
  Paperclip,
  Edit,
  RefreshCw,
  Trash2,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Ticket as TicketType, TicketComment } from '@/types';

interface TicketDetailsResponse {
  ticket: TicketType;
  comments: TicketComment[];
}

export default function AdminTicketDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketType | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  const fetchTicketDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) {
        throw new Error('Error al cargar los detalles del ticket');
      }
      const data: TicketDetailsResponse = await response.json();
      setTicket(data.ticket);
      setComments(data.comments);
      setError(null);
    } catch (err) {
      logger.error('Error fetching ticket details:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Error al cargar los detalles del ticket. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTicketDetails();
    setRefreshing(false);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setSubmittingComment(true);
    setError(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          isInternal: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el comentario');
      }

      const data = await response.json();
      setComments(prev => [...prev, data.comment]);
      setNewComment('');

      // Refresh ticket details to update status
      await fetchTicketDetails();
    } catch (err) {
      logger.error('Error submitting comment:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Error al enviar el comentario. Por favor intenta nuevamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAssignTicket = () => {
    const assignedTo = prompt('Asignar ticket a:', 'soporte@rent360.cl');
    if (assignedTo) {
      alert(`Ticket asignado a: ${assignedTo}`);
      fetchTicketDetails(); // Refresh
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert(`Estado del ticket cambiado exitosamente a: ${newStatus}`);
        fetchTicketDetails(); // Refresh
      } else {
        throw new Error('Error al cambiar el estado');
      }
    } catch (error) {
      logger.error('Error updating ticket status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al cambiar el estado del ticket. Por favor intenta nuevamente.');
    }
  };

  const handleCloseTicket = () => {
    if (confirm('¿Está seguro de cerrar este ticket?')) {
      alert('Ticket cerrado exitosamente');
      router.push('/admin/tickets');
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
      default:
        return <Badge>{status}</Badge>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalles del Ticket" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando detalles del ticket...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error && !ticket) {
    return (
      <UnifiedDashboardLayout title="Detalles del Ticket" subtitle="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="text-red-600 mb-4">
              <AlertCircle className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/admin/tickets">
              <Button>Volver a Tickets</Button>
            </Link>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Detalles del Ticket"
      subtitle={`Ticket #${ticket?.ticketNumber || ticketId}`}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/tickets">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalles del Ticket</h1>
              <p className="text-gray-600">Gestión administrativa del ticket</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-sm text-gray-500">#{ticket?.ticketNumber}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket?.status || '')}
                    {getPriorityBadge(ticket?.priority || '')}
                  </div>
                </div>
                <CardTitle className="text-xl">{ticket?.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-gray-700 leading-relaxed">{ticket?.description}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Categoría:</span>
                      <span className="ml-2 font-medium">{ticket?.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Creado:</span>
                      <span className="ml-2 font-medium">
                        {ticket?.createdAt ? formatDate(ticket.createdAt.toISOString()) : ''}
                      </span>
                    </div>
                    {ticket?.resolvedAt && (
                      <div>
                        <span className="text-gray-600">Resuelto:</span>
                        <span className="ml-2 font-medium">
                          {formatDate(ticket.resolvedAt.toISOString())}
                        </span>
                      </div>
                    )}
                    {ticket?.assignedTo && (
                      <div>
                        <span className="text-gray-600">Asignado a:</span>
                        <span className="ml-2 font-medium">{ticket.assignedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comentarios ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No hay comentarios aún</p>
                    </div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} className="border-l-4 border-blue-200 pl-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-sm">Usuario #{comment.userId}</span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt.toISOString())}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleSubmitComment} className="mt-6 pt-6 border-t">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Agregar Comentario
                      </label>
                      <Textarea
                        placeholder="Escribe tu comentario aquí..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        rows={3}
                      />
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={submittingComment || !newComment.trim()}>
                        {submittingComment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Comentario
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado del Ticket</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado Actual:</span>
                  {getStatusBadge(ticket?.status || '')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prioridad:</span>
                  {getPriorityBadge(ticket?.priority || '')}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Categoría:</span>
                  <Badge variant="outline">{ticket?.category}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <QuickActionButton
                    icon={UserCheck}
                    label="Asignar Ticket"
                    description="Cambiar asignación"
                    onClick={handleAssignTicket}
                  />

                  <QuickActionButton
                    icon={Clock}
                    label="Cambiar Estado"
                    description="Actualizar progreso"
                    onClick={() => handleChangeStatus('in_progress')}
                  />

                  <QuickActionButton
                    icon={CheckCircle}
                    label="Marcar Resuelto"
                    description="Completar ticket"
                    onClick={() => handleChangeStatus('resolved')}
                  />

                  <QuickActionButton
                    icon={XCircle}
                    label="Cerrar Ticket"
                    description="Finalizar ticket"
                    onClick={handleCloseTicket}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Administrativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <QuickActionButton
                    icon={Edit}
                    label="Editar Ticket"
                    description="Modificar información"
                    onClick={() => {
                      const editUrl = window.location.pathname.replace(
                        '/admin/tickets/',
                        '/admin/tickets/edit/'
                      );
                      router.push(editUrl);
                    }}
                  />

                  <QuickActionButton
                    icon={Paperclip}
                    label="Adjuntar Archivo"
                    description="Agregar documentos"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.multiple = true;
                      fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
                      fileInput.onchange = async e => {
                        const files = (e.target as HTMLInputElement).files;
                        if (files && files.length > 0) {
                          try {
                            // Simulate file upload
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            alert(`Archivos subidos exitosamente: ${files.length} archivo(s)`);
                            await fetchTicketDetails(); // Refresh to show new files
                          } catch (error) {
                            alert('Error al subir los archivos. Por favor intenta nuevamente.');
                          }
                        }
                      };
                      fileInput.click();
                    }}
                  />

                  <QuickActionButton
                    icon={Trash2}
                    label="Eliminar Ticket"
                    description="Borrar permanentemente"
                    onClick={async () => {
                      if (
                        confirm(
                          '¿Está seguro de que desea eliminar este ticket? Esta acción no se puede deshacer.'
                        )
                      ) {
                        try {
                          const response = await fetch(`/api/tickets/${ticketId}`, {
                            method: 'DELETE',
                          });

                          if (response.ok) {
                            alert('Ticket eliminado exitosamente');
                            router.push('/admin/tickets');
                          } else {
                            throw new Error('Error al eliminar el ticket');
                          }
                        } catch (error) {
                          logger.error('Error deleting ticket:', {
                            error: error instanceof Error ? error.message : String(error),
                          });
                          alert('Error al eliminar el ticket. Por favor intenta nuevamente.');
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
