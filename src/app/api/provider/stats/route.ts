import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/provider/stats
 * Obtiene estadísticas del proveedor actual con datos reales
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE_PROVIDER' && user.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        maintenanceProvider: true,
        serviceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    let stats: any = {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      pendingPayments: 0,
      completedJobs: 0,
      averageRating: 0,
      totalRatings: 0,
      activeJobs: 0,
      gracePeriodDays: user.role === 'MAINTENANCE_PROVIDER' ? 15 : 7,
      commissionPercentage: user.role === 'MAINTENANCE_PROVIDER' ? 10 : 8,
    };

    if (user.role === 'SERVICE_PROVIDER' && fullUser.serviceProvider) {
      const serviceProviderId = fullUser.serviceProvider.id;

      // Obtener trabajos completados
      const completedJobs = await db.serviceJob.count({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
        },
      });

      // Obtener trabajos activos
      const activeJobs = await db.serviceJob.count({
        where: {
          serviceProviderId,
          status: { in: ['PENDING', 'ACCEPTED', 'IN_PROGRESS'] },
        },
      });

      // Obtener ganancias totales
      const totalEarningsAgg = await db.serviceJob.aggregate({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
        },
        _sum: { finalPrice: true },
      });

      // Ganancias del mes actual
      const thisMonthEarningsAgg = await db.serviceJob.aggregate({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
          completedDate: { gte: startOfMonth },
        },
        _sum: { finalPrice: true },
      });

      // Ganancias del mes anterior
      const lastMonthEarningsAgg = await db.serviceJob.aggregate({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
          completedDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { finalPrice: true },
      });

      // Pagos pendientes (trabajos completados sin transacción COMPLETED)
      const pendingPayments = await db.serviceJob.count({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
          transactions: {
            none: {
              status: 'COMPLETED',
            },
          },
        },
      });

      // Rating promedio
      const ratingAgg = await db.serviceJob.aggregate({
        where: {
          serviceProviderId,
          status: 'COMPLETED',
          rating: { not: null },
        },
        _avg: { rating: true },
        _count: { rating: true },
      });

      stats = {
        totalEarnings: totalEarningsAgg._sum.finalPrice || 0,
        thisMonthEarnings: thisMonthEarningsAgg._sum.finalPrice || 0,
        lastMonthEarnings: lastMonthEarningsAgg._sum.finalPrice || 0,
        pendingPayments,
        completedJobs,
        activeJobs,
        averageRating: ratingAgg._avg.rating || 0,
        totalRatings: ratingAgg._count.rating || 0,
        gracePeriodDays: 7,
        commissionPercentage: 8,
      };
    } else if (user.role === 'MAINTENANCE_PROVIDER' && fullUser.maintenanceProvider) {
      const maintenanceProviderId = fullUser.maintenanceProvider.id;

      // Similar lógica para maintenance provider
      const completedJobs = await db.maintenance.count({
        where: {
          maintenanceProviderId,
          status: 'COMPLETED',
        },
      });

      const activeJobs = await db.maintenance.count({
        where: {
          maintenanceProviderId,
          status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] },
        },
      });

      const totalEarningsAgg = await db.maintenance.aggregate({
        where: {
          maintenanceProviderId,
          status: 'COMPLETED',
        },
        _sum: { actualCost: true },
      });

      const thisMonthEarningsAgg = await db.maintenance.aggregate({
        where: {
          maintenanceProviderId,
          status: 'COMPLETED',
          completedDate: { gte: startOfMonth },
        },
        _sum: { actualCost: true },
      });

      const lastMonthEarningsAgg = await db.maintenance.aggregate({
        where: {
          maintenanceProviderId,
          status: 'COMPLETED',
          completedDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
        _sum: { actualCost: true },
      });

      const pendingPayments = await db.maintenance.count({
        where: {
          maintenanceProviderId,
          status: 'COMPLETED',
          transactions: {
            none: {
              status: 'COMPLETED',
            },
          },
        },
      });

      stats = {
        totalEarnings: totalEarningsAgg._sum.actualCost || 0,
        thisMonthEarnings: thisMonthEarningsAgg._sum.actualCost || 0,
        lastMonthEarnings: lastMonthEarningsAgg._sum.actualCost || 0,
        pendingPayments,
        completedJobs,
        activeJobs,
        averageRating: fullUser.maintenanceProvider.rating || 0,
        totalRatings: fullUser.maintenanceProvider.totalRatings || 0,
        gracePeriodDays: 15,
        commissionPercentage: 10,
      };
    }

    logger.info('Estadísticas obtenidas para proveedor', {
      providerId: user.id,
      role: user.role,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas del proveedor:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
