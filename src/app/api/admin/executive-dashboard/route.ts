import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';
import { CommissionService } from '@/lib/commission-service';

interface DashboardMetrics {
  // Métricas Generales
  totalUsers: number;
  activeUsers: number;
  totalProperties: number;
  availableProperties: number;
  totalContracts: number;
  activeContracts: number;

  // Métricas Financieras
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  processedPayments: number;
  averageCommission: number;

  // Métricas de Corredores
  totalBrokers: number;
  activeBrokers: number;
  topPerformingBrokers: Array<{
    id: string;
    name: string;
    totalCommissions: number;
    activeContracts: number;
    averageRating: number;
    monthlyRevenue: number;
    growth: number;
  }>;
  brokerStats: {
    averageCommission: number;
    totalActiveContracts: number;
    topPropertyType: string;
    averageResponseTime: number;
  };

  // Métricas de Comisiones
  totalCommissions: number;
  pendingCommissions: number;
  paidCommissions: number;
  commissionTrend: Array<{
    date: string;
    value: number;
    previousValue: number;
  }>;

  // Payouts
  pendingPayouts: Array<{
    brokerId: string;
    brokerName: string;
    amount: number;
    period: {
      start: string;
      end: string;
    };
    status: 'pending' | 'processing' | 'paid';
  }>;
  recentPayouts: Array<{
    id: string;
    brokerName: string;
    amount: number;
    processedAt: string;
    method: string;
    status: 'paid' | 'failed';
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    logger.info('Fetching executive dashboard data', { timeframe });

    // Calcular fechas según timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Obtener métricas básicas
    const [
      totalUsers,
      activeUsers,
      totalProperties,
      availableProperties,
      totalContracts,
      activeContracts,
      totalPayments,
      pendingPayments,
      processedPayments,
      totalRevenue
    ] = await Promise.all([
      // Usuarios
      db.user.count(),
      db.user.count({ where: { isActive: true } }),

      // Propiedades
      db.property.count(),
      db.property.count({ where: { status: 'AVAILABLE' } }),

      // Contratos
      db.contract.count(),
      db.contract.count({ where: { status: 'ACTIVE' } }),

      // Pagos
      db.payment.count(),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.payment.count({ where: { status: 'PAID' } }),
      db.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0)
    ]);

    // Obtener corredores y sus estadísticas
    const brokers = await db.user.findMany({
      where: { role: 'BROKER' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            contractsAsBroker: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      }
    });

    const activeBrokers = brokers.filter(b => b.isActive).length;

    // Calcular estadísticas de corredores
    let totalCommissions = 0;
    let totalActiveContracts = 0;
    const brokerCommissions: Array<{
      id: string;
      name: string;
      commissions: number;
      activeContracts: number;
    }> = [];

    for (const broker of brokers) {
      try {
        const brokerStats = await CommissionService.getBrokerCommissionStats(broker.id);
        totalCommissions += brokerStats.totalCommissionValue;
        totalActiveContracts += brokerStats.totalContracts;

        brokerCommissions.push({
          id: broker.id,
          name: broker.name,
          commissions: brokerStats.totalCommissionValue,
          activeContracts: brokerStats.totalContracts
        });
      } catch (error) {
        logger.warn('Error calculating broker stats', { brokerId: broker.id, error });
      }
    }

    // Top performing brokers
    const topPerformingBrokers = brokerCommissions
      .sort((a, b) => b.commissions - a.commissions)
      .slice(0, 5)
      .map((broker, index) => ({
        id: broker.id,
        name: broker.name,
        totalCommissions: broker.commissions,
        activeContracts: broker.activeContracts,
        averageRating: 4.5, // Placeholder - implementar sistema de ratings
        monthlyRevenue: broker.commissions,
        growth: Math.random() * 20 - 5 // Placeholder - calcular crecimiento real
      }));

    // Estadísticas generales de corredores
    const averageCommission = brokerCommissions.length > 0
      ? totalCommissions / brokerCommissions.length
      : 0;

    // Calcular tendencias de comisiones (últimos 6 meses)
    const commissionTrend: Array<{ date: string; value: number; previousValue: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      // Aquí iría la lógica real para calcular comisiones por mes
      // Por ahora usamos datos simulados
      const monthlyCommissions = Math.floor(totalCommissions * (0.8 + Math.random() * 0.4));
      const previousMonthCommissions = i > 0
        ? Math.floor(totalCommissions * (0.8 + Math.random() * 0.4))
        : monthlyCommissions;

      commissionTrend.push({
        date: monthStart.toISOString().split('T')[0],
        value: monthlyCommissions,
        previousValue: previousMonthCommissions
      });
    }

    // Simular payouts pendientes (en producción esto vendría de una tabla real)
    const pendingPayouts = brokerCommissions
      .filter(broker => broker.commissions > 0)
      .slice(0, 3)
      .map(broker => ({
        brokerId: broker.id,
        brokerName: broker.name,
        amount: broker.commissions * 0.8, // 80% listo para payout
        period: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        status: 'pending' as const
      }));

    // Simular payouts recientes
    const recentPayouts = brokerCommissions
      .filter(broker => broker.commissions > 0)
      .slice(0, 5)
      .map((broker, index) => ({
        id: `payout_${broker.id}_${Date.now() - index * 86400000}`,
        brokerName: broker.name,
        amount: Math.floor(broker.commissions * 0.9),
        processedAt: new Date(Date.now() - index * 86400000).toISOString(),
        method: 'bank_transfer',
        status: 'paid' as const
      }));

    const monthlyRevenue = Math.floor(totalRevenue * 0.3); // Estimación mensual

    const dashboardData: DashboardMetrics = {
      // Métricas Generales
      totalUsers,
      activeUsers,
      totalProperties,
      availableProperties,
      totalContracts,
      activeContracts,

      // Métricas Financieras
      totalRevenue,
      monthlyRevenue,
      pendingPayments,
      processedPayments,
      averageCommission,

      // Métricas de Corredores
      totalBrokers: brokers.length,
      activeBrokers,
      topPerformingBrokers,
      brokerStats: {
        averageCommission,
        totalActiveContracts,
        topPropertyType: 'Apartamento', // Placeholder
        averageResponseTime: 2.3 // Placeholder
      },

      // Métricas de Comisiones
      totalCommissions,
      pendingCommissions: totalCommissions * 0.2, // 20% pendiente
      paidCommissions: totalCommissions * 0.8, // 80% pagado
      commissionTrend,

      // Payouts
      pendingPayouts,
      recentPayouts
    };

    logger.info('Executive dashboard data generated', {
      timeframe,
      totalUsers,
      totalRevenue,
      activeBrokers
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error generating executive dashboard data:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
