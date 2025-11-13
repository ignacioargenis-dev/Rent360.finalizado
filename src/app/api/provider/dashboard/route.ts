import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { UserRatingService } from '@/lib/user-rating-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo proveedores pueden acceder a su dashboard
    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de proveedor.' },
        { status: 403 }
      );
    }

    logger.info('Obteniendo dashboard del proveedor', { userId: user.id });

    // Obtener estadísticas del dashboard
    const [activeServices, completedJobs, pendingRequests, totalEarnings, _, recentJobs] =
      await Promise.all([
        // Servicios activos del proveedor
        db.serviceJob.count({
          where: {
            serviceProviderId: user.id,
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
        }),

        // Trabajos completados este mes
        db.serviceJob.count({
          where: {
            serviceProviderId: user.id,
            status: 'COMPLETED',
            updatedAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),

        // Solicitudes pendientes
        db.serviceJob.count({
          where: {
            serviceProviderId: user.id,
            status: 'PENDING',
          },
        }),

        // Ganancias totales
        db.serviceJob.aggregate({
          where: {
            serviceProviderId: user.id,
            status: 'COMPLETED',
          },
          _sum: { finalPrice: true },
        }),

        // Rating promedio (se calculará después con UserRatingService)
        Promise.resolve(null),

        // Trabajos recientes
        db.serviceJob.findMany({
          where: { serviceProviderId: user.id },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            finalPrice: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
      ]);

    // Obtener calificación promedio real desde UserRatingService
    const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);
    const averageRating = ratingSummary?.averageRating || 0;

    const stats = {
      activeServices,
      completedJobs,
      pendingRequests,
      totalEarnings: totalEarnings._sum.finalPrice || 0,
      averageRating,
      monthlyRevenue: 0, // Calcular ingresos del mes actual
      satisfactionRate: averageRating * 20, // Convertir a porcentaje (1-5 -> 20-100)
    };

    const dashboardData = {
      stats,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        title: job.title,
        propertyAddress: '', // No hay información de propiedad disponible
        status: job.status,
        price: job.finalPrice || 0,
        rating: null, // Rating no incluido en select
        completedAt: job.createdAt.toISOString(),
      })),
    };

    logger.info('Dashboard del proveedor obtenido exitosamente', {
      userId: user.id,
      stats: {
        activeServices,
        completedJobs,
        pendingRequests,
      },
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error obteniendo dashboard del proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
