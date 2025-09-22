import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo inquilinos pueden acceder a su dashboard
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de inquilino.' },
        { status: 403 }
      );
    }

    logger.info('Obteniendo dashboard del inquilino', { userId: user.id });

    // Obtener estadísticas del dashboard
    const [
      activeContracts,
      pendingPayments,
      upcomingPayments,
      openMaintenance,
      unreadNotifications,
      recentActivity
    ] = await Promise.all([
      // Contratos activos del inquilino
      db.contract.count({
        where: {
          tenantId: user.id,
          status: { in: ['ACTIVE', 'PENDING'] }
        }
      }),

      // Pagos pendientes
      db.payment.count({
        where: {
          contract: { tenantId: user.id },
          status: 'PENDING',
          dueDate: { lt: new Date() }
        }
      }),

      // Pagos próximos (próximos 7 días)
      db.payment.count({
        where: {
          contract: { tenantId: user.id },
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Solicitudes de mantenimiento abiertas
      db.maintenance.count({
        where: {
          requestedBy: user.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] }
        }
      }),

      // Notificaciones no leídas
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false
        }
      }),

      // Actividad reciente (últimas 10 acciones)
      db.auditLog.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          resource: true,
          createdAt: true,
          details: true
        }
      })
    ]);

    // Obtener próximos pagos detallados
    const nextPayments = await db.payment.findMany({
      where: {
        contract: { tenantId: user.id },
        status: 'PENDING',
        dueDate: { gte: new Date() }
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                address: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    // Calcular estadísticas financieras
    const totalPaid = await db.payment.aggregate({
      where: {
        contract: { tenantId: user.id },
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    const totalPending = await db.payment.aggregate({
      where: {
        contract: { tenantId: user.id },
        status: 'PENDING'
      },
      _sum: { amount: true }
    });

    const stats = {
      activeContracts,
      pendingPayments,
      upcomingPayments,
      openMaintenance,
      unreadNotifications,
      totalPaid: totalPaid._sum.amount || 0,
      totalPending: totalPending._sum.amount || 0
    };

    const dashboardData = {
      stats,
      nextPayments: nextPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        propertyAddress: payment.contract.property.address,
        propertyCity: payment.contract.property.city
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        resource: activity.resource,
        createdAt: activity.createdAt.toISOString(),
        details: activity.details
      }))
    };

    logger.info('Dashboard del inquilino obtenido exitosamente', {
      userId: user.id,
      stats: {
        activeContracts,
        pendingPayments,
        upcomingPayments
      }
    });

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    logger.error('Error obteniendo dashboard del inquilino:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
