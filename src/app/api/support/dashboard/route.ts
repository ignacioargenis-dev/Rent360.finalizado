import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    logger.info('GET /api/support/dashboard - Generando dashboard de soporte', {
      userId: user.id,
    });

    // Obtener estadísticas de tickets
    const ticketStats = await db.ticket.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    const ticketStatusMap = ticketStats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    // Obtener tickets recientes
    const recentTickets = await db.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calcular tiempo promedio de respuesta
    const resolvedTickets = await db.ticket.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    const avgResponseTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, ticket) => {
            const diff = ticket.resolvedAt!.getTime() - ticket.createdAt.getTime();
            return sum + diff / (1000 * 60 * 60); // horas
          }, 0) / resolvedTickets.length
        : 0;

    // Calcular satisfacción promedio
    const recentRatings = await db.userRating.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: {
        overallRating: true,
      },
    });

    const avgSatisfaction =
      recentRatings.length > 0
        ? recentRatings.reduce((sum, rating) => sum + rating.overallRating, 0) /
          recentRatings.length
        : 0;

    // Obtener tickets escalados (alta prioridad sin resolver)
    const escalatedTickets = await db.ticket.count({
      where: {
        priority: 'HIGH',
        status: { not: 'RESOLVED' },
      },
    });

    const stats = {
      totalTickets:
        (ticketStatusMap['OPEN'] || 0) +
        (ticketStatusMap['IN_PROGRESS'] || 0) +
        (ticketStatusMap['RESOLVED'] || 0) +
        (ticketStatusMap['CLOSED'] || 0),
      openTickets: ticketStatusMap['OPEN'] || 0,
      resolvedTickets: ticketStatusMap['RESOLVED'] || 0,
      pendingTickets: ticketStatusMap['IN_PROGRESS'] || 0,
      averageResponseTime: Math.round(avgResponseTime * 10) / 10,
      customerSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      escalatedTickets,
    };

    const transformedTickets = recentTickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      clientName: ticket.user?.name || 'Usuario desconocido',
      clientEmail: ticket.user?.email || '',
      category: ticket.category || 'General',
      priority: ticket.priority || 'MEDIUM',
      status: ticket.status || 'OPEN',
      assignedTo: ticket.assignee?.name || 'Sin asignar',
      createdAt: ticket.createdAt.toISOString().split('T')[0],
      updatedAt:
        ticket.updatedAt?.toISOString().split('T')[0] ||
        ticket.createdAt.toISOString().split('T')[0],
    }));

    return NextResponse.json({
      success: true,
      stats,
      recentTickets: transformedTickets,
    });
  } catch (error) {
    logger.error('Error en GET /api/support/dashboard:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
