'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Settings,
  Play,
  Pause,
  Square,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { logger } from '@/lib/logger';

interface RecurringService {
  id: string;
  serviceType: string;
  serviceDescription: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  amount: number;
  location: string;
  nextScheduledDate: Date;
  createdAt: Date;
  totalInstances: number;
  completedInstances: number;
  cancelledInstances: number;
  averageRating?: number;
  contractId?: string;
}

interface ServiceInstance {
  id: string;
  recurringServiceId: string;
  scheduledDate: Date;
  actualDate?: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'missed';
  amount: number;
  providerNotes?: string;
  clientNotes?: string;
  photos?: string[];
  rating?: number;
}

export default function RecurringServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<RecurringService[]>([]);
  const [selectedService, setSelectedService] = useState<RecurringService | null>(null);
  const [serviceInstances, setServiceInstances] = useState<ServiceInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadServiceInstances(selectedService.id);
    }
  }, [selectedService]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener información del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener servicios recurrentes del cliente
      const servicesResponse = await fetch('/api/client/recurring-services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      }

    } catch (error) {
      logger.error('Error cargando servicios recurrentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceInstances = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/client/recurring-services/${serviceId}/instances`);
      if (response.ok) {
        const data = await response.json();
        setServiceInstances(data.instances);
      }
    } catch (error) {
      logger.error('Error cargando instancias del servicio:', error);
    }
  };

  const handleServiceAction = async (serviceId: string, action: 'pause' | 'resume' | 'cancel') => {
    try {
      const response = await fetch(`/api/client/recurring-services/${serviceId}/${action}`, {
        method: 'POST',
      });

      if (response.ok) {
        await loadData();
        alert(`Servicio ${action === 'pause' ? 'pausado' : action === 'resume' ? 'reanudado' : 'cancelado'} exitosamente`);
      } else {
        throw new Error('Error al cambiar el estado del servicio');
      }
    } catch (error) {
      logger.error(`Error ${action} servicio:`, error);
      alert('Error al cambiar el estado del servicio');
    }
  };

  const formatFrequency = (frequency: string) => {
    const frequencyMap = {
      daily: 'Diario',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral'
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      paused: { label: 'Pausado', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completado', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getInstanceStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'missed':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getInstanceStatusLabel = (status: string) => {
    const statusMap = {
      scheduled: 'Programado',
      in_progress: 'En progreso',
      completed: 'Completado',
      cancelled: 'Cancelado',
      missed: 'Perdido'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const filteredServices = services.filter(service => {
    switch (activeTab) {
      case 'active':
        return service.status === 'active';
      case 'paused':
        return service.status === 'paused';
      case 'completed':
        return service.status === 'completed';
      case 'cancelled':
        return service.status === 'cancelled';
      default:
        return true;
    }
  });

  const getProgressPercentage = (service: RecurringService) => {
    if (service.totalInstances === 0) return 0;
    return (service.completedInstances / service.totalInstances) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando servicios recurrentes...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Servicios Recurrentes"
      subtitle="Gestiona tus servicios de mantenimiento programados"
    >
      <DashboardHeader
        user={user}
        title="🔄 Servicios Recurrentes"
        subtitle="Gestiona tus servicios de mantenimiento programados"
      />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Servicios Activos</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {services.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <Play className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Servicios Completados</p>
                  <p className="text-2xl font-bold text-green-900">
                    {services.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Próximo Servicio</p>
                  <p className="text-lg font-bold text-yellow-900">
                    {services
                      .filter(s => s.status === 'active')
                      .sort((a, b) => new Date(a.nextScheduledDate).getTime() - new Date(b.nextScheduledDate).getTime())[0]
                      ?.nextScheduledDate
                      ? new Date(services
                          .filter(s => s.status === 'active')
                          .sort((a, b) => new Date(a.nextScheduledDate).getTime() - new Date(b.nextScheduledDate).getTime())[0]
                          .nextScheduledDate
                        ).toLocaleDateString('es-CL')
                      : 'Sin servicios'
                    }
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Ahorro Total</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${services.reduce((sum, s) => sum + (s.amount * s.completedInstances), 0).toLocaleString('es-CL')}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de servicios */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="active">Activos ({services.filter(s => s.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="paused">Pausados ({services.filter(s => s.status === 'paused').length})</TabsTrigger>
            <TabsTrigger value="completed">Completados ({services.filter(s => s.status === 'completed').length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelados ({services.filter(s => s.status === 'cancelled').length})</TabsTrigger>
            <TabsTrigger value="all">Todos ({services.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {filteredServices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {activeTab === 'active' ? 'No tienes servicios activos' :
                       activeTab === 'paused' ? 'No tienes servicios pausados' :
                       activeTab === 'completed' ? 'No tienes servicios completados' :
                       activeTab === 'cancelled' ? 'No tienes servicios cancelados' :
                       'No tienes servicios recurrentes'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {activeTab === 'active' ? 'Programa servicios recurrentes para mantener tus propiedades.' :
                       'Aquí aparecerán tus servicios recurrentes según su estado.'}
                    </p>
                    {activeTab === 'active' && (
                      <Button onClick={() => router.push('/client/new-recurring-service')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Servicio Recurrente
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Lista de servicios */}
                <div className="space-y-4">
                  {filteredServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedService?.id === service.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedService(service)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={service.providerAvatar} alt={service.providerName} />
                              <AvatarFallback>
                                {service.providerName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">{service.serviceType}</h3>
                              <p className="text-sm text-gray-600">{service.providerName}</p>
                            </div>
                          </div>
                          {getStatusBadge(service.status)}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatFrequency(service.frequency)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{service.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-600">
                                ${service.amount.toLocaleString('es-CL')}
                              </span>
                              <span className="text-sm text-gray-500">/ servicio</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Próximo: {new Date(service.nextScheduledDate).toLocaleDateString('es-CL')}
                            </div>
                          </div>

                          {/* Barra de progreso */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progreso</span>
                              <span>{service.completedInstances}/{service.totalInstances}</span>
                            </div>
                            <Progress value={getProgressPercentage(service)} className="h-2" />
                          </div>

                          {/* Rating promedio si existe */}
                          {service.averageRating && (
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`text-sm ${
                                      star <= service.averageRating! ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">
                                ({service.averageRating.toFixed(1)})
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Acciones rápidas */}
                        <div className="flex gap-2 mt-4 pt-4 border-t">
                          {service.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceAction(service.id, 'pause');
                              }}
                            >
                              <Pause className="w-4 h-4 mr-1" />
                              Pausar
                            </Button>
                          )}
                          {service.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleServiceAction(service.id, 'resume');
                              }}
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Reanudar
                            </Button>
                          )}
                          {service.status !== 'cancelled' && service.status !== 'completed' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Estás seguro de que quieres cancelar este servicio recurrente?')) {
                                  handleServiceAction(service.id, 'cancel');
                                }
                              }}
                            >
                              <Square className="w-4 h-4 mr-1" />
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Detalles del servicio seleccionado */}
                {selectedService ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          Detalles del Servicio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Tipo de Servicio</label>
                              <p className="text-sm text-gray-900">{selectedService.serviceType}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Frecuencia</label>
                              <p className="text-sm text-gray-900">{formatFrequency(selectedService.frequency)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Monto por Servicio</label>
                              <p className="text-sm text-gray-900">${selectedService.amount.toLocaleString('es-CL')}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700">Próxima Fecha</label>
                              <p className="text-sm text-gray-900">
                                {new Date(selectedService.nextScheduledDate).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Descripción</label>
                            <p className="text-sm text-gray-600 mt-1">{selectedService.serviceDescription}</p>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700">Ubicación</label>
                            <p className="text-sm text-gray-600 mt-1">{selectedService.location}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Historial de instancias */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Historial de Servicios
                        </CardTitle>
                        <CardDescription>
                          Últimas {serviceInstances.length} instancias del servicio
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {serviceInstances.length === 0 ? (
                            <div className="text-center py-8">
                              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                              <p className="text-gray-600">No hay instancias registradas aún</p>
                            </div>
                          ) : (
                            serviceInstances.slice(0, 10).map((instance) => (
                              <div key={instance.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                  {getInstanceStatusIcon(instance.status)}
                                  <div>
                                    <div className="font-medium text-sm">
                                      {new Date(instance.scheduledDate).toLocaleDateString('es-CL')}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {getInstanceStatusLabel(instance.status)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-sm">
                                    ${instance.amount.toLocaleString('es-CL')}
                                  </div>
                                  {instance.rating && (
                                    <div className="text-xs text-yellow-600">
                                      ★ {instance.rating.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Selecciona un servicio
                        </h3>
                        <p className="text-gray-600">
                          Haz clic en un servicio recurrente para ver sus detalles e historial
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Botón flotante para crear nuevo servicio */}
        <Button
          size="lg"
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 shadow-lg"
          onClick={() => router.push('/client/new-recurring-service')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Servicio Recurrente
        </Button>
      </div>
    </EnhancedDashboardLayout>
  );
}
