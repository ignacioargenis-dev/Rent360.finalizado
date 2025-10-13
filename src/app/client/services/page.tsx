'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wrench,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  provider: {
    id: string;
    name: string;
    rating: number;
    reviewCount: number;
    location: string;
  };
  price: {
    amount: number;
    currency: string;
    type: 'fixed' | 'hourly' | 'quote';
  };
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    nextAvailable: string;
  };
  estimatedDuration: string;
  images: string[];
  features: string[];
  requirements: string[];
}

interface ServiceRequest {
  id: string;
  serviceId: string;
  serviceTitle: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  requestedDate: string;
  scheduledDate?: string;
  providerName: string;
  price: number;
  notes: string;
}

export default function ClientServicesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [services, setServices] = useState<Service[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for services
  const mockServices: Service[] = [
    {
      id: '1',
      title: 'Reparación de Grifería Completa',
      description:
        'Servicio profesional de reparación y mantenimiento de griferías, duchas y sistemas de agua.',
      category: 'Plomería',
      provider: {
        id: 'p1',
        name: 'Fontanería Express',
        rating: 4.8,
        reviewCount: 156,
        location: 'Santiago Centro',
      },
      price: {
        amount: 25000,
        currency: 'CLP',
        type: 'fixed',
      },
      availability: {
        status: 'available',
        nextAvailable: '2024-12-06T09:00:00Z',
      },
      estimatedDuration: '1-2 horas',
      images: ['/api/placeholder/400/300'],
      features: [
        'Reparación de fugas',
        'Cambio de griferías',
        'Limpieza de filtros',
        'Presupuesto sin compromiso',
      ],
      requirements: ['Acceso al baño/cocina', 'Agua y electricidad disponibles'],
    },
    {
      id: '2',
      title: 'Mantenimiento Eléctrico Residencial',
      description:
        'Revisión completa del sistema eléctrico, reparación de tomacorrientes y cambio de lámparas.',
      category: 'Electricidad',
      provider: {
        id: 'p2',
        name: 'Servicios Eléctricos Ltda',
        rating: 4.9,
        reviewCount: 203,
        location: 'Providencia',
      },
      price: {
        amount: 35000,
        currency: 'CLP',
        type: 'hourly',
      },
      availability: {
        status: 'busy',
        nextAvailable: '2024-12-07T14:00:00Z',
      },
      estimatedDuration: '2-3 horas',
      images: ['/api/placeholder/400/300'],
      features: [
        'Revisión completa',
        'Reparación de tomacorrientes',
        'Cambio de lámparas',
        'Certificación de seguridad',
      ],
      requirements: ['Acceso a caja de breakers', 'Espacio de trabajo despejado'],
    },
    {
      id: '3',
      title: 'Limpieza Profunda de Hogar',
      description: 'Limpieza completa de todas las habitaciones, baños, cocina y áreas comunes.',
      category: 'Limpieza',
      provider: {
        id: 'p3',
        name: 'Limpieza Express',
        rating: 4.6,
        reviewCount: 89,
        location: 'Las Condes',
      },
      price: {
        amount: 45000,
        currency: 'CLP',
        type: 'fixed',
      },
      availability: {
        status: 'available',
        nextAvailable: '2024-12-06T10:00:00Z',
      },
      estimatedDuration: '4-5 horas',
      images: ['/api/placeholder/400/300'],
      features: [
        'Limpieza profunda',
        'Productos ecológicos',
        'Organización de espacios',
        'Limpieza de electrodomésticos',
      ],
      requirements: ['Llaves de acceso', 'Productos de limpieza básicos disponibles'],
    },
  ];

  const mockServiceRequests: ServiceRequest[] = [
    {
      id: 'r1',
      serviceId: '1',
      serviceTitle: 'Reparación de Grifería Completa',
      status: 'pending',
      requestedDate: '2024-12-05T10:00:00Z',
      providerName: 'Fontanería Express',
      price: 25000,
      notes: 'Grifo de cocina pierde agua constantemente',
    },
    {
      id: 'r2',
      serviceId: '2',
      serviceTitle: 'Mantenimiento Eléctrico Residencial',
      status: 'completed',
      requestedDate: '2024-12-01T14:00:00Z',
      scheduledDate: '2024-12-02T10:00:00Z',
      providerName: 'Servicios Eléctricos Ltda',
      price: 35000,
      notes: 'Cambio de tomacorrientes en sala',
    },
  ];

  useEffect(() => {
    loadServices();
    loadServiceRequests();
  }, [searchQuery, categoryFilter, priceFilter, ratingFilter]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      let filteredServices = mockServices;

      if (searchQuery) {
        filteredServices = filteredServices.filter(
          service =>
            service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            service.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (categoryFilter !== 'all') {
        filteredServices = filteredServices.filter(service => service.category === categoryFilter);
      }

      if (priceFilter !== 'all') {
        filteredServices = filteredServices.filter(service => {
          if (priceFilter === 'low') return service.price.amount <= 30000;
          if (priceFilter === 'medium')
            return service.price.amount > 30000 && service.price.amount <= 50000;
          if (priceFilter === 'high') return service.price.amount > 50000;
          return true;
        });
      }

      if (ratingFilter !== 'all') {
        const minRating = parseFloat(ratingFilter);
        filteredServices = filteredServices.filter(service => service.provider.rating >= minRating);
      }

      setServices(filteredServices);
    } catch (error) {
      logger.error('Error al cargar servicios', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceRequests = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setServiceRequests(mockServiceRequests);
    } catch (error) {
      logger.error('Error al cargar solicitudes de servicio', { error });
    }
  };

  const handleRequestService = (service: Service) => {
    setSelectedService(service);
    setIsRequestDialogOpen(true);
  };

  const submitServiceRequest = async () => {
    if (!selectedService) return;

    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newRequest: ServiceRequest = {
        id: `r${Date.now()}`,
        serviceId: selectedService.id,
        serviceTitle: selectedService.title,
        status: 'pending',
        requestedDate: new Date().toISOString(),
        providerName: selectedService.provider.name,
        price: selectedService.price.amount,
        notes: '',
      };

      setServiceRequests(prev => [newRequest, ...prev]);
      setIsRequestDialogOpen(false);
      setSelectedService(null);

      logger.info('Solicitud de servicio creada exitosamente', {
        serviceId: selectedService.id,
        providerId: selectedService.provider.id,
      });
    } catch (error) {
      logger.error('Error al crear solicitud de servicio', { error });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Disponible</Badge>;
      case 'busy':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Ocupado
          </Badge>
        );
      case 'unavailable':
        return <Badge variant="destructive">No Disponible</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'accepted':
        return <Badge variant="outline">Aceptado</Badge>;
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const categories = [...new Set(mockServices.map(s => s.category))];

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
            <p className="text-gray-600">Explora y solicita servicios profesionales</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Explorar Servicios</TabsTrigger>
            <TabsTrigger value="requests">Mis Solicitudes</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div className="lg:col-span-2">
                    <Label htmlFor="search">Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="search"
                        placeholder="Buscar servicios..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="price">Precio</Label>
                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="low">Hasta $30.000</SelectItem>
                        <SelectItem value="medium">$30.000 - $50.000</SelectItem>
                        <SelectItem value="high">Más de $50.000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rating">Calificación</Label>
                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="4.5">4.5+ estrellas</SelectItem>
                        <SelectItem value="4.0">4.0+ estrellas</SelectItem>
                        <SelectItem value="3.5">3.5+ estrellas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Servicios */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Cargando servicios...</span>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No se encontraron servicios que coincidan con los filtros seleccionados
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{service.title}</CardTitle>
                          <Badge variant="outline" className="mb-2">
                            {service.category}
                          </Badge>
                        </div>
                        {getStatusBadge(service.availability.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>

                      {/* Proveedor */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Wrench className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{service.provider.name}</p>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600">
                                {service.provider.rating} ({service.provider.reviewCount} reseñas)
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-green-100 border border-green-300 rounded-lg p-2 mb-1">
                            <p className="text-lg font-bold text-green-700">
                              {service.price.type === 'hourly'
                                ? `${formatCurrency(service.price.amount)}/hora`
                                : service.price.type === 'quote'
                                  ? 'Cotización'
                                  : formatCurrency(service.price.amount)}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">{service.estimatedDuration}</p>
                        </div>
                      </div>

                      {/* Características */}
                      <div>
                        <p className="text-sm font-medium mb-2">Características principales:</p>
                        <div className="flex flex-wrap gap-1">
                          {service.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Botones */}
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1">
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{service.title}</DialogTitle>
                              <DialogDescription>{service.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Proveedor</Label>
                                  <p className="text-sm">{service.provider.name}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="text-sm">{service.provider.rating}</span>
                                  </div>
                                </div>
                                <div>
                                  <Label>Precio</Label>
                                  <p className="text-sm font-semibold text-green-600">
                                    {service.price.type === 'hourly'
                                      ? `${formatCurrency(service.price.amount)}/hora`
                                      : formatCurrency(service.price.amount)}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <Label>Características</Label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {service.features.map((feature, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {feature}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label>Requisitos</Label>
                                <ul className="text-sm text-gray-600 mt-1 space-y-1">
                                  {service.requirements.map((req, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      {req}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRequestService(service)}
                          disabled={service.availability.status === 'unavailable'}
                        >
                          Solicitar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Solicitudes de Servicio</CardTitle>
              </CardHeader>
              <CardContent>
                {serviceRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No tienes solicitudes de servicio aún
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Servicio</TableHead>
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Fecha Solicitud</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {serviceRequests.map(request => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">{request.serviceTitle}</TableCell>
                            <TableCell>{request.providerName}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>
                              {new Date(request.requestedDate).toLocaleDateString('es-CL')}
                            </TableCell>
                            <TableCell>{formatCurrency(request.price)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  Ver Detalles
                                </Button>
                                {request.status === 'pending' && (
                                  <Button variant="outline" size="sm" className="text-red-600">
                                    Cancelar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog para solicitar servicio */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Servicio</DialogTitle>
              <DialogDescription>
                Confirma los detalles de tu solicitud de servicio
              </DialogDescription>
            </DialogHeader>
            {selectedService && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">{selectedService.title}</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Proveedor: {selectedService.provider.name}
                  </p>
                  <div className="mt-3 p-3 bg-white rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedService.price.type === 'hourly'
                          ? 'Precio por hora:'
                          : selectedService.price.type === 'quote'
                            ? 'Tipo:'
                            : 'Precio:'}
                      </span>
                      <span className="text-lg font-bold text-green-700">
                        {selectedService.price.type === 'hourly'
                          ? `${formatCurrency(selectedService.price.amount)}/hora`
                          : selectedService.price.type === 'quote'
                            ? 'Cotización personalizada'
                            : formatCurrency(selectedService.price.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-600">Duración estimada:</span>
                      <span className="font-medium text-gray-800">
                        {selectedService.estimatedDuration}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">
                    * El precio final puede variar según la complejidad del trabajo
                  </div>
                </div>

                <div>
                  <Label htmlFor="requestNotes">Notas adicionales (opcional)</Label>
                  <textarea
                    id="requestNotes"
                    className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    rows={3}
                    placeholder="Describe detalles específicos del problema o requerimientos adicionales..."
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsRequestDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button onClick={submitServiceRequest} className="flex-1">
                    Confirmar Solicitud
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
