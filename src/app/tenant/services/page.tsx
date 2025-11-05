'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Search,
  MapPin,
  Star,
  Clock,
  DollarSign,
  Phone,
  MessageSquare,
  Filter,
  Wrench,
  Home,
  Zap,
  Droplets,
  Car,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  serviceType: 'maintenance' | 'cleaning' | 'moving' | 'security' | 'other';
  specialty: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  description: string;
  availability: 'available' | 'busy' | 'offline';
  verified: boolean;
  responseTime: string;
  completedJobs: number;
  phone: string;
  email: string;
  image?: string;
}

interface ServiceRequest {
  serviceType: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  preferredDate?: string;
  budget: number | undefined;
}

export default function TenantServicesPage() {
  const router = useRouter();

  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('rating');
  const [error, setError] = useState<string | null>(null);

  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProviderDetails, setSelectedProviderDetails] = useState<ServiceProvider | null>(
    null
  );
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest>({
    serviceType: '',
    description: '',
    urgency: 'medium',
    budget: undefined,
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estado para proveedores de servicios
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterAndSortProviders();
  }, [providers, searchTerm, selectedService, selectedLocation, sortBy]);

  const loadProviders = async () => {
    try {
      setProvidersLoading(true);
      const response = await fetch('/api/service-providers', {
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Transformar datos de la API al formato esperado por el componente
          const transformedProviders = data.providers.map((provider: any) => {
            // Manejar serviceTypes que puede ser un array de strings o un array de objetos
            let specialty = provider.serviceType || 'Servicio';
            if (provider.serviceTypes) {
              try {
                const serviceTypes = JSON.parse(provider.serviceTypes);
                if (Array.isArray(serviceTypes) && serviceTypes.length > 0) {
                  // Si es un array de objetos, tomar el nombre del primer servicio
                  if (typeof serviceTypes[0] === 'object' && serviceTypes[0] !== null) {
                    specialty =
                      serviceTypes[0].name ||
                      serviceTypes[0].category ||
                      serviceTypes[0].id ||
                      'Servicio';
                  } else {
                    // Si es un array de strings, tomar el primero
                    specialty = serviceTypes[0];
                  }
                }
              } catch (e) {
                // Si falla el parse, usar el valor por defecto
                logger.warn('Error parsing serviceTypes', {
                  error: e,
                  serviceTypes: provider.serviceTypes,
                });
              }
            }

            return {
              id: provider.id,
              name: provider.businessName,
              serviceType: provider.serviceType,
              specialty: specialty,
              rating: provider.rating || 0,
              reviewCount: provider.totalRatings || 0,
              hourlyRate: provider.basePrice || 0,
              location: `${provider.city || ''} ${provider.region || ''}`.trim(),
              description: provider.description || '',
              availability: 'available', // TODO: calcular basado en disponibilidad real
              verified: provider.isVerified,
              responseTime: provider.responseTime ? `< ${provider.responseTime}h` : '< 24h',
              completedJobs: provider.completedJobs || 0,
              phone: provider.user?.phone || '',
              email: provider.user?.email || '',
            };
          });
          setServiceProviders(transformedProviders);
          setProviders(transformedProviders); // Para mantener compatibilidad con filterAndSortProviders
          logger.debug('Proveedores de servicios cargados desde API');
        } else {
          setError('Error al cargar proveedores');
        }
      } else {
        setError('Error al conectar con el servidor');
      }
    } catch (error) {
      logger.error('Error loading providers:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar proveedores');
    } finally {
      setProvidersLoading(false);
      setLoading(false);
    }
  };

  const filterAndSortProviders = useCallback(() => {
    let filtered = [...providers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        provider =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Service type filter
    if (selectedService !== 'all') {
      filtered = filtered.filter(provider => provider.serviceType === selectedService);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(provider => provider.location === selectedLocation);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'price_low':
          return a.hourlyRate - b.hourlyRate;
        case 'price_high':
          return b.hourlyRate - a.hourlyRate;
        case 'reviews':
          return b.reviewCount - a.reviewCount;
        default:
          return 0;
      }
    });

    setFilteredProviders(filtered);
  }, [providers, searchTerm, selectedService, selectedLocation, sortBy]);

  const handleContactProvider = (provider: ServiceProvider, method: 'phone' | 'message') => {
    if (method === 'phone') {
      window.open(`tel:${provider.phone}`);
    } else {
      // Use messaging system
      const recipientData = {
        id: `provider_${provider.id}`,
        name: provider.name,
        email: provider.email,
        phone: provider.phone,
        type: 'provider' as const,
        providerId: provider.id,
        serviceType: provider.serviceType,
        specialty: provider.specialty,
      };
      sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
      router.push('/tenant/messages?new=true');
    }
  };

  const handleRequestService = (provider: ServiceProvider) => {
    setSelectedProvider(provider);
    setServiceRequest(prev => ({
      ...prev,
      serviceType: provider.serviceType,
    }));
    setShowRequestModal(true);
  };

  const handleViewProviderDetails = (provider: ServiceProvider) => {
    setSelectedProviderDetails(provider);
    setShowDetailsModal(true);
  };

  const handleSubmitServiceRequest = () => {
    if (!serviceRequest.description.trim()) {
      setErrorMessage('Por favor describe el servicio que necesitas');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Simulate service request submission
    setSuccessMessage(`Solicitud enviada a ${selectedProvider?.name}. Te contactarán pronto.`);
    setTimeout(() => setSuccessMessage(''), 5000);

    setShowRequestModal(false);
    setServiceRequest({
      serviceType: '',
      description: '',
      urgency: 'medium',
      budget: undefined,
    });
    setSelectedProvider(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      case 'cleaning':
        return <Home className="w-5 h-5" />;
      case 'moving':
        return <Car className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
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

  const getAvailabilityBadge = (availability: string) => {
    const config = {
      available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
      busy: { label: 'Ocupado', color: 'bg-yellow-100 text-yellow-800' },
      offline: { label: 'Fuera de línea', color: 'bg-gray-100 text-gray-800' },
    };
    const badgeConfig = config[availability as keyof typeof config];
    return <Badge className={badgeConfig.color}>{badgeConfig.label}</Badge>;
  };

  if (providersLoading) {
    return (
      <UnifiedDashboardLayout title="Buscar Servicios" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando proveedores de servicios...</p>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Buscar Servicios"
      subtitle="Encuentra y contrata proveedores de servicios profesionales"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, especialidad o descripción..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="min-w-48">
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los servicios</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="cleaning">Limpieza</SelectItem>
                    <SelectItem value="moving">Mudanzas</SelectItem>
                    <SelectItem value="security">Seguridad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-48">
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                    <SelectItem value="Santiago Centro">Santiago Centro</SelectItem>
                    <SelectItem value="Providencia">Providencia</SelectItem>
                    <SelectItem value="Las Condes">Las Condes</SelectItem>
                    <SelectItem value="Vitacura">Vitacura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-48">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Mejor calificación</SelectItem>
                    <SelectItem value="price_low">Precio más bajo</SelectItem>
                    <SelectItem value="price_high">Precio más alto</SelectItem>
                    <SelectItem value="reviews">Más reseñas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(provider => (
            <Card
              key={provider.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleViewProviderDetails(provider)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getServiceTypeIcon(provider.serviceType)}
                    <div>
                      <h3 className="font-semibold text-lg">{provider.name}</h3>
                      <p className="text-sm text-gray-600">{provider.specialty}</p>
                    </div>
                  </div>
                  {provider.verified && (
                    <Badge className="bg-blue-100 text-blue-800">Verificado</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="ml-1 font-medium">{provider.rating}</span>
                  </div>
                  <span className="text-gray-500">({provider.reviewCount} reseñas)</span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{provider.location}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {formatCurrency(provider.hourlyRate)}/hora
                    </span>
                  </div>
                  {getAvailabilityBadge(provider.availability)}
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{provider.description}</p>

                <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                  <Clock className="w-3 h-3" />
                  <span>Respuesta: {provider.responseTime}</span>
                  <span>•</span>
                  <span>{provider.completedJobs} trabajos completados</span>
                </div>

                <div className="flex gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={e => {
                      e.stopPropagation();
                      handleViewProviderDetails(provider);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Ver más detalles
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation();
                      handleContactProvider(provider, 'phone');
                    }}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Llamar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={e => {
                      e.stopPropagation();
                      handleContactProvider(provider, 'message');
                    }}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      handleRequestService(provider);
                    }}
                  >
                    Solicitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron proveedores
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta ajustar tus filtros de búsqueda para encontrar más opciones.
              </p>
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedService('all');
                  setSelectedLocation('all');
                }}
              >
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Service Request Modal */}
        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Solicitar Servicio</DialogTitle>
              <DialogDescription>
                Describe tu solicitud de servicio a {selectedProvider?.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Servicio</label>
                <Input value={getServiceTypeLabel(serviceRequest.serviceType)} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descripción del Servicio *</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe detalladamente el servicio que necesitas..."
                  value={serviceRequest.description}
                  onChange={e =>
                    setServiceRequest(prev => ({ ...prev, description: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Urgencia</label>
                  <Select
                    value={serviceRequest.urgency}
                    onValueChange={(value: ServiceRequest['urgency']) =>
                      setServiceRequest(prev => ({ ...prev, urgency: value }))
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
                  <label className="block text-sm font-medium mb-2">Presupuesto aproximado</label>
                  <Input
                    type="number"
                    placeholder="Opcional"
                    value={serviceRequest.budget || ''}
                    onChange={e =>
                      setServiceRequest(prev => ({
                        ...prev,
                        budget: parseInt(e.target.value) || undefined,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowRequestModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitServiceRequest}>Enviar Solicitud</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Provider Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedProviderDetails && getServiceTypeIcon(selectedProviderDetails.serviceType)}
                {selectedProviderDetails?.name}
                {selectedProviderDetails?.verified && (
                  <Badge className="bg-blue-100 text-blue-800">Verificado</Badge>
                )}
              </DialogTitle>
              <DialogDescription>Información completa del proveedor de servicios</DialogDescription>
            </DialogHeader>

            {selectedProviderDetails && (
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Información General</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Especialidad:</span>
                        <span>{selectedProviderDetails.specialty}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Tipo de servicio:</span>
                        <span>{getServiceTypeLabel(selectedProviderDetails.serviceType)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedProviderDetails.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {formatCurrency(selectedProviderDetails.hourlyRate)}/hora
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-2">Estadísticas</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium">{selectedProviderDetails.rating}</span>
                        <span className="text-gray-500">
                          ({selectedProviderDetails.reviewCount} reseñas)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>Respuesta: {selectedProviderDetails.responseTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>{selectedProviderDetails.completedJobs} trabajos completados</span>
                      </div>
                      <div className="mt-2">
                        {getAvailabilityBadge(selectedProviderDetails.availability)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Descripción del Servicio</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {selectedProviderDetails.description}
                  </p>
                </div>

                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedProviderDetails.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span>{selectedProviderDetails.email}</span>
                    </div>
                  </div>
                </div>

                {/* Reviews Preview */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Últimas Reseñas</h3>
                  <div className="space-y-3">
                    {/* Mock reviews */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm font-medium">Excelente servicio</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        "Muy profesional y puntual. El trabajo quedó perfecto."
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-3 h-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm font-medium">Recomendado</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        "Buena atención y precios competitivos."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleContactProvider(selectedProviderDetails, 'phone')}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Llamar Ahora
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleContactProvider(selectedProviderDetails, 'message')}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </Button>
                  <Button onClick={() => handleRequestService(selectedProviderDetails)}>
                    Solicitar Servicio
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
