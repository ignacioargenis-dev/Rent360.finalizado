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
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Send,
  FileText,
} from 'lucide-react';
import { User } from '@/types';

interface PendingPayment {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  status: 'pending' | 'overdue' | 'urgent';
  type: 'rent' | 'utilities' | 'maintenance' | 'other';
  description: string;
  lastReminder?: string;
  reminderCount: number;
}

interface PendingStats {
  totalPending: number;
  totalAmount: number;
  overdueCount: number;
  urgentCount: number;
  averageDaysOverdue: number;
}

export default function OwnerPendingPaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PendingPayment[]>([]);
  const [stats, setStats] = useState<PendingStats>({
    totalPending: 0,
    totalAmount: 0,
    overdueCount: 0,
    urgentCount: 0,
    averageDaysOverdue: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSendBulkReminders = async () => {
    const overduePayments = filteredPayments.filter(
      p => p.status === 'overdue' || p.status === 'urgent'
    );
    if (overduePayments.length === 0) {
      alert('No hay pagos pendientes para enviar recordatorios.');
      return;
    }

    setSuccessMessage(
      `Recordatorios enviados correctamente a ${overduePayments.length} inquilinos`
    );
    setTimeout(() => setSuccessMessage(''), 3000);
    // In a real app, this would send bulk email/SMS reminders
  };

  const handleGenerateReceipt = async (paymentId: string) => {
    alert(
      `Generando recibo para el pago ${paymentId}... Esta funcionalidad estará disponible próximamente.`
    );
    // In a real app, this would generate and download a PDF receipt
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        logger.error('Error loading user data:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadPendingPaymentsData = async () => {
      try {
        // Mock pending payments data
        const mockPayments: PendingPayment[] = [
          {
            id: 'pp1',
            tenantId: 't1',
            tenantName: 'María González',
            tenantEmail: 'maria@example.com',
            tenantPhone: '+56912345678',
            propertyId: 'p1',
            propertyTitle: 'Apartamento Centro',
            propertyAddress: 'Av. Providencia 1234, Providencia',
            amount: 850000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            daysOverdue: 5,
            status: 'overdue',
            type: 'rent',
            description: 'Arriendo mensual enero 2025',
            lastReminder: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            reminderCount: 1,
          },
          {
            id: 'pp2',
            tenantId: 't2',
            tenantName: 'Carlos Rodríguez',
            tenantEmail: 'carlos@example.com',
            tenantPhone: '+56987654321',
            propertyId: 'p2',
            propertyTitle: 'Casa Los Dominicos',
            propertyAddress: 'Calle Los Militares 567, Las Condes',
            amount: 1200000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(), // 12 days ago
            daysOverdue: 12,
            status: 'urgent',
            type: 'rent',
            description: 'Arriendo mensual enero 2025',
            lastReminder: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            reminderCount: 2,
          },
          {
            id: 'pp3',
            tenantId: 't3',
            tenantName: 'Ana López',
            tenantEmail: 'ana@example.com',
            tenantPhone: '+56955556666',
            propertyId: 'p3',
            propertyTitle: 'Oficina Las Condes',
            propertyAddress: 'Av. Apoquindo 3456, Las Condes',
            amount: 75000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
            daysOverdue: 2,
            status: 'pending',
            type: 'utilities',
            description: 'Gastos comunes enero 2025',
            reminderCount: 0,
          },
          {
            id: 'pp4',
            tenantId: 't1',
            tenantName: 'María González',
            tenantEmail: 'maria@example.com',
            tenantPhone: '+56912345678',
            propertyId: 'p1',
            propertyTitle: 'Apartamento Centro',
            propertyAddress: 'Av. Providencia 1234, Providencia',
            amount: 150000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // Due in 3 days
            daysOverdue: 0,
            status: 'pending',
            type: 'maintenance',
            description: 'Reparación puerta principal',
            reminderCount: 0,
          },
          {
            id: 'pp5',
            tenantId: 't4',
            tenantName: 'Pedro Martínez',
            tenantEmail: 'pedro@example.com',
            tenantPhone: '+56977778888',
            propertyId: 'p4',
            propertyTitle: 'Local Vitacura',
            propertyAddress: 'Pasaje Los Alpes 890, Vitacura',
            amount: 500000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(), // 8 days ago
            daysOverdue: 8,
            status: 'overdue',
            type: 'rent',
            description: 'Arriendo mensual enero 2025',
            lastReminder: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            reminderCount: 1,
          },
        ];

        setPendingPayments(mockPayments);
        setFilteredPayments(mockPayments);

        // Calculate stats
        const totalPending = mockPayments.length;
        const totalAmount = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const overdueCount = mockPayments.filter(p => p.status === 'overdue').length;
        const urgentCount = mockPayments.filter(p => p.status === 'urgent').length;
        const overduePayments = mockPayments.filter(p => p.daysOverdue > 0);
        const averageDaysOverdue =
          overduePayments.length > 0
            ? overduePayments.reduce((sum, p) => sum + p.daysOverdue, 0) / overduePayments.length
            : 0;

        const pendingStats: PendingStats = {
          totalPending,
          totalAmount,
          overdueCount,
          urgentCount,
          averageDaysOverdue,
        };

        setStats(pendingStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading pending payments data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPendingPaymentsData();
  }, []);

  useEffect(() => {
    let filtered = pendingPayments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        payment =>
          payment.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          payment.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [pendingPayments, searchQuery, statusFilter]);

  const getStatusBadge = (status: string, daysOverdue: number) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido ({daysOverdue} días)</Badge>;
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgente ({daysOverdue} días)</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'rent':
        return <Badge variant="outline">Arriendo</Badge>;
      case 'utilities':
        return <Badge variant="outline">Gastos Comunes</Badge>;
      case 'maintenance':
        return <Badge variant="outline">Mantenimiento</Badge>;
      case 'other':
        return <Badge variant="outline">Otros</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 0) {
      return `En ${Math.abs(diffDays)} días`;
    } else {
      return `Hace ${diffDays} días`;
    }
  };

  const handleSendReminder = async (payment: PendingPayment) => {
    alert(`Recordatorio enviado a ${payment.tenantName} por ${formatCurrency(payment.amount)}`);
    // In a real app, this would send an email/SMS reminder
  };

  const handleMarkAsPaid = async (paymentId: string) => {
    if (!confirm('¿Marcar este pago como recibido?')) {
      return;
    }

    setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
    setFilteredPayments(prev => prev.filter(p => p.id !== paymentId));
    alert('Pago marcado como recibido');
  };

  const handleContactTenant = (payment: PendingPayment, method: 'phone' | 'email') => {
    if (method === 'phone') {
      window.open(`tel:${payment.tenantPhone}`);
    } else {
      window.open(`mailto:${payment.tenantEmail}?subject=Pago pendiente - ${payment.description}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pagos pendientes...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Pagos Pendientes"
      subtitle="Gestiona los pagos pendientes de tus inquilinos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-800">{successMessage}</span>
          </div>
        )}
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pagos Pendientes</h1>
            <p className="text-gray-600">
              Monitorea y gestiona los pagos atrasados de tus propiedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSendBulkReminders}>
              <Send className="w-4 h-4 mr-2" />
              Enviar Recordatorios Masivos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pendientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPending}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monto Total</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Vencidos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdueCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgentes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.urgentCount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Promedio Atraso</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.averageDaysOverdue.toFixed(1)} días
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por inquilino, propiedad o descripción..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              Pendientes
            </Button>
            <Button
              variant={statusFilter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('overdue')}
            >
              Vencidos
            </Button>
            <Button
              variant={statusFilter === 'urgent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('urgent')}
            >
              Urgentes
            </Button>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos pendientes</h3>
                <p className="text-gray-600">Todos los pagos están al día.</p>
              </CardContent>
            </Card>
          ) : (
            filteredPayments.map(payment => (
              <Card
                key={payment.id}
                className={`border-l-4 ${
                  payment.status === 'urgent'
                    ? 'border-l-red-500'
                    : payment.status === 'overdue'
                      ? 'border-l-orange-500'
                      : 'border-l-yellow-500'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-semibold text-sm">
                            {payment.tenantName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {payment.tenantName}
                          </h3>
                          <p className="text-sm text-gray-600">{payment.propertyTitle}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Monto:</span>
                          <p className="text-lg font-bold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Vencimiento:</span>
                          <p>{formatDate(payment.dueDate)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Tipo:</span>
                          <div className="mt-1">{getTypeBadge(payment.type)}</div>
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span>
                          <div className="mt-1">
                            {getStatusBadge(payment.status, payment.daysOverdue)}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{payment.description}</p>

                      {payment.lastReminder && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                          <Mail className="w-3 h-3" />
                          <span>
                            Último recordatorio: {formatDate(payment.lastReminder)} (
                            {payment.reminderCount} recordatorios enviados)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-[200px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendReminder(payment)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar Recordatorio
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactTenant(payment, 'phone')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Llamar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleContactTenant(payment, 'email')}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateReceipt(payment.id)}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Generar Recibo
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleMarkAsPaid(payment.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Pagado
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
