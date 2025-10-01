'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TENANT' | 'OWNER' | 'BROKER' | 'RUNNER' | 'SUPPORT' | 'PROVIDER' | 'MAINTENANCE';
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
    unverified: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'TENANT' as User['role'],
    city: ''
  });

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const createUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert('Nombre y email son requeridos');
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
        role: 'TENANT',
        city: ''
      });
      setShowCreateModal(false);

      // Recargar lista de usuarios
      loadUsers();

      alert('Usuario creado exitosamente');
    } catch (error) {
      logger.error('Error creando usuario:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demo - in production this would come from API
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Carlos Ramírez',
          email: 'carlos.ramirez@email.com',
          role: 'TENANT',
          status: 'ACTIVE',
          phone: '+56 9 1234 5678',
          createdAt: '2024-01-15T10:30:00Z',
          lastLogin: '2024-03-15T14:20:00Z',
          city: 'Santiago',
          verified: true,
          ticketsCount: 3,
          propertiesCount: 1
        },
        {
          id: '2',
          name: 'Ana Martínez',
          email: 'ana.martinez@email.com',
          role: 'OWNER',
          status: 'ACTIVE',
          phone: '+56 9 8765 4321',
          createdAt: '2024-02-10T09:15:00Z',
          lastLogin: '2024-03-14T16:45:00Z',
          city: 'Providencia',
          verified: true,
          ticketsCount: 1,
          propertiesCount: 5
        },
        {
          id: '3',
          name: 'Pedro Silva',
          email: 'pedro.silva@email.com',
          role: 'BROKER',
          status: 'PENDING',
          phone: '+56 9 5555 1234',
          createdAt: '2024-03-01T11:20:00Z',
          city: 'Las Condes',
          verified: false,
          ticketsCount: 0,
          propertiesCount: 0
        },
        {
          id: '4',
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          role: 'SUPPORT',
          status: 'ACTIVE',
          phone: '+56 9 7777 8888',
          createdAt: '2024-01-01T08:00:00Z',
          lastLogin: '2024-03-15T09:30:00Z',
          city: 'Santiago',
          verified: true,
          ticketsCount: 0,
          propertiesCount: 0
        },
        {
          id: '5',
          name: 'Roberto Díaz',
          email: 'roberto.diaz@email.com',
          role: 'TENANT',
          status: 'SUSPENDED',
          phone: '+56 9 9999 0000',
          createdAt: '2024-02-20T13:45:00Z',
          lastLogin: '2024-03-10T11:15:00Z',
          city: 'Ñuñoa',
          verified: true,
          ticketsCount: 2,
          propertiesCount: 1
        }
      ];

      // Filter users based on search and filters
      let filteredUsers = mockUsers;

      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.city?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (roleFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === roleFilter);
      }

      if (statusFilter !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
      }

      setUsers(filteredUsers);

      // Calculate stats
      const newStats: UserStats = {
        total: mockUsers.length,
        active: mockUsers.filter(u => u.status === 'ACTIVE').length,
        pending: mockUsers.filter(u => u.status === 'PENDING').length,
        suspended: mockUsers.filter(u => u.status === 'SUSPENDED').length,
        verified: mockUsers.filter(u => u.verified).length,
        unverified: mockUsers.filter(u => !u.verified).length,
      };

      setStats(newStats);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      logger.error('Error loading users:', { error: error instanceof Error ? error.message : String(error) });
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-800',
      'TENANT': 'bg-blue-100 text-blue-800',
      'OWNER': 'bg-green-100 text-green-800',
      'BROKER': 'bg-purple-100 text-purple-800',
      'RUNNER': 'bg-orange-100 text-orange-800',
      'SUPPORT': 'bg-indigo-100 text-indigo-800',
      'PROVIDER': 'bg-cyan-100 text-cyan-800',
      'MAINTENANCE': 'bg-yellow-100 text-yellow-800'
    };
    return roleColors[role] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

  if (loading) {
    return (
      <DashboardLayout
        title="Gestión de Usuarios"
        subtitle="Cargando información..."
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout
        title="Gestión de Usuarios"
        subtitle="Error al cargar la página"
      >
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Gestión de Usuarios"
      subtitle="Administra y gestiona todos los usuarios del sistema"
    >
      <div className="space-y-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Esperando verificación
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspendidos</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios suspendidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
              <p className="text-xs text-muted-foreground">
                Usuarios verificados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Verificados</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unverified}</div>
              <p className="text-xs text-muted-foreground">
                Requieren verificación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>
              Filtra los usuarios por diferentes criterios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <Input
                  placeholder="Buscar por nombre, email o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
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
                onChange={(e) => setStatusFilter(e.target.value)}
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
                <CardDescription>
                  Lista de usuarios filtrados según tus criterios
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
                    <p className="text-gray-600 mb-4">
                      No hay usuarios que coincidan con los criterios de búsqueda.
                    </p>
                    <Button onClick={clearFilters}>
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg text-gray-800">{user.name}</h3>
                            <Badge className={getRoleBadge(user.role)}>
                              {user.role === 'TENANT' ? 'Inquilino' :
                               user.role === 'OWNER' ? 'Propietario' :
                               user.role === 'BROKER' ? 'Corredor' :
                               user.role === 'RUNNER' ? 'Runner' :
                               user.role === 'SUPPORT' ? 'Soporte' :
                               user.role === 'PROVIDER' ? 'Proveedor' :
                               user.role === 'MAINTENANCE' ? 'Mantenimiento' : user.role}
                            </Badge>
                            <Badge className={getStatusBadge(user.status)}>
                              {user.status === 'ACTIVE' ? 'Activo' :
                               user.status === 'INACTIVE' ? 'Inactivo' :
                               user.status === 'PENDING' ? 'Pendiente' :
                               user.status === 'SUSPENDED' ? 'Suspendido' : user.status}
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
                <Button className="w-full">
                  Crear Usuario
                </Button>
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
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="usuario@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <Input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario
                </label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as User['role']})}>
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
                  Nota: Los usuarios administradores deben ser creados por el administrador principal.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <Input
                  value={newUser.city}
                  onChange={(e) => setNewUser({...newUser, city: e.target.value})}
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
              <Button
                onClick={createUser}
                disabled={creatingUser}
              >
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
    </DashboardLayout>
  );
}
