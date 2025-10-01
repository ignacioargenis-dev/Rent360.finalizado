'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Bell,
  Info } from 'lucide-react';
import { Payment } from '@/types';

interface UpcomingPayment {
  id: string;
  paymentNumber: string;
  contractId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: string;
  method?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  contract?: {
    id: string;
    contractNumber: string;
    property?: {
      id: string;
      title: string;
      address: string;
    };
  };
  propertyName: string;
  propertyAddress: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export default function TenantUpcomingPaymentsPage() {

  const [payments, setPayments] = useState<UpcomingPayment[]>([]);

  const [loading, setLoading] = useState(true);

  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  useEffect(() => {
    fetchPayments();
    fetchPaymentMethods();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments?upcoming=true');
      if (response.ok) {
        const data = await response.json();
        const upcomingPayments = data.payments.map((payment: Payment & { contract?: { id: string; contractNumber: string; property?: { id: string; title: string; address: string; }; }; }) => ({
          ...payment,
          propertyName: payment.contract?.property?.title || 'N/A',
          propertyAddress: payment.contract?.property?.address || 'N/A',
          daysUntilDue: Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
          isOverdue: new Date(payment.dueDate) < new Date(),
        }));
        setPayments(upcomingPayments);
      }
    } catch (error) {
      logger.error('Error fetching payments:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      // Simular métodos de pago
      setPaymentMethods([
        { id: '1', type: 'credit_card', last4: '4242', brand: 'Visa', isDefault: true },
        { id: '2', type: 'bank_transfer', bank: 'Banco de Chile', accountType: 'Cuenta Corriente', isDefault: false },
      ]);
    } catch (error) {
      logger.error('Error fetching payment methods:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handlePayNow = async (paymentId: string) => {
    try {
      // Redirigir a página de pago
      window.open(`/tenant/payments/${paymentId}/pay`, '_blank');
    } catch (error) {
      logger.error('Error processing payment:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleSetupReminder = async (paymentId: string) => {
    try {
      alert('Recordatorio configurado exitosamente');
    } catch (error) {
      logger.error('Error setting reminder:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const getPaymentStatus = (payment: UpcomingPayment) => {
    if (payment.status === 'COMPLETED') {
      return { badge: <Badge variant="secondary">Pagado</Badge>, color: 'text-green-600' };
    } else if (payment.isOverdue) {
      return { badge: <Badge variant="destructive">Vencido</Badge>, color: 'text-red-600' };
    } else if (payment.daysUntilDue <= 3) {
      return { badge: <Badge variant="destructive">Urgente</Badge>, color: 'text-red-600' };
    } else if (payment.daysUntilDue <= 7) {
      return { badge: <Badge variant="default">Próximo</Badge>, color: 'text-yellow-600' };
    } else {
      return { badge: <Badge variant="outline">Pendiente</Badge>, color: 'text-blue-600' };
    }
  };

  const exportPaymentSchedule = () => {
    const headers = ['ID Pago', 'Propiedad', 'Monto', 'Fecha Vencimiento', 'Estado', 'Días Restantes'];
    const csvContent = [
      headers.join(','),
      ...payments.map(payment => [
        payment.paymentNumber,
        payment.propertyName,
        payment.amount,
        new Date(payment.dueDate).toLocaleDateString(),
        payment.status,
        payment.daysUntilDue,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'calendario_pagos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Próximos Pagos" subtitle="Gestiona tus pagos próximos y vencidos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout
    );
  }

  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = payments.filter(p => p.isOverdue && p.status === 'PENDING');
  const urgentPayments = payments.filter(p => p.daysUntilDue <= 3 && p.status === 'PENDING');

  return (
    <DashboardLayout title="Próximos Pagos" subtitle="Gestiona tus pagos próximos y vencidos">
      <div className="space-y-6">
        {/* Alertas */}
        {overduePayments.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Tienes {overduePayments.length} pago{overduePayments.length > 1 ? 's' : ''} vencido{overduePayments.length > 1 ? 's' : ''} por un total de ${overduePayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}. 
              Por favor realiza el pago lo antes posible para evitar recargos.
            </AlertDescription>
          </Alert>
        )}

        {urgentPayments.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Tienes {urgentPayments.length} pago{urgentPayments.length > 1 ? 's' : ''} próximo{urgentPayments.length > 1 ? 's' : ''} a vencer en los próximos 3 días.
            </AlertDescription>
          </Alert>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {payments.filter(p => p.status === 'PENDING').length} pagos pendientes
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {overduePayments.length}
              </div>
              <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Métodos de Pago</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentMethods.length}</div>
              <p className="text-xs text-muted-foreground">
                {paymentMethods.filter(m => m.isDefault).length} predeterminados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Gestiona tus pagos y métodos de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Button onClick={() => window.open('/tenant/payments/methods', '_blank')}>
                <CreditCard className="w-4 h-4 mr-2" />
                Agregar Método de Pago
              </Button>
              <Button variant="outline" onClick={exportPaymentSchedule}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Calendario
              </Button>
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Configurar Recordatorios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Métodos de Pago Guardados */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de Pago Guardados</CardTitle>
            <CardDescription>
              Administra tus métodos de pago para transacciones rápidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {method.type === 'credit_card' ? `${method.brand} ****${method.last4}` : method.bank}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.type === 'credit_card' ? 'Tarjeta de crédito' : `${method.accountType}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {method.isDefault && <Badge variant="default">Predeterminado</Badge>}
                    <Button variant="outline" size="sm">Editar</Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-gray-600">Agregar nuevo método</div>
                  <div className="text-xs text-gray-500">Guarda tus tarjetas para pagos rápidos</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendario de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Calendario de Pagos</CardTitle>
            <CardDescription>
              Próximos pagos y fechas de vencimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Días Restantes</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const status = getPaymentStatus(payment);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.propertyName}</div>
                          <div className="text-sm text-gray-500">{payment.propertyAddress}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>{new Date(payment.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{status.badge}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${status.color}`}>
                          {payment.isOverdue 
                            ? `${Math.abs(payment.daysUntilDue)} días vencido` 
                            : `${payment.daysUntilDue} días`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handlePayNow(payment.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Pagar Ahora
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetupReminder(payment.id)}
                              >
                                <Bell className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {payment.status === 'COMPLETED' && (
                            <Badge variant="secondary" className="px-3 py-1">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pagado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {payments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tienes pagos programados
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información de Ayuda */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Consejo:</strong> Configura recordatorios automáticos para nunca olvidar un pago. 
            Puedes agregar múltiples métodos de pago y elegir cuál usar en cada transacción.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout
  );
}
