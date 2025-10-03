'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
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
import { useUserState } from '@/hooks/useUserState';

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
  const { user, loading: userLoading } = useUserState();
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

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for runner earnings
      const mockPayments: VisitPayment[] = [
        {
          id: '1',
          propertyTitle: 'Casa en Las Condes',
          propertyAddress: 'Av. Las Condes 1234',
          clientName: 'María González',
          amount: 25000,
          status: 'paid',
          paymentDate: '2024-01-15',
          visitDate: '2024-01-10',
          dueDate: '2024-01-15',
          rating: 5,
        },
        {
          id: '2',
          propertyTitle: 'Departamento Vitacura',
          propertyAddress: 'Calle Vitacura 567',
          clientName: 'Carlos Rodríguez',
          amount: 30000,
          status: 'paid',
          paymentDate: '2024-02-01',
          visitDate: '2024-01-25',
          dueDate: '2024-02-01',
          rating: 4,
        },
        {
          id: '3',
          propertyTitle: 'Oficina Providencia',
          propertyAddress: 'Providencia 890',
          clientName: 'Ana López',
          amount: 20000,
          status: 'pending',
          visitDate: '2024-02-20',
          dueDate: '2024-03-01',
        },
        {
          id: '4',
          propertyTitle: 'Local Santiago Centro',
          propertyAddress: 'Centro 456',
          clientName: 'Pedro Sánchez',
          amount: 35000,
          status: 'overdue',
          visitDate: '2024-01-15',
          dueDate: '2024-01-30',
        },
      ];

      const mockStats: EarningsStats = {
        totalEarned: 110000,
        thisMonth: 30000,
        pending: 20000,
        averagePerVisit: 27500,
        completionRate: 92,
      };

      const mockEarnings: EarningsData = {
        totalEarnings: 110000,
        thisMonthEarnings: 30000,
        pendingPayments: 55000,
        completedVisits: 4,
        averageRating: 4.5,
      };

      setPayments(mockPayments);
      setStats(mockStats);
      setEarnings(mockEarnings);

      // Simular carga
      await new Promise(resolve => setTimeout(resolve, 1000));
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
      alert(
        `Descargando recibo para: ${payment.propertyTitle}\nMonto: ${formatCurrency(payment.amount)}`
      );
    }
  };

  const handleExportEarnings = () => {
    // Export earnings data to CSV
    if (filteredPayments.length === 0) {
      alert('No hay ingresos para exportar');
      return;
    }

    const csvData = filteredPayments.map(payment => ({
      ID: payment.id,
      Propiedad: payment.propertyTitle,
      Dirección: payment.propertyAddress,
      Cliente: payment.clientName,
      Monto: formatCurrency(payment.amount),
      Estado:
        payment.status === 'paid'
          ? 'Pagado'
          : payment.status === 'pending'
            ? 'Pendiente'
            : 'Vencido',
      'Fecha Visita': formatDate(payment.visitDate),
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
    link.setAttribute('download', `ingresos_runner_${new Date().toISOString().split('T')[0]}.csv`);
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
