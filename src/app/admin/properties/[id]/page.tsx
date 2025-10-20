'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, MapPin, DollarSign, Users, Calendar, Building, Eye } from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { Property } from '@/types';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${params?.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Datos de propiedad recibidos:', {
            title: data.property.title,
            imagesCount: data.property.images?.length || 0,
            images: data.property.images,
          });
          setProperty(data.property);
        }
      } catch (error) {
        console.error('Error loading property:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      loadProperty();
    }
  }, [params?.id]);

  if (loading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!property) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Propiedad no encontrada</div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { label: 'Disponible', className: 'bg-green-100 text-green-800' },
      PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      RENTED: { label: 'Arrendada', className: 'bg-blue-100 text-blue-800' },
      MAINTENANCE: { label: 'Mantenimiento', className: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CL');
  };

  return (
    <UnifiedDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{property.title}</h1>
              <p className="text-gray-600">{property.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(property.status)}
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/properties/${property.id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </div>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Imágenes de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {property.images && property.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {property.images.map((image: string, index: number) => (
                      <div
                        key={index}
                        className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${property.title} - Imagen ${index + 1}`}
                          className="w-full h-full object-cover"
                          onLoad={() => {
                            console.log('✅ Imagen cargada exitosamente:', image);
                          }}
                          onError={e => {
                            console.error('❌ Error cargando imagen:', image);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Building className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay imágenes disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {property.description || 'No hay descripción disponible.'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="font-medium">Precio:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(property.price)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">Ubicación:</span>
                  <span>
                    {property.commune}, {property.city}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Dormitorios:</span>
                    <span className="ml-2">{property.bedrooms}</span>
                  </div>
                  <div>
                    <span className="font-medium">Baños:</span>
                    <span className="ml-2">{property.bathrooms}</span>
                  </div>
                  <div>
                    <span className="font-medium">Área:</span>
                    <span className="ml-2">{property.area} m²</span>
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span>
                    <span className="ml-2">{property.type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Propietario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">ID:</span>
                    <span className="ml-2">{property.ownerId}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/users/${property.ownerId}`)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Perfil
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <span className="font-medium">Creado:</span>
                  <span className="ml-2">{formatDate(property.createdAt)}</span>
                </div>
                <div>
                  <span className="font-medium">Actualizado:</span>
                  <span className="ml-2">{formatDate(property.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
