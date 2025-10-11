'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  DollarSign,
  Home,
  User as UserIcon,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { User, Contract, Property } from '@/types';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { useRouter } from 'next/navigation';
import ElectronicSignature from '@/components/contracts/ElectronicSignature';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ContractWithDetails extends Contract {
  property?: Property;
  tenantName?: string;
  tenantEmail?: string;
}

export default function OwnerContractsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);

  useEffect(() => {
    const loadContracts = async () => {
      try {
        if (!user?.id) {
          setLoading(false);
          return;
        }

        // Try to load from API first
        try {
          const response = await fetch(`/api/owner/contracts?ownerId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setContracts(data.contracts || []);
            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.warn('API not available, using mock data:', apiError);
        }

        // Fallback to mock data filtered by current user
        const mockContracts = [
          {
            id: `contract-${user.id}-1`,
            contractNumber: `CTR-2024-00${user.id.slice(-1)}`,
            propertyId: `prop-${user.id}-1`,
            tenantId: `tenant-${user.id}-1`,
            ownerId: user.id, // Use current user ID
            startDate: new Date('2024-03-01'),
            endDate: new Date('2025-02-28'),
            monthlyRent: 450000,
            deposit: 450000,
            status: 'PENDING' as any,
            brokerId: null,
            terms: 'Contrato residencial estándar - Pendiente de firma',
            signedAt: null,
            terminatedAt: null,
            createdAt: new Date('2024-02-15'),
            updatedAt: new Date('2024-02-15'),
            property: {
              id: `prop-${user.id}-1`,
              title: 'Casa Ñuñoa',
              description: 'Casa familiar moderna en Ñuñoa',
              address: 'Av. Irarrázaval 2345, Ñuñoa',
              city: 'Santiago',
              commune: 'Ñuñoa',
              region: 'Metropolitana',
              price: 450000,
              deposit: 450000,
              bedrooms: 3,
              bathrooms: 2,
              area: 120,
              status: 'AVAILABLE' as any,
              type: 'HOUSE' as any,
              views: 156,
              inquiries: 12,
              images: '',
              features: 'Jardín, Estacionamiento, Amoblado',
              ownerId: user.id, // Use current user ID
              brokerId: null,
              createdBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            tenantName: 'María González',
            tenantEmail: 'maria@ejemplo.com',
          },
          {
            id: `contract-${user.id}-2`,
            contractNumber: `CTR-2024-00${parseInt(user.id.slice(-1)) + 1}`,
            propertyId: `prop-${user.id}-2`,
            tenantId: `tenant-${user.id}-2`,
            ownerId: user.id, // Use current user ID
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
              id: `prop-${user.id}-2`,
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
              ownerId: user.id, // Use current user ID
              brokerId: null,
              createdBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            tenantName: 'Carlos Ramírez',
            tenantEmail: 'carlos@ejemplo.com',
          },
          {
            id: `contract-${user.id}-3`,
            contractNumber: `CTR-2023-00${parseInt(user.id.slice(-1)) + 2}`,
            propertyId: `prop-${user.id}-3`,
            tenantId: `tenant-${user.id}-3`,
            ownerId: user.id, // Use current user ID
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
              id: `prop-${user.id}-3`,
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
              ownerId: user.id, // Use current user ID
              brokerId: null,
              createdBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            tenantName: 'Empresa Soluciones Ltda.',
            tenantEmail: 'contacto@soluciones.cl',
          },
          {
            id: `contract-${user.id}-4`,
            contractNumber: `CTR-2023-00${parseInt(user.id.slice(-1)) + 3}`,
            propertyId: `prop-${user.id}-4`,
            tenantId: `tenant-${user.id}-4`,
            ownerId: user.id, // Use current user ID
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
              id: `prop-${user.id}-4`,
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
              ownerId: user.id, // Use current user ID
              brokerId: null,
              createdBy: user.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            tenantName: 'Ana Martínez',
            tenantEmail: 'ana@ejemplo.com',
          },
        ];

        setContracts(mockContracts);
      } catch (error) {
        logger.error('Error loading contracts:', { error });
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [user?.id]);

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
    const matchesSearch =
      contract.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalMonthlyRevenue = contracts
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + c.monthlyRent, 0);

  const totalDeposits = contracts.reduce((sum, c) => sum + c.deposit, 0);

  const handleSignContract = (contract: ContractWithDetails) => {
    setSelectedContract(contract);
    setShowSignatureDialog(true);
  };

  const handleSignatureComplete = (signatureId: string) => {
    // Actualizar el estado del contrato a firmado
    setContracts(prev =>
      prev.map(contract =>
        contract.id === selectedContract?.id ? { ...contract, status: 'ACTIVE' as any } : contract
      )
    );
    setShowSignatureDialog(false);
    setSelectedContract(null);
  };

  const handleSignatureCancel = () => {
    setShowSignatureDialog(false);
    setSelectedContract(null);
  };

  const handleDownloadContract = (contract: ContractWithDetails) => {
    try {
      logger.info('Descargando contrato:', { contractId: contract.id });
      // Simular descarga de PDF
      const link = document.createElement('a');
      link.href = `/api/contracts/${contract.id}/download`;
      link.download = `contrato-${contract.contractNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.info('Contrato descargado exitosamente:', { contractId: contract.id });
    } catch (error) {
      logger.error('Error descargando contrato:', { error, contractId: contract.id });
      alert('Error al descargar el contrato. Por favor, inténtalo nuevamente.');
    }
  };

  const handleEditContract = (contract: ContractWithDetails) => {
    logger.info('Editando contrato:', { contractId: contract.id });
    router.push(`/owner/contracts/${contract.id}/edit`);
  };

  const handleViewContractDetails = (contract: ContractWithDetails) => {
    logger.info('Viendo detalles del contrato:', { contractId: contract.id });
    // TODO: Implementar modal o página de detalles del contrato
    alert(
      `Detalles del contrato ${contract.contractNumber}:\n\nPropiedad: ${contract.property?.title}\nInquilino: ${contract.tenantName}\nMonto: $${contract.monthlyRent.toLocaleString()}\nEstado: ${contract.status}\n\nFunción de detalles próximamente disponible.`
    );
  };

  const handleDisputeDeposit = async (contract: ContractWithDetails) => {
    try {
      logger.info('Iniciando disputa de depósito para contrato:', { contractId: contract.id });

      const reason = prompt(
        'Describa el motivo de la disputa del depósito de garantía:',
        'Daños en la propiedad, limpieza pendiente, etc.'
      );

      if (!reason || reason.length < 10) {
        alert('La descripción del motivo debe tener al menos 10 caracteres');
        return;
      }

      const amount = prompt('Monto en disputa (CLP):', contract.deposit?.toString() || '0');

      if (!amount || isNaN(Number(amount))) {
        alert('Debe ingresar un monto válido');
        return;
      }

      // Llamar a la API
      const response = await fetch('/api/owner/contracts/dispute-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          reason: reason,
          disputedAmount: Number(amount),
          evidenceFiles: [], // TODO: Implementar subida de archivos de evidencia
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Disputa de depósito iniciada exitosamente!\n\nNúmero de disputa: ${data.dispute.disputeNumber}\nMonto en disputa: $${Number(amount).toLocaleString()}\nEstado: ${data.dispute.status}\n\nSe ha notificado al inquilino y corredor. El proceso de mediación comenzará pronto.`
        );

        // Recargar contratos para actualizar el estado
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error al iniciar disputa: ${errorData.error}`);
      }
    } catch (error) {
      logger.error('Error iniciando disputa de depósito:', { error });
      alert('Error al iniciar disputa de depósito. Por favor, inténtelo nuevamente.');
    }
  };

  const handleStartLegalCase = async (contract: ContractWithDetails) => {
    try {
      logger.info('Iniciando caso legal para contrato:', { contractId: contract.id });

      // Mostrar modal para seleccionar tipo de caso
      const caseType = prompt(
        'Seleccione el tipo de caso legal:\n\n1. NON_PAYMENT - Incumplimiento de pago\n2. CONTRACT_BREACH - Incumplimiento contractual\n3. PROPERTY_DAMAGE - Daño a la propiedad\n4. OTHER - Otro\n\nIngrese el número correspondiente:',
        '1'
      );

      if (!caseType) {
        return;
      }

      let caseTypeValue: string;
      switch (caseType) {
        case '1':
          caseTypeValue = 'NON_PAYMENT';
          break;
        case '2':
          caseTypeValue = 'CONTRACT_BREACH';
          break;
        case '3':
          caseTypeValue = 'PROPERTY_DAMAGE';
          break;
        case '4':
          caseTypeValue = 'OTHER';
          break;
        default:
          alert('Tipo de caso no válido');
          return;
      }

      const description = prompt(
        'Describa brevemente el motivo del caso legal:',
        'Incumplimiento en pagos de arriendo'
      );

      if (!description || description.length < 10) {
        alert('La descripción debe tener al menos 10 caracteres');
        return;
      }

      const priority = prompt(
        'Seleccione la prioridad:\n\n1. LOW - Baja\n2. MEDIUM - Media\n3. HIGH - Alta\n4. URGENT - Urgente\n\nIngrese el número correspondiente:',
        '3'
      );

      if (!priority) {
        return;
      }

      let priorityValue: string;
      switch (priority) {
        case '1':
          priorityValue = 'LOW';
          break;
        case '2':
          priorityValue = 'MEDIUM';
          break;
        case '3':
          priorityValue = 'HIGH';
          break;
        case '4':
          priorityValue = 'URGENT';
          break;
        default:
          alert('Prioridad no válida');
          return;
      }

      // Llamar a la API
      const response = await fetch('/api/owner/contracts/start-legal-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          caseType: caseTypeValue,
          description: description,
          priority: priorityValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Caso legal iniciado exitosamente!\n\nNúmero de caso: ${data.legalCase.caseNumber}\nTipo: ${caseTypeValue}\nEstado: ${data.legalCase.status}\n\nSe ha enviado una notificación por email con los detalles.`
        );

        // Recargar contratos para actualizar el estado
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Error al iniciar caso legal: ${errorData.error}`);
      }
    } catch (error) {
      logger.error('Error iniciando caso legal:', { error });
      alert('Error al iniciar caso legal. Por favor, inténtelo nuevamente.');
    }
  };

  const handleNewContract = () => {
    logger.info('Creando nuevo contrato');
    router.push('/owner/contracts/new');
  };

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
    <UnifiedDashboardLayout>
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
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalDeposits)}</p>
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
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
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
                <Button onClick={handleNewContract}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Contrato
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.map(contract => {
            const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

            return (
              <Card
                key={contract.id}
                className={`hover:shadow-lg transition-shadow ${isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''}`}
              >
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
                            <Badge className="bg-orange-100 text-orange-800">Expira pronto</Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Arriendo mensual</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(contract.monthlyRent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Depósito</p>
                          <p className="font-semibold text-gray-900">
                            {formatPrice(contract.deposit)}
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
                          <p
                            className={`font-semibold ${daysUntilExpiry > 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
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
                      {contract.status === 'PENDING' && (
                        <Dialog
                          open={showSignatureDialog && selectedContract?.id === contract.id}
                          onOpenChange={setShowSignatureDialog}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleSignContract(contract)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Firmar Contrato
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Firmar Contrato - {contract.property?.title}
                              </DialogTitle>
                            </DialogHeader>
                            {selectedContract && (
                              <ElectronicSignature
                                contractId={selectedContract.id}
                                documentName={`Contrato ${selectedContract.contractNumber}`}
                                documentHash="mock-hash"
                                onSignatureComplete={handleSignatureComplete}
                                onSignatureCancel={handleSignatureCancel}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewContractDetails(contract)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownloadContract(contract)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditContract(contract)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      {contract.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => handleStartLegalCase(contract)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Caso Legal
                        </Button>
                      )}
                      {(contract.status === 'TERMINATED' ||
                        contract.status === 'COMPLETED' ||
                        daysUntilExpiry <= 30) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
                          onClick={() => handleDisputeDeposit(contract)}
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Disputar Depósito
                        </Button>
                      )}
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
                  : 'Aún no tienes contratos de arriendo.'}
              </p>
              <Button onClick={handleNewContract}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Contrato
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
