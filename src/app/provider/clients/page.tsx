'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  RefreshCw,
  Star,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProvider';
import { logger } from '@/lib/logger';

interface ProviderClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  location: string;
  serviceType: string;
  lastServiceDate: string;
  totalServices: number;
  totalSpent: number;
  rating: number;
  status: 'active' | 'inactive' | 'prospect';
  preferredContact: 'email' | 'phone' | 'whatsapp';
  notes?: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalRevenue: number;
  averageRating: number;
  newClientsThisMonth: number;
  repeatClients: number;
}

export default function ProviderClientsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<ProviderClient[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    totalRevenue: 0,
    averageRating: 0,
    newClientsThisMonth: 0,
    repeatClients: 0,
  });

  // Mock data for provider clients
  const mockClients: ProviderClient[] = [
    {
      id: '1',
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+56987654321',
      avatar: '/api/placeholder/40/40',
      location: 'Las Condes, Santiago',
      serviceType: 'Electricidad',
      lastServiceDate: '2024-12-15',
      totalServices: 3,
      totalSpent: 125000,
      rating: 5,
      status: 'active',
      preferredContact: 'whatsapp',
      notes: 'Cliente regular, siempre paga a tiempo.',
    },
    {
      id: '2',
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+56912345678',
      avatar: '/api/placeholder/40/40',
      location: 'Providencia, Santiago',
      serviceType: 'Plomería',
      lastServiceDate: '2024-12-10',
      totalServices: 1,
      totalSpent: 85000,
      rating: 4,
      status: 'active',
      preferredContact: 'phone',
      notes: 'Primera vez, buen cliente.',
    },
    {
      id: '3',
      name: 'Ana Silva',
      email: 'ana.silva@email.com',
      phone: '+56955556666',
      avatar: '/api/placeholder/40/40',
      location: 'Ñuñoa, Santiago',
      serviceType: 'Jardinería',
      lastServiceDate: '2024-11-28',
      totalServices: 2,
      totalSpent: 60000,
      rating: 5,
      status: 'active',
      preferredContact: 'email',
    },
    {
      id: '4',
      name: 'Pedro Martínez',
      email: 'pedro.martinez@email.com',
      phone: '+56977778888',
      avatar: '/api/placeholder/40/40',
      location: 'La Florida, Santiago',
      serviceType: 'Limpieza',
      lastServiceDate: '2024-10-15',
      totalServices: 1,
      totalSpent: 75000,
      rating: 3,
      status: 'inactive',
      preferredContact: 'email',
      notes: 'Servicio único, no ha vuelto.',
    },
    {
      id: '5',
      name: 'Laura Torres',
      email: 'laura.torres@email.com',
      phone: '+56999990000',
      avatar: '/api/placeholder/40/40',
      location: 'Vitacura, Santiago',
      serviceType: 'Electricidad',
      lastServiceDate: '2024-12-01',
      totalServices: 4,
      totalSpent: 180000,
      rating: 5,
      status: 'active',
      preferredContact: 'whatsapp',
      notes: 'Cliente VIP, recomienda nuestros servicios.',
    },
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setClients(mockClients);

      // Calculate stats
      const totalClients = mockClients.length;
      const activeClients = mockClients.filter(c => c.status === 'active').length;
      const totalRevenue = mockClients.reduce((sum, c) => sum + c.totalSpent, 0);
      const averageRating = mockClients.reduce((sum, c) => sum + c.rating, 0) / mockClients.length;
      const newClientsThisMonth = mockClients.filter(
        c =>
          new Date(c.lastServiceDate) >=
          new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      ).length;
      const repeatClients = mockClients.filter(c => c.totalServices > 1).length;

      setStats({
        totalClients,
        activeClients,
        totalRevenue,
        averageRating: Math.round(averageRating * 10) / 10,
        newClientsThisMonth,
        repeatClients,
      });
    } catch (error) {
      logger.error('Error al cargar clientes', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactClient = (client: ProviderClient, method: 'email' | 'phone' | 'whatsapp') => {
    switch (method) {
      case 'email':
        window.open(
          `mailto:${client.email}?subject=Solicitud de Servicio&body=Hola ${client.name},`
        );
        break;
      case 'phone':
        window.open(`tel:${client.phone}`);
        break;
      case 'whatsapp':
        const message = encodeURIComponent(
          `Hola ${client.name}, me gustaría solicitar un servicio.`
        );
        window.open(`https://wa.me/${client.phone.replace('+', '')}?text=${message}`);
        break;
    }

    logger.info('Contacto iniciado con cliente', { clientId: client.id, method });
  };

  const handleViewClientDetails = (clientId: string) => {
    // Navigate to client detail page (would be implemented when needed)
    logger.info('Ver detalles de cliente', { clientId });
  };

  const handleAddNote = (clientId: string, note: string) => {
    setClients(prev =>
      prev.map(client => (client.id === clientId ? { ...client, notes: note } : client))
    );
    logger.info('Nota agregada a cliente', { clientId });
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesService = serviceFilter === 'all' || client.serviceType === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Activo</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'prospect':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Prospecto
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const serviceTypes = [...new Set(clients.map(c => c.serviceType))];

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
            <p className="text-gray-600">Gestión de clientes y relaciones comerciales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadClients} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-yellow-600">{stats.averageRating}</p>
                    <Star className="w-5 h-5 text-yellow-600 fill-current" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.newClientsThisMonth}</p>
                </div>
                <Plus className="w-12 h-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Recurrentes</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.repeatClients}</p>
                </div>
                <RefreshCw className="w-12 h-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="inactive">Inactivos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Input
                      placeholder="Buscar por nombre, email o ubicación..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Estados</SelectItem>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                        <SelectItem value="prospect">Prospecto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={serviceFilter} onValueChange={setServiceFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de Servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los Servicios</SelectItem>
                        {serviceTypes.map(type => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setServiceFilter('all');
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Clients Table */}
            <Card>
              <CardHeader>
                <CardTitle>Lista de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando clientes...
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron clientes que coincidan con los filtros
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Último Servicio</TableHead>
                        <TableHead>Total Servicios</TableHead>
                        <TableHead>Total Gastado</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map(client => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={client.avatar} alt={client.name} />
                                <AvatarFallback>
                                  {client.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{client.name}</p>
                                <p className="text-sm text-gray-600">{client.email}</p>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {client.location}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{client.serviceType}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(client.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="w-4 h-4" />
                              {new Date(client.lastServiceDate).toLocaleDateString('es-CL')}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {client.totalServices}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(client.totalSpent)}
                          </TableCell>
                          <TableCell>{getRatingStars(client.rating)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleContactClient(client, client.preferredContact)}
                              >
                                {client.preferredContact === 'email' && (
                                  <Mail className="w-4 h-4" />
                                )}
                                {client.preferredContact === 'phone' && (
                                  <Phone className="w-4 h-4" />
                                )}
                                {client.preferredContact === 'whatsapp' && (
                                  <Phone className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewClientDetails(client.id)}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients
                    .filter(c => c.status === 'active')
                    .map(client => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>
                              {client.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.serviceType}</p>
                            <p className="text-xs text-gray-500">{client.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-green-600">
                              {formatCurrency(client.totalSpent)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {client.totalServices} servicios
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactClient(client, 'email')}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactClient(client, 'phone')}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clientes Inactivos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients
                    .filter(c => c.status === 'inactive')
                    .map(client => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarImage src={client.avatar} alt={client.name} />
                            <AvatarFallback>
                              {client.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-gray-600">{client.serviceType}</p>
                            <p className="text-xs text-gray-500">
                              Último servicio:{' '}
                              {new Date(client.lastServiceDate).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-gray-600">
                              {formatCurrency(client.totalSpent)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {client.totalServices} servicios
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleContactClient(client, 'email')}
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Recontactar
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
