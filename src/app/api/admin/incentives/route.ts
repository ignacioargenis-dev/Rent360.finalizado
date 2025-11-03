import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';
import { RunnerIncentivesService } from '@/lib/runner-incentives-service';

// Schema de validación para crear/actualizar reglas de incentivos
const incentiveRuleSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  type: z.enum(['performance', 'rating', 'volume', 'loyalty', 'seasonal']),
  category: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
  criteria: z.object({
    minVisits: z.number().optional(),
    minRating: z.number().min(0).max(5).optional(),
    minEarnings: z.number().optional(),
    minCompletionRate: z.number().min(0).max(100).optional(),
    consecutivePeriods: z.number().optional(),
    rankingPosition: z.number().optional(),
  }),
  rewards: z.object({
    bonusAmount: z.number().optional(),
    bonusPercentage: z.number().optional(),
    priorityBonus: z.number().optional(),
    badge: z.string().optional(),
    title: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
  isActive: z.boolean().default(true),
  autoGrant: z.boolean().default(true),
  maxRecipients: z.number().optional().nullable(),
  cooldownPeriod: z.number().min(0).default(7),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/admin/incentives
 * Obtiene todas las reglas de incentivos (con estadísticas)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    const whereClause: any = {};
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }
    if (type) {
      whereClause.type = type;
    }
    if (category) {
      whereClause.category = category;
    }

    // Obtener todas las reglas de incentivos
    const rules = await db.incentiveRule.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            runnerIncentives: true,
          },
        },
      },
    });

    // Obtener estadísticas de cada regla
    const rulesWithStats = await Promise.all(
      rules.map(async rule => {
        const stats = {
          totalGranted: await db.runnerIncentive.count({
            where: {
              incentiveRuleId: rule.id,
              status: 'GRANTED',
            },
          }),
          totalClaimed: await db.runnerIncentive.count({
            where: {
              incentiveRuleId: rule.id,
              status: 'CLAIMED',
            },
          }),
          totalExpired: await db.runnerIncentive.count({
            where: {
              incentiveRuleId: rule.id,
              status: 'EXPIRED',
            },
          }),
          recentGrants: await db.runnerIncentive.count({
            where: {
              incentiveRuleId: rule.id,
              earnedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
              },
            },
          }),
        };

        return {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          category: rule.category,
          criteria: JSON.parse(rule.criteria),
          rewards: JSON.parse(rule.rewards),
          isActive: rule.isActive,
          autoGrant: rule.autoGrant,
          maxRecipients: rule.maxRecipients,
          cooldownPeriod: rule.cooldownPeriod,
          validFrom: rule.validFrom.toISOString(),
          validUntil: rule.validUntil?.toISOString() || null,
          createdAt: rule.createdAt.toISOString(),
          updatedAt: rule.updatedAt.toISOString(),
          stats,
        };
      })
    );

    logger.info('Reglas de incentivos obtenidas por administrador', {
      adminId: user.id,
      count: rulesWithStats.length,
    });

    return NextResponse.json({
      success: true,
      rules: rulesWithStats,
      total: rulesWithStats.length,
    });
  } catch (error) {
    logger.error('Error obteniendo reglas de incentivos:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/incentives
 * Crea una nueva regla de incentivo
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar datos
    const validatedData = incentiveRuleSchema.parse(body);

    // Verificar que no exista una regla con el mismo nombre activa
    const existingRule = await db.incentiveRule.findFirst({
      where: {
        name: validatedData.name,
        isActive: true,
      },
    });

    if (existingRule) {
      return NextResponse.json(
        {
          error: 'Ya existe una regla activa con este nombre. Por favor, usa un nombre único.',
        },
        { status: 409 }
      );
    }

    // Crear la regla de incentivo
    const rule = await db.incentiveRule.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category,
        criteria: JSON.stringify(validatedData.criteria),
        rewards: JSON.stringify(validatedData.rewards),
        isActive: validatedData.isActive,
        autoGrant: validatedData.autoGrant,
        maxRecipients: validatedData.maxRecipients || null,
        cooldownPeriod: validatedData.cooldownPeriod,
        validFrom: new Date(validatedData.validFrom),
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
      },
    });

    logger.info('Regla de incentivo creada', {
      adminId: user.id,
      ruleId: rule.id,
      ruleName: rule.name,
    });

    // Si la regla está activa, evaluar incentivos para todos los runners activos
    // Esto se hace en segundo plano para no bloquear la respuesta
    if (validatedData.isActive) {
      logger.info('Regla activa creada, iniciando evaluación para todos los runners', {
        ruleId: rule.id,
        ruleName: rule.name,
        autoGrant: validatedData.autoGrant,
      });

      // Obtener todos los runners activos y evaluar incentivos en segundo plano
      db.user
        .findMany({
          where: {
            role: 'RUNNER',
          },
          select: {
            id: true,
          },
        })
        .then(async runners => {
          logger.info(`Evaluando incentivos para ${runners.length} runners`, {
            ruleId: rule.id,
          });

          // Evaluar en paralelo con límite de concurrencia
          const evaluations = runners.map(runner =>
            RunnerIncentivesService.evaluateRunnerIncentives(runner.id)
              .then(incentives => {
                const granted = incentives.filter(
                  inc => inc.incentiveRuleId === rule.id && inc.status === 'GRANTED'
                ).length;
                if (granted > 0) {
                  logger.info('Incentivo otorgado después de crear regla', {
                    runnerId: runner.id,
                    ruleId: rule.id,
                    grantedCount: granted,
                  });
                }
                return { runnerId: runner.id, granted };
              })
              .catch(error => {
                logger.warn('Error evaluando incentivos después de crear regla:', {
                  runnerId: runner.id,
                  ruleId: rule.id,
                  error: error instanceof Error ? error.message : String(error),
                });
                return { runnerId: runner.id, granted: 0 };
              })
          );

          const results = await Promise.all(evaluations);
          const totalGranted = results.reduce((sum, r) => sum + r.granted, 0);

          logger.info('Evaluación de incentivos completada', {
            ruleId: rule.id,
            totalRunners: runners.length,
            totalIncentivesGranted: totalGranted,
          });
        })
        .catch(error => {
          logger.error('Error obteniendo runners para evaluación de incentivos:', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
    }

    return NextResponse.json({
      success: true,
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        category: rule.category,
        criteria: JSON.parse(rule.criteria),
        rewards: JSON.parse(rule.rewards),
        isActive: rule.isActive,
        autoGrant: rule.autoGrant,
        maxRecipients: rule.maxRecipients,
        cooldownPeriod: rule.cooldownPeriod,
        validFrom: rule.validFrom.toISOString(),
        validUntil: rule.validUntil?.toISOString() || null,
        createdAt: rule.createdAt.toISOString(),
        updatedAt: rule.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('Error creando regla de incentivo:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
