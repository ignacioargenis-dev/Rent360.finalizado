'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Wrench,
  Search,
  Filter,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Building,
  User,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { User as UserType } from '@/types';

interface VisitProposal {
  id: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  estimatedDuration?: number | null;
  status?: string | null;
  proposedBy?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  specialInstructions?: string | null;
  acceptedAt?: string | null;
  acceptedBy?: string | null;
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status:
    | 'OPEN'
    | 'PENDING'
    | 'ASSIGNED'
    | 'QUOTE_PENDING'
    | 'QUOTE_APPROVED'
    | 'APPROVED'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'PENDING_CONFIRMATION'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';
  estimatedCost?: number;
  actualCost?: number;
  requestedBy: string;
  requesterRole: string;
  assignedTo?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
  requester: {
    name: string;
    email: string;
  };
  assignedProvider?: {
    businessName: string;
  };
  visitProposal?: VisitProposal;
}

export default function BrokerMaintenancePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
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
        logger.error('Error loading user data:', { error });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    if (user) {
      loadMaintenanceRequests();
    }
  }, [user, searchTerm, statusFilter, priorityFilter, categoryFilter, currentPage]);

  const loadMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        page: currentPage.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/maintenance?${params}`);
      if (response.ok) {
        const data = await response.json();
        const transformed: MaintenanceRequest[] = data.maintenanceRequests.map((request: any) => ({
          ...request,
          visitProposal: request.visitProposal
            ? {
                id: request.visitProposal.id,
                scheduledDate: request.visitProposal.scheduledDate,
                scheduledTime: request.visitProposal.scheduledTime,
                estimatedDuration: request.visitProposal.estimatedDuration,
                status: request.visitProposal.status,
                proposedBy: request.visitProposal.proposedBy,
                contactPerson: request.visitProposal.contactPerson,
                contactPhone: request.visitProposal.contactPhone,
                specialInstructions: request.visitProposal.specialInstructions,
                acceptedAt: request.visitProposal.acceptedAt,
                acceptedBy: request.visitProposal.acceptedBy,
              }
            : undefined,
        }));
        setMaintenanceRequests(transformed);
        setTotalPages(data.pagination.pages);
        setStats(calculateStats(transformed));
      }
    } catch (error) {
      logger.error('Error loading maintenance requests:', { error });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (requests: MaintenanceRequest[]) => {
    return {
      total: requests.length,
      open: requests.filter(r => r.status === 'OPEN').length,
      inProgress: requests.filter(r => r.status === 'IN_PROGRESS').length,
      completed: requests.filter(r => r.status === 'COMPLETED').length,
    };
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
      case 'PENDING_CONFIRMATION':
        return <Badge className="bg-yellow-100 text-yellow-800">Esperando Confirmación</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>;
      case 'REJECTED':
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-800">Baja</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-100 text-blue-800">Media</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">Alta</Badge>;
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-800">Urgente</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'MEDIUM':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRequesterRoleBadge = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Badge className="bg-purple-100 text-purple-800">Propietario</Badge>;
      case 'TENANT':
        return <Badge className="bg-green-100 text-green-800">Inquilino</Badge>;
      case 'BROKER':
        return <Badge className="bg-blue-100 text-blue-800">Corredor</Badge>;
      case 'ADMIN':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{role}</Badge>;
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    try {
      return new Date(value).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return value;
    }
  };

  const isWaitingForProviderResponse = (request: MaintenanceRequest) =>
    request.visitProposal?.status === 'PROPOSED' &&
    (request.visitProposal.proposedBy === 'OWNER' ||
      request.visitProposal.proposedBy === 'BROKER' ||
      request.visitProposal.proposedBy === 'ADMIN' ||
      !request.visitProposal.proposedBy);

  const isWaitingForOwnerResponse = (request: MaintenanceRequest) =>
    request.visitProposal?.status === 'PROPOSED' && request.visitProposal.proposedBy === 'PROVIDER';

  const renderVisitStatusBadge = (request: MaintenanceRequest) => {
    if (!request.visitProposal) {
      return <Badge variant="outline">Sin propuesta</Badge>;
    }

    if (isWaitingForProviderResponse(request)) {
      return <Badge className="bg-blue-100 text-blue-800">Esperando proveedor</Badge>;
    }

    if (isWaitingForOwnerResponse(request)) {
      return <Badge className="bg-orange-100 text-orange-800">Proveedor propuso fecha</Badge>;
    }

    if (request.visitProposal.status === 'ACCEPTED') {
      return <Badge className="bg-emerald-100 text-emerald-800">Visita confirmada</Badge>;
    }

    return <Badge variant="outline">{request.visitProposal.status}</Badge>;
  };

  if (loading && !user) {
    return (
      <UnifiedDashboardLayout title="Mantenimiento" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mantenimiento de Propiedades"
      subtitle="Gestiona las solicitudes de mantenimiento para tus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Wrench className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Abiertas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar solicitudes..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="OPEN">Abiertas</SelectItem>
                  <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                  <SelectItem value="COMPLETED">Completadas</SelectItem>
                  <SelectItem value="CANCELLED">Canceladas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="LOW">Baja</SelectItem>
                  <SelectItem value="MEDIUM">Media</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="plumbing">Plomería</SelectItem>
                  <SelectItem value="electrical">Eléctrica</SelectItem>
                  <SelectItem value="structural">Estructural</SelectItem>
                  <SelectItem value="painting">Pintura</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="other">Otra</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-emerald-50 border-emerald-200">
          <CardContent className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4">
            <div className="p-3 rounded-full bg-white shadow-sm">
              <Info className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900">
                ¿Cómo coordinar la visita con el proveedor?
              </h3>
              <p className="text-sm text-emerald-800 mt-1">
                1) Envía una propuesta de fecha desde la solicitud (estado “Cotización aprobada”).
                2) El proveedor podrá aceptarla o proponer otra. 3) Cuando el proveedor responda,
                verás el aviso en la columna “Visita” para aceptar o ajustar la fecha.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes de Mantenimiento</CardTitle>
            <CardDescription>
              Lista de todas las solicitudes de mantenimiento para tus propiedades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : maintenanceRequests.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay solicitudes de mantenimiento
                </h3>
                <p className="text-gray-600">
                  Las solicitudes de mantenimiento aparecerán aquí cuando sean creadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Propiedad</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Prioridad</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Visita</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Costo Estimado</TableHead>
                      <TableHead>Fecha de Creación</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRequests.map(request => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.property.title}</div>
                            <div className="text-sm text-gray-600">{request.property.address}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">
                              {request.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPriorityIcon(request.priority)}
                            {getPriorityBadge(request.priority)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {renderVisitStatusBadge(request)}
                            {request.visitProposal && (
                              <p className="text-xs text-gray-600">
                                {formatDate(request.visitProposal.scheduledDate)} ·{' '}
                                {request.visitProposal.scheduledTime || '--:--'} hrs
                              </p>
                            )}
                            {isWaitingForOwnerResponse(request) && (
                              <p className="text-xs text-orange-700">
                                Revisa la nueva fecha propuesta por el proveedor.
                              </p>
                            )}
                            {isWaitingForProviderResponse(request) && (
                              <p className="text-xs text-blue-700">
                                Propuesta enviada. Esperando respuesta del proveedor.
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.requester.name}</div>
                            <div className="text-sm text-gray-600">
                              {getRequesterRoleBadge(request.requesterRole)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.estimatedCost ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span>{request.estimatedCost.toLocaleString()}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No especificado</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/broker/maintenance/${request.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
