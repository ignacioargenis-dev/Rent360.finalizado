'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  AlertTriangle,
  Users,
  UserCheck,
  Clock,
  UserX,
  Info,
  Plus,
  UserPlus,
  Search,
  Filter,
  Download,
  Shield,
  Eye,
  Edit,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Tag,
  ChevronRight,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

import { UserRole as UserRoleEnum } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleEnum;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  city?: string;
  verified: boolean;
  ticketsCount?: number;
  propertiesCount?: number;
}

interface UserStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  verified: number;
  unverified: number;
}

export default function SupportUsersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
    verified: 0,
    unverified: 0,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');

  // Estados para el diálogo de exportación
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    role: 'all',
    status: 'all',
    startDate: '',
    endDate: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: UserRoleEnum.TENANT,
    city: '',
  });

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      setErrorMessage('Nombre y email son requeridos');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    setCreatingUser(true);
    try {
      // TODO: Implementar API call real
      // const response = await fetch('/api/support/users', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newUser)
      // });

      // Simular creación
      await new Promise(resolve => setTimeout(resolve, 1000));

      logger.info('Usuario creado desde soporte:', { name: newUser.name, role: newUser.role });

      // Reset form
      setNewUser({
        name: '',
        email: '',
        phone: '',
        role: UserRoleEnum.TENANT,
        city: '',
      });
      setShowCreateModal(false);

      // Recargar lista de usuarios
      loadUsers();

      setSuccessMessage('Usuario creado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      logger.error('Error creando usuario:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al crear usuario. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleExportUsers = () => {
    logger.info('Abriendo opciones de exportación de usuarios de soporte');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando usuarios de soporte', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.role !== 'all') {
        params.append('role', exportOptions.role);
      }
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
      const exportUrl = `/api/support/users/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `usuarios_soporte_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        role: 'all',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de usuarios completada exitosamente');
    } catch (error) {
      logger.error('Error exportando usuarios:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los usuarios. Por favor, intenta nuevamente.');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', itemsPerPage.toString());

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter === 'active' ? 'active' : statusFilter);
      }

      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Call real API
      const response = await fetch(`/api/support/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error al cargar usuarios: ${response.status}`);
      }

      const data = await response.json();

      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
      setStats(
        data.stats || {
          total: 0,
          active: 0,
          pending: 0,
          suspended: 0,
          verified: 0,
          unverified: 0,
        }
      );

      logger.info('Usuarios cargados desde API:', { count: data.users?.length || 0 });
    } catch (error) {
      logger.error('Error al cargar usuarios:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800',
      TENANT: 'bg-blue-100 text-blue-800',
      OWNER: 'bg-green-100 text-green-800',
      BROKER: 'bg-purple-100 text-purple-800',
      RUNNER: 'bg-orange-100 text-orange-800',
      SUPPORT: 'bg-indigo-100 text-indigo-800',
      PROVIDER: 'bg-cyan-100 text-cyan-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Gestión de Usuarios" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Gestión de Usuarios" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadUsers}>
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
      title="Gestión de Usuarios"
      subtitle="Administra y gestiona todos los usuarios del sistema"
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Usuarios registrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Usuarios activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Esperando verificación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
              <p className="text-xs text-muted-foreground">Usuarios suspendidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">Usuarios verificados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Verificados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unverified}</div>
              <p className="text-xs text-muted-foreground">Requieren verificación</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra los usuarios por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por nombre, email o ciudad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Todos los roles</option>
                <option value="TENANT">Inquilino</option>
                <option value="OWNER">Propietario</option>
                <option value="BROKER">Corredor</option>
                <option value="RUNNER">Runner</option>
                <option value="SUPPORT">Soporte</option>
                <option value="PROVIDER">Proveedor</option>
                <option value="MAINTENANCE">Mantenimiento</option>
                <option value="ADMIN">Administrador</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">Todos los estados</option>
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="PENDING">Pendiente</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={loadUsers} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Buscar
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Limpiar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de usuarios */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Usuarios ({users.length})</CardTitle>
                <CardDescription>Lista de usuarios filtrados según tus criterios</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportUsers}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nuevo Usuario
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron usuarios
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No hay usuarios que coincidan con los criterios de búsqueda.
                    </p>
                    <Button onClick={clearFilters}>Limpiar Filtros</Button>
                  </div>
                ) : (
                  users.map(user => (
                    <div
                      key={user.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
                            <Badge className={getRoleBadge(user.role)}>
                              {user.role === UserRoleEnum.TENANT
                                ? 'Inquilino'
                                : user.role === UserRoleEnum.OWNER
                                  ? 'Propietario'
                                  : user.role === UserRoleEnum.BROKER
                                    ? 'Corredor'
                                    : user.role === UserRoleEnum.RUNNER
                                      ? 'Runner'
                                      : user.role === UserRoleEnum.SUPPORT
                                        ? 'Soporte'
                                        : user.role === UserRoleEnum.PROVIDER
                                          ? 'Proveedor'
                                          : user.role === UserRoleEnum.MAINTENANCE
                                            ? 'Mantenimiento'
                                            : user.role}
                            </Badge>
                            <Badge className={getStatusBadge(user.status)}>
                              {user.status === 'ACTIVE'
                                ? 'Activo'
                                : user.status === 'INACTIVE'
                                  ? 'Inactivo'
                                  : user.status === 'PENDING'
                                    ? 'Pendiente'
                                    : user.status === 'SUSPENDED'
                                      ? 'Suspendido'
                                      : user.status}
                            </Badge>
                            {user.verified && (
                              <Badge className="bg-blue-100 text-blue-800">
                                <Shield className="w-3 h-3 mr-1" />
                                Verificado
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-4 h-4" />
                              <span>{user.email}</span>
                            </div>

                            {user.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="w-4 h-4" />
                                <span>{user.phone}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>Registrado: {formatDate(user.createdAt)}</span>
                            </div>

                            {user.lastLogin && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>Último acceso: {formatDateTime(user.lastLogin)}</span>
                              </div>
                            )}

                            {user.city && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <MapPin className="w-4 h-4" />
                                <span>{user.city}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {user.ticketsCount !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Tag className="w-4 h-4" />
                                  <span>{user.ticketsCount} tickets</span>
                                </div>
                              )}
                              {user.propertiesCount !== undefined && (
                                <div className="flex items-center gap-1">
                                  <Building className="w-4 h-4" />
                                  <span>{user.propertiesCount} propiedades</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Nuevo Usuario</h3>
                <p className="text-sm text-gray-600 mb-4">Crear un usuario manualmente</p>
                <Button className="w-full">Crear Usuario</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Download className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Exportar Datos</h3>
                <p className="text-sm text-gray-600 mb-4">Descargar lista de usuarios</p>
                <Button variant="outline" className="w-full">
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Verificación</h3>
                <p className="text-sm text-gray-600 mb-4">Gestionar verificación de usuarios</p>
                <Button variant="outline" className="w-full">
                  Gestionar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
                <p className="text-sm text-gray-600 mb-4">Ver estadísticas de usuarios</p>
                <Link href="/support/reports">
                  <Button variant="outline" className="w-full">
                    Ver Reportes
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Crear Nuevo Usuario</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <Input
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                <Input
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario
                </label>
                <Select
                  value={newUser.role}
                  onValueChange={value => setNewUser({ ...newUser, role: value as User['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT">Inquilino</SelectItem>
                    <SelectItem value="OWNER">Propietario</SelectItem>
                    <SelectItem value="BROKER">Corredor</SelectItem>
                    <SelectItem value="RUNNER">Runner</SelectItem>
                    <SelectItem value="PROVIDER">Proveedor de Servicios</SelectItem>
                    <SelectItem value="MAINTENANCE">Servicio de Mantenimiento</SelectItem>
                    {/* Nota: Soporte NO puede crear administradores por seguridad */}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Nota: Los usuarios administradores deben ser creados por el administrador
                  principal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
                <Input
                  value={newUser.city}
                  onChange={e => setNewUser({ ...newUser, city: e.target.value })}
                  placeholder="Santiago"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creatingUser}
              >
                Cancelar
              </Button>
              <Button onClick={createUser} disabled={creatingUser}>
                {creatingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Usuario
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Exportar Usuarios</DialogTitle>
            <DialogDescription>
              Selecciona el formato y filtros para exportar los usuarios.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="export-format">Formato</Label>
              <Select
                value={exportOptions.format}
                onValueChange={value => setExportOptions({ ...exportOptions, format: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export-role">Rol</Label>
              <Select
                value={exportOptions.role}
                onValueChange={value => setExportOptions({ ...exportOptions, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="TENANT">Inquilino</SelectItem>
                  <SelectItem value="OWNER">Propietario</SelectItem>
                  <SelectItem value="BROKER">Corredor</SelectItem>
                  <SelectItem value="RUNNER">Runner</SelectItem>
                  <SelectItem value="SUPPORT">Soporte</SelectItem>
                  <SelectItem value="PROVIDER">Proveedor</SelectItem>
                  <SelectItem value="MAINTENANCE">Mantenimiento</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="export-status">Estado</Label>
              <Select
                value={exportOptions.status}
                onValueChange={value => setExportOptions({ ...exportOptions, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Fecha Desde</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={exportOptions.startDate}
                  onChange={e => setExportOptions({ ...exportOptions, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Fecha Hasta</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={exportOptions.endDate}
                  onChange={e => setExportOptions({ ...exportOptions, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </UnifiedDashboardLayout>
  );
}
