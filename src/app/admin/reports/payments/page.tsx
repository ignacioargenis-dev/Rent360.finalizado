'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  Filter,
  RefreshCw,
  DollarSign,
  TrendingUp,
  CreditCard,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  pendingPayments: number;
  completedPayments: number;
  failedPayments: number;
  monthlyGrowth: number;
}

interface PaymentRecord {
  id: string;
  type: 'provider' | 'owner' | 'broker';
  recipientName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentMethod: string;
  paymentDate: string;
  description: string;
  reference: string;
}

export default function PaymentsReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [paymentType, setPaymentType] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalPayments: 0,
    totalAmount: 0,
    pendingPayments: 0,
    completedPayments: 0,
    failedPayments: 0,
    monthlyGrowth: 0,
  });
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Mock data for payments
  const mockPayments: PaymentRecord[] = [
    {
      id: '1',
      type: 'provider',
      recipientName: 'Servicios Eléctricos Ltda',
      amount: 250000,
      currency: 'CLP',
      status: 'completed',
      paymentMethod: 'transfer',
      paymentDate: '2024-12-01',
      description: 'Mantenimiento eléctrico departamento Av. Providencia 123',
      reference: 'ORD-2024-001',
    },
    {
      id: '2',
      type: 'owner',
      recipientName: 'María González',
      amount: 800000,
      currency: 'CLP',
      status: 'completed',
      paymentMethod: 'transfer',
      paymentDate: '2024-12-02',
      description: 'Pago mensual alquiler + depósito garantía',
      reference: 'CONT-2024-045',
    },
    {
      id: '3',
      type: 'broker',
      recipientName: 'Juan Pérez',
      amount: 120000,
      currency: 'CLP',
      status: 'pending',
      paymentMethod: 'transfer',
      paymentDate: '2024-12-03',
      description: 'Comisión venta propiedad Las Condes 456',
      reference: 'COMM-2024-012',
    },
    {
      id: '4',
      type: 'provider',
      recipientName: 'Fontanería Express',
      amount: 180000,
      currency: 'CLP',
      status: 'completed',
      paymentMethod: 'card',
      paymentDate: '2024-12-04',
      description: 'Reparación grifería baño principal',
      reference: 'ORD-2024-003',
    },
    {
      id: '5',
      type: 'owner',
      recipientName: 'Carlos Rodríguez',
      amount: 650000,
      currency: 'CLP',
      status: 'processing',
      paymentMethod: 'transfer',
      paymentDate: '2024-12-05',
      description: 'Pago mensual alquiler departamento Ñuñoa',
      reference: 'CONT-2024-067',
    },
  ];

  useEffect(() => {
    loadPaymentsData();
  }, [dateRange, paymentType, statusFilter]);

  const loadPaymentsData = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Filter payments based on criteria
      let filteredPayments = mockPayments;

      if (paymentType !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.type === paymentType);
      }

      if (statusFilter !== 'all') {
        filteredPayments = filteredPayments.filter(p => p.status === statusFilter);
      }

      // Filter by date range
      if (dateRange.startDate && dateRange.endDate) {
        filteredPayments = filteredPayments.filter(
          p => p.paymentDate >= dateRange.startDate! && p.paymentDate <= dateRange.endDate!
        );
      }

      setPayments(filteredPayments);

      // Calculate summary
      const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingPayments = filteredPayments.filter(p => p.status === 'pending').length;
      const completedPayments = filteredPayments.filter(p => p.status === 'completed').length;
      const failedPayments = filteredPayments.filter(p => p.status === 'failed').length;

      setSummary({
        totalPayments: filteredPayments.length,
        totalAmount,
        pendingPayments,
        completedPayments,
        failedPayments,
        monthlyGrowth: 12.5, // Mock growth percentage
      });
    } catch (error) {
      logger.error('Error al cargar datos de pagos', { error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      [
        'ID',
        'Tipo',
        'Destinatario',
        'Monto',
        'Moneda',
        'Estado',
        'Método',
        'Fecha',
        'Descripción',
        'Referencia',
      ],
      ...payments.map(payment => [
        payment.id,
        payment.type === 'provider'
          ? 'Proveedor'
          : payment.type === 'owner'
            ? 'Propietario'
            : 'Corredor',
        payment.recipientName,
        payment.amount.toLocaleString(),
        payment.currency,
        payment.status === 'pending'
          ? 'Pendiente'
          : payment.status === 'processing'
            ? 'Procesando'
            : payment.status === 'completed'
              ? 'Completado'
              : 'Fallido',
        payment.paymentMethod === 'transfer'
          ? 'Transferencia'
          : payment.paymentMethod === 'card'
            ? 'Tarjeta'
            : payment.paymentMethod === 'cash'
              ? 'Efectivo'
              : 'Cheque',
        payment.paymentDate,
        payment.description,
        payment.reference,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-pagos-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logger.info('Reporte de pagos exportado', { totalRecords: payments.length });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'processing':
        return <Badge variant="outline">Procesando</Badge>;
      case 'completed':
        return <Badge variant="default">Completado</Badge>;
      case 'failed':
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'provider':
        return 'Proveedor';
      case 'owner':
        return 'Propietario';
      case 'broker':
        return 'Corredor';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency === 'CLP' ? 'CLP' : 'USD',
    }).format(amount);
  };

  return (
    <UnifiedDashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes de Pagos</h1>
            <p className="text-gray-600">Análisis completo de todos los pagos del sistema</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadPaymentsData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button onClick={handleExportReport} disabled={payments.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="startDate">Fecha Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateRange.startDate}
                  onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Fecha Fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateRange.endDate}
                  onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="paymentType">Tipo de Pago</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="provider">Proveedores</SelectItem>
                    <SelectItem value="owner">Propietarios</SelectItem>
                    <SelectItem value="broker">Corredores</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="statusFilter">Estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="breakdown">Desglose por Tipo</TabsTrigger>
            <TabsTrigger value="details">Detalles de Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                      <p className="text-2xl font-bold text-gray-900">{summary.totalPayments}</p>
                    </div>
                    <CreditCard className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Monto Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary.totalAmount, 'CLP')}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pagos Completados</p>
                      <p className="text-2xl font-bold text-green-600">
                        {summary.completedPayments}
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
                      <p className="text-sm font-medium text-gray-600">Crecimiento Mensual</p>
                      <p className="text-2xl font-bold text-blue-600">+{summary.monthlyGrowth}%</p>
                    </div>
                    <BarChart3 className="w-12 h-12 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Estados */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm">Completados</span>
                    </div>
                    <span className="font-semibold">{summary.completedPayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                      <span className="text-sm">Pendientes</span>
                    </div>
                    <span className="font-semibold">{summary.pendingPayments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm">Procesando</span>
                    </div>
                    <span className="font-semibold">
                      {payments.filter(p => p.status === 'processing').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded"></div>
                      <span className="text-sm">Fallidos</span>
                    </div>
                    <span className="font-semibold">{summary.failedPayments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdown" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pagos a Proveedores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Proveedores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cantidad</span>
                      <span className="font-semibold">
                        {payments.filter(p => p.type === 'provider').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monto Total</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'provider')
                            .reduce((sum, p) => sum + p.amount, 0),
                          'CLP'
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(payments.filter(p => p.type === 'provider').length / payments.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pagos a Propietarios */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Propietarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cantidad</span>
                      <span className="font-semibold">
                        {payments.filter(p => p.type === 'owner').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monto Total</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'owner')
                            .reduce((sum, p) => sum + p.amount, 0),
                          'CLP'
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(payments.filter(p => p.type === 'owner').length / payments.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pagos a Corredores */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Corredores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cantidad</span>
                      <span className="font-semibold">
                        {payments.filter(p => p.type === 'broker').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monto Total</span>
                      <span className="font-semibold">
                        {formatCurrency(
                          payments
                            .filter(p => p.type === 'broker')
                            .reduce((sum, p) => sum + p.amount, 0),
                          'CLP'
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${(payments.filter(p => p.type === 'broker').length / payments.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Pagos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                    Cargando datos...
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No se encontraron pagos para los filtros seleccionados
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Destinatario</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Referencia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              <Badge variant="outline">{getTypeLabel(payment.type)}</Badge>
                            </TableCell>
                            <TableCell className="font-medium">{payment.recipientName}</TableCell>
                            <TableCell>
                              {formatCurrency(payment.amount, payment.currency)}
                            </TableCell>
                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                            <TableCell>
                              {payment.paymentMethod === 'transfer'
                                ? 'Transferencia'
                                : payment.paymentMethod === 'card'
                                  ? 'Tarjeta'
                                  : payment.paymentMethod === 'cash'
                                    ? 'Efectivo'
                                    : 'Cheque'}
                            </TableCell>
                            <TableCell>
                              {new Date(payment.paymentDate).toLocaleDateString('es-CL')}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {payment.reference}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UnifiedDashboardLayout>
  );
}
