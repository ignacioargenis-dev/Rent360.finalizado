import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CommissionService } from '@/lib/commission-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/admin/commissions
 * Obtiene estadísticas globales de comisiones (todos los brokers)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Para admin, podríamos retornar config por defecto
    const config = {
      defaultCommissionRate: 5.0,
      paymentTermDays: 30,
      currency: 'CLP',
      description: 'Configuración de comisiones del sistema',
    };

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración de comisiones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/commissions/calculate
 * Calcula comisión para un contrato específico (admin)
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
    const { contractId, brokerId } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'ID de contrato requerido' }, { status: 400 });
    }

    const calculation = await CommissionService.calculateCommission(contractId);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  } catch (error) {
    logger.error('Error calculando comisión:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
