'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickActionButton } from '@/components/dashboard/QuickActionButton';
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
  FileText,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Search,
  Filter,
  Plus,
  Download,
  TrendingUp,
  Building,
  UserCheck,
  XCircle,
  BarChart3,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface Contract {
  id: string;
  title: string;
  propertyAddress: string;
  tenantName: string;
  ownerName: string;
  brokerName?: string;
  status: 'active' | 'pending' | 'expired' | 'terminated' | 'draft';
  startDate: string;
  endDate: string;
  monthlyRent: number;
  depositAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiration?: number;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  expiredContracts: number;
  totalMonthlyRevenue: number;
  averageContractDuration: number;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0,
    expiredContracts: 0,
    totalMonthlyRevenue: 0,
    averageContractDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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

    const loadContractData = async () => {
      try {
        // Mock contracts data
        const mockContracts: Contract[] = [
          {
            id: '1',
            title: 'Contrato Arriendo - Providencia 123',
            propertyAddress: 'Av. Providencia 123, Providencia, Santiago',
            tenantName: 'Carlos Ramírez',
            ownerName: 'María González',
            brokerName: 'Ana Martínez',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335).toISOString(),
            monthlyRent: 450000,
            depositAmount: 450000,
            currency: 'CLP',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            daysUntilExpiration: 335,
          },
          {
            id: '2',
            title: 'Contrato Arriendo - Ñuñoa 456',
            propertyAddress: 'Calle Ñuñoa 456, Ñuñoa, Santiago',
            tenantName: 'Pedro Sánchez',
            ownerName: 'Roberto Díaz',
            brokerName: 'Diego López',
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 305).toISOString(),
            monthlyRent: 380000,
            depositAmount: 380000,
            currency: 'CLP',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            daysUntilExpiration: 305,
          },
          {
            id: '3',
            title: 'Contrato Arriendo - Las Condes 789',
            propertyAddress: 'Av. Las Condes 789, Las Condes, Santiago',
            tenantName: 'Ana López',
            ownerName: 'Juan Silva',
            status: 'pending',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 372).toISOString(),
            monthlyRent: 520000,
            depositAmount: 520000,
            currency: 'CLP',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
          },
          {
            id: '4',
            title: 'Contrato Arriendo - Vitacura 321',
            propertyAddress: 'Calle Vitacura 321, Vitacura, Santiago',
            tenantName: 'María Rodríguez',
            ownerName: 'Carlos Mendoza',
            brokerName: 'Patricia Soto',
            status: 'expired',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            monthlyRent: 480000,
            depositAmount: 480000,
            currency: 'CLP',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 410).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            daysUntilExpiration: -30,
          },
          {
            id: '5',
            title: 'Contrato Arriendo - La Florida 654',
            propertyAddress: 'Av. La Florida 654, La Florida, Santiago',
            tenantName: 'Roberto Vega',
            ownerName: 'Carmen Torres',
            status: 'terminated',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
            monthlyRent: 350000,
            depositAmount: 350000,
            currency: 'CLP',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 210).toISOString(),
            updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
            daysUntilExpiration: -50,
          },
        ];

        setContracts(mockContracts);

        // Calculate stats
        const activeContracts = mockContracts.filter(c => c.status === 'active').length;
        const pendingContracts = mockContracts.filter(c => c.status === 'pending').length;
        const expiredContracts = mockContracts.filter(c => c.status === 'expired').length;
        const totalMonthlyRevenue = mockContracts
          .filter(c => c.status === 'active')
          .reduce((sum, contract) => sum + contract.monthlyRent, 0);

        const contractStats: ContractStats = {
          totalContracts: mockContracts.length,
          activeContracts,
          pendingContracts,
          expiredContracts,
          totalMonthlyRevenue,
          averageContractDuration: 12, // meses promedio
        };

        setStats(contractStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading contract data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadContractData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'expired':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'terminated':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'draft':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'terminated':
        return <Badge className="bg-gray-100 text-gray-800">Terminado</Badge>;
      case 'draft':
        return <Badge className="bg-blue-100 text-blue-800">Borrador</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency === 'CLP' ? 'CLP' : 'USD',
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} minutos`;
    }
    if (diffHours < 24) {
      return `Hace ${diffHours} horas`;
    }
    if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    }

    return date.toLocaleDateString('es-CL');
  };

  const handleNewContract = () => {
    // Navigate to new contract creation page
    window.open('/admin/contracts/new', '_blank');
  };

  const handleFilterContracts = () => {
    // Toggle advanced filters panel
    setShowFilters(!showFilters);
  };

  const handleExportContracts = () => {
    // Export contracts data to CSV/Excel
    if (contracts.length === 0) {
      alert('No hay contratos para exportar');
      return;
    }

    const csvData = contracts.map(contract => ({
      ID: contract.id,
      Título: contract.title,
      Dirección: contract.propertyAddress,
      Inquilino: contract.tenantName,
      Propietario: contract.ownerName,
      Estado: contract.status,
      'Fecha Inicio': formatDateTime(contract.startDate),
      'Fecha Fin': formatDateTime(contract.endDate),
      'Renta Mensual': formatCurrency(contract.monthlyRent, contract.currency),
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `contratos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewContract = (contractId: string) => {
    // Navigate to contract detail view
    router.push(`/admin/contracts/${contractId}`);
  };

  const handleEditContract = (contractId: string) => {
    // Navigate to contract edit page
    router.push(`/admin/contracts/${contractId}/edit`);
  };

  const handleDownloadContract = (contractId: string) => {
    // Download contract PDF
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      // Simulate PDF generation and download
      alert(`Descargando contrato: ${contract.title}\nArchivo: contrato_${contractId}.pdf`);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema de backups...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Gestión de Contratos"
      subtitle="Administra todos los contratos del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Contratos</h1>
            <p className="text-gray-600">Administra y monitorea todos los contratos de arriendo</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewContract}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Contrato
            </Button>
            <Button size="sm" variant="outline" onClick={handleFilterContracts}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportContracts}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar contratos por título, inquilino, propietario o dirección..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="expired">Vencidos</SelectItem>
                <SelectItem value="terminated">Terminados</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
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
            <CardContent className="pt-4">
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
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Mensuales</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalMonthlyRevenue, 'CLP')}
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
                  <p className="text-sm font-medium text-gray-600">Contratos Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingContracts}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contracts List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Contratos</CardTitle>
                <CardDescription>Todos los contratos de arriendo del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredContracts.map(contract => (
                    <Card
                      key={contract.id}
                      className={`border-l-4 ${getStatusColor(contract.status)}`}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getStatusColor(contract.status)}`}>
                              <FileText className="w-5 h-5 text-current" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                                {getStatusBadge(contract.status)}
                                {contract.daysUntilExpiration &&
                                  contract.daysUntilExpiration < 30 && (
                                    <Badge className="bg-red-100 text-red-800">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      Vence pronto
                                    </Badge>
                                  )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Building className="w-4 h-4" />
                                    <span className="font-medium">{contract.propertyAddress}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Users className="w-4 h-4" />
                                    <span>Inquilino: {contract.tenantName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <UserCheck className="w-4 h-4" />
                                    <span>Propietario: {contract.ownerName}</span>
                                  </div>
                                  {contract.brokerName && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <UserCheck className="w-4 h-4" />
                                      <span>Corredor: {contract.brokerName}</span>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>
                                      Renta:{' '}
                                      {formatCurrency(contract.monthlyRent, contract.currency)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Inicio: {formatDateTime(contract.startDate)}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>Fin: {formatDateTime(contract.endDate)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewContract(contract.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditContract(contract.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {contract.status === 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadContract(contract.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contract Analytics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Contratos</CardTitle>
                <CardDescription>Métricas y estadísticas de contratos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">Contratos Activos</p>
                      <p className="text-xs text-green-600">En vigencia actualmente</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">{stats.activeContracts}</p>
                      <p className="text-xs text-green-600">Generando ingresos</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Ingresos Mensuales</p>
                      <p className="text-xs text-blue-600">Total de rentas activas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">
                        {formatCurrency(stats.totalMonthlyRevenue, 'CLP')}
                      </p>
                      <p className="text-xs text-blue-600">+8% vs mes anterior</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-orange-800">Contratos Pendientes</p>
                      <p className="text-xs text-orange-600">Esperando aprobación</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-800">{stats.pendingContracts}</p>
                      <p className="text-xs text-orange-600">Requieren revisión</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-800">Contratos Vencidos</p>
                      <p className="text-xs text-red-600">Necesitan renovación</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-800">{stats.expiredContracts}</p>
                      <p className="text-xs text-red-600">Atención requerida</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Herramientas para gestión de contratos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <QuickActionButton
                    icon={Plus}
                    label="Nuevo Contrato"
                    description="Crear contrato"
                    onClick={() => router.push('/admin/contracts/new')}
                  />

                  <QuickActionButton
                    icon={Search}
                    label="Buscar"
                    description="Buscar contratos"
                    onClick={() => {
                      // Focus on search input
                      const searchInput = document.querySelector(
                        'input[placeholder*="Buscar contratos"]'
                      ) as HTMLInputElement;
                      if (searchInput) {
                        searchInput.focus();
                        searchInput.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />

                  <QuickActionButton
                    icon={AlertTriangle}
                    label="Vencimientos"
                    description="Próximos vencimientos"
                    onClick={() => {
                      // Filter by expired contracts
                      setFilterStatus('expired');
                      alert('Mostrando contratos vencidos o próximos a vencer');
                    }}
                  />

                  <QuickActionButton
                    icon={BarChart3}
                    label="Reportes"
                    description="Estadísticas"
                    onClick={() => router.push('/admin/reports/contracts')}
                  />

                  <QuickActionButton
                    icon={Download}
                    label="Exportar"
                    description="Descargar datos"
                    onClick={() => handleExportContracts()}
                  />

                  <QuickActionButton
                    icon={Settings}
                    label="Configuración"
                    description="Ajustes del sistema"
                    onClick={() => router.push('/admin/settings')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
