'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  BarChart3,
  DollarSign,
  MapPin,
  Bed,
  Bath,
  Home,
  Car,
  Wifi,
  PawPrint,
  Eye,
  FileText,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  city?: string;
  commune?: string;
  type: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  description: string;
  availableFrom?: string;
  status: string;
  latitude?: number;
  longitude?: number;
  ownerId?: string;
  ownerName?: string;
  ownerRating?: number;
  ownerTotalRatings?: number;
  brokerId?: string;
  brokerName?: string;
  brokerRating?: number;
  brokerTotalRatings?: number;
}

interface ComparisonMetric {
  label: string;
  key: keyof Property;
  format: 'currency' | 'number' | 'text' | 'features' | 'rating';
  icon: React.ReactNode;
}

export default function TenantPropertyComparisonPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadComparisonData = async () => {
      try {
        // Obtener IDs de propiedades desde sessionStorage
        const comparisonData = sessionStorage.getItem('propertyComparison');
        if (!comparisonData) {
          setError('No se encontraron propiedades para comparar');
          setLoading(false);
          return;
        }

        const { properties: propertyIds } = JSON.parse(comparisonData);
        if (!propertyIds || propertyIds.length === 0) {
          setError('No se encontraron propiedades para comparar');
          setLoading(false);
          return;
        }

        // Cargar detalles de cada propiedad desde la API
        const propertyPromises = propertyIds.map(async (id: string) => {
          try {
            const response = await fetch(`/api/properties/${id}`, {
              credentials: 'include',
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.property) {
                const property = data.property;

                // Cargar calificaciones del propietario y broker
                let ownerRating = 0;
                let ownerTotalRatings = 0;
                let brokerRating = 0;
                let brokerTotalRatings = 0;

                if (property.ownerId) {
                  try {
                    const ownerRatingResponse = await fetch(
                      `/api/ratings/summary/${property.ownerId}`,
                      { credentials: 'include' }
                    );
                    if (ownerRatingResponse.ok) {
                      const ownerRatingData = await ownerRatingResponse.json();
                      if (ownerRatingData.success && ownerRatingData.data) {
                        ownerRating = ownerRatingData.data.averageRating || 0;
                        ownerTotalRatings = ownerRatingData.data.totalRatings || 0;
                      }
                    }
                  } catch (err) {
                    logger.warn('Error loading owner rating:', {
                      ownerId: property.ownerId,
                      error: err,
                    });
                  }
                }

                if (property.brokerId) {
                  try {
                    const brokerRatingResponse = await fetch(
                      `/api/ratings/summary/${property.brokerId}`,
                      { credentials: 'include' }
                    );
                    if (brokerRatingResponse.ok) {
                      const brokerRatingData = await brokerRatingResponse.json();
                      if (brokerRatingData.success && brokerRatingData.data) {
                        brokerRating = brokerRatingData.data.averageRating || 0;
                        brokerTotalRatings = brokerRatingData.data.totalRatings || 0;
                      }
                    }
                  } catch (err) {
                    logger.warn('Error loading broker rating:', {
                      brokerId: property.brokerId,
                      error: err,
                    });
                  }
                }

                return {
                  id: property.id,
                  title: property.title || 'Sin título',
                  address: property.address || '',
                  city: property.city,
                  commune: property.commune,
                  type: property.type || '',
                  price: property.price || 0,
                  bedrooms: property.bedrooms || 0,
                  bathrooms: property.bathrooms || 0,
                  area: property.area || 0,
                  images: Array.isArray(property.images)
                    ? property.images
                    : property.images
                      ? JSON.parse(property.images)
                      : ['/placeholder-property.jpg'],
                  features: Array.isArray(property.features)
                    ? property.features
                    : property.features
                      ? JSON.parse(property.features)
                      : [],
                  description: property.description || '',
                  availableFrom: property.availableFrom || property.availableDate,
                  status: property.status || 'AVAILABLE',
                  latitude: property.latitude,
                  longitude: property.longitude,
                  ownerId: property.ownerId,
                  ownerName: property.owner?.name || property.ownerName || null,
                  ownerRating,
                  ownerTotalRatings,
                  brokerId: property.brokerId,
                  brokerName: property.broker?.name || property.brokerName || null,
                  brokerRating,
                  brokerTotalRatings,
                };
              }
            }
            return null;
          } catch (err) {
            logger.error('Error loading property:', { id, error: err });
            return null;
          }
        });

        const loadedProperties = (await Promise.all(propertyPromises)).filter(
          (p): p is Property => p !== null
        );

        if (loadedProperties.length === 0) {
          setError('No se pudieron cargar las propiedades para comparar');
        } else {
          setProperties(loadedProperties);
        }
      } catch (err) {
        logger.error('Error loading comparison data:', err);
        setError('Error al cargar los datos de comparación');
      } finally {
        setLoading(false);
      }
    };

    loadComparisonData();
  }, []);

  const handleExportComparison = () => {
    if (properties.length === 0) {
      setSuccessMessage('No hay propiedades para exportar');
      setTimeout(() => setSuccessMessage(''), 3000);
      return;
    }

    try {
      // Generate CSV comparison
      const csvRows = [
        [
          'Título',
          'Dirección',
          'Tipo',
          'Precio',
          'Habitaciones',
          'Baños',
          'Superficie (m²)',
          'Características',
          'Estado',
        ].join(','),
        ...properties.map(property =>
          [
            `"${property.title}"`,
            `"${property.address}"`,
            `"${property.type}"`,
            property.price.toString(),
            property.bedrooms.toString(),
            property.bathrooms.toString(),
            property.area.toString(),
            `"${property.features.join('; ')}"`,
            `"${property.status}"`,
          ].join(',')
        ),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `comparacion_propiedades_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage('Comparación de propiedades exportada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setSuccessMessage('Error al exportar la comparación');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const formatValue = (value: any, format: string, property?: Property): string => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-CL', {
          style: 'currency',
          currency: 'CLP',
          minimumFractionDigits: 0,
        }).format(value);
      case 'number':
        return value.toLocaleString('es-CL');
      case 'features':
        if (Array.isArray(value)) {
          return value.length > 0 ? value.join(', ') : 'Ninguna';
        }
        return 'Ninguna';
      case 'rating':
        if (value === 0 || value === null || value === undefined) {
          return 'Sin calificaciones';
        }
        return `${value.toFixed(1)} ⭐`;
      case 'text':
      default:
        return value || 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-red-100 text-red-800">Mantenimiento</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getFeatureIcon = (feature: string) => {
    const featureLower = feature.toLowerCase();
    if (featureLower.includes('estacionamiento') || featureLower.includes('parking')) {
      return <Car className="w-4 h-4" />;
    }
    if (featureLower.includes('wifi') || featureLower.includes('internet')) {
      return <Wifi className="w-4 h-4" />;
    }
    if (featureLower.includes('mascota') || featureLower.includes('pet')) {
      return <PawPrint className="w-4 h-4" />;
    }
    return <CheckCircle className="w-4 h-4" />;
  };

  const renderStars = (rating: number, totalRatings?: number) => {
    if (rating === 0) {
      return <span className="text-gray-400 text-sm">Sin calificaciones</span>;
    }
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= Math.round(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">
          {rating.toFixed(1)} {totalRatings ? `(${totalRatings})` : ''}
        </span>
      </div>
    );
  };

  const comparisonMetrics: ComparisonMetric[] = [
    {
      label: 'Precio Mensual',
      key: 'price',
      format: 'currency',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      label: 'Habitaciones',
      key: 'bedrooms',
      format: 'number',
      icon: <Bed className="w-4 h-4" />,
    },
    {
      label: 'Baños',
      key: 'bathrooms',
      format: 'number',
      icon: <Bath className="w-4 h-4" />,
    },
    {
      label: 'Superficie (m²)',
      key: 'area',
      format: 'number',
      icon: <Home className="w-4 h-4" />,
    },
    {
      label: 'Tipo',
      key: 'type',
      format: 'text',
      icon: <Home className="w-4 h-4" />,
    },
    {
      label: 'Ubicación',
      key: 'address',
      format: 'text',
      icon: <MapPin className="w-4 h-4" />,
    },
    {
      label: 'Características',
      key: 'features',
      format: 'features',
      icon: <CheckCircle className="w-4 h-4" />,
    },
    {
      label: 'Calificación Propietario',
      key: 'ownerRating',
      format: 'rating',
      icon: <Star className="w-4 h-4" />,
    },
    {
      label: 'Calificación Broker',
      key: 'brokerRating',
      format: 'rating',
      icon: <Star className="w-4 h-4" />,
    },
    {
      label: 'Estado',
      key: 'status',
      format: 'text',
      icon: <AlertCircle className="w-4 h-4" />,
    },
  ];

  const handleViewProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Comparación de Propiedades" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando propiedades para comparar...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Comparación de Propiedades" subtitle="Error">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => router.push('/tenant/advanced-search')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Búsqueda
            </Button>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  if (properties.length === 0) {
    return (
      <UnifiedDashboardLayout title="Comparación de Propiedades" subtitle="Sin propiedades">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay propiedades para comparar
            </h3>
            <p className="text-gray-600 mb-4">
              Selecciona propiedades en la búsqueda avanzada para compararlas.
            </p>
            <Button onClick={() => router.push('/tenant/advanced-search')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Búsqueda
            </Button>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Comparación de Propiedades"
      subtitle="Compara propiedades para encontrar la mejor opción"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Comparación de Propiedades</h1>
            <p className="text-gray-600">
              Compara las características de las propiedades seleccionadas
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/tenant/advanced-search')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Búsqueda
            </Button>
            <Button variant="outline" onClick={handleExportComparison}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar Comparación
            </Button>
          </div>
        </div>

        {/* Property Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {properties.map(property => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={property.images[0] || '/placeholder-property.jpg'}
                  alt={property.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute top-2 right-2">{getStatusBadge(property.status)}</div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{property.title}</h3>
                <p className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.address}
                </p>
                <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {property.bedrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bath className="w-4 h-4" />
                    {property.bathrooms}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="w-4 h-4" />
                    {property.area} m²
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-blue-600">
                    ${property.price.toLocaleString('es-CL')}
                  </span>
                  <Badge variant="secondary">{property.type}</Badge>
                </div>
                {(property.ownerRating > 0 || property.brokerRating > 0) && (
                  <div className="mb-3 space-y-2">
                    {property.ownerRating > 0 && property.ownerName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Propietario:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(property.ownerRating, property.ownerTotalRatings)}
                        </div>
                      </div>
                    )}
                    {property.brokerRating > 0 && property.brokerName && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Broker:</span>
                        <div className="flex items-center gap-1">
                          {renderStars(property.brokerRating, property.brokerTotalRatings)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button className="w-full" onClick={() => handleViewProperty(property.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comparación Detallada</CardTitle>
            <CardDescription>
              Compara las características clave de las propiedades seleccionadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Característica
                    </th>
                    {properties.map(property => (
                      <th
                        key={property.id}
                        className="text-center py-3 px-4 font-medium text-gray-900 min-w-[150px]"
                      >
                        {property.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonMetrics.map(metric => (
                    <tr key={metric.key} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="text-gray-500">{metric.icon}</div>
                          <span className="font-medium text-gray-900">{metric.label}</span>
                        </div>
                      </td>
                      {properties.map(property => {
                        const value = property[metric.key];
                        const formattedValue = formatValue(value, metric.format, property);

                        let valueColor = 'text-gray-900';
                        if (metric.key === 'price') {
                          // Encontrar el precio más bajo y más alto
                          const prices = properties.map(p => p.price);
                          const minPrice = Math.min(...prices);
                          const maxPrice = Math.max(...prices);
                          if (property.price === minPrice) {
                            valueColor = 'text-green-600 font-bold';
                          } else if (property.price === maxPrice) {
                            valueColor = 'text-red-600';
                          }
                        } else if (metric.key === 'ownerRating' || metric.key === 'brokerRating') {
                          // Colores para calificaciones
                          if (value >= 4.5) {
                            valueColor = 'text-green-600 font-bold';
                          } else if (value >= 4.0) {
                            valueColor = 'text-green-500';
                          } else if (value >= 3.5) {
                            valueColor = 'text-yellow-500';
                          } else if (value > 0) {
                            valueColor = 'text-orange-500';
                          } else {
                            valueColor = 'text-gray-400';
                          }
                        }

                        return (
                          <td key={property.id} className="text-center py-4 px-4">
                            {metric.format === 'features' ? (
                              <div className="flex flex-wrap gap-1 justify-center">
                                {Array.isArray(value) && value.length > 0 ? (
                                  value.slice(0, 3).map((feature: string, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {getFeatureIcon(feature)}
                                      <span className="ml-1">{feature}</span>
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-gray-400">Ninguna</span>
                                )}
                                {Array.isArray(value) && value.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{value.length - 3} más
                                  </Badge>
                                )}
                              </div>
                            ) : metric.format === 'rating' ? (
                              <div className="flex flex-col items-center gap-1">
                                {renderStars(
                                  value || 0,
                                  metric.key === 'ownerRating'
                                    ? property.ownerTotalRatings
                                    : property.brokerTotalRatings
                                )}
                                {metric.key === 'ownerRating' && property.ownerName && (
                                  <span className="text-xs text-gray-500">
                                    {property.ownerName}
                                  </span>
                                )}
                                {metric.key === 'brokerRating' && property.brokerName && (
                                  <span className="text-xs text-gray-500">
                                    {property.brokerName}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`font-medium ${valueColor}`}>{formattedValue}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(
                      properties.reduce((sum, p) => sum + p.price, 0) / properties.length,
                      'currency'
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Superficie Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(
                      Math.round(
                        properties.reduce((sum, p) => sum + p.area, 0) / properties.length
                      ),
                      'number'
                    )}{' '}
                    m²
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Habitaciones Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatValue(
                      Math.round(
                        properties.reduce((sum, p) => sum + p.bedrooms, 0) / properties.length
                      ),
                      'number'
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bed className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
