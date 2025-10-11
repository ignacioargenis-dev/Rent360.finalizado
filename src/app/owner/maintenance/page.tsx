'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/components/auth/AuthProvider';
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
  X,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  tenantName: string;
  type: 'REPAIR' | 'MAINTENANCE' | 'EMERGENCY' | 'INSPECTION';
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  estimatedCost: number;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  provider?: string;
}

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalCost: number;
  monthlyCost: number;
}

export default function MantenimientoPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    totalCost: 0,
    monthlyCost: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showAssignProviderDialog, setShowAssignProviderDialog] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providerFilters, setProviderFilters] = useState({
    specialty: 'all',
    sortBy: 'rating', // 'rating', 'price_low', 'price_high', 'experience'
  });

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demo - in production this would come from API
      const mockRequests: MaintenanceRequest[] = [
        {
          id: '1',
          propertyId: 'prop-001',
          propertyTitle: 'Departamento Las Condes',
          tenantName: 'Carlos Ramírez',
          type: 'REPAIR',
          description: 'Reparación de grifería en baño principal',
          urgency: 'MEDIUM',
          status: 'PENDING',
          estimatedCost: 85000,
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          propertyId: 'prop-002',
          propertyTitle: 'Casa Providencia',
          tenantName: 'Ana Martínez',
          type: 'MAINTENANCE',
          description: 'Mantenimiento preventivo de caldera',
          urgency: 'LOW',
          status: 'APPROVED',
          estimatedCost: 120000,
          createdAt: '2024-01-10T14:20:00Z',
          scheduledDate: '2024-01-25T09:00:00Z',
        },
        {
          id: '3',
          propertyId: 'prop-003',
          propertyTitle: 'Oficina Santiago Centro',
          tenantName: 'Pedro Silva',
          type: 'EMERGENCY',
          description: 'Fuga de agua en piso superior',
          urgency: 'CRITICAL',
          status: 'IN_PROGRESS',
          estimatedCost: 150000,
          createdAt: '2024-01-12T16:45:00Z',
          provider: 'Servicio Rápido SpA',
        },
        {
          id: '4',
          propertyId: 'prop-001',
          propertyTitle: 'Departamento Las Condes',
          tenantName: 'Carlos Ramírez',
          type: 'INSPECTION',
          description: 'Inspección anual de instalaciones eléctricas',
          urgency: 'LOW',
          status: 'COMPLETED',
          estimatedCost: 60000,
          createdAt: '2024-01-05T11:15:00Z',
          completedDate: '2024-01-08T13:30:00Z',
          provider: 'Electricistas Profesionales',
        },
      ];

      setMaintenanceRequests(mockRequests);

      // Calculate stats
      const totalRequests = mockRequests.length;
      const pendingRequests = mockRequests.filter(r => r.status === 'PENDING').length;
      const activeRequests = mockRequests.filter(r =>
        ['APPROVED', 'IN_PROGRESS'].includes(r.status)
      ).length;
      const completedRequests = mockRequests.filter(r => r.status === 'COMPLETED').length;
      const totalCost = mockRequests.reduce((sum, r) => sum + r.estimatedCost, 0);
      const monthlyCost = mockRequests
        .filter(r => new Date(r.createdAt).getMonth() === new Date().getMonth())
        .reduce((sum, r) => sum + r.estimatedCost, 0);

      setStats({
        totalRequests,
        pendingRequests,
        activeRequests,
        completedRequests,
        totalCost,
        monthlyCost,
      });

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading page data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para acciones rápidas
  const handleNewRequest = () => {
    logger.info('Abriendo creación de nueva solicitud de mantenimiento');
    // TODO: Implementar modal o navegación para nueva solicitud
  };

  const handleFilterRequests = () => {
    logger.info('Alternando filtros de solicitudes');
    // TODO: Implementar filtros avanzados
  };

  const handleExportData = async () => {
    try {
      logger.info('Exportando datos de mantenimiento');
      alert('Datos exportados exitosamente');
    } catch (error) {
      logger.error('Error exportando datos:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleViewReports = () => {
    logger.info('Mostrando reportes de mantenimiento');
    // TODO: Implementar vista de reportes
  };

  const handleSettings = () => {
    logger.info('Abriendo configuración de mantenimiento');
    // TODO: Implementar configuración
  };

  const handleRefresh = async () => {
    logger.info('Refrescando datos de mantenimiento');
    await loadPageData();
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // TODO: Implement API call to approve request
      setMaintenanceRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: 'APPROVED' as const } : r))
      );
      logger.info('Solicitud de mantenimiento aprobada:', { requestId });
    } catch (error) {
      logger.error('Error aprobando solicitud:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // TODO: Implement API call to reject request
      setMaintenanceRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: 'REJECTED' as const } : r))
      );
      logger.info('Solicitud de mantenimiento rechazada:', { requestId });
    } catch (error) {
      logger.error('Error rechazando solicitud:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleAssignProvider = async (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    await loadAvailableProviders();
    setShowAssignProviderDialog(true);
  };

  const loadAvailableProviders = async () => {
    try {
      // Mock data for available providers with different specialties
      const mockProviders = [
        {
          id: '1',
          name: 'Carlos Rodríguez',
          specialty: 'Mantenimiento General',
          rating: 4.8,
          location: 'Santiago Centro',
          hourlyRate: 15000,
          availability: 'available',
          experience: '5 años',
          completedJobs: 127,
        },
        {
          id: '2',
          name: 'María González',
          specialty: 'Limpieza Profesional',
          rating: 4.9,
          location: 'Providencia',
          hourlyRate: 12000,
          availability: 'available',
          experience: '3 años',
          completedJobs: 89,
        },
        {
          id: '3',
          name: 'Pedro Sánchez',
          specialty: 'Reparaciones Eléctricas',
          rating: 4.6,
          location: 'Las Condes',
          hourlyRate: 18000,
          availability: 'busy',
          experience: '7 años',
          completedJobs: 156,
        },
        {
          id: '4',
          name: 'Ana López',
          specialty: 'Jardinería',
          rating: 4.7,
          location: 'Vitacura',
          hourlyRate: 14000,
          availability: 'available',
          experience: '4 años',
          completedJobs: 73,
        },
        {
          id: '5',
          name: 'Roberto Silva',
          specialty: 'Plomería',
          rating: 4.5,
          location: 'Ñuñoa',
          hourlyRate: 16000,
          availability: 'available',
          experience: '6 años',
          completedJobs: 98,
        },
        {
          id: '6',
          name: 'Carmen Torres',
          specialty: 'Pintura y Decoración',
          rating: 4.7,
          location: 'La Reina',
          hourlyRate: 13000,
          availability: 'available',
          experience: '8 años',
          completedJobs: 203,
        },
        {
          id: '7',
          name: 'Diego Morales',
          specialty: 'Carpintería',
          rating: 4.9,
          location: 'Macul',
          hourlyRate: 17000,
          availability: 'available',
          experience: '10 años',
          completedJobs: 245,
        },
        {
          id: '8',
          name: 'Patricia Soto',
          specialty: 'Mantenimiento General',
          rating: 4.4,
          location: 'Peñalolén',
          hourlyRate: 11000,
          availability: 'available',
          experience: '2 años',
          completedJobs: 45,
        },
      ];

      setAvailableProviders(mockProviders);
    } catch (error) {
      logger.error('Error cargando proveedores:', { error });
    }
  };

  // Función para filtrar y ordenar proveedores
  const getFilteredAndSortedProviders = () => {
    let filtered = availableProviders;

    // Filtrar por especialidad
    if (providerFilters.specialty !== 'all') {
      filtered = filtered.filter(provider =>
        provider.specialty.toLowerCase().includes(providerFilters.specialty.toLowerCase())
      );
    }

    // Ordenar según criterio seleccionado
    switch (providerFilters.sortBy) {
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case 'experience':
        filtered.sort((a, b) => {
          const expA = parseInt(a.experience.split(' ')[0]);
          const expB = parseInt(b.experience.split(' ')[0]);
          return expB - expA;
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const handleConfirmProviderAssignment = async () => {
    if (!selectedRequest || !selectedProvider) {
      return;
    }

    try {
      const provider = availableProviders.find(p => p.id === selectedProvider);

      // TODO: Implement API call to assign provider
      setMaintenanceRequests(prev =>
        prev.map(r =>
          r.id === selectedRequest.id
            ? { ...r, status: 'IN_PROGRESS' as const, provider: provider?.name }
            : r
        )
      );

      setShowAssignProviderDialog(false);
      setSelectedProvider('');
      setSelectedRequest(null);

      logger.info('Proveedor asignado a solicitud:', {
        requestId: selectedRequest.id,
        providerId: selectedProvider,
        providerName: provider?.name,
      });
    } catch (error) {
      logger.error('Error asignando proveedor:', {
        error: error instanceof Error ? error.message : String(error),
        requestId: selectedRequest?.id,
      });
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Error al cargar la página">
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">Aprobada</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-emerald-100 text-emerald-800">En Progreso</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Crítica</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300">Alta</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Media</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Baja</Badge>;
      default:
        return <Badge variant="outline">{urgency}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'REPAIR':
        return 'Reparación';
      case 'MAINTENANCE':
        return 'Mantenimiento';
      case 'EMERGENCY':
        return 'Emergencia';
      case 'INSPECTION':
        return 'Inspección';
      default:
        return type;
    }
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch =
      request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <UnifiedDashboardLayout
      title="Mantenimiento"
      subtitle="Gestiona solicitudes y trabajos de mantenimiento"
    >
      <div className="space-y-6">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-emerald-900">{stats.totalRequests}</p>
                  <p className="text-xs text-emerald-600 mt-1">Este mes</p>
                </div>
                <div className="w-12 h-12 bg-emerald-200 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Pendientes</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.pendingRequests}</p>
                  <p className="text-xs text-blue-600 mt-1">Requieren atención</p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">En Progreso</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.activeRequests}</p>
                  <p className="text-xs text-yellow-600 mt-1">Activos actualmente</p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Costo Total</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPrice(stats.totalCost)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {formatPrice(stats.monthlyCost)} este mes
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Mantenimiento</CardTitle>
            <CardDescription>
              Gestiona todas las solicitudes de mantenimiento de tus propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por propiedad, inquilino o descripción..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobadas</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completadas</SelectItem>
                  <SelectItem value="REJECTED">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista de solicitudes */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron solicitudes
                  </h3>
                  <p className="text-gray-600">
                    No hay solicitudes de mantenimiento que coincidan con los criterios de búsqueda.
                  </p>
                </div>
              ) : (
                filteredRequests.map(request => (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{request.propertyTitle}</h3>
                          {getStatusBadge(request.status)}
                          {getUrgencyBadge(request.urgency)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="w-4 h-4" />
                              <span>Inquilino: {request.tenantName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Settings className="w-4 h-4" />
                              <span>Tipo: {getTypeLabel(request.type)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Creado: {new Date(request.createdAt).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>Costo estimado: {formatPrice(request.estimatedCost)}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 mb-3">{request.description}</p>
                        {request.provider && (
                          <p className="text-sm text-emerald-700">
                            <strong>Proveedor asignado:</strong> {request.provider}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalles
                        </Button>
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => handleRejectRequest(request.id)}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Rechazar
                            </Button>
                          </>
                        )}
                        {request.status === 'APPROVED' && !request.provider && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAssignProvider(request)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Asignar Proveedor
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

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
                className="h-20 flex flex-col items-center justify-center hover:bg-emerald-50 border-emerald-200"
                onClick={handleNewRequest}
              >
                <Plus className="w-6 h-6 mb-2 text-emerald-600" />
                <span>Programar Mantenimiento</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 border-blue-200"
                onClick={handleFilterRequests}
              >
                <Filter className="w-6 h-6 mb-2 text-blue-600" />
                <span>Filtrar Solicitudes</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 border-orange-200"
                onClick={handleExportData}
              >
                <Download className="w-6 h-6 mb-2 text-orange-600" />
                <span>Exportar Datos</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 border-purple-200"
                onClick={handleViewReports}
              >
                <BarChart3 className="w-6 h-6 mb-2 text-purple-600" />
                <span>Ver Reportes</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-gray-50 border-gray-200"
                onClick={handleSettings}
              >
                <Settings className="w-6 h-6 mb-2 text-gray-600" />
                <span>Configuración</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center hover:bg-green-50 border-green-200"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-6 h-6 mb-2 text-green-600" />
                <span>Actualizar Datos</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles de Solicitud de Mantenimiento</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información de la Propiedad</h4>
                  <p>
                    <strong>Propiedad:</strong> {selectedRequest.propertyTitle}
                  </p>
                  <p>
                    <strong>ID:</strong> {selectedRequest.propertyId}
                  </p>
                  <p>
                    <strong>Inquilino:</strong> {selectedRequest.tenantName}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Detalles del Trabajo</h4>
                  <p>
                    <strong>Tipo:</strong> {getTypeLabel(selectedRequest.type)}
                  </p>
                  <p>
                    <strong>Urgencia:</strong> {getUrgencyBadge(selectedRequest.urgency)}
                  </p>
                  <p>
                    <strong>Estado:</strong> {getStatusBadge(selectedRequest.status)}
                  </p>
                  <p>
                    <strong>Costo Estimado:</strong> {formatPrice(selectedRequest.estimatedCost)}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Fechas</h4>
                  <p>
                    <strong>Creado:</strong>{' '}
                    {new Date(selectedRequest.createdAt).toLocaleString('es-ES')}
                  </p>
                  {selectedRequest.scheduledDate && (
                    <p>
                      <strong>Programado:</strong>{' '}
                      {new Date(selectedRequest.scheduledDate).toLocaleString('es-ES')}
                    </p>
                  )}
                  {selectedRequest.completedDate && (
                    <p>
                      <strong>Completado:</strong>{' '}
                      {new Date(selectedRequest.completedDate).toLocaleString('es-ES')}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Proveedor</h4>
                  {selectedRequest.provider ? (
                    <p className="text-emerald-700">{selectedRequest.provider}</p>
                  ) : (
                    <p className="text-gray-500">No asignado</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para asignar proveedor */}
      <Dialog open={showAssignProviderDialog} onOpenChange={setShowAssignProviderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Asignar Proveedor de Mantenimiento</DialogTitle>
            <DialogDescription>
              Selecciona un proveedor verificado para esta solicitud de mantenimiento
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Información de la solicitud */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Información de la Solicitud</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Propiedad</p>
                      <p className="font-medium">{selectedRequest.propertyTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Trabajo</p>
                      <p className="font-medium">{getTypeLabel(selectedRequest.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Inquilino</p>
                      <p className="font-medium">{selectedRequest.tenantName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Costo Estimado</p>
                      <p className="font-medium">{formatPrice(selectedRequest.estimatedCost)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">Descripción</p>
                    <p className="bg-gray-50 p-3 rounded mt-1">{selectedRequest.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Filtros de búsqueda */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="text-md font-semibold mb-3">Buscar y Filtrar Proveedores</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialty-filter" className="text-sm font-medium">
                      Especialidad
                    </Label>
                    <Select
                      value={providerFilters.specialty}
                      onValueChange={value =>
                        setProviderFilters(prev => ({ ...prev, specialty: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las especialidades</SelectItem>
                        <SelectItem value="Mantenimiento General">Mantenimiento General</SelectItem>
                        <SelectItem value="Plomería">Plomería</SelectItem>
                        <SelectItem value="Reparaciones Eléctricas">
                          Reparaciones Eléctricas
                        </SelectItem>
                        <SelectItem value="Jardinería">Jardinería</SelectItem>
                        <SelectItem value="Limpieza">Limpieza Profesional</SelectItem>
                        <SelectItem value="Pintura">Pintura y Decoración</SelectItem>
                        <SelectItem value="Carpintería">Carpintería</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sort-filter" className="text-sm font-medium">
                      Ordenar por
                    </Label>
                    <Select
                      value={providerFilters.sortBy}
                      onValueChange={value =>
                        setProviderFilters(prev => ({ ...prev, sortBy: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ordenar por..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Calificación más alta</SelectItem>
                        <SelectItem value="price_low">Precio más bajo</SelectItem>
                        <SelectItem value="price_high">Precio más alto</SelectItem>
                        <SelectItem value="experience">Más experiencia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Selección de proveedor */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Proveedores Disponibles ({getFilteredAndSortedProviders().length})
                </h3>
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {getFilteredAndSortedProviders().map(provider => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedProvider(provider.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{provider.name}</h4>
                              <p className="text-sm text-gray-600">{provider.specialty}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm">{provider.rating}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{provider.location}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">
                                    {formatPrice(provider.hourlyRate)}/hora
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                provider.availability === 'available'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {provider.availability === 'available' ? 'Disponible' : 'Ocupado'}
                            </Badge>
                            {selectedProvider === provider.id && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignProviderDialog(false);
                    setSelectedProvider('');
                    setSelectedRequest(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleConfirmProviderAssignment}
                  disabled={!selectedProvider}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Asignar Proveedor
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
