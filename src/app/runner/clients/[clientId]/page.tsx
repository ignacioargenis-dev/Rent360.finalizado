'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Star,
  CheckCircle,
  Clock,
  Building,
  Camera,
  MessageSquare,
  Eye,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger-minimal';

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'tenant' | 'owner';
  lastServiceDate: string | null;
  nextScheduledVisit: string | null;
  rating: number;
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  totalEarnings: number;
  propertyCount: number;
  satisfactionScore: number;
}

interface Visit {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  scheduledAt: string;
  duration: number;
  status: string;
  notes: string | null;
  photosTaken: number;
  earnings: number;
  rating: number | null;
  feedback: string | null;
  photos: Array<{
    id: string;
    url: string;
    alt: string;
    createdAt: string;
  }>;
}

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  commune: string;
  type: string;
  price: number;
  status: string;
}

export default function RunnerClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadClientData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/runner/clients/${clientId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar cliente: ${response.status}`);
        }

        const result = await response.json();
        if (result.success) {
          setClient(result.client);
          setVisits(result.visits || []);
          setProperties(result.properties || []);
        } else {
          logger.error('Error en respuesta del servidor:', result.error);
        }
      } catch (error) {
        logger.error('Error loading client data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusUpper = (status || '').toString().toUpperCase();
    switch (statusUpper) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'SCHEDULED':
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Programada</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const handleContactClient = (method: 'phone' | 'email' | 'message') => {
    if (!client) {
      return;
    }

    switch (method) {
      case 'phone':
        window.open(`tel:${client.phone}`);
        break;
      case 'email':
        window.open(`mailto:${client.email}?subject=Consulta sobre servicio`);
        break;
      case 'message':
        const recipientData = {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          type: 'client' as const,
        };
        sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
        router.push('/runner/messages?new=true');
        break;
    }
  };

  const handleViewVisit = (visitId: string) => {
    router.push(`/runner/tasks/${visitId}`);
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout title="Detalles del Cliente" subtitle="Cargando...">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando detalles del cliente...</p>
            </div>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!client) {
    return (
      <UnifiedDashboardLayout title="Cliente no encontrado" subtitle="Error">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <p className="text-gray-600 mb-4">El cliente solicitado no fue encontrado.</p>
              <Button onClick={() => router.push('/runner/clients')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Clientes
              </Button>
            </CardContent>
          </Card>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Detalles del Cliente"
      subtitle={`Información completa de ${client.name}`}
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => router.push('/runner/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Client Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {client.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {client.rating > 0 && renderStars(client.rating)}
                    <Badge variant="outline">
                      {client.type === 'tenant' ? 'Arrendatario' : 'Propietario'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{client.address}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Último servicio: {formatDate(client.lastServiceDate)}</span>
                  </div>
                  {client.nextScheduledVisit && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Próxima visita: {formatDate(client.nextScheduledVisit)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={() => handleContactClient('phone')}>
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleContactClient('email')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleContactClient('message')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Mensaje
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Servicios</p>
                  <p className="text-2xl font-bold text-gray-900">{client.totalServices}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-green-600">{client.completedServices}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ganancias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${client.totalEarnings.toLocaleString('es-CL')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Propiedades</p>
                  <p className="text-2xl font-bold text-gray-900">{client.propertyCount}</p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="visits">Visitas ({visits.length})</TabsTrigger>
            <TabsTrigger value="properties">Propiedades ({properties.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating Promedio</span>
                    <div className="flex items-center gap-2">
                      {client.rating > 0 ? renderStars(client.rating) : <span>N/A</span>}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puntuación de Satisfacción</span>
                    <span className="font-semibold">{client.satisfactionScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicios Pendientes</span>
                    <Badge variant="outline">{client.pendingServices}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{client.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{client.address}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            {visits.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay visitas registradas para este cliente.</p>
                </CardContent>
              </Card>
            ) : (
              visits.map(visit => (
                <Card key={visit.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">{visit.propertyTitle}</h3>
                          {getStatusBadge(visit.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {visit.propertyAddress}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Fecha</p>
                            <p className="font-medium">{formatDateTime(visit.scheduledAt)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Duración</p>
                            <p className="font-medium">{visit.duration} min</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Ganancias</p>
                            <p className="font-medium text-green-600">
                              ${visit.earnings.toLocaleString('es-CL')}
                            </p>
                          </div>
                          {visit.rating && (
                            <div>
                              <p className="text-gray-600">Calificación</p>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="font-medium">{visit.rating.toFixed(1)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        {visit.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{visit.notes}</p>
                          </div>
                        )}
                        {visit.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm font-medium text-blue-900 mb-1">
                              Feedback del Cliente
                            </p>
                            <p className="text-sm text-blue-700">{visit.feedback}</p>
                          </div>
                        )}
                        {visit.photos.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              {visit.photos.length} foto(s)
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {visit.photos.slice(0, 4).map(photo => (
                                <img
                                  key={photo.id}
                                  src={photo.url}
                                  alt={photo.alt || 'Foto de visita'}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  onClick={() => window.open(photo.url, '_blank')}
                                  style={{ cursor: 'pointer' }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVisit(visit.id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProperty(visit.propertyId)}
                        >
                          <Building className="w-4 h-4 mr-2" />
                          Ver Propiedad
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            {properties.length === 0 ? (
              <Card>
                <CardContent className="pt-8 pb-8 text-center">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay propiedades asociadas a este cliente.</p>
                </CardContent>
              </Card>
            ) : (
              properties.map(property => (
                <Card key={property.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                        <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {property.address}, {property.commune}, {property.city}
                        </p>
                        <div className="flex gap-2">
                          <Badge variant="outline">{property.type}</Badge>
                          <Badge variant="outline">{property.status}</Badge>
                          <Badge variant="outline">${property.price.toLocaleString('es-CL')}</Badge>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => handleViewProperty(property.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Propiedad
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
