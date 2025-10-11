'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { logger } from '@/lib/logger';
import {
  DollarSign,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface MaintenancePayout {
  id: string;
  maintainerId: string;
  maintainerName: string;
  maintainerEmail: string;
  amount: number;
  commission: number;
  netAmount: number;
  serviceCount: number;
  period: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: 'bank_transfer' | 'digital_wallet' | 'check';
  bankAccount?: string;
  processedAt?: string;
  completedAt?: string;
  reference: string;
}

interface PayoutStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalAmount: number;
  averagePayout: number;
  monthlyVolume: number;
}

export default function MaintenancePayoutsPage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<MaintenancePayout[]>([]);
  const [stats, setStats] = useState<PayoutStats>({
    totalPending: 0,
    totalProcessing: 0,
    totalCompleted: 0,
    totalAmount: 0,
    averagePayout: 0,
    monthlyVolume: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadPayouts();
    loadStats();
  }, [selectedPeriod]);

  const loadPayouts = async () => {
    try {
      // Mock data for demonstration
      const mockPayouts: MaintenancePayout[] = [
        {
          id: 'payout_1',
          maintainerId: 'm1',
          maintainerName: 'Carlos Rodríguez',
          maintainerEmail: 'carlos@example.com',
          amount: 450000,
          commission: 45000,
          netAmount: 405000,
          serviceCount: 15,
          period: '2024-01',
          status: 'completed',
          paymentMethod: 'bank_transfer',
          bankAccount: '123456789',
          processedAt: '2024-01-31T10:00:00Z',
          completedAt: '2024-02-01T08:30:00Z',
          reference: 'PAY-MNT-202401-001',
        },
        {
          id: 'payout_2',
          maintainerId: 'm2',
          maintainerName: 'María González',
          maintainerEmail: 'maria@example.com',
          amount: 380000,
          commission: 38000,
          netAmount: 342000,
          serviceCount: 12,
          period: '2024-01',
          status: 'completed',
          paymentMethod: 'digital_wallet',
          processedAt: '2024-01-31T11:00:00Z',
          completedAt: '2024-02-01T09:15:00Z',
          reference: 'PAY-MNT-202401-002',
        },
        {
          id: 'payout_3',
          maintainerId: 'm3',
          maintainerName: 'Juan Pérez',
          maintainerEmail: 'juan@example.com',
          amount: 520000,
          commission: 52000,
          netAmount: 468000,
          serviceCount: 18,
          period: '2024-01',
          status: 'pending',
          paymentMethod: 'bank_transfer',
          bankAccount: '987654321',
          reference: 'PAY-MNT-202401-003',
        },
        {
          id: 'payout_4',
          maintainerId: 'm4',
          maintainerName: 'Ana Martínez',
          maintainerEmail: 'ana@example.com',
          amount: 295000,
          commission: 29500,
          netAmount: 265500,
          serviceCount: 9,
          period: '2024-01',
          status: 'processing',
          paymentMethod: 'check',
          processedAt: '2024-01-31T14:00:00Z',
          reference: 'PAY-MNT-202401-004',
        },
      ];

      setPayouts(mockPayouts);
    } catch (error) {
      logger.error('Error loading payouts:', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats
      const mockStats: PayoutStats = {
        totalPending: 1,
        totalProcessing: 1,
        totalCompleted: 2,
        totalAmount: 1645000,
        averagePayout: 411250,
        monthlyVolume: 1645000,
      };

      setStats(mockStats);
    } catch (error) {
      logger.error('Error loading stats:', { error });
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    try {
      setPayouts(prev =>
        prev.map(payout =>
          payout.id === payoutId
            ? { ...payout, status: 'processing' as const, processedAt: new Date().toISOString() }
            : payout
        )
      );
    } catch (error) {
      logger.error('Error processing payout:', { error });
    }
  };

  const handleCompletePayout = async (payoutId: string) => {
    try {
      setPayouts(prev =>
        prev.map(payout =>
          payout.id === payoutId
            ? {
                ...payout,
                status: 'completed' as const,
                completedAt: new Date().toISOString(),
              }
            : payout
        )
      );
    } catch (error) {
      logger.error('Error completing payout:', { error });
    }
  };

  const handleBulkProcess = async () => {
    const pendingPayouts = payouts.filter(p => p.status === 'pending');
    for (const payout of pendingPayouts) {
      await handleProcessPayout(payout.id);
    }
  };

  const filteredPayouts = payouts.filter(payout => {
    const matchesSearch =
      payout.maintainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.maintainerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payout.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="default">Procesando</Badge>;
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Completado
          </Badge>
        );
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return <CreditCard className="w-4 h-4" />;
      case 'digital_wallet':
        return <Wallet className="w-4 h-4" />;
      case 'check':
        return <Banknote className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Payouts de Mantenimiento" subtitle="Cargando...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Payouts de Mantenimiento"
      subtitle="Gestión de pagos a proveedores de servicios de mantenimiento"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.totalPending}</div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalProcessing}</div>
                <div className="text-sm text-gray-600">Procesando</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.totalCompleted}</div>
                <div className="text-sm text-gray-600">Completados</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(stats.totalAmount)}
                </div>
                <div className="text-sm text-gray-600">Total Pagado</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(stats.averagePayout)}
                </div>
                <div className="text-sm text-gray-600">Promedio</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {formatCurrency(stats.monthlyVolume)}
                </div>
                <div className="text-sm text-gray-600">Volumen Mensual</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Payouts de Mantenimiento</CardTitle>
                <CardDescription>
                  Lista completa de pagos a proveedores de mantenimiento
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowBulkActions(!showBulkActions)}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Acciones Masivas
                </Button>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Buscar por nombre, email o referencia..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="min-w-[150px]">
                <Label htmlFor="period">Período</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Mes Actual</SelectItem>
                    <SelectItem value="last_month">Mes Anterior</SelectItem>
                    <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                    <SelectItem value="last_6_months">Últimos 6 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Label htmlFor="status">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="completed">Completados</SelectItem>
                    <SelectItem value="failed">Fallidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {showBulkActions && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex justify-between items-center">
                    <span>Procesar todos los payouts pendientes ({stats.totalPending})</span>
                    <Button onClick={handleBulkProcess} size="sm">
                      Procesar Todos
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Payouts Table */}
            <div className="space-y-4">
              {filteredPayouts.map(payout => (
                <Card key={payout.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{payout.maintainerName}</h3>
                          {getStatusBadge(payout.status)}
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getPaymentMethodIcon(payout.paymentMethod)}
                            {payout.paymentMethod === 'bank_transfer'
                              ? 'Transferencia'
                              : payout.paymentMethod === 'digital_wallet'
                                ? 'Billetera Digital'
                                : payout.paymentMethod === 'check'
                                  ? 'Cheque'
                                  : payout.paymentMethod}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-600 mb-3">
                          {payout.maintainerEmail} • {payout.serviceCount} servicios • Ref:{' '}
                          {payout.reference}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Monto Bruto:</span>
                            <div className="font-semibold">{formatCurrency(payout.amount)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Comisión (10%):</span>
                            <div className="font-semibold text-red-600">
                              -{formatCurrency(payout.commission)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Monto Neto:</span>
                            <div className="font-semibold text-green-600">
                              {formatCurrency(payout.netAmount)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Período:</span>
                            <div className="font-semibold">{payout.period}</div>
                          </div>
                        </div>

                        {payout.processedAt && (
                          <div className="mt-3 text-xs text-gray-500">
                            Procesado: {new Date(payout.processedAt).toLocaleString('es-CL')}
                            {payout.completedAt &&
                              ` • Completado: ${new Date(payout.completedAt).toLocaleString('es-CL')}`}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {payout.status === 'pending' && (
                          <Button size="sm" onClick={() => handleProcessPayout(payout.id)}>
                            <Clock className="w-4 h-4 mr-1" />
                            Procesar
                          </Button>
                        )}
                        {payout.status === 'processing' && (
                          <Button size="sm" onClick={() => handleCompletePayout(payout.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Completar
                          </Button>
                        )}
                        {payout.status === 'completed' && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Pagado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPayouts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron payouts que coincidan con los filtros.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
