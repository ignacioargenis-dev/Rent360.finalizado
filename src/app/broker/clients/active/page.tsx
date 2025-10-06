'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Eye,
  MessageSquare,
  FileText,
  Star,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { User } from '@/types';

interface ActiveClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyType: 'residential' | 'commercial' | 'office';
  propertyValue: number;
  monthlyRent?: number;
  commissionRate: number;
  contractStart: string;
  contractEnd?: string;
  status: 'active' | 'pending_renewal' | 'expiring_soon';
  lastContact: string;
  nextPayment?: string;
  totalCommission: number;
  satisfactionScore: number;
  referralSource: string;
}

interface ClientStats {
  totalActiveClients: number;
  totalCommission: number;
  averageCommission: number;
  expiringContracts: number;
  newClientsThisMonth: number;
}

export default function BrokerActiveClientsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<ActiveClient[]>([]);
  const [filteredClients, setFilteredClients] = useState<ActiveClient[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalActiveClients: 0,
    totalCommission: 0,
    averageCommission: 0,
    expiringContracts: 0,
    newClientsThisMonth: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();

  const handleGenerateReport = async () => {
    try {
      // Generate CSV report
      const csvData = clients.map(client => ({
        ID: client.id,
        Nombre: client.name,
        Email: client.email,
        Teléfono: client.phone,
        'Tipo Propiedad': client.propertyType,
        'Valor Propiedad': client.propertyValue,
        Estado: client.status,
        'Último Contacto': client.lastContact,
        'Próxima Renovación': client.contractEnd,
      }));

      if (csvData.length === 0) {
        setErrorMessage('No hay clientes para exportar');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        'ID,Nombre,Email,Teléfono,Tipo Propiedad,Valor Propiedad,Estado,Último Contacto,Próxima Renovación\n' +
        csvData.map(row => Object.values(row).join(',')).join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `clientes_activos_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessMessage('Reporte de clientes exportado exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al generar el reporte');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleNewClient = () => {
    router.push('/broker/clients/new');
  };

  const handleViewClientDetails = (clientId: string) => {
    router.push(`/broker/clients/${clientId}`);
  };

  const handleContactClient = (client: ActiveClient, method: 'phone' | 'email' | 'message') => {
    switch (method) {
      case 'phone':
        if (client.phone) {
          window.open(`tel:${client.phone}`);
        } else {
          alert('No hay número de teléfono disponible para este cliente');
        }
        break;
      case 'email':
        if (client.email) {
          const subject = `Seguimiento cliente - ${client.name}`;
          window.open(`mailto:${client.email}?subject=${encodeURIComponent(subject)}`);
        } else {
          alert('No hay dirección de email disponible para este cliente');
        }
        break;
      case 'message':
        router.push(`/broker/messages?recipient=${client.id}`);
        break;
    }
  };

  const handleRenewContract = (clientId: string) => {
    // Navigate to contracts page for renewal
    router.push('/broker/contracts?action=renew');
    setSuccessMessage('Funcionalidad de renovación próximamente disponible');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

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
        // Mock active clients data
        const mockClients: ActiveClient[] = [
          {
            id: 'c1',
            name: 'María González',
            email: 'maria.gonzalez@email.com',
            phone: '+56912345678',
            propertyType: 'residential',
            propertyValue: 150000000,
            monthlyRent: 850000,
            commissionRate: 5.0,
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
            contractEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 185).toISOString(),
            status: 'active',
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toISOString(),
            totalCommission: 42500,
            satisfactionScore: 95,
            referralSource: 'Recomendación',
          },
          {
            id: 'c2',
            name: 'Carlos Rodríguez',
            email: 'carlos.rodriguez@email.com',
            phone: '+56987654321',
            propertyType: 'commercial',
            propertyValue: 280000000,
            monthlyRent: 1200000,
            commissionRate: 6.0,
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
            contractEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 275).toISOString(),
            status: 'active',
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25).toISOString(),
            totalCommission: 72000,
            satisfactionScore: 88,
            referralSource: 'Sitio web',
          },
          {
            id: 'c3',
            name: 'Ana López',
            email: 'ana.lopez@email.com',
            phone: '+56955556666',
            propertyType: 'office',
            propertyValue: 200000000,
            monthlyRent: 950000,
            commissionRate: 4.5,
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            contractEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
            status: 'pending_renewal',
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
            totalCommission: 42750,
            satisfactionScore: 92,
            referralSource: 'Redes sociales',
          },
          {
            id: 'c4',
            name: 'Pedro Martínez',
            email: 'pedro.martinez@email.com',
            phone: '+56977778888',
            propertyType: 'residential',
            propertyValue: 180000000,
            monthlyRent: 750000,
            commissionRate: 5.5,
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            contractEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            status: 'expiring_soon',
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            totalCommission: 41250,
            satisfactionScore: 87,
            referralSource: 'Referido por cliente',
          },
          {
            id: 'c5',
            name: 'Laura Fernández',
            email: 'laura.fernandez@email.com',
            phone: '+56944443333',
            propertyType: 'commercial',
            propertyValue: 320000000,
            monthlyRent: 1400000,
            commissionRate: 5.0,
            contractStart: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            status: 'active',
            lastContact: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20).toISOString(),
            totalCommission: 70000,
            satisfactionScore: 96,
            referralSource: 'Anuncio clasificado',
          },
        ];

        setClients(mockClients);
        setFilteredClients(mockClients);

        // Calculate stats
        const totalActiveClients = mockClients.filter(c => c.status === 'active').length;
        const totalCommission = mockClients.reduce((sum, c) => sum + c.totalCommission, 0);
        const averageCommission = totalCommission / mockClients.length;
        const expiringContracts = mockClients.filter(
          c =>
            c.contractEnd &&
            new Date(c.contractEnd) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 60)
        ).length;
        const newClientsThisMonth = mockClients.filter(
          c => new Date(c.contractStart) > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        ).length;

        const clientStats: ClientStats = {
          totalActiveClients,
          totalCommission,
          averageCommission,
          expiringContracts,
          newClientsThisMonth,
        };

        setStats(clientStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading clients data:', {
          error: error instanceof Error ? error.message : String(error),
        });
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
          client.referralSource.toLowerCase().includes(searchQuery.toLowerCase())
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
      case 'pending_renewal':
        return <Badge className="bg-yellow-100 text-yellow-800">Renovación Pendiente</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-orange-100 text-orange-800">Venciendo Pronto</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getPropertyTypeBadge = (type: string) => {
    const colors = {
      residential: 'bg-blue-100 text-blue-800',
      commercial: 'bg-green-100 text-green-800',
      office: 'bg-purple-100 text-purple-800',
    };

    const labels = {
      residential: 'Residencial',
      commercial: 'Comercial',
      office: 'Oficina',
    };

    return (
      <Badge className={colors[type as keyof typeof colors] || colors.residential}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const calculateDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes activos...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Clientes Activos"
      subtitle="Gestiona tu cartera de clientes activos y contratos vigentes"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes Activos</h1>
            <p className="text-gray-600">Administra tus clientes actuales y contratos activos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateReport}>
              <FileText className="w-4 h-4 mr-2" />
              Reporte de Clientes
            </Button>
            <Button onClick={handleNewClient}>
              <Users className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalActiveClients}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisión Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalCommission)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comisión Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.averageCommission)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos por Vencer</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.expiringContracts}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nuevos Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newClientsThisMonth}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-teal-600" />
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
              placeholder="Buscar por nombre, email o fuente de referencia..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado del contrato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="pending_renewal">Renovación pendiente</SelectItem>
                <SelectItem value="expiring_soon">Venciendo pronto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                            {getStatusBadge(client.status)}
                            {getPropertyTypeBadge(client.propertyType)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span>{client.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{client.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>Valor propiedad: {formatCurrency(client.propertyValue)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Contrato hasta:{' '}
                                {client.contractEnd ? formatDate(client.contractEnd) : 'Indefinido'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Comisión:</span>
                              <p className="text-lg font-bold text-green-600">
                                {client.commissionRate}%
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Total ganado:</span>
                              <p className="text-lg font-bold text-blue-600">
                                {formatCurrency(client.totalCommission)}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Satisfacción:</span>
                              <p className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="font-bold">{client.satisfactionScore}%</span>
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Referencia:</span>
                              <p>{client.referralSource}</p>
                            </div>
                          </div>

                          {client.contractEnd &&
                            calculateDaysUntilExpiry(client.contractEnd) <= 60 && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                  <span className="text-sm text-orange-800">
                                    Contrato vence en {calculateDaysUntilExpiry(client.contractEnd)}{' '}
                                    días
                                  </span>
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
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
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      {client.status === 'pending_renewal' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRenewContract(client.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Renovar
                        </Button>
                      )}
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
