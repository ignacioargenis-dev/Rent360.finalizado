import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CommissionService } from '@/lib/commission-service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * GET /api/broker/commissions
 * Obtiene las estadísticas de comisiones del corredor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo corredores pueden acceder a sus comisiones
    if (user.role !== 'broker') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo corredores pueden acceder a esta información.' },
        { status: 403 }
      );
    }

    const stats = await CommissionService.getBrokerCommissionStats(user.id);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de comisiones:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/broker/commissions/calculate
 * Calcula la comisión para un contrato específico
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'broker') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo corredores pueden calcular comisiones.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json(
        { error: 'ID de contrato requerido' },
        { status: 400 }
      );
    }

    const calculation = await CommissionService.calculateCommission(contractId, user.id);

    return NextResponse.json({
      success: true,
      data: calculation
    });

  } catch (error) {
    logger.error('Error calculando comisión:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
