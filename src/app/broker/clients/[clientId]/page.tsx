'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface ClientDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'tenant' | 'owner';
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
  const clientId = params.clientId as string;

  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [newInteraction, setNewInteraction] = useState('');

  // Mock data for client details
  const mockClient: ClientDetail = {
    id: clientId,
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
  }, [clientId]);

  const loadClientDetails = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setClient(mockClient);
    } catch (error) {
      logger.error('Error al cargar detalles del cliente', { error, clientId });
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
      // WhatsApp
      const message = encodeURIComponent(
        'Hola! Tengo algunas propiedades que podrían interesarte.'
      );
      window.open(`https://wa.me/${client.phone.replace(/\s+/g, '')}?text=${message}`, '_blank');
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
    switch (type) {
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
                        {client.type === 'tenant' ? 'Inquilino' : 'Propietario'}
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
              {client.type === 'tenant' && (
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
            <Card>
              <CardHeader>
                <CardTitle>Propiedades de Interés</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {client.properties.map(property => (
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

                      {property.viewDate && (
                        <p className="text-sm text-gray-600 mb-2">
                          Fecha de visita: {formatDate(property.viewDate)}
                        </p>
                      )}

                      {property.offerAmount && (
                        <p className="text-sm font-medium text-green-600 mb-2">
                          Oferta: {formatCurrency(property.offerAmount)}
                        </p>
                      )}

                      {property.notes && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{property.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
      </div>
    </UnifiedDashboardLayout>
  );
}
