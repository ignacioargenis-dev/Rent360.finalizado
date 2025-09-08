import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ProviderPayoutsService } from '@/lib/provider-payouts-service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * POST /api/admin/providers/payouts/[transactionId]/approve
 * Aprueba y ejecuta un payout pendiente de proveedor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
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

    // Aprobar y ejecutar el payout
    const result = await ProviderPayoutsService.approveProviderPayout(transactionId, user.id);

    if (result.success) {
      logger.info('Payout de proveedor aprobado exitosamente', {
        transactionId,
        adminId: user.id,
        approvedAt: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: 'Payout aprobado y procesado exitosamente',
        data: {
          transactionId,
          approvedBy: user.id,
          approvedAt: new Date().toISOString()
        }
      });
    } else {
      logger.warn('Error aprobando payout de proveedor', {
        transactionId,
        adminId: user.id,
        error: result.error
      });

      return NextResponse.json({
        success: false,
        error: result.error || 'Error desconocido'
      }, { status: 400 });
    }

  } catch (error) {
    logger.error('Error aprobando payout de proveedor:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
