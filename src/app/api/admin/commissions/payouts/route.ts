import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CommissionService } from '@/lib/commission-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/admin/commissions/payouts
 * Genera un reporte de comisiones para un broker en un período
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
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

    // Obtener todas las comisiones del broker
    const allCommissions = await CommissionService.getBrokerCommissions(brokerId);

    // Filtrar por fecha
    const start = new Date(startDate);
    const end = new Date(endDate);

    const commissionsInPeriod = allCommissions.filter(commission => {
      const commissionDate = commission.dueDate;
      return commissionDate >= start && commissionDate <= end;
    });

    // Calcular totales
    const totalAmount = commissionsInPeriod.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidAmount = commissionsInPeriod
      .filter(c => c.paymentStatus === 'PAID')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const pendingAmount = commissionsInPeriod
      .filter(c => c.paymentStatus === 'PENDING')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const payout = {
      brokerId,
      period: { startDate, endDate },
      commissions: commissionsInPeriod,
      summary: {
        total: commissionsInPeriod.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        avgCommissionRate:
          commissionsInPeriod.length > 0
            ? commissionsInPeriod.reduce((sum, c) => sum + c.commissionRate, 0) /
              commissionsInPeriod.length
            : 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: payout,
      message: 'Reporte de comisiones generado exitosamente',
    });
  } catch (error) {
    logger.error('Error generando reporte de comisiones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
