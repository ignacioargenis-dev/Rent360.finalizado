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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    logger.info('GET /api/support/reports/resolved - Generando reporte de tickets resueltos', {
      userId: user.id,
      period,
    });

    // Calcular fechas basadas en el período
    let dateFilter = {};
    const now = new Date();

    switch (period) {
      case 'week':
        dateFilter = {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case 'month':
        dateFilter = {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        };
        break;
      case 'quarter':
        dateFilter = {
          gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };
        break;
      case 'year':
        dateFilter = {
          gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        };
        break;
      default:
        // No filter for 'all'
        break;
    }

    // Obtener tickets resueltos
    const tickets = await db.ticket.findMany({
      where: {
        status: 'RESOLVED',
        ...(Object.keys(dateFilter).length > 0 && { resolvedAt: dateFilter }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { resolvedAt: 'desc' },
    });

    // Transformar datos al formato esperado
    const resolvedData = tickets.map(ticket => {
      const resolutionTime =
        ticket.resolvedAt && ticket.createdAt
          ? Math.floor(
              (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) /
                (1000 * 60 * 60)
            )
          : 0;

      return {
        ticketId: ticket.id,
        title: ticket.title,
        category: ticket.category || 'General',
        priority: (ticket.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
        userType:
          (ticket.user?.role?.toUpperCase() as
            | 'TENANT'
            | 'OWNER'
            | 'BROKER'
            | 'SUPPORT'
            | 'ADMIN') || 'USER',
        agent: ticket.assignee?.name || 'Sin asignar',
        resolutionTime,
        resolutionDate:
          ticket.resolvedAt?.toISOString() ||
          ticket.updatedAt?.toISOString() ||
          ticket.createdAt.toISOString(),
        method: 'DIRECT' as const, // Simplificado
        complexity: 'MEDIUM' as const, // Simplificado
        satisfaction: 4, // Valor por defecto
      };
    });

    // Calcular estadísticas
    const totalResolved = resolvedData.length;
    const avgResolutionTime =
      totalResolved > 0
        ? resolvedData.reduce((sum, item) => sum + item.resolutionTime, 0) / totalResolved
        : 0;

    const resolutionRate = totalResolved > 0 ? 100 : 0; // Simplificado

    // Estadísticas por categoría
    const categoryStats = resolvedData.reduce(
      (acc, ticket) => {
        if (!acc[ticket.category]) {
          acc[ticket.category] = { count: 0, totalTime: 0 };
        }
        acc[ticket.category].count++;
        acc[ticket.category].totalTime += ticket.resolutionTime;
        return acc;
      },
      {} as Record<string, { count: number; totalTime: number }>
    );

    const categoryBreakdown = Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      count: stats.count,
      avgTime: Math.round((stats.totalTime / stats.count) * 10) / 10,
    }));

    // Estadísticas por prioridad
    const priorityStats = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(priority => {
      const priorityItems = resolvedData.filter(item => item.priority === priority);
      return {
        priority,
        count: priorityItems.length,
        avgTime:
          priorityItems.length > 0
            ? Math.round(
                (priorityItems.reduce((sum, item) => sum + item.resolutionTime, 0) /
                  priorityItems.length) *
                  10
              ) / 10
            : 0,
      };
    });

    // Tendencias mensuales
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthItems = resolvedData.filter(item => {
        const itemDate = new Date(item.resolutionDate);
        return itemDate >= monthStart && itemDate <= monthEnd;
      });

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
        resolved: monthItems.length,
        avgTime:
          monthItems.length > 0
            ? Math.round(
                (monthItems.reduce((sum, item) => sum + item.resolutionTime, 0) /
                  monthItems.length) *
                  10
              ) / 10
            : 0,
      });
    }

    const stats = {
      totalResolved,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      resolutionRate,
      categoryBreakdown,
      priorityStats,
      monthlyTrends,
    };

    return NextResponse.json({
      success: true,
      data: resolvedData,
      stats,
      period,
      dateRange: {
        start: (dateFilter as any).gte?.toISOString(),
        end: (dateFilter as any).lte?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/reports/resolved:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
