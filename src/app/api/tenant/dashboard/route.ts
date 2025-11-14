import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
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
      recentActivity,
    ] = await Promise.all([
      // Contratos activos del inquilino
      db.contract.count({
        where: {
          tenantId: user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      }),

      // Pagos pendientes
      db.payment.count({
        where: {
          contract: { tenantId: user.id },
          status: 'PENDING',
          dueDate: { lt: new Date() },
        },
      }),

      // Pagos próximos (próximos 7 días)
      db.payment.count({
        where: {
          contract: { tenantId: user.id },
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Solicitudes de mantenimiento abiertas
      db.maintenance.count({
        where: {
          requestedBy: user.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),

      // Notificaciones no leídas
      db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),

      // Obtener datos para actividad reciente
      Promise.all([
        // Pagos recientes (últimos 5)
        db.payment.findMany({
          where: { contract: { tenantId: user.id } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            contract: {
              include: {
                property: {
                  select: { title: true },
                },
              },
            },
          },
        }),
        // Contratos recientes (últimos 3)
        db.contract.findMany({
          where: { tenantId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            property: {
              select: { title: true },
            },
          },
        }),
        // Solicitudes de mantenimiento recientes (últimas 5)
        db.maintenance.findMany({
          where: { requestedBy: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            property: {
              select: { title: true },
            },
          },
        }),
      ]),
    ]);

    // Obtener próximos pagos detallados
    const nextPayments = await db.payment.findMany({
      where: {
        contract: { tenantId: user.id },
        status: 'PENDING',
        dueDate: { gte: new Date() },
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                address: true,
                city: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Calcular estadísticas financieras
    const totalPaid = await db.payment.aggregate({
      where: {
        contract: { tenantId: user.id },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    });

    const totalPending = await db.payment.aggregate({
      where: {
        contract: { tenantId: user.id },
        status: 'PENDING',
      },
      _sum: { amount: true },
    });

    const stats = {
      activeContracts,
      pendingPayments,
      upcomingPayments,
      openMaintenance,
      unreadNotifications,
      totalPaid: totalPaid._sum.amount || 0,
      totalPending: totalPending._sum.amount || 0,
    };

    // Construir actividad reciente combinando pagos, contratos y mantenimiento
    const [recentPayments, recentContracts, recentMaintenance] = recentActivity as any[];
    const activities: any[] = [];

    // Agregar pagos recientes
    recentPayments.forEach((payment: any) => {
      activities.push({
        id: `payment-${payment.id}`,
        type: 'payment',
        title:
          payment.status === 'COMPLETED'
            ? 'Pago realizado'
            : payment.status === 'PENDING'
              ? 'Pago pendiente'
              : 'Pago',
        description:
          payment.status === 'COMPLETED'
            ? `Arriendo ${new Date(payment.createdAt).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`
            : `Pago de ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(payment.amount)}`,
        date: payment.createdAt.toISOString(),
        status: payment.status,
        icon: 'checkCircle',
        color:
          payment.status === 'COMPLETED'
            ? 'green'
            : payment.status === 'OVERDUE'
              ? 'red'
              : 'yellow',
      });
    });

    // Agregar contratos recientes
    recentContracts.forEach((contract: any) => {
      activities.push({
        id: `contract-${contract.id}`,
        type: 'contract',
        title: contract.status === 'ACTIVE' ? 'Contrato activo' : 'Contrato',
        description: contract.property?.title || 'Nuevo contrato',
        date: contract.createdAt.toISOString(),
        status: contract.status,
        icon: 'fileText',
        color: 'blue',
      });
    });

    // Agregar solicitudes de mantenimiento recientes
    recentMaintenance.forEach((maintenance: any) => {
      activities.push({
        id: `maintenance-${maintenance.id}`,
        type: 'maintenance',
        title:
          maintenance.status === 'COMPLETED'
            ? 'Mantenimiento completado'
            : maintenance.status === 'IN_PROGRESS'
              ? 'Mantenimiento en progreso'
              : 'Solicitud enviada',
        description:
          maintenance.title ||
          maintenance.description?.substring(0, 50) ||
          'Solicitud de mantenimiento',
        date: maintenance.createdAt.toISOString(),
        status: maintenance.status,
        icon: 'wrench',
        color:
          maintenance.status === 'COMPLETED'
            ? 'green'
            : maintenance.status === 'IN_PROGRESS'
              ? 'blue'
              : 'yellow',
      });
    });

    // Ordenar por fecha (más reciente primero) y tomar las últimas 10
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const finalActivities = activities.slice(0, 10);

    const dashboardData = {
      stats,
      nextPayments: nextPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        dueDate: payment.dueDate.toISOString(),
        propertyAddress: payment.contract.property.address,
        propertyCity: payment.contract.property.city,
      })),
      recentActivity: finalActivities,
    };

    logger.info('Dashboard del inquilino obtenido exitosamente', {
      userId: user.id,
      stats: {
        activeContracts,
        pendingPayments,
        upcomingPayments,
      },
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    logger.error('Error obteniendo dashboard del inquilino:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
