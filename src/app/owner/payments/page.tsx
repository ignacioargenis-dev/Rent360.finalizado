'use client';

import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Plus,
  Filter,
  Search,
  Eye,
  Clock,
  Home,
  Receipt,
  RefreshCw,
  CreditCard
} from 'lucide-react';
import { Payment, Property, Contract } from '@/types';
import DashboardLayout from '@/components/layout/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useUserState } from '@/hooks/useUserState';

interface PaymentWithDetails extends Payment {
  property?: Property;
  contract?: Contract;
  tenantName?: string;
  tenantEmail?: string;
}

interface PaymentStats {
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  thisMonthReceived: number;
  averagePaymentTime: number;
}

export default function OwnerPaymentsPage() {
  const { user } = useUserState();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    thisMonthReceived: 0,
    averagePaymentTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Funciones para acciones
  const handleFilterPayments = () => {
    logger.info('Aplicando filtros de pagos');
    // TODO: Implementar filtros avanzados
  };

  const handleExportPayments = async () => {
    try {
      logger.info('Exportando datos de pagos');
      alert('Datos de pagos exportados exitosamente');
    } catch (error) {
      logger.error('Error exportando pagos:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleViewPaymentDetails = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };

  const handleSendReminder = async (paymentId: string) => {
    try {
      logger.info('Enviando recordatorio de pago:', { paymentId });
      alert('Recordatorio enviado exitosamente');
      // TODO: Implement API call to send reminder
    } catch (error) {
      logger.error('Error enviando recordatorio:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    try {
      logger.info('Marcando pago como realizado:', { paymentId });
      alert('Pago marcado como realizado');
      // TODO: Implement API call to mark payment as paid
    } catch (error) {
      logger.error('Error marcando pago:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockPayments: PaymentWithDetails[] = [
        {
          id: '1',
          paymentNumber: 'PAY-2024-001',
          amount: 850000,
          dueDate: new Date('2024-02-01'),
          paidDate: new Date('2024-02-01'),
          method: 'DIGITAL_WALLET' as any,
          status: 'PAID' as any,
          notes: 'Pago de arriendo febrero 2024',
          contractId: '1',
          payerId: 'tenant1',
          transactionId: 'TXN-001',
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
          property: {
            id: '1',
            title: 'Departamento Amoblado Centro',
            description: 'Hermoso departamento en el centro de Santiago',
            type: 'APARTMENT' as any,
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 850000,
            deposit: 850000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'OCCUPIED' as any,
            images: '',
            features: 'Estacionamiento, Ascensor, Seguridad 24/7',
            views: 412,
            inquiries: 34,
            ownerId: 'owner1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: '2',
          paymentNumber: 'PAY-2024-002',
          amount: 850000,
          dueDate: new Date('2024-03-01'),
          paidDate: null,
          method: 'BANK_TRANSFER' as any,
          status: 'PENDING' as any,
          notes: 'Pago de arriendo marzo 2024',
          contractId: '1',
          payerId: 'tenant1',
          transactionId: null,
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-15'),
          property: {
            id: '1',
            title: 'Departamento Amoblado Centro',
            description: 'Hermoso departamento en el centro de Santiago',
            type: 'APARTMENT' as any,
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 850000,
            deposit: 850000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'OCCUPIED' as any,
            images: '',
            features: 'Estacionamiento, Ascensor, Seguridad 24/7',
            views: 412,
            inquiries: 34,
            ownerId: 'owner1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: '3',
          paymentNumber: 'PAY-2024-003',
          amount: 850000,
          dueDate: new Date('2024-04-01'),
          paidDate: null,
          method: 'BANK_TRANSFER' as any,
          status: 'PENDING' as any,
          notes: 'Pago de arriendo abril 2024',
          contractId: '1',
          payerId: 'tenant1',
          transactionId: null,
          createdAt: new Date('2024-02-15'),
          updatedAt: new Date('2024-02-15'),
          property: {
            id: '1',
            title: 'Departamento Amoblado Centro',
            description: 'Hermoso departamento en el centro de Santiago',
            type: 'APARTMENT' as any,
            address: 'Av. Providencia 1234',
            city: 'Santiago',
            commune: 'Providencia',
            region: 'Metropolitana',
            price: 850000,
            deposit: 850000,
            bedrooms: 2,
            bathrooms: 1,
            area: 65,
            status: 'OCCUPIED' as any,
            images: '',
            features: 'Estacionamiento, Ascensor, Seguridad 24/7',
            views: 412,
            inquiries: 34,
            ownerId: 'owner1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        {
          id: '4',
          paymentNumber: 'PAY-2024-004',
          amount: 1200000,
          dueDate: new Date('2024-02-01'),
          paidDate: null,
          method: 'BANK_TRANSFER' as any,
          status: 'PENDING' as any,
          notes: 'Pago de arriendo febrero 2024',
          contractId: '2',
          payerId: 'tenant2',
          transactionId: null,
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date('2024-02-01'),
          property: {
            id: '2',
            title: 'Casa Familiar Las Condes',
            description: 'Casa espaciosa en barrio residencial',
            type: 'APARTMENT' as any,
            address: 'Calle El Alba 567',
            city: 'Santiago',
            commune: 'Las Condes',
            region: 'Metropolitana',
            price: 1200000,
            deposit: 1200000,
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            status: 'RENTED' as any,
            images: '',
            features: 'Jardín, Estacionamiento, Seguridad',
            views: 678,
            inquiries: 42,
            ownerId: 'owner2',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      setPayments(mockPayments);
      
      // Calculate stats
      const totalReceived = mockPayments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingAmount = mockPayments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const overdueAmount = mockPayments
        .filter(p => p.status === 'PENDING' && new Date() > p.dueDate)
        .reduce((sum, p) => sum + p.amount, 0);
      
      const thisMonthReceived = mockPayments
        .filter(p => {
          const paidDate = new Date(p.paidDate || '');
          const now = new Date();
          return p.status === 'COMPLETED' && 
                 paidDate.getMonth() === now.getMonth() && 
                 paidDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalReceived,
        pendingAmount,
        overdueAmount,
        thisMonthReceived,
        averagePaymentTime: 2.5,
      });

      setLoading(false);
    }, 1000);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-red-100 text-red-800">Atrasado</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-gray-100 text-gray-800">Cancelado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'transfer':
        return <Badge className="bg-blue-100 text-blue-800">Transferencia</Badge>;
      case 'khipu':
        return <Badge className="bg-purple-100 text-purple-800">Khipu</Badge>;
      case 'cash':
        return <Badge className="bg-green-100 text-green-800">Efectivo</Badge>;
      case 'check':
        return <Badge className="bg-orange-100 text-orange-800">Cheque</Badge>;
      default:
        return <Badge>{method}</Badge>;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.property?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.tenantName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const paymentDate = new Date(payment.dueDate);
      const now = new Date();
      
      switch (dateFilter) {
        case 'thisMonth':
          matchesDate = paymentDate.getMonth() === now.getMonth() && 
                        paymentDate.getFullYear() === now.getFullYear();
          break;
        case 'lastMonth':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          matchesDate = paymentDate >= lastMonth && paymentDate < new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'overdue':
          matchesDate = payment.status === 'PENDING' && new Date() > payment.dueDate;
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pagos...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user}
        title="Gestión de Pagos"
        subtitle="Monitorea y gestiona todos los pagos de arriendo"
      />

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Recibido</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.totalReceived)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.pendingAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Atrasados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.overdueAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(stats.thisMonthReceived)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averagePaymentTime}d
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Resumen de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {payments.filter(p => p.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-green-700">Pagos Completados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {payments.filter(p => p.status === 'PENDING').length}
                </div>
                <div className="text-sm text-yellow-700">Pagos Pendientes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {payments.filter(p => p.status === 'PENDING' && new Date() > p.dueDate).length}
                </div>
                <div className="text-sm text-red-700">Pagos Atrasados</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">98%</div>
                <div className="text-sm text-blue-700">Tasa de Pago</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar por propiedad o inquilino..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="COMPLETED">Completados</option>
                  <option value="PENDING">Pendientes</option>
                  <option value="OVERDUE">Atrasados</option>
                  <option value="CANCELLED">Cancelados</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">Todas las fechas</option>
                  <option value="thisMonth">Este mes</option>
                  <option value="lastMonth">Mes pasado</option>
                  <option value="overdue">Atrasados</option>
                </select>
                <Button variant="outline" onClick={handleFilterPayments}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                <Button variant="outline" onClick={handleExportPayments}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.map((payment) => {
            const daysOverdue = Math.floor((new Date().getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={payment.id} className={`hover:shadow-lg transition-shadow ${
                payment.status === 'PENDING' && new Date() > payment.dueDate ? 'border-red-200 bg-red-50' : ''
              }`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {payment.property?.title}
                          </h3>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            {payment.property?.address}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(payment.status)}
                          {payment.status === 'PENDING' && new Date() > payment.dueDate && (
                            <Badge className="bg-red-100 text-red-800">
                              {daysOverdue} días atrasado
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Monto</p>
                          <p className="font-semibold text-gray-900">{formatPrice(payment.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                          <p className="font-semibold text-gray-900">{payment.dueDate.toLocaleDateString('es-CL')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Método de Pago</p>
                          <div>{payment.method ? getMethodBadge(payment.method) : 'No especificado'}</div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de Pago</p>
                          <p className="font-semibold text-gray-900">
                            {payment.paidDate ? payment.paidDate.toLocaleDateString('es-CL') : 'No pagado'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4" />
                          <span>Inquilino: {payment.tenantName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Creado: {payment.createdAt.toLocaleDateString('es-CL')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 lg:ml-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewPaymentDetails(payment)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => alert('Comprobante generado')}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Comprobante
                      </Button>
                      {payment.status === 'PENDING' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleSendReminder(payment.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Enviar Recordatorio
                        </Button>
                      )}
                      {payment.status === 'PENDING' && (
                        <Button
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleMarkAsPaid(payment.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Marcar Pagado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPayments.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No se encontraron pagos
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Intenta ajustar tus filtros de búsqueda.'
                  : 'Aún no hay registros de pagos.'
                }
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Registrar Pago Manual
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}


