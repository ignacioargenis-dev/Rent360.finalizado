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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    logger.info(
      'GET /api/support/reports/response-time - Generando reporte de tiempos de respuesta',
      {
        userId: user.id,
        period,
        startDate,
        endDate,
      }
    );

    // Calcular fechas basadas en el período
    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
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
      }
    }

    // Obtener tickets con sus respuestas
    const tickets = await db.ticket.findMany({
      where: {
        createdAt: dateFilter,
        status: {
          in: ['RESOLVED', 'CLOSED'],
        },
      },
      include: {
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Solo primera respuesta
        },
        assignee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    // Transformar datos al formato esperado
    const responseTimeData = tickets.map(ticket => {
      const firstResponse = ticket.comments[0];
      const firstResponseTime = firstResponse
        ? Math.floor(
            (new Date(firstResponse.createdAt).getTime() - new Date(ticket.createdAt).getTime()) /
              (1000 * 60)
          )
        : null;

      const resolutionTime = ticket.resolvedAt
        ? Math.floor(
            (new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime()) /
              (1000 * 60 * 60)
          )
        : null;

      // Calcular cumplimiento SLA basado en prioridad
      let slaTarget = 24; // horas por defecto
      switch (ticket.priority) {
        case 'URGENT':
          slaTarget = 2;
          break;
        case 'HIGH':
          slaTarget = 8;
          break;
        case 'MEDIUM':
          slaTarget = 24;
          break;
        case 'LOW':
          slaTarget = 72;
          break;
      }

      const slaCompliance = resolutionTime ? resolutionTime <= slaTarget : false;

      return {
        ticketId: ticket.id,
        category: ticket.category || 'General',
        priority: (ticket.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') || 'MEDIUM',
        createdAt: ticket.createdAt.toISOString().split('T')[0],
        firstResponseTime: firstResponseTime || 0,
        resolutionTime: resolutionTime || 0,
        slaCompliance,
        agent: ticket.assignee?.name || 'Sin asignar',
        userType:
          (ticket.user?.role?.toUpperCase() as
            | 'TENANT'
            | 'OWNER'
            | 'BROKER'
            | 'SUPPORT'
            | 'ADMIN') || 'USER',
      };
    });

    // Calcular estadísticas
    const validResponseTimes = responseTimeData.filter(item => item.firstResponseTime > 0);
    const validResolutionTimes = responseTimeData.filter(item => item.resolutionTime > 0);

    const avgFirstResponseTime =
      validResponseTimes.length > 0
        ? validResponseTimes.reduce((sum, item) => sum + item.firstResponseTime, 0) /
          validResponseTimes.length
        : 0;

    const avgResolutionTime =
      validResolutionTimes.length > 0
        ? validResolutionTimes.reduce((sum, item) => sum + item.resolutionTime, 0) /
          validResolutionTimes.length
        : 0;

    const slaComplianceRate =
      responseTimeData.length > 0
        ? (responseTimeData.filter(item => item.slaCompliance).length / responseTimeData.length) *
          100
        : 0;

    // Desglose por hora
    const hourlyBreakdown = Array.from({ length: 24 }, (_, hour) => {
      const hourItems = validResponseTimes.filter(item => {
        if (!item.createdAt) {
          return false;
        }
        try {
          const itemHour = new Date(item.createdAt).getHours();
          return itemHour === hour;
        } catch {
          return false;
        }
      });
      const avgResponse =
        hourItems.length > 0
          ? hourItems.reduce((sum, item) => sum + item.firstResponseTime, 0) / hourItems.length
          : 0;
      return {
        hour,
        avgResponse: Math.round(avgResponse),
        count: hourItems.length,
      };
    });

    // Estadísticas por categoría
    const categories = [...new Set(responseTimeData.map(item => item.category))];
    const categoryStats = categories.map(category => {
      const categoryItems = validResponseTimes.filter(item => item.category === category);
      const avgResponse =
        categoryItems.length > 0
          ? categoryItems.reduce((sum, item) => sum + item.firstResponseTime, 0) /
            categoryItems.length
          : 0;
      const slaRate =
        categoryItems.length > 0
          ? (categoryItems.filter(item => item.slaCompliance).length / categoryItems.length) * 100
          : 0;
      return {
        category,
        avgResponse: Math.round(avgResponse),
        slaRate: Math.round(slaRate),
      };
    });

    // Estadísticas por prioridad
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const priorityStats = priorities.map(priority => {
      const priorityItems = validResolutionTimes.filter(item => item.priority === priority);
      const avgResponse =
        priorityItems.length > 0
          ? priorityItems.reduce((sum, item) => sum + item.resolutionTime, 0) / priorityItems.length
          : 0;
      let targetTime = 24;
      switch (priority) {
        case 'URGENT':
          targetTime = 2;
          break;
        case 'HIGH':
          targetTime = 8;
          break;
        case 'MEDIUM':
          targetTime = 24;
          break;
        case 'LOW':
          targetTime = 72;
          break;
      }
      return {
        priority,
        avgResponse: Math.round(avgResponse * 10) / 10,
        targetTime,
      };
    });

    // Tendencias diarias (últimos 30 días)
    const dailyTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayItems = validResponseTimes.filter(item => {
        if (!item.createdAt) {
          return false;
        }
        try {
          const itemDate = new Date(item.createdAt);
          return itemDate.toISOString().split('T')[0] === dateStr;
        } catch {
          return false;
        }
      });
      const avgResponse =
        dayItems.length > 0
          ? dayItems.reduce((sum, item) => sum + item.firstResponseTime, 0) / dayItems.length
          : 0;
      const slaRate =
        dayItems.length > 0
          ? (dayItems.filter(item => item.slaCompliance).length / dayItems.length) * 100
          : 0;
      dailyTrends.push({
        date: dateStr,
        avgResponse: Math.round(avgResponse),
        slaRate: Math.round(slaRate),
      });
    }

    const stats = {
      avgFirstResponseTime: Math.round(avgFirstResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      slaComplianceRate: Math.round(slaComplianceRate),
      totalTickets: responseTimeData.length,
      slaBreachedCount: responseTimeData.filter(item => !item.slaCompliance).length,
      hourlyBreakdown,
      categoryStats,
      priorityStats,
      dailyTrends,
    };

    return NextResponse.json({
      success: true,
      data: responseTimeData,
      stats,
      period,
      dateRange: {
        start: (dateFilter as any).gte?.toISOString(),
        end: (dateFilter as any).lte?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/reports/response-time:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
