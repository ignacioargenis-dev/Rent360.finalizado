import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { withCache, CacheKeys, ANALYTICS_DASHBOARD_TTL } from '@/lib/cache';
import { preloadCommonData } from '@/lib/query-optimization';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden acceder a analytics
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30d';

    // Usar cache para analytics
    const cacheKey = `${CacheKeys.ANALYTICS_DASHBOARD}_${timeframe}`;
    const analyticsData = await withCache(
      cacheKey,
      () => generateAnalyticsData(timeframe),
      ANALYTICS_DASHBOARD_TTL
    );

    return NextResponse.json({
      success: true,
      data: analyticsData,
      timeframe,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error obteniendo analytics:', { error });
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Función separada para generar datos de analytics (cacheable)
async function generateAnalyticsData(timeframe: string) {
  // Calcular fechas según el timeframe
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

  // Pre-cargar datos comunes para optimización
  const commonData = await preloadCommonData();

  // Obtener métricas básicas usando consultas optimizadas
  const [
    totalUsers,
    activeUsers,
    totalProperties,
    availableProperties,
    rentedProperties,
    totalContracts,
    activeContracts,
      totalPayments,
      pendingPayments,
      completedPayments,
      totalRevenue
    ] = await Promise.all([
      // Usuarios totales
      db.user.count(),

      // Usuarios activos (con contratos activos)
      db.user.count({
        where: {
          contractsAsTenant: {
            some: {
              status: { in: ['ACTIVE', 'PENDING'] }
            }
          }
        }
      }),

      // Propiedades totales
      db.property.count(),

      // Propiedades disponibles
      db.property.count({
        where: { status: 'AVAILABLE' }
      }),

      // Propiedades rentadas
      db.property.count({
        where: { status: 'RENTED' }
      }),

      // Contratos totales
      db.contract.count(),

      // Contratos activos
      db.contract.count({
        where: { status: { in: ['ACTIVE', 'PENDING'] } }
      }),

      // Pagos totales
      db.payment.count(),

      // Pagos pendientes
      db.payment.count({
        where: { status: 'PENDING' }
      }),

      // Pagos completados
      db.payment.count({
        where: { status: 'COMPLETED' }
      }),

      // Ingresos totales
      db.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      }).then(result => result._sum.amount || 0)
    ]);

    // Obtener distribución de usuarios por rol
    const userRoleDistribution = await db.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    // Calcular crecimiento de usuarios (últimos 30 días vs anteriores 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      usersLast30Days,
      usersPrevious30Days
    ] = await Promise.all([
      db.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      db.user.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ]);

    const userGrowthRate = usersPrevious30Days > 0
      ? ((usersLast30Days - usersPrevious30Days) / usersPrevious30Days) * 100
      : 0;

    // Calcular crecimiento de contratos
    const [
      contractsLast30Days,
      contractsPrevious30Days
    ] = await Promise.all([
      db.contract.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      db.contract.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ]);

    const contractGrowthRate = contractsPrevious30Days > 0
      ? ((contractsLast30Days - contractsPrevious30Days) / contractsPrevious30Days) * 100
      : 0;

    // Obtener propiedades más populares (por número de contratos)
    const popularProperties = await db.property.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        _count: {
          select: { contracts: true }
        }
      },
      orderBy: {
        contracts: { _count: 'desc' }
      },
      take: 5
    });

    // Calcular métricas financieras
    const monthlyRevenue = await db.$queryRaw`
      SELECT
        strftime('%Y-%m', createdAt) as month,
        SUM(amount) as revenue
      FROM payments
      WHERE status = 'COMPLETED'
        AND createdAt >= ${sixtyDaysAgo.toISOString()}
      GROUP BY strftime('%Y-%m', createdAt)
      ORDER BY month DESC
      LIMIT 6
    ` as Array<{ month: string; revenue: number }>;

    // Obtener contratos por mes (últimos 6 meses)
    const contractCreationData = await db.$queryRaw`
      SELECT
        strftime('%Y-%m', "createdAt") as month,
        COUNT(*) as contracts
      FROM contracts
      WHERE "createdAt" >= ${sixtyDaysAgo.toISOString()}
      GROUP BY strftime('%Y-%m', "createdAt")
      ORDER BY month DESC
      LIMIT 6
    ` as Array<{ month: string; contracts: number }>;

    // Formatear respuesta
    const analytics = {
      overview: {
        totalUsers,
        activeUsers,
        totalProperties,
        availableProperties,
        rentedProperties,
        occupancyRate: totalProperties > 0 ? (rentedProperties / totalProperties) * 100 : 0,
        totalContracts,
        activeContracts,
        totalPayments,
        pendingPayments,
        completedPayments,
        totalRevenue
      },
      growth: {
        userGrowthRate,
        contractGrowthRate,
        usersLast30Days,
        usersPrevious30Days,
        contractsLast30Days,
        contractsPrevious30Days
      },
      distribution: {
        userRoles: userRoleDistribution.map(item => ({
          role: item.role,
          count: item._count.role,
          percentage: totalUsers > 0 ? (item._count.role / totalUsers) * 100 : 0
        }))
      },
      trends: {
        revenue: monthlyRevenue.map(item => ({
          month: item.month,
          revenue: Number(item.revenue)
        })),
        contracts: contractCreationData.map(item => ({
          month: item.month,
          count: Number(item.contracts)
        }))
      },
      popularProperties: popularProperties.map(prop => ({
        id: prop.id,
        title: prop.title,
        address: prop.address,
        city: prop.city,
        contractCount: prop._count.contracts
      })),
      timeframe
    };

    logger.info('Analytics data generated', {
      timeframe,
      totalUsers,
      totalRevenue
    });

    return NextResponse.json({
      success: true,
      data: analytics
    });

}
