'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, 
  Calendar,
  DollarSign,
  Users,
  FileText,
  CreditCard,
  Star,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  UserPlus,
  Edit,
  Trash2,
  Clock,
  MapPin,
  MessageSquare,
  Heart,
  Target,
  Activity,
  PieChart,
  LineChart,
  Info,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Search
} from 'lucide-react';
import { Payment } from '@/types';

interface OwnerPayment extends Payment {
  propertyName: string;
  tenantName: string;
  tenantEmail: string;
  daysUntilDue: number;
  isOverdue: boolean;
}

export default function OwnerPendingPaymentsPage() {
  const [payments, setPayments] = useState<OwnerPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [propertyFilter, setPropertyFilter] = useState('all');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      // Simular datos de pagos para propietario
      const mockPayments: OwnerPayment[] = [
        {
          id: '1',
          paymentNumber: 'PAGO-001',
          contractId: 'contract1',
          amount: 350000,
          dueDate: new Date('2024-07-15'),
          paidDate: null,
          status: 'PENDING' as any,
          propertyName: 'Departamento Centro',
          tenantName: 'Juan Pérez',
          tenantEmail: 'juan@example.com',
          daysUntilDue: 5,
          isOverdue: false,
          method: 'BANK_TRANSFER' as any,
          payerId: 'tenant1',
          transactionId: null,
          notes: 'Pago mensual de arriendo junio 2024',
          createdAt: new Date('2024-06-15'),
          updatedAt: new Date('2024-06-15'),
        },
        {
          id: '2',
          paymentNumber: 'PAGO-002',
          contractId: 'contract2',
          amount: 850000,
          dueDate: new Date('2024-07-10'),
          paidDate: null,
          status: 'PENDING' as any,
          propertyName: 'Casa Las Condes',
          tenantName: 'María González',
          tenantEmail: 'maria@example.com',
          daysUntilDue: -2,
          isOverdue: true,
          method: 'DIGITAL_WALLET' as any,
          payerId: 'tenant2',
          transactionId: null,
          notes: 'Pago mensual de arriendo junio 2024 - Retrasado',
          createdAt: new Date('2024-06-10'),
          updatedAt: new Date('2024-06-10'),
        },
        {
          id: '3',
          paymentNumber: 'PAGO-003',
          contractId: 'contract3',
          amount: 450000,
          dueDate: new Date('2024-07-20'),
          paidDate: null,
          status: 'PENDING' as any,
          propertyName: 'Oficina Providencia',
          tenantName: 'Carlos Rodríguez',
          tenantEmail: 'carlos@example.com',
          daysUntilDue: 10,
          isOverdue: false,
          method: 'BANK_TRANSFER' as any,
          payerId: 'tenant3',
          transactionId: null,
          notes: 'Pago mensual de arriendo junio 2024',
          createdAt: new Date('2024-06-20'),
          updatedAt: new Date('2024-06-20'),
        },
      ];
      setPayments(mockPayments);
    } catch (error) {
      logger.error('Error fetching payments:', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesProperty = propertyFilter === 'all' || payment.propertyName === propertyFilter;
    return matchesSearch && matchesStatus && matchesProperty;
  });

  const getPaymentStatusBadge = (payment: OwnerPayment) => {
    if (payment.status === 'COMPLETED') {
      return <Badge variant="secondary">Pagado</Badge>;
    } else if (payment.isOverdue) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (payment.daysUntilDue <= 3) {
      return <Badge variant="destructive">Urgente</Badge>;
    } else if (payment.daysUntilDue <= 7) {
      return <Badge variant="default">Próximo</Badge>;
    } else {
      return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const handleSendReminder = async (paymentId: string) => {
    try {
      alert('Recordatorio enviado exitosamente al inquilino');
    } catch (error) {
      logger.error('Error sending reminder:', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleViewDetails = (paymentId: string) => {
    window.open(`/owner/payments/${paymentId}`, '_blank');
  };

  const exportToCSV = () => {
    const headers = ['ID Pago', 'Propiedad', 'Inquilino', 'Monto', 'Fecha Vencimiento', 'Estado', 'Días Restantes'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        payment.paymentNumber,
        payment.propertyName,
        payment.tenantName,
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
      link.setAttribute('download', 'pagos_pendientes_propietario.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Pagos Pendientes" subtitle="Gestiona los pagos pendientes de tus propiedades">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout
    );
  }

  const totalPending = filteredPayments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = filteredPayments.filter(p => p.isOverdue);
  const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  const uniqueProperties = [...new Set(filteredPayments.map(p => p.propertyName))];

  return (
    <DashboardLayout title="Pagos Pendientes" subtitle="Gestiona los pagos pendientes de tus propiedades">
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
                  placeholder="Buscar por propiedad, inquilino o ID de pago..."
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
                  <SelectItem value="COMPLETED">Pagado</SelectItem>
                  <SelectItem value="FAILED">Fallido</SelectItem>
                </SelectContent>
              </Select>
              <Select value={propertyFilter} onValueChange={setPropertyFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por propiedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las propiedades</SelectItem>
                  {uniqueProperties.map(property => (
                    <SelectItem key={property} value={property}>{property}</SelectItem>
                  ))}
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
              <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueProperties.length}</div>
              <p className="text-xs text-muted-foreground">Con pagos pendientes</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Pago</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredPayments.length > 0 
                  ? Math.round((filteredPayments.filter(p => p.status === 'COMPLETED').length / filteredPayments.length) * 100)
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
              Lista de pagos pendientes de tus propiedades
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
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell className="font-medium">{payment.propertyName}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payment.tenantName}</div>
                        <div className="text-sm text-gray-500">{payment.tenantEmail}</div>
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
                        payment.isOverdue 
                          ? 'text-red-600' 
                          : payment.daysUntilDue <= 3 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {payment.isOverdue 
                          ? `${Math.abs(payment.daysUntilDue)} días vencido` 
                          : `${payment.daysUntilDue} días`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(payment.id)}
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
                ))}
              </TableBody>
            </Table>
            
            {filteredPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron pagos pendientes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumen por Propiedad */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Propiedad</CardTitle>
            <CardDescription>
              Estado de pagos agrupado por propiedad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueProperties.map(propertyName => {
                const propertyPayments = filteredPayments.filter(p => p.propertyName === propertyName);
                const propertyTotal = propertyPayments.reduce((sum, p) => p.status === 'PENDING' ? sum + p.amount : sum, 0);
                const propertyOverdue = propertyPayments.filter(p => p.isOverdue).length;
                
                return (
                  <div key={propertyName} className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">{propertyName}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total pendiente:</span>
                        <span className="font-medium">${propertyTotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pagos pendientes:</span>
                        <span className="font-medium">{propertyPayments.filter(p => p.status === 'PENDING').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Vencidos:</span>
                        <span className={`font-medium ${propertyOverdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {propertyOverdue}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout
  );
}
