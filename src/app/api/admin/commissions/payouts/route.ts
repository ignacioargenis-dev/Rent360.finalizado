import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CommissionService } from '@/lib/commission-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/admin/commissions/payouts
 * Genera un payout de comisiones para un broker
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
    const { brokerId, startDate, endDate } = body;

    if (!brokerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'brokerId, startDate y endDate son requeridos' },
        { status: 400 }
      );
    }

    const payout = await CommissionService.generateCommissionPayout(
      brokerId,
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Payout de comisión generado exitosamente'
    });

  } catch (error) {
    logger.error('Error generando payout de comisión:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
