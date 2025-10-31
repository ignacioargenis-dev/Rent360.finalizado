'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Mail,
  Phone,
  Calendar,
  Building,
  DollarSign,
  TrendingUp,
  Plus,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'owner' | 'tenant';
  status: 'active' | 'prospect' | 'inactive';
  propertiesCount: number;
  totalValue: number;
  lastContact: string;
  createdAt: string;
  notes?: string;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  totalPropertiesManaged: number;
  totalPortfolioValue: number;
  averageClientValue: number;
  newClientsThisMonth: number;
}

export default function BrokerClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    prospectClients: 0,
    totalPropertiesManaged: 0,
    totalPortfolioValue: 0,
    averageClientValue: 0,
    newClientsThisMonth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
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

    const loadClientsData = async () => {
      try {
        // Cargar datos reales desde la API
        const response = await fetch('/api/broker/clients', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          const clientsData = data.clients || data.data || [];

          // Transformar datos de la API al formato esperado
          const transformedClients: Client[] = clientsData.map((client: any) => ({
            id: client.id || client.clientId,
            name: client.name || client.clientName || 'Cliente',
            email: client.email || '',
            phone: client.phone || client.clientPhone || '',
            type: client.type || client.clientType || 'owner',
            status: client.status || 'active',
            propertiesCount: client.propertiesCount || client.properties || 0,
            totalValue: client.totalValue || client.portfolioValue || 0,
            lastContact: client.lastContact || client.updatedAt,
            createdAt: client.createdAt,
            notes: client.notes || '',
          }));

          setClients(transformedClients);

          // Calculate stats from real data
          const activeClients = transformedClients.filter(c => c.status === 'active').length;
          const prospectClients = transformedClients.filter(c => c.status === 'prospect').length;
          const totalPropertiesManaged = transformedClients.reduce(
            (sum, c) => sum + c.propertiesCount,
            0
          );
          const totalPortfolioValue = transformedClients.reduce((sum, c) => sum + c.totalValue, 0);
          const averageClientValue = activeClients > 0 ? totalPortfolioValue / activeClients : 0;
          const newClientsThisMonth = transformedClients.filter(
            c => new Date(c.createdAt).getMonth() === new Date().getMonth()
          ).length;

          const clientStats: ClientStats = {
            totalClients: transformedClients.length,
            activeClients,
            prospectClients,
            totalPropertiesManaged,
            totalPortfolioValue,
            averageClientValue,
            newClientsThisMonth,
          };

          setStats(clientStats);
        } else {
          // Si no hay datos reales, mostrar arrays vacíos
          setClients([]);
          setStats({
            totalClients: 0,
            activeClients: 0,
            prospectClients: 0,
            totalPropertiesManaged: 0,
            totalPortfolioValue: 0,
            averageClientValue: 0,
            newClientsThisMonth: 0,
          });
        }
        setLoading(false);
      } catch (error) {
        logger.error('Error loading clients data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        // En caso de error, mostrar arrays vacíos
        setClients([]);
        setStats({
          totalClients: 0,
          activeClients: 0,
          prospectClients: 0,
          totalPropertiesManaged: 0,
          totalPortfolioValue: 0,
          averageClientValue: 0,
          newClientsThisMonth: 0,
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadClientsData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
      prospect: { label: 'Prospecto', color: 'bg-blue-100 text-blue-800' },
      inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      owner: { label: 'Propietario', color: 'bg-purple-100 text-purple-800' },
      tenant: { label: 'Inquilino', color: 'bg-orange-100 text-orange-800' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.owner;

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
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', {
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
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('es-CL');
    }
  };

  const handleNewClient = () => {
    // Navigate to new client creation page
    router.push('/broker/clients/new');
  };

  const handleViewClient = (clientId: string) => {
    // Navigate to client detail view en la misma pestaña
    router.push(`/broker/clients/${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    // Navigate to client edit page en la misma pestaña
    router.push(`/broker/clients/${clientId}/edit`);
  };

  const handleContactClient = (clientId: string) => {
    // Open contact modal or redirect to messaging
    const client = clients.find(c => c.id === clientId);
    if (client) {
      alert(
        `Iniciando contacto con ${client.name}\nEmail: ${client.email}\nTeléfono: ${client.phone}`
      );
      window.open(`/broker/messages/new?to=${client.email}`, '_blank');
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'all' || client.type === filterType;
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Gestión de Clientes"
      subtitle="Administra tu cartera de clientes y prospectos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
            <p className="text-gray-600">Gestiona tu relación con propietarios e inquilinos</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewClient}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
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
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Total Cartera</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalPortfolioValue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newClientsThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
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
                placeholder="Buscar clientes por nombre o email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="owner">Propietarios</SelectItem>
                <SelectItem value="tenant">Inquilinos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="prospect">Prospectos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.map(client => (
            <Card key={client.id} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 rounded-lg bg-blue-50">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        {getTypeBadge(client.type)}
                        {getStatusBadge(client.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Mail className="w-4 h-4" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{client.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Último contacto: {formatRelativeTime(client.lastContact)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Building className="w-4 h-4" />
                            <span>{client.propertiesCount} propiedades</span>
                          </div>
                          {client.totalValue > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Valor total: {formatCurrency(client.totalValue)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Cliente desde: {formatDateTime(client.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {client.notes && (
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {client.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleViewClient(client.id)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditClient(client.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleContactClient(client.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes encontrados</h3>
            <p className="text-gray-600 mb-4">Prueba ajustando los filtros de búsqueda</p>
            <Button onClick={handleNewClient}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Primer Cliente
            </Button>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
