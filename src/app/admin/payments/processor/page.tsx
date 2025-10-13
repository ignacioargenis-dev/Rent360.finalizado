'use client';

// Forzar renderizado dinámico para evitar prerendering de páginas protegidas
export const dynamic = 'force-dynamic';


import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Banknote,
  Building2,
  Smartphone,
  RefreshCw,
  Play,
  Pause,
  Square,
  Settings,
  TrendingUp,
  Users,
  Calendar,
  Shield,
  Zap,
} from 'lucide-react';

import { logger } from '@/lib/logger-minimal';

interface PaymentTransaction {
  id: string;
  type: 'runner_payout' | 'provider_payout' | 'service_payment' | 'commission';
  recipientId: string;
  recipientName: string;
  recipientType: 'runner' | 'maintenance_provider' | 'service_provider';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  bankCode: string;
  bankAccount: string;
  description: string;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
  referenceId?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface PaymentBatch {
  id: string;
  name: string;
  type: 'runners' | 'providers' | 'commissions';
  totalAmount: number;
  transactionCount: number;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  bankCode: string;
}

interface BankIntegration {
  code: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  balance?: number;
  lastSync?: Date;
  supported: boolean;
}

export default function PaymentProcessorPage() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [batches, setBatches] = useState<PaymentBatch[]>([]);
  const [bankIntegrations, setBankIntegrations] = useState<BankIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBank, setSelectedBank] = useState('banco_estado');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Obtener informaci�n del usuario
      const userResponse = await fetch('/api/auth/me');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }

      // Obtener transacciones pendientes
      const transactionsResponse = await fetch('/api/admin/payments/transactions?status=pending');
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData.transactions);
      }

      // Obtener lotes de pago
      const batchesResponse = await fetch('/api/admin/payments/batches');
      if (batchesResponse.ok) {
        const batchesData = await batchesResponse.json();
        setBatches(batchesData.batches);
      }

      // Obtener integraciones bancarias
      const banksResponse = await fetch('/api/admin/banks/integrations');
      if (banksResponse.ok) {
        const banksData = await banksResponse.json();
        setBankIntegrations(banksData.integrations);
      }
    } catch (error) {
      logger.error('Error cargando datos de pagos:', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (transactionId: string) => {
    try {
      setProcessing(true);

      const response = await fetch(`/api/admin/payments/process/${transactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankCode: selectedBank,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage('Pago procesado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        await loadData();
      } else {
        const error = await response.json();
        setErrorMessage(`Error al procesar pago: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error procesando pago:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al procesar el pago. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessBatch = async (batchId: string) => {
    try {
      setProcessing(true);

      const response = await fetch(`/api/admin/payments/batches/${batchId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bankCode: selectedBank,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Lote procesado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        await loadData();
      } else {
        const error = await response.json();
        setErrorMessage(`Error al procesar lote: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error procesando lote:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al procesar el lote. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateBatch = async (type: 'runners' | 'providers' | 'commissions') => {
    try {
      const response = await fetch('/api/admin/payments/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          bankCode: selectedBank,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Lote creado exitosamente');
        setTimeout(() => setSuccessMessage(''), 3000);
        await loadData();
      } else {
        const error = await response.json();
        setErrorMessage(`Error al crear lote: ${error.message}`);
        setTimeout(() => setErrorMessage(''), 5000);
      }
    } catch (error) {
      logger.error('Error creando lote:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setErrorMessage('Error al crear el lote. Por favor, inténtalo nuevamente.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Procesando', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completado', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Fallido', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      case 'normal':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'runner_payout':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'provider_payout':
        return <Building2 className="w-4 h-4 text-green-600" />;
      case 'service_payment':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'commission':
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const typeMap = {
      runner_payout: 'Pago a Runner',
      provider_payout: 'Pago a Proveedor',
      service_payment: 'Pago de Servicio',
      commission: 'Comisi�n',
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const filteredTransactions = transactions.filter(transaction => {
    switch (activeTab) {
      case 'pending':
        return transaction.status === 'pending';
      case 'processing':
        return transaction.status === 'processing';
      case 'completed':
        return transaction.status === 'completed';
      case 'failed':
        return transaction.status === 'failed';
      default:
        return true;
    }
  });

  const getTotalAmount = (transactions: PaymentTransaction[]) => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando procesador de pagos...</p>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Procesador de Pagos"
      subtitle="Gestiona pagos autom�ticos y transferencias bancarias"
    >
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Success Message */}
        {successMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
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
          <Card className="mb-6 border-red-200 bg-red-50">
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

        {/* Estad�sticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {transactions.filter(t => t.status === 'pending').length}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    $
                    {getTotalAmount(
                      transactions.filter(t => t.status === 'pending')
                    ).toLocaleString('es-CL')}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Procesando</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {transactions.filter(t => t.status === 'processing').length}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    $
                    {getTotalAmount(
                      transactions.filter(t => t.status === 'processing')
                    ).toLocaleString('es-CL')}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Completados Hoy</p>
                  <p className="text-2xl font-bold text-green-900">
                    {
                      transactions.filter(
                        t =>
                          t.status === 'completed' &&
                          new Date(t.processedAt || '').toDateString() === new Date().toDateString()
                      ).length
                    }
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    $
                    {getTotalAmount(
                      transactions.filter(
                        t =>
                          t.status === 'completed' &&
                          new Date(t.processedAt || '').toDateString() === new Date().toDateString()
                      )
                    ).toLocaleString('es-CL')}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Fallidos</p>
                  <p className="text-2xl font-bold text-red-900">
                    {transactions.filter(t => t.status === 'failed').length}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    $
                    {getTotalAmount(transactions.filter(t => t.status === 'failed')).toLocaleString(
                      'es-CL'
                    )}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integraciones Bancarias */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Integraciones Bancarias
            </CardTitle>
            <CardDescription>
              Estado de las conexiones bancarias para procesamiento de pagos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Banco seleccionado:</label>
                <Select value={selectedBank} onValueChange={setSelectedBank}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bankIntegrations
                      .filter(bank => bank.supported)
                      .map(bank => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankIntegrations.map(bank => (
                <div
                  key={bank.code}
                  className={`p-4 border rounded-lg ${
                    bank.code === selectedBank ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{bank.name}</h4>
                    <Badge
                      className={
                        bank.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : bank.status === 'inactive'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                      }
                    >
                      {bank.status === 'active'
                        ? 'Activo'
                        : bank.status === 'inactive'
                          ? 'Inactivo'
                          : 'Error'}
                    </Badge>
                  </div>

                  {bank.balance !== undefined && (
                    <div className="text-sm text-gray-600">
                      Saldo: ${bank.balance.toLocaleString('es-CL')}
                    </div>
                  )}

                  {bank.lastSync && (
                    <div className="text-xs text-gray-500 mt-1">
                      �ltima sync: {new Date(bank.lastSync).toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lotes de Pago */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5" />
              Lotes de Pago
            </CardTitle>
            <CardDescription>Crea y gestiona lotes de pagos masivos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-6">
              <Button onClick={() => handleCreateBatch('runners')}>
                <Users className="w-4 h-4 mr-2" />
                Crear Lote Runners
              </Button>
              <Button onClick={() => handleCreateBatch('providers')}>
                <Building2 className="w-4 h-4 mr-2" />
                Crear Lote Proveedores
              </Button>
              <Button onClick={() => handleCreateBatch('commissions')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Crear Lote Comisiones
              </Button>
            </div>

            <div className="space-y-4">
              {batches.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No hay lotes de pago creados</p>
                </div>
              ) : (
                batches.map(batch => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Banknote className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{batch.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{batch.transactionCount} transacciones</span>
                          <span>${batch.totalAmount.toLocaleString('es-CL')}</span>
                          <span>{new Date(batch.createdAt).toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(batch.status)}
                      {batch.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => handleProcessBatch(batch.id)}
                          disabled={processing}
                        >
                          {processing ? (
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 mr-1" />
                          )}
                          Procesar
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Transacciones */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending">
              Pendientes ({transactions.filter(t => t.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="processing">
              Procesando ({transactions.filter(t => t.status === 'processing').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completados ({transactions.filter(t => t.status === 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="failed">
              Fallidos ({transactions.filter(t => t.status === 'failed').length})
            </TabsTrigger>
            <TabsTrigger value="all">Todas ({transactions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay transacciones
                    </h3>
                    <p className="text-gray-600">
                      No se encontraron transacciones en esta categor�a.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTransactions.map(transaction => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getTypeIcon(transaction.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {getTypeLabel(transaction.type)}
                            </h3>
                            {getStatusBadge(transaction.status)}
                            {getPriorityIcon(transaction.priority)}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{transaction.recipientName}</span>
                            <span>�</span>
                            <span>{transaction.description}</span>
                            <span>�</span>
                            <span>
                              {new Date(transaction.createdAt).toLocaleDateString('es-CL')}
                            </span>
                          </div>

                          {transaction.failureReason && (
                            <div className="text-sm text-red-600 mt-1">
                              Error: {transaction.failureReason}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">
                            ${transaction.amount.toLocaleString('es-CL')}
                          </div>
                          <div className="text-sm text-gray-600">{transaction.currency}</div>
                        </div>

                        {transaction.status === 'pending' && (
                          <Button
                            onClick={() => handleProcessPayment(transaction.id)}
                            disabled={processing}
                            size="sm"
                          >
                            {processing ? (
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4 mr-1" />
                            )}
                            Procesar
                          </Button>
                        )}

                        {transaction.status === 'completed' && transaction.processedAt && (
                          <div className="text-xs text-gray-500">
                            Procesado: {new Date(transaction.processedAt).toLocaleString('es-CL')}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Configuraci�n R�pida */}
        <Card className="mt-6 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Settings className="w-6 h-6 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Configuraci�n del Procesador</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    � Procesamiento autom�tico: Los pagos se procesan seg�n la prioridad y
                    disponibilidad bancaria
                  </p>
                  <p>
                    � L�mite diario: Se respeta el l�mite de transacciones por d�a de cada banco
                  </p>
                  <p>
                    � Reintentos: Los pagos fallidos se reintentan autom�ticamente hasta 3 veces
                  </p>
                  <p>
                    � Notificaciones: Se env�an notificaciones push y email en cada cambio de estado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
