'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
import {
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  Home,
  Search,
  User,
  Eye,
  Paperclip,
  Wrench,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface MaintenanceRequest {
  id: string;
  propertyId: string;
  propertyTitle: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  assignedTo?: string;
  category: 'electrical' | 'plumbing' | 'structural' | 'appliance' | 'general' | 'other';
  attachments?: string[];
}

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  urgentRequests: number;
  totalCost: number;
  averageResolutionTime: number;
}

export default function MantenimientoPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    urgentRequests: 0,
    totalCost: 0,
    averageResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  useEffect(() => {
    loadUserData();
    loadMaintenanceData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      logger.error('Error loading user data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock maintenance data
      const mockRequests: MaintenanceRequest[] = [
        {
          id: '1',
          propertyId: '1',
          propertyTitle: 'Departamento Las Condes',
          title: 'Fuga en grifería de cocina',
          description:
            'La grifería de la cocina tiene una fuga constante de agua que aumenta la cuenta mensual',
          status: 'in_progress',
          priority: 'high',
          category: 'plumbing',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          estimatedCost: 25000,
          assignedTo: 'Juan Pérez',
        },
        {
          id: '2',
          propertyId: '1',
          propertyTitle: 'Departamento Las Condes',
          title: 'Bombilla del baño principal quemada',
          description: 'La bombilla del baño principal se quemó y necesita reemplazo',
          status: 'completed',
          priority: 'low',
          category: 'electrical',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
          resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
          estimatedCost: 5000,
          actualCost: 4500,
          assignedTo: 'María López',
        },
        {
          id: '3',
          propertyId: '2',
          propertyTitle: 'Oficina Providencia',
          title: 'Problema con aire acondicionado',
          description: 'El aire acondicionado no enfría correctamente y hace ruido extraño',
          status: 'pending',
          priority: 'urgent',
          category: 'appliance',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          estimatedCost: 80000,
        },
        {
          id: '4',
          propertyId: '1',
          propertyTitle: 'Departamento Las Condes',
          title: 'Puerta del balcón atascada',
          description:
            'La puerta del balcón se atasca al abrir y cerrar, necesita lubricación o reparación',
          status: 'pending',
          priority: 'medium',
          category: 'structural',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          estimatedCost: 15000,
        },
      ];

      setMaintenanceRequests(mockRequests);

      // Calculate stats
      const totalRequests = mockRequests.length;
      const pendingRequests = mockRequests.filter(r => r.status === 'pending').length;
      const inProgressRequests = mockRequests.filter(r => r.status === 'in_progress').length;
      const completedRequests = mockRequests.filter(r => r.status === 'completed').length;
      const urgentRequests = mockRequests.filter(r => r.priority === 'urgent').length;
      const totalCost = mockRequests
        .filter(r => r.actualCost)
        .reduce((sum, r) => sum + (r.actualCost || 0), 0);
      const averageResolutionTime = 2.5; // days

      setStats({
        totalRequests,
        pendingRequests,
        inProgressRequests,
        completedRequests,
        urgentRequests,
        totalCost,
        averageResolutionTime,
      });

      setError(null);
    } catch (error) {
      logger.error('Error loading maintenance data:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los datos de mantenimiento');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Cargando información...">
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
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadMaintenanceData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical':
        return <Settings className="w-4 h-4 text-yellow-600" />;
      case 'plumbing':
        return <Building className="w-4 h-4 text-blue-600" />;
      case 'structural':
        return <Home className="w-4 h-4 text-gray-600" />;
      case 'appliance':
        return <BarChart3 className="w-4 h-4 text-purple-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryName = (category: string) => {
    const categories = {
      electrical: 'Eléctrica',
      plumbing: 'Plomería',
      structural: 'Estructural',
      appliance: 'Electrodomésticos',
      general: 'General',
      other: 'Otro',
    };
    return categories[category as keyof typeof categories] || category;
  };

  const handleNewRequest = () => {
    setShowNewRequestModal(true);
  };

  const handleExportReport = () => {
    // Simulate export
    if (maintenanceRequests.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const csvData = maintenanceRequests.map(request => ({
      ID: request.id,
      Propiedad: request.propertyTitle,
      Título: request.title,
      Estado: request.status,
      Prioridad: request.priority,
      Categoría: getCategoryName(request.category),
      'Costo Estimado': request.estimatedCost ? formatCurrency(request.estimatedCost) : '',
      'Costo Real': request.actualCost ? formatCurrency(request.actualCost) : '',
      'Fecha Creación': formatDate(request.createdAt),
      'Fecha Resolución': request.resolvedAt ? formatDate(request.resolvedAt) : '',
      'Asignado a': request.assignedTo || '',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `solicitudes_mantenimiento_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Mantenimiento"
      subtitle="Gestiona tus solicitudes de mantenimiento y reparaciones"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Mantenimiento</h1>
            <p className="text-gray-600">
              Reporta problemas y sigue el progreso de las reparaciones
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={handleNewRequest}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.inProgressRequests}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pendingRequests}</p>
                  {stats.urgentRequests > 0 && (
                    <p className="text-xs text-red-600">{stats.urgentRequests} urgentes</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo Total</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(stats.totalCost)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {stats.averageResolutionTime.toFixed(1)} días promedio
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar solicitudes..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={priorityFilter}
                  onChange={e => setPriorityFilter(e.target.value)}
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="urgent">Urgentes</option>
                  <option value="high">Altas</option>
                  <option value="medium">Medias</option>
                  <option value="low">Bajas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(request.category)}
                        <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                    </div>

                    <p className="text-gray-600 mb-3">{request.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Propiedad:</span>
                        <p className="font-medium">{request.propertyTitle}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Categoría:</span>
                        <p className="font-medium">{getCategoryName(request.category)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Creado:</span>
                        <p className="font-medium">{formatDate(request.createdAt)}</p>
                      </div>
                      {request.resolvedAt && (
                        <div>
                          <span className="text-gray-600">Resuelto:</span>
                          <p className="font-medium">{formatDate(request.resolvedAt)}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {request.assignedTo && (
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>Asignado a: {request.assignedTo}</span>
                        </div>
                      )}
                      {request.estimatedCost && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>Est. {formatCurrency(request.estimatedCost)}</span>
                        </div>
                      )}
                      {request.actualCost && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Real {formatCurrency(request.actualCost)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    {request.attachments && request.attachments.length > 0 && (
                      <Button size="sm" variant="outline">
                        <Paperclip className="w-4 h-4 mr-2" />
                        Ver Adjuntos ({request.attachments.length})
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredRequests.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'No se encontraron solicitudes'
                    : 'No tienes solicitudes de mantenimiento'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Intenta ajustar tus filtros de búsqueda.'
                    : 'Si tienes algún problema en tu propiedad, puedes crear una nueva solicitud.'}
                </p>
                <Button onClick={handleNewRequest}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Solicitud
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Funciones útiles para gestionar tus solicitudes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <QuickActionButton
                icon={Plus}
                label="Nueva Solicitud"
                description="Reportar problema"
                onClick={handleNewRequest}
              />

              <QuickActionButton
                icon={RefreshCw}
                label="Actualizar"
                description="Recargar datos"
                onClick={loadMaintenanceData}
              />

              <QuickActionButton
                icon={Download}
                label="Exportar"
                description="Descargar reportes"
                onClick={handleExportReport}
              />

              <QuickActionButton
                icon={BarChart3}
                label="Reportes"
                description="Historial completo"
                onClick={() => router.push('/tenant/reports/maintenance')}
              />

              <QuickActionButton
                icon={Settings}
                label="Configuración"
                description="Preferencias"
                onClick={() => router.push('/tenant/settings')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
