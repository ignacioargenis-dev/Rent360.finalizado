'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, 
  Search, 
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star, Building, Eye,
  MessageSquare,
  CheckCircle,
  UserPlus,
  TrendingUp } from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface ClientSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'buyer' | 'tenant' | 'owner';
  status: 'active' | 'inactive' | 'prospect';
  propertiesViewed: number;
  visitsCompleted: number;
  lastVisit: string;
  nextAppointment: string;
  rating: number;
  preferredAreas: string[];
  budgetRange: string;
  firstContact: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalVisits: number;
  averageRating: number;
  thisMonthClients: number;
  topPropertyType: string;
}

export default function RunnerClients() {

  const [user, setUser] = useState<User | null>(null);

  const [clients, setClients] = useState<ClientSummary[]>([]);

  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    totalVisits: 0,
    averageRating: 0,
    thisMonthClients: 0,
    topPropertyType: 'departamento',
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [typeFilter, setTypeFilter] = useState('all');

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
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const loadClientsData = async () => {
      try {
        // Simulate API call - in real implementation, this would fetch from /api/runner/clients
        const mockClients: ClientSummary[] = [
          {
            id: '1',
            name: 'Laura Silva',
            email: 'laura.silva@email.com',
            phone: '+56 9 1111 2222',
            type: 'tenant',
            status: 'active',
            propertiesViewed: 8,
            visitsCompleted: 3,
            lastVisit: '2024-03-15',
            nextAppointment: '2024-03-22',
            rating: 4.8,
            preferredAreas: ['Las Condes', 'Vitacura', 'Providencia'],
            budgetRange: '$800.000 - $1.200.000',
            firstContact: '2024-02-15',
          },
          {
            id: '2',
            name: 'Roberto Méndez',
            email: 'roberto.mendez@email.com',
            phone: '+56 9 2222 3333',
            type: 'buyer',
            status: 'active',
            propertiesViewed: 12,
            visitsCompleted: 5,
            lastVisit: '2024-03-14',
            nextAppointment: '2024-03-20',
            rating: 4.6,
            preferredAreas: ['Ñuñoa', 'Macul', 'La Reina'],
            budgetRange: '$150.000.000 - $200.000.000',
            firstContact: '2024-01-20',
          },
          {
            id: '3',
            name: 'Carmen Soto',
            email: 'carmen.soto@email.com',
            phone: '+56 9 3333 4444',
            type: 'owner',
            status: 'prospect',
            propertiesViewed: 3,
            visitsCompleted: 1,
            lastVisit: '2024-03-10',
            nextAppointment: '2024-03-25',
            rating: 4.2,
            preferredAreas: ['Santiago Centro', 'Providencia'],
            budgetRange: 'Sin definir',
            firstContact: '2024-03-01',
          },
        ];

        setClients(mockClients);

        // Calculate stats
        const activeClients = mockClients.filter(c => c.status === 'active').length;
        const totalVisits = mockClients.reduce((sum, c) => sum + c.visitsCompleted, 0);
        
        const totalRating = mockClients.reduce((sum, c) => sum + c.rating, 0);
        const averageRating = mockClients.length > 0 ? totalRating / mockClients.length : 0;

        setStats({
          totalClients: mockClients.length,
          activeClients,
          totalVisits,
          averageRating,
          thisMonthClients: 5,
          topPropertyType: 'departamento',
        });
      } catch (error) {
        logger.error('Error loading clients data:', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setLoading(false);
      }
    };

    loadClientsData();
  }, []);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'buyer':
        return <Badge className="bg-blue-100 text-blue-800">Comprador</Badge>;
      case 'tenant':
        return <Badge className="bg-green-100 text-green-800">Inquilino</Badge>;
      case 'owner':
        return <Badge className="bg-purple-100 text-purple-800">Propietario</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800">Inactivo</Badge>;
      case 'prospect':
        return <Badge className="bg-yellow-100 text-yellow-800">Prospecto</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) {
return 'No programada';
}
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesType = typeFilter === 'all' || client.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <EnhancedDashboardLayout
        user={user}
        title="Clientes"
        subtitle="Gestión de clientes y visitas programadas"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Clientes"
      subtitle="Gestión de clientes y visitas programadas"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas Completadas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalVisits}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos este Mes</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisMonthClients}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tipo Más Popular</p>
                  <p className="text-lg font-bold text-gray-900 capitalize">{stats.topPropertyType}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Lista de Clientes</span>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </CardTitle>
            <CardDescription>
              Clientes asignados para visitas y seguimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="buyer">Compradores</SelectItem>
                  <SelectItem value="tenant">Inquilinos</SelectItem>
                  <SelectItem value="owner">Propietarios</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                  <SelectItem value="prospect">Prospectos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clients Table */}
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="border border-gray-300 px-4 py-2 text-left">Cliente</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Tipo</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Estado</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Visitas</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Preferencias</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Próxima Visita</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs">{client.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {getTypeBadge(client.type)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>{client.propertiesViewed} vistas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{client.visitsCompleted} completadas</span>
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          <div className="font-medium">{client.budgetRange}</div>
                          <div className="text-xs text-gray-500">
                            {client.preferredAreas.slice(0, 2).join(', ')}
                            {client.preferredAreas.length > 2 && '...'}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="text-sm">
                          {formatDate(client.nextAppointment)}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="sm">
                            <Calendar className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron clientes con los filtros seleccionados
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
