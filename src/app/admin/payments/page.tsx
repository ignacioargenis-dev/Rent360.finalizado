'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, 
  Search, 
  Filter, Eye, Download, 
  Plus,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  MoreHorizontal,
  FileText } from 'lucide-react';
import { User } from '@/types';
import EnhancedDashboardLayout from '@/components/dashboard/EnhancedDashboardLayout';

interface Payment {
  id: string;
  contractId: string;
  contractTitle: string;
  tenant: string;
  owner: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  paymentMethod?: string;
  createdAt: string;
}

export default function AdminPaymentsPage() {

  const [user, setUser] = useState<User | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);

  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user data
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', { error: error instanceof Error ? error.message : String(error) });
      }
    };

    // Load payments data
    const loadPayments = async () => {
      try {
        // Mock data for demo
        const mockPayments: Payment[] = [
          {
            id: '1',
            contractId: '1',
            contractTitle: 'Contrato Arriendo Depto Las Condes',
            tenant: 'Carlos Ramírez',
            owner: 'María González',
            amount: 550000,
            dueDate: '2024-03-15',
            paidDate: '2024-03-14',
            status: 'PAID',
            paymentMethod: 'Transferencia',
            createdAt: '2024-03-10',
          },
          {
            id: '2',
            contractId: '2',
            contractTitle: 'Contrato Oficina Providencia',
            tenant: 'TechCorp SA',
            owner: 'Empresa Soluciones Ltda.',
            amount: 350000,
            dueDate: '2024-03-20',
            paidDate: '2024-03-18',
            status: 'PAID',
            paymentMethod: 'Transferencia',
            createdAt: '2024-03-15',
          },
          {
            id: '3',
            contractId: '3',
            contractTitle: 'Contrato Casa Vitacura',
            tenant: 'Ana Martínez',
            owner: 'Pedro Silva',
            amount: 1200000,
            dueDate: '2024-04-01',
            status: 'PENDING',
            createdAt: '2024-03-20',
          },
          {
            id: '4',
            contractId: '4',
            contractTitle: 'Contrato Estudio Centro',
            tenant: 'Sofía López',
            owner: 'Luis Fernández',
            amount: 280000,
            dueDate: '2024-02-28',
            status: 'OVERDUE',
            createdAt: '2024-02-01',
          },
        ];

        setPayments(mockPayments);
        setFilteredPayments(mockPayments);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading payments:', { error: error instanceof Error ? error.message : String(error) });
        setLoading(false);
      }
    };

    loadUserData();
    loadPayments();
  }, []);

  useEffect(() => {
    // Filter payments based on search and status
    let filtered = payments;

    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.contractTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.tenant.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.owner.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchQuery, statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Pagado</Badge>;
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'CANCELLED':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

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

  const totalRevenue = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overdueAmount = payments.filter(p => p.status === 'OVERDUE').reduce((sum, p) => sum + p.amount, 0);

  return (
    <EnhancedDashboardLayout
      user={user}
      title="Gestión de Pagos"
      subtitle="Administra todos los pagos del sistema"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pagos</p>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatPrice(pendingAmount)}</p>
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
                  <p className="text-2xl font-bold text-red-600">{formatPrice(overdueAmount)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Buscar pagos, contratos, inquilinos o propietarios..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="PAID">Pagados</SelectItem>
                    <SelectItem value="PENDING">Pendientes</SelectItem>
                    <SelectItem value="OVERDUE">Atrasados</SelectItem>
                    <SelectItem value="CANCELLED">Cancelados</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                </Button>
                
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pagos</CardTitle>
            <CardDescription>
              {filteredPayments.length} pagos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(payment.status)}
                        <h3 className="text-lg font-semibold">{payment.contractTitle}</h3>
                        {getStatusBadge(payment.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Inquilino: {payment.tenant}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>Propietario: {payment.owner}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>Vencimiento: {formatDate(payment.dueDate)}</span>
                          </div>
                          {payment.paidDate && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              <span>Pagado: {formatDate(payment.paidDate)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{formatPrice(payment.amount)}</span>
                        </div>
                        {payment.paymentMethod && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">{payment.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Comprobante
                      </Button>
                      {payment.status === 'PENDING' && (
                        <Button size="sm">
                          <CreditCard className="w-4 h-4 mr-2" />
                          Marcar Pagado
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </EnhancedDashboardLayout>
  );
}
