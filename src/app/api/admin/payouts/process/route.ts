import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PayoutService } from '@/lib/payout-service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * POST /api/admin/payouts/process
 * Procesa un lote de payouts automáticamente
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      payouts,
      batchType = 'manual',
      notes
    } = body;

    if (!payouts || !Array.isArray(payouts) || payouts.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren payouts válidos para procesar' },
        { status: 400 }
      );
    }

    logger.info('Procesando lote de payouts', {
      adminId: user.id,
      payoutCount: payouts.length,
      batchType,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
    });

    const batch = await PayoutService.processPayoutBatch(payouts, {
      batchType,
      triggeredBy: user.id,
      notes
    });

    return NextResponse.json({
      success: true,
      data: batch,
      message: `Lote de payouts procesado exitosamente. ${batch.totalRecipients} destinatarios, ${batch.totalAmount.toLocaleString('es-CL')} CLP total.`
    });

  } catch (error) {
    logger.error('Error procesando lote de payouts:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
