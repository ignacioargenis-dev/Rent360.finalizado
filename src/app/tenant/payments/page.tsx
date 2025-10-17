'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  AlertTriangle,
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  Info,
  Plus,
  Filter,
  Download,
  BarChart3,
  Settings,
  Search,
  Eye,
  CreditCard,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';

interface Payment {
  id: string;
  propertyTitle: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  invoiceNumber?: string;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  thisMonthPaid: number;
}

export default function TenantPaymentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    thisMonthPaid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // For development, set a mock user
          setUser({
            id: '1',
            name: 'Juan Pérez',
            email: 'juan.perez@example.com',
            role: 'tenant',
          });
        }
      } catch (error) {
        // For development, set a mock user
        setUser({
          id: '1',
          name: 'Juan Pérez',
          email: 'juan.perez@example.com',
          role: 'tenant',
        });
      } finally {
        setUserLoading(false);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/list?limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los pagos');
      }

      const data = await response.json();

      // Transformar los datos de la API al formato esperado por el componente
      const transformedPayments: Payment[] = data.payments.map((payment: any) => ({
        id: payment.id,
        propertyTitle: payment.contract.property.title,
        amount: payment.amount,
        dueDate: payment.dueDate.split('T')[0], // Convertir a formato YYYY-MM-DD
        paymentDate: payment.paidDate ? payment.paidDate.split('T')[0] : undefined,
        status: payment.status.toLowerCase(),
        method: payment.method.toLowerCase(),
        invoiceNumber: payment.paymentNumber,
      }));

      // Calcular estadísticas reales
      const totalPaid = transformedPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalPending = transformedPayments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalOverdue = transformedPayments
        .filter(p => p.status === 'pending' && new Date(p.dueDate) < new Date())
        .reduce((sum, p) => sum + p.amount, 0);

      const thisMonthPaid = transformedPayments
        .filter(p => {
          if (p.status !== 'paid' || !p.paymentDate) {
            return false;
          }
          const paidDate = new Date(p.paymentDate);
          const now = new Date();
          return (
            paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const realStats: PaymentStats = {
        totalPaid,
        totalPending,
        totalOverdue,
        thisMonthPaid,
      };

      setPayments(transformedPayments);
      setStats(realStats);
    } catch (error) {
      logger.error('Error loading tenant payments:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Vencido', color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewPayment = (paymentId: string) => {
    // Navigate to payment detail view
    router.push(`/tenant/payments/${paymentId}`);
  };

  const handleDownloadReceipt = (paymentId: string) => {
    // Download payment receipt as PDF
    const payment = payments.find(p => p.id === paymentId);
    if (payment && payment.invoiceNumber) {
      // Create a mock PDF receipt (in real app this would be generated by backend)
      const receiptContent = `
        RECIBO DE PAGO
        ===============

        Número de Recibo: ${payment.invoiceNumber}
        Propiedad: ${payment.propertyTitle}
        Monto: ${formatCurrency(payment.amount)}
        Fecha de Pago: ${formatDate(payment.paymentDate || payment.dueDate)}
        Método de Pago: ${payment.method}

        ¡Gracias por su pago!
      `;

      // Create and download file
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recibo_${payment.invoiceNumber}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMakePayment = (paymentId: string) => {
    // Navigate to payment process
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      router.push(`/tenant/payments/${paymentId}/pay`);
    }
  };

  const handleExportPayments = () => {
    // Export payments data to CSV
    if (filteredPayments.length === 0) {
      return; // No payments to export
    }

    const csvData = filteredPayments.map(payment => ({
      ID: payment.id,
      Propiedad: payment.propertyTitle,
      Monto: formatCurrency(payment.amount),
      'Fecha Vencimiento': formatDate(payment.dueDate),
      'Fecha Pago': payment.paymentDate ? formatDate(payment.paymentDate) : 'Pendiente',
      Estado:
        payment.status === 'paid'
          ? 'Pagado'
          : payment.status === 'pending'
            ? 'Pendiente'
            : 'Vencido',
      Método: payment.method || 'N/A',
      Factura: payment.invoiceNumber || 'N/A',
    }));

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      Object.keys(csvData[0]!).join(',') +
      '\n' +
      csvData.map(row => Object.values(row).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pagos_inquilino_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mis Pagos" subtitle="Cargando información...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando pagos...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Mis Pagos" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Mis Pagos"
      subtitle="Gestiona y visualiza tu historial de pagos de arriendo"
    >
      <div className="space-y-6">
        {/* Estadísticas de Pagos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pagado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalPaid)}
              </div>
              <p className="text-xs text-muted-foreground">Histórico completo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.totalPending)}
              </div>
              <p className="text-xs text-muted-foreground">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalOverdue)}
              </div>
              <p className="text-xs text-muted-foreground">Pagos atrasados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.thisMonthPaid)}
              </div>
              <p className="text-xs text-muted-foreground">Pagos realizados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra tus pagos por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Input
                  placeholder="Buscar por propiedad..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="paid">Pagados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="overdue">Vencidos</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={loadPageData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>

              <Button variant="outline" onClick={handleExportPayments}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pagos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Historial de Pagos ({filteredPayments.length})</CardTitle>
                <CardDescription>Lista completa de tus pagos de arriendo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No se encontraron pagos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No hay pagos que coincidan con los criterios de búsqueda.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      Limpiar Filtros
                    </Button>
                  </div>
                ) : (
                  filteredPayments.map(payment => (
                    <div
                      key={payment.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="w-5 h-5 text-gray-600" />
                            <h3 className="font-bold text-lg text-gray-800">
                              {payment.propertyTitle}
                            </h3>
                            {getStatusBadge(payment.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Vence: {formatDate(payment.dueDate)}</span>
                            </div>

                            {payment.paymentDate && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Pagado: {formatDate(payment.paymentDate)}</span>
                              </div>
                            )}

                            {payment.invoiceNumber && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CreditCard className="w-4 h-4" />
                                <span>Factura: {payment.invoiceNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPayment(payment.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalles
                          </Button>

                          {payment.status === 'pending' && (
                            <Button size="sm" onClick={() => handleMakePayment(payment.id)}>
                              <CreditCard className="w-4 h-4 mr-1" />
                              Pagar Ahora
                            </Button>
                          )}

                          {payment.status === 'paid' && payment.invoiceNumber && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadReceipt(payment.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Descargar Recibo
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
