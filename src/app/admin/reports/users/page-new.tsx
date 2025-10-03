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
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  UserPlus,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { User } from '@/types';

interface UserReport {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OWNER' | 'TENANT' | 'BROKER' | 'PROVIDER' | 'MAINTENANCE' | 'RUNNER' | 'SUPPORT';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin: string;
  propertiesCount?: number;
  contractsCount?: number;
  totalRevenue?: number;
  activityScore: number;
  verified: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  usersByRole: { [key: string]: number };
  verificationRate: number;
  averageActivityScore: number;
  topActiveUsers: UserReport[];
  userGrowthTrend: Array<{ month: string; count: number }>;
}

export default function AdminUsersReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    usersByRole: {},
    verificationRate: 0,
    averageActivityScore: 0,
    topActiveUsers: [],
    userGrowthTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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

    const loadUsersReportData = async () => {
      try {
        // Mock user reports data
        const mockUserReports: UserReport[] = [
          {
            id: '1',
            name: 'Carlos Rodríguez',
            email: 'admin@rent360.cl',
            role: 'ADMIN',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            propertiesCount: 0,
            contractsCount: 0,
            totalRevenue: 0,
            activityScore: 95,
            verified: true,
          },
          {
            id: '2',
            name: 'María González',
            email: 'propietario@rent360.cl',
            role: 'OWNER',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 300).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            propertiesCount: 5,
            contractsCount: 4,
            totalRevenue: 2500000,
            activityScore: 88,
            verified: true,
          },
          {
            id: '3',
            name: 'Pedro Sánchez',
            email: 'inquilino@rent360.cl',
            role: 'TENANT',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            propertiesCount: 0,
            contractsCount: 1,
            totalRevenue: 0,
            activityScore: 75,
            verified: true,
          },
          {
            id: '4',
            name: 'Ana Martínez',
            email: 'corredor@rent360.cl',
            role: 'BROKER',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            propertiesCount: 12,
            contractsCount: 8,
            totalRevenue: 1200000,
            activityScore: 92,
            verified: true,
          },
          {
            id: '5',
            name: 'Diego López',
            email: 'runner@rent360.cl',
            role: 'RUNNER',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
            propertiesCount: 0,
            contractsCount: 0,
            totalRevenue: 0,
            activityScore: 85,
            verified: true,
          },
          {
            id: '6',
            name: 'Soporte Rent360',
            email: 'soporte@rent360.cl',
            role: 'SUPPORT',
            status: 'active',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 350).toISOString(),
            lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 0.5).toISOString(),
            propertiesCount: 0,
            contractsCount: 0,
            totalRevenue: 0,
            activityScore: 78,
            verified: true,
          },
        ];

        setUserReports(mockUserReports);

        // Calculate stats
        const activeUsers = mockUserReports.filter(u => u.status === 'active').length;
        const newUsersThisMonth = mockUserReports.filter(
          u => new Date(u.createdAt).getMonth() === new Date().getMonth()
        ).length;
        const verifiedUsers = mockUserReports.filter(u => u.verified).length;
        const totalActivityScore = mockUserReports.reduce((sum, u) => sum + u.activityScore, 0);
        const averageActivityScore = totalActivityScore / mockUserReports.length;

        const usersByRole: { [key: string]: number } = {};
        mockUserReports.forEach(u => {
          usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
        });

        const verificationRate = (verifiedUsers / mockUserReports.length) * 100;
        const topActiveUsers = [...mockUserReports]
          .sort((a, b) => b.activityScore - a.activityScore)
          .slice(0, 5);

        const userStats: UserStats = {
          totalUsers: mockUserReports.length,
          activeUsers,
          newUsersThisMonth,
          usersByRole,
          verificationRate,
          averageActivityScore,
          topActiveUsers,
          userGrowthTrend: [
            { month: 'Ene', count: 15 },
            { month: 'Feb', count: 18 },
            { month: 'Mar', count: 22 },
            { month: 'Abr', count: 25 },
            { month: 'May', count: 28 },
            { month: 'Jun', count: 32 },
          ],
        };

        setStats(userStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading user reports data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadUsersReportData();
  }, []);

  const getRoleBadge = (role: string) => {
    const roleColors: { [key: string]: string } = {
      ADMIN: 'bg-red-100 text-red-800',
      OWNER: 'bg-blue-100 text-blue-800',
      TENANT: 'bg-green-100 text-green-800',
      BROKER: 'bg-purple-100 text-purple-800',
      RUNNER: 'bg-orange-100 text-orange-800',
      SUPPORT: 'bg-yellow-100 text-yellow-800',
      PROVIDER: 'bg-indigo-100 text-indigo-800',
      MAINTENANCE: 'bg-gray-100 text-gray-800',
    };

    return <Badge className={roleColors[role] || 'bg-gray-100 text-gray-800'}>{role}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspendido</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
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

  const handleExportUsers = () => {
    // Export users data to CSV
    const csvData = filteredUsers.map(user => ({
      ID: user.id,
      Nombre: user.name,
      Email: user.email,
      Rol: user.role,
      Estado: user.status,
      'Fecha Creación': formatDateTime(user.createdAt),
      'Último Login': formatDateTime(user.lastLogin),
      Propiedades: user.propertiesCount || 0,
      Contratos: user.contractsCount || 0,
      'Ingresos Totales': user.totalRevenue ? formatCurrency(user.totalRevenue) : '$0',
      'Puntuación Actividad': user.activityScore,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewUser = (userId: string) => {
    // Navigate to user detail view
    window.open(`/admin/users/${userId}`, '_blank');
  };

  const handleEditUser = (userId: string) => {
    // Navigate to user edit page
    window.open(`/admin/users/${userId}/edit`, '_blank');
  };

  const filteredUsers = userReports.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando reportes de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Reportes de Usuarios"
      subtitle="Análisis y estadísticas de usuarios del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Usuarios</h1>
            <p className="text-gray-600">Analiza el comportamiento y métricas de usuarios</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportUsers}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar usuarios por nombre o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="OWNER">Propietario</SelectItem>
                <SelectItem value="TENANT">Inquilino</SelectItem>
                <SelectItem value="BROKER">Corredor</SelectItem>
                <SelectItem value="RUNNER">Runner</SelectItem>
                <SelectItem value="SUPPORT">Soporte</SelectItem>
                <SelectItem value="PROVIDER">Proveedor</SelectItem>
                <SelectItem value="MAINTENANCE">Mantención</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="suspended">Suspendido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Verificación</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.verificationRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Users List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Usuarios</CardTitle>
                <CardDescription>Usuarios registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map(user => (
                    <Card key={user.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-blue-50">
                              <Users className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                {getRoleBadge(user.role)}
                                {getStatusBadge(user.status)}
                                {user.verified && (
                                  <Badge className="bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Verificado
                                  </Badge>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Mail className="w-4 h-4" />
                                    <span>{user.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Creado: {formatDateTime(user.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Activity className="w-4 h-4" />
                                    <span>Puntuación: {user.activityScore}/100</span>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Último login: {formatDateTime(user.lastLogin)}</span>
                                  </div>
                                  {user.propertiesCount !== undefined && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <BarChart3 className="w-4 h-4" />
                                      <span>Propiedades: {user.propertiesCount}</span>
                                    </div>
                                  )}
                                  {user.contractsCount !== undefined && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <TrendingUp className="w-4 h-4" />
                                      <span>Contratos: {user.contractsCount}</span>
                                    </div>
                                  )}
                                  {user.totalRevenue !== undefined && user.totalRevenue > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <TrendingUp className="w-4 h-4" />
                                      <span>Ingresos: {formatCurrency(user.totalRevenue)}</span>
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
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Analytics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Usuarios</CardTitle>
                <CardDescription>Métricas y estadísticas de usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Usuarios por Rol</p>
                      <p className="text-xs text-blue-600">Distribución actual</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-blue-600 space-y-1">
                        {Object.entries(stats.usersByRole).map(([role, count]) => (
                          <div key={role} className="flex justify-between gap-4">
                            <span>{role}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">Puntuación Promedio</p>
                      <p className="text-xs text-green-600">Actividad general</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">
                        {stats.averageActivityScore.toFixed(1)}
                      </p>
                      <p className="text-xs text-green-600">/100 puntos</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Usuarios Verificados</p>
                      <p className="text-xs text-purple-600">Con identidad validada</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-800">
                        {stats.verificationRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-600">Del total</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Usuarios Más Activos</CardTitle>
                <CardDescription>Top 5 usuarios por actividad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topActiveUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{user.activityScore}</p>
                        <p className="text-xs text-gray-500">puntos</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
