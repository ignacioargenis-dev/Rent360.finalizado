'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ServiceRequest {
  id: string;
  propertyAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  serviceType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  preferredDate: string;
  preferredTimeSlot: string;
  estimatedDuration: string;
  budgetRange: {
    min: number;
    max: number;
  };
  specialRequirements: string[];
  attachments: string[];
  status: 'pending' | 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface QuoteData {
  amount: number;
  currency: string;
  description: string;
  estimatedDuration: string;
  validUntil: string;
  terms: string;
  notes: string;
}

export default function ServiceRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const requestId = params?.id as string;

  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [quote, setQuote] = useState<QuoteData>({
    amount: 0,
    currency: 'CLP',
    description: '',
    estimatedDuration: '',
    validUntil: '',
    terms: '',
    notes: '',
  });
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Mock request data
  const mockRequest: ServiceRequest = {
    id: requestId,
    propertyAddress: 'Av. Providencia 123, Santiago',
    tenantName: 'Ana Rodríguez',
    tenantEmail: 'ana@email.com',
    tenantPhone: '+56912345678',
    serviceType: 'Reparación de Fontanería',
    priority: 'high',
    title: 'Reparación de grifería en baño principal',
    description:
      'El grifo del lavamanos en el baño principal pierde agua constantemente. Parece ser una junta dañada. Necesito reparación urgente.',
    preferredDate: '2024-12-10',
    preferredTimeSlot: 'Mañana (8:00 - 12:00)',
    estimatedDuration: '1 hora',
    budgetRange: {
      min: 20000,
      max: 40000,
    },
    specialRequirements: ['Acceso al baño principal', 'Posible necesidad de cortar agua'],
    attachments: ['foto1.jpg', 'foto2.jpg'],
    status: 'pending',
    createdAt: '2024-12-05T10:30:00Z',
    updatedAt: '2024-12-05T10:30:00Z',
  };

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRequest(mockRequest);
    } catch (error) {
      logger.error('Error al cargar solicitud de servicio', { error, requestId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quote.amount || !quote.description) {
      setErrorMessage('Por favor complete al menos el monto y descripción de la cotización');
      return;
    }

    setIsSubmittingQuote(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      logger.info('Cotización enviada exitosamente', {
        requestId,
        amount: quote.amount,
        description: quote.description,
      });

      setSuccessMessage('Cotización enviada exitosamente al cliente');

      // Update request status
      setRequest(prev => (prev ? { ...prev, status: 'quoted' } : null));
    } catch (error) {
      logger.error('Error al enviar cotización', { error, requestId });
      setErrorMessage('Error al enviar la cotización. Por favor intente nuevamente.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRequest(prev => (prev ? { ...prev, status: 'accepted' } : null));
      setSuccessMessage('Solicitud aceptada. El cliente será notificado.');
    } catch (error) {
      setErrorMessage('Error al aceptar la solicitud.');
    }
  };

  const handleRejectRequest = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRequest(prev => (prev ? { ...prev, status: 'cancelled' } : null));
      setSuccessMessage('Solicitud rechazada.');
    } catch (error) {
      setErrorMessage('Error al rechazar la solicitud.');
    }
  };

  const handleContactClient = (method: 'phone' | 'email' | 'message') => {
    if (!request) {
      return;
    }

    switch (method) {
      case 'phone':
        window.open(`tel:${request.tenantPhone}`);
        break;
      case 'email':
        window.open(`mailto:${request.tenantEmail}?subject=Re: ${request.title}`);
        break;
      case 'message':
        // Implementar navegación a chat
        logger.info('Iniciar conversación con cliente', {
          requestId,
          clientEmail: request.tenantEmail,
        });
        break;
    }
  };

  const handleCancel = () => {
    router.push('/provider/requests');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'quoted':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Cotizado
          </Badge>
        );
      case 'accepted':
        return <Badge className="bg-green-500">Aceptado</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">En Progreso</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Baja
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Media
          </Badge>
        );
      case 'high':
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-600">
            Alta
          </Badge>
        );
      case 'urgent':
        return <Badge variant="destructive">Urgente</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando solicitud...</span>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!request) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12 text-gray-500">
            No se pudo cargar la solicitud de servicio
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitud de Servicio</h1>
            <p className="text-gray-600">ID: {request.id}</p>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{request.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      {getPriorityBadge(request.priority)}
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Creada</p>
                    <p className="text-sm font-medium">
                      {new Date(request.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Descripción */}
                <div>
                  <Label className="text-base font-medium">Descripción</Label>
                  <p className="text-gray-700 mt-2 leading-relaxed">{request.description}</p>
                </div>

                {/* Detalles del Servicio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tipo de Servicio</Label>
                    <p className="text-gray-900">{request.serviceType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Duración Estimada</Label>
                    <p className="text-gray-900">{request.estimatedDuration}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fecha Preferida</Label>
                    <p className="text-gray-900">
                      {new Date(request.preferredDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Horario Preferido</Label>
                    <p className="text-gray-900">{request.preferredTimeSlot}</p>
                  </div>
                </div>

                {/* Presupuesto */}
                {request.budgetRange.min > 0 || request.budgetRange.max > 0 ? (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Rango de Presupuesto
                    </Label>
                    <p className="text-lg font-semibold text-green-600">
                      {request.budgetRange.min > 0
                        ? formatCurrency(request.budgetRange.min)
                        : 'Sin mínimo'}{' '}
                      -{' '}
                      {request.budgetRange.max > 0
                        ? formatCurrency(request.budgetRange.max)
                        : 'Sin máximo'}
                    </p>
                  </div>
                ) : null}

                {/* Requisitos Especiales */}
                {request.specialRequirements.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Requisitos Especiales
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {request.specialRequirements.map((req, index) => (
                        <Badge key={index} variant="outline">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Adjuntos/Imágenes */}
                {request.attachments.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Imágenes del Trabajo
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {request.attachments.map((attachment, index) => {
                        // Verificar si es una imagen por la extensión
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachment);

                        if (isImage) {
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={
                                  attachment.startsWith('http')
                                    ? attachment
                                    : `/uploads/service-requests/${attachment}`
                                }
                                alt={`Imagen ${index + 1} del trabajo`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                onError={e => {
                                  // Si la imagen no se puede cargar, mostrar un placeholder
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/api/placeholder/200/128';
                                }}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={() =>
                                    window.open(
                                      attachment.startsWith('http')
                                        ? attachment
                                        : `/uploads/service-requests/${attachment}`,
                                      '_blank'
                                    )
                                  }
                                >
                                  Ver
                                </Button>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                            >
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{attachment}</span>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulario de Cotización */}
            {request.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Enviar Cotización</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quoteAmount">Monto de Cotización *</Label>
                      <Input
                        id="quoteAmount"
                        type="number"
                        value={quote.amount || ''}
                        onChange={e =>
                          setQuote(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quoteCurrency">Moneda</Label>
                      <select
                        id="quoteCurrency"
                        value={quote.currency}
                        onChange={e => setQuote(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="CLP">CLP - Peso Chileno</option>
                        <option value="USD">USD - Dólar Americano</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quoteDescription">Descripción de la Cotización *</Label>
                    <Textarea
                      id="quoteDescription"
                      value={quote.description}
                      onChange={e => setQuote(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe detalladamente los trabajos a realizar, materiales incluidos, etc."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quoteDuration">Duración Estimada</Label>
                      <Input
                        id="quoteDuration"
                        value={quote.estimatedDuration}
                        onChange={e =>
                          setQuote(prev => ({ ...prev, estimatedDuration: e.target.value }))
                        }
                        placeholder="Ej: 2 horas"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quoteValidUntil">Válida Hasta</Label>
                      <Input
                        id="quoteValidUntil"
                        type="date"
                        value={quote.validUntil}
                        onChange={e => setQuote(prev => ({ ...prev, validUntil: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quoteTerms">Términos y Condiciones</Label>
                    <Textarea
                      id="quoteTerms"
                      value={quote.terms}
                      onChange={e => setQuote(prev => ({ ...prev, terms: e.target.value }))}
                      placeholder="Condiciones de pago, garantías, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quoteNotes">Notas Adicionales</Label>
                    <Textarea
                      id="quoteNotes"
                      value={quote.notes}
                      onChange={e => setQuote(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Información adicional relevante..."
                      rows={2}
                    />
                  </div>

                  <Button onClick={handleSendQuote} disabled={isSubmittingQuote} className="w-full">
                    {isSubmittingQuote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando Cotización...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Cotización
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Información del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {request.tenantName
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{request.tenantName}</p>
                    <p className="text-sm text-gray-500">Cliente</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleContactClient('phone')}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleContactClient('email')}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleContactClient('message')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Mensaje
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información de la Propiedad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <p className="text-sm text-gray-700">{request.propertyAddress}</p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            {request.status === 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full" onClick={handleAcceptRequest}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aceptar Solicitud
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleRejectRequest}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Rechazar Solicitud
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Estado Actual */}
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  {getStatusBadge(request.status)}
                  <p className="text-xs text-gray-500 mt-2">
                    Actualizado: {new Date(request.updatedAt).toLocaleString('es-CL')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
