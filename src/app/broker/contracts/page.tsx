'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  Home,
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Star,
  Hand,
  Target,
  Award
} from 'lucide-react';
import { User, Contract, Property } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface ContractWithDetails extends Contract {
  property: Property;
  owner: User;
  tenant: User;
  brokerCommission: number;
  brokerCommissionRate: number;
  propertyId: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  completedContracts: number;
  totalCommission: number;
  averageCommissionRate: number;
  successRate: number;
}

export default function BrokerContractsPage() {
  const { user, loading: userLoading } = useUserState();

  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);

  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0,
    completedContracts: 0,
    totalCommission: 0,
    averageCommissionRate: 0,
    successRate: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockContracts: ContractWithDetails[] = [
        {
          id: '1',
          contractNumber: 'CTR-2024-001',
          status: 'ACTIVE' as any,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 850000,
          deposit: 850000,
          terms: 'Contrato estándar de arriendo',
          ownerId: 'owner-1',
          tenantId: 'tenant-1',
          brokerId: 'broker-1',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          signedAt: new Date('2024-01-01'),
          terminatedAt: null,
          brokerCommission: 51000,
          brokerCommissionRate: 0.06,
          propertyId: 'prop-1',
          property: {
            id: 'prop-1',
            title: 'Departamento en Providencia',
            description: 'Hermoso departamento en el corazón de Providencia',
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 850000,
            deposit: 850000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'OCCUPIED' as any,
            type: 'APARTMENT' as any,
            ownerId: 'owner-1',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            features: 'Estacionamiento, Seguridad 24/7',
            images: '/images/prop1-1.jpg, /images/prop1-2.jpg',
          },
                               owner: {
            id: 'owner-1',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            password: '',
            phone: '+56912345678',
            role: 'OWNER' as any,
            avatar: null,
            isActive: true,
            emailVerified: true,
            phoneVerified: false,
            lastLogin: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          tenant: {
            id: 'tenant-1',
            name: 'María González',
            email: 'maria@example.com',
            password: '',
            phone: '+56987654321',
            role: 'TENANT' as any,
            avatar: null,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
            lastLogin: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
        {
          id: '2',
          contractNumber: 'CTR-2024-002',
          status: 'DRAFT' as any,
          startDate: new Date('2024-02-01'),
          endDate: new Date('2025-01-31'),
          monthlyRent: 1200000,
          deposit: 1200000,
          terms: 'Contrato de arriendo con opción de compra',
          ownerId: 'owner-2',
          tenantId: 'tenant-2',
          brokerId: 'broker-1',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          signedAt: null,
          terminatedAt: null,
          brokerCommission: 72000,
          brokerCommissionRate: 0.06,
          propertyId: 'prop-2',
          property: {
            id: 'prop-2',
            title: 'Casa en Las Condes',
            description: 'Casa familiar en sector residencial',
            address: 'Av. Las Condes 5678',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            status: 'AVAILABLE' as any,
            type: 'HOUSE' as any,
            ownerId: 'owner-2',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            features: 'Jardín, Estacionamiento, Seguridad',
            images: '/images/prop2-1.jpg, /images/prop2-2.jpg',
          },
          owner: {
            id: 'owner-2',
            name: 'Carlos Silva',
            email: 'carlos@example.com',
            password: '',
            phone: '+56923456789',
            role: 'OWNER' as any,
            avatar: null,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
            lastLogin: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
          tenant: {
            id: 'tenant-2',
            name: 'Ana Martínez',
            email: 'ana@example.com',
            password: '',
            phone: '+56934567890',
            role: 'TENANT' as any,
            avatar: null,
            isActive: true,
            emailVerified: false,
            phoneVerified: false,
            lastLogin: null,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          },
        },
      ];

      setContracts(mockContracts);
      
      // Calculate stats
      const totalContracts = mockContracts.length;
      const activeContracts = mockContracts.filter(c => c.status === 'ACTIVE').length;
      const pendingContracts = mockContracts.filter(c => c.status === 'DRAFT').length;
      const completedContracts = mockContracts.filter(c => c.status === 'ACTIVE').length;
      const totalCommission = mockContracts.reduce((sum, c) => sum + c.brokerCommission, 0);
      const averageCommissionRate = mockContracts.reduce((sum, c) => sum + c.brokerCommissionRate, 0) / mockContracts.length;
      const successRate = (completedContracts / totalContracts) * 100;

      setStats({
        totalContracts,
        activeContracts,
        pendingContracts,
        completedContracts,
        totalCommission,
        averageCommissionRate: Number(averageCommissionRate.toFixed(1)),
        successRate: Number(successRate.toFixed(1)),
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-100 text-gray-800">Borrador</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Borrador</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-blue-100 text-blue-800">Completado</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-red-100 text-red-800">Terminado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-purple-100 text-purple-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDaysUntilExpiry = (endDate: Date | string) => {
    const today = new Date();
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    const matchesType = typeFilter === 'all' || 
                       (typeFilter === 'active' && contract.status === 'ACTIVE') ||
                                               (typeFilter === 'pending' && contract.status === 'DRAFT') ||
                        (typeFilter === 'completed' && contract.status === 'ACTIVE');
    return matchesSearch && matchesStatus && matchesType;
  });

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando contratos...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Contratos de Corredor"
        subtitle="Gestiona todos tus contratos y comisiones"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContracts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingContracts}</p>
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
                  <p className="text-sm font-medium text-gray-600">Comisión Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalCommission)}
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
                  <p className="text-sm font-medium text-gray-600">Comisión Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageCommissionRate}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumen de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {stats.activeContracts}
                </div>
                <div className="text-sm text-green-700">Contratos Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatPrice(stats.totalCommission)}
                </div>
                <div className="text-sm text-blue-700">Comisión Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {stats.averageCommissionRate}%
                </div>
                <div className="text-sm text-purple-700">Comisión Promedio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {stats.successRate}%
                </div>
                <div className="text-sm text-indigo-700">Tasa de Éxito</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad, propietario o inquilino..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="ACTIVE">Activo</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="TERMINATED">Terminado</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">Todos los tipos</option>
                  <option value="active">Activos</option>
                  <option value="pending">Pendientes</option>
                  <option value="completed">Completados</option>
                </select>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Contrato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map((contract) => {
            const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
            
            return (
              <Card key={contract.id} className={`hover:shadow-lg transition-shadow ${isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {contract.property?.title}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {contract.property?.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(contract.status)}
                          {isExpiringSoon && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Expira pronto
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Arriendo mensual</p>
                          <p className="font-semibold text-gray-900">{formatPrice(contract.monthlyRent)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Comisión</p>
                          <p className="font-semibold text-purple-900">
                            {formatPrice(contract.brokerCommission)} ({contract.brokerCommissionRate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Periodo</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tiempo restante</p>
                          <p className={`font-semibold ${daysUntilExpiry > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {daysUntilExpiry > 0 ? `${daysUntilExpiry} días` : 'Expirado'}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Propietario</p>
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{contract.owner?.name}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Inquilino</p>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-900">{contract.tenant?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Creado: {formatDate(contract.createdAt.toISOString())}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Hand className="w-4 h-4" />
                          <span>Tu comisión: {formatPrice(contract.brokerCommission)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                      <Button size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      {contract.status === 'DRAFT' && (
                        <Button size="sm" variant="outline" className="flex-1">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Seguimiento
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredContracts.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron contratos
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes contratos gestionados.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Contrato
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
