'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
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
import { useAuth } from '@/components/auth/AuthProviderSimple';
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
  status:
    | 'OPEN'
    | 'PENDING'
    | 'ASSIGNED'
    | 'QUOTE_PENDING'
    | 'QUOTE_APPROVED'
    | 'APPROVED'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  estimatedCost: number;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  provider?: string;
  notes?: string;
  maintenanceProvider?: {
    businessName?: string;
    specialty?: string;
  };
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
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [providerDiagnostic, setProviderDiagnostic] = useState<any>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providerFilters, setProviderFilters] = useState({
    specialty: 'all',
    sortBy: 'rating', // 'rating', 'price_low', 'price_high', 'experience'
    location: 'all', // 'all', 'same_city', 'same_region'
  });
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    // Cargar datos de la página
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real maintenance data from API
      const response = await fetch('/api/maintenance?limit=100', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform API data to match our interface
      const transformedRequests: MaintenanceRequest[] = data.maintenanceRequests.map(
        (request: any) => ({
          id: request.id,
          propertyId: request.propertyId,
          propertyTitle: request.property?.title || 'Propiedad sin título',
          tenantName:
            request.requestedBy?.name || request.requester?.name || 'Usuario no identificado',
          type: request.type || 'REPAIR',
          description: request.description || 'Sin descripción',
          urgency: request.priority || 'MEDIUM',
          status: request.status || 'PENDING',
          estimatedCost: request.estimatedCost || 0,
          createdAt: request.createdAt,
          scheduledDate: request.scheduledDate,
          completedDate: request.completedDate,
          provider:
            request.maintenanceProvider?.businessName ||
            request.assignedTo?.name ||
            request.provider,
          notes: request.notes,
          maintenanceProvider: request.maintenanceProvider,
        })
      );

      setMaintenanceRequests(transformedRequests);

      // Calculate stats from real data
      const totalRequests = transformedRequests.length;
      const pendingRequests = transformedRequests.filter(r => r.status === 'PENDING').length;
      const activeRequests = transformedRequests.filter(r =>
        ['APPROVED', 'IN_PROGRESS'].includes(r.status)
      ).length;
      const completedRequests = transformedRequests.filter(r => r.status === 'COMPLETED').length;
      const totalCost = transformedRequests.reduce((sum, r) => sum + r.estimatedCost, 0);
      const monthlyCost = transformedRequests
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
    // Las solicitudes de mantenimiento se crean desde las propiedades
    alert(
      'Para crear una nueva solicitud de mantenimiento, ve a la página de Propiedades y selecciona la propiedad correspondiente.'
    );
    window.location.href = '/owner/properties';
  };

  const handleFilterRequests = () => {
    logger.info('Abriendo filtros de solicitudes');
    setShowFilterDialog(true);
  };

  const handleExportData = () => {
    logger.info('Abriendo opciones de exportación');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando datos de mantenimiento', exportOptions);

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
      const exportUrl = `/api/owner/maintenance/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `mantenimiento_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
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

      logger.info('Exportación completada exitosamente');
    } catch (error) {
      logger.error('Error exportando datos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los datos. Por favor, intenta nuevamente.');
    }
  };

  const handleViewReports = () => {
    logger.info('Navegando a reportes del propietario');
    // Navegar a la página de reportes del propietario
    window.location.href = '/owner/reports';
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
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'APPROVED',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Reload data to get updated status
      await loadPageData();
      logger.info('Solicitud de mantenimiento aprobada:', { requestId });
    } catch (error) {
      logger.error('Error aprobando solicitud:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'REJECTED',
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Reload data to get updated status
      await loadPageData();
      logger.info('Solicitud de mantenimiento rechazada:', { requestId });
    } catch (error) {
      logger.error('Error rechazando solicitud:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handleApproveQuote = async (requestId: string) => {
    try {
      const response = await fetch(`/api/maintenance/${requestId}/quote/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      await loadPageData();
      logger.info('Cotización aprobada:', { requestId });
    } catch (error) {
      logger.error('Error aprobando cotización:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert(error instanceof Error ? error.message : 'Error al aprobar la cotización');
    }
  };

  const handleRejectQuote = async (requestId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/maintenance/${requestId}/quote/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: reason || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      await loadPageData();
      logger.info('Cotización rechazada:', { requestId, reason });
    } catch (error) {
      logger.error('Error rechazando cotización:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert(error instanceof Error ? error.message : 'Error al rechazar la cotización');
    }
  };

  const handleResolveSelf = async (requestId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que deseas manejar esta solicitud por tu cuenta sin asignar un proveedor?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'COMPLETED',
          notes: `[${new Date().toLocaleString()}]: Manejado por el propietario sin proveedor asignado`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      await loadPageData();
      logger.info('Solicitud resuelta por cuenta propia:', { requestId });
    } catch (error) {
      logger.error('Error resolviendo solicitud por cuenta propia:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al marcar la solicitud como resuelta');
    }
  };

  const handleAssignProvider = async (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    await loadAvailableProviders();
    setShowAssignProviderDialog(true);
  };

  const loadAvailableProviders = async () => {
    try {
      if (!selectedRequest) {
        return;
      }

      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      if (providerFilters.location && providerFilters.location !== 'all') {
        params.append('location', providerFilters.location);
      }
      if (providerFilters.specialty && providerFilters.specialty !== 'all') {
        params.append('specialty', providerFilters.specialty);
      }

      const url = `/api/maintenance/${selectedRequest.id}/available-providers${
        params.toString() ? `?${params.toString()}` : ''
      }`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAvailableProviders(data.availableProviders || []);
      // Guardar información de diagnóstico si está disponible
      if (data.diagnostic) {
        setProviderDiagnostic(data.diagnostic);
      } else {
        setProviderDiagnostic(null);
      }
    } catch (error) {
      logger.error('Error cargando proveedores:', { error });
      // Fallback to empty array if API fails
      setAvailableProviders([]);
      setProviderDiagnostic(null);
    }
  };

  // Función auxiliar para normalizar strings (sin acentos, minúsculas)
  const normalizeString = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // Función para filtrar y ordenar proveedores
  const getFilteredAndSortedProviders = () => {
    let filtered = availableProviders;

    // El filtro de especialidad ya se aplica en el backend, pero mantenemos esta lógica
    // como respaldo por si el backend no filtra correctamente
    if (providerFilters.specialty !== 'all') {
      const filterNormalized = normalizeString(providerFilters.specialty);
      filtered = filtered.filter(provider => {
        const providerSpecialty = normalizeString(provider.specialty || '');
        const specialties = (provider.specialties || []).map((s: string) => normalizeString(s));

        return (
          providerSpecialty.includes(filterNormalized) ||
          filterNormalized.includes(providerSpecialty) ||
          providerSpecialty === filterNormalized ||
          specialties.some(
            (s: string) =>
              s.includes(filterNormalized) || filterNormalized.includes(s) || s === filterNormalized
          )
        );
      });
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
      const response = await fetch(`/api/maintenance/${selectedRequest.id}/assign-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          providerId: selectedProvider,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setShowAssignProviderDialog(false);
      setSelectedProvider('');
      setSelectedRequest(null);

      // Reload data to get updated status
      await loadPageData();

      logger.info('Proveedor asignado a solicitud:', {
        requestId: selectedRequest.id,
        providerId: selectedProvider,
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
      case 'OPEN':
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-blue-100 text-blue-800">Asignada</Badge>;
      case 'QUOTE_PENDING':
        return <Badge className="bg-orange-100 text-orange-800">Cotización Pendiente</Badge>;
      case 'QUOTE_APPROVED':
        return <Badge className="bg-purple-100 text-purple-800">Cotización Aprobada</Badge>;
      case 'APPROVED':
        return <Badge className="bg-blue-100 text-blue-800">Aprobada</Badge>;
      case 'SCHEDULED':
        return <Badge className="bg-indigo-100 text-indigo-800">Programada</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-emerald-100 text-emerald-800">En Progreso</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
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
                          <p className="text-sm text-emerald-700 mb-2">
                            <strong>Proveedor asignado:</strong> {request.provider}
                          </p>
                        )}
                        {request.status === 'QUOTE_PENDING' && request.notes && (
                          <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              Detalles de la Cotización
                            </h4>
                            <div className="space-y-2 text-sm">
                              {(() => {
                                // Parsear información de cotización desde notes
                                const quoteMatch = request.notes.match(
                                  /\[COTIZACIÓN[^\]]*\]:\s*([\s\S]*?)(?=\n\n|$)/
                                );
                                if (quoteMatch) {
                                  const quoteText = quoteMatch[1];
                                  const lines = quoteText.split('\n').filter(l => l.trim());
                                  const quoteInfo: Record<string, string> = {};

                                  lines.forEach(line => {
                                    if (line.includes('Costo:')) {
                                      quoteInfo.costo = line.replace('Costo:', '').trim();
                                    } else if (line.includes('Tiempo estimado:')) {
                                      quoteInfo.tiempo = line
                                        .replace('Tiempo estimado:', '')
                                        .trim();
                                    } else if (line.includes('Notas:')) {
                                      quoteInfo.notas = line.replace('Notas:', '').trim();
                                    } else if (line.includes('Materiales:')) {
                                      quoteInfo.materiales = line.replace('Materiales:', '').trim();
                                    } else if (line.includes('Costo mano de obra:')) {
                                      quoteInfo.manoObra = line
                                        .replace('Costo mano de obra:', '')
                                        .trim();
                                    } else if (line.includes('Costo materiales:')) {
                                      quoteInfo.costoMateriales = line
                                        .replace('Costo materiales:', '')
                                        .trim();
                                    }
                                  });

                                  return (
                                    <>
                                      {quoteInfo.costo && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Costo Total:{' '}
                                          </span>
                                          <span className="text-orange-900">{quoteInfo.costo}</span>
                                        </div>
                                      )}
                                      {quoteInfo.tiempo && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Tiempo Estimado:{' '}
                                          </span>
                                          <span className="text-orange-900">
                                            {quoteInfo.tiempo}
                                          </span>
                                        </div>
                                      )}
                                      {quoteInfo.manoObra && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Mano de Obra:{' '}
                                          </span>
                                          <span className="text-orange-900">
                                            {quoteInfo.manoObra}
                                          </span>
                                        </div>
                                      )}
                                      {quoteInfo.costoMateriales && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Materiales:{' '}
                                          </span>
                                          <span className="text-orange-900">
                                            {quoteInfo.costoMateriales}
                                          </span>
                                        </div>
                                      )}
                                      {quoteInfo.materiales && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Lista de Materiales:{' '}
                                          </span>
                                          <span className="text-orange-900">
                                            {quoteInfo.materiales}
                                          </span>
                                        </div>
                                      )}
                                      {quoteInfo.notas && (
                                        <div>
                                          <span className="font-medium text-orange-800">
                                            Notas:{' '}
                                          </span>
                                          <span className="text-orange-900">{quoteInfo.notas}</span>
                                        </div>
                                      )}
                                    </>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
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
                        {(request.status === 'OPEN' || request.status === 'PENDING') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleAssignProvider(request)}
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Asignar Proveedor
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-300 text-green-700 hover:bg-green-50"
                              onClick={() => handleResolveSelf(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Manejar por Cuenta Propia
                            </Button>
                          </>
                        )}
                        {request.status === 'QUOTE_PENDING' && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveQuote(request.id)}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Aprobar Cotización
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50"
                              onClick={() => {
                                const reason = prompt('Razón del rechazo (opcional):');
                                handleRejectQuote(request.id, reason || undefined);
                              }}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Rechazar Cotización
                            </Button>
                          </>
                        )}
                        {request.status === 'QUOTE_APPROVED' && (
                          <Button
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                              // Navegar a programar visita
                              window.location.href = `/owner/maintenance/${request.id}/schedule`;
                            }}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Programar Visita
                          </Button>
                        )}
                        {request.status === 'ASSIGNED' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleAssignProvider(request)}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Ver Proveedor
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="specialty-filter" className="text-sm font-medium">
                      Especialidad
                    </Label>
                    <Select
                      value={providerFilters.specialty}
                      onValueChange={value => {
                        setProviderFilters(prev => ({ ...prev, specialty: value }));
                        // Recargar proveedores cuando cambie el filtro de especialidad
                        setTimeout(() => {
                          loadAvailableProviders();
                        }, 100);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las especialidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las especialidades</SelectItem>
                        <SelectItem value="Mantenimiento General">Mantenimiento General</SelectItem>
                        <SelectItem value="Plomería">Plomería</SelectItem>
                        <SelectItem value="Eléctrica">Reparaciones Eléctricas</SelectItem>
                        <SelectItem value="Jardinería">Jardinería</SelectItem>
                        <SelectItem value="Limpieza">Limpieza Profesional</SelectItem>
                        <SelectItem value="Pintura">Pintura y Decoración</SelectItem>
                        <SelectItem value="Carpintería">Carpintería</SelectItem>
                        <SelectItem value="Estructural">Estructural</SelectItem>
                        <SelectItem value="Electrodomésticos">Electrodomésticos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location-filter" className="text-sm font-medium">
                      Ubicación
                    </Label>
                    <Select
                      value={providerFilters.location}
                      onValueChange={value => {
                        setProviderFilters(prev => ({ ...prev, location: value }));
                        // Recargar proveedores cuando cambie el filtro de ubicación
                        setTimeout(() => {
                          loadAvailableProviders();
                        }, 100);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas las ubicaciones" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las ubicaciones</SelectItem>
                        <SelectItem value="same_city">Misma ciudad</SelectItem>
                        <SelectItem value="same_region">Misma región</SelectItem>
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
                {getFilteredAndSortedProviders().length === 0 && providerDiagnostic && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800 mb-1">
                          No hay proveedores disponibles
                        </h4>
                        <p className="text-sm text-yellow-700 mb-2">{providerDiagnostic.message}</p>
                        {providerDiagnostic.suggestion && (
                          <p className="text-xs text-yellow-600 italic">
                            💡 {providerDiagnostic.suggestion}
                          </p>
                        )}
                        {providerDiagnostic.totalProvidersInDB > 0 &&
                          providerDiagnostic.verifiedProvidersInDB === 0 && (
                            <div className="mt-3 text-xs text-yellow-700">
                              <p>
                                <strong>Diagnóstico:</strong> Hay{' '}
                                {providerDiagnostic.totalProvidersInDB} proveedor(es) en el sistema,
                                pero ninguno está verificado. Un administrador debe aprobar los
                                proveedores pendientes.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 max-h-96 overflow-y-auto">
                  {getFilteredAndSortedProviders().length === 0 && !providerDiagnostic && (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No hay proveedores disponibles en este momento.</p>
                    </div>
                  )}
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
                  className="bg-emerald-600 hover:bg-emerald-700"
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

      {/* Modal de filtros */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar Solicitudes</DialogTitle>
            <DialogDescription>
              Aplica filtros para encontrar solicitudes específicas de mantenimiento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="filter-status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobadas</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completadas</SelectItem>
                  <SelectItem value="REJECTED">Rechazadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filter-search">Buscar por descripción</Label>
              <Input
                id="filter-search"
                placeholder="Ingrese palabras clave..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowFilterDialog(false);
                setStatusFilter('all');
                setSearchTerm('');
              }}
            >
              Limpiar Filtros
            </Button>
            <Button onClick={() => setShowFilterDialog(false)}>Aplicar Filtros</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de exportación */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Datos de Mantenimiento</DialogTitle>
            <DialogDescription>
              Selecciona el formato y filtra los datos que deseas exportar.
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
                  <SelectItem value="all">Todas las solicitudes</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobadas</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completadas</SelectItem>
                  <SelectItem value="REJECTED">Rechazadas</SelectItem>
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
                  onChange={e => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
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
                <strong>Nota:</strong> Se exportarán {filteredRequests.length} solicitudes de
                mantenimiento
                {exportOptions.format === 'csv'
                  ? ' en formato CSV compatible con Excel'
                  : ' en formato JSON'}
                {exportOptions.status !== 'all' &&
                  ` filtradas por estado "${exportOptions.status}"`}
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
              Exportar Datos
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
