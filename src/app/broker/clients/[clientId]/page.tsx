'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  Star,
  TrendingUp,
  PieChart,
  BarChart3,
  Users,
  Home,
  FileText as DocumentIcon,
  Share2,
  Plus,
  Heart,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface ClientDetail {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone: string;
  type: 'tenant' | 'owner' | 'both';
  status: 'active' | 'inactive' | 'prospect';
  registrationDate: string;
  lastContact: string;
  preferredContactMethod: 'email' | 'phone' | 'whatsapp';
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  preferences: {
    propertyType: string[];
    bedrooms: number;
    bathrooms: number;
    location: string[];
    features: string[];
  };
  documents: Document[];
  interactions: Interaction[];
  properties: ClientProperty[];
  contracts: ClientContract[];
  financialData: {
    totalSpent: number;
    averageRating: number;
    contractCount: number;
    satisfactionScore: number;
  };
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
  category: 'identification' | 'financial' | 'contract' | 'other';
}

interface Interaction {
  id: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'visit' | 'message';
  description: string;
  outcome: string;
  duration?: number;
  createdBy: string;
}

interface ClientProperty {
  id: string;
  title: string;
  address: string;
  status: 'interested' | 'viewed' | 'offered' | 'rented' | 'rejected';
  viewDate?: string;
  offerAmount?: number;
  notes?: string;
}

interface ClientContract {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  status: 'active' | 'completed' | 'terminated';
  commission: number;
}

export default function BrokerClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const clientId = params?.clientId as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newInteraction, setNewInteraction] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharingProperty, setSharingProperty] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [sharedProperties, setSharedProperties] = useState<any[]>([]);
  const [favoriteProperties, setFavoriteProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Mock data for client details
  const mockClient: ClientDetail = {
    id: clientId,
    clientId: clientId,
    name: 'Ana López',
    email: 'ana.lopez@email.com',
    phone: '+56 9 5555 1234',
    type: 'tenant',
    status: 'active',
    registrationDate: '2024-06-15',
    lastContact: '2024-12-01',
    preferredContactMethod: 'whatsapp',
    budget: {
      min: 300000,
      max: 600000,
      currency: 'CLP',
    },
    preferences: {
      propertyType: ['Apartamento', 'Casa'],
      bedrooms: 2,
      bathrooms: 1,
      location: ['Providencia', 'Las Condes', 'Vitacura'],
      features: ['Estacionamiento', 'Bodega', 'Gimnasio'],
    },
    documents: [
      {
        id: '1',
        name: 'Cédula de Identidad.pdf',
        type: 'PDF',
        uploadDate: '2024-06-15',
        size: '2.3 MB',
        category: 'identification',
      },
      {
        id: '2',
        name: 'Certificado de Trabajo.pdf',
        type: 'PDF',
        uploadDate: '2024-06-15',
        size: '1.8 MB',
        category: 'financial',
      },
      {
        id: '3',
        name: 'Referencias Laborales.pdf',
        type: 'PDF',
        uploadDate: '2024-06-16',
        size: '1.2 MB',
        category: 'other',
      },
    ],
    interactions: [
      {
        id: '1',
        date: '2024-12-01',
        type: 'call',
        description: 'Llamada para confirmar interés en apartamento de Providencia',
        outcome: 'Cliente interesado, programar visita',
        duration: 15,
        createdBy: 'Broker System',
      },
      {
        id: '2',
        date: '2024-11-28',
        type: 'email',
        description: 'Envío de propiedades disponibles según presupuesto',
        outcome: 'Cliente revisó propiedades, pidió más información',
        createdBy: 'Broker System',
      },
      {
        id: '3',
        date: '2024-11-20',
        type: 'meeting',
        description: 'Reunión presencial para conocer requerimientos',
        outcome: 'Definidas preferencias y presupuesto',
        duration: 45,
        createdBy: 'Broker System',
      },
    ],
    properties: [
      {
        id: '1',
        title: 'Hermoso Apartamento en Providencia',
        address: 'Av. Providencia 123, Santiago',
        status: 'viewed',
        viewDate: '2024-12-05',
        notes: 'Le gustó mucho la ubicación y amenities',
      },
      {
        id: '2',
        title: 'Casa Moderna en Las Condes',
        address: 'Av. Las Condes 456, Santiago',
        status: 'interested',
        notes: 'Precio un poco alto, pero le interesa',
      },
      {
        id: '3',
        title: 'Apartamento Centro Histórico',
        address: 'Calle Estado 789, Santiago',
        status: 'rejected',
        notes: 'Ubicación no conveniente para su trabajo',
      },
    ],
    contracts: [
      {
        id: '1',
        propertyTitle: 'Hermoso Apartamento en Providencia',
        propertyAddress: 'Av. Providencia 123, Santiago',
        startDate: '2024-01-15',
        endDate: '2025-01-14',
        monthlyRent: 450000,
        status: 'active',
        commission: 67500,
      },
    ],
    financialData: {
      totalSpent: 5400000,
      averageRating: 4.8,
      contractCount: 1,
      satisfactionScore: 95,
    },
  };

  useEffect(() => {
    loadClientDetails();
    loadAvailableProperties();
  }, [clientId]);

  useEffect(() => {
    if (client) {
      loadClientProperties();
    }
  }, [client]);

  const loadAvailableProperties = async () => {
    try {
      // Cargar todas las propiedades (propias y gestionadas) disponibles o en cualquier estado
      const response = await fetch('/api/broker/properties?status=all&limit=100', {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.properties) {
          setAvailableProperties(data.properties);
        } else if (data.data) {
          setAvailableProperties(data.data);
        }
      }
    } catch (error) {
      logger.error('Error loading available properties:', error);
    }
  };

  const loadClientProperties = async () => {
    if (!client) {
      return;
    }

    setLoadingProperties(true);
    try {
      // Cargar propiedades compartidas
      const sharedResponse = await fetch(`/api/broker/clients/${clientId}/share-property`, {
        credentials: 'include',
      });

      if (sharedResponse.ok) {
        const sharedData = await sharedResponse.json();
        if (sharedData.success && sharedData.data) {
          setSharedProperties(sharedData.data);
        }
      }

      // Cargar propiedades favoritas del cliente (si es inquilino)
      if (client.type === 'tenant' || client.type === 'both') {
        try {
          const favoritesResponse = await fetch(`/api/broker/clients/${clientId}/favorites`, {
            credentials: 'include',
          });

          if (favoritesResponse.ok) {
            const favoritesData = await favoritesResponse.json();
            if (favoritesData.success && favoritesData.data) {
              setFavoriteProperties(favoritesData.data);
            }
          }
        } catch (error) {
          logger.warn('Error loading favorites:', error);
        }
      }
    } catch (error) {
      logger.error('Error loading client properties:', error);
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleShareProperty = async () => {
    if (!selectedPropertyId) {
      toast.error('Selecciona una propiedad');
      return;
    }

    try {
      setSharingProperty(true);
      const response = await fetch(`/api/broker/clients/${clientId}/share-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          message: shareMessage || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Propiedad compartida exitosamente');
        setShowShareDialog(false);
        setSelectedPropertyId('');
        setShareMessage('');
        loadClientDetails(); // Recargar para actualizar datos
      } else {
        toast.error(data.error || 'Error al compartir propiedad');
      }
    } catch (error) {
      logger.error('Error sharing property:', error);
      toast.error('Error al compartir propiedad');
    } finally {
      setSharingProperty(false);
    }
  };

  const loadClientDetails = async () => {
    setIsLoading(true);
    try {
      // Obtener datos reales desde la API
      logger.info('Cargando detalles del cliente', { clientId });
      const response = await fetch(`/api/broker/clients/${clientId}`, {
        method: 'GET',
        credentials: 'include', // ✅ CRÍTICO: Incluir cookies para autenticación
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      logger.info('Respuesta de la API', { status: response.status, ok: response.ok });

      if (response.ok) {
        const result = await response.json();
        logger.info('Datos de la API', { result });
        if (result.success) {
          setClient(result.data);
          setIsLoading(false);
          return;
        } else {
          logger.error('API retornó success: false', { result });
        }
      } else {
        const errorText = await response.text();
        logger.error('API retornó error', { status: response.status, errorText });
      }

      // Solo usar datos mock como último recurso
      logger.warn('API falló completamente, usando datos mock como fallback');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClient(mockClient);
    } catch (error) {
      logger.error('Error al cargar detalles del cliente', { error, clientId });
      // Fallback a datos mock en caso de error de red
      setClient(mockClient);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClient = (method: 'email' | 'phone' | 'whatsapp') => {
    if (!client) {
      return;
    }

    if (method === 'email') {
      window.open(`mailto:${client.email}?subject=Consulta sobre propiedades`, '_blank');
    } else if (method === 'phone') {
      window.open(`tel:${client.phone}`, '_blank');
    } else {
      // Abrir sistema de mensajería interno
      router.push(
        `/broker/messages?new=true&recipient=${client.clientId}&subject=Consulta sobre propiedades&message=Hola! Tengo algunas propiedades que podrían interesarte.`
      );
    }

    logger.info('Contacto con cliente iniciado', { clientId, method });
  };

  const handleDownloadDocument = (documentId: string) => {
    // Simulate document download
    const link = document.createElement('a');
    link.href = `/api/clients/${clientId}/documents/${documentId}/download`;
    link.download = 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Documento descargado', { clientId, documentId });
  };

  const handleAddInteraction = () => {
    if (!newInteraction.trim() || !client) {
      return;
    }

    const interaction: Interaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'message',
      description: newInteraction,
      outcome: 'Nota agregada',
      createdBy: user?.name || 'Broker',
    };

    setClient(prev =>
      prev
        ? {
            ...prev,
            interactions: [interaction, ...prev.interactions],
            lastContact: new Date().toISOString(),
          }
        : null
    );

    setNewInteraction('');
    logger.info('Interacción agregada al cliente', { clientId });
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/broker/properties/${propertyId}`);
  };

  const handleViewContract = (contractId: string) => {
    router.push(`/broker/contracts/${contractId}`);
  };

  const handleEditClient = () => {
    router.push(`/broker/clients/${clientId}/edit`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'prospect':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Prospecto
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    // Manejar tanto mayúsculas como minúsculas para compatibilidad
    const normalizedType = type?.toLowerCase() || '';
    switch (normalizedType) {
      case 'tenant':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Inquilino
          </Badge>
        );
      case 'owner':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Propietario
          </Badge>
        );
      case 'both':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Ambos
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getPropertyStatusBadge = (status: string) => {
    switch (status) {
      case 'interested':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Interesado
          </Badge>
        );
      case 'viewed':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            Visto
          </Badge>
        );
      case 'offered':
        return (
          <Badge variant="outline" className="text-purple-600 border-purple-600">
            Oferta Enviada
          </Badge>
        );
      case 'rented':
        return <Badge className="bg-green-500">Arrendado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'completed':
        return <Badge variant="secondary">Completado</Badge>;
      case 'terminated':
        return <Badge variant="destructive">Terminado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="w-4 h-4" />;
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'visit':
        return <Home className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
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
          <span>Cargando detalles del cliente...</span>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (!client) {
    return (
      <UnifiedDashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Cliente no encontrado</h2>
            <p className="text-gray-600 mb-4">
              El cliente solicitado no existe o no tienes permisos para verlo.
            </p>
            <Button onClick={() => router.push('/broker/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Clientes
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
            <Button variant="outline" onClick={() => router.push('/broker/clients')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                {getTypeBadge(client.type)}
                <span>• Registrado: {formatDate(client.registrationDate)}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEditClient}>
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() => handleContactClient(client.preferredContactMethod)}
            >
              {client.preferredContactMethod === 'email' && <Mail className="w-4 h-4 mr-2" />}
              {client.preferredContactMethod === 'phone' && <Phone className="w-4 h-4 mr-2" />}
              {client.preferredContactMethod === 'whatsapp' && (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              Contactar
            </Button>
          </div>
        </div>

        {/* Status and Quick Info */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {getStatusBadge(client.status)}
            <span className="text-sm text-gray-600">
              Último contacto: {formatDate(client.lastContact)}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{client.financialData.averageRating}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleContactClient('email')}>
              <Mail className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleContactClient('phone')}>
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleContactClient('whatsapp')}>
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="properties">Propiedades</TabsTrigger>
            <TabsTrigger value="contracts">Contratos</TabsTrigger>
            <TabsTrigger value="interactions">Interacciones</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información Personal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src="/api/placeholder/150/150" alt={client.name} />
                      <AvatarFallback>
                        {client.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{client.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Mail className="w-4 h-4" />
                        {client.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo de Cliente</label>
                      <p className="font-semibold">
                        {client.type?.toLowerCase() === 'tenant'
                          ? 'Inquilino'
                          : client.type?.toLowerCase() === 'both'
                            ? 'Ambos'
                            : 'Propietario'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Método de Contacto
                      </label>
                      <p className="font-semibold capitalize">{client.preferredContactMethod}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Fecha de Registro</label>
                      <p>{formatDate(client.registrationDate)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Último Contacto</label>
                      <p>{formatDate(client.lastContact)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              {(client.type?.toLowerCase() === 'tenant' ||
                client.type?.toLowerCase() === 'both') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preferencias de Búsqueda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {client.budget && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Presupuesto</label>
                        <p className="text-lg font-semibold">
                          {formatCurrency(client.budget.min)} - {formatCurrency(client.budget.max)}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-600">Tipo de Propiedad</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {client.preferences.propertyType.map((type, index) => (
                          <Badge key={index} variant="outline">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Dormitorios</label>
                        <p>{client.preferences.bedrooms}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Baños</label>
                        <p>{client.preferences.bathrooms}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        Ubicaciones Preferidas
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {client.preferences.location.map((location, index) => (
                          <Badge key={index} variant="outline">
                            {location}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Características</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {client.preferences.features.map((feature, index) => (
                          <Badge key={index} variant="outline">
                            {feature}
                          </Badge>
                        ))}
                      </div>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Gastado</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(client.financialData.totalSpent)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Contratos</p>
                    <p className="text-xl font-bold text-green-600">
                      {client.financialData.contractCount}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Calificación</p>
                    <p className="text-xl font-bold text-yellow-600">
                      {client.financialData.averageRating}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <PieChart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Satisfacción</p>
                    <p className="text-xl font-bold text-purple-600">
                      {client.financialData.satisfactionScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {/* Para inquilinos: mostrar propiedades compartidas, favoritas y contratos */}
            {client.type === 'tenant' || client.type === 'both' ? (
              <>
                {/* Propiedades Compartidas */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Propiedades Compartidas
                      </CardTitle>
                      <Button
                        onClick={() => setShowShareDialog(true)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Compartir Propiedad
                      </Button>
                    </div>
                    <CardDescription>
                      Historial de propiedades que has compartido con este cliente
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingProperties ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando propiedades...</p>
                      </div>
                    ) : sharedProperties.length > 0 ? (
                      <div className="space-y-4">
                        {sharedProperties.map((share: any) => (
                          <div
                            key={share.id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold">
                                  {share.property?.title || 'Sin título'}
                                </h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {share.property?.address || 'Sin dirección'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Compartida: {formatDate(share.sharedAt)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {share.property?.price && (
                                  <p className="text-lg font-semibold text-green-600">
                                    ${share.property.price.toLocaleString('es-CL')}
                                  </p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProperty(share.property?.id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                            {share.message && (
                              <div className="p-3 bg-blue-50 rounded-lg mt-2">
                                <p className="text-sm text-gray-700">{share.message}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay propiedades compartidas
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Comparte propiedades relevantes con este cliente para aumentar su interés.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Propiedades Favoritas del Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Propiedades Favoritas del Cliente
                    </CardTitle>
                    <CardDescription>
                      Propiedades que el cliente ha guardado como favoritas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingProperties ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Cargando favoritos...</p>
                      </div>
                    ) : favoriteProperties.length > 0 ? (
                      <div className="space-y-4">
                        {favoriteProperties.map((fav: any) => (
                          <div
                            key={fav.id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold">{fav.title || 'Sin título'}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {fav.address || 'Sin dirección'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Guardada:{' '}
                                  {fav.favoritedAt
                                    ? formatDate(fav.favoritedAt)
                                    : 'Fecha no disponible'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {fav.price && (
                                  <p className="text-lg font-semibold text-green-600">
                                    ${fav.price.toLocaleString('es-CL')}
                                  </p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewProperty(fav.id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {fav.bedrooms && (
                                <Badge variant="outline">{fav.bedrooms} dorm.</Badge>
                              )}
                              {fav.bathrooms && (
                                <Badge variant="outline">{fav.bathrooms} baños</Badge>
                              )}
                              {fav.area && <Badge variant="outline">{fav.area} m²</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay propiedades favoritas
                        </h3>
                        <p className="text-gray-600">
                          El cliente aún no ha guardado ninguna propiedad como favorita.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Contratos (Propiedades Arrendadas) */}
                {client.contracts && client.contracts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        Propiedades Arrendadas
                      </CardTitle>
                      <CardDescription>
                        Propiedades en las que el cliente ha tenido o tiene contratos activos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {client.contracts.map(contract => (
                          <div
                            key={contract.id}
                            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold">{contract.propertyTitle}</h3>
                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {contract.propertyAddress}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getContractStatusBadge(contract.status)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewContract(contract.id)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Contrato
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                              <div>
                                <label className="text-gray-600">Inicio</label>
                                <p className="font-medium">{formatDate(contract.startDate)}</p>
                              </div>
                              {contract.endDate && (
                                <div>
                                  <label className="text-gray-600">Fin</label>
                                  <p className="font-medium">{formatDate(contract.endDate)}</p>
                                </div>
                              )}
                              <div>
                                <label className="text-gray-600">Renta Mensual</label>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(contract.monthlyRent)}
                                </p>
                              </div>
                              <div>
                                <label className="text-gray-600">Comisión</label>
                                <p className="font-medium">{formatCurrency(contract.commission)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              /* Para propietarios: mostrar propiedades gestionadas */
              <Card>
                <CardHeader>
                  <CardTitle>Propiedades Gestionadas</CardTitle>
                  <CardDescription>Propiedades del cliente que estás gestionando</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {client.properties && client.properties.length > 0 ? (
                      client.properties.map(property => (
                        <div key={property.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{property.title}</h3>
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {property.address}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {getPropertyStatusBadge(property.status)}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewProperty(property.id)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No hay propiedades gestionadas
                        </h3>
                        <p className="text-gray-600">
                          Este cliente aún no tiene propiedades bajo tu gestión.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Contratos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.contracts.map(contract => (
                    <div key={contract.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{contract.propertyTitle}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {contract.propertyAddress}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getContractStatusBadge(contract.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(contract.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <label className="text-gray-600">Inicio</label>
                          <p className="font-medium">{formatDate(contract.startDate)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Término</label>
                          <p className="font-medium">{formatDate(contract.endDate)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Renta Mensual</label>
                          <p className="font-medium">{formatCurrency(contract.monthlyRent)}</p>
                        </div>
                        <div>
                          <label className="text-gray-600">Comisión</label>
                          <p className="font-medium">{formatCurrency(contract.commission)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            {/* Add New Interaction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Agregar Interacción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Describe la interacción con el cliente..."
                    value={newInteraction}
                    onChange={e => setNewInteraction(e.target.value)}
                    rows={3}
                  />
                  <Button onClick={handleAddInteraction} disabled={!newInteraction.trim()}>
                    <Send className="w-4 h-4 mr-2" />
                    Agregar Interacción
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Interactions History */}
            <Card>
              <CardHeader>
                <CardTitle>Historial de Interacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.interactions.map(interaction => (
                    <div key={interaction.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getInteractionTypeIcon(interaction.type)}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{interaction.type}</p>
                            <p className="text-sm text-gray-600">{formatDate(interaction.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Por: {interaction.createdBy}</p>
                          {interaction.duration && (
                            <p className="text-xs text-gray-500">{interaction.duration} min</p>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-gray-700">{interaction.description}</p>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Resultado:</strong> {interaction.outcome}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documentos del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <DocumentIcon className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-600">
                            {doc.type} • {doc.size} • Subido: {formatDate(doc.uploadDate)}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {doc.category === 'identification'
                              ? 'Identificación'
                              : doc.category === 'financial'
                                ? 'Financiero'
                                : doc.category === 'contract'
                                  ? 'Contrato'
                                  : 'Otro'}
                          </Badge>
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
        </Tabs>

        {/* Dialog para compartir propiedad */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compartir Propiedad</DialogTitle>
              <DialogDescription>
                Selecciona una propiedad para compartir con este cliente mediante el sistema de
                mensajería.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="property-select">Propiedad a Compartir</Label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger id="property-select">
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.length === 0 ? (
                      <SelectItem value="" disabled>
                        No hay propiedades disponibles
                      </SelectItem>
                    ) : (
                      availableProperties.map((property: any) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.title} - {property.address} ($
                          {property.price?.toLocaleString('es-CL') || 'N/A'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="share-message">Mensaje Personalizado (Opcional)</Label>
                <Textarea
                  id="share-message"
                  placeholder="Agrega un mensaje personalizado para el cliente..."
                  value={shareMessage}
                  onChange={e => setShareMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si no agregas un mensaje, se enviará uno por defecto con los detalles de la
                  propiedad.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleShareProperty}
                disabled={sharingProperty || !selectedPropertyId}
              >
                {sharingProperty && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                )}
                Compartir Propiedad
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
