import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerIncentivesService } from '@/lib/runner-incentives-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { RunnerIncentiveStatus } from '@prisma/client';

/**
 * GET /api/runner/incentives
 * Obtiene los incentivos del runner actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status = statusParam ? (statusParam.toUpperCase() as RunnerIncentiveStatus) : undefined;

    const incentives = await RunnerIncentivesService.getRunnerIncentives(
      user.id,
      status,
      50 // limit
    );

    return NextResponse.json({
      success: true,
      data: incentives
    });

  } catch (error) {
    logger.error('Error obteniendo incentivos del runner:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
