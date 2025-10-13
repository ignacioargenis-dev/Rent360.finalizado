'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Building,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  BarChart3,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProviderSimple';

interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  pendingPayments: number;
  completedJobs: number;
  averageRating: number;
}

interface JobPayment {
  id: string;
  jobTitle: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  dueDate: string;
  jobDate: string;
  rating?: number;
}

interface EarningsStats {
  totalEarned: number;
  thisMonth: number;
  pending: number;
  averagePerJob: number;
  completionRate: number;
}

export default function ProviderEarningsPage() {
  const { user, loading: userLoading } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingPayments: 0,
    completedJobs: 0,
    averageRating: 0,
  });
  const [payments, setPayments] = useState<JobPayment[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarned: 0,
    thisMonth: 0,
    pending: 0,
    averagePerJob: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for provider earnings
      const mockPayments: JobPayment[] = [
        {
          id: '1',
          jobTitle: 'Reparación de grifería',
          clientName: 'María González',
          amount: 85000,
          status: 'paid',
          paymentDate: '2024-01-15',
          dueDate: '2024-01-15',
          jobDate: '2024-01-10',
          rating: 5,
        },
        {
          id: '2',
          jobTitle: 'Instalación de calefacción',
          clientName: 'Carlos Rodríguez',
          amount: 250000,
          status: 'paid',
          paymentDate: '2024-02-01',
          dueDate: '2024-02-01',
          jobDate: '2024-01-25',
          rating: 4,
        },
        {
          id: '3',
          jobTitle: 'Mantenimiento eléctrico',
          clientName: 'Ana López',
          amount: 120000,
          status: 'pending',
          dueDate: '2024-03-15',
          jobDate: '2024-02-20',
        },
        {
          id: '4',
          jobTitle: 'Reparación de techo',
          clientName: 'Pedro Sánchez',
          amount: 300000,
          status: 'overdue',
          dueDate: '2024-01-30',
          jobDate: '2024-01-15',
        },
      ];

      const mockStats: EarningsStats = {
        totalEarned: 755000,
        thisMonth: 250000,
        pending: 120000,
        averagePerJob: 188750,
        completionRate: 95,
      };

      const mockEarnings: EarningsData = {
        totalEarnings: 755000,
        thisMonthEarnings: 250000,
        pendingPayments: 420000,
        completedJobs: 4,
        averageRating: 4.5,
      };

      setPayments(mockPayments);
      setStats(mockStats);
      setEarnings(mockEarnings);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error('Error loading provider earnings:', {
        error: error instanceof Error ? error.message : String(error),
      });
      setError('Error al cargar los ingresos');
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
    const matchesSearch =
      payment.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewPayment = (paymentId: string) => {
    // Navigate to payment detail view
    window.open(`/provider/payments/${paymentId}`, '_blank');
  };

  const handleDownloadInvoice = (paymentId: string) => {
    // Download payment invoice
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      setSuccessMessage(
        `Factura descargada: ${payment.jobTitle} - ${formatCurrency(payment.amount)}`
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleExportEarnings = () => {
    // Export earnings data to CSV
    if (filteredPayments.length === 0) {
      setErrorMessage('No hay ingresos para exportar');
      setTimeout(() => setErrorMessage(''), 5000);
      return;
    }

    const csvData = filteredPayments.map(payment => ({
      ID: payment.id,
      Trabajo: payment.jobTitle,
      Cliente: payment.clientName,
      Monto: formatCurrency(payment.amount),
      Estado:
        payment.status === 'paid'
          ? 'Pagado'
          : payment.status === 'pending'
            ? 'Pendiente'
            : 'Vencido',
      'Fecha Trabajo': formatDate(payment.jobDate),
      'Fecha Pago': payment.paymentDate ? formatDate(payment.paymentDate) : 'Pendiente',
      'Fecha Vencimiento': formatDate(payment.dueDate),
      Calificación: payment.rating || 'N/A',
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
      `ingresos_proveedor_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Mis Ingresos" subtitle="Cargando información financiera...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando ingresos...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout title="Mis Ingresos" subtitle="Error al cargar la página">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadEarningsData}>
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
      title="Mis Ingresos"
      subtitle="Gestiona y visualiza tus ganancias como proveedor de servicios"
    >
      <div className="space-y-6">
        {/* Success Message */}
        {successMessage && (
          <Card className="border-green-200 bg-green-50">
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
          <Card className="border-red-200 bg-red-50">
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

        {/* Estadísticas de Ingresos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ganado</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground">Histórico completo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats.thisMonth)}
              </div>
              <p className="text-xs text-muted-foreground">Ingresos mensuales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats.pending)}
              </div>
              <p className="text-xs text-muted-foreground">Por cobrar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calificación</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {earnings.averageRating.toFixed(1)} ⭐
              </div>
              <p className="text-xs text-muted-foreground">Promedio de clientes</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros y Búsqueda</CardTitle>
            <CardDescription>Filtra tus ingresos por diferentes criterios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <Input
                  placeholder="Buscar por trabajo o cliente..."
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

              <Button variant="outline" onClick={loadEarningsData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>

              <Button variant="outline" onClick={handleExportEarnings}>
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
                <CardTitle>Historial de Ingresos ({filteredPayments.length})</CardTitle>
                <CardDescription>Lista completa de tus trabajos y pagos</CardDescription>
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
                      No se encontraron ingresos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      No hay trabajos que coincidan con los criterios de búsqueda.
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
                            <Wrench className="w-5 h-5 text-gray-600" />
                            <h3 className="font-bold text-lg text-gray-800">{payment.jobTitle}</h3>
                            {getStatusBadge(payment.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-4 h-4" />
                              <span>{payment.clientName}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Trabajo: {formatDate(payment.jobDate)}</span>
                            </div>

                            {payment.rating && (
                              <div className="flex items-center gap-2 text-sm text-yellow-600">
                                <span className="font-medium">⭐ {payment.rating}/5</span>
                              </div>
                            )}

                            {payment.paymentDate && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Pagado: {formatDate(payment.paymentDate)}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span>Vence: {formatDate(payment.dueDate)}</span>
                            </div>
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

                          {payment.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadInvoice(payment.id)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Descargar Factura
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
