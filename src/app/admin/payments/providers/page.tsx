'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Truck,
  Wrench,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  Building,
  AlertTriangle,
  RefreshCw,
  Download,
  Filter,
  Eye
} from 'lucide-react';

import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface ProviderPayout {
  recipientId: string;
  recipientType: 'maintenance_provider' | 'service_provider';
  amount: number;
  currency: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    grossAmount: number;
    commission: number;
    gracePeriodAdjustment: number;
    taxes: number;
    netAmount: number;
  };
  providerDetails: {
    businessName: string;
    specialty?: string;
    serviceType?: string;
    registrationDate: Date;
  };
  jobs: {
    id: string;
    type: string;
    amount: number;
    date: Date;
    clientName: string;
  }[];
}

interface PayoutStats {
  totalProviders: number;
  totalPaid: number;
  totalPending: number;
  averagePerProvider: number;
  maintenanceProviders: number;
  serviceProviders: number;
}

export default function AdminProviderPayoutsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<ProviderPayout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<ProviderPayout | null>(null);
  const [processingPayout, setProcessingPayout] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [filters, setFilters] = useState({
    providerType: 'all',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadUser();
    loadPayouts();
    loadStats();
  }, []);

  const loadUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/providers/payouts');
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data);
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/providers/payouts/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const calculatePayouts = async () => {
    try {
      const response = await fetch('/api/admin/providers/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data);
        alert(`Se calcularon ${data.data.length} payouts por un total de $${data.summary.totalAmount.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Error calculating payouts:', error);
      alert('Error calculando payouts');
    }
  };

  const approvePayout = async (payout: ProviderPayout) => {
    try {
      setProcessingPayout(payout.recipientId);

      // Procesar y aprobar el payout directamente
      const response = await fetch('/api/admin/providers/payouts/process-and-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payout,
          adminUserId: user?.id
        }),
      });

      if (response.ok) {
        alert('Payout aprobado y procesado exitosamente');
        await loadPayouts();
        await loadStats();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error procesando payout');
      }

    } catch (error: any) {
      console.error('Error approving payout:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessingPayout(null);
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-CL');
  };

  const getProviderTypeIcon = (type: string) => {
    return type === 'maintenance_provider' ? <Wrench className="w-4 h-4" /> : <Truck className="w-4 h-4" />;
  };

  const getProviderTypeLabel = (type: string) => {
    return type === 'maintenance_provider' ? 'Mantenimiento' : 'Servicios';
  };

  const getProviderTypeColor = (type: string) => {
    return type === 'maintenance_provider'
      ? 'bg-orange-100 text-orange-800'
      : 'bg-blue-100 text-blue-800';
  };

  const filteredPayouts = payouts.filter(payout => {
    if (filters.providerType !== 'all' && payout.recipientType !== filters.providerType) return false;
    if (filters.minAmount && payout.amount < Number(filters.minAmount)) return false;
    if (filters.maxAmount && payout.amount > Number(filters.maxAmount)) return false;
    return true;
  });

  const totalFilteredAmount = filteredPayouts.reduce((sum, payout) => sum + payout.amount, 0);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50"><div className="flex"><div className="w-64 bg-white shadow-lg"><div className="p-4"><h2 className="text-lg font-semibold">Rent360 Admin</h2></div></div><div className="flex-1"><div className="p-6"> 
      <DashboardHeader
        
        title="Payouts de Proveedores"
        subtitle="Administra los pagos automáticos a proveedores de mantenimiento y servicios"
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Proveedores Activos</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalProviders}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {stats.maintenanceProviders} mant. + {stats.serviceProviders} serv.
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Pagado</p>
                    <p className="text-2xl font-bold text-green-900">{formatPrice(stats.totalPaid)}</p>
                    <p className="text-xs text-green-600 mt-1">
                      Promedio: {formatPrice(stats.averagePerProvider)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700">Payouts Pendientes</p>
                    <p className="text-2xl font-bold text-yellow-900">{payouts.length}</p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Monto total: {formatPrice(totalFilteredAmount)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Procesados Hoy</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.totalPending}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      Esperando aprobación
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros y Acciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Proveedor
                </label>
                <Select
                  value={filters.providerType}
                  onValueChange={(value) => setFilters({...filters, providerType: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="maintenance_provider">Mantenimiento</SelectItem>
                    <SelectItem value="service_provider">Servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Mínimo
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Máximo
                </label>
                <Input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={calculatePayouts} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Calcular Payouts
              </Button>

              <Button variant="outline" onClick={loadPayouts} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>

              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payouts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Payouts Pendientes ({filteredPayouts.length})
            </CardTitle>
            <CardDescription>
              Lista de payouts pendientes de aprobación para proveedores
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPayouts.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay payouts pendientes
                </h3>
                <p className="text-gray-600 mb-4">
                  Todos los payouts han sido procesados o no hay proveedores elegibles.
                </p>
                <Button onClick={calculatePayouts}>
                  Calcular Payouts
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Trabajos</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Monto Bruto</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Monto Neto</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((payout) => (
                      <TableRow key={payout.recipientId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{payout.providerDetails.businessName}</div>
                            <div className="text-sm text-gray-600">
                              {payout.providerDetails.specialty || payout.providerDetails.serviceType}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getProviderTypeColor(payout.recipientType)}>
                            {getProviderTypeIcon(payout.recipientType)}
                            <span className="ml-1">{getProviderTypeLabel(payout.recipientType)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {payout.jobs.length} trabajo{payout.jobs.length !== 1 ? 's' : ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(payout.period.startDate)} - {formatDate(payout.period.endDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(payout.breakdown.grossAmount)}
                        </TableCell>
                        <TableCell className="text-red-600">
                          -{formatPrice(payout.breakdown.commission)}
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          {formatPrice(payout.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPayout(payout)}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Detalles del Payout</DialogTitle>
                                  <DialogDescription>
                                    Información completa del payout para {payout.providerDetails.businessName}
                                  </DialogDescription>
                                </DialogHeader>

                                {selectedPayout && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Información del Proveedor</h4>
                                        <p><strong>Nombre:</strong> {selectedPayout.providerDetails.businessName}</p>
                                        <p><strong>Tipo:</strong> {getProviderTypeLabel(selectedPayout.recipientType)}</p>
                                        <p><strong>Especialidad:</strong> {selectedPayout.providerDetails.specialty || selectedPayout.providerDetails.serviceType}</p>
                                        <p><strong>Registro:</strong> {formatDate(selectedPayout.providerDetails.registrationDate)}</p>
                                      </div>

                                      <div>
                                        <h4 className="font-medium mb-2">Desglose Financiero</h4>
                                        <p><strong>Monto Bruto:</strong> {formatPrice(selectedPayout.breakdown.grossAmount)}</p>
                                        <p><strong>Comisión:</strong> {formatPrice(selectedPayout.breakdown.commission)}</p>
                                        <p><strong>Ajuste Período Gracia:</strong> {formatPrice(selectedPayout.breakdown.gracePeriodAdjustment)}</p>
                                        <p><strong>Monto Neto:</strong> {formatPrice(selectedPayout.amount)}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-2">Trabajos Realizados ({selectedPayout.jobs.length})</h4>
                                      <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedPayout.jobs.map((job, index) => (
                                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                            <div>
                                              <p className="text-sm font-medium">{job.clientName}</p>
                                              <p className="text-xs text-gray-600">{formatDate(job.date)}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">{formatPrice(job.amount)}</p>
                                              <p className="text-xs text-gray-600 capitalize">{job.type}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-4 border-t">
                                      <Button
                                        onClick={() => approvePayout(selectedPayout)}
                                        disabled={processingPayout === selectedPayout.recipientId}
                                        className="flex items-center gap-2"
                                      >
                                        {processingPayout === selectedPayout.recipientId ? (
                                          <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            Procesando...
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle className="w-4 h-4" />
                                            Aprobar Payout
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              onClick={() => approvePayout(payout)}
                              disabled={processingPayout === payout.recipientId}
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              {processingPayout === payout.recipientId ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Procesando...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Aprobar
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}
