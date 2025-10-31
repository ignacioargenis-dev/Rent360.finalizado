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
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
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
  completedVisits: number;
  averageRating: number;
}

interface VisitPayment {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
  visitDate: string;
  dueDate: string;
  rating?: number;
}

interface EarningsStats {
  totalEarned: number;
  thisMonth: number;
  pending: number;
  averagePerVisit: number;
  completionRate: number;
}

export default function RunnerEarningsPage() {
  const { user, loading: userLoading } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    thisMonthEarnings: 0,
    pendingPayments: 0,
    completedVisits: 0,
    averageRating: 0,
  });
  const [payments, setPayments] = useState<VisitPayment[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarned: 0,
    thisMonth: 0,
    pending: 0,
    averagePerVisit: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv', // 'csv', 'json'
    status: 'all', // filtro por estado
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ CORREGIDO: Obtener datos reales desde la API
      const response = await fetch('/api/runner/earnings?period=month&limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Error al cargar ganancias: ${response.status}`);
      }

      const result = await response.json();
      const earningsData = result.data || {};
      const earningsList = earningsData.earnings || [];
      const statsData = earningsData.stats || {};

      // Transformar datos al formato esperado
      const transformedPayments: VisitPayment[] = earningsList.map((earning: any) => {
        const visitDate = new Date(earning.visitDate);
        const paymentDate = earning.status === 'PAID' ? visitDate : undefined;
        const dueDate = new Date(visitDate);
        dueDate.setDate(dueDate.getDate() + 7); // 7 días después de la visita

        // Determinar status basado en fecha
        let paymentStatus: 'paid' | 'pending' | 'overdue' = 'pending';
        const now = new Date();
        if (earning.status === 'PAID' || paymentDate) {
          paymentStatus = 'paid';
        } else if (dueDate < now) {
          paymentStatus = 'overdue';
        }

        return {
          id: earning.id || earning.visitId,
          propertyTitle: earning.propertyTitle || 'Sin título',
          propertyAddress: earning.propertyAddress || '',
          clientName: earning.clientName || 'Sin cliente',
          amount: earning.earnings || 0,
          status: paymentStatus,
          paymentDate: paymentDate?.toISOString().split('T')[0],
          visitDate: visitDate.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          rating: earning.rating || undefined,
        };
      });

      // Calcular estadísticas adicionales
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEarnings = transformedPayments
        .filter(p => {
          if (!p.paymentDate) return false;
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= monthStart;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingPayments = transformedPayments
        .filter(p => p.status === 'pending' || p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0);

      const averagePerVisit = transformedPayments.length > 0
        ? transformedPayments.reduce((sum, p) => sum + p.amount, 0) / transformedPayments.length
        : 0;

      setPayments(transformedPayments);
      setStats({
        totalEarned: statsData.totalEarnings || 0,
        thisMonth: thisMonthEarnings,
        pending: pendingPayments,
        averagePerVisit: Math.round(averagePerVisit),
        completionRate: 0, // TODO: Calcular desde visitas
      });
      setEarnings({
        totalEarnings: statsData.totalEarnings || 0,
        thisMonthEarnings,
        pendingPayments,
        completedVisits: statsData.totalVisits || 0,
        averageRating: statsData.averageRating || 0,
      });
    } catch (error) {
      logger.error('Error loading runner earnings:', {
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
      payment.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewPayment = (paymentId: string) => {
    // Navigate to payment detail view
    window.open(`/runner/payments/${paymentId}`, '_blank');
  };

  const handleDownloadReceipt = (paymentId: string) => {
    // Download payment receipt
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      // Create a simple receipt content
      const receiptContent = `
RECIBO DE PAGO - RUNNER
========================

ID de Pago: ${payment.id}
Fecha: ${new Date(payment.visitDate).toLocaleDateString('es-CL')}
Propiedad: ${payment.propertyTitle}
Monto: ${formatCurrency(payment.amount)}
Estado: ${payment.status === 'paid' ? 'Pagado' : 'Pendiente'}

Gracias por tu trabajo.
Rent360 - ${new Date().getFullYear()}
      `.trim();

      // Create and download the receipt
      const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `recibo_${payment.id}.txt`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logger.debug('Recibo descargado:', { paymentId });
    }
  };

  const handleExportEarnings = () => {
    logger.info('Abriendo opciones de exportación de ganancias');
    setShowExportDialog(true);
  };

  const handleConfirmExport = async () => {
    try {
      logger.info('Exportando ganancias del runner', exportOptions);

      // Construir URL con parámetros
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (exportOptions.status !== 'all') {
        params.append('status', exportOptions.status);
      }
      if (exportOptions.startDate) {
        params.append('startDate', exportOptions.startDate);
      }
      if (exportOptions.endDate) {
        params.append('endDate', exportOptions.endDate);
      }

      // Crear URL de descarga
      const exportUrl = `/api/runner/earnings/export?${params.toString()}`;

      // Crear enlace temporal para descarga
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `ganancias_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportDialog(false);

      // Resetear opciones de exportación
      setExportOptions({
        format: 'csv',
        status: 'all',
        startDate: '',
        endDate: '',
      });

      logger.info('Exportación de ganancias completada exitosamente');
    } catch (error) {
      logger.error('Error exportando ganancias:', {
        error: error instanceof Error ? error.message : String(error),
      });
      alert('Error al exportar las ganancias. Por favor, intenta nuevamente.');
    }
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
      subtitle="Gestiona y visualiza tus ganancias como runner"
    >
      <div className="space-y-6">
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
                  placeholder="Buscar por propiedad o cliente..."
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
                <CardTitle>Historial de Visitas ({filteredPayments.length})</CardTitle>
                <CardDescription>Lista completa de tus visitas y pagos</CardDescription>
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
                      No hay visitas que coincidan con los criterios de búsqueda.
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
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <h3 className="font-bold text-lg text-gray-800">
                              {payment.propertyTitle}
                            </h3>
                            {getStatusBadge(payment.status)}
                          </div>

                          <div className="text-sm text-gray-600 mb-3">
                            <Building className="w-4 h-4 inline mr-1" />
                            {payment.propertyAddress}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span className="font-medium">Cliente:</span>
                              {payment.clientName}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">{formatCurrency(payment.amount)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>Visita: {formatDate(payment.visitDate)}</span>
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
