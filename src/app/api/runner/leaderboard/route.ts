import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerIncentivesService } from '@/lib/runner-incentives-service';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * GET /api/runner/leaderboard
 * Obtiene el leaderboard de incentivos
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
    const period = (searchParams.get('period') || 'weekly') as 'weekly' | 'monthly';

    const leaderboard = await RunnerIncentivesService.generateIncentivesLeaderboard(period);

    return NextResponse.json({
      success: true,
      data: leaderboard
    });

  } catch (error) {
    logger.error('Error obteniendo leaderboard:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
