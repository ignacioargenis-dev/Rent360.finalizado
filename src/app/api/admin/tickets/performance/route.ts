import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y roles
    const user = await requireAnyRole(request, ['admin', 'support']);

    logger.info(
      'GET /api/admin/tickets/performance - Obteniendo métricas de rendimiento de tickets',
      {
        userId: user.id,
        userRole: user.role,
      }
    );

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Obtener métricas de esta semana
    const [
      resolvedThisWeek,
      resolvedLastWeek,
      totalThisWeek,
      totalLastWeek,
      avgResolutionTimeThisMonth,
      avgResolutionTimeLastMonth,
    ] = await Promise.all([
      // Tickets resueltos esta semana
      db.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: { gte: oneWeekAgo },
        },
      }),
      // Tickets resueltos la semana pasada
      db.ticket.count({
        where: {
          status: 'RESOLVED',
          updatedAt: {
            gte: twoWeeksAgo,
            lt: oneWeekAgo,
          },
        },
      }),
      // Total tickets esta semana
      db.ticket.count({
        where: {
          createdAt: { gte: oneWeekAgo },
        },
      }),
      // Total tickets la semana pasada
      db.ticket.count({
        where: {
          createdAt: {
            gte: twoWeeksAgo,
            lt: oneWeekAgo,
          },
        },
      }),
      // Tickets resueltos este mes para calcular tiempo promedio
      db.ticket.findMany({
        where: {
          status: 'RESOLVED',
          resolvedAt: { gte: oneMonthAgo },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
      // Tickets resueltos el mes pasado para calcular tiempo promedio
      db.ticket.findMany({
        where: {
          status: 'RESOLVED',
          resolvedAt: {
            gte: twoMonthsAgo,
            lt: oneMonthAgo,
          },
        },
        select: {
          createdAt: true,
          resolvedAt: true,
        },
      }),
    ]);

    // Calcular tiempo promedio de resolución este mes
    let currentMonthAvgTime = 0;
    if (avgResolutionTimeThisMonth.length > 0) {
      const totalTime = avgResolutionTimeThisMonth.reduce((acc, ticket) => {
        const createdAt = new Date(ticket.createdAt);
        const resolvedAt = new Date(ticket.resolvedAt!);
        const diffInHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return acc + diffInHours;
      }, 0);
      currentMonthAvgTime = totalTime / avgResolutionTimeThisMonth.length;
    }

    // Calcular tiempo promedio de resolución el mes pasado
    let lastMonthAvgTime = 0;
    if (avgResolutionTimeLastMonth.length > 0) {
      const totalTime = avgResolutionTimeLastMonth.reduce((acc, ticket) => {
        const createdAt = new Date(ticket.createdAt);
        const resolvedAt = new Date(ticket.resolvedAt!);
        const diffInHours = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return acc + diffInHours;
      }, 0);
      lastMonthAvgTime = totalTime / avgResolutionTimeLastMonth.length;
    }

    // Calcular porcentajes de cambio
    const resolvedChangePercent =
      resolvedLastWeek > 0 ? ((resolvedThisWeek - resolvedLastWeek) / resolvedLastWeek) * 100 : 0;

    const totalChangePercent =
      totalLastWeek > 0 ? ((totalThisWeek - totalLastWeek) / totalLastWeek) * 100 : 0;

    const timeChangePercent =
      lastMonthAvgTime > 0
        ? ((lastMonthAvgTime - currentMonthAvgTime) / lastMonthAvgTime) * 100
        : 0;

    // Calcular tasa de resolución semanal
    const resolutionRate = totalThisWeek > 0 ? (resolvedThisWeek / totalThisWeek) * 100 : 0;

    const performance = {
      weekly: {
        resolved: resolvedThisWeek,
        total: totalThisWeek,
        resolutionRate: Math.round(resolutionRate * 10) / 10,
        changePercent: Math.round(resolvedChangePercent * 10) / 10,
      },
      monthly: {
        averageResolutionTime: Math.round(currentMonthAvgTime * 10) / 10,
        timeChangePercent: Math.round(timeChangePercent * 10) / 10,
      },
      // Satisfacción se mantiene de la API anterior por ahora
      satisfaction: 4.2,
      satisfactionChange: 5.2, // Comparación con período anterior
    };

    logger.info('Métricas de rendimiento de tickets calculadas', { performance });

    return NextResponse.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    logger.error('Error obteniendo métricas de rendimiento de tickets:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof Error && error.message === 'Acceso denegado: rol no permitido') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo métricas de rendimiento',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
