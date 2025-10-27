'use client';

import { useState, useEffect } from 'react';

// Configuración para renderizado dinámico - contratos actualizados constantemente
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidar cada minuto para contratos actualizados
import { logger } from '@/lib/logger-minimal';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Configuración dinámica ya definida arriba

interface ContractWithDetails extends Contract {
  property?: Property;
  tenantName?: string;
  tenantEmail?: string;
}

export default function OwnerContractsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<ContractWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<ContractWithDetails | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [platformFeePercentage, setPlatformFeePercentage] = useState(5.0); // Por defecto 5%

  // Estados para manejar redirecciones
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false);

  // Cargar configuración de plataforma
  useEffect(() => {
    const loadPlatformConfig = async () => {
      try {
        const response = await fetch('/api/admin/platform-retention-config', {
          credentials: 'include',
        });
        if (response.ok) {
          const config = await response.json();
          setPlatformFeePercentage(config.platformFeePercentage || 5.0);
        }
      } catch (error) {
        console.warn('No se pudo cargar configuración de plataforma, usando valor por defecto');
      }
    };

    loadPlatformConfig();
  }, []);

  // Detectar si viene de crear un contrato nuevo
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('refresh') === 'true') {
      // Limpiar el parámetro de la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      // Activar refresh
      setRefreshTrigger(prev => prev + 1);
    }
  }, []);

  // Manejar redirecciones
  useEffect(() => {
    if (!authLoading && !user) {
      setShouldRedirectToLogin(true);
    } else if (!authLoading && user && user.role !== 'OWNER') {
      setShouldRedirectToDashboard(true);
    }
  }, [authLoading, user]);

  // Ejecutar redirecciones
  useEffect(() => {
    if (shouldRedirectToLogin) {
      router.push('/auth/login');
    } else if (shouldRedirectToDashboard) {
      router.push('/owner/dashboard');
    }
  }, [shouldRedirectToLogin, shouldRedirectToDashboard, router]);

  useEffect(() => {
    // Solo cargar contratos si el usuario está disponible y la autenticación terminó
    if (!user?.id || authLoading) {
      return;
    }

    const loadContracts = async () => {
      setLoading(true);
      try {
        console.log('🔍 [Owner Contracts] Iniciando carga de contratos...');
        console.log('🔍 [Owner Contracts] Usuario actual:', user);

        // ✅ CORREGIDO: Cargar datos reales desde la API
        const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
        const url = `${baseUrl}/api/owner/contracts`;

        console.log('🔍 [Owner Contracts] URL de petición:', url);

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
        });

        console.log('🔍 [Owner Contracts] Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const data = await response.json();

          console.log('✅ [Owner Contracts] Datos recibidos:', {
            totalContracts: data.total,
            contractsLength: data.contracts?.length || 0,
            contracts: data.contracts,
          });

          // ✅ CORREGIDO: Mapear contratos con información adicional del tenant
          const contractsWithDetails = (data.contracts || []).map((contract: any) => ({
            ...contract,
            tenantName: contract.tenant?.name || 'Sin nombre',
            tenantEmail: contract.tenant?.email || '',
          }));

          setContracts(contractsWithDetails);

          if (contractsWithDetails.length === 0) {
            console.log('ℹ️ [Owner Contracts] No se encontraron contratos');
          }
        } else {
          // Obtener detalles del error
          let errorDetails = { status: response.status, statusText: response.statusText };
          try {
            const errorData = await response.json();
            errorDetails = { ...errorDetails, ...errorData };
          } catch (e) {
            // No se pudo parsear el error
          }

          console.error('❌ [Owner Contracts] Error en la petición:', errorDetails);

          logger.error('Error loading contracts from API:', errorDetails);

          // Si es 401 o 403, probablemente la sesión expiró
          if (response.status === 401 || response.status === 403) {
            console.error('❌ [Owner Contracts] Sesión inválida o expirada');
            alert('Tu sesión ha expirado. Serás redirigido al login.');
            router.push('/auth/login');
            return;
          }

          setContracts([]);
          alert(`Error al cargar contratos: ${errorDetails.statusText || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('❌ [Owner Contracts] Error de red o excepción:', error);

        logger.error('Error loading contracts:', {
          error: error instanceof Error ? error.message : String(error),
        });

        setContracts([]);
        alert('Error de conexión al cargar contratos. Verifica tu conexión a internet.');
      } finally {
        setLoading(false);
      }
    };

    loadContracts();
  }, [user?.id, authLoading, refreshTrigger]);

  // Mostrar loading mientras se verifica autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se ejecuta la redirección
  if (shouldRedirectToLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirectToDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const refreshContracts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiry = (endDate: Date | string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusConfig = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-800' },
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      TERMINATED: { label: 'Terminado', color: 'bg-gray-100 text-gray-800' },
      DRAFT: { label: 'Borrador', color: 'bg-blue-100 text-blue-800' },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch =
      contract.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.property?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ✅ CORREGIDO: Calcular estadísticas basadas en datos reales
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
  const pendingContracts = contracts.filter(c => c.status === 'PENDING').length;
  const totalRevenue = contracts
    .filter(c => c.status === 'ACTIVE')
    .reduce((sum, c) => sum + (c.monthlyRent || 0), 0);

  const handleDisputeDeposit = async (contract: ContractWithDetails) => {
    const reason = prompt('Motivo de la disputa:');
    const amount = prompt('Monto disputado:');

    if (!reason || !amount) {
      alert('Debe completar todos los campos');
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Debe ingresar un monto válido');
      return;
    }

    try {
      const response = await fetch('/api/owner/contracts/dispute-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          reason: reason,
          disputedAmount: Number(amount),
          evidenceFiles: [],
        }),
      });

      if (response.ok) {
        alert('Disputa iniciada exitosamente');
        // Recargar contratos
        refreshContracts();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  const handleExportData = () => {
    logger.info('Abriendo opciones de exportación de contratos');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando contratos del propietario', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/owner/contracts/export?${params.toString()}`;

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
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de contratos completada exitosamente');
    } catch (error) {
      logger.error('Error exportando contratos:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar los contratos. Por favor, intenta nuevamente.');
    }
  };

  const handleStartLegalCase = async (contract: ContractWithDetails) => {
    const caseType = prompt('Tipo de caso (EVICTION, BREACH, OTHER):');
    const description = prompt('Descripción del caso:');
    const priority = prompt('Prioridad (LOW, MEDIUM, HIGH):');

    if (!caseType || !description || !priority) {
      alert('Debe completar todos los campos');
      return;
    }

    const caseTypeValue = caseType.toUpperCase();
    const priorityValue = priority.toUpperCase();

    if (!['EVICTION', 'BREACH', 'OTHER'].includes(caseTypeValue)) {
      alert('Tipo de caso no válido');
      return;
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(priorityValue)) {
      alert('Prioridad no válida');
      return;
    }

    try {
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
        alert('Caso legal iniciado exitosamente');
        // Recargar contratos
        refreshContracts();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      alert('Error de conexión');
    }
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
    <UnifiedDashboardLayout
      title="Contratos de Arriendo"
      subtitle="Gestiona todos tus contratos de arriendo"
    >
      <div className="container mx-auto px-4 py-6">
        {/* ✅ CORREGIDO: Stats Overview basado en datos reales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contratos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalContracts}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{activeContracts}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{pendingContracts}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ✅ CORREGIDO: Performance Summary basado en datos reales */}
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
                <p className="text-2xl font-bold text-blue-600">
                  {totalContracts > 0 ? Math.round((activeContracts / totalContracts) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Tasa de Actividad</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {activeContracts > 0 ? Math.round(totalRevenue / activeContracts / 1000) : 0}K
                </p>
                <p className="text-sm text-gray-600">Renta Promedio (CLP)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {
                    contracts.filter(c => {
                      const days = getDaysUntilExpiry(c.endDate);
                      return days > 0 && days <= 30;
                    }).length
                  }
                </p>
                <p className="text-sm text-gray-600">Próximos a Vencer</p>
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
                    placeholder="Buscar por número de contrato, propiedad o inquilino..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los Estados</option>
                  <option value="ACTIVE">Activos</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="TERMINATED">Terminados</option>
                  <option value="DRAFT">Borradores</option>
                </select>
                <Button onClick={handleExportData} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Datos
                </Button>
                <Button onClick={refreshContracts} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts List */}
        <div className="space-y-4">
          {filteredContracts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay contratos registrados
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'No se encontraron contratos con los filtros aplicados'
                      : 'Comienza creando tu primer contrato de arriendo'}
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <div className="flex gap-2">
                      <Button onClick={() => router.push('/owner/properties')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ver Propiedades
                      </Button>
                      <Button onClick={() => router.push('/owner/contracts/new')} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Contrato
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredContracts.map(contract => {
              const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
              const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

              return (
                <Card
                  key={contract.id}
                  className={`${isExpiringSoon ? 'border-orange-200 bg-orange-50' : ''}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {contract.contractNumber}
                          </h3>
                          {getStatusBadge(contract.status)}
                          {isExpiringSoon && (
                            <Badge className="bg-orange-100 text-orange-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Vence en {daysUntilExpiry} días
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Home className="w-4 h-4" />
                              <span className="font-medium">{contract.property?.title}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UserIcon className="w-4 h-4" />
                              <span>Inquilino: {contract.tenantName || 'No especificado'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Inicio: {formatDate(contract.startDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Fin: {formatDate(contract.endDate)}</span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>Renta: {formatPrice(contract.monthlyRent || 0)}/mes</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>Depósito: {formatPrice(contract.depositAmount || 0)}</span>
                            </div>
                            {contract.signedAt && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Firmado: {formatDate(contract.signedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(contract.status === 'DRAFT' || contract.status === 'PENDING') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedContract(contract);
                              setShowSignatureDialog(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {contract.status === 'ACTIVE' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDisputeDeposit(contract)}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Signature Dialog */}
      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Firmar Contrato</DialogTitle>
            <DialogDescription>Firma digitalmente el contrato seleccionado</DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Importante</p>
                    <p className="text-blue-800">
                      Al firmar este contrato, aceptas todos los términos y condiciones
                      establecidos. Esta firma tiene valor legal y es vinculante.
                    </p>
                  </div>
                </div>
              </div>

              <ElectronicSignature
                contractId={selectedContract.id}
                documentName={`Contrato de Arriendo - ${selectedContract.contractNumber || selectedContract.id}`}
                documentHash={`hash-${selectedContract.id}`}
                onSignatureComplete={() => {
                  setShowSignatureDialog(false);
                  refreshContracts();
                }}
                onSignatureCancel={() => setShowSignatureDialog(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Contrato</DialogTitle>
            <DialogDescription>
              Información completa del contrato{' '}
              {selectedContract?.contractNumber || selectedContract?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-6">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Número de Contrato:</span>
                      <span>{selectedContract.contractNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Estado:</span>
                      <Badge className={getStatusConfig(selectedContract.status).color}>
                        {getStatusConfig(selectedContract.status).label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Inicio:</span>
                      <span>{formatDate(selectedContract.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Fin:</span>
                      <span>{formatDate(selectedContract.endDate)}</span>
                    </div>
                    {selectedContract.signedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium">Fecha de Firma:</span>
                        <span>{formatDate(selectedContract.signedAt)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información Financiera</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Renta Mensual:</span>
                      <span className="font-semibold">
                        {formatPrice(selectedContract.monthlyRent || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Depósito de Garantía:</span>
                      <span className="font-semibold">
                        {formatPrice(selectedContract.depositAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Comisión Plataforma:</span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(
                          (selectedContract.monthlyRent || 0) * (platformFeePercentage / 100)
                        )}{' '}
                        ({platformFeePercentage}%)
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Información de las partes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Propiedad</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Título:</span>
                      <p>{selectedContract.property?.title || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Dirección:</span>
                      <p>{selectedContract.property?.address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Propietario:</span>
                      <p>
                        {user?.name} ({user?.email})
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inquilino</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Nombre:</span>
                      <p>{selectedContract.tenantName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>
                      <p>{selectedContract.tenantEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium">RUT:</span>
                      <p>{selectedContract.tenantRut || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Términos del contrato */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Términos del Contrato</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {selectedContract.terms || 'No se encontraron términos del contrato.'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Cerrar
                </Button>
                {(selectedContract.status === 'DRAFT' || selectedContract.status === 'PENDING') && (
                  <Button
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setShowSignatureDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Firmar Contrato
                  </Button>
                )}
                {selectedContract.status === 'ACTIVE' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      handleDisputeDeposit(selectedContract);
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Disputar Depósito
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                  <SelectItem value="TERMINATED">Terminados</SelectItem>
                  <SelectItem value="DRAFT">Borradores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="export-start-date">Fecha Desde</Label>
                <input
                  id="export-start-date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={exportOptions.startDate}
                  onChange={e => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="export-end-date">Fecha Hasta</Label>
                <input
                  id="export-end-date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={exportOptions.endDate}
                  onChange={e => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Se exportarán {filteredContracts.length} contratos
                {exportOptions.format === 'csv'
                  ? ' en formato CSV compatible con Excel'
                  : ' en formato JSON'}
                {exportOptions.status !== 'all' &&
                  ` filtrados por estado "${exportOptions.status}"`}
                {(exportOptions.startDate || exportOptions.endDate) &&
                  ' en el rango de fechas seleccionado'}
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
                  startDate: '',
                  endDate: '',
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
    </UnifiedDashboardLayout>
  );
}
