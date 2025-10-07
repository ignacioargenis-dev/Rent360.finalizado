'use client';

import React, { useState, useEffect } from 'react';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Wrench,
  Building,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Phone,
  MessageSquare,
  DollarSign,
  Star,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface MaintenanceRequest {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  issueType: 'plumbing' | 'electrical' | 'structural' | 'painting' | 'cleaning' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  providerName?: string;
  createdAt: string;
  scheduledDate?: string;
  completedDate?: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

interface MaintenanceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  urgentRequests: number;
  totalEstimatedCost: number;
  totalActualCost: number;
  averageResolutionTime: number;
}

export default function BrokerMaintenancePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<MaintenanceStats>({
    totalRequests: 0,
    pendingRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    urgentRequests: 0,
    totalEstimatedCost: 0,
    totalActualCost: 0,
    averageResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignProviderDialog, setShowAssignProviderDialog] = useState(false);
  const [selectedRequestForAssignment, setSelectedRequestForAssignment] =
    useState<MaintenanceRequest | null>(null);
  const [availableProviders, setAvailableProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [providerFilters, setProviderFilters] = useState({
    specialty: 'all',
    sortBy: 'rating', // 'rating', 'price_low', 'price_high', 'experience'
  });

  useEffect(() => {
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
        // Mock maintenance data
        const mockRequests: MaintenanceRequest[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 123, Providencia',
            ownerName: 'María González',
            tenantName: 'Carlos Ramírez',
            issueType: 'plumbing',
            priority: 'high',
            status: 'in_progress',
            description: 'Fuga en grifería de cocina, agua saliendo constantemente',
            estimatedCost: 45000,
            providerName: 'Plomería Rápida',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
            urgency: 'urgent',
          },
          {
            id: '2',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'Calle Las Condes 456, Las Condes',
            ownerName: 'Roberto Díaz',
            tenantName: 'Ana López',
            issueType: 'electrical',
            priority: 'medium',
            status: 'pending',
            description: 'Cambiar tomacorrientes en sala de estar, están sueltos',
            estimatedCost: 35000,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            urgency: 'routine',
          },
          {
            id: '3',
            propertyTitle: 'Oficina Corporativa Centro',
            propertyAddress: 'Av. Libertador 789, Santiago Centro',
            ownerName: 'Empresa ABC Ltda',
            tenantName: 'Tech Solutions SpA',
            issueType: 'cleaning',
            priority: 'low',
            status: 'completed',
            description: 'Limpieza general de oficinas y baños',
            estimatedCost: 80000,
            actualCost: 75000,
            providerName: 'Limpieza Express',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            completedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
            urgency: 'routine',
          },
          {
            id: '4',
            propertyTitle: 'Local Comercial Ñuñoa',
            propertyAddress: 'Irarrázaval 321, Ñuñoa',
            ownerName: 'Patricia Soto',
            tenantName: 'Café Paradiso',
            issueType: 'structural',
            priority: 'urgent',
            status: 'assigned',
            description: 'Puerta de entrada no cierra correctamente, bisagra dañada',
            estimatedCost: 65000,
            providerName: 'Cerrajería 24/7',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
            scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
            urgency: 'urgent',
          },
        ];

        setMaintenanceRequests(mockRequests);

        // Calculate stats
        const pendingRequests = mockRequests.filter(r => r.status === 'pending').length;
        const inProgressRequests = mockRequests.filter(
          r => r.status === 'in_progress' || r.status === 'assigned'
        ).length;
        const completedRequests = mockRequests.filter(r => r.status === 'completed').length;
        const urgentRequests = mockRequests.filter(r => r.urgency === 'urgent').length;
        const totalEstimatedCost = mockRequests.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
        const totalActualCost = mockRequests
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + (r.actualCost || 0), 0);

        const maintenanceStats: MaintenanceStats = {
          totalRequests: mockRequests.length,
          pendingRequests,
          inProgressRequests,
          completedRequests,
          urgentRequests,
          totalEstimatedCost,
          totalActualCost,
          averageResolutionTime: 3.2, // días promedio
        };

        setStats(maintenanceStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading maintenance data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadMaintenanceData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      assigned: { label: 'Asignado', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getIssueTypeBadge = (type: string) => {
    const typeConfig = {
      plumbing: { label: 'Plomería', color: 'bg-blue-100 text-blue-800' },
      electrical: { label: 'Eléctrica', color: 'bg-yellow-100 text-yellow-800' },
      structural: { label: 'Estructural', color: 'bg-red-100 text-red-800' },
      painting: { label: 'Pintura', color: 'bg-green-100 text-green-800' },
      cleaning: { label: 'Limpieza', color: 'bg-purple-100 text-purple-800' },
      other: { label: 'Otro', color: 'bg-gray-100 text-gray-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.other;

    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-CL');
    }
  };

  const handleViewRequest = (requestId: string) => {
    // Navigate to maintenance request detail view
    window.open(`/broker/maintenance/${requestId}`, '_blank');
  };

  const handleContactProvider = (requestId: string) => {
    // Contact the assigned provider
    const request = maintenanceRequests.find(r => r.id === requestId);
    if (request && request.providerName) {
      alert(`Contactando a ${request.providerName}\nSolicitud: ${request.description}`);
      // Here you could integrate with email/messaging system
    } else {
      alert('No hay proveedor asignado para esta solicitud');
    }
  };

  const handleScheduleVisit = (requestId: string) => {
    // Schedule a visit for maintenance
    const request = maintenanceRequests.find(r => r.id === requestId);
    if (request) {
      const visitDate = prompt(
        `Agendar visita para "${request.description}"\nFecha sugerida (YYYY-MM-DD):`,
        new Date().toISOString().split('T')[0]
      );
      if (visitDate) {
        alert(`Visita agendada para el ${visitDate}`);
      }
    }
  };

  const handleAssignProvider = async (request: MaintenanceRequest) => {
    setSelectedRequestForAssignment(request);
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
    if (!selectedRequestForAssignment || !selectedProvider) {
      return;
    }

    try {
      const provider = availableProviders.find(p => p.id === selectedProvider);

      // TODO: Implement API call to assign provider
      setMaintenanceRequests(prev =>
        prev.map(r =>
          r.id === selectedRequestForAssignment.id
            ? { ...r, status: 'assigned' as const, providerName: provider?.name }
            : r
        )
      );

      setShowAssignProviderDialog(false);
      setSelectedProvider('');
      setSelectedRequestForAssignment(null);

      logger.info('Proveedor asignado a solicitud:', {
        requestId: selectedRequestForAssignment.id,
        providerId: selectedProvider,
        providerName: provider?.name,
      });
    } catch (error) {
      logger.error('Error asignando proveedor:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch =
      request.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || request.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes de mantenimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mantenimiento"
      subtitle="Gestiona solicitudes de mantenimiento de tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Solicitudes de Mantenimiento</h1>
            <p className="text-gray-600">Coordina reparaciones y mantenimientos de propiedades</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRequests}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgentRequests}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Costo Estimado Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(stats.totalEstimatedCost)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar solicitudes por propiedad, propietario o descripción..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="assigned">Asignados</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Maintenance Requests List */}
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <Card
              key={request.id}
              className={`border-l-4 ${request.urgency === 'emergency' ? 'border-l-red-500' : request.urgency === 'urgent' ? 'border-l-orange-500' : 'border-l-blue-500'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${request.urgency === 'emergency' ? 'bg-red-50' : request.urgency === 'urgent' ? 'bg-orange-50' : 'bg-blue-50'}`}
                    >
                      <Wrench className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{request.propertyTitle}</h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                        {getIssueTypeBadge(request.issueType)}
                        {request.urgency === 'emergency' && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            EMERGENCIA
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">{request.propertyAddress}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span>Propietario: {request.ownerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4" />
                            <span>Inquilino: {request.tenantName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Reportado: {formatRelativeTime(request.createdAt)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          {request.estimatedCost && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Costo estimado: {formatCurrency(request.estimatedCost)}</span>
                            </div>
                          )}
                          {request.actualCost && (
                            <div className="flex items-center gap-2 text-sm text-green-600 mb-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Costo real: {formatCurrency(request.actualCost)}</span>
                            </div>
                          )}
                          {request.providerName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Wrench className="w-4 h-4" />
                              <span>Proveedor: {request.providerName}</span>
                            </div>
                          )}
                          {request.scheduledDate && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Calendar className="w-4 h-4" />
                              <span>Programado: {formatDateTime(request.scheduledDate)}</span>
                            </div>
                          )}
                          {request.completedDate && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Completado: {formatDateTime(request.completedDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewRequest(request.id)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {request.providerName && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContactProvider(request.id)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    )}
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleScheduleVisit(request.id)}
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                    )}
                    {!request.providerName && request.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleAssignProvider(request)}
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Wrench className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay solicitudes de mantenimiento
            </h3>
            <p className="text-gray-600">
              Las solicitudes aparecerán aquí cuando se reporten problemas
            </p>
          </div>
        )}

        {/* Modal para asignar proveedor */}
        {showAssignProviderDialog && selectedRequestForAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Asignar Proveedor de Mantenimiento</h3>
                <button
                  onClick={() => {
                    setShowAssignProviderDialog(false);
                    setSelectedProvider('');
                    setSelectedRequestForAssignment(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

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
                        <p className="font-medium">{selectedRequestForAssignment.propertyTitle}</p>
                        <p className="text-sm text-gray-500">
                          {selectedRequestForAssignment.propertyAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Problema</p>
                        <p className="font-medium capitalize">
                          {selectedRequestForAssignment.issueType}
                        </p>
                        <p className="text-sm text-gray-600">
                          Prioridad: {selectedRequestForAssignment.priority}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Propietario</p>
                        <p className="font-medium">{selectedRequestForAssignment.ownerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Inquilino</p>
                        <p className="font-medium">{selectedRequestForAssignment.tenantName}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">Descripción</p>
                      <p className="bg-gray-50 p-3 rounded mt-1">
                        {selectedRequestForAssignment.description}
                      </p>
                      {selectedRequestForAssignment.estimatedCost && (
                        <p className="text-sm text-gray-600 mt-2">
                          Costo estimado: $
                          {selectedRequestForAssignment.estimatedCost.toLocaleString('es-CL')}
                        </p>
                      )}
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
                          <SelectItem value="Mantenimiento General">
                            Mantenimiento General
                          </SelectItem>
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
                                      ${provider.hourlyRate.toLocaleString('es-CL')}/hora
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
                      setSelectedRequestForAssignment(null);
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
            </div>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
