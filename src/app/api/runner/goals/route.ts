import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/runner/goals
 * Obtiene las metas del runner
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period'); // MONTHLY, WEEKLY, QUARTERLY, YEARLY
    const isActive = searchParams.get('isActive'); // true, false, o null para todos

    const whereClause: any = {
      runnerId: user.id,
    };

    if (period) {
      whereClause.period = period;
    }

    if (isActive !== null && isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Obtener metas activas del período actual si no se especifica
    if (!period) {
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      whereClause.periodStart = {
        lte: currentMonthEnd,
      };
      whereClause.periodEnd = {
        gte: currentMonthStart,
      };
    }

    const goals = await db.runnerGoal.findMany({
      where: whereClause,
      orderBy: [{ periodStart: 'desc' }, { goalType: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      goals: goals.map(goal => ({
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
      })),
    });
  } catch (error) {
    logger.error('Error obteniendo metas del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al obtener las metas' }, { status: 500 });
  }
}

/**
 * POST /api/runner/goals
 * Crea una nueva meta para el runner
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const body = await request.json();
    const { goalType, targetValue, period, periodStart, periodEnd, notes } = body;

    // Validaciones
    if (!goalType || !targetValue || !period) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: goalType, targetValue, period' },
        { status: 400 }
      );
    }

    const validGoalTypes = [
      'VISITS',
      'EARNINGS',
      'RATING',
      'CONVERSION_RATE',
      'ON_TIME_RATE',
      'RESPONSE_TIME',
    ];
    if (!validGoalTypes.includes(goalType)) {
      return NextResponse.json(
        { error: `goalType debe ser uno de: ${validGoalTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const validPeriods = ['MONTHLY', 'WEEKLY', 'QUARTERLY', 'YEARLY'];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `period debe ser uno de: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    // Calcular fechas del período si no se proporcionan
    let startDate: Date;
    let endDate: Date;

    if (periodStart && periodEnd) {
      startDate = new Date(periodStart);
      endDate = new Date(periodEnd);
    } else {
      const now = new Date();
      switch (period) {
        case 'WEEKLY': {
          const dayOfWeek = now.getDay();
          const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lunes
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        }
        case 'MONTHLY': {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        }
        case 'QUARTERLY': {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
          break;
        }
        case 'YEARLY': {
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          break;
        }
        default:
          startDate = new Date();
          endDate = new Date();
      }
    }

    // Verificar si ya existe una meta activa del mismo tipo y período
    const existingGoal = await db.runnerGoal.findFirst({
      where: {
        runnerId: user.id,
        goalType,
        period,
        isActive: true,
        periodStart: {
          lte: endDate,
        },
        periodEnd: {
          gte: startDate,
        },
      },
    });

    if (existingGoal) {
      return NextResponse.json(
        { error: 'Ya existe una meta activa de este tipo para el período seleccionado' },
        { status: 409 }
      );
    }

    const goal = await db.runnerGoal.create({
      data: {
        runnerId: user.id,
        goalType,
        targetValue: parseFloat(targetValue),
        currentValue: 0,
        period,
        periodStart: startDate,
        periodEnd: endDate,
        isActive: true,
        isAchieved: false,
        notes: notes || null,
      },
    });

    logger.info('Meta creada para runner', {
      runnerId: user.id,
      goalId: goal.id,
      goalType,
      targetValue,
      period,
    });

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
        notes: goal.notes,
        createdAt: goal.createdAt.toISOString(),
        updatedAt: goal.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error creando meta del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al crear la meta' }, { status: 500 });
  }
}
