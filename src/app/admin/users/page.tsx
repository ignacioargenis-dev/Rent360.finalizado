'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Shield,
  Users,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Loader2,
  X
} from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

export default function AdminUsersPage() {

  const [users, setUsers] = useState<User[]>([]);

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  const [roleFilter, setRoleFilter] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [creatingUser, setCreatingUser] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tenant',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      logger.error('Error fetching users:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.phone && user.phone.includes(searchQuery)),
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive,
      );
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { label: 'Administrador', className: 'bg-purple-100 text-purple-800' },
      tenant: { label: 'Inquilino', className: 'bg-blue-100 text-blue-800' },
      owner: { label: 'Propietario', className: 'bg-green-100 text-green-800' },
      broker: { label: 'Corredor', className: 'bg-orange-100 text-orange-800' },
      runner: { label: 'Runner', className: 'bg-yellow-100 text-yellow-800' },
      support: { label: 'Soporte', className: 'bg-red-100 text-red-800' },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || 
      { label: role, className: 'bg-gray-100 text-gray-800' };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      logger.error('Error toggling user status:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
      }
    } catch (error) {
      logger.error('Error deleting user:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      setCreatingUser(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        await fetchUsers(); // Refresh the list
        setShowCreateModal(false);
        setNewUser({
          name: '',
          email: '',
          password: '',
          role: 'tenant',
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Error al crear usuario');
      }
    } catch (error) {
      logger.error('Error creating user:', { error: error instanceof Error ? error.message : String(error) });
      alert('Error al crear usuario');
    } finally {
      setCreatingUser(false);
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedDashboardLayout
      title="Gestión de Usuarios"
      subtitle="Administra todos los usuarios del sistema"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra todos los usuarios de la plataforma</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactivos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => !u.isActive).length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verificados</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.emailVerified).length}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar usuarios..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tenant">Inquilino</SelectItem>
                  <SelectItem value="owner">Propietario</SelectItem>
                  <SelectItem value="broker">Corredor</SelectItem>
                  <SelectItem value="runner">Runner</SelectItem>
                  <SelectItem value="support">Soporte</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Usuarios</span>
              <span className="text-sm text-gray-500">
                Mostrando {currentUsers.length} de {filteredUsers.length} usuarios
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Usuario</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contacto</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rol</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Registrado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {user.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-sm">{user.isActive ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">{user.createdAt.toLocaleDateString('es-CL')}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                          >
                            {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
                <p className="text-gray-600">
                  No hay usuarios que coincidan con tus criterios de búsqueda
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <div className="text-sm text-gray-700">
                  Mostrando página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
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
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">Inquilino</SelectItem>
                      <SelectItem value="owner">Propietario</SelectItem>
                      <SelectItem value="broker">Corredor</SelectItem>
                      <SelectItem value="runner">Runner</SelectItem>
                      <SelectItem value="support">Soporte</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
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
      </div>
    </EnhancedDashboardLayout>
  );
}
