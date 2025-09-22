'use client';

import { logger } from '@/lib/logger';
import { 
  Filter, 
  Search, 
  Download, 
  CreditCard, 
  AlertTriangle, 
  Eye 
} from 'lucide-react';

import { useState, useEffect } from 'react';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Payment } from '@/types';

export default function AdminPendingPaymentsPage() {

  const [payments, setPayments] = useState<Payment[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [daysFilter, setDaysFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments?status=PENDING');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      }
    } catch (error) {
      logger.error('Error fetching payments:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = searchTerm === '' || 
                         (payment.paymentNumber && payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    let matchesDays = true;
    if (daysFilter !== 'all') {
      const days = parseInt(daysFilter);
      const dueDate = new Date(payment.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (daysFilter === 'overdue') {
        matchesDays = diffDays < 0;
      } else {
        matchesDays = diffDays <= days && diffDays >= 0;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDays;
  });

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentStatusBadge = (payment: Payment) => {
    const daysUntilDue = getDaysUntilDue(payment.dueDate);
    
    if (payment.status === 'COMPLETED') {
      return <Badge variant="secondary">Pagado</Badge>;
    } else if (daysUntilDue < 0) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge variant="destructive">Urgente</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge variant="default">Próximo</Badge>;
    } else {
      return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const handleSendReminder = async (paymentId: string) => {
    try {
      // Simular envío de recordatorio
      alert('Recordatorio enviado exitosamente');
    } catch (error) {
      logger.error('Error sending reminder:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Propiedad', 'Inquilino', 'Monto', 'Fecha Vencimiento', 'Estado', 'Días Restantes'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        payment.paymentNumber,
        payment.paymentNumber || '',
        payment.paymentNumber || '',
        payment.amount,
        new Date(payment.dueDate).toLocaleDateString(),
        payment.status,
        getDaysUntilDue(payment.dueDate),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'pagos_pendientes.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <EnhancedDashboardLayout title="Pagos Pendientes" subtitle="Gestiona pagos pendientes y vencidos">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </EnhancedDashboardLayout>
    );
  }

  const totalPending = filteredPayments.reduce((sum, p) => p.status === 'PENDING' ? sum + p.amount : sum, 0);
  const overduePayments = filteredPayments.filter(p => getDaysUntilDue(p.dueDate) < 0);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <EnhancedDashboardLayout title="Pagos Pendientes" subtitle="Gestiona pagos pendientes y vencidos">
      <div className="space-y-6">
        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por propiedad o inquilino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="FAILED">Fallido</SelectItem>
                  <SelectItem value="PARTIAL">Parcial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={daysFilter} onValueChange={setDaysFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="3">Próximos 3 días</SelectItem>
                  <SelectItem value="7">Próximos 7 días</SelectItem>
                  <SelectItem value="30">Próximos 30 días</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendiente</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPending.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {filteredPayments.filter(p => p.status === 'PENDING').length} pagos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${totalOverdue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {overduePayments.length} pagos vencidos
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos 7 días</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                ${filteredPayments.filter(p => {
                  const days = getDaysUntilDue(p.dueDate);
                  return days >= 0 && days <= 7 && p.status === 'PENDING';
                }).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Por vencer esta semana</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {payments.length > 0 
                  ? Math.round((payments.filter(p => p.status === 'COMPLETED').length / payments.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Pagos completados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de Pagos */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Pendientes</CardTitle>
            <CardDescription>
              Lista de pagos pendientes de cobro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pago</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Fecha Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Días Restantes</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const daysUntilDue = getDaysUntilDue(payment.dueDate);
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.paymentNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Propiedad #{payment.contractId}</div>
                          <div className="text-sm text-gray-500">
                            ID Contrato: {payment.contractId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">Usuario #{payment.payerId || 'N/A'}</div>
                          <div className="text-sm text-gray-500">
                            ID Pagador: {payment.payerId || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(payment)}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          daysUntilDue < 0 
                            ? 'text-red-600' 
                            : daysUntilDue <= 3 
                              ? 'text-yellow-600' 
                              : 'text-green-600'
                        }`}>
                          {daysUntilDue < 0 
                            ? `${Math.abs(daysUntilDue)} días vencido` 
                            : `${daysUntilDue} días`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/admin/payments/${payment.id}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {payment.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendReminder(payment.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Recordar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron pagos pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
