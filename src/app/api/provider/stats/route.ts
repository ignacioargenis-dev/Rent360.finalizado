import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { UserRatingService } from '@/lib/user-rating-service';

/**
 * Obtiene la configuración de comisión para proveedores de mantenimiento
 */
async function getMaintenanceProviderConfig(): Promise<{
  commissionPercentage: number;
  gracePeriodDays: number;
}> {
  try {
    const [commissionSetting, gracePeriodSetting] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: 'maintenanceProviderCommissionPercentage' },
      }),
      db.systemSetting.findUnique({
        where: { key: 'maintenanceProviderGracePeriodDays' },
      }),
    ]);

    const [commissionConfig, gracePeriodConfig] = await Promise.all([
      commissionSetting
        ? null
        : db.platformConfig.findUnique({
            where: { key: 'maintenanceProviderCommissionPercentage' },
          }),
      gracePeriodSetting
        ? null
        : db.platformConfig.findUnique({
            where: { key: 'maintenanceProviderGracePeriodDays' },
          }),
    ]);

    return {
      commissionPercentage: commissionSetting
        ? parseFloat(commissionSetting.value) || 8
        : commissionConfig
          ? parseFloat(commissionConfig.value) || 8
          : 8,
      gracePeriodDays: gracePeriodSetting
        ? parseFloat(gracePeriodSetting.value) || 15
        : gracePeriodConfig
          ? parseFloat(gracePeriodConfig.value) || 15
          : 15,
    };
  } catch (error) {
    logger.error('Error obteniendo configuración de mantenimiento:', error);
    return { commissionPercentage: 8, gracePeriodDays: 15 };
  }
}

/**
 * Obtiene la configuración de comisión para proveedores de servicios
 */
async function getServiceProviderConfig(): Promise<{
  commissionPercentage: number;
  gracePeriodDays: number;
}> {
  try {
    const [commissionSetting, gracePeriodSetting] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: 'serviceProviderCommissionPercentage' },
      }),
      db.systemSetting.findUnique({
        where: { key: 'serviceProviderGracePeriodDays' },
      }),
    ]);

    const [commissionConfig, gracePeriodConfig] = await Promise.all([
      commissionSetting
        ? null
        : db.platformConfig.findUnique({
            where: { key: 'serviceProviderCommissionPercentage' },
          }),
      gracePeriodSetting
        ? null
        : db.platformConfig.findUnique({
            where: { key: 'serviceProviderGracePeriodDays' },
          }),
    ]);

    return {
      commissionPercentage: commissionSetting
        ? parseFloat(commissionSetting.value) || 8
        : commissionConfig
          ? parseFloat(commissionConfig.value) || 8
          : 8,
      gracePeriodDays: gracePeriodSetting
        ? parseFloat(gracePeriodSetting.value) || 7
        : gracePeriodConfig
          ? parseFloat(gracePeriodConfig.value) || 7
          : 7,
    };
  } catch (error) {
    logger.error('Error obteniendo configuración de servicios:', error);
    return { commissionPercentage: 8, gracePeriodDays: 7 };
  }
}

/**
 * GET /api/provider/stats
 * Obtiene estadísticas del proveedor actual con datos reales
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // ✅ Aceptar todos los roles de proveedor (normalizados)
    if (!isAnyProvider(user.role)) {
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

    // Obtener configuraciones según el tipo de proveedor
    const config = isMaintenanceProvider(user.role)
      ? await getMaintenanceProviderConfig()
      : await getServiceProviderConfig();

    let stats: any = {
      totalEarnings: 0,
      thisMonthEarnings: 0,
      lastMonthEarnings: 0,
      pendingPayments: 0,
      completedJobs: 0,
      averageRating: 0,
      totalRatings: 0,
      activeJobs: 0,
      gracePeriodDays: config.gracePeriodDays,
      commissionPercentage: config.commissionPercentage,
    };

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
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

      // Obtener calificación promedio real desde UserRatingService
      const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);

      stats = {
        totalEarnings: totalEarningsAgg._sum.finalPrice || 0,
        thisMonthEarnings: thisMonthEarningsAgg._sum.finalPrice || 0,
        lastMonthEarnings: lastMonthEarningsAgg._sum.finalPrice || 0,
        pendingPayments,
        completedJobs,
        activeJobs,
        averageRating: ratingSummary?.averageRating || 0,
        totalRatings: ratingSummary?.totalRatings || 0,
        gracePeriodDays: config.gracePeriodDays,
        commissionPercentage: config.commissionPercentage,
      };
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
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
          status: { in: ['ASSIGNED', 'IN_PROGRESS', 'SCHEDULED'] },
        },
      });

      const pendingJobs = await db.maintenance.count({
        where: {
          maintenanceProviderId,
          status: { in: ['PENDING', 'QUOTE_PENDING', 'PENDING_CONFIRMATION'] },
        },
      });

      // Contar todos los trabajos asignados al proveedor (totalJobs)
      const totalJobs = await db.maintenance.count({
        where: {
          maintenanceProviderId,
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

      // Obtener calificación promedio real desde UserRatingService
      const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);

      stats = {
        totalEarnings: totalEarningsAgg._sum.actualCost || 0,
        thisMonthEarnings: thisMonthEarningsAgg._sum.actualCost || 0,
        lastMonthEarnings: lastMonthEarningsAgg._sum.actualCost || 0,
        pendingPayments,
        completedJobs,
        activeJobs,
        pendingJobs,
        totalJobs,
        averageRating: ratingSummary?.averageRating || 0,
        totalRatings: ratingSummary?.totalRatings || 0,
        gracePeriodDays: config.gracePeriodDays,
        commissionPercentage: config.commissionPercentage,
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
