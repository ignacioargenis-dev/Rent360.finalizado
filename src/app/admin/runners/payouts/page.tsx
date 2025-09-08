'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, Users, TrendingUp, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

interface RunnerPayout {
  recipientId: string;
  recipientType: 'runner';
  amount: number;
  currency: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    commissions: number;
    fees: number;
    taxes: number;
    netAmount: number;
  };
  items: PayoutItem[];
}

interface PayoutItem {
  type: 'commission' | 'rental_income' | 'fee_refund';
  referenceId: string;
  amount: number;
  description: string;
  date: Date;
}

interface RunnerPayoutStats {
  totalRunners: number;
  totalPaid: number;
  totalPending: number;
  averagePerRunner: number;
  topEarners: any[];
}

export default function RunnerPayoutsAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<RunnerPayout[]>([]);
  const [stats, setStats] = useState<RunnerPayoutStats | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  useEffect(() => {
    loadUser();
    loadPayouts();
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
      const response = await fetch(`/api/admin/runners/payouts?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data.payouts);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayouts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/runners/payouts/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.data);
        alert(`Se calcularon ${data.data.length} payouts pendientes`);
      }
    } catch (error) {
      console.error('Error calculating payouts:', error);
      alert('Error calculando payouts');
    } finally {
      setLoading(false);
    }
  };

  const approvePayout = async (payout: RunnerPayout) => {
    // Por simplicidad, usaremos el primer item como referencia para el transactionId
    const transactionId = `temp_${payout.recipientId}_${Date.now()}`;

    try {
      setProcessing(transactionId);
      const response = await fetch(`/api/admin/runners/payouts/${transactionId}/approve`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert('Payout aprobado exitosamente');

        // Recargar la lista
        await loadPayouts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error approving payout:', error);
      alert('Error aprobando payout');
    } finally {
      setProcessing(null);
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
    <EnhancedDashboardLayout title="Pagos de Runners" subtitle="Gestión de pagos a runners">
      <DashboardHeader
        user={user}
        title="Pagos de Runners"
        subtitle="Gestiona y aprueba pagos a runners"
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatPrice(stats?.totalPaid || 0)}
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
                  <p className="text-sm font-medium text-yellow-700">Pendiente de Pago</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats?.totalPending || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Runners</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats?.totalRunners || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Promedio por Runner</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatPrice(stats?.averagePerRunner || 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Cálculo de Pagos
            </CardTitle>
            <CardDescription>
              Calcula y gestiona los pagos pendientes de runners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha Fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="approved">Aprobados</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={calculatePayouts} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Calcular
                </Button>
                <Button variant="outline" onClick={loadPayouts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payouts List */}
        <div className="space-y-4">
          {payouts.map((payout, index) => (
            <Card key={`${payout.recipientId}-${index}`} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Runner ID: {payout.recipientId}
                        </h3>
                        <p className="text-gray-600 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Período: {formatDate(payout.period.startDate)} - {formatDate(payout.period.endDate)}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Pendiente de Aprobación
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Ganancia Bruta</p>
                        <p className="font-semibold text-gray-900">{formatPrice(payout.breakdown.commissions)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Comisión Plataforma</p>
                        <p className="font-semibold text-red-600">-{formatPrice(payout.breakdown.fees)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monto a Pagar</p>
                        <p className="font-semibold text-green-600">{formatPrice(payout.breakdown.netAmount)}</p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <p><strong>Visitas completadas:</strong> {payout.items.length}</p>
                      <p><strong>Promedio por visita:</strong> {formatPrice(payout.breakdown.commissions / payout.items.length)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                    <Button
                      size="sm"
                      onClick={() => approvePayout(payout)}
                      disabled={processing === `temp_${payout.recipientId}_${Date.now()}`}
                      className="flex-1"
                    >
                      {processing === `temp_${payout.recipientId}_${Date.now()}` ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprobar Pago
                        </>
                      )}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {payouts.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay payouts pendientes
                </h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'pending'
                    ? 'No hay payouts pendientes de aprobación.'
                    : 'No hay payouts en el estado seleccionado.'
                  }
                </p>
                <Button onClick={calculatePayouts} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Calcular Payouts
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </EnhancedDashboardLayout>
  );
}
