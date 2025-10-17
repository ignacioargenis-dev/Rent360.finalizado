'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Forzar renderizado dinámico para evitar problemas de autenticación durante build
export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  Home,
  Building,
  FileText,
  CreditCard,
  Star,
  MessageCircle,
  Users,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Plus,
  Eye,
  Edit,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { User, Property, Contract, Payment } from '@/types';
import { ActivityItem } from '@/components/dashboard/ActivityItem';
import UnifiedDashboardLayout from '@/components/layout/UnifiedDashboardLayout';
import { useAuth } from '@/components/auth/AuthProviderSimple';
import { logger } from '@/lib/logger-minimal';

interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  pendingPayments: number;
  averageRating: number;
  totalTenants: number;
  occupancyRate: number; // ✅ AGREGADO: Tasa de ocupación
}

interface RecentActivity {
  id: string;
  type: 'property' | 'contract' | 'payment' | 'message' | 'rating' | 'system';
  title: string;
  description: string;
  date: string;
  status?: string;
}

interface PropertySummary {
  id: string;
  title: string;
  address: string;
  status: string;
  monthlyRent: number;
  tenant?: string;
  contractEnd?: string;
}

export default function OwnerDashboard() {
  const { user, loading: userLoading } = useAuth();
  const router = useRouter();
  const hasLoadedData = useRef(false); // Para evitar cargas múltiples
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeContracts: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    averageRating: 0,
    totalTenants: 0,
    occupancyRate: 0, // ✅ AGREGADO: Tasa de ocupación inicial
  });
  const [recentProperties, setRecentProperties] = useState<PropertySummary[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar datos reales del dashboard desde las APIs de forma secuencial para evitar sobrecarga
      try {
        // ✅ CORREGIDO: Cargar TODAS las propiedades del usuario para estadísticas correctas
        const propertiesResponse = await fetch(
          `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/properties/list?limit=100`,
          {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          }
        );

        let properties = [];
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          properties = propertiesData.properties || [];
        }

        // Pequeña pausa para evitar sobrecarga del servidor
        await new Promise(resolve => setTimeout(resolve, 200));

        // Cargar contratos activos (reducido a 5)
        const contractsResponse = await fetch(
          `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/contracts?status=ACTIVE&limit=5`,
          {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          }
        );

        let contracts = [];
        if (contractsResponse.ok) {
          const contractsData = await contractsResponse.json();
          contracts = contractsData.contracts || [];
        }

        // Pequeña pausa para evitar sobrecarga del servidor
        await new Promise(resolve => setTimeout(resolve, 200));

        // Cargar pagos recientes (reducido a 5)
        const paymentsResponse = await fetch(
          `${typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || ''}/api/payments?limit=5`,
          {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache', Accept: 'application/json' },
          }
        );

        let payments = [];
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          payments = paymentsData.payments || [];
        }

        // ✅ CORREGIDO: Calcular estadísticas basadas en datos reales y consistentes
        const rentedProperties = properties.filter((p: any) => p.status === 'RENTED');
        const totalRevenue = rentedProperties.reduce(
          (sum: number, p: any) => sum + (p.price || 0),
          0
        );
        const pendingPayments = payments.filter((p: any) => p.status === 'PENDING').length;
        const totalTenants = contracts.length; // Usar contratos activos reales, no propiedades con status RENTED

        // ✅ CORREGIDO: Calcular tasa de ocupación basada en contratos activos vs total de propiedades
        const occupancyRate =
          properties.length > 0 ? (contracts.length / properties.length) * 100 : 0;

        // Calcular rating promedio
        const ratings = properties.flatMap((p: any) => p.reviews || []);
        const averageRating =
          ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 0;

        setStats({
          totalProperties: properties.length,
          activeContracts: contracts.length,
          monthlyRevenue: totalRevenue,
          pendingPayments,
          averageRating: Math.round(averageRating * 10) / 10,
          totalTenants,
          occupancyRate: Math.round(occupancyRate * 10) / 10, // ✅ AGREGADO: Tasa de ocupación calculada
        });

        // Formatear propiedades recientes
        const recentProps = properties.slice(0, 3).map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          address: prop.address,
          status: prop.status,
          monthlyRent: prop.price || 0,
          tenant: prop.currentTenant?.name || null,
          contractEnd: prop.currentTenant?.leaseEnd || null,
        }));

        setRecentProperties(recentProps);

        // Crear actividad reciente basada en datos reales
        const activities: RecentActivity[] = [];

        // Agregar actividad de pagos recientes
        payments.slice(0, 2).forEach((payment: any) => {
          activities.push({
            id: `payment-${payment.id}`,
            type: 'payment' as const,
            title: 'Pago recibido',
            description: `Pago de ${payment.amount || 0} CLP recibido`,
            date: payment.createdAt
              ? new Date(payment.createdAt).toISOString().split('T')[0]!
              : new Date().toISOString().split('T')[0]!,
            status: payment.status,
          });
        });

        // Agregar actividad de contratos
        contracts.slice(0, 2).forEach((contract: any) => {
          activities.push({
            id: `contract-${contract.id}`,
            type: 'contract' as const,
            title: 'Nuevo contrato',
            description: `Contrato ${contract.status?.toLowerCase() || 'activo'}`,
            date: contract.createdAt
              ? new Date(contract.createdAt).toISOString().split('T')[0]!
              : new Date().toISOString().split('T')[0]!,
            status: contract.status,
          });
        });

        // Agregar actividad de propiedades recientes - CAMBIADO DE 'property' A 'system'
        properties.slice(0, 1).forEach((prop: any) => {
          activities.push({
            id: `property-${prop.id}`,
            type: 'system' as const, // Cambiado de 'property' a 'system'
            title: 'Nueva propiedad',
            description: `Propiedad "${prop.title}" agregada`,
            date: prop.createdAt
              ? new Date(prop.createdAt).toISOString().split('T')[0]!
              : new Date().toISOString().split('T')[0]!,
            status: prop.status,
          });
        });

        // Si no hay actividad, mostrar mensaje de bienvenida
        if (activities.length === 0) {
          activities.push({
            id: 'welcome',
            type: 'message',
            title: '¡Bienvenido a Rent360!',
            description:
              properties.length === 0
                ? 'Tu cuenta ha sido creada exitosamente. Comienza agregando tu primera propiedad.'
                : 'Tu cuenta está lista. Explora las funcionalidades disponibles.',
            date: new Date().toISOString().split('T')[0]!,
            status: 'INFO',
          });
        }

        setRecentActivity(activities);
      } catch (apiError) {
        logger.warn('Error loading real dashboard data, showing welcome state', {
          error: apiError,
        });

        // Fallback: mostrar estado de bienvenida si fallan las APIs
        setStats({
          totalProperties: 0,
          activeContracts: 0,
          monthlyRevenue: 0,
          pendingPayments: 0,
          averageRating: 0,
          totalTenants: 0,
          occupancyRate: 0, // ✅ AGREGADO: Campo occupancyRate faltante
        });
        setRecentProperties([]);
        setRecentActivity([
          {
            id: 'welcome',
            type: 'message',
            title: '¡Bienvenido a Rent360!',
            description:
              'Tu cuenta ha sido creada exitosamente. Comienza agregando tu primera propiedad.',
            date: new Date().toISOString().split('T')[0]!,
            status: 'INFO',
          },
        ]);
      }

      setLoading(false);
    } catch (error) {
      logger.error('Error loading dashboard data:', { error });
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido al cargar datos';

      // En caso de error, mostrar datos vacíos pero no dejar loading forever
      setStats({
        totalProperties: 0,
        activeContracts: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        averageRating: 0,
        totalTenants: 0,
        occupancyRate: 0, // ✅ AGREGADO: Campo occupancyRate faltante
      });
      setRecentProperties([]);
      setRecentActivity([
        {
          id: 'error',
          type: 'message',
          title: 'Error al cargar datos',
          description: 'Hubo un problema al cargar los datos del dashboard. Inténtalo de nuevo.',
          date: new Date().toISOString().split('T')[0]!,
          status: 'ERROR',
        },
      ]);
      setError(errorMessage);
      setLoading(false);
    }
  }, []); // Removido 'user' de las dependencias para evitar loops infinitos

  useEffect(() => {
    // Solo cargar datos UNA VEZ cuando el usuario esté disponible
    if (user && !hasLoadedData.current) {
      hasLoadedData.current = true; // Marcar como cargado ANTES de la llamada
      loadDashboardData();
    } else if (!user && !userLoading && !hasLoadedData.current) {
      // Usuario no autenticado, mostrar datos vacíos
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Solo depender del ID del usuario, no del objeto completo

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
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-100 text-green-800">Disponible</Badge>;
      case 'RENTED':
        return <Badge className="bg-blue-100 text-blue-800">Arrendado</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completado</Badge>;
      case 'ACTIVE':
        return <Badge className="bg-blue-100 text-blue-800">Activo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Icon mapping for activity items
  const iconMap = {
    property: Building,
    contract: FileText,
    payment: CreditCard,
    message: MessageCircle,
    rating: Star,
    system: Building, // Icono para actividades del sistema
    default: Star,
  };

  // Color mapping for activity items
  const colorMap = {
    property: 'text-blue-600 bg-blue-50',
    contract: 'text-purple-600 bg-purple-50',
    payment: 'text-green-600 bg-green-50',
    message: 'text-orange-600 bg-orange-50',
    rating: 'text-yellow-600 bg-yellow-50',
    system: 'text-blue-600 bg-blue-50', // Color para actividades del sistema
    default: 'text-gray-600 bg-gray-50',
  };

  // Status badge mapping
  const statusBadgeMap = {
    COMPLETED: <Badge className="bg-green-100 text-green-800">Completado</Badge>,
    PENDING: <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>,
    ACTIVE: <Badge className="bg-blue-100 text-blue-800">Activo</Badge>,
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-red-600">Usuario no autenticado</p>
          <p className="text-gray-600 mt-2">Por favor, inicia sesión nuevamente</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <UnifiedDashboardLayout
        user={user}
        title="Panel de Control de Propietario"
        subtitle="Gestiona tus propiedades e ingresos"
      >
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-red-800 mb-2">
                Error al cargar el dashboard
              </h2>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button
              onClick={() => {
                hasLoadedData.current = false; // Resetear para permitir nueva carga
                loadDashboardData();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Intentar de nuevo
            </Button>
          </div>
        </div>
      </UnifiedDashboardLayout>
    );
  }

  return (
    <UnifiedDashboardLayout
      user={user}
      title="Panel de Control de Propietario"
      subtitle="Gestiona tus propiedades e ingresos"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control de Propietario</h1>
            <p className="text-gray-600">Gestiona tus propiedades e ingresos</p>
          </div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Building className="w-8 h-8 text-blue-100" />
                <div className="bg-blue-400 bg-opacity-30 rounded-full p-2">
                  <Building className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-blue-100 mb-1">Propiedades</h3>
              <p className="text-2xl font-bold">{stats.totalProperties}</p>
              <div className="mt-2 h-1 bg-blue-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.totalProperties / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-purple-100" />
                <div className="bg-purple-400 bg-opacity-30 rounded-full p-2">
                  <FileText className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-purple-100 mb-1">Contratos Activos</h3>
              <p className="text-2xl font-bold">{stats.activeContracts}</p>
              <div className="mt-2 h-1 bg-purple-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.activeContracts / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-8 h-8 text-green-100" />
                <div className="bg-green-400 bg-opacity-30 rounded-full p-2">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-green-100 mb-1">Ingresos Mensuales</h3>
              <p className="text-2xl font-bold">{formatPrice(stats.monthlyRevenue)}</p>
              <div className="mt-2 h-1 bg-green-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.monthlyRevenue / 2000000) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-100" />
                <div className="bg-yellow-400 bg-opacity-30 rounded-full p-2">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-yellow-100 mb-1">Pagos Pendientes</h3>
              <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              <div className="mt-2 h-1 bg-yellow-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.pendingPayments / 5) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-orange-100" />
                <div className="bg-orange-400 bg-opacity-30 rounded-full p-2">
                  <Users className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-orange-100 mb-1">Inquilinos</h3>
              <p className="text-2xl font-bold">{stats.totalTenants}</p>
              <div className="mt-2 h-1 bg-orange-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.totalTenants / 10) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <Star className="w-8 h-8 text-amber-100" />
                <div className="bg-amber-400 bg-opacity-30 rounded-full p-2">
                  <Star className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-amber-100 mb-1">Calificación</h3>
              <p className="text-2xl font-bold">{stats.averageRating}</p>
              <div className="mt-2 h-1 bg-amber-400 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${(stats.averageRating / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Acciones Rápidas</h2>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-1 mx-4"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Nueva Propiedad</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Agrega una nueva propiedad a tu catálogo
                </p>
                <Link
                  href="/owner/properties/new"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center"
                >
                  Comenzar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-purple-200 group">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Contratos</h3>
                <p className="text-sm text-gray-600 mb-4">Gestiona tus contratos de arriendo</p>
                <Link
                  href="/owner/contracts"
                  className="text-purple-600 hover:text-purple-800 font-medium text-sm flex items-center"
                >
                  Ver contratos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200 group">
                <div className="bg-gradient-to-br from-green-500 to-green-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Pagos</h3>
                <p className="text-sm text-gray-600 mb-4">Revisa el historial de pagos recibidos</p>
                <Link
                  href="/owner/payments"
                  className="text-green-600 hover:text-green-800 font-medium text-sm flex items-center"
                >
                  Ver pagos
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200 group">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Reportes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Analiza el rendimiento de tus propiedades
                </p>
                <Link
                  href="/owner/reports"
                  className="text-orange-600 hover:text-orange-800 font-medium text-sm flex items-center"
                >
                  Ver reportes
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Properties */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold text-white">Mis Propiedades</h2>
                      <p className="text-blue-100 text-sm">Estado actual de tus propiedades</p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 border-0">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Propiedad
                      </Button>
                      <Button
                        className="bg-green-600 text-white hover:bg-green-700 border-0"
                        onClick={() => router.push('/owner/runners')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Buscar Runners
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentProperties.map(property => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-300 hover:border-blue-300"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{property.title}</h3>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {property.address}
                            </p>
                          </div>
                          {getStatusBadge(property.status)}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-blue-600 font-medium">Arriendo mensual</p>
                            <p className="font-bold text-blue-800">
                              {formatPrice(property.monthlyRent)}
                            </p>
                          </div>
                          {property.tenant && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs text-green-600 font-medium">Inquilino</p>
                              <p className="font-bold text-green-800">{property.tenant}</p>
                            </div>
                          )}
                        </div>

                        {property.contractEnd && (
                          <div className="flex items-center text-sm text-gray-600 mb-4 bg-yellow-50 rounded-lg p-3">
                            <Calendar className="w-4 h-4 mr-2 text-yellow-600" />
                            <span className="font-medium">
                              Fin del contrato: {formatDate(property.contractEnd)}
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-blue-500 hover:text-blue-600"
                            onClick={() => router.push(`/owner/properties/${property.id}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver detalles
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 hover:border-purple-500 hover:text-purple-600"
                            onClick={() => router.push(`/owner/properties/${property.id}/edit`)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          {property.status === 'AVAILABLE' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                logger.info('Iniciando búsqueda de inquilino para propiedad:', {
                                  propertyId: property.id,
                                });
                                // Navegar a página de búsqueda de inquilinos con filtros pre-aplicados
                                router.push(
                                  `/owner/tenants?propertyId=${property.id}&search=${encodeURIComponent(property.title)}`
                                );
                              }}
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Buscar inquilino
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
                  <p className="text-purple-100 text-sm">Últimas acciones en tu cuenta</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {recentActivity.map(activity => {
                      // Mapear el tipo de actividad al tipo esperado por ActivityItem
                      const activityType = activity.type === 'property' ? 'system' : activity.type;
                      return (
                        <ActivityItem
                          key={activity.id}
                          id={activity.id}
                          type={
                            activityType as
                              | 'payment'
                              | 'maintenance'
                              | 'contract'
                              | 'message'
                              | 'system'
                          }
                          title={activity.title}
                          description={activity.description}
                          user={{
                            id: '1',
                            name: 'Usuario',
                            email: 'usuario@ejemplo.com',
                          }}
                          timestamp={new Date(activity.date)}
                          icon={iconMap[activityType as keyof typeof iconMap] || Home}
                          onView={() => {}}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Resumen de Rendimiento
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-blue-800">Tasa de Ocupación</span>
                      <span className="font-bold text-blue-600">67%</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-green-800">Ingresos Anuales</span>
                      <span className="font-bold text-green-600">
                        {formatPrice(stats.monthlyRevenue * 12)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-yellow-800">
                        Propiedades Disponibles
                      </span>
                      <span className="font-bold text-yellow-600">
                        {recentProperties.filter(p => p.status === 'AVAILABLE').length}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-purple-800">
                        Satisfacción de Inquilinos
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600">{stats.averageRating}</span>
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
