'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  Info,
  Plus,
  Search,
  Filter,
  Download,
  MessageSquare,
  Eye,
  User,
  MapPin,
  Calendar,
  Phone,
  Mail,
  Send,
  X,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function ProviderRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([
    {
      id: '1',
      title: 'Reparación de grifería en baño principal',
      description: 'Grifo de lavamanos pierde agua constantemente. Necesita reparación urgente.',
      clientName: 'María González',
      clientEmail: 'maria.gonzalez@email.com',
      clientPhone: '+56 9 1234 5678',
      propertyAddress: 'Las Condes 1234, Santiago',
      serviceType: 'Plomería',
      urgency: 'high',
      status: 'pending',
      createdAt: '2024-01-15T10:30:00',
      estimatedPrice: 25000,
      preferredDate: '2024-01-17',
      images: ['grifo1.jpg', 'grifo2.jpg'],
      notes: 'Cliente disponible entre 14:00 y 18:00 hrs'
    },
    {
      id: '2',
      title: 'Mantenimiento eléctrico completo',
      description: 'Revisión general de instalación eléctrica, cambio de tomacorrientes antiguos.',
      clientName: 'Carlos Rodríguez',
      clientEmail: 'carlos.rodriguez@email.com',
      clientPhone: '+56 9 8765 4321',
      propertyAddress: 'Providencia 567, Santiago',
      serviceType: 'Electricidad',
      urgency: 'medium',
      status: 'quoted',
      createdAt: '2024-01-14T14:20:00',
      estimatedPrice: 45000,
      quotedPrice: 52000,
      preferredDate: '2024-01-18',
      images: [],
      notes: 'Propiedad tiene 3 dormitorios y 2 baños'
    },
    {
      id: '3',
      title: 'Pintura de sala y comedor',
      description: 'Pintura completa de sala de estar y comedor. Colores claros.',
      clientName: 'Ana Silva',
      clientEmail: 'ana.silva@email.com',
      clientPhone: '+56 9 5555 6666',
      propertyAddress: 'Ñuñoa 789, Santiago',
      serviceType: 'Pintura',
      urgency: 'low',
      status: 'accepted',
      createdAt: '2024-01-13T09:15:00',
      estimatedPrice: 35000,
      quotedPrice: 38000,
      acceptedPrice: 38000,
      preferredDate: '2024-01-20',
      images: ['sala1.jpg'],
      notes: 'Cliente prefiere tonos neutros'
    },
    {
      id: '4',
      title: 'Instalación de sistema de riego',
      description: 'Instalación de sistema automático de riego para jardín de 200m².',
      clientName: 'Pedro Morales',
      clientEmail: 'pedro.morales@email.com',
      clientPhone: '+56 9 7777 8888',
      propertyAddress: 'Vitacura 345, Santiago',
      serviceType: 'Jardinería',
      urgency: 'medium',
      status: 'completed',
      createdAt: '2024-01-10T11:45:00',
      estimatedPrice: 65000,
      acceptedPrice: 62000,
      finalPrice: 62000,
      preferredDate: '2024-01-15',
      completedDate: '2024-01-16',
      images: ['jardin1.jpg', 'jardin2.jpg'],
      notes: 'Sistema incluye programador automático'
    },
    {
      id: '5',
      title: 'Reparación de puerta de garage',
      description: 'Motor de puerta automática no funciona correctamente.',
      clientName: 'Sofía Vargas',
      clientEmail: 'sofia.vargas@email.com',
      clientPhone: '+56 9 9999 0000',
      propertyAddress: 'La Reina 456, Santiago',
      serviceType: 'Mantenimiento General',
      urgency: 'high',
      status: 'pending',
      createdAt: '2024-01-16T08:30:00',
      estimatedPrice: 35000,
      preferredDate: '2024-01-18',
      images: ['garage1.jpg'],
      notes: 'Puerta marca Chamberlain, modelo antiguo'
    }
  ]);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock requests overview data
      const overviewData = {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        completedRequests: requests.filter(r => r.status === 'completed').length,
        totalRevenue: requests
          .filter(r => r.finalPrice || r.acceptedPrice)
          .reduce((sum, r) => sum + (r.finalPrice || r.acceptedPrice || 0), 0)
      };

      setData(overviewData);
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'accepted' }
        : request
    ));
    alert('Solicitud aceptada exitosamente');
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(request =>
      request.id === requestId
        ? { ...request, status: 'rejected' }
        : request
    ));
    alert('Solicitud rechazada');
  };

  const handleSendQuote = (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (request) {
      setRequests(prev => prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'quoted', quotedPrice: request.estimatedPrice * 1.2 }
          : r
      ));
      alert(`Cotización enviada por ${formatCurrency(request.estimatedPrice * 1.2)}`);
    }
  };

  const handleContactClient = (request: any) => {
    const message = `Hola ${request.clientName}, me contacté por tu solicitud "${request.title}". ¿Podemos coordinar una visita?`;
    const whatsappUrl = `https://wa.me/${request.clientPhone.replace(/\s+/g, '').replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportRequests = () => {
    const csvContent = [
      ['Título', 'Cliente', 'Servicio', 'Estado', 'Urgencia', 'Precio Estimado', 'Fecha Creación']
    ];

    requests.forEach(request => {
      csvContent.push([
        request.title,
        request.clientName,
        request.serviceType,
        request.status,
        request.urgency,
        request.estimatedPrice.toString(),
        new Date(request.createdAt).toLocaleDateString('es-CL')
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `solicitudes_proveedor_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      quoted: { label: 'Cotizado', color: 'bg-blue-100 text-blue-800' },
      accepted: { label: 'Aceptado', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completado', color: 'bg-purple-100 text-purple-800' },
      rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', color: 'bg-green-100 text-green-800' }
    };
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig] || urgencyConfig.medium;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Solicitudes de Servicio" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Solicitudes de Servicio" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Solicitudes de Servicio"
      subtitle="Gestiona las solicitudes de servicio que recibes"
    >
      <div className="space-y-6">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">+8 desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pendingRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren respuesta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.completedRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Trabajos finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Generados</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Gestión de solicitudes por pestañas */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="quoted">Cotizadas</TabsTrigger>
            <TabsTrigger value="accepted">Aceptadas</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'quoted', 'accepted', 'completed'].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {requests
                  .filter(request => tabValue === 'all' || request.status === tabValue)
                  .map((request) => (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{request.title}</h3>
                              {getStatusBadge(request.status)}
                              {getUrgencyBadge(request.urgency)}
                            </div>

                            <p className="text-gray-600 text-sm mb-3">{request.description}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{request.clientName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{request.propertyAddress}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{new Date(request.createdAt).toLocaleDateString('es-CL')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>{formatCurrency(request.estimatedPrice)}</span>
                              </div>
                            </div>

                            {request.notes && (
                              <div className="mb-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                                <strong>Notas:</strong> {request.notes}
                              </div>
                            )}

                            {request.images && request.images.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">
                                  Imágenes adjuntas: {request.images.length}
                                </div>
                                <div className="flex gap-2">
                                  {request.images.map((image: string, index: number) => (
                                    <div key={index} className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                      <span className="text-xs text-gray-600">IMG</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/provider/requests/${request.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleContactClient(request)}
                            >
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Contactar
                            </Button>

                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleSendQuote(request.id)}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Enviar Cotización
                                </Button>

                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptRequest(request.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            )}

                            {request.status === 'quoted' && (
                              <div className="text-center text-sm text-green-600 font-medium">
                                Cotizado: {formatCurrency(request.quotedPrice || 0)}
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <div className="text-center text-sm text-blue-600 font-medium">
                                Aceptado: {formatCurrency(request.acceptedPrice || 0)}
                              </div>
                            )}

                            {request.status === 'completed' && (
                              <div className="text-center text-sm text-purple-600 font-medium">
                                Completado: {formatCurrency(request.finalPrice || 0)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones más utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => router.push('/provider/requests/new')}>
                <Plus className="w-6 h-6 mb-2" />
                <span>Crear Solicitud</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={handleExportRequests}>
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Solicitudes</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => router.push('/provider/dashboard')}>
                <Ticket className="w-6 h-6 mb-2" />
                <span>Ver Dashboard</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => router.push('/provider/messages')}>
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>Mensajes</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => router.push('/provider/ratings')}>
                <CheckCircle className="w-6 h-6 mb-2" />
                <span>Ver Reseñas</span>
              </Button>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={loadPageData}>
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
