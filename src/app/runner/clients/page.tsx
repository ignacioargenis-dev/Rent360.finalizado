'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { User } from '@/types';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  propertyCount: number;
  lastServiceDate: string;
  nextScheduledVisit?: string;
  rating: number;
  status: 'active' | 'inactive' | 'pending';
  preferredTimes: string[];
  specialInstructions?: string;
  totalServices: number;
  satisfactionScore: number;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  averageRating: number;
  servicesThisMonth: number;
  upcomingVisits: number;
}

export default function RunnerClientsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    averageRating: 0,
    servicesThisMonth: 0,
    upcomingVisits: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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
        setLoading(true);
        // ✅ CORREGIDO: Obtener datos reales desde la API
        const response = await fetch('/api/runner/clients', {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Error al cargar clientes: ${response.status}`);
        }

        const result = await response.json();
        const clientsData = result.clients || [];
        const statsData = result.stats || {};

        // Transformar datos al formato esperado
        const transformedClients: Client[] = clientsData.map((client: any) => ({
          id: client.id,
          name: client.name || 'Sin nombre',
          email: client.email || '',
          phone: client.phone || 'No disponible',
          address: client.address || 'No disponible',
          propertyCount: client.propertyCount || 0,
          lastServiceDate: client.lastServiceDate || '',
          nextScheduledVisit: client.nextScheduledVisit || undefined,
          rating: client.rating || 0,
          status: client.status || 'inactive',
          preferredTimes: client.preferredTimes || [],
          specialInstructions: client.specialInstructions || undefined,
          totalServices: client.totalServices || 0,
          satisfactionScore: client.satisfactionScore || 0,
        }));

        setClients(transformedClients);
        setFilteredClients(transformedClients);

        // Setear estadísticas
        setStats({
          totalClients: statsData.totalClients || 0,
          activeClients: statsData.activeClients || 0,
          averageRating: statsData.averageRating || 0,
          servicesThisMonth: statsData.servicesThisMonth || 0,
          upcomingVisits: statsData.upcomingVisits || 0,
        });
      } catch (error) {
        logger.error('Error loading clients data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
    loadClientsData();
  }, []);

  useEffect(() => {
    let filtered = clients;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        client =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
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

  const renderStars = (rating: number) => {
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
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  const handleContactClient = (client: Client, method: 'phone' | 'email' | 'message') => {
    switch (method) {
      case 'phone':
        window.open(`tel:${client.phone}`);
        break;
      case 'email':
        window.open(
          `mailto:${client.email}?subject=Consulta sobre servicio&body=Hola ${client.name},`
        );
        break;
      case 'message':
        // Usar sistema de mensajería interno
        const recipientData = {
          id: `client_${client.id}`,
          name: client.name,
          email: client.email,
          phone: client.phone,
          type: 'client' as const,
          clientId: client.id,
        };
        sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
        router.push('/runner/messages?new=true');
        break;
    }
  };

  const handleViewClientDetails = (clientId: string) => {
    router.push(`/runner/clients/${clientId}`);
  };

  const handleAddClient = () => {
    router.push('/runner/clients/new');
  };

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
      title="Mis Clientes"
      subtitle="Gestiona tu cartera de clientes y sus propiedades"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Clientes</h1>
            <p className="text-gray-600">Administra tu cartera de clientes y mantén el contacto</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAddClient}>
              <Users className="w-4 h-4 mr-2" />
              Agregar Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Servicios Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.servicesThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Visitas Próximas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingVisits}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o dirección..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactivos
            </Button>
          </div>
        </div>

        {/* Clients List */}
        <div className="grid gap-4">
          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron clientes
                </h3>
                <p className="text-gray-600">Intenta ajustar los filtros de búsqueda.</p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map(client => (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {client.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                          <div className="flex items-center gap-2">
                            {renderStars(client.rating)}
                            {getStatusBadge(client.status)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate" title={client.email}>
                              {client.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate" title={client.phone}>
                              {client.phone}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate" title={client.address}>
                              {client.address}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">
                              Último servicio: {formatDate(client.lastServiceDate)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">
                          {client.propertyCount} propiedad{client.propertyCount !== 1 ? 'es' : ''}
                        </Badge>
                        <Badge variant="outline">{client.totalServices} servicios totales</Badge>
                        <Badge variant="outline">Satisfacción: {client.satisfactionScore}%</Badge>
                        {client.nextScheduledVisit && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Próxima visita: {formatDate(client.nextScheduledVisit)}
                          </Badge>
                        )}
                      </div>

                      {client.specialInstructions && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">
                                Instrucciones Especiales
                              </p>
                              <p className="text-sm text-yellow-700">
                                {client.specialInstructions}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactClient(client, 'phone')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactClient(client, 'email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactClient(client, 'message')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mensaje
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewClientDetails(client.id)}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
