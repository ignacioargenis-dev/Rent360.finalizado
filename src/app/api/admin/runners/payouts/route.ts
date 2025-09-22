import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerPayoutService } from '@/lib/payout-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/admin/runners/payouts
 * Obtiene estadísticas y lista de payouts pendientes de runners
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener estadísticas de payouts de runners
    const stats = await RunnerPayoutService.getRunnerPayoutStats();

    // Obtener payouts pendientes o procesados según el filtro
    let payouts: any[] = [];
    if (status === 'pending') {
      payouts = await RunnerPayoutService.calculatePendingRunnerPayouts();
    } else {
      // Para payouts procesados, obtendríamos de la base de datos
      // payouts = await db.providerTransaction.findMany({...})
    }

    // Aplicar paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayouts = payouts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        payouts: paginatedPayouts,
        pagination: {
          page,
          limit,
          total: payouts.length,
          pages: Math.ceil(payouts.length / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo payouts de runners:', error as Error);
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/runners/payouts/calculate
 * Calcula payouts pendientes para un período específico
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
    const { startDate, endDate } = body;

    const payouts = await RunnerPayoutService.calculatePendingRunnerPayouts(
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
    logger.error('Error calculando payouts de runners:', error as Error);
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}
