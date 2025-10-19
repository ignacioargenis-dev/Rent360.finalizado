'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
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
  Upload,
  Home,
  Users,
  Star,
  TrendingUp,
  PieChart,
  BarChart3,
  Wrench,
  Settings,
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
  monthlyRent: number;
  currency: string;
  status: 'available' | 'rented' | 'maintenance' | 'inactive';
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
  broker?: {
    name: string;
    email: string;
    phone: string;
    commission: number;
  };
  maintenanceHistory: MaintenanceRecord[];
  financialData: {
    monthlyRevenue: number;
    yearlyRevenue: number;
    occupancyRate: number;
    maintenanceCosts: number;
    netIncome: number;
  };
  documents: Document[];
  notes: Note[];

  // Nuevos campos de características
  furnished: boolean;
  petFriendly: boolean;
  parkingSpaces: number;
  availableFrom: Date;
  floor?: number | null;
  buildingName?: string | null;
  yearBuilt?: number | null;

  // Características del edificio/servicios
  heating: boolean;
  cooling: boolean;
  internet: boolean;
  elevator: boolean;
  balcony: boolean;
  terrace: boolean;
  garden: boolean;
  pool: boolean;
  gym: boolean;
  security: boolean;
  concierge: boolean;

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

export default function OwnerPropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

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
    monthlyRent: 450000,
    currency: 'CLP',
    status: 'rented',
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
    broker: {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@broker.com',
      phone: '+56 9 8765 4321',
      commission: 67500,
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
      maintenanceCosts: 135000,
      netIncome: 4065000,
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
        createdBy: 'Owner',
        createdAt: '2024-12-01',
        type: 'general',
      },
      {
        id: '2',
        content: 'Renovación de contrato pendiente para enero 2025.',
        createdBy: 'Owner',
        createdAt: '2024-11-15',
        type: 'tenant',
      },
    ],

    // Nuevos campos de características de propiedad
    furnished: true,
    petFriendly: true,
    parkingSpaces: 1,
    availableFrom: new Date('2024-01-15'),
    floor: 8,
    buildingName: 'Torre Providencia',
    yearBuilt: 2018,
    heating: true,
    cooling: true,
    internet: true,
    elevator: true,
    balcony: true,
    terrace: false,
    garden: false,
    pool: true,
    gym: true,
    security: true,
    concierge: false,

    // Tour virtual
    virtualTourEnabled: false,
    virtualTourData: null,
  };

  const loadPropertyDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      // ✅ CORREGIDO: Cargar datos reales de la API
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/properties/${propertyId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const responseData = await response.json();

        if (!responseData.success || !responseData.property) {
          logger.error('Invalid response format from API', { responseData });
          setError('Error al cargar los datos de la propiedad');
          return;
        }

        const propertyData = responseData.property;

        // Transformar datos de la API al formato esperado
        const transformedProperty: PropertyDetail = {
          id: propertyData.id,
          title: propertyData.title,
          address: propertyData.address,
          city: propertyData.city,
          region: propertyData.region,
          type: propertyData.type,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area: propertyData.area,
          monthlyRent: propertyData.price,
          currency: 'CLP', // Valor fijo ya que no existe en el esquema
          status: propertyData.status,
          description: propertyData.description,
          features: propertyData.features || [],
          images:
            propertyData.images && propertyData.images.length > 0
              ? propertyData.images
              : ['/api/placeholder/600/400'], // Fallback a placeholder si no hay imágenes
          currentTenant: propertyData.currentTenant || null,
          broker: propertyData.broker || null,
          maintenanceHistory: propertyData.maintenanceHistory || [],
          financialData: propertyData.financialData || {
            monthlyRevenue: propertyData.price || 0,
            yearlyRevenue: (propertyData.price || 0) * 12,
            occupancyRate: propertyData.status === 'rented' ? 100 : 0,
            maintenanceCosts: 0,
            netIncome: propertyData.price || 0,
          },
          documents: propertyData.documents || [],
          notes: propertyData.notes || [],
          furnished: propertyData.furnished || false,
          petFriendly: propertyData.petFriendly || false,
          parkingSpaces: propertyData.parkingSpaces || 0,
          availableFrom: propertyData.availableFrom
            ? new Date(propertyData.availableFrom)
            : new Date(),
          floor: propertyData.floor,
          buildingName: propertyData.buildingName,
          yearBuilt: propertyData.yearBuilt,

          // Características del edificio/servicios
          heating: propertyData.heating || false,
          cooling: propertyData.cooling || false,
          internet: propertyData.internet || false,
          elevator: propertyData.elevator || false,
          balcony: propertyData.balcony || false,
          terrace: propertyData.terrace || false,
          garden: propertyData.garden || false,
          pool: propertyData.pool || false,
          gym: propertyData.gym || false,
          security: propertyData.security || false,
          concierge: propertyData.concierge || false,

          // Tour virtual
          virtualTourEnabled: propertyData.virtualTourEnabled || false,
          virtualTourData: propertyData.virtualTourData || null,
        };

        setProperty(transformedProperty);
      } else {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Error loading property:', {
          status: response.status,
          statusText: response.statusText,
          propertyId,
          errorData,
        });
        setError(`Error al cargar los datos: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      logger.error('Error al cargar detalles de la propiedad', { error, propertyId });
      setError('Error de conexión al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadPropertyDetails();
  }, [loadPropertyDetails]);

  // Recargar datos cuando se navega desde la página de edición
  useEffect(() => {
    const handleFocus = () => {
      // Recargar datos cuando la ventana recupera el foco (viene de otra página)
      loadPropertyDetails();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadPropertyDetails]);

  const handleContactBroker = (method: 'email' | 'phone') => {
    if (!property?.broker) {
      return;
    }

    if (method === 'email') {
      window.open(
        `mailto:${property.broker.email}?subject=Consulta sobre propiedad ${property.title}`,
        '_blank'
      );
    } else {
      window.open(`tel:${property.broker.phone}`, '_blank');
    }

    logger.info('Contacto con broker iniciado', { propertyId, method });
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

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !property) {
      return;
    }

    setIsUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('propertyId', property.id);
      formData.append('type', 'PROPERTY_DOCUMENT');

      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/documents/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        // Recargar los datos de la propiedad para mostrar el nuevo documento
        await loadPropertyDetails();
        logger.info('Document uploaded successfully');
      } else {
        logger.error('Error uploading document:', response.statusText);
      }
    } catch (error) {
      logger.error('Error uploading document:', error);
    } finally {
      setIsUploadingDocument(false);
      // Limpiar el input
      event.target.value = '';
    }
  };

  const handleEditProperty = () => {
    router.push(`/owner/properties/${propertyId}/edit`);
  };

  const handleRequestMaintenance = () => {
    router.push(`/owner/maintenance/new?propertyId=${propertyId}`);
  };

  const handleViewContract = () => {
    if (property?.currentTenant) {
      // Buscar el contrato activo para esta propiedad
      router.push(`/owner/contracts?propertyId=${propertyId}`);
    } else {
      alert('Esta propiedad no tiene un contrato activo.');
    }
  };

  const handleSendMessage = () => {
    if (property?.currentTenant) {
      router.push(
        `/owner/messages/new?recipientEmail=${encodeURIComponent(property.currentTenant.email)}&propertyId=${propertyId}`
      );
    } else {
      alert('Esta propiedad no tiene un inquilino asignado.');
    }
  };

  const handleViewPayments = () => {
    if (property?.currentTenant) {
      router.push(
        `/owner/payments?propertyId=${propertyId}&tenantEmail=${encodeURIComponent(property.currentTenant.email)}`
      );
    } else {
      alert('Esta propiedad no tiene un inquilino asignado.');
    }
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

  if (isLoading) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="w-8 h-8 animate-spin mr-2" />
          <span>Cargando datos de la propiedad...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
          <AlertTriangle className="w-12 h-12 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-center mb-4">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => loadPropertyDetails()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Button onClick={() => router.push('/owner/properties')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Propiedades
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
            <Button onClick={() => router.push('/owner/properties')}>
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
            <Button variant="outline" onClick={() => router.push('/owner/properties')}>
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
            <Button variant="outline" onClick={loadPropertyDetails} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={handleEditProperty}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleRequestMaintenance}>
              <Wrench className="w-4 h-4 mr-2" />
              Solicitar Mantenimiento
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
          </div>
          <div className="flex gap-2">
            {property.broker && (
              <Button variant="outline" size="sm" onClick={() => handleContactBroker('email')}>
                <Mail className="w-4 h-4 mr-2" />
                Contactar Broker
              </Button>
            )}
            {property.currentTenant && (
              <Button variant="outline" size="sm" onClick={() => handleContactTenant('email')}>
                <Mail className="w-4 h-4 mr-2" />
                Contactar Inquilino
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="tenant">Inquilino</TabsTrigger>
            <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {property.images.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`Propiedad ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Virtual Tour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Tour Virtual 360°
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={property.virtualTourEnabled ? 'default' : 'secondary'}>
                      {property.virtualTourEnabled ? 'Habilitado' : 'Deshabilitado'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/owner/properties/${property.id}/virtual-tour`)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Configurar
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {property.virtualTourEnabled
                    ? 'Explora la propiedad con nuestro tour virtual interactivo'
                    : 'Configura un tour virtual 360° para mostrar tu propiedad'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {property.virtualTourEnabled ? (
                  <VirtualTour360 propertyId={property.id} scenes={[]} />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">Tour Virtual No Configurado</p>
                    <p className="text-sm mb-4">
                      Configura un tour virtual 360° para ofrecer una experiencia inmersiva a tus
                      inquilinos
                    </p>
                    <Button
                      onClick={() => router.push(`/owner/properties/${property.id}/virtual-tour`)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Configurar Tour Virtual
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

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
                      <label className="text-sm font-medium text-gray-600">Renta Mensual</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(property.monthlyRent)}
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

              {/* Broker Information */}
              {property.broker && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Información del Broker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src="/api/placeholder/150/150" alt={property.broker.name} />
                        <AvatarFallback>
                          {property.broker.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">{property.broker.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          {property.broker.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {property.broker.phone}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <label className="text-sm font-medium text-gray-600">Comisión</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(property.broker.commission)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                    <p className="text-sm text-gray-600">Costos Mantenimiento</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {formatCurrency(property.financialData.maintenanceCosts)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <PieChart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Ingreso Neto</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatCurrency(property.financialData.netIncome)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <Home className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Tasa Ocupación</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {property.financialData.occupancyRate}%
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
                      <Button variant="outline" onClick={handleViewContract}>
                        <FileText className="w-4 h-4 mr-2" />
                        Ver Contrato
                      </Button>
                      <Button variant="outline" onClick={handleSendMessage}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Enviar Mensaje
                      </Button>
                      <Button variant="outline" onClick={handleViewPayments}>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Ver Pagos
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
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Buscar Inquilino
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
                <CardDescription>
                  Documentos legales y administrativos de la propiedad (solo visibles para quienes
                  celebran un contrato)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Subir Documento</h3>
                  <p className="text-gray-600 mb-4">
                    Arrastra y suelta archivos o haz clic para seleccionar
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Label htmlFor="document-upload" className="cursor-pointer">
                      <Button variant="outline" asChild>
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingDocument ? 'Subiendo...' : 'Seleccionar Archivo'}
                        </span>
                      </Button>
                      <Input
                        id="document-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleDocumentUpload}
                        disabled={isUploadingDocument}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos aceptados: PDF, DOC, DOCX, JPG, PNG. Tamaño máximo: 10MB.
                  </p>
                </div>

                {/* Documents List */}
                {property.documents && property.documents.length > 0 ? (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Documentos Subidos</h4>
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
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hay documentos subidos para esta propiedad</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
