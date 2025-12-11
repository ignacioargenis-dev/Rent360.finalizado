import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/runner/goals/[goalId]
 * Obtiene una meta específica
 */
export async function GET(request: NextRequest, { params }: { params: { goalId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const goal = await db.runnerGoal.findUnique({
      where: {
        id: params.goalId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 });
    }

    if (goal.runnerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta meta' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        goalType: goal.goalType,
        targetValue: goal.targetValue,
        currentValue: goal.currentValue,
        period: goal.period,
        periodStart: goal.periodStart.toISOString(),
        periodEnd: goal.periodEnd.toISOString(),
        isActive: goal.isActive,
        isAchieved: goal.isAchieved,
        achievedAt: goal.achievedAt?.toISOString() || null,
        notes: goal.notes,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
        progress:
          goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo meta del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al obtener la meta' }, { status: 500 });
  }
}

/**
 * PUT /api/runner/goals/[goalId]
 * Actualiza una meta existente
 */
export async function PUT(request: NextRequest, { params }: { params: { goalId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const goal = await db.runnerGoal.findUnique({
      where: {
        id: params.goalId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 });
    }

    if (goal.runnerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta meta' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetValue, isActive, notes } = body;

    const updateData: any = {};

    if (targetValue !== undefined) {
      updateData.targetValue = parseFloat(targetValue);
      // Si se actualiza el targetValue, recalcular isAchieved
      if (goal.currentValue >= parseFloat(targetValue)) {
        updateData.isAchieved = true;
        if (!goal.achievedAt) {
          updateData.achievedAt = new Date();
        }
      } else {
        updateData.isAchieved = false;
        updateData.achievedAt = null;
      }
    }

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const updatedGoal = await db.runnerGoal.update({
      where: {
        id: params.goalId,
      },
      data: updateData,
    });

    logger.info('Meta actualizada para runner', {
      runnerId: user.id,
      goalId: updatedGoal.id,
      updates: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      goal: {
        id: updatedGoal.id,
        goalType: updatedGoal.goalType,
        targetValue: updatedGoal.targetValue,
        currentValue: updatedGoal.currentValue,
        period: updatedGoal.period,
        periodStart: updatedGoal.periodStart.toISOString(),
        periodEnd: updatedGoal.periodEnd.toISOString(),
        isActive: updatedGoal.isActive,
        isAchieved: updatedGoal.isAchieved,
        achievedAt: updatedGoal.achievedAt?.toISOString() || null,
        notes: updatedGoal.notes,
        createdAt: updatedGoal.createdAt.toISOString(),
        updatedAt: updatedGoal.updatedAt.toISOString(),
        progress:
          updatedGoal.targetValue > 0
            ? Math.min(100, (updatedGoal.currentValue / updatedGoal.targetValue) * 100)
            : 0,
      },
    });
  } catch (error) {
    logger.error('Error actualizando meta del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al actualizar la meta' }, { status: 500 });
  }
}

/**
 * DELETE /api/runner/goals/[goalId]
 * Elimina una meta (marca como inactiva)
 */
export async function DELETE(request: NextRequest, { params }: { params: { goalId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const goal = await db.runnerGoal.findUnique({
      where: {
        id: params.goalId,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Meta no encontrada' }, { status: 404 });
    }

    if (goal.runnerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta meta' },
        { status: 403 }
      );
    }

    // Marcar como inactiva en lugar de eliminar
    const updatedGoal = await db.runnerGoal.update({
      where: {
        id: params.goalId,
      },
      data: {
        isActive: false,
      },
    });

    logger.info('Meta desactivada para runner', {
      runnerId: user.id,
      goalId: updatedGoal.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Meta desactivada correctamente',
    });
  } catch (error) {
    logger.error('Error eliminando meta del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al eliminar la meta' }, { status: 500 });
  }
}
