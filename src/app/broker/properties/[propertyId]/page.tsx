'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Eye,
  RefreshCw,
  Camera,
  Home,
  Users,
  Star,
  TrendingUp,
  PieChart,
  BarChart3,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';
import VirtualTour360 from '@/components/virtual-tour/VirtualTour360';

interface PropertyDetail {
  id: string;
  title: string;
  address: string;
  city: string;
  region: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  price: number;
  currency: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  description: string;
  features: string[];
  images: string[];
  currentTenant?: {
    name: string;
    email: string;
    phone: string;
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
  };
  maintenanceHistory: MaintenanceRecord[];
  financialData: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    occupancyRate: number;
    averageRating: number;
  };
  documents: Document[];
  notes: Note[];
  viewings: Viewing[];

  // Tour virtual
  virtualTourEnabled: boolean;
  virtualTourData: string | null;
}

interface MaintenanceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  status: 'completed' | 'pending' | 'in_progress';
  provider?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

interface Note {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  type: 'general' | 'maintenance' | 'tenant' | 'financial';
}

interface Viewing {
  id: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
}

export default function BrokerPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params?.propertyId as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for property details
  const mockProperty: PropertyDetail = {
    id: propertyId,
    title: 'Hermoso Apartamento en Providencia',
    address: 'Av. Providencia 123',
    city: 'Santiago',
    region: 'Metropolitana',
    type: 'Apartamento',
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    price: 450000,
    currency: 'CLP',
    status: 'rented',
    ownerName: 'Carlos Rodríguez',
    ownerEmail: 'carlos.rodriguez@email.com',
    ownerPhone: '+56 9 8765 4321',
    description:
      'Amplio apartamento de 2 dormitorios en excelente ubicación. Cercano a metro, supermercados y centros comerciales.',
    features: [
      'Estacionamiento',
      'Bodega',
      'Gimnasio',
      'Piscina',
      'Conserje 24/7',
      'Seguridad',
      'Terraza',
    ],
    images: [
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
      '/api/placeholder/600/400',
    ],
    currentTenant: {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+56 9 1234 5678',
      leaseStart: '2024-01-15',
      leaseEnd: '2025-01-14',
      monthlyRent: 450000,
    },
    maintenanceHistory: [
      {
        id: '1',
        date: '2024-11-15',
        type: 'Plomería',
        description: 'Reparación de fuga en grifería del baño',
        cost: 35000,
        status: 'completed',
        provider: 'Fontanería Express',
      },
      {
        id: '2',
        date: '2024-10-20',
        type: 'Electricidad',
        description: 'Revisión completa del sistema eléctrico',
        cost: 45000,
        status: 'completed',
        provider: 'Servicios Eléctricos Ltda',
      },
      {
        id: '3',
        date: '2024-12-01',
        type: 'Limpieza',
        description: 'Limpieza profunda antes de nueva temporada',
        cost: 55000,
        status: 'pending',
        provider: 'Limpieza Express',
      },
    ],
    financialData: {
      monthlyRevenue: 450000,
      yearlyRevenue: 5400000,
      occupancyRate: 95,
      averageRating: 4.7,
    },
    documents: [
      {
        id: '1',
        name: 'Título de Propiedad.pdf',
        type: 'PDF',
        uploadDate: '2024-01-01',
        size: '3.2 MB',
      },
      {
        id: '2',
        name: 'Certificado de Avalúo.pdf',
        type: 'PDF',
        uploadDate: '2024-01-05',
        size: '1.5 MB',
      },
      {
        id: '3',
        name: 'Contrato de Administración.pdf',
        type: 'PDF',
        uploadDate: '2024-01-10',
        size: '2.1 MB',
      },
    ],
    notes: [
      {
        id: '1',
        content: 'Propiedad en excelente estado. Inquilino muy responsable.',
        createdBy: 'Broker System',
        createdAt: '2024-12-01',
        type: 'general',
      },
      {
        id: '2',
        content: 'Renovación de contrato pendiente para enero 2025.',
        createdBy: 'Broker System',
        createdAt: '2024-11-15',
        type: 'tenant',
      },
    ],
    viewings: [
      {
        id: '1',
        date: '2024-12-10',
        time: '15:00',
        clientName: 'Ana López',
        clientEmail: 'ana.lopez@email.com',
        clientPhone: '+56 9 5555 1234',
        status: 'scheduled',
        notes: 'Cliente interesado en mudarse pronto',
      },
      {
        id: '2',
        date: '2024-11-28',
        time: '11:00',
        clientName: 'Pedro Martínez',
        clientEmail: 'pedro.martinez@email.com',
        clientPhone: '+56 9 4444 5678',
        status: 'completed',
        notes: 'Cliente hizo oferta inicial',
      },
    ],

    // Tour virtual
    virtualTourEnabled: false,
    virtualTourData: null,
  };

  useEffect(() => {
    loadPropertyDetails();
  }, [propertyId]);

  const loadPropertyDetails = async () => {
    console.log('🔍 [PROPERTY_DETAIL] Iniciando carga de detalles de la propiedad:', { propertyId });
    setIsLoading(true);
    try {
      // ✅ CORREGIDO: Cargar datos reales de la API
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${baseUrl}/api/properties/${propertyId}`;
      console.log('🔗 [PROPERTY_DETAIL] URL de la API:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      console.log('📡 [PROPERTY_DETAIL] Respuesta recibida:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('📊 [PROPERTY_DETAIL] Datos recibidos:', {
          success: responseData.success,
          hasProperty: !!responseData.property,
          propertyId: responseData.property?.id,
          title: responseData.property?.title
        });

        if (!responseData.success || !responseData.property) {
          logger.error('Invalid response format from API', { responseData });
          setError('Error al cargar los datos de la propiedad');
          return;
        }

        const propertyData = responseData.property;

        logger.info('Datos de propiedad recibidos del API', {
          propertyId,
          hasTitle: !!propertyData.title,
          hasAddress: !!propertyData.address,
          hasPrice: !!propertyData.price,
          hasImages: !!(propertyData.images && propertyData.images.length > 0),
          imageCount: propertyData.images ? propertyData.images.length : 0,
          images: propertyData.images ? propertyData.images.slice(0, 3) : [], // Primeras 3 URLs
          propertyDataKeys: Object.keys(propertyData),
        });

        // Transformar datos de la API al formato esperado
        const transformedProperty: PropertyDetail = {
          id: propertyData.id,
          title: propertyData.title || 'Sin título',
          address: propertyData.address || 'Sin dirección',
          city: propertyData.city || 'Sin ciudad',
          region: propertyData.region || 'Sin región',
          type: propertyData.type || 'Sin tipo',
          bedrooms: propertyData.bedrooms || 0,
          bathrooms: propertyData.bathrooms || 0,
          area: propertyData.area || 0,
          price: propertyData.price || 0,
          currency: propertyData.currency || 'CLP',
          status: propertyData.status || 'available',
          ownerName: propertyData.owner?.name || 'Propietario',
          ownerEmail: propertyData.owner?.email || '',
          ownerPhone: propertyData.owner?.phone || '',
          description: propertyData.description || 'Sin descripción',
          features: propertyData.features || [],
          images:
            propertyData.images && propertyData.images.length > 0
              ? propertyData.images
              : ['/api/placeholder/600/400'], // Fallback a placeholder si no hay imágenes
          currentTenant: propertyData.currentTenant || null,
          maintenanceHistory: propertyData.maintenanceHistory || [],
          financialData: propertyData.financialData || {
            monthlyRevenue: propertyData.price || 0,
            yearlyRevenue: (propertyData.price || 0) * 12,
            occupancyRate: propertyData.status === 'rented' ? 100 : 0,
            averageRating: propertyData.averageRating || 0,
          },
          documents: propertyData.documents || [],
          notes: propertyData.notes || '',
          viewings: propertyData.viewings || [],

          // Tour virtual
          virtualTourEnabled: propertyData.virtualTourEnabled || false,
          virtualTourData: propertyData.virtualTourData || null,
        };

        logger.info('Propiedad transformada correctamente', {
          id: transformedProperty.id,
          title: transformedProperty.title,
          address: transformedProperty.address,
          price: transformedProperty.price,
          hasImages: !!(transformedProperty.images && transformedProperty.images.length > 0),
          imageCount: transformedProperty.images ? transformedProperty.images.length : 0,
          images: transformedProperty.images ? transformedProperty.images.slice(0, 3) : [],
        });

        setProperty(transformedProperty);
      } else {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error('❌ [PROPERTY_DETAIL] Error al cargar propiedad:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          errorText,
          propertyId
        });
        
        logger.error('Error al cargar detalles de la propiedad', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        setError(`Error ${response.status}: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('❌ [PROPERTY_DETAIL] Error crítico:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        propertyId
      });
      logger.error('Error al cargar detalles de la propiedad', { error, propertyId });
      setError('Error al cargar los detalles de la propiedad. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactOwner = (method: 'email' | 'phone') => {
    if (!property) {
      return;
    }

    if (method === 'email') {
      window.open(
        `mailto:${property.ownerEmail}?subject=Consulta sobre propiedad ${property.title}`,
        '_blank'
      );
    } else {
      window.open(`tel:${property.ownerPhone}`, '_blank');
    }

    logger.info('Contacto con propietario iniciado', { propertyId, method });
  };

  const handleContactTenant = (method: 'email' | 'phone') => {
    if (!property?.currentTenant) {
      return;
    }

    if (method === 'email') {
      window.open(
        `mailto:${property.currentTenant.email}?subject=Consulta sobre propiedad ${property.title}`,
        '_blank'
      );
    } else {
      window.open(`tel:${property.currentTenant.phone}`, '_blank');
    }

    logger.info('Contacto con inquilino iniciado', { propertyId, method });
  };

  const handleDownloadDocument = (documentId: string) => {
    // Simulate document download
    const link = document.createElement('a');
    link.href = `/api/properties/${propertyId}/documents/${documentId}/download`;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Documento descargado', { propertyId, documentId });
  };

  const handleEditProperty = () => {
    router.push(`/broker/properties/${propertyId}/edit`);
  };

  const handleScheduleViewing = () => {
    router.push(`/broker/viewings/new?propertyId=${propertyId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-500">Disponible</Badge>;
      case 'rented':
        return <Badge className="bg-blue-500">Arrendada</Badge>;
      case 'maintenance':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Mantenimiento
          </Badge>
        );
      case 'inactive':
        return <Badge variant="secondary">Inactiva</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completado</Badge>;
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Pendiente
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            En Progreso
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getViewingStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Programada
          </Badge>
        );
      case 'completed':
        return <Badge className="bg-green-500">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      case 'no_show':
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            No Asistió
          </Badge>
        );
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando detalles de la propiedad...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error al cargar propiedad</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!property) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Propiedad no encontrada</h2>
            <p className="text-gray-600 mb-4">
              La propiedad solicitada no existe o no tienes permisos para verla.
            </p>
            <Button onClick={() => router.push('/broker/properties')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Propiedades
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/broker/properties')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
              <p className="text-gray-600 flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {property.address}, {property.city}, {property.region}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditProperty}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleScheduleViewing}>
              <Calendar className="w-4 h-4 mr-2" />
              Programar Visita
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/broker/properties/${propertyId}/virtual-tour`)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Tour Virtual
            </Button>
          </div>
        </div>

        {/* Status and Quick Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getStatusBadge(property.status)}
            <span className="text-sm text-gray-600">
              {property.bedrooms} dorm. • {property.bathrooms} baño • {property.area} m²
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{property.financialData.averageRating}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleContactOwner('email')}>
              <Mail className="w-4 h-4 mr-2" />
              Contactar Propietario
            </Button>
            {property.currentTenant && (
              <Button variant="outline" size="sm" onClick={() => handleContactTenant('email')}>
                <Mail className="w-4 h-4 mr-2" />
                Contactar Inquilino
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="tenant">Inquilino</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
            <TabsTrigger value="viewings">Visitas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Property Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Imágenes de la Propiedad
                </CardTitle>
              </CardHeader>
              <CardContent>
                {property.images && property.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {property.images.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="aspect-video bg-gray-200 rounded-lg overflow-hidden relative group"
                      >
                        <img
                          src={image}
                          alt={`Propiedad ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onLoad={() => {
                            logger.info('✅ Imagen cargada exitosamente (broker):', image);
                          }}
                          onError={e => {
                            logger.error('❌ Error cargando imagen (broker):', image);
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                        />
                        {/* Fallback para imágenes que no cargan */}
                        <div
                          className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 text-sm font-medium"
                          style={{ display: 'none' }}
                        >
                          <div className="text-center">
                            <Camera className="w-6 h-6 mx-auto mb-1" />
                            <span>Imagen no disponible</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay imágenes disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Virtual Tour */}
            {property.virtualTourEnabled && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Tour Virtual 360°
                  </CardTitle>
                  <CardDescription>
                    Explora la propiedad con nuestro tour virtual interactivo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <VirtualTour360 propertyId={property.id} scenes={[]} />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Property Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Información de la Propiedad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo</label>
                      <p className="text-lg font-semibold">{property.type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Precio Mensual</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(property.price)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Dormitorios</label>
                      <p>{property.bedrooms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Baños</label>
                      <p>{property.bathrooms}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Superficie</label>
                      <p>{property.area} m²</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tasa Ocupación</label>
                      <p className="font-semibold text-blue-600">
                        {property.financialData.occupancyRate}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium text-gray-600">Descripción</label>
                    <p className="mt-1 text-gray-700">{property.description}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Características</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {property.features.map((feature, index) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del Propietario
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/api/placeholder/150/150" alt={property.ownerName} />
                      <AvatarFallback>
                        {property.ownerName
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{property.ownerName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="w-4 h-4" />
                        {property.ownerEmail}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {property.ownerPhone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Ingresos Mensuales
                      </label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(property.financialData.monthlyRevenue)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Ingresos Anuales</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(property.financialData.yearlyRevenue)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumen Financiero
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(property.financialData.monthlyRevenue)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ingresos Anuales</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(property.financialData.yearlyRevenue)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tasa Ocupación</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {property.financialData.occupancyRate}%
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Star className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Calificación Promedio</p>
                    <p className="text-xl font-bold text-purple-600">
                      {property.financialData.averageRating}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenant" className="space-y-6">
            {property.currentTenant ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Inquilino Actual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage
                          src="/api/placeholder/150/150"
                          alt={property.currentTenant.name}
                        />
                        <AvatarFallback>
                          {property.currentTenant.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{property.currentTenant.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          {property.currentTenant.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {property.currentTenant.phone}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Renta Mensual</label>
                        <p className="text-lg font-semibold">
                          {formatCurrency(property.currentTenant.monthlyRent)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Fecha de Inicio</label>
                        <p>{formatDate(property.currentTenant.leaseStart)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          Fecha de Término
                        </label>
                        <p>{formatDate(property.currentTenant.leaseEnd)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Días Restantes</label>
                        <p className="font-semibold">
                          {Math.ceil(
                            (new Date(property.currentTenant.leaseEnd).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones del Inquilino</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button variant="outline" onClick={() => handleContactTenant('email')}>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Email
                      </Button>
                      <Button variant="outline" onClick={() => handleContactTenant('phone')}>
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar por Teléfono
                      </Button>
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Contrato
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Enviar Mensaje
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin Inquilino Actual</h3>
                  <p className="text-gray-600 mb-4">
                    Esta propiedad no tiene un inquilino asignado actualmente.
                  </p>
                  <Button onClick={handleScheduleViewing}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Programar Primera Visita
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.maintenanceHistory.map(maintenance => (
                    <div
                      key={maintenance.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatDate(maintenance.date)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{maintenance.type}</p>
                          <p className="text-sm text-gray-600">{maintenance.description}</p>
                          {maintenance.provider && (
                            <p className="text-xs text-gray-500">
                              Proveedor: {maintenance.provider}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(maintenance.cost)}</p>
                        </div>
                        {getMaintenanceStatusBadge(maintenance.status)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumen de Mantenimiento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Mantenimientos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {property.maintenanceHistory.length}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Costo Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(
                        property.maintenanceHistory.reduce((sum, m) => sum + m.cost, 0)
                      )}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">Costo Promedio</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(
                        property.maintenanceHistory.reduce((sum, m) => sum + m.cost, 0) /
                          property.maintenanceHistory.length
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos de la Propiedad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            {doc.type} • {doc.size} • Subido: {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Historial de Visitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {property.viewings.map(viewing => (
                    <div key={viewing.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>
                              {viewing.clientName
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{viewing.clientName}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(viewing.date)} a las {viewing.time}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getViewingStatusBadge(viewing.status)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {viewing.clientEmail}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {viewing.clientPhone}
                        </span>
                      </div>

                      {viewing.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{viewing.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
