import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerIncentivesService } from '@/lib/runner-incentives-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/runner/incentives/[incentiveId]/claim
 * Reclama un incentivo otorgado
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { incentiveId: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para runners.' },
        { status: 403 }
      );
    }

    const { incentiveId } = params;

    if (!incentiveId) {
      return NextResponse.json(
        { error: 'ID de incentivo requerido' },
        { status: 400 }
      );
    }

    const success = await RunnerIncentivesService.claimIncentive(incentiveId, user.id);

    if (success) {
      logger.info('Incentivo reclamado exitosamente', {
        incentiveId,
        runnerId: user.id
      });

      return NextResponse.json({
        success: true,
        message: 'Incentivo reclamado exitosamente'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No se pudo reclamar el incentivo'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error reclamando incentivo:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
