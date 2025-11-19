import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { RatingContextType } from '@/types/index';

/**
 * GET /api/ratings/trends
 * Obtener tendencias de calificaciones en el tiempo
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get('userId') || user.id;
    const contextType = searchParams.get('contextType') as RatingContextType | null;
    const period = searchParams.get('period') || '30'; // días: 7, 30, 90, 365

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Construir filtro
    const where: any = {
      toUserId: userId,
      createdAt: {
        gte: startDate,
      },
    };

    if (contextType) {
      where.contextType = contextType;
    }

    // Obtener calificaciones agrupadas por fecha
    const ratings = await db.userRating.findMany({
      where,
      select: {
        overallRating: true,
        createdAt: true,
        contextType: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Agrupar por día/semana/mes según el período
    const groupBy = days <= 7 ? 'day' : days <= 90 ? 'week' : 'month';
    const trends: Record<string, { date: string; average: number; count: number }> = {};

    ratings.forEach(rating => {
      const date = new Date(rating.createdAt);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0] || date.toISOString(); // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0] || weekStart.toISOString();
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!trends[key]) {
        trends[key] = {
          date: key,
          average: 0,
          count: 0,
        };
      }

      const trend = trends[key];
      if (trend) {
        trend.average += rating.overallRating;
        trend.count += 1;
      }
    });

    // Calcular promedios
    const trendData = Object.values(trends).map(trend => ({
      date: trend.date,
      average: trend.count > 0 ? Number((trend.average / trend.count).toFixed(2)) : 0,
      count: trend.count,
    }));

    // Calcular estadísticas adicionales
    const allRatings = ratings.map(r => r.overallRating);
    const averageRating =
      allRatings.length > 0 ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length : 0;

    const ratingDistribution: Record<number, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = allRatings.filter(r => r === i).length;
    }

    // Calcular tendencia (mejorando, empeorando, estable)
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable';
    if (trendData.length >= 2) {
      const firstHalf = trendData.slice(0, Math.floor(trendData.length / 2));
      const secondHalf = trendData.slice(Math.floor(trendData.length / 2));

      const firstAvg = firstHalf.reduce((sum, t) => sum + t.average, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, t) => sum + t.average, 0) / secondHalf.length;

      const diff = secondAvg - firstAvg;
      if (diff > 0.1) {
        trendDirection = 'improving';
      } else if (diff < -0.1) {
        trendDirection = 'declining';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        trends: trendData,
        averageRating: Number(averageRating.toFixed(2)),
        totalRatings: allRatings.length,
        ratingDistribution,
        trendDirection,
        period: days,
        groupBy,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo tendencias de calificaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
