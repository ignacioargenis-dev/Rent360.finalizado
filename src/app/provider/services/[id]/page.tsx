'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Edit,
  Eye,
  EyeOff,
  DollarSign,
  Clock,
  MapPin,
  CheckCircle,
  Star,
  Users,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  shortDescription: string;
  pricing: {
    type: 'fixed' | 'hourly' | 'quote';
    amount: number;
    currency: string;
    minimumCharge?: number;
  };
  duration: {
    estimated: string;
    unit: 'minutes' | 'hours' | 'days';
  };
  features: string[];
  requirements: string[];
  availability: {
    active: boolean;
    regions: string[];
    emergency: boolean;
  };
  images: string[];
  tags: string[];
  stats: {
    views: number;
    requests: number;
    conversionRate: number;
    averageRating: number;
    totalReviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const serviceId = params.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingActive, setIsTogglingActive] = useState(false);

  // Mock service data
  const mockService: Service = {
    id: serviceId,
    name: 'Reparación de Grifería Completa',
    category: 'Fontanería',
    description:
      'Servicio profesional completo de reparación e instalación de griferías en baños y cocinas. Incluye diagnóstico, reparación de fugas, cambio de piezas defectuosas y limpieza final.',
    shortDescription: 'Reparación profesional de griferías con garantía incluida',
    pricing: {
      type: 'fixed',
      amount: 25000,
      currency: 'CLP',
      minimumCharge: 15000,
    },
    duration: {
      estimated: '1-2',
      unit: 'hours',
    },
    features: [
      'Diagnóstico completo del problema',
      'Reparación de fugas y goteos',
      'Cambio de piezas defectuosas',
      'Limpieza y prueba final',
      'Garantía de 6 meses',
    ],
    requirements: [
      'Acceso al baño o cocina',
      'Corte de agua disponible si es necesario',
      'Espacio de trabajo despejado',
    ],
    availability: {
      active: true,
      regions: ['Metropolitana', 'Valparaíso', "O'Higgins"],
      emergency: false,
    },
    images: ['/api/placeholder/400/300', '/api/placeholder/400/300'],
    tags: ['grifería', 'baño', 'cocina', 'reparación', 'fontanería'],
    stats: {
      views: 145,
      requests: 12,
      conversionRate: 8.3,
      averageRating: 4.7,
      totalReviews: 8,
    },
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-05T15:30:00Z',
  };

  useEffect(() => {
    loadService();
  }, [serviceId]);

  const loadService = async () => {
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setService(mockService);
    } catch (error) {
      logger.error('Error al cargar servicio', { error, serviceId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!service) return;

    setIsTogglingActive(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setService(prev =>
        prev
          ? {
              ...prev,
              availability: {
                ...prev.availability,
                active: !prev.availability.active,
              },
            }
          : null
      );

      logger.info('Estado del servicio actualizado', {
        serviceId,
        active: !service.availability.active,
      });
    } catch (error) {
      logger.error('Error al cambiar estado del servicio', { error, serviceId });
    } finally {
      setIsTogglingActive(false);
    }
  };

  const handleEdit = () => {
    router.push(`/provider/services/${serviceId}/edit`);
  };

  const handleCancel = () => {
    router.push('/provider/services');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: service?.pricing.currency || 'CLP',
    }).format(amount);
  };

  const getPricingDisplay = () => {
    if (!service) return '';

    if (service.pricing.type === 'hourly') {
      return `${formatCurrency(service.pricing.amount)}/hora`;
    } else if (service.pricing.type === 'quote') {
      return 'Cotización personalizada';
    } else {
      let display = formatCurrency(service.pricing.amount);
      if (service.pricing.minimumCharge && service.pricing.minimumCharge > service.pricing.amount) {
        display += ` (mínimo ${formatCurrency(service.pricing.minimumCharge)})`;
      }
      return display;
    }
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando servicio...</span>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!service) {
    return (
      <UnifiedDashboardLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center py-12 text-gray-500">No se pudo cargar el servicio</div>
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
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline">{service.category}</Badge>
                  <Badge className={service.availability.active ? 'bg-green-500' : 'bg-red-500'}>
                    {service.availability.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                  {service.availability.emergency && (
                    <Badge variant="destructive">Emergencias</Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleToggleActive} disabled={isTogglingActive}>
                  {service.availability.active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Activar
                    </>
                  )}
                </Button>
                <Button onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vistas</p>
                  <p className="text-2xl font-bold text-blue-600">{service.stats.views}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Solicitudes</p>
                  <p className="text-2xl font-bold text-green-600">{service.stats.requests}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversión</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {service.stats.conversionRate}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {service.stats.averageRating}
                  </p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">{service.description}</p>

                {/* Imágenes */}
                {service.images.length > 0 && (
                  <div>
                    <Label className="text-base font-medium">Imágenes del Servicio</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {service.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Características y Requisitos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Características
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Requisitos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Etiquetas */}
            {service.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Etiquetas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel Lateral */}
          <div className="space-y-6">
            {/* Precios y Duración */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{getPricingDisplay()}</p>
                  <p className="text-sm text-gray-600 capitalize">{service.pricing.type}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>
                      Duración estimada: {service.duration.estimated} {service.duration.unit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Disponibilidad */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${service.availability.active ? 'bg-green-500' : 'bg-red-500'}`}
                  ></div>
                  <span className="text-sm font-medium">
                    {service.availability.active ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {service.availability.emergency && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Servicio de Emergencias
                  </Badge>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Regiones atendidas:</p>
                  <div className="flex flex-wrap gap-1">
                    {service.availability.regions.map(region => (
                      <Badge key={region} variant="outline" className="text-xs">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Adicional */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="text-sm font-medium">
                    {new Date(service.createdAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Última actualización</p>
                  <p className="text-sm font-medium">
                    {new Date(service.updatedAt).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID del servicio</p>
                  <p className="text-xs font-mono text-gray-500">{service.id}</p>
                </div>
              </CardContent>
            </Card>

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleEdit} className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Servicio
                </Button>
                <Button
                  variant="outline"
                  onClick={handleToggleActive}
                  disabled={isTogglingActive}
                  className="w-full"
                >
                  {service.availability.active ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      Desactivar Servicio
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      Activar Servicio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
