'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
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
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Search,
  Filter,
  Plus,
  Download,
  BarChart3,
  Settings,
  Building,
  UserCheck,
  CreditCard,
  Wallet,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface OwnerPayout {
  id: string;
  ownerName: string;
  propertyAddress: string;
  tenantName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  period: string; // "2024-03"
  paymentDate?: string;
  description: string;
  commission?: number;
  netAmount: number;
  paymentMethod: 'bank_transfer' | 'check' | 'digital_wallet';
  invoiceNumber?: string;
}

interface PayoutStats {
  totalPayouts: number;
  totalAmount: number;
  pendingPayouts: number;
  completedThisMonth: number;
  averagePayoutAmount: number;
  successRate: number;
}

export default function AdminPaymentsOwnersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [payouts, setPayouts] = useState<OwnerPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalPayouts: 0,
    totalAmount: 0,
    pendingPayouts: 0,
    completedThisMonth: 0,
    averagePayoutAmount: 0,
    successRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

    const loadPayoutData = async () => {
      try {
        // Mock owner payouts data
        const mockPayouts: OwnerPayout[] = [
          {
            id: '1',
            ownerName: 'María González',
            propertyAddress: 'Av. Providencia 123, Providencia, Santiago',
            tenantName: 'Carlos Ramírez',
            amount: 450000,
            currency: 'CLP',
            status: 'completed',
            period: '2024-03',
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
            description: 'Pago mensual arriendo marzo 2024',
            commission: 22500,
            netAmount: 427500,
            paymentMethod: 'bank_transfer',
            invoiceNumber: 'PO-2024-001',
          },
          {
            id: '2',
            ownerName: 'Roberto Díaz',
            propertyAddress: 'Calle Ñuñoa 456, Ñuñoa, Santiago',
            tenantName: 'Pedro Sánchez',
            amount: 380000,
            currency: 'CLP',
            status: 'pending',
            period: '2024-03',
            description: 'Pago mensual arriendo marzo 2024',
            commission: 19000,
            netAmount: 361000,
            paymentMethod: 'bank_transfer',
            invoiceNumber: 'PO-2024-002',
          },
          {
            id: '3',
            ownerName: 'Juan Silva',
            propertyAddress: 'Av. Las Condes 789, Las Condes, Santiago',
            tenantName: 'Ana López',
            amount: 520000,
            currency: 'CLP',
            status: 'processing',
            period: '2024-03',
            description: 'Pago mensual arriendo marzo 2024',
            commission: 26000,
            netAmount: 494000,
            paymentMethod: 'check',
            invoiceNumber: 'PO-2024-003',
          },
          {
            id: '4',
            ownerName: 'Carlos Mendoza',
            propertyAddress: 'Calle Vitacura 321, Vitacura, Santiago',
            tenantName: 'María Rodríguez',
            amount: 480000,
            currency: 'CLP',
            status: 'completed',
            period: '2024-02',
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
            description: 'Pago mensual arriendo febrero 2024',
            commission: 24000,
            netAmount: 456000,
            paymentMethod: 'digital_wallet',
            invoiceNumber: 'PO-2024-004',
          },
          {
            id: '5',
            ownerName: 'Carmen Torres',
            propertyAddress: 'Av. La Florida 654, La Florida, Santiago',
            tenantName: 'Roberto Vega',
            amount: 350000,
            currency: 'CLP',
            status: 'failed',
            period: '2024-03',
            description: 'Pago mensual arriendo marzo 2024 - Rechazado por datos bancarios',
            commission: 17500,
            netAmount: 332500,
            paymentMethod: 'bank_transfer',
            invoiceNumber: 'PO-2024-005',
          },
        ];

        // Obtener datos reales de pagos a propietarios desde la API
        const response = await fetch('/api/admin/payments/owners');
        if (response.ok) {
          const data = await response.json();
          setPayouts(data.payouts || []);
          setStats(
            data.stats || {
              totalPayouts: 0,
              totalAmount: 0,
              pendingPayouts: 0,
              completedThisMonth: 0,
              averagePayoutAmount: 0,
              successRate: 0,
            }
          );
        } else {
          // Fallback a datos mock si falla la API
          logger.warn('Failed to fetch real owner payouts, using mock data');
          setPayouts(mockPayouts);

          // Calculate stats
          const completedPayouts = mockPayouts.filter(p => p.status === 'completed');
          const pendingPayouts = mockPayouts.filter(p => p.status === 'pending').length;
          const totalAmount = completedPayouts.reduce((sum, payout) => sum + payout.netAmount, 0);
          const thisMonthPayouts = completedPayouts.filter(
            p => new Date(p.paymentDate!).getMonth() === new Date().getMonth()
          ).length;
          const averageAmount =
            completedPayouts.length > 0
              ? completedPayouts.reduce((sum, payout) => sum + payout.netAmount, 0) /
                completedPayouts.length
              : 0;
          const successRate = (completedPayouts.length / mockPayouts.length) * 100;

          const payoutStats: PayoutStats = {
            totalPayouts: mockPayouts.length,
            totalAmount,
            pendingPayouts,
            completedThisMonth: thisMonthPayouts,
            averagePayoutAmount: averageAmount,
            successRate,
          };

          setStats(payoutStats);
        }

        setLoading(false);
      } catch (error) {
        logger.error('Error loading payout data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPayoutData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Procesando</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Fallido</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
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

  const handleNewPayment = () => {
    // Navigate to new payment creation page
    window.location.href = '/admin/payments/owners/new';
  };

  const handleFilterPayments = () => {
    // Open advanced filter modal
    setSuccessMessage('Filtros avanzados próximamente disponibles');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleExportPayments = () => {
    // Export payments data to CSV
    const csvData = payouts.map(payout => ({
      ID: payout.id,
      Propietario: payout.ownerName,
      Descripción: payout.description,
      Monto: formatCurrency(payout.amount, payout.currency),
      Estado: payout.status,
      Período: payout.period,
      'Fecha Pago': payout.paymentDate ? formatDateTime(payout.paymentDate) : 'Pendiente',
      'Método Pago': getPaymentMethodText(payout.paymentMethod),
      Inquilino: payout.tenantName,
      Propiedad: payout.propertyAddress,
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `pagos_propietarios_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewPayment = (paymentId: string) => {
    // Navigate to payment detail view
    window.open(`/admin/payments/owners/${paymentId}`, '_blank');
  };

  const handleEditPayment = (paymentId: string) => {
    // Navigate to payment edit page
    window.open(`/admin/payments/owners/${paymentId}/edit`, '_blank');
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch =
      payout.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || payout.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Transferencia Bancaria';
      case 'check':
        return 'Cheque';
      case 'digital_wallet':
        return 'Billetera Digital';
      default:
        return method;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pagos a propietarios...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Pagos a Propietarios"
      subtitle="Gestión de pagos y comisiones a propietarios"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50 mb-6">
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
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800">{errorMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setErrorMessage('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagos a Propietarios</h1>
            <p className="text-gray-600">Administra pagos mensuales y comisiones a propietarios</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleNewPayment}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Pago
            </Button>
            <Button size="sm" variant="outline" onClick={handleFilterPayments}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
            <Button size="sm" variant="outline" onClick={handleExportPayments}>
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
                placeholder="Buscar pagos por propietario, descripción o dirección..."
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
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="failed">Fallidos</SelectItem>
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
                  <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPayouts}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Pagado</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalAmount, 'CLP')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingPayouts}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasa Éxito</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.successRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payouts List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Pagos Recientes</CardTitle>
                <CardDescription>Todos los pagos realizados a propietarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredPayouts.map(payout => (
                    <Card key={payout.id} className={`border-l-4 ${getStatusColor(payout.status)}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${getStatusColor(payout.status)}`}>
                              <Home className="w-5 h-5 text-current" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900">{payout.ownerName}</h3>
                                {getStatusBadge(payout.status)}
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  {payout.period}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{payout.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Building className="w-4 h-4" />
                                    <span className="font-medium">{payout.propertyAddress}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Users className="w-4 h-4" />
                                    <span>Inquilino: {payout.tenantName}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Wallet className="w-4 h-4" />
                                    <span>{getPaymentMethodText(payout.paymentMethod)}</span>
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span>
                                      Arriendo: {formatCurrency(payout.amount, payout.currency)}
                                    </span>
                                  </div>
                                  {payout.commission && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <TrendingUp className="w-4 h-4" />
                                      <span>
                                        Comisión:{' '}
                                        {formatCurrency(payout.commission, payout.currency)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 mb-1">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>
                                      Neto: {formatCurrency(payout.netAmount, payout.currency)}
                                    </span>
                                  </div>
                                  {payout.paymentDate && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Calendar className="w-4 h-4" />
                                      <span>Pagado: {formatDateTime(payout.paymentDate)}</span>
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
                              onClick={() => handleViewPayment(payout.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditPayment(payout.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {payout.status === 'completed' && payout.invoiceNumber && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  console.log('Download invoice:', payout.invoiceNumber)
                                }
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

          {/* Payout Analytics */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Pagos</CardTitle>
                <CardDescription>Métricas y estadísticas de pagos a propietarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-800">Pagos Este Mes</p>
                      <p className="text-xs text-green-600">Completados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-800">
                        {stats.completedThisMonth}
                      </p>
                      <p className="text-xs text-green-600">+8% vs mes anterior</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-blue-800">Monto Promedio</p>
                      <p className="text-xs text-blue-600">Por pago</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">
                        {formatCurrency(stats.averagePayoutAmount, 'CLP')}
                      </p>
                      <p className="text-xs text-blue-600">Promedio general</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-purple-800">Tasa de Éxito</p>
                      <p className="text-xs text-purple-600">Pagos completados</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-800">
                        {stats.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-600">Procesamiento exitoso</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-800">Pagos Pendientes</p>
                      <p className="text-xs text-red-600">Requieren atención</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-800">{stats.pendingPayouts}</p>
                      <p className="text-xs text-red-600">Procesar pronto</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Herramientas para gestión de pagos a propietarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <QuickActionButton
                    icon={Plus}
                    label="Nuevo Pago"
                    description="Procesar pago"
                    onClick={() => router.push('/admin/payments/owners/new')}
                  />

                  <QuickActionButton
                    icon={Search}
                    label="Buscar"
                    description="Buscar pagos"
                    onClick={() => {
                      // Focus on search input
                      const searchInput = document.querySelector(
                        'input[placeholder*="Buscar pagos"]'
                      ) as HTMLInputElement;
                      if (searchInput) {
                        searchInput.focus();
                        searchInput.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  />

                  <QuickActionButton
                    icon={AlertTriangle}
                    label="Pendientes"
                    description="Pagos por procesar"
                    onClick={() => {
                      // Filter by pending status
                      const pendingFilter = document.querySelector('select') as HTMLSelectElement;
                      if (pendingFilter) {
                        pendingFilter.value = 'pending';
                        pendingFilter.dispatchEvent(new Event('change', { bubbles: true }));
                      }
                      alert('Mostrando pagos pendientes de procesamiento');
                    }}
                  />

                  <QuickActionButton
                    icon={BarChart3}
                    label="Reportes"
                    description="Estadísticas"
                    onClick={() => router.push('/admin/reports/payments')}
                  />

                  <QuickActionButton
                    icon={Download}
                    label="Exportar"
                    description="Descargar datos"
                    onClick={() => handleExportPayments()}
                  />

                  <QuickActionButton
                    icon={Settings}
                    label="Comisiones"
                    description="Configurar"
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
