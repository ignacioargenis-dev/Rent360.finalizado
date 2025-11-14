'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MapPin,
  Bed,
  Bath,
  Square,
  Car,
  Wifi,
  Shield,
  Heart,
  Share2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Home,
  Camera,
  Star,
  Users,
  Clock,
} from 'lucide-react';
import { logger } from '@/lib/logger-minimal';

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  commune: string;
  region: string;
  price: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: string;
  status: string;
  features: string[];
  images: string[];
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  averageRating: number;
  totalReviews: number;
  views: number;
  inquiries: number;
  createdAt: string;
  updatedAt: string;
}

export default function PublicPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params?.id as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      setIsAuthenticated(response.ok);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const loadPropertyDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`);

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.success && responseData.property) {
          setProperty(responseData.property);
          logger.info('Property details loaded', {
            propertyId,
            hasImages: responseData.property.images?.length || 0,
          });
        } else {
          setError('Error al cargar los detalles de la propiedad');
        }

        // Incrementar vistas automáticamente
        try {
          await fetch(`/api/properties/${propertyId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'increment_views' }),
          });
        } catch (viewError) {
          logger.error('Error incrementing views', { error: viewError, propertyId });
        }
      } else if (response.status === 404) {
        setError('Propiedad no encontrada');
      } else {
        setError('Error al cargar los detalles de la propiedad');
      }
    } catch (error) {
      logger.error('Error loading property details', { error, propertyId });
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    checkAuthStatus();
    loadPropertyDetails();
  }, [propertyId, loadPropertyDetails]);

  const handleContact = async () => {
    // Incrementar consultas
    try {
      await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'increment_inquiries' }),
      });
    } catch (error) {
      logger.error('Error incrementing inquiries', { error, propertyId });
    }

    if (isAuthenticated) {
      // Usuario autenticado - obtener información del propietario y crear conversación
      try {
        // Obtener información del propietario desde la propiedad
        const ownerInfo = property?.owner;

        if (ownerInfo) {
          // Crear datos del destinatario para la conversación
          const recipientData = {
            id: ownerInfo.id,
            name: ownerInfo.name || 'Propietario',
            email: ownerInfo.email || '',
            type: 'owner',
            propertyId: propertyId,
            propertyTitle: property?.title || 'Propiedad',
            propertyAddress: property?.address || 'Dirección no disponible',
          };

          // Guardar en sessionStorage para la página de mensajes
          sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));

          // Redirigir a la página de mensajes del inquilino
          router.push('/tenant/messages?new=true');
        } else {
          // Si no hay información del propietario, intentar obtenerla de la API
          const response = await fetch(`/api/properties/${propertyId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          });

          if (response.ok) {
            const propertyData = await response.json();
            const owner = propertyData.owner || propertyData.property?.owner;

            if (owner) {
              const recipientData = {
                id: owner.id,
                name: owner.name || 'Propietario',
                email: owner.email || '',
                type: 'owner',
                propertyId: propertyId,
                propertyTitle: propertyData.title || 'Propiedad',
                propertyAddress: propertyData.address || 'Dirección no disponible',
              };

              sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
              router.push('/tenant/messages?new=true');
            } else {
              alert('No se pudo obtener la información del propietario');
            }
          } else {
            alert('Error al obtener información del propietario');
          }
        }
      } catch (error) {
        logger.error('Error al contactar propietario:', { error, propertyId });
        alert('Error al establecer contacto con el propietario');
      }
    } else {
      // Usuario no autenticado - redirigir a login
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  };

  const handleScheduleVisit = async () => {
    // Incrementar consultas
    try {
      await fetch(`/api/properties/${propertyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'increment_inquiries' }),
        credentials: 'include',
      });
    } catch (error) {
      logger.error('Error incrementing inquiries', { error, propertyId });
    }

    if (isAuthenticated) {
      // Usuario autenticado - solicitar visita de Runner360
      try {
        // Obtener información del usuario actual
        const userResponse = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!userResponse.ok) {
          alert(
            'Error al obtener información del usuario. Por favor, intenta iniciar sesión nuevamente.'
          );
          router.push('/auth/login');
          return;
        }

        const userData = await userResponse.json();
        const currentUser = userData.user;

        // Verificar que el usuario es inquilino
        if (currentUser.role !== 'TENANT') {
          alert('Solo los inquilinos pueden solicitar visitas de Runner360.');
          return;
        }

        // Mostrar confirmación informativa sobre visibilidad de documentos
        const confirmMessage = `Al solicitar una visita Runner360, el administrador de la propiedad (propietario o corredor) podrá revisar tus documentos personales para evaluar tu solicitud. Esto incluye documentos de identificación, comprobantes de ingresos y referencias que hayas subido a la plataforma.\n\n¿Deseas continuar con la solicitud?`;

        if (!confirm(confirmMessage)) {
          return; // Usuario canceló
        }

        // Solicitar visita de Runner360 usando la nueva API
        const visitResponse = await fetch('/api/tenant/visits/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            propertyId: propertyId,
            preferredDate: null, // Se puede agregar un selector de fecha después
            preferredTime: null,
            notes: `Solicitud de visita Runner360 para la propiedad "${property?.title}"`,
          }),
        });

        if (visitResponse.ok) {
          const result = await visitResponse.json();
          alert(
            result.message ||
              '¡Solicitud de visita Runner360 enviada exitosamente! El propietario o corredor será notificado y asignará un Runner360 para realizar la visita profesional.'
          );
          logger.info('Runner360 visit request sent successfully', {
            propertyId,
            userId: currentUser.id,
            visitId: result.visit?.id,
          });
        } else {
          const errorData = await visitResponse.json();
          alert(`Error al enviar la solicitud: ${errorData.error || 'Error desconocido'}`);
          logger.error('Error sending Runner360 visit request', {
            error: errorData,
            propertyId,
            userId: currentUser.id,
          });
        }
      } catch (error) {
        logger.error('Error in handleScheduleVisit', { error, propertyId });
        alert('Error al procesar la solicitud de visita. Por favor, intenta nuevamente.');
      }
    } else {
      // Usuario no autenticado - redirigir a login
      alert('Para solicitar una visita Runner360, necesitas iniciar sesión como inquilino.');
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
    }
  };

  const nextImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property?.images && property.images.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + property.images.length) % property.images.length);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title || 'Propiedad en Rent360',
        text: 'Mira esta propiedad que encontré en Rent360',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-red-100 text-red-800">Arrendada</Badge>;
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Mantenimiento</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando detalles de la propiedad...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Propiedad no encontrada</h1>
          <p className="text-gray-600 mb-4">{error || 'La propiedad que buscas no existe'}</p>
          <Button
            onClick={() => {
              const searchState = sessionStorage.getItem('advancedSearchState');
              if (searchState || document.referrer.includes('/tenant/advanced-search')) {
                router.push('/tenant/advanced-search');
              } else {
                router.push('/properties/search');
              }
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la búsqueda
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Intentar restaurar el estado de búsqueda desde sessionStorage
                  const searchState = sessionStorage.getItem('advancedSearchState');
                  if (searchState) {
                    try {
                      const state = JSON.parse(searchState);
                      // Redirigir a advanced-search con el estado guardado
                      router.push('/tenant/advanced-search');
                      // Restaurar el estado después de un pequeño delay para asegurar que la página se carga
                      setTimeout(() => {
                        sessionStorage.setItem('advancedSearchState', searchState);
                      }, 100);
                    } catch (e) {
                      // Si hay error, simplemente ir a advanced-search
                      router.push('/tenant/advanced-search');
                    }
                  } else {
                    // Si no hay estado guardado, verificar si venimos de advanced-search
                    const referrer = document.referrer;
                    if (referrer.includes('/tenant/advanced-search')) {
                      router.push('/tenant/advanced-search');
                    } else {
                      router.push('/properties/search');
                    }
                  }
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                <p className="text-gray-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {property.address}, {property.commune}, {property.city}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              <Button variant="outline">
                <Heart className="w-4 h-4 mr-2" />
                Guardar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {property.images && property.images.length > 0 ? (
                    <>
                      <img
                        src={property.images[currentImageIndex]}
                        alt={`${property.title} ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={e => {
                          logger.error('Error loading image:', {
                            image: property.images[currentImageIndex],
                            error: e,
                          });
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />

                      {/* Navegación de imágenes */}
                      {property.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
                          >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </button>

                          {/* Indicadores de imagen */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                            {property.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex
                                    ? 'bg-white'
                                    : 'bg-white bg-opacity-50'
                                }`}
                              />
                            ))}
                          </div>

                          {/* Contador de imágenes */}
                          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {currentImageIndex + 1} / {property.images.length}
                          </div>
                        </>
                      )}
                    </>
                  ) : null}
                  {(!property.images || property.images.length === 0) && (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <Home className="w-16 h-16 text-blue-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">{getStatusBadge(property.status)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Dormitorios</p>
                    <p className="font-semibold">{property.bedrooms || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Baños</p>
                    <p className="font-semibold">{property.bathrooms || 0}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Square className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Superficie</p>
                    <p className="font-semibold">{property.area || 0} m²</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Home className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm text-gray-600">Tipo</p>
                    <p className="font-semibold">{property.type}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-gray-700">{property.description}</p>
                </div>

                {property.features && property.features.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Características</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Precio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">
                    ${(property.price || 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600">por mes</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">
                    ${(property.deposit || 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600">depósito</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleContact}>
                    <Phone className="w-4 h-4 mr-2" />
                    Contactar
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleScheduleVisit}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Solicitar Visita
                  </Button>
                </div>
                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 text-center">
                    Inicia sesión para contactar al propietario
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Property Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Vistas</span>
                  </div>
                  <span className="font-semibold">{property.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Consultas</span>
                  </div>
                  <span className="font-semibold">{property.inquiries || 0}</span>
                </div>
                {(property.averageRating || 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">Calificación</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">
                        {(property.averageRating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">({property.totalReviews || 0})</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
