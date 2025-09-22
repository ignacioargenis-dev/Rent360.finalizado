import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerReportsService } from '@/lib/runner-reports-service';
import { RunnerRatingService } from '@/lib/runner-rating-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/runner/reports
 * Obtiene reportes avanzados de rendimiento del runner
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'runner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'weekly';
    const periodStart = searchParams.get('startDate');
    const periodEnd = searchParams.get('endDate');

    let reportData;

    switch (reportType) {
      case 'performance':
        // Reporte de métricas de rendimiento completo
        reportData = await RunnerReportsService.generateRunnerPerformanceMetrics(
          user.id,
          periodStart ? new Date(periodStart) : undefined,
          periodEnd ? new Date(periodEnd) : undefined
        );
        break;

      case 'weekly':
        // Reporte semanal detallado
        reportData = await RunnerReportsService.generateWeeklyReport(user.id);
        break;

      case 'rating':
        // Reporte de calificaciones
        reportData = await RunnerRatingService.getRunnerRatingSummary(
          user.id,
          periodStart ? new Date(periodStart) : undefined,
          periodEnd ? new Date(periodEnd) : undefined
        );
        break;

      case 'ranking':
        // Ranking global
        reportData = await RunnerRatingService.calculateRunnerRanking(20);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de reporte no válido. Use: performance, weekly, rating, ranking' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: reportData,
      metadata: {
        reportType,
        generatedAt: new Date(),
        runnerId: user.id,
        period: {
          start: periodStart || null,
          end: periodEnd || null
        }
      }
    });

  } catch (error) {
    logger.error('Error generando reporte:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
