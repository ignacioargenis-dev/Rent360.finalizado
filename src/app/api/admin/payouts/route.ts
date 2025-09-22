import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PayoutService } from '@/lib/payout-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/admin/payouts
 * Obtiene estadísticas generales de payouts
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const stats = await PayoutService.getPayoutStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de payouts:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/payouts/calculate
 * Calcula payouts pendientes para un período
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
      recipientType = 'broker',
      startDate,
      endDate
    } = body;

    const payouts = await PayoutService.calculatePendingPayouts(
      recipientType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: payouts,
      summary: {
        totalPayouts: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        averageAmount: payouts.length > 0
          ? payouts.reduce((sum, p) => sum + p.amount, 0) / payouts.length
          : 0
      }
    });

  } catch (error) {
    logger.error('Error calculando payouts:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
