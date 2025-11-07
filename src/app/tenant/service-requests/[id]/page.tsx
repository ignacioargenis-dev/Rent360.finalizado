'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
}

export default function TenantServiceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          finalPrice: data.request.finalPrice,
          quotedPrice: data.request.finalPrice || data.request.quotedPrice,
          estimatedPrice: data.request.basePrice || data.request.estimatedPrice,
          notes: data.request.notes,
          images: data.request.images || [],
        };

        setRequest(transformedRequest);
      } else {
        throw new Error('Solicitud no encontrada');
      }
    } catch (error) {
      logger.error('Error al cargar solicitud de servicio:', { error, requestId });
      setError(error instanceof Error ? error.message : 'Error desconocido');
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

    try {
      // Aquí iría la lógica para aceptar la cotización
      // Por ahora, solo mostramos un mensaje
      alert(
        `Cotización de ${formatCurrency(request.quotedPrice)} aceptada. El proveedor será notificado y comenzará el trabajo.`
      );

      // En el futuro, esto debería hacer una llamada a la API para cambiar el estado a ACCEPTED
      await loadRequest(); // Recargar datos
    } catch (error) {
      logger.error('Error aceptando cotización:', { error });
      alert('Error al aceptar la cotización. Por favor, inténtalo nuevamente.');
    }
  };

  const handleRejectQuote = async () => {
    if (!request) {
      return;
    }

    try {
      // Aquí iría la lógica para rechazar la cotización
      alert(
        'Cotización rechazada. Puedes contactar al proveedor para solicitar una nueva cotización.'
      );

      // En el futuro, esto debería hacer una llamada a la API para cambiar el estado o crear una nueva solicitud
      await loadRequest(); // Recargar datos
    } catch (error) {
      logger.error('Error rechazando cotización:', { error });
      alert('Error al rechazar la cotización. Por favor, inténtalo nuevamente.');
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

  if (error || !request) {
    return (
      <UnifiedDashboardLayout user={user} title="Detalle de Solicitud">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error al cargar la solicitud</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
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
            <h1 className="text-2xl font-bold">{request.title}</h1>
            <p className="text-gray-600">{getServiceTypeLabel(request.serviceType)}</p>
          </div>
          {getStatusBadge(request.status)}
        </div>

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
                  <p className="text-gray-900">{request.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Servicio
                    </label>
                    <p className="text-gray-900">{getServiceTypeLabel(request.serviceType)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <div className="mt-1">{getStatusBadge(request.status)}</div>
                  </div>

                  {request.preferredDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha Preferida
                      </label>
                      <p className="text-gray-900">
                        {new Date(request.preferredDate).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  )}

                  {request.preferredTimeSlot && (
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

                  {(request.budgetMin || request.budgetMax) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rango de Presupuesto
                      </label>
                      <p className="text-gray-900">
                        {request.budgetMin && request.budgetMax
                          ? `${formatCurrency(request.budgetMin)} - ${formatCurrency(request.budgetMax)}`
                          : request.budgetMin
                            ? `Desde ${formatCurrency(request.budgetMin)}`
                            : request.budgetMax
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
                      {new Date(request.createdAt).toLocaleDateString('es-CL')} a las{' '}
                      {new Date(request.createdAt).toLocaleTimeString('es-CL')}
                    </p>
                  </div>
                </div>

                {request.notes && (
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
            {request.status === 'quoted' && request.quotedPrice && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Cotización Recibida
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-800">Precio cotizado</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(request.quotedPrice)}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={handleAcceptQuote}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aceptar Cotización
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={handleRejectQuote}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Imágenes adjuntas */}
            {request.images && request.images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Imágenes Adjuntas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {request.images.map((image, index) => (
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
                    <AvatarFallback>{request.providerName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.providerName}</p>
                    <p className="text-sm text-gray-600">{request.providerEmail}</p>
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
    </UnifiedDashboardLayout>
  );
}
