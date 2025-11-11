'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  FileText,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Send,
  Eye,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';

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
  providerEmail?: string;
  providerId?: string;
  finalPrice?: number;
  quotedPrice?: number;
  estimatedPrice?: number;
  notes?: string;
  images?: string[];
  type?: string; // 'broker_request' o 'service_job'
}

export default function TenantServiceRequestsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadServiceRequests();
  }, [user]);

  const loadServiceRequests = async () => {
    if (!user) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/services/request', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Error al cargar solicitudes de servicio');
      }

      const data = await response.json();

      if (data.success) {
        // Transformar datos para mostrar
        const transformedRequests = data.data.map((req: any) => ({
          id: req.id,
          title: req.title,
          description: req.description,
          serviceType: req.serviceType,
          status: req.status.toUpperCase(), // Mantener en mayúsculas para consistencia
          createdAt: req.createdAt,
          preferredDate: req.scheduledDate?.split('T')[0] || req.preferredDate,
          preferredTimeSlot: req.preferredTimeSlot,
          budgetMin: req.basePrice || req.budgetMin,
          budgetMax: req.budgetMax,
          providerName: req.serviceProviderName || 'Proveedor',
          providerEmail: req.serviceProviderEmail || '',
          providerId: req.serviceProviderId,
          finalPrice: req.finalPrice,
          quotedPrice: req.finalPrice || req.quotedPrice,
          estimatedPrice: req.basePrice || req.estimatedPrice,
          notes: req.notes,
          images: req.images || [],
        }));

        // Log para debugging de estados
        console.log(
          '📊 Estados de solicitudes del inquilino:',
          transformedRequests.map((req: ServiceRequest) => req.status)
        );
        console.log('📊 Total de solicitudes:', transformedRequests.length);

        // Log detallado de cada solicitud para debugging
        transformedRequests.forEach((req, index) => {
          console.log(
            `📋 Solicitud ${index + 1}: ID=${req.id}, Status=${req.status}, Title=${req.title}`
          );
        });

        setRequests(transformedRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      logger.error('Error cargando solicitudes de servicio:', { error });
      setError('Error al cargar las solicitudes. Por favor, inténtalo nuevamente.');
    } finally {
      setLoading(false);
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

    // Convertir status a minúsculas para buscar en el config
    const statusKey = status?.toLowerCase() as keyof typeof config;
    const statusConfig = config[statusKey] || config.pending;
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

  const handleViewDetails = (request: ServiceRequest) => {
    router.push(`/tenant/service-requests/${request.id}`);
  };

  const handleContactProvider = (request: ServiceRequest) => {
    // Crear conversación con el proveedor
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

  // Función para obtener el conteo de solicitudes por tab
  const getTabCount = (tabValue: string) => {
    if (tabValue === 'all') {
      return requests.length;
    }

    // Mapear los valores de los tabs a los estados reales de la base de datos
    const statusMapping: { [key: string]: string[] } = {
      pending: ['PENDING'],
      quoted: ['QUOTED'],
      accepted: ['ACCEPTED', 'ACTIVE', 'IN_PROGRESS'],
      completed: ['COMPLETED'],
    };

    const mappedStatuses = statusMapping[tabValue] || [tabValue.toUpperCase()];
    return requests.filter(request => mappedStatuses.includes(request.status)).length;
  };

  const filteredRequests = requests.filter(request => {
    if (activeTab === 'all') {
      return true;
    }

    const statusMapping: { [key: string]: string[] } = {
      pending: ['PENDING'],
      quoted: ['QUOTED'],
      accepted: ['ACCEPTED', 'ACTIVE', 'IN_PROGRESS'],
      completed: ['COMPLETED'],
    };

    const mappedStatuses = statusMapping[activeTab] || [activeTab.toUpperCase()];
    return mappedStatuses.includes(request.status);
  });

  if (loading) {
    return (
      <UnifiedDashboardLayout user={user} title="Mis Solicitudes de Servicio">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Mis Solicitudes de Servicio"
      subtitle="Gestiona tus solicitudes de servicio y cotizaciones"
    >
      <div className="space-y-6">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-sm text-gray-600">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'quoted').length}
                  </p>
                  <p className="text-sm text-gray-600">Cotizados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'accepted').length}
                  </p>
                  <p className="text-sm text-gray-600">Aceptados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                  <p className="text-sm text-gray-600">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de solicitudes */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Servicio</CardTitle>
            <CardDescription>
              Gestiona tus solicitudes de servicio y revisa las cotizaciones recibidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">Todas ({getTabCount('all')})</TabsTrigger>
                <TabsTrigger value="pending">Pendientes ({getTabCount('pending')})</TabsTrigger>
                <TabsTrigger value="quoted">Cotizadas ({getTabCount('quoted')})</TabsTrigger>
                <TabsTrigger value="accepted">Aceptadas ({getTabCount('accepted')})</TabsTrigger>
                <TabsTrigger value="completed">
                  Completadas ({getTabCount('completed')})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No hay solicitudes {activeTab !== 'all' ? `en estado ${activeTab}` : ''}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all'
                        ? 'Cuando solicites servicios, aparecerán aquí.'
                        : activeTab === 'pending'
                          ? 'Tus solicitudes pendientes aparecerán aquí.'
                          : activeTab === 'quoted'
                            ? 'Las cotizaciones que recibas aparecerán aquí.'
                            : 'Los servicios completados aparecerán aquí.'}
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => router.push('/tenant/services')}>
                        Solicitar Servicio
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredRequests.map(request => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-semibold">{request.title}</h3>
                                {getStatusBadge(request.status)}
                              </div>

                              <p className="text-gray-600 mb-3">{request.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span>{getServiceTypeLabel(request.serviceType)}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span>{request.providerName}</span>
                                </div>

                                {request.preferredDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-500" />
                                    <span>
                                      {new Date(request.preferredDate).toLocaleDateString('es-CL')}
                                    </span>
                                  </div>
                                )}

                                {(request.budgetMin || request.budgetMax) && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <span>
                                      {request.budgetMin && request.budgetMax
                                        ? `${formatCurrency(request.budgetMin)} - ${formatCurrency(request.budgetMax)}`
                                        : request.budgetMin
                                          ? `Desde ${formatCurrency(request.budgetMin)}`
                                          : request.budgetMax
                                            ? `Hasta ${formatCurrency(request.budgetMax)}`
                                            : 'Sin presupuesto especificado'}
                                    </span>
                                  </div>
                                )}

                                {request.quotedPrice && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-green-600" />
                                    <span className="font-semibold text-green-600">
                                      Cotización: {formatCurrency(request.quotedPrice)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewDetails(request)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalles
                              </Button>

                              <Button size="sm" onClick={() => handleContactProvider(request)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contactar
                              </Button>

                              {request.status === 'quoted' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleViewDetails(request)}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Aceptar Cotización
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              Solicitado el{' '}
                              {new Date(request.createdAt).toLocaleDateString('es-CL')} a las{' '}
                              {new Date(request.createdAt).toLocaleTimeString('es-CL')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
