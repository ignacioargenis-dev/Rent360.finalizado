import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Schema de validación para actualizar reglas de incentivos
const updateIncentiveRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['performance', 'rating', 'volume', 'loyalty', 'seasonal']).optional(),
  category: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']).optional(),
  criteria: z
    .object({
      minVisits: z.number().optional(),
      minRating: z.number().min(0).max(5).optional(),
      minEarnings: z.number().optional(),
      minCompletionRate: z.number().min(0).max(100).optional(),
      consecutivePeriods: z.number().optional(),
      rankingPosition: z.number().optional(),
    })
    .optional(),
  rewards: z
    .object({
      bonusAmount: z.number().optional(),
      bonusPercentage: z.number().optional(),
      priorityBonus: z.number().optional(),
      badge: z.string().optional(),
      title: z.string().optional(),
      features: z.array(z.string()).optional(),
    })
    .optional(),
  isActive: z.boolean().optional(),
  autoGrant: z.boolean().optional(),
  maxRecipients: z.number().optional().nullable(),
  cooldownPeriod: z.number().min(0).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().nullable(),
});

/**
 * GET /api/admin/incentives/[id]
 * Obtiene una regla de incentivo específica con estadísticas detalladas
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { id } = params;

    const rule = await db.incentiveRule.findUnique({
      where: { id },
      include: {
        runnerIncentives: {
          include: {
            runner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            earnedAt: 'desc',
          },
          take: 50, // Últimos 50 incentivos otorgados
        },
        _count: {
          select: {
            runnerIncentives: true,
          },
        },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Regla de incentivo no encontrada' }, { status: 404 });
    }

    // Calcular estadísticas detalladas
    const stats = {
      totalGranted: await db.runnerIncentive.count({
        where: {
          incentiveRuleId: id,
          status: 'GRANTED',
        },
      }),
      totalClaimed: await db.runnerIncentive.count({
        where: {
          incentiveRuleId: id,
          status: 'CLAIMED',
        },
      }),
      totalExpired: await db.runnerIncentive.count({
        where: {
          incentiveRuleId: id,
          status: 'EXPIRED',
        },
      }),
      totalEarned: await db.runnerIncentive.count({
        where: {
          incentiveRuleId: id,
          status: 'EARNED',
        },
      }),
      recentGrants: await db.runnerIncentive.count({
        where: {
          incentiveRuleId: id,
          earnedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    };

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
        stats,
        recentIncentives: rule.runnerIncentives.map(inc => ({
          id: inc.id,
          runnerId: inc.runnerId,
          runnerName: inc.runner.name,
          runnerEmail: inc.runner.email,
          status: inc.status,
          earnedAt: inc.earnedAt.toISOString(),
          grantedAt: inc.grantedAt?.toISOString() || null,
          claimedAt: inc.claimedAt?.toISOString() || null,
          expiresAt: inc.expiresAt?.toISOString() || null,
          achievementData: inc.achievementData,
          rewardsGranted: inc.rewardsGranted,
        })),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo regla de incentivo:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/admin/incentives/[id]
 * Actualiza una regla de incentivo existente
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validar datos
    const validatedData = updateIncentiveRuleSchema.parse(body);

    // Verificar que la regla existe
    const existingRule = await db.incentiveRule.findUnique({
      where: { id },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Regla de incentivo no encontrada' }, { status: 404 });
    }

    // Si se está cambiando el nombre, verificar que no exista otra regla activa con ese nombre
    if (validatedData.name && validatedData.name !== existingRule.name) {
      const duplicateRule = await db.incentiveRule.findFirst({
        where: {
          name: validatedData.name,
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateRule) {
        return NextResponse.json(
          {
            error: 'Ya existe una regla activa con este nombre. Por favor, usa un nombre único.',
          },
          { status: 409 }
        );
      }
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.type !== undefined) {
      updateData.type = validatedData.type;
    }
    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category;
    }
    if (validatedData.criteria !== undefined) {
      updateData.criteria = JSON.stringify(validatedData.criteria);
    }
    if (validatedData.rewards !== undefined) {
      updateData.rewards = JSON.stringify(validatedData.rewards);
    }
    if (validatedData.isActive !== undefined) {
      updateData.isActive = validatedData.isActive;
    }
    if (validatedData.autoGrant !== undefined) {
      updateData.autoGrant = validatedData.autoGrant;
    }
    if (validatedData.maxRecipients !== undefined) {
      updateData.maxRecipients = validatedData.maxRecipients;
    }
    if (validatedData.cooldownPeriod !== undefined) {
      updateData.cooldownPeriod = validatedData.cooldownPeriod;
    }
    if (validatedData.validFrom !== undefined) {
      updateData.validFrom = new Date(validatedData.validFrom);
    }
    if (validatedData.validUntil !== undefined) {
      updateData.validUntil = validatedData.validUntil ? new Date(validatedData.validUntil) : null;
    }

    // Actualizar la regla
    const updatedRule = await db.incentiveRule.update({
      where: { id },
      data: updateData,
    });

    logger.info('Regla de incentivo actualizada', {
      adminId: user.id,
      ruleId: id,
      changes: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      rule: {
        id: updatedRule.id,
        name: updatedRule.name,
        description: updatedRule.description,
        type: updatedRule.type,
        category: updatedRule.category,
        criteria: JSON.parse(updatedRule.criteria),
        rewards: JSON.parse(updatedRule.rewards),
        isActive: updatedRule.isActive,
        autoGrant: updatedRule.autoGrant,
        maxRecipients: updatedRule.maxRecipients,
        cooldownPeriod: updatedRule.cooldownPeriod,
        validFrom: updatedRule.validFrom.toISOString(),
        validUntil: updatedRule.validUntil?.toISOString() || null,
        createdAt: updatedRule.createdAt.toISOString(),
        updatedAt: updatedRule.updatedAt.toISOString(),
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

    logger.error('Error actualizando regla de incentivo:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * DELETE /api/admin/incentives/[id]
 * Elimina una regla de incentivo (soft delete: desactiva en lugar de eliminar)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Verificar que la regla existe
    const existingRule = await db.incentiveRule.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            runnerIncentives: true,
          },
        },
      },
    });

    if (!existingRule) {
      return NextResponse.json({ error: 'Regla de incentivo no encontrada' }, { status: 404 });
    }

    // En lugar de eliminar físicamente, desactivamos la regla
    // Esto preserva los incentivos ya otorgados
    const updatedRule = await db.incentiveRule.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    logger.info('Regla de incentivo desactivada', {
      adminId: user.id,
      ruleId: id,
      ruleName: existingRule.name,
      totalIncentives: existingRule._count.runnerIncentives,
    });

    return NextResponse.json({
      success: true,
      message: 'Regla de incentivo desactivada exitosamente',
      rule: {
        id: updatedRule.id,
        name: updatedRule.name,
        isActive: updatedRule.isActive,
      },
    });
  } catch (error) {
    logger.error('Error desactivando regla de incentivo:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
