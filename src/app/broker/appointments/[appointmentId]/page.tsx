'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Edit,
  CheckCircle,
  XCircle,
  MessageCircle,
  Send,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  propertyTitle: string;
  propertyAddress: string;
  dateTime: string;
  type: 'viewing' | 'meeting' | 'valuation' | 'negotiation';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  userName: string;
  isInternal: boolean;
}

export default function AppointmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.appointmentId as string;

  const [user, setUser] = useState<UserType | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [comments, setComments] = useState<AppointmentComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
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
  }, []);

  const loadAppointmentDetails = useCallback(async () => {
    const currentAppointmentId = appointmentId;
    try {
      setLoading(true);

      // Mock appointment data - in a real app this would come from API
      const mockAppointment: Appointment = {
        id: currentAppointmentId,
        clientName: 'María González',
        clientEmail: 'maria@email.com',
        clientPhone: '+56912345678',
        propertyTitle: 'Departamento Moderno Providencia',
        propertyAddress: 'Av. Providencia 123, Providencia',
        dateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // En 2 horas
        type: 'viewing',
        status: 'confirmed',
        notes: 'Cliente interesado en vista panorámica. Traer documentos de la propiedad.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
      };

      const mockComments: AppointmentComment[] = [
        {
          id: '1',
          content: 'Cliente confirmó asistencia a la cita.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          userId: 'user1',
          userName: 'Juan Pérez',
          isInternal: false,
        },
        {
          id: '2',
          content: 'Recordar llevar llaves de la propiedad.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
          userId: 'user2',
          userName: 'Ana López',
          isInternal: true,
        },
      ];

      setAppointment(mockAppointment);
      setComments(mockComments);
      setError(null);
    } catch (err) {
      logger.error('Error loading appointment details:', {
        error: err instanceof Error ? err.message : String(err),
      });
      setError('Error al cargar los detalles de la cita');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointmentDetails();
    loadUserData();
  }, [appointmentId, loadAppointmentDetails, loadUserData]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      return;
    }

    setSubmittingComment(true);
    setActionError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newCommentData: AppointmentComment = {
        id: Date.now().toString(),
        content: newComment,
        createdAt: new Date().toISOString(),
        userId: user?.id || 'current-user',
        userName: user?.name || 'Usuario Actual',
        isInternal: false,
      };

      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
    } catch (error) {
      logger.error('Error submitting comment:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setActionError('Error al enviar el comentario. Por favor intenta nuevamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) {
      return;
    }

    setUpdatingStatus(true);
    setActionError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAppointment(prev =>
        prev ? { ...prev, status: newStatus as any, updatedAt: new Date().toISOString() } : null
      );

      // Success - no alert needed, status will be updated in UI
    } catch (error) {
      logger.error('Error updating appointment status:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setActionError('Error al actualizar el estado. Por favor intenta nuevamente.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Programada', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Asistió', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      viewing: { label: 'Visita', color: 'bg-blue-100 text-blue-800' },
      meeting: { label: 'Reunión', color: 'bg-purple-100 text-purple-800' },
      valuation: { label: 'Tasación', color: 'bg-orange-100 text-orange-800' },
      negotiation: { label: 'Negociación', color: 'bg-green-100 text-green-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.viewing;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Detalles de la Cita" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando detalles de la cita...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error || !appointment) {
    return (
      <UnifiedDashboardLayout title="Detalles de la Cita" subtitle="Error">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Cita no encontrada'}</p>
            <Link href="/broker/appointments">
              <Button>Volver a Citas</Button>
            </Link>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout title="Detalles de la Cita" subtitle={`Cita #${appointmentId}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Action Error */}
        {actionError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{actionError}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/broker/appointments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalles de la Cita</h1>
              <p className="text-gray-600">Información completa de la cita programada</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push(`/broker/appointments/${appointmentId}/edit`)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="font-mono text-sm text-gray-500">#{appointmentId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(appointment.status)}
                    {getTypeBadge(appointment.type)}
                    {isToday(appointment.dateTime) && (
                      <Badge className="bg-green-100 text-green-800">
                        <Clock className="w-3 h-3 mr-1" />
                        Hoy
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-xl">{appointment.propertyTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cliente</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span className="font-medium">{appointment.clientName}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {appointment.clientEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {appointment.clientPhone}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Ubicación</h4>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-medium">{appointment.propertyTitle}</p>
                        <p>{appointment.propertyAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fecha y Hora</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span
                        className={`font-medium ${isPast(appointment.dateTime) ? 'text-red-600' : ''}`}
                      >
                        {formatDateTime(appointment.dateTime)}
                      </span>
                      {isPast(appointment.dateTime) && appointment.status !== 'completed' && (
                        <Badge className="bg-red-100 text-red-800 ml-2">Vencida</Badge>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notas</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Creada:</span>
                      <span className="ml-2 font-medium">
                        {new Date(appointment.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Última actualización:</span>
                      <span className="ml-2 font-medium">
                        {new Date(appointment.updatedAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
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
                            <span className="font-medium text-sm">{comment.userName}</span>
                            {comment.isInternal && (
                              <Badge variant="outline" className="text-xs">
                                Interno
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString('es-CL')}
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
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado de la Cita</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Estado Actual:</span>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant={appointment.status === 'confirmed' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleStatusChange('confirmed')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmar Cita
                  </Button>

                  <Button
                    size="sm"
                    variant={appointment.status === 'completed' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => handleStatusChange('completed')}
                    disabled={updatingStatus}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marcar Completada
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleStatusChange('cancelled')}
                    disabled={updatingStatus}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar Cita
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      window.open(
                        `mailto:${appointment.clientEmail}?subject=Cita programada: ${appointment.propertyTitle}`
                      )
                    }
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contactar Cliente
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(`tel:${appointment.clientPhone}`)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar Cliente
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/broker/appointments/${appointmentId}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Cita
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
