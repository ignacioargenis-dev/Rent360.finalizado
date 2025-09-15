import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerPayoutService } from '@/lib/payout-service';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * POST /api/admin/runners/payouts/[transactionId]/approve
 * Aprueba un payout pendiente de runner
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { transactionId } = params;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transacción requerido' },
        { status: 400 }
      );
    }

    // Aprobar el payout
    const result = await RunnerPayoutService.approveRunnerPayout(
      transactionId,
      user.id
    );

    if (result.success) {
      logger.info('Payout de runner aprobado', {
        transactionId,
        adminId: user.id,
        timestamp: new Date()
      });

      return NextResponse.json({
        success: true,
        message: 'Payout aprobado y procesado exitosamente',
        data: result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error aprobando payout'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error aprobando payout de runner:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
