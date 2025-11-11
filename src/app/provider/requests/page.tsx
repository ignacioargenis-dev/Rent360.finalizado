'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProviderRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });

  const [requests, setRequests] = useState<any[]>([]);

  // Estados para el modal de cotización
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [quoteData, setQuoteData] = useState({
    price: '',
    estimatedTime: '',
    availabilityDate: '',
    notes: '',
    materials: '',
    laborCost: '',
    materialsCost: '',
  });

  // Función para obtener el conteo de solicitudes por tab
  const getTabCount = (tabValue: string) => {
    if (tabValue === 'all') {
      return requests.length;
    }

    const statusMapping: { [key: string]: string[] } = {
      pending: ['PENDING'],
      quoted: ['QUOTED'],
      accepted: ['ACCEPTED', 'ACTIVE', 'IN_PROGRESS'],
      completed: ['COMPLETED'],
      all: ['PENDING', 'QUOTED', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'],
    };

    const mappedStatuses = statusMapping[tabValue] || [tabValue.toUpperCase()];
    const filtered = requests.filter(request => mappedStatuses.includes(request.status));

    console.log(
      `📊 Tab ${tabValue}: buscando ${mappedStatuses.join(',')}, encontrados: ${filtered.length}`
    );
    return filtered.length;
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar solicitudes reales desde la API
      const response = await fetch('/api/provider/requests?status=all&limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const apiData = await response.json();
        if (apiData.success && apiData.requests) {
          // Log para debugging de estados
          console.log(
            '📊 Estados de solicitudes del provider:',
            apiData.requests.map((req: any) => req.status)
          );
          console.log('📊 Total de solicitudes del provider:', apiData.requests.length);

          // Log detallado de cada solicitud para debugging
          apiData.requests.forEach((req: any, index: number) => {
            console.log(
              `📋 Solicitud ${index + 1}: ID=${req.id}, Status=${req.status}, Title=${req.title}`
            );
          });

          // Transformar datos de la API al formato esperado
          const transformedRequests = apiData.requests.map((req: any) => ({
            id: req.id,
            title: req.title || `${req.serviceType} - ${req.clientName}`,
            description: req.description,
            clientName: req.clientName,
            clientEmail: req.clientEmail,
            clientPhone: req.clientPhone,
            propertyAddress: req.propertyAddress || '',
            serviceType: req.serviceType,
            urgency: req.urgency || 'medium',
            status: req.status,
            createdAt: req.createdAt,
            estimatedPrice: req.estimatedPrice || 0,
            quotedPrice: req.quotedPrice,
            acceptedPrice: req.acceptedPrice,
            finalPrice: req.finalPrice,
            preferredDate: req.preferredDate,
            completedDate: req.completedDate,
            images: req.images || [],
            notes: req.notes || '',
          }));

          setRequests(transformedRequests);

          // Calcular estadísticas
          const overviewData = {
            totalRequests: transformedRequests.length,
            pendingRequests: transformedRequests.filter((r: any) => r.status === 'pending').length,
            completedRequests: transformedRequests.filter((r: any) => r.status === 'completed')
              .length,
            totalRevenue: transformedRequests
              .filter((r: any) => r.finalPrice || r.acceptedPrice)
              .reduce((sum: number, r: any) => sum + (r.finalPrice || r.acceptedPrice || 0), 0),
          };

          setData(overviewData);
        } else {
          setRequests([]);
          setData({
            totalRequests: 0,
            pendingRequests: 0,
            completedRequests: 0,
            totalRevenue: 0,
          });
        }
      } else {
        setRequests([]);
        setData({
          totalRequests: 0,
          pendingRequests: 0,
          completedRequests: 0,
          totalRevenue: 0,
        });
      }
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
      setRequests([]);
      setData({
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    setRequests(prev =>
      prev.map(request => (request.id === requestId ? { ...request, status: 'accepted' } : request))
    );
    setSuccessMessage('Solicitud aceptada exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev =>
      prev.map(request => (request.id === requestId ? { ...request, status: 'rejected' } : request))
    );
    setSuccessMessage('Solicitud rechazada');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleSendQuote = (request: any) => {
    setSelectedRequest(request);
    setQuoteData({
      price: request.estimatedPrice ? (request.estimatedPrice * 1.2).toString() : '',
      estimatedTime: '2-4 horas',
      availabilityDate:
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] || '',
      notes: '',
      materials: '',
      laborCost: request.estimatedPrice ? (request.estimatedPrice * 0.7).toString() : '',
      materialsCost: request.estimatedPrice ? (request.estimatedPrice * 0.5).toString() : '',
    });
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async () => {
    console.log('🚨🚨🚨 [QUOTE MODAL] handleSubmitQuote called');
    console.log('Selected request:', selectedRequest);
    console.log('Quote data:', quoteData);

    if (!selectedRequest) {
      console.log('❌ No selected request');
      return;
    }

    try {
      const response = await fetch('/api/services/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          price: parseFloat(quoteData.price),
          estimatedTime: quoteData.estimatedTime,
          availabilityDate: quoteData.availabilityDate,
          notes: quoteData.notes,
          materials: quoteData.materials,
          laborCost: parseFloat(quoteData.laborCost) || 0,
          materialsCost: parseFloat(quoteData.materialsCost) || 0,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Cotización enviada exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        setShowQuoteModal(false);
        setSelectedRequest(null);
        loadPageData(); // Recargar datos
      } else {
        setErrorMessage('Error al enviar cotización');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error enviando cotización:', { error });
      setErrorMessage('Error al enviar cotización. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleContactClient = (request: any) => {
    // Crear conversación con el cliente usando el sistema de mensajería interno
    const recipientData = {
      id: request.requesterId || request.clientId,
      name: request.clientName,
      email: request.clientEmail,
      type: 'client',
      serviceRequestId: request.id,
      serviceType: request.serviceType,
    };

    sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
    router.push('/provider/messages?new=true');
  };

  const handleExportRequests = () => {
    logger.info('Abriendo opciones de exportación de trabajos');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando trabajos del proveedor', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/provider/jobs/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `trabajos_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de trabajos completada exitosamente');
    } catch (error) {
      logger.error('Error exportando trabajos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los trabajos. Por favor, intenta nuevamente.');
    }
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
      rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    };

    // Convertir status a minúsculas para buscar en el config
    const statusKey = status?.toLowerCase() as keyof typeof statusConfig;
    const config = statusConfig[statusKey] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      high: { label: 'Alta', color: 'bg-red-100 text-red-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Baja', color: 'bg-green-100 text-green-800' },
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
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800">{successMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
            <TabsTrigger value="all">Todas ({getTabCount('all')})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({getTabCount('pending')})</TabsTrigger>
            <TabsTrigger value="quoted">Cotizadas ({getTabCount('quoted')})</TabsTrigger>
            <TabsTrigger value="accepted">Aceptadas ({getTabCount('accepted')})</TabsTrigger>
            <TabsTrigger value="completed">Completadas ({getTabCount('completed')})</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'quoted', 'accepted', 'completed'].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {requests
                  .filter(request => {
                    if (tabValue === 'all') {
                      return true;
                    }

                    // Mapear los valores de los tabs a los estados reales de la base de datos
                    const statusMapping: { [key: string]: string[] } = {
                      pending: ['PENDING'],
                      quoted: ['QUOTED'],
                      accepted: ['ACCEPTED', 'ACTIVE', 'IN_PROGRESS'],
                      completed: ['COMPLETED'],
                      all: ['PENDING', 'QUOTED', 'ACCEPTED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED'],
                    };

                    const mappedStatuses = statusMapping[tabValue] || [tabValue.toUpperCase()];
                    return mappedStatuses.includes(request.status);
                  })
                  .map(request => (
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
                                <span>
                                  {new Date(request.createdAt).toLocaleDateString('es-CL')}
                                </span>
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
                                    <div
                                      key={index}
                                      className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"
                                    >
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

                            <Button size="sm" onClick={() => handleContactClient(request)}>
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
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/requests/new')}
              >
                <Plus className="w-6 h-6 mb-2" />
                <span>Crear Solicitud</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={handleExportRequests}
              >
                <Download className="w-6 h-6 mb-2" />
                <span>Exportar Solicitudes</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/dashboard')}
              >
                <Ticket className="w-6 h-6 mb-2" />
                <span>Ver Dashboard</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/messages')}
              >
                <MessageSquare className="w-6 h-6 mb-2" />
                <span>Mensajes</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={() => router.push('/provider/ratings')}
              >
                <CheckCircle className="w-6 h-6 mb-2" />
                <span>Ver Reseñas</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center"
                onClick={loadPageData}
              >
                <RefreshCw className="w-6 h-6 mb-2" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Modal de exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Trabajos</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtra los trabajos que deseas exportar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Archivo</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Filtrar por Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los trabajos</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="ASSIGNED">Asignados</SelectItem>
                    <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                    <SelectItem value="COMPLETED">Completados</SelectItem>
                    <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="export-start-date">Fecha Desde</Label>
                  <Input
                    id="export-start-date"
                    type="date"
                    value={exportOptions.startDate}
                    onChange={e =>
                      setExportOptions(prev => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="export-end-date">Fecha Hasta</Label>
                  <Input
                    id="export-end-date"
                    type="date"
                    value={exportOptions.endDate}
                    onChange={e => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Se exportarán {requests.length} trabajos
                  {exportOptions.format === 'csv'
                    ? ' en formato CSV compatible con Excel'
                    : ' en formato JSON'}
                  {exportOptions.status !== 'all' &&
                    ` filtrados por estado "${exportOptions.status}"`}
                  {(exportOptions.startDate || exportOptions.endDate) &&
                    ' en el rango de fechas seleccionado'}
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportOptions({
                    format: 'csv',
                    status: 'all',
                    startDate: '',
                    endDate: '',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Trabajos
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Cotización */}
        <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Enviar Cotización</DialogTitle>
              <DialogDescription>
                Crea una cotización detallada para la solicitud de {selectedRequest?.clientName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote-price">Precio Total (CLP)</Label>
                  <Input
                    id="quote-price"
                    type="number"
                    value={quoteData.price}
                    onChange={e => setQuoteData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="Ej: 150000"
                  />
                </div>
                <div>
                  <Label htmlFor="quote-time">Tiempo Estimado</Label>
                  <Select
                    value={quoteData.estimatedTime}
                    onValueChange={value =>
                      setQuoteData(prev => ({ ...prev, estimatedTime: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tiempo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2 horas">1-2 horas</SelectItem>
                      <SelectItem value="2-4 horas">2-4 horas</SelectItem>
                      <SelectItem value="4-6 horas">4-6 horas</SelectItem>
                      <SelectItem value="1 día">1 día</SelectItem>
                      <SelectItem value="2-3 días">2-3 días</SelectItem>
                      <SelectItem value="1 semana">1 semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quote-labor">Costo de Mano de Obra</Label>
                  <Input
                    id="quote-labor"
                    type="number"
                    value={quoteData.laborCost}
                    onChange={e => setQuoteData(prev => ({ ...prev, laborCost: e.target.value }))}
                    placeholder="Ej: 100000"
                  />
                </div>
                <div>
                  <Label htmlFor="quote-materials-cost">Costo de Materiales</Label>
                  <Input
                    id="quote-materials-cost"
                    type="number"
                    value={quoteData.materialsCost}
                    onChange={e =>
                      setQuoteData(prev => ({ ...prev, materialsCost: e.target.value }))
                    }
                    placeholder="Ej: 50000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="quote-materials">Materiales Requeridos</Label>
                <Textarea
                  id="quote-materials"
                  value={quoteData.materials}
                  onChange={e => setQuoteData(prev => ({ ...prev, materials: e.target.value }))}
                  placeholder="Describe los materiales necesarios para el trabajo..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="quote-date">Fecha Disponible</Label>
                <Input
                  id="quote-date"
                  type="date"
                  value={quoteData.availabilityDate}
                  onChange={e =>
                    setQuoteData(prev => ({ ...prev, availabilityDate: e.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="quote-notes">Notas Adicionales</Label>
                <Textarea
                  id="quote-notes"
                  value={quoteData.notes}
                  onChange={e => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Comentarios adicionales sobre la cotización..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuoteModal(false);
                  setSelectedRequest(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmitQuote}>
                <Send className="w-4 h-4 mr-2" />
                Enviar Cotización
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
