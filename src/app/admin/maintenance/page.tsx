'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  Bell,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  MessageSquare,
  Ticket,
  Database,
  Shield,
  Clock,
  Search,
  Calendar,
  MapPin,
  Wrench,
  Camera,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

export default function MantenimientoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([
    {
      id: '1',
      title: 'Reparaci�n de ca�er�a principal',
      description: 'Ca�er�a rota en ba�o principal causando inundaci�n. Urgente.',
      propertyAddress: 'Las Condes 1234, Santiago',
      propertyType: 'Casa',
      ownerName: 'Mar�a Gonz�lez',
      ownerEmail: 'maria.gonzalez@email.com',
      ownerPhone: '+56 9 1234 5678',
      tenantName: 'Carlos Rodr�guez',
      tenantEmail: 'carlos.rodriguez@email.com',
      tenantPhone: '+56 9 8765 4321',
      serviceType: 'Plomer�a',
      urgency: 'high',
      status: 'pending',
      priority: 'urgent',
      estimatedCost: 85000,
      actualCost: null,
      createdAt: '2024-01-15T10:30:00',
      scheduledDate: null,
      completedDate: null,
      assignedProvider: null,
      providerName: null,
      providerRating: null,
      images: ['ca�eria1.jpg', 'ca�eria2.jpg'],
      notes:
        'Cliente reporta que el agua sale con presi�n alta. Posible ruptura en tuber�a principal.',
      resolution: null,
    },
    {
      id: '2',
      title: 'Mantenimiento sistema el�ctrico',
      description:
        'Revisi�n completa de instalaci�n el�ctrica, reemplazo de tomacorrientes antiguos.',
      propertyAddress: 'Providencia 567, Santiago',
      propertyType: 'Departamento',
      ownerName: 'Ana Silva',
      ownerEmail: 'ana.silva@email.com',
      ownerPhone: '+56 9 5555 6666',
      tenantName: 'Pedro Morales',
      tenantEmail: 'pedro.morales@email.com',
      tenantPhone: '+56 9 7777 8888',
      serviceType: 'Electricidad',
      urgency: 'medium',
      status: 'assigned',
      priority: 'normal',
      estimatedCost: 120000,
      actualCost: null,
      createdAt: '2024-01-14T14:20:00',
      scheduledDate: '2024-01-18T09:00:00',
      completedDate: null,
      assignedProvider: '2',
      providerName: 'T�cnicos El�ctricos Express',
      providerRating: null,
      images: [],
      notes: 'Propiedad tiene 3 dormitorios y 2 ba�os. Instalar 4 tomacorrientes nuevos.',
      resolution: null,
    },
    {
      id: '3',
      title: 'Pintura sala y comedor',
      description: 'Pintura completa de sala de estar y comedor. Cambiar color a tonos claros.',
      propertyAddress: '�u�oa 789, Santiago',
      propertyType: 'Casa',
      ownerName: 'Sof�a Vargas',
      ownerEmail: 'sofia.vargas@email.com',
      ownerPhone: '+56 9 9999 0000',
      tenantName: null,
      tenantEmail: null,
      tenantPhone: null,
      serviceType: 'Pintura',
      urgency: 'low',
      status: 'in_progress',
      priority: 'low',
      estimatedCost: 180000,
      actualCost: null,
      createdAt: '2024-01-13T11:15:00',
      scheduledDate: '2024-01-16T08:00:00',
      completedDate: null,
      assignedProvider: '3',
      providerName: 'Pintores Profesionales',
      providerRating: null,
      images: ['sala_antes.jpg'],
      notes: 'Cliente prefiere tonos neutros. Preparar superficies antes de pintar.',
      resolution: null,
    },
    {
      id: '4',
      title: 'Reparaci�n puerta garage',
      description: 'Motor de puerta autom�tica no funciona correctamente.',
      propertyAddress: 'Vitacura 345, Santiago',
      propertyType: 'Casa',
      ownerName: 'Diego L�pez',
      ownerEmail: 'diego.lopez@email.com',
      ownerPhone: '+56 9 1111 2222',
      tenantName: null,
      tenantEmail: null,
      tenantPhone: null,
      serviceType: 'Mantenimiento General',
      urgency: 'medium',
      status: 'completed',
      priority: 'normal',
      estimatedCost: 95000,
      actualCost: 87500,
      createdAt: '2024-01-10T09:45:00',
      scheduledDate: '2024-01-12T14:00:00',
      completedDate: '2024-01-13T16:30:00',
      assignedProvider: '4',
      providerName: 'Servicios T�cnicos Integrales',
      providerRating: 4.5,
      images: ['garage_motor.jpg', 'garage_reparado.jpg'],
      notes: 'Puerta marca Chamberlain modelo antiguo. Se reemplaz� capacitor del motor.',
      resolution:
        'Motor reparado exitosamente. Se reemplaz� capacitor defectuoso y se lubricaron mecanismos.',
    },
    {
      id: '5',
      title: 'Instalaci�n sistema riego',
      description: 'Instalaci�n de sistema autom�tico de riego para jard�n de 200m�.',
      propertyAddress: 'La Reina 456, Santiago',
      propertyType: 'Casa',
      ownerName: 'Carolina Mendoza',
      ownerEmail: 'carolina.mendoza@email.com',
      ownerPhone: '+56 9 3333 4444',
      tenantName: null,
      tenantEmail: null,
      tenantPhone: null,
      serviceType: 'Jardiner�a',
      urgency: 'low',
      status: 'completed',
      priority: 'low',
      estimatedCost: 250000,
      actualCost: 235000,
      createdAt: '2024-01-08T13:20:00',
      scheduledDate: '2024-01-15T10:00:00',
      completedDate: '2024-01-17T17:00:00',
      assignedProvider: '5',
      providerName: 'Jardines Verdes',
      providerRating: 5.0,
      images: ['jardin_antes.jpg', 'jardin_despues.jpg', 'sistema_riego.jpg'],
      notes: 'Sistema incluye programador autom�tico y aspersores. Jard�n de c�sped natural.',
      resolution:
        'Sistema instalado completamente. Programador configurado para riego 3 veces por semana.',
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Cargar datos de la p�gina
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock maintenance overview data
      const overviewData = {
        totalRequests: maintenanceRequests.length,
        activeRequests: maintenanceRequests.filter(
          r => r.status === 'in_progress' || r.status === 'assigned'
        ).length,
        pendingRequests: maintenanceRequests.filter(r => r.status === 'pending').length,
        totalCost: maintenanceRequests
          .filter(r => r.actualCost || r.estimatedCost)
          .reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0),
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

  const handleAssignProvider = (requestId: string, providerId: string, providerName: string) => {
    setMaintenanceRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'assigned',
              assignedProvider: providerId,
              providerName: providerName,
              scheduledDate: new Date().toISOString(),
            }
          : request
      )
    );
    setShowAssignDialog(false);
    setSuccessMessage(`Proveedor ${providerName} asignado exitosamente`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleCompleteRequest = (requestId: string) => {
    setMaintenanceRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: 'completed',
              completedDate: new Date().toISOString(),
              actualCost: request.estimatedCost * 0.9, // Simular costo real ligeramente menor
            }
          : request
      )
    );
    setSuccessMessage('Solicitud completada exitosamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportRequests = () => {
    const csvContent = [
      [
        'T�tulo',
        'Propiedad',
        'Propietario',
        'Servicio',
        'Estado',
        'Urgencia',
        'Costo Estimado',
        'Proveedor',
        'Fecha Creaci�n',
      ],
    ];

    maintenanceRequests.forEach(request => {
      csvContent.push([
        request.title,
        request.propertyAddress,
        request.ownerName,
        request.serviceType,
        request.status,
        request.urgency,
        request.estimatedCost.toString(),
        request.providerName || 'Sin asignar',
        new Date(request.createdAt).toLocaleDateString('es-CL'),
      ]);
    });

    const csvString = csvContent.map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `solicitudes_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`
    );
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
      assigned: { label: 'Asignado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Progreso', color: 'bg-orange-100 text-orange-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
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
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Cargando informaci�n...">
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
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Error al cargar la p�gina">
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
      title="Mantenimiento"
      subtitle="Gestiona las tareas de mantenimiento del sistema"
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
                  �
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header con estad�sticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalRequests || 0}</div>
              <p className="text-xs text-muted-foreground">+12% desde el mes pasado</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.activeRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Trabajos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.pendingRequests || 0}</div>
              <p className="text-xs text-muted-foreground">Requieren asignaci�n</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data?.totalCost || 0)}</div>
              <p className="text-xs text-muted-foreground">+8% desde el mes pasado</p>
            </CardContent>
          </Card>
        </div>

        {/* Gesti�n de solicitudes por pesta�as */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="pending">Pendientes</TabsTrigger>
            <TabsTrigger value="assigned">Asignadas</TabsTrigger>
            <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
            <TabsTrigger value="completed">Completadas</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'assigned', 'in_progress', 'completed'].map(tabValue => (
            <TabsContent key={tabValue} value={tabValue}>
              <div className="space-y-4">
                {maintenanceRequests
                  .filter(request => tabValue === 'all' || request.status === tabValue)
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
                                <MapPin className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{request.propertyAddress}</div>
                                  <div className="text-xs">{request.propertyType}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">{request.ownerName}</div>
                                  <div className="text-xs">Propietario</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {request.scheduledDate
                                      ? new Date(request.scheduledDate).toLocaleDateString('es-CL')
                                      : 'Sin agendar'}
                                  </div>
                                  <div className="text-xs">Programado</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <div>
                                  <div className="font-medium">
                                    {formatCurrency(request.estimatedPrice)}
                                  </div>
                                  <div className="text-xs">
                                    {request.actualCost
                                      ? `Real: ${formatCurrency(request.actualCost)}`
                                      : 'Estimado'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {request.providerName && (
                              <div className="mb-3 p-2 bg-blue-50 rounded flex items-center gap-2">
                                <Wrench className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-800">
                                  Proveedor: <strong>{request.providerName}</strong>
                                </span>
                              </div>
                            )}

                            {request.resolution && (
                              <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                                <div className="text-sm font-medium text-green-800 mb-1">
                                  Resoluci�n:
                                </div>
                                <p className="text-sm text-green-700">{request.resolution}</p>
                              </div>
                            )}

                            {request.notes && (
                              <div className="mb-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                                <strong>Notas:</strong> {request.notes}
                              </div>
                            )}

                            {request.images && request.images.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm text-gray-600 mb-1">
                                  Im�genes: {request.images.length} archivos
                                </div>
                                <div className="flex gap-2">
                                  {request.images
                                    .slice(0, 3)
                                    .map((image: string, index: number) => (
                                      <div
                                        key={index}
                                        className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"
                                      >
                                        <span className="text-xs text-gray-600">IMG</span>
                                      </div>
                                    ))}
                                  {request.images.length > 3 && (
                                    <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                      <span className="text-xs text-gray-600">
                                        +{request.images.length - 3}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/admin/maintenance/${request.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalles
                            </Button>

                            {request.status === 'pending' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" onClick={() => setSelectedRequest(request)}>
                                    <User className="w-4 h-4 mr-2" />
                                    Asignar Proveedor
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Asignar Proveedor</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 rounded">
                                      <h4 className="font-medium">{request.title}</h4>
                                      <p className="text-sm text-gray-600">{request.serviceType}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Button
                                        onClick={() =>
                                          handleAssignProvider(
                                            request.id,
                                            '1',
                                            'Servicios Integrales Ltda.'
                                          )
                                        }
                                        className="w-full justify-start"
                                        variant="outline"
                                      >
                                        Servicios Integrales Ltda. - Plomer�a/Electricidad
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleAssignProvider(
                                            request.id,
                                            '2',
                                            'T�cnicos El�ctricos Express'
                                          )
                                        }
                                        className="w-full justify-start"
                                        variant="outline"
                                      >
                                        T�cnicos El�ctricos Express - Electricidad
                                      </Button>
                                      <Button
                                        onClick={() =>
                                          handleAssignProvider(
                                            request.id,
                                            '3',
                                            'Pintores Profesionales'
                                          )
                                        }
                                        className="w-full justify-start"
                                        variant="outline"
                                      >
                                        Pintores Profesionales - Pintura
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}

                            {(request.status === 'assigned' ||
                              request.status === 'in_progress') && (
                              <Button
                                size="sm"
                                onClick={() => handleCompleteRequest(request.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Completar
                              </Button>
                            )}

                            {request.status === 'completed' && request.providerRating && (
                              <div className="text-center text-sm text-green-600 font-medium">
                                ? {request.providerRating}/5.0
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

        {/* Acciones r�pidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones R�pidas</CardTitle>
            <CardDescription>Accede r�pidamente a las funciones m�s utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Solicitud"
                description="Crear mantenimiento"
                onClick={() => router.push('/admin/maintenance/new')}
              />

              <QuickActionButton
                icon={Search}
                label="Buscar"
                description="Buscar solicitudes"
                onClick={() => {
                  // Focus on search input or open search dialog
                  const searchInput = document.querySelector(
                    'input[placeholder*="Buscar"]'
                  ) as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar reportes"
                onClick={handleExportRequests}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Estad�sticas detalladas"
                onClick={() => router.push('/admin/reports/maintenance')}
              />

              <QuickActionButton
                icon={User}
                label="Proveedores"
                description="Gestionar proveedores"
                onClick={() => router.push('/admin/providers')}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={() => loadPageData()}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
