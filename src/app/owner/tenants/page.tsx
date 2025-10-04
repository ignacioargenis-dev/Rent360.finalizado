'use client';

import { useState, useEffect, useCallback } from 'react';
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

        // Load tenants data directly (inline function)
        try {
          // Mock tenants data
          const mockTenants: Tenant[] = [
            {
              id: '1',
              name: 'María González',
              email: 'maria.gonzalez@email.com',
              phone: '+56 9 1234 5678',
              property: {
                id: 'prop1',
                title: 'Departamento en Providencia',
                address: 'Providencia 1234',
              },
              leaseStart: new Date('2024-01-01').toISOString(),
              leaseEnd: new Date('2024-12-31').toISOString(),
              monthlyRent: 450000,
              status: 'ACTIVE',
              paymentStatus: 'CURRENT',
              lastPayment: new Date('2024-09-01').toISOString(),
              outstandingBalance: 0,
            },
            {
              id: '2',
              name: 'Carlos Rodríguez',
              email: 'carlos.rodriguez@email.com',
              phone: '+56 9 8765 4321',
              property: {
                id: 'prop2',
                title: 'Casa en Las Condes',
                address: 'Las Condes 5678',
              },
              leaseStart: new Date('2024-02-01').toISOString(),
              leaseEnd: new Date('2025-01-31').toISOString(),
              monthlyRent: 650000,
              status: 'ACTIVE',
              paymentStatus: 'LATE',
              lastPayment: new Date('2024-08-01').toISOString(),
              outstandingBalance: 650000,
            },
            {
              id: '3',
              name: 'Ana Silva',
              email: 'ana.silva@email.com',
              phone: '+56 9 5555 6666',
              property: {
                id: 'prop3',
                title: 'Estudio en Centro',
                address: 'Centro 999',
              },
              leaseStart: new Date('2024-03-01').toISOString(),
              leaseEnd: new Date('2024-08-31').toISOString(),
              monthlyRent: 320000,
              status: 'PENDING',
              paymentStatus: 'CURRENT',
              lastPayment: new Date('2024-09-01').toISOString(),
              outstandingBalance: 0,
            },
            {
              id: '4',
              name: 'Pedro Morales',
              email: 'pedro.morales@email.com',
              phone: '+56 9 7777 8888',
              property: {
                id: 'prop4',
                title: 'Apartamento en Ñuñoa',
                address: 'Ñuñoa 4321',
              },
              leaseStart: new Date('2023-06-01').toISOString(),
              leaseEnd: new Date('2024-05-31').toISOString(),
              monthlyRent: 380000,
              status: 'ACTIVE',
              paymentStatus: 'CURRENT',
              lastPayment: new Date('2024-09-01').toISOString(),
              outstandingBalance: 0,
            },
            {
              id: '5',
              name: 'Sofía Vargas',
              email: 'sofia.vargas@email.com',
              phone: '+56 9 9999 0000',
              property: {
                id: 'prop5',
                title: 'Loft en Bellavista',
                address: 'Bellavista 2468',
              },
              leaseStart: new Date('2024-01-15').toISOString(),
              leaseEnd: new Date('2025-01-14').toISOString(),
              monthlyRent: 550000,
              status: 'ACTIVE',
              paymentStatus: 'LATE',
              lastPayment: new Date('2024-08-15').toISOString(),
              outstandingBalance: 275000,
            },
          ];

          setTenants(mockTenants);

          // CalcuLATE stats
          const totalTenants = mockTenants.length;
          const activeTenants = mockTenants.filter(t => t.status === 'ACTIVE').length;
          const pendingTenants = mockTenants.filter(t => t.status === 'PENDING').length;
          const totalMonthlyIncome = mockTenants
            .filter(t => t.status === 'ACTIVE')
            .reduce((sum, t) => sum + t.monthlyRent, 0);
          const overduePayments = mockTenants.filter(t => t.paymentStatus === 'LATE').length;

          const tenantStats: TenantStats = {
            totalTenants,
            activeTenants,
            pendingTenants,
            totalMonthlyIncome,
            overduePayments,
          };

          setStats(tenantStats);
        } catch (error) {
          logger.error('Error loading tenants data:', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
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
  }, []); // Empty dependency array for initialization

  useEffect(() => {
    let filtered = tenants;

    if (searchTerm) {
      filtered = filtered.filter(
        tenant =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.property.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.status === statusFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(tenant => tenant.paymentStatus === paymentFilter);
    }

    setFilteredTenants(filtered);
  }, [tenants, searchTerm, statusFilter, paymentFilter]);

  const loadData = async () => {
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

  const loadTenantsData = useCallback(async () => {
    try {
      // Mock tenants data
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'María González',
          email: 'maria.gonzalez@email.com',
          phone: '+56 9 1234 5678',
          property: {
            id: 'prop1',
            title: 'Departamento en Providencia',
            address: 'Av. Providencia 1234, Dpto 5B',
          },
          leaseStart: '2024-01-01',
          leaseEnd: '2024-12-31',
          monthlyRent: 450000,
          status: 'ACTIVE',
          paymentStatus: 'CURRENT',
          lastPayment: '2024-01-05',
          outstandingBalance: 0,
        },
        {
          id: '2',
          name: 'Carlos Rodríguez',
          email: 'carlos.rodriguez@email.com',
          phone: '+56 9 8765 4321',
          property: {
            id: 'prop2',
            title: 'Casa Familiar en Las Condes',
            address: 'Calle Los Militares 5678',
          },
          leaseStart: '2024-01-01',
          leaseEnd: '2024-12-31',
          monthlyRent: 650000,
          status: 'ACTIVE',
          paymentStatus: 'LATE',
          lastPayment: '2023-12-28',
          outstandingBalance: 650000,
        },
        {
          id: '3',
          name: 'Ana López',
          email: 'ana.lopez@email.com',
          phone: '+56 9 5555 6666',
          property: {
            id: 'prop3',
            title: 'Estudio Moderno Centro',
            address: 'Pasaje Ahumada 432',
          },
          leaseStart: '2024-01-15',
          leaseEnd: '2024-12-14',
          monthlyRent: 280000,
          status: 'PENDING',
          paymentStatus: 'CURRENT',
          lastPayment: '2024-01-15',
          outstandingBalance: 0,
        },
        {
          id: '4',
          name: 'Pedro Sánchez',
          email: 'pedro.sanchez@email.com',
          phone: '+56 9 7777 8888',
          property: {
            id: 'prop4',
            title: 'Oficina Corporativa',
            address: 'Av. Apoquindo 3456, Piso 12',
          },
          leaseStart: '2023-06-01',
          leaseEnd: '2024-05-31',
          monthlyRent: 950000,
          status: 'NOTICE',
          paymentStatus: 'OVERDUE',
          lastPayment: '2023-11-30',
          outstandingBalance: 3800000,
        },
      ];

      setTenants(mockTenants);

      // CalcuLATE stats
      const activeTenants = mockTenants.filter(t => t.status === 'ACTIVE');
      const pendingTenants = mockTenants.filter(t => t.status === 'PENDING');
      const totalMonthlyIncome = activeTenants.reduce((sum, tenant) => sum + tenant.monthlyRent, 0);
      const overduePayments = mockTenants.filter(t => t.paymentStatus === 'OVERDUE').length;

      const tenantStats: TenantStats = {
        totalTenants: mockTenants.length,
        activeTenants: activeTenants.length,
        pendingTenants: pendingTenants.length,
        totalMonthlyIncome,
        overduePayments,
      };

      setStats(tenantStats);
    } catch (error) {
      logger.error('Error loading tenants data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, []);

  const handleViewTenant = (tenantId: string) => {
    window.open(`/owner/tenants/${tenantId}`, '_blank');
  };

  const handleEditTenant = (tenantId: string) => {
    window.open(`/owner/tenants/${tenantId}/edit`, '_blank');
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
        return 'bg-red-100 text-red-800';
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Inquilinos" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Inquilinos" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadData}>
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
      title="Inquilinos"
      subtitle="Gestiona todos tus inquilinos y contratos de arrendamiento"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header con estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquilinos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeTenants} activos actualmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalMonthlyIncome)}</div>
              <p className="text-xs text-muted-foreground">De contratos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos Pendientes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingTenants}</div>
              <p className="text-xs text-muted-foreground">Esperando aprobación</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -transLATE-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o propiedad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado del contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ACTIVE">Activo</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="NOTICE">Con aviso</SelectItem>
                  <SelectItem value="TERMINATED">Terminado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los pagos</SelectItem>
                  <SelectItem value="CURRENT">Al día</SelectItem>
                  <SelectItem value="LATE">Atrasado</SelectItem>
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de inquilinos */}
        <div className="space-y-4">
          {filteredTenants.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                      ? 'No se encontraron inquilinos'
                      : 'No tienes inquilinos registrados'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all'
                      ? 'Intenta ajustar los filtros de búsqueda'
                      : 'Los inquilinos aparecerán aquí una vez que registres tus primeras propiedades y contratos'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTenants.map(tenant => (
              <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar del inquilino */}
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {tenant.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                      </div>

                      {/* Información del inquilino */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-gray-900">{tenant.name}</h3>
                          <Badge className={getStatusColor(tenant.status)}>
                            {tenant.status === 'ACTIVE'
                              ? 'Activo'
                              : tenant.status === 'PENDING'
                                ? 'Pendiente'
                                : tenant.status === 'NOTICE'
                                  ? 'Con aviso'
                                  : 'Terminado'}
                          </Badge>
                          <Badge className={getPaymentStatusColor(tenant.paymentStatus)}>
                            {tenant.paymentStatus === 'CURRENT'
                              ? 'Al día'
                              : tenant.paymentStatus === 'LATE'
                                ? 'Atrasado'
                                : tenant.paymentStatus === 'OVERDUE'
                                  ? 'Vencido'
                                  : tenant.paymentStatus}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {tenant.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {tenant.phone}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {tenant.property.title}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(tenant.leaseStart)} - {formatDate(tenant.leaseEnd)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(tenant.monthlyRent)}
                            </p>
                            <p className="text-sm text-gray-600">Renta mensual</p>
                          </div>

                          {tenant.outstandingBalance > 0 && (
                            <div className="text-right">
                              <p className="text-lg font-semibold text-red-600">
                                {formatCurrency(tenant.outstandingBalance)}
                              </p>
                              <p className="text-sm text-gray-600">Saldo pendiente</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => handleViewTenant(tenant.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>

                      <Button variant="ghost" size="sm" onClick={() => handleEditTenant(tenant.id)}>
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
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
