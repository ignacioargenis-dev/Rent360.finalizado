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

    logger.info('GET /api/support/reports/satisfaction - Generando reporte de satisfacción', {
      userId: user.id,
      period,
      startDate,
      endDate,
    });

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

    // Obtener calificaciones de usuarios
    const ratings = await db.userRating.findMany({
      where: {
        createdAt: dateFilter,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transformar datos al formato esperado
    const satisfactionData = ratings.map(rating => ({
      ticketId: rating.id,
      category: rating.contextType || 'General',
      priority: 'MEDIUM' as const,
      resolutionTime: 24, // Valor por defecto
      satisfactionRating: rating.overallRating,
      feedbackText: rating.comment,
      userType:
        (rating.fromUser?.role?.toUpperCase() as
          | 'TENANT'
          | 'OWNER'
          | 'BROKER'
          | 'SUPPORT'
          | 'ADMIN') || 'USER',
      agent: rating.toUser?.name || 'Sistema',
      resolutionDate: rating.createdAt.toISOString(),
      followUpRequired: false,
      npsScore: undefined,
    }));

    // Calcular estadísticas
    const totalResponses = satisfactionData.length;
    const overallRating =
      totalResponses > 0
        ? satisfactionData.reduce((sum, item) => sum + item.satisfactionRating, 0) / totalResponses
        : 0;

    // Calcular NPS
    const promoters = satisfactionData.filter(item => (item.npsScore || 0) >= 9).length;
    const passives = satisfactionData.filter(
      item => (item.npsScore || 0) >= 7 && (item.npsScore || 0) <= 8
    ).length;
    const detractors = satisfactionData.filter(item => (item.npsScore || 0) <= 6).length;
    const npsScore = totalResponses > 0 ? ((promoters - detractors) / totalResponses) * 100 : 0;

    // Distribución de calificaciones
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => {
      const count = satisfactionData.filter(item => item.satisfactionRating === rating).length;
      return {
        rating,
        count,
        percentage: totalResponses > 0 ? (count / totalResponses) * 100 : 0,
      };
    });

    // Satisfacción por categoría
    const categories = [...new Set(satisfactionData.map(item => item.category))];
    const categorySatisfaction = categories.map(category => {
      const categoryItems = satisfactionData.filter(item => item.category === category);
      const avgRating =
        categoryItems.length > 0
          ? categoryItems.reduce((sum, item) => sum + item.satisfactionRating, 0) /
            categoryItems.length
          : 0;
      return {
        category,
        avgRating: Math.round(avgRating * 10) / 10,
        responseCount: categoryItems.length,
      };
    });

    // Rendimiento por agente
    const agents = [...new Set(satisfactionData.map(item => item.agent))];
    const agentPerformance = agents.map(agent => {
      const agentItems = satisfactionData.filter(item => item.agent === agent);
      const avgRating =
        agentItems.length > 0
          ? agentItems.reduce((sum, item) => sum + item.satisfactionRating, 0) / agentItems.length
          : 0;
      return {
        agent,
        avgRating: Math.round(avgRating * 10) / 10,
        ticketCount: agentItems.length,
      };
    });

    const stats = {
      overallRating: Math.round(overallRating * 10) / 10,
      totalResponses,
      responseRate: totalResponses > 0 ? 100 : 0, // Simplificado
      npsScore: Math.round(npsScore),
      promoters,
      passives,
      detractors,
      ratingDistribution,
      categorySatisfaction,
      agentPerformance,
    };

    return NextResponse.json({
      success: true,
      data: satisfactionData,
      stats,
      period,
      dateRange: {
        start: (dateFilter as any).gte?.toISOString(),
        end: (dateFilter as any).lte?.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/reports/satisfaction:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
