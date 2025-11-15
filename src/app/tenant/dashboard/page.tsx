'use client';

import React, { useState, useEffect } from 'react';

// Forzar renderizado dinámico para datos en tiempo real
export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidar cada 30 segundos para datos frescos
import { logger } from '@/lib/logger-minimal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useRouter } from 'next/navigation';
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
  User,
} from 'lucide-react';
import Link from 'next/link';
import { User as UserType } from '@/types';

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
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [contracts, setContracts] = useState<RentalContract[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [scheduledVisits, setScheduledVisits] = useState<any[]>([]);
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

    const loadUnreadMessagesCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Actualizar solo el contador de mensajes no leídos
            setStats(prev => ({
              ...prev,
              unreadMessages: data.unreadCount,
            }));
          }
        }
      } catch (error) {
        logger.error('Error loading unread messages count:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    const loadTenantData = async () => {
      try {
        // Cargar datos reales desde la API
        const dashboardResponse = await fetch('/api/tenant/dashboard', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
        });

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          const data = dashboardData.data || dashboardData;

          // Actualizar estadísticas
          setStats({
            activeContracts: data.stats?.activeContracts || 0,
            pendingPayments: data.stats?.pendingPayments || 0,
            overduePayments: 0, // Calcular desde pagos
            maintenanceRequests: data.stats?.openMaintenance || 0,
            unreadMessages: data.stats?.unreadNotifications || 0,
            totalMonthlyRent: 0, // Calcular desde contratos
          });

          // Cargar contratos reales
          const contractsResponse = await fetch('/api/contracts?status=ACTIVE&limit=10', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          });
          if (contractsResponse.ok) {
            const contractsData = await contractsResponse.json();
            const activeContracts = (contractsData.contracts || []).map((c: any) => ({
              id: c.id,
              propertyTitle: c.property?.title || 'Propiedad',
              propertyAddress: c.property?.address || '',
              landlordName: c.property?.owner?.name || 'Propietario',
              landlordEmail: c.property?.owner?.email || '',
              landlordPhone: c.property?.owner?.phone || '',
              monthlyRent: c.monthlyRent || 0,
              startDate: c.startDate || c.createdAt,
              endDate: c.endDate || '',
              status: c.status?.toLowerCase() || 'active',
              nextPaymentDate: c.nextPaymentDate || '',
              securityDeposit: c.securityDeposit || 0,
            }));
            setContracts(activeContracts);

            // Calcular total mensual
            const totalRent = activeContracts.reduce(
              (sum: number, c: any) => sum + (c.monthlyRent || 0),
              0
            );
            setStats(prev => ({ ...prev, totalMonthlyRent: totalRent }));
          }

          // Cargar pagos reales
          const paymentsResponse = await fetch('/api/payments?limit=10', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          });
          if (paymentsResponse.ok) {
            const paymentsData = await paymentsResponse.json();
            const allPayments = (paymentsData.payments || []).map((p: any) => ({
              id: p.id,
              contractId: p.contractId,
              amount: p.amount || 0,
              dueDate: p.dueDate || p.createdAt,
              status: p.status?.toLowerCase() || 'pending',
              description:
                p.description ||
                `Pago ${new Date(p.dueDate || p.createdAt).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`,
              paymentDate: p.paymentDate || null,
            }));
            setPayments(allPayments);

            // Calcular pagos vencidos
            const overdue = allPayments.filter(
              (p: any) => p.status === 'pending' && new Date(p.dueDate) < new Date()
            ).length;
            setStats(prev => ({ ...prev, overduePayments: overdue }));
          }

          // Cargar solicitudes de mantenimiento reales
          const maintenanceResponse = await fetch('/api/maintenance?limit=10', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          });
          if (maintenanceResponse.ok) {
            const maintenanceData = await maintenanceResponse.json();
            const allMaintenance = (
              maintenanceData.requests ||
              maintenanceData.maintenance ||
              []
            ).map((m: any) => ({
              id: m.id,
              contractId: m.contractId || '',
              propertyTitle: m.property?.title || 'Propiedad',
              title: m.title || m.description?.substring(0, 50) || 'Solicitud de mantenimiento',
              description: m.description || '',
              status: m.status?.toLowerCase() || 'pending',
              priority: m.priority?.toLowerCase() || 'medium',
              createdAt: m.createdAt || new Date().toISOString(),
              resolvedAt: m.resolvedAt || null,
              estimatedCost: m.estimatedCost || null,
            }));
            setMaintenanceRequests(allMaintenance);
          }

          // Cargar actividad reciente desde la API
          if (data.recentActivity && Array.isArray(data.recentActivity)) {
            setRecentActivity(data.recentActivity);
          } else {
            setRecentActivity([]);
          }

          // Cargar visitas programadas
          const visitsResponse = await fetch('/api/tenant/visits/scheduled', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          });
          if (visitsResponse.ok) {
            const visitsData = await visitsResponse.json();
            setScheduledVisits(visitsData.visits || []);
          }
        } else {
          // Si falla la API, mostrar dashboard vacío
          setContracts([]);
          setPayments([]);
          setMaintenanceRequests([]);
          setRecentActivity([]);
          setStats({
            activeContracts: 0,
            pendingPayments: 0,
            overduePayments: 0,
            maintenanceRequests: 0,
            unreadMessages: 0,
            totalMonthlyRent: 0,
          });
        }

        // Código legacy eliminado - ahora siempre usamos datos reales de la API

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
    loadUnreadMessagesCount();

    // Actualizar contador cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadMessagesCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Recarga silenciosa de visitas programadas cada 30 segundos
  useEffect(() => {
    const loadScheduledVisits = async () => {
      try {
        const visitsResponse = await fetch('/api/tenant/visits/scheduled', {
          credentials: 'include',
          headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
        });
        if (visitsResponse.ok) {
          const visitsData = await visitsResponse.json();
          setScheduledVisits(visitsData.visits || []);
        }
      } catch (error) {
        // Silenciosamente ignorar errores en refresh automático
        logger.debug('Error en refresh silencioso de visitas:', error);
      }
    };

    // Cargar inmediatamente
    loadScheduledVisits();

    // Recargar cada 30 segundos
    const interval = setInterval(loadScheduledVisits, 30000);

    return () => clearInterval(interval);
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
    router.push(`/tenant/payments/${paymentId}/pay`);
  };

  const handleContactLandlord = (contract: RentalContract) => {
    // Crear conversación con el propietario usando el sistema de mensajería
    const recipientData = {
      id: `landlord_${contract.id}`,
      name: contract.landlordName,
      email: contract.landlordEmail,
      type: 'landlord' as const,
      contractId: contract.id,
      propertyTitle: contract.propertyTitle,
    };

    sessionStorage.setItem('newMessageRecipient', JSON.stringify(recipientData));
    router.push('/tenant/messages?new=true');
  };

  const handleNewMaintenanceRequest = () => {
    router.push('/tenant/maintenance');
  };

  const handleViewMessages = () => {
    router.push('/tenant/messages');
  };

  const handleViewContractDetails = (contractId: string) => {
    router.push(`/tenant/contracts/${contractId}`);
  };

  const handleViewMaintenanceDetails = (maintenanceId: string) => {
    router.push(`/tenant/maintenance/${maintenanceId}`);
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

        {/* Welcome message for new users */}
        {(() => {
          const isNewUser =
            !user?.createdAt || Date.now() - new Date(user.createdAt).getTime() < 300000; // 5 minutos
          return isNewUser ? (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      ¡Bienvenido a Rent360, {user?.name}!
                    </h3>
                    <p className="text-blue-700 mb-4">
                      Tu cuenta ha sido creada exitosamente. Comienza explorando la plataforma y
                      gestionando tus contratos de arriendo.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Explorar Contratos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Ver Pagos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Contactar Soporte
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null;
        })()}

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
            {/* Visitas Programadas - Card Dinámico */}
            {scheduledVisits.length > 0 && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Visitas Programadas
                  </CardTitle>
                  <CardDescription>
                    Próximas visitas a propiedades que has solicitado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {scheduledVisits.map(visit => {
                      const scheduledDate = new Date(visit.scheduledAt);
                      const formattedDate = scheduledDate.toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      });
                      const formattedTime = scheduledDate.toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <div
                          key={visit.id}
                          className="bg-white rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {visit.property.title}
                              </h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                                <MapPin className="w-3 h-3" />
                                {visit.property.address}, {visit.property.commune}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-700">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {formattedDate}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formattedTime}
                                </span>
                                {visit.runner && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {visit.runner.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={
                                visit.status === 'SCHEDULED' || visit.status === 'CONFIRMED'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {visit.status === 'SCHEDULED' || visit.status === 'CONFIRMED'
                                ? 'Programada'
                                : 'Pendiente'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

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
                  onClick={() => router.push('/tenant/contracts')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Ver Contratos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/tenant/payments/upcoming')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendario de Pagos
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push('/support/tickets')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Contactar Soporte
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
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((activity: any) => {
                      const getIcon = () => {
                        if (activity.icon === 'checkCircle' || activity.type === 'payment') {
                          return <CheckCircle className="w-4 h-4 text-green-600" />;
                        }
                        if (activity.icon === 'wrench' || activity.type === 'maintenance') {
                          return <Wrench className="w-4 h-4 text-blue-600" />;
                        }
                        if (activity.icon === 'fileText' || activity.type === 'contract') {
                          return <FileText className="w-4 h-4 text-blue-600" />;
                        }
                        return <Bell className="w-4 h-4 text-yellow-600" />;
                      };

                      const getBgColor = () => {
                        if (activity.color === 'green') {
                          return 'bg-green-100';
                        }
                        if (activity.color === 'blue') {
                          return 'bg-blue-100';
                        }
                        if (activity.color === 'yellow') {
                          return 'bg-yellow-100';
                        }
                        if (activity.color === 'red') {
                          return 'bg-red-100';
                        }
                        return 'bg-gray-100';
                      };

                      const formatDate = (dateString: string) => {
                        try {
                          const date = new Date(dateString);
                          const now = new Date();
                          const diffMs = now.getTime() - date.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                          if (diffDays === 0) {
                            return 'Hoy';
                          }
                          if (diffDays === 1) {
                            return 'Ayer';
                          }
                          if (diffDays < 7) {
                            return `Hace ${diffDays} días`;
                          }
                          return date.toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short',
                          });
                        } catch {
                          return '';
                        }
                      };

                      return (
                        <div key={activity.id} className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 ${getBgColor()} rounded-full flex items-center justify-center flex-shrink-0`}
                          >
                            {getIcon()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-gray-600 truncate">{activity.description}</p>
                            {activity.date && (
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(activity.date)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No hay actividad reciente</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
