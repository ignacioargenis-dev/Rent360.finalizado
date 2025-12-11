import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerReportsService } from '@/lib/runner-reports-service';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/runner/achievements
 * Obtiene los logros alcanzados por el runner
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para runners.' }, { status: 403 });
    }

    const achievements = await RunnerReportsService.getRunnerAchievements(user.id);

    return NextResponse.json({
      success: true,
      achievements,
    });
  } catch (error) {
    logger.error('Error obteniendo logros del runner:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al obtener los logros' }, { status: 500 });
  }
}
