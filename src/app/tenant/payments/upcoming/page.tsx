'use client';

// Build fix - force update

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Calendar,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface UpcomingPayment {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  amount: number;
  dueDate: string;
  status: 'upcoming' | 'overdue' | 'due_today';
  type: 'rent' | 'deposit' | 'utilities' | 'maintenance';
  description: string;
}

interface PaymentStats {
  totalUpcoming: number;
  totalAmount: number;
  overdueCount: number;
  dueTodayCount: number;
}

export default function TenantUpcomingPaymentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [payments, setPayments] = useState<UpcomingPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalUpcoming: 0,
    totalAmount: 0,
    overdueCount: 0,
    dueTodayCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

    const loadPaymentsData = async () => {
      try {
        // Mock upcoming payments data
        const mockPayments: UpcomingPayment[] = [
          {
            id: '1',
            propertyTitle: 'Apartamento Centro',
            propertyAddress: 'Av. Providencia 123, Santiago',
            amount: 450000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
            status: 'upcoming',
            type: 'rent',
            description: 'Pago de arriendo mensual',
          },
          {
            id: '2',
            propertyTitle: 'Casa Los Dominicos',
            propertyAddress: 'Camino Los Dominicos 456, Las Condes',
            amount: 25000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
            status: 'due_today',
            type: 'utilities',
            description: 'Gastos comunes',
          },
          {
            id: '3',
            propertyTitle: 'Oficina Las Condes',
            propertyAddress: 'Av. Apoquindo 789, Las Condes',
            amount: 120000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
            status: 'overdue',
            type: 'maintenance',
            description: 'Mantenimiento mensual',
          },
          {
            id: '4',
            propertyTitle: 'Local Comercial',
            propertyAddress: 'Av. Libertador 321, Providencia',
            amount: 80000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
            status: 'upcoming',
            type: 'rent',
            description: 'Arriendo comercial',
          },
          {
            id: '5',
            propertyTitle: 'Apartamento Centro',
            propertyAddress: 'Av. Providencia 123, Santiago',
            amount: 100000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(), // 14 days from now
            status: 'upcoming',
            type: 'deposit',
            description: 'Depósito de garantía',
          },
        ];

        setPayments(mockPayments);

        // Calculate stats
        const totalAmount = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const overdueCount = mockPayments.filter(p => p.status === 'overdue').length;
        const dueTodayCount = mockPayments.filter(p => p.status === 'due_today').length;

        const paymentStats: PaymentStats = {
          totalUpcoming: mockPayments.length,
          totalAmount,
          overdueCount,
          dueTodayCount,
        };

        setStats(paymentStats);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading payments data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadPaymentsData();
  }, []);

  const handlePayNow = async (paymentId: string) => {
    // Redirigir al portal de pagos específico
    router.push(`/tenant/payments/${paymentId}/pay`);
  };

  const handleViewDetails = async (paymentId: string) => {
    // Navigate to payment details
    router.push(`/tenant/payments/${paymentId}`);
  };

  const handleDownloadReceipt = async (paymentId: string) => {
    // Simular descarga de recibo (por ahora genera un archivo de texto)
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      const receiptContent = `RECIBO DE PAGO PENDIENTE\n\nID de Pago: ${payment.id}\nMonto: $${payment.amount}\nFecha límite: ${payment.dueDate}\nEstado: ${payment.status}\n\nRent360 - Sistema de Gestión Inmobiliaria`;
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recibo-pendiente-${paymentId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'due_today':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Próximo</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Vencido</Badge>;
      case 'due_today':
        return <Badge className="bg-orange-100 text-orange-800">Vence Hoy</Badge>;
      default:
        return <Badge>Desconocido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'due_today':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'rent':
        return <CreditCard className="w-5 h-5" />;
      case 'deposit':
        return <DollarSign className="w-5 h-5" />;
      case 'utilities':
        return <RefreshCw className="w-5 h-5" />;
      case 'maintenance':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    }
    if (diffDays === 1) {
      return 'Mañana';
    }
    if (diffDays === -1) {
      return 'Ayer';
    }
    if (diffDays < -1) {
      return `Hace ${Math.abs(diffDays)} días`;
    }

    return `En ${diffDays} días`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando pagos próximos...</p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedDashboardLayout
      title="Próximos Pagos"
      subtitle="Gestiona tus pagos próximos y vencidos"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Próximos Pagos</h1>
            <p className="text-gray-600">Gestiona tus pagos próximos y vencidos</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Próximos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUpcoming}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
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
                  <p className="text-sm font-medium text-gray-600">Vencen Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.dueTodayCount}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <CardTitle>Pagos Próximos</CardTitle>
            <CardDescription>Todos tus pagos próximos y pendientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.map(payment => (
                <Card key={payment.id} className={`border-l-4 ${getStatusColor(payment.status)}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
                          {getTypeIcon(payment.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{payment.propertyTitle}</h3>
                            {getStatusBadge(payment.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{payment.propertyAddress}</p>
                          <p className="text-sm text-gray-600 mb-2">{payment.description}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              <span>{formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(payment.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatRelativeTime(payment.dueDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              <span className="capitalize">{payment.type}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(payment.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === 'upcoming' || payment.status === 'due_today' ? (
                          <Button size="sm" onClick={() => handlePayNow(payment.id)}>
                            Pagar Ahora
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedDashboardLayout>
  );
}
