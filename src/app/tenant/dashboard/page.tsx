'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import {
  Home,
  DollarSign,
  Calendar,
  Clock,
  Wrench,
  MessageCircle,
  FileText,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Bell,
  TrendingUp,
  Eye,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { User } from '@/types';

interface RentalContract {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  landlordName: string;
  landlordEmail: string;
  landlordPhone: string;
  monthlyRent: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'ending_soon' | 'expired';
  nextPaymentDate: string;
  securityDeposit: number;
}

interface Payment {
  id: string;
  contractId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'partially_paid';
  description: string;
  paymentDate?: string;
}

interface MaintenanceRequest {
  id: string;
  contractId: string;
  propertyTitle: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  resolvedAt?: string;
  estimatedCost?: number;
}

interface TenantStats {
  activeContracts: number;
  pendingPayments: number;
  overduePayments: number;
  maintenanceRequests: number;
  unreadMessages: number;
  totalMonthlyRent: number;
}

export default function TenantDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [stats, setStats] = useState<TenantStats>({
    activeContracts: 0,
    pendingPayments: 0,
    overduePayments: 0,
    maintenanceRequests: 0,
    unreadMessages: 0,
    totalMonthlyRent: 0,
  });
  const [loading, setLoading] = useState(true);

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

    const loadTenantData = async () => {
      try {
        // Mock tenant data
        const mockContracts: RentalContract[] = [
          {
            id: '1',
            propertyTitle: 'Departamento Moderno Las Condes',
            propertyAddress: 'Las Condes 123, Las Condes, Santiago',
            landlordName: 'María González',
            landlordEmail: 'maria.gonzalez@email.com',
            landlordPhone: '+56912345678',
            monthlyRent: 450000,
            startDate: '2024-01-01',
            endDate: '2025-01-01',
            status: 'active',
            nextPaymentDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // En 5 días
            securityDeposit: 900000,
          },
        ];

        const mockPayments: Payment[] = [
          {
            id: '1',
            contractId: '1',
            amount: 450000,
            dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
            status: 'pending',
            description: 'Arriendo Enero 2025',
          },
          {
            id: '2',
            contractId: '1',
            amount: 450000,
            dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
            status: 'paid',
            description: 'Arriendo Diciembre 2024',
            paymentDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
          },
        ];

        const mockMaintenance: MaintenanceRequest[] = [
          {
            id: '1',
            contractId: '1',
            propertyTitle: 'Departamento Moderno Las Condes',
            title: 'Fuga en grifería de cocina',
            description: 'La grifería de la cocina tiene una fuga constante',
            status: 'in_progress',
            priority: 'medium',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            estimatedCost: 25000,
          },
        ];

        setContracts(mockContracts);
        setPayments(mockPayments);
        setMaintenanceRequests(mockMaintenance);

        // Calculate stats
        const activeContracts = mockContracts.filter(c => c.status === 'active').length;
        const pendingPayments = mockPayments.filter(p => p.status === 'pending').length;
        const overduePayments = mockPayments.filter(
          p => p.status === 'pending' && new Date(p.dueDate) < new Date()
        ).length;
        const totalMonthlyRent = mockContracts.reduce((sum, c) => sum + c.monthlyRent, 0);

        setStats({
          activeContracts,
          pendingPayments,
          overduePayments,
          maintenanceRequests: mockMaintenance.length,
          unreadMessages: 2, // Mock
          totalMonthlyRent,
        });

        setLoading(false);
      } catch (error) {
        logger.error('Error loading tenant data:', {
          error: error instanceof Error ? error.message : String(error),
        });
        setLoading(false);
      }
    };

    loadUserData();
    loadTenantData();
  }, []);

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
      partially_paid: { label: 'Pago Parcial', color: 'bg-orange-100 text-orange-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getMaintenanceStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completado', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-green-100 text-green-800' },
      medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
      high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
      urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;

    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const handlePayRent = (paymentId: string) => {
    window.open(`/tenant/payments/${paymentId}/pay`, '_blank');
  };

  const handleContactLandlord = (contract: RentalContract) => {
    const subject = encodeURIComponent(`Consulta sobre propiedad: ${contract.propertyTitle}`);
    const body = encodeURIComponent(
      `Hola ${contract.landlordName},\n\nMe comunico respecto a la propiedad: ${contract.propertyTitle}\n\nAtentamente,\n${user?.name || 'Inquilino'}`
    );
    window.open(`mailto:${contract.landlordEmail}?subject=${subject}&body=${body}`);
  };

  const handleNewMaintenanceRequest = () => {
    window.open('/tenant/maintenance', '_blank');
  };

  const handleViewMessages = () => {
    window.open('/tenant/messages', '_blank');
  };

  const handleViewContractDetails = (contractId: string) => {
    window.open(`/tenant/contracts`, '_blank');
  };

  const handleViewMaintenanceDetails = (maintenanceId: string) => {
    window.open('/tenant/maintenance', '_blank');
  };

  if (loading) {
    return (
      <UnifiedDashboardLayout title="Dashboard Inquilino" subtitle="Cargando...">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Panel de Control de Inquilino"
      subtitle="Gestiona tus contratos y pagos de arriendo"
    >
      <div className="container mx-auto px-4 py-6">
        {/* Header with actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-600">Bienvenido de vuelta, {user?.name || 'Inquilino'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleNewMaintenanceRequest}>
              <Wrench className="w-4 h-4 mr-2" />
              Solicitar Mantenimiento
            </Button>
            <Button variant="outline" onClick={handleViewMessages}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Mensajes ({stats.unreadMessages})
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Contratos Activos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeContracts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{stats.pendingPayments}</p>
                  {stats.overduePayments > 0 && (
                    <p className="text-xs text-red-600">{stats.overduePayments} vencidos</p>
                  )}
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Arriendo Mensual</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(stats.totalMonthlyRent)}
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
                  <p className="text-sm font-medium text-gray-600">Solicitudes Mant.</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.maintenanceRequests}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Contracts and Payments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Active Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Mis Contratos de Arriendo
                </CardTitle>
                <CardDescription>Propiedades que tienes alquiladas actualmente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contracts.map(contract => (
                    <div key={contract.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{contract.propertyTitle}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {contract.propertyAddress}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Propietario:</span>
                          <p className="font-medium">{contract.landlordName}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Arriendo mensual:</span>
                          <p className="font-medium">{formatCurrency(contract.monthlyRent)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Próximo pago:</span>
                          <p className="font-medium">{formatDate(contract.nextPaymentDate)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Fin contrato:</span>
                          <p className="font-medium">{formatDate(contract.endDate)}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactLandlord(contract)}
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Contactar Propietario
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewContractDetails(contract.id)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  ))}

                  {contracts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No tienes contratos activos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pending Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                  Pagos Pendientes
                </CardTitle>
                <CardDescription>Revisa y realiza tus pagos de arriendo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payments
                    .filter(p => p.status === 'pending')
                    .map(payment => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${new Date(payment.dueDate) < new Date() ? 'bg-red-100' : 'bg-yellow-100'}`}
                          >
                            <CreditCard
                              className={`w-4 h-4 ${new Date(payment.dueDate) < new Date() ? 'text-red-600' : 'text-yellow-600'}`}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{payment.description}</p>
                            <p className="text-sm text-gray-600">
                              Vence: {formatDate(payment.dueDate)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                            {new Date(payment.dueDate) < new Date() && (
                              <p className="text-xs text-red-600">Vencido</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePayRent(payment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Pagar
                          </Button>
                        </div>
                      </div>
                    ))}

                  {payments.filter(p => p.status === 'pending').length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No tienes pagos pendientes</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Maintenance and Messages */}
          <div className="space-y-6">
            {/* Maintenance Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-purple-600" />
                  Solicitudes de Mantenimiento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {maintenanceRequests.map(request => (
                    <div key={request.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{request.title}</h4>
                        {getMaintenanceStatusBadge(request.status)}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{request.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(request.priority)}
                          {request.estimatedCost && (
                            <span className="text-xs text-gray-500">
                              Est. {formatCurrency(request.estimatedCost)}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewMaintenanceDetails(request.id)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}

                  {maintenanceRequests.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Sin solicitudes activas</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleNewMaintenanceRequest}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Solicitud Mant.
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleViewMessages}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ver Mensajes ({stats.unreadMessages})
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('/tenant/contracts', '_blank')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Contratos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open('/tenant/payments/upcoming', '_blank')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendario de Pagos
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pago realizado</p>
                      <p className="text-xs text-gray-600">Arriendo Diciembre 2024</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Solicitud enviada</p>
                      <p className="text-xs text-gray-600">Fuga en grifería de cocina</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Bell className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Recordatorio</p>
                      <p className="text-xs text-gray-600">Pago vence en 5 días</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
