'use client';

import React, { useState, useEffect } from 'react';
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
  FileText,
  Users,
  Calendar,
  DollarSign,
  Building,
  Search,
  Filter,
  Eye,
  Edit,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface BrokerContract {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  ownerName: string;
  tenantName: string;
  monthlyRent: number;
  commissionEarned: number;
  status: 'active' | 'pending' | 'expired' | 'terminated';
  startDate: string;
  endDate: string;
  daysUntilExpiration?: number;
  lastPayment?: string;
  nextPayment?: string;
  createdAt: string;
}

interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  expiredContracts: number;
  totalMonthlyRevenue: number;
  totalCommissions: number;
  averageRent: number;
}

export default function BrokerContractsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [contracts, setContracts] = useState<BrokerContract[]>([]);
  const [stats, setStats] = useState<ContractStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0,
    expiredContracts: 0,
    totalMonthlyRevenue: 0,
    totalCommissions: 0,
    averageRent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
  });

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

    const loadContractsData = async () => {
      try {
        // Cargar datos reales desde la API
        const response = await fetch('/api/contracts?limit=100', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform API data to match our interface
        const transformedContracts: BrokerContract[] =
          data.contracts?.map((contract: any) => ({
            id: contract.id,
            propertyTitle: contract.property?.title || 'Propiedad no identificada',
            propertyAddress: contract.property?.address || 'Dirección no disponible',
            ownerName: contract.owner?.name || 'Propietario no identificado',
            tenantName: contract.tenant?.name || 'Inquilino no identificado',
            monthlyRent: contract.rentAmount || 0,
            commissionEarned: contract.commissionAmount || 0,
            status: contract.status?.toLowerCase() || 'pending',
            startDate: contract.startDate || new Date().toISOString(),
            endDate: contract.endDate || new Date().toISOString(),
            daysUntilExpiration: contract.endDate
              ? Math.ceil(
                  (new Date(contract.endDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                )
              : 0,
            lastPayment: contract.lastPaymentDate,
            nextPayment: contract.nextPaymentDate,
            createdAt: contract.createdAt || new Date().toISOString(),
          })) || [];

        setContracts(transformedContracts);

        // Calculate stats from real data
        const totalContracts = transformedContracts.length;
        const activeContracts = transformedContracts.filter(c => c.status === 'active').length;
        const pendingContracts = transformedContracts.filter(c => c.status === 'pending').length;
        const expiredContracts = transformedContracts.filter(c => c.status === 'expired').length;
        const totalMonthlyRevenue = transformedContracts.reduce((sum, c) => sum + c.monthlyRent, 0);
        const totalCommissions = transformedContracts.reduce(
          (sum, c) => sum + c.commissionEarned,
          0
        );
        const averageRent = totalContracts > 0 ? totalMonthlyRevenue / totalContracts : 0;

        setStats({
          totalContracts,
          activeContracts,
          pendingContracts,
          expiredContracts,
          totalMonthlyRevenue,
          totalCommissions,
          averageRent,
        });

        logger.debug('Datos de contratos de corredor cargados', {
          totalContracts,
          activeContracts,
          pendingContracts,
          expiredContracts,
        });
      } catch (error) {
        logger.error('Error loading broker contracts data:', {
          error: error instanceof Error ? error.message : String(error),
        });

        // En caso de error, mostrar datos vacíos
        setContracts([]);
        setStats({
          totalContracts: 0,
          activeContracts: 0,
          pendingContracts: 0,
          expiredContracts: 0,
          totalMonthlyRevenue: 0,
          totalCommissions: 0,
          averageRent: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    // Mock contracts data (commented out)
    const loadContractsDataMock = async () => {
      try {
        // Mock contracts data
        const mockContracts: BrokerContract[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Providencia',
            propertyAddress: 'Av. Providencia 123, Providencia',
            ownerName: 'María González',
            tenantName: 'Carlos Ramírez',
            monthlyRent: 450000,
            commissionEarned: 225000,
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 305).toISOString(),
            daysUntilExpiration: 305,
            lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 65).toISOString(),
          },
          {
            id: '2',
            propertyTitle: 'Casa Familiar Las Condes',
            propertyAddress: 'Calle Las Condes 456, Las Condes',
            ownerName: 'Roberto Díaz',
            tenantName: 'Ana López',
            monthlyRent: 850000,
            commissionEarned: 425000,
            status: 'active',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335).toISOString(),
            daysUntilExpiration: 335,
            lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
            nextPayment: new Date(Date.now() + 1000 * 60 * 60 * 24 * 1).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
          },
          {
            id: '3',
            propertyTitle: 'Oficina Corporativa Centro',
            propertyAddress: 'Av. Libertador 789, Santiago Centro',
            ownerName: 'Empresa ABC Ltda',
            tenantName: 'Tech Solutions SpA',
            monthlyRent: 1200000,
            commissionEarned: 360000,
            status: 'pending',
            startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 372).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          },
          {
            id: '4',
            propertyTitle: 'Local Comercial Ñuñoa',
            propertyAddress: 'Irarrázaval 321, Ñuñoa',
            ownerName: 'Patricia Soto',
            tenantName: 'Café Paradiso',
            monthlyRent: 350000,
            commissionEarned: 350000,
            status: 'expired',
            startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 400).toISOString(),
            endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
            daysUntilExpiration: -35,
            lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 410).toISOString(),
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
        const totalCommissions = mockContracts.reduce(
          (sum, contract) => sum + contract.commissionEarned,
          0
        );
        const averageRent = activeContracts > 0 ? totalMonthlyRevenue / activeContracts : 0;

        const contractStats: ContractStats = {
          totalContracts: mockContracts.length,
          activeContracts,
          pendingContracts,
          expiredContracts,
          totalMonthlyRevenue,
          totalCommissions,
          averageRent,
        };

        setStats(contractStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading contracts data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadContractsData();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      expired: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
      terminated: { label: 'Terminado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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
    } else if (diffDays < 30) {
      return `Hace ${diffDays} días`;
    } else {
      return date.toLocaleDateString('es-CL');
    }
  };

  const handleViewContract = (contractId: string) => {
    // Navigate to contract detail view
    window.open(`/broker/contracts/${contractId}`, '_blank');
  };

  const handleEditContract = (contractId: string) => {
    // Navigate to contract edit page
    window.open(`/broker/contracts/${contractId}/edit`, '_blank');
  };

  const handleDownloadContract = (contractId: string) => {
    // Download contract PDF
    const contract = contracts.find(c => c.id === contractId);
    if (contract) {
      alert(`Descargando contrato: ${contract.propertyTitle}\nArchivo: contrato_${contractId}.pdf`);
    }
  };

  const handleExportContracts = () => {
    logger.info('Abriendo opciones de exportación de contratos');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando contratos del corredor', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }

      // Crear URL de descarga
      const exportUrl = `/api/broker/contracts/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `contratos_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
      });

      logger.info('Exportación de contratos completada exitosamente');
    } catch (error) {
      logger.error('Error exportando contratos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los contratos. Por favor, intenta nuevamente.');
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || contract.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
    <UnifiedDashboardLayout title="Mis Contratos" subtitle="Contratos de arriendo que gestiono">
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contratos Gestionados</h1>
            <p className="text-gray-600">Administra los contratos de arriendo de tus propiedades</p>
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
                    {formatCurrency(stats.totalMonthlyRevenue)}
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
                  <p className="text-sm font-medium text-gray-600">Comisiones Ganadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalCommissions)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-orange-600" />
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
                placeholder="Buscar contratos por propiedad, propietario o inquilino..."
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
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportContracts} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
          </Button>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map(contract => (
            <Card
              key={contract.id}
              className={`border-l-4 ${contract.status === 'expired' ? 'border-l-red-500' : contract.status === 'active' ? 'border-l-green-500' : 'border-l-yellow-500'}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-lg ${contract.status === 'expired' ? 'bg-red-50' : contract.status === 'active' ? 'bg-green-50' : 'bg-yellow-50'}`}
                    >
                      <FileText className="w-6 h-6 text-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{contract.propertyTitle}</h3>
                        {getStatusBadge(contract.status)}
                        {contract.daysUntilExpiration &&
                          contract.daysUntilExpiration < 30 &&
                          contract.status === 'active' && (
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
                            <span>Propietario: {contract.ownerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Inquilino: {contract.tenantName}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Renta mensual: {formatCurrency(contract.monthlyRent)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span>Mi comisión: {formatCurrency(contract.commissionEarned)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                            <Calendar className="w-4 h-4" />
                            <span>Inicio: {formatDateTime(contract.startDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>Fin: {formatDateTime(contract.endDate)}</span>
                          </div>
                          {contract.nextPayment && (
                            <div className="flex items-center gap-2 text-sm text-blue-600">
                              <Calendar className="w-4 h-4" />
                              <span>Próximo pago: {formatDateTime(contract.nextPayment)}</span>
                            </div>
                          )}
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadContract(contract.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contratos registrados</h3>
            <p className="text-gray-600">
              Los contratos aparecerán aquí cuando completes transacciones
            </p>
          </div>
        )}

        {/* Modal de exportación */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Exportar Contratos</DialogTitle>
              <DialogDescription>
                Selecciona el formato y filtra los contratos que deseas exportar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Formato de Archivo</Label>
                <Select
                  value={exportOptions.format}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel)</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-status">Filtrar por Estado</Label>
                <Select
                  value={exportOptions.status}
                  onValueChange={value => setExportOptions(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los contratos</SelectItem>
                    <SelectItem value="ACTIVE">Activos</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="EXPIRED">Vencidos</SelectItem>
                    <SelectItem value="TERMINATED">Terminados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Se exportarán {filteredContracts.length} contratos
                  {exportOptions.format === 'csv'
                    ? ' en formato CSV compatible con Excel'
                    : ' en formato JSON'}
                  {exportOptions.status !== 'all' &&
                    ` filtrados por estado "${exportOptions.status}"`}
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExportDialog(false);
                  setExportOptions({
                    format: 'csv',
                    status: 'all',
                  });
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Contratos
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UnifiedDashboardLayout>
  );
}
