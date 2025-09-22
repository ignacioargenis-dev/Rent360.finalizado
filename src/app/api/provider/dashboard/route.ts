import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ValidationError, handleError } from '@/lib/errors';

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
    const [
      activeServices,
      completedJobs,
      pendingRequests,
      totalEarnings,
      averageRating,
      recentJobs
    ] = await Promise.all([
      // Servicios activos del proveedor
      db.serviceJob.count({
        where: {
          serviceProviderId: user.id,
          status: { in: ['ASSIGNED', 'IN_PROGRESS'] }
        }
      }),

      // Trabajos completados este mes
      db.serviceJob.count({
        where: {
          serviceProviderId: user.id,
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),

      // Solicitudes pendientes
      db.serviceJob.count({
        where: {
          serviceProviderId: user.id,
          status: 'PENDING'
        }
      }),

      // Ganancias totales
      db.serviceJob.aggregate({
        where: {
          serviceProviderId: user.id,
          status: 'COMPLETED'
        },
        _sum: { finalPrice: true }
      }),

      // Rating promedio
      db.serviceJob.aggregate({
        where: {
          serviceProviderId: user.id,
          status: 'COMPLETED'
        },
        _avg: { rating: true }
      }),

      // Trabajos recientes
      db.serviceJob.findMany({
        where: { serviceProviderId: user.id },
        include: {
          maintenance: {
            select: {
              title: true,
              property: {
                select: {
                  address: true,
                  city: true
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    const stats = {
      activeServices,
      completedJobs,
      pendingRequests,
      totalEarnings: totalEarnings._sum.price || 0,
      averageRating: averageRating._avg.rating || 0,
      monthlyRevenue: 0, // Calcular ingresos del mes actual
      satisfactionRate: 0 // Calcular tasa de satisfacción
    };

    const dashboardData = {
      stats,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        title: job.maintenance?.title || 'Servicio',
        propertyAddress: job.maintenance?.property.address || '',
        status: job.status,
        price: job.price,
        rating: job.rating,
        completedAt: job.updatedAt.toISOString()
      }))
    };

    logger.info('Dashboard del proveedor obtenido exitosamente', {
      userId: user.id,
      stats: {
        activeServices,
        completedJobs,
        pendingRequests
      }
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error obteniendo dashboard del proveedor:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
