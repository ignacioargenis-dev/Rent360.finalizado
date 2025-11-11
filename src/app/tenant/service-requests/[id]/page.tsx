'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  serviceType: string;
  status: string;
  createdAt: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  budgetMin?: number;
  budgetMax?: number;
  providerName: string;
  providerEmail: string;
  finalPrice?: number;
  quotedPrice?: number;
  estimatedPrice?: number;
  notes?: string;
  images?: string[];
  providerId?: string;
  serviceProviderEmail?: string;
  quoteDetails?: {
    estimatedTime?: string;
    availabilityDate?: string;
    materials?: string;
    laborCost?: number;
    materialsCost?: number;
    providerName?: string;
    providerId?: string;
  };
}

export default function TenantServiceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    rating: 5,
    comment: '',
  });

  const requestId = params?.id as string;

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/services/request/${requestId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Solicitud no encontrada');
        }
        throw new Error('Error al cargar la solicitud');
      }

      const data = await response.json();

      if (data.success && data.request) {
        // Transformar datos para mostrar
        const transformedRequest = {
          id: data.request.id,
          title: data.request.title,
          description: data.request.description,
          serviceType: data.request.serviceType,
          status: data.request.status.toLowerCase(),
          createdAt: data.request.createdAt,
          preferredDate: data.request.scheduledDate?.split('T')[0] || data.request.preferredDate,
          preferredTimeSlot: data.request.preferredTimeSlot,
          budgetMin: data.request.basePrice || data.request.budgetMin,
          budgetMax: data.request.budgetMax,
          providerName: data.request.serviceProviderName || 'Proveedor',
          providerEmail: data.request.serviceProviderEmail || '',
          providerId: data.request.serviceProviderId,
          serviceProviderEmail: data.request.serviceProviderEmail || '',
          finalPrice: data.request.finalPrice,
          quotedPrice: data.request.finalPrice || data.request.quotedPrice,
          estimatedPrice: data.request.basePrice || data.request.estimatedPrice,
          notes: data.request.notes,
          images: data.request.images || [],
          quoteDetails: data.request.quoteDetails,
        };

        setRequest(transformedRequest);
      } else {
        throw new Error('Solicitud no encontrada');
      }
    } catch (error) {
      logger.error('Error al cargar solicitud de servicio:', { error, requestId });
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      quoted: { label: 'Cotizado', color: 'bg-blue-100 text-blue-800', icon: DollarSign },
      accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { label: 'Completado', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <Badge className={`${statusConfig.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getServiceTypeLabel = (type: string) => {
    const labels = {
      maintenance: 'Mantenimiento',
      cleaning: 'Limpieza',
      moving: 'Mudanzas',
      security: 'Seguridad',
      other: 'Otro',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const handleContactProvider = () => {
    if (!request) {
      return;
    }

    const recipientData = {
      id: request.providerId,
      name: request.providerName,
      email: request.providerEmail,
      type: 'provider',
      serviceRequestId: request.id,
      serviceType: request.serviceType,
    };

    sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
    router.push('/tenant/messages?new=true');
  };

  const handleAcceptQuote = async () => {
    if (!request || !request.quotedPrice) {
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de aceptar la cotización de ${formatCurrency(request.quotedPrice)}? El proveedor será notificado y comenzará el trabajo.`
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/services/request/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aceptar la cotización');
      }

      logger.info('Cotización aceptada exitosamente:', {
        requestId,
        quoteAmount: request.quotedPrice,
      });

      setSuccessMessage(
        'Cotización aceptada exitosamente. Se ha creado un trabajo activo y el proveedor ha sido notificado.'
      );
      await loadRequest(); // Recargar datos para mostrar el nuevo estado

      // Mostrar información adicional sobre el trabajo creado
      setTimeout(() => {
        alert(
          '✅ Trabajo activo creado para el proveedor. Puedes hacer seguimiento desde "Mis Solicitudes".'
        );
      }, 1000);
    } catch (error) {
      logger.error('Error aceptando cotización:', { error, requestId });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al aceptar la cotización. Por favor, inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectQuote = async () => {
    if (!request) {
      return;
    }

    const confirmed = window.confirm(
      '¿Estás seguro de rechazar esta cotización? El proveedor será notificado y podrás solicitar una nueva cotización si lo deseas.'
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(`/api/services/request/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al rechazar la cotización');
      }

      logger.info('Cotización rechazada exitosamente:', { requestId });

      setSuccessMessage('Cotización rechazada. El proveedor ha sido notificado.');
      await loadRequest(); // Recargar datos para mostrar el nuevo estado
    } catch (error) {
      logger.error('Error rechazando cotización:', { error, requestId });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Error al rechazar la cotización. Por favor, inténtalo nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!request || !request.providerId) {
      setErrorMessage('No se puede calificar: información del proveedor no disponible');
      return;
    }

    if (!ratingData.comment.trim()) {
      setErrorMessage('Por favor escribe un comentario para la calificación');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contextType: 'maintenance',
          contextId: request.providerId,
          overallRating: ratingData.rating,
          comment: ratingData.comment,
          serviceRequestId: requestId, // Para relacionar con la solicitud completada
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar la calificación');
      }

      logger.info('Calificación enviada exitosamente:', {
        requestId,
        providerId: request.providerId,
        rating: ratingData.rating,
      });

      setSuccessMessage(
        '¡Gracias por tu calificación! Ayudas a otros usuarios a tomar mejores decisiones.'
      );
      setShowRatingModal(false);

      // Resetear el formulario
      setRatingData({
        rating: 5,
        comment: '',
      });

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      logger.error('Error enviando calificación:', { error, requestId });
      setErrorMessage(
        error instanceof Error ? error.message : 'Error inesperado al enviar la calificación'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout user={user} title="Detalle de Solicitud">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (errorMessage && !request) {
    return (
      <UnifiedDashboardLayout user={user} title="Detalle de Solicitud">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar la solicitud</h3>
          <p className="mt-1 text-sm text-gray-500">{errorMessage}</p>
          <div className="mt-6">
            <Button onClick={() => router.push('/tenant/service-requests')}>
              Volver a Mis Solicitudes
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout user={user} title="Detalle de Solicitud de Servicio">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/tenant/service-requests')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{request?.title}</h1>
            <p className="text-gray-600">
              {request?.serviceType && getServiceTypeLabel(request.serviceType)}
            </p>
          </div>
          {request?.status && getStatusBadge(request.status)}
        </div>

        {/* Mensajes de éxito y error */}
        {successMessage && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalles de la solicitud */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Solicitud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <p className="text-gray-900">{request?.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Servicio
                    </label>
                    <p className="text-gray-900">
                      {request?.serviceType && getServiceTypeLabel(request.serviceType)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="mt-1">{request?.status && getStatusBadge(request.status)}</div>
                  </div>

                  {request?.preferredDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Preferida
                      </label>
                      <p className="text-gray-900">
                        {new Date(request.preferredDate).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  )}

                  {request?.preferredTimeSlot && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Horario Preferido
                      </label>
                      <p className="text-gray-900">
                        {request.preferredTimeSlot === 'morning' && 'Mañana (9:00 - 12:00)'}
                        {request.preferredTimeSlot === 'afternoon' && 'Tarde (14:00 - 18:00)'}
                        {request.preferredTimeSlot === 'evening' && 'Noche (18:00 - 21:00)'}
                        {request.preferredTimeSlot === 'flexible' && 'Flexible'}
                      </p>
                    </div>
                  )}

                  {(request?.budgetMin || request?.budgetMax) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rango de Presupuesto
                      </label>
                      <p className="text-gray-900">
                        {request?.budgetMin && request?.budgetMax
                          ? `${formatCurrency(request.budgetMin)} - ${formatCurrency(request.budgetMax)}`
                          : request?.budgetMin
                            ? `Desde ${formatCurrency(request.budgetMin)}`
                            : request?.budgetMax
                              ? `Hasta ${formatCurrency(request.budgetMax)}`
                              : 'Sin presupuesto especificado'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Solicitud
                    </label>
                    <p className="text-gray-900">
                      {request?.createdAt &&
                        new Date(request.createdAt).toLocaleDateString('es-CL')}{' '}
                      a las{' '}
                      {request?.createdAt &&
                        new Date(request.createdAt).toLocaleTimeString('es-CL')}
                    </p>
                  </div>
                </div>

                {request?.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas Adicionales
                    </label>
                    <p className="text-gray-900">{request.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cotización (si existe) */}
            {request?.status === 'quoted' && request?.quotedPrice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Cotización Recibida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Precio principal */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800">Precio total cotizado</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(request.quotedPrice)}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  {/* Detalles de la cotización */}
                  {request?.quoteDetails && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Detalles de la Cotización</h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tiempo estimado */}
                        {request?.quoteDetails?.estimatedTime && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-blue-800">Tiempo Estimado</p>
                                <p className="text-sm font-medium text-blue-900">
                                  {request.quoteDetails.estimatedTime}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Fecha disponible */}
                        {request?.quoteDetails?.availabilityDate && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <div>
                                <p className="text-xs text-blue-800">Fecha Disponible</p>
                                <p className="text-sm font-medium text-blue-900">
                                  {new Date(
                                    request.quoteDetails.availabilityDate
                                  ).toLocaleDateString('es-CL')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Costo de mano de obra */}
                        {request?.quoteDetails?.laborCost && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-orange-600" />
                              <div>
                                <p className="text-xs text-orange-800">Mano de Obra</p>
                                <p className="text-sm font-medium text-orange-900">
                                  {formatCurrency(request.quoteDetails.laborCost)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Costo de materiales */}
                        {request?.quoteDetails?.materialsCost && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-orange-600" />
                              <div>
                                <p className="text-xs text-orange-800">Materiales</p>
                                <p className="text-sm font-medium text-orange-900">
                                  {formatCurrency(request.quoteDetails.materialsCost)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Materiales incluidos */}
                      {request?.quoteDetails?.materials && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-600 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-700 font-medium mb-1">
                                Materiales Incluidos
                              </p>
                              <p className="text-sm text-gray-900">
                                {request.quoteDetails.materials}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notas adicionales de la solicitud */}
                  {request?.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-xs text-yellow-700 font-medium mb-1">
                            Notas de la Solicitud
                          </p>
                          <p className="text-sm text-yellow-900">{request.notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  {request?.status === 'quoted' && (
                    <div className="flex gap-3 pt-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={handleAcceptQuote}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? 'Procesando...' : 'Aceptar Cotización'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        onClick={handleRejectQuote}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? 'Procesando...' : 'Rechazar'}
                      </Button>
                    </div>
                  )}

                  {/* Estado final */}
                  {(() => {
                    const status = request?.status as any;
                    return (
                      status &&
                      status === 'accepted' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                            <p className="text-sm font-medium text-green-800">
                              Cotización aceptada. El proveedor comenzará el trabajo pronto.
                            </p>
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {(() => {
                    const status = request?.status as any;
                    return (
                      status &&
                      status === 'cancelled' && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <XCircle className="w-5 h-5 text-red-600 mr-2" />
                            <p className="text-sm font-medium text-red-800">
                              Cotización rechazada. Puedes contactar al proveedor para solicitar una
                              nueva cotización.
                            </p>
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* Calificación del servicio completado */}
                  {(() => {
                    const status = request?.status as any;
                    return (
                      status &&
                      status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                              <p className="text-sm font-medium text-green-800">
                                Servicio completado exitosamente.
                              </p>
                            </div>
                            <Button
                              onClick={() => setShowRatingModal(true)}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                              size="sm"
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Calificar Servicio
                            </Button>
                          </div>
                        </div>
                      )
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Imágenes adjuntas */}
            {request?.images && request.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes Adjuntas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {request?.images?.map((image, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Información del proveedor */}
            <Card>
              <CardHeader>
                <CardTitle>Proveedor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {request?.providerName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request?.providerName}</p>
                    <p className="text-sm text-gray-600">{request?.providerEmail}</p>
                  </div>
                </div>

                <Button className="w-full" onClick={handleContactProvider}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contactar Proveedor
                </Button>
              </CardContent>
            </Card>

            {/* Acciones rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/tenant/service-requests')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Todas las Solicitudes
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/tenant/services')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Solicitar Otro Servicio
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Calificación */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Calificar Servicio
            </DialogTitle>
            <DialogDescription>
              Tu opinión nos ayuda a mejorar la calidad de nuestros servicios. ¿Cómo calificarías el
              trabajo realizado por {request?.providerName}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selector de estrellas */}
            <div>
              <Label>Calificación</Label>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingData(prev => ({ ...prev, rating: star }))}
                    className="text-2xl focus:outline-none hover:scale-110 transition-transform"
                  >
                    {star <= ratingData.rating ? '⭐' : '☆'}
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {ratingData.rating} de 5 estrellas
                </span>
              </div>
            </div>

            {/* Comentario */}
            <div>
              <Label htmlFor="rating-comment">Comentario</Label>
              <textarea
                id="rating-comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1"
                rows={4}
                placeholder="Comparte tu experiencia con este servicio..."
                value={ratingData.comment}
                onChange={e => setRatingData(prev => ({ ...prev, comment: e.target.value }))}
              />
            </div>

            {/* Mensajes de error */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRatingModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={isSubmitting || !ratingData.comment.trim()}
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Enviando...' : 'Enviar Calificación'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
