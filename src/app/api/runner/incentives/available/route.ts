import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { RunnerReportsService } from '@/lib/runner-reports-service';
import { RunnerRatingService } from '@/lib/runner-rating-service';

/**
 * GET /api/runner/incentives/available
 * Obtiene las reglas de incentivos disponibles para el runner actual
 * con información de progreso hacia cada una
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    // Obtener todas las reglas activas desde BD
    const activeRules = await db.incentiveRule.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    // Obtener métricas de rendimiento del runner
    const performanceMetrics = await RunnerReportsService.generateRunnerPerformanceMetrics(user.id);
    const ratingSummary = await RunnerRatingService.getRunnerRatingSummary(user.id);

    // Obtener incentivos ya otorgados para este runner
    const earnedIncentives = await db.runnerIncentive.findMany({
      where: {
        runnerId: user.id,
        status: {
          in: ['GRANTED', 'CLAIMED', 'EARNED'],
        },
      },
      select: {
        incentiveRuleId: true,
        earnedAt: true,
      },
    });

    const earnedRuleIds = new Set(earnedIncentives.map(inc => inc.incentiveRuleId));

    // Verificar fecha de validez y calcular progreso para cada regla
    const now = new Date();
    const availableRules = await Promise.all(
      activeRules.map(async rule => {
        // Verificar período de validez
        const validFrom = rule.validFrom;
        const validUntil = rule.validUntil;

        if (validUntil && now > validUntil) {
          return null; // Regla expirada
        }
        if (now < validFrom) {
          return null; // Regla aún no válida
        }

        const criteria = JSON.parse(rule.criteria);
        const rewards = JSON.parse(rule.rewards);

        // Verificar si ya obtuvo este incentivo recientemente (cooldown)
        const recentEarned = earnedIncentives.find(
          inc =>
            inc.incentiveRuleId === rule.id &&
            inc.earnedAt >= new Date(Date.now() - rule.cooldownPeriod * 24 * 60 * 60 * 1000)
        );

        const isEarned = earnedRuleIds.has(rule.id) && !recentEarned;

        // Calcular progreso hacia los criterios
        const progressDetails: Record<string, { current: number; target: number }> = {};

        // Calcular porcentaje de progreso de forma más precisa
        // Si hay múltiples criterios, calcular el porcentaje promedio de cumplimiento
        let totalCriteria = 0;
        let totalProgress = 0;

        if (criteria.minVisits) {
          totalCriteria++;
          const current = performanceMetrics.totalVisits || 0;
          const target = criteria.minVisits;
          totalProgress += Math.min(100, (current / target) * 100);
        }

        if (criteria.minRating) {
          totalCriteria++;
          const current = ratingSummary.averageRating || 0;
          const target = criteria.minRating;
          totalProgress += Math.min(100, (current / target) * 100);
        }

        if (criteria.minEarnings) {
          totalCriteria++;
          const current = performanceMetrics.totalEarnings || 0;
          const target = criteria.minEarnings;
          totalProgress += Math.min(100, (current / target) * 100);
        }

        if (criteria.minCompletionRate) {
          totalCriteria++;
          const current = performanceMetrics.completionRate || 0;
          const target = criteria.minCompletionRate;
          totalProgress += Math.min(100, (current / target) * 100);
        }

        if (criteria.rankingPosition) {
          totalCriteria++;
          const current = performanceMetrics.overallRanking || 999;
          const target = criteria.rankingPosition;
          // Para ranking, cuanto menor mejor, así que invertimos
          totalProgress += Math.min(100, (target / Math.max(1, current)) * 100);
        }

        const progressPercentage =
          totalCriteria > 0 ? Math.round(totalProgress / totalCriteria) : 0;

        // Verificar si cumple todos los criterios
        const meetsCriteria =
          (!criteria.minVisits || (performanceMetrics.totalVisits || 0) >= criteria.minVisits) &&
          (!criteria.minRating || (ratingSummary.averageRating || 0) >= criteria.minRating) &&
          (!criteria.minEarnings ||
            (performanceMetrics.totalEarnings || 0) >= criteria.minEarnings) &&
          (!criteria.minCompletionRate ||
            (performanceMetrics.completionRate || 0) >= criteria.minCompletionRate) &&
          (!criteria.rankingPosition ||
            (performanceMetrics.overallRanking || 999) <= criteria.rankingPosition);

        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          category: rule.category,
          criteria,
          rewards,
          isEarned,
          isAvailable: !isEarned && meetsCriteria && !recentEarned,
          progress: progressPercentage,
          progressDetails,
          meetsCriteria,
          cooldownPeriod: rule.cooldownPeriod,
          validFrom: rule.validFrom.toISOString(),
          validUntil: rule.validUntil?.toISOString() || null,
        };
      })
    );

    // Filtrar reglas nulas (expiradas o no válidas aún)
    const filteredRules = availableRules.filter(rule => rule !== null);

    logger.info('Reglas disponibles obtenidas para runner', {
      runnerId: user.id,
      totalRules: filteredRules.length,
      earnedCount: filteredRules.filter(r => r?.isEarned).length,
      availableCount: filteredRules.filter(r => r?.isAvailable).length,
    });

    return NextResponse.json({
      success: true,
      rules: filteredRules,
      performance: {
        totalVisits: performanceMetrics.totalVisits,
        averageRating: ratingSummary.averageRating,
        totalEarnings: performanceMetrics.totalEarnings,
        completionRate: performanceMetrics.completionRate,
        overallRanking: performanceMetrics.overallRanking,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo reglas disponibles:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
