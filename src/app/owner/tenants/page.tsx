'use client';

import { useState, useEffect, useCallback } from 'react';
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
import {
  AlertTriangle,
  RefreshCw,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  Search,
  Users,
  Mail,
  Phone,
  Calendar,
  Home,
  Eye,
  Edit,
  MessageSquare,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useRouter } from 'next/navigation';
import UserRatingInfoButton from '@/components/ratings/UserRatingInfoButton';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: {
    id: string;
    title: string;
    address: string;
  };
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  status: 'ACTIVE' | 'PENDING' | 'NOTICE' | 'TERMINATED';
  paymentStatus: 'CURRENT' | 'LATE' | 'OVERDUE';
  lastPayment: string;
  outstandingBalance: number;
}

interface TenantStats {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  totalMonthlyIncome: number;
  overduePayments: number;
}

export default function InquilinosPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    totalTenants: 0,
    activeTenants: 0,
    pendingTenants: 0,
    totalMonthlyIncome: 0,
    overduePayments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user data
        const userResponse = await fetch('/api/auth/me');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
        }

        // Load tenants data
        await loadTenantsData();
      } catch (error) {
        setError('Error al cargar los datos');
        logger.error('Error loading data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadTenantsData = useCallback(async () => {
    try {
      // ✅ CORREGIDO: Cargar datos reales de inquilinos desde la API
      const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/owner/tenants`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const realTenants: Tenant[] = data.tenants || [];
        setTenants(realTenants);
        setFilteredTenants(realTenants);

        // Calcular estadísticas basadas en datos reales
        const stats: TenantStats = {
          totalTenants: realTenants.length,
          activeTenants: realTenants.filter(t => t.status === 'ACTIVE').length,
          pendingTenants: realTenants.filter(t => t.status === 'PENDING').length,
          totalMonthlyIncome: realTenants
            .filter(t => t.status === 'ACTIVE')
            .reduce((sum, t) => sum + t.monthlyRent, 0),
          overduePayments: realTenants.filter(t => t.paymentStatus === 'OVERDUE').length,
        };
        setStats(stats);
        return;
      } else {
        logger.error('Error loading tenants from API:', {
          status: response.status,
          statusText: response.statusText,
        });
      }

      // ✅ CORREGIDO: No usar datos mock, mostrar datos vacíos si falla la API
      setTenants([]);
      setFilteredTenants([]);
      setStats({
        totalTenants: 0,
        activeTenants: 0,
        pendingTenants: 0,
        totalMonthlyIncome: 0,
        overduePayments: 0,
      });
    } catch (error) {
      logger.error('Error loading tenants:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setTenants([]);
      setFilteredTenants([]);
      setStats({
        totalTenants: 0,
        activeTenants: 0,
        pendingTenants: 0,
        totalMonthlyIncome: 0,
        overduePayments: 0,
      });
    }
  }, []);

  const handleViewTenant = (tenantId: string) => {
    router.push(`/owner/tenants/${tenantId}`);
  };

  const handleEditTenant = (tenantId: string) => {
    router.push(`/owner/tenants/${tenantId}/edit`);
  };

  const handleContactTenant = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOTICE':
        return 'bg-orange-100 text-orange-800';
      case 'TERMINATED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return 'bg-green-100 text-green-800';
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Filter tenants based on search and filters
  useEffect(() => {
    let filtered = tenants;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        tenant =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.property.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.paymentStatus === paymentFilter);
    }

    setFilteredTenants(filtered);
  }, [tenants, searchTerm, statusFilter, paymentFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inquilinos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar datos</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Gestión de Inquilinos"
      subtitle="Administra todos tus inquilinos y sus contratos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* ✅ CORREGIDO: Stats Overview basado en datos reales */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Inquilinos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
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
                  <p className="text-sm font-medium text-gray-600">Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeTenants}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingTenants}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalMonthlyIncome)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagos Vencidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overduePayments}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email o propiedad..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="NOTICE">Aviso</SelectItem>
                    <SelectItem value="TERMINATED">Terminados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Pagos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Pagos</SelectItem>
                    <SelectItem value="CURRENT">Al Día</SelectItem>
                    <SelectItem value="LATE">Atrasados</SelectItem>
                    <SelectItem value="OVERDUE">Vencidos</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenants List */}
        <div className="space-y-4">
          {filteredTenants.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay inquilinos registrados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                      ? 'No se encontraron inquilinos con los filtros aplicados'
                      : 'Comienza creando tu primer contrato de arriendo'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && paymentFilter === 'all' && (
                    <Button onClick={() => router.push('/owner/contracts')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ver Contratos
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTenants.map(tenant => (
              <Card key={tenant.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                        <UserRatingInfoButton
                          userId={tenant.id || null}
                          userName={tenant.name}
                          size="sm"
                          variant="ghost"
                          label="Ver calificaciones"
                        />
                        <Badge className={getStatusColor(tenant.status)}>{tenant.status}</Badge>
                        <Badge className={getPaymentStatusColor(tenant.paymentStatus)}>
                          {tenant.paymentStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span>{tenant.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{tenant.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Home className="w-4 h-4" />
                            <span>{tenant.property.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{tenant.property.address}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Inicio: {formatDate(tenant.leaseStart)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Fin: {formatDate(tenant.leaseEnd)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>Renta: {formatPrice(tenant.monthlyRent)}/mes</span>
                          </div>
                          {tenant.outstandingBalance > 0 && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Deuda: {formatPrice(tenant.outstandingBalance)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewTenant(tenant.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditTenant(tenant.id)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleContactTenant(tenant.email)}
                      >
                        <MessageSquare className="w-4 h-4" />
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
