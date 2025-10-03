'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
    console.log('View maintenance request:', requestId);
  };

  const handleContactProvider = (requestId: string) => {
    console.log('Contact provider for request:', requestId);
  };

  const handleScheduleVisit = (requestId: string) => {
    console.log('Schedule visit for request:', requestId);
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
      </div>
    </UnifiedDashboardLayout>
  );
}
