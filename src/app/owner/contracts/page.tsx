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
  TrendingUp
} from 'lucide-react';
import { User, Contract, Property } from '@/types';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface ContractWithDetails extends Contract {
  property?: Property;
  tenantName?: string;
  tenantEmail?: string;
}

export default function OwnerContractsPage() {
  const { user } = useUserState();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      setContracts([
        {
          id: '1',
          contractNumber: 'CTR-2024-001',
          propertyId: '1',
          tenantId: '2',
          ownerId: '1',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          monthlyRent: 550000,
          deposit: 550000,
          status: 'ACTIVE' as any,
          brokerId: null,
          terms: 'Contrato estándar de arriendo',
          signedAt: new Date('2023-12-15'),
          terminatedAt: null,
          createdAt: new Date('2023-12-15'),
          updatedAt: new Date('2024-01-01'),
          property: {
            id: '1',
            title: 'Departamento Las Condes',
            description: 'Hermoso departamento en el corazón de Las Condes',
            address: 'Av. Apoquindo 3400, Las Condes',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 550000,
            deposit: 550000,
            bedrooms: 2,
            bathrooms: 2,
            area: 85,
            status: 'RENTED' as any,
            type: 'APARTMENT' as any,
            views: 245,
            inquiries: 23,
            images: '',
            features: 'Estacionamiento, Bodega, Gimnasio',
            ownerId: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tenantName: 'Carlos Ramírez',
          tenantEmail: 'carlos@ejemplo.com',
        },
        {
          id: '2',
          contractNumber: 'CTR-2023-002',
          propertyId: '2',
          tenantId: '3',
          ownerId: '1',
          startDate: new Date('2023-06-01'),
          endDate: new Date('2024-05-31'),
          monthlyRent: 350000,
          deposit: 350000,
          status: 'ACTIVE' as any,
          brokerId: null,
          terms: 'Contrato comercial estándar',
          signedAt: new Date('2023-05-15'),
          terminatedAt: null,
          createdAt: new Date('2023-05-15'),
          updatedAt: new Date('2023-06-01'),
          property: {
            id: '2',
            title: 'Oficina Providencia',
            description: 'Oficina comercial en sector empresarial',
            address: 'Av. Providencia 1245, Providencia',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 350000,
            deposit: 350000,
            bedrooms: 1,
            bathrooms: 1,
            area: 45,
            status: 'RENTED' as any,
            type: 'COMMERCIAL' as any,
            views: 189,
            inquiries: 15,
            images: '',
            features: 'Seguridad 24/7, Recepción',
            ownerId: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tenantName: 'Empresa Soluciones Ltda.',
          tenantEmail: 'contacto@soluciones.cl',
        },
        {
          id: '3',
          contractNumber: 'CTR-2023-003',
          propertyId: '3',
          tenantId: '4',
          ownerId: '1',
          startDate: new Date('2023-03-01'),
          endDate: new Date('2024-02-29'),
          monthlyRent: 1200000,
          deposit: 1200000,
          status: 'EXPIRED' as any,
          brokerId: null,
          terms: 'Contrato residencial estándar',
          signedAt: new Date('2023-02-15'),
          terminatedAt: new Date('2024-02-29'),
          createdAt: new Date('2023-02-15'),
          updatedAt: new Date('2023-03-01'),
          property: {
            id: '3',
            title: 'Casa Vitacura',
            description: 'Casa familiar en sector residencial exclusivo',
            address: 'Av. Vitacura 8900, Vitacura',
            city: 'Santiago',
            commune: 'Vitacura',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 4,
            bathrooms: 3,
            area: 200,
            status: 'AVAILABLE' as any,
            type: 'HOUSE' as any,
            views: 312,
            inquiries: 28,
            images: '',
            features: 'Jardín, Piscina, Estacionamiento',
            ownerId: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          tenantName: 'Ana Martínez',
          tenantEmail: 'ana@ejemplo.com',
        },
      ]);

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
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-800">Expirado</Badge>;
      case 'TERMINATED':
        return <Badge className="bg-gray-100 text-gray-800">Terminado</Badge>;
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
                         contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMonthlyRevenue = contracts
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + c.monthlyRent, 0);

  const totalDeposits = contracts.reduce((sum, c) => sum + c.deposit, 0);

  if (loading) {
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
        title="Contratos de Arriendo"
        subtitle="Gestiona todos tus contratos de arriendo"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {contracts.filter(c => c.status === 'ACTIVE').length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalMonthlyRevenue)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Depósitos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(totalDeposits)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Resumen de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
                <div className="text-sm text-gray-600">Tasa de Ocupación</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {formatPrice(totalMonthlyRevenue * 12)}
                </div>
                <div className="text-sm text-gray-600">Ingresos Anuales Proyectados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">4.7</div>
                <div className="text-sm text-gray-600">Satisfacción Promedio</div>
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
                    placeholder="Buscar por propiedad o inquilino..."
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
                  <option value="ACTIVE">Activos</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="EXPIRED">Expirados</option>
                  <option value="TERMINATED">Terminados</option>
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
                          <p className="text-sm text-gray-600">Depósito</p>
                          <p className="font-semibold text-gray-900">{formatPrice(contract.deposit)}</p>
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

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-4 h-4" />
                          <span>Inquilino: {contract.tenantName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Creado: {formatDate(contract.createdAt.toISOString())}</span>
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
                {searchTerm || statusFilter !== 'all' 
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no tienes contratos de arriendo.'
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
