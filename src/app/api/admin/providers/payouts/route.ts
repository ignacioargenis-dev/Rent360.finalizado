import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ProviderPayoutsService } from '@/lib/provider-payouts-service';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * GET /api/admin/providers/payouts
 * Obtiene payouts pendientes de proveedores para aprobación
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let payouts;

    if (status === 'pending') {
      // Obtener payouts pendientes para aprobación
      payouts = await ProviderPayoutsService.calculatePendingProviderPayouts();
    } else {
      // Para payouts procesados, obtendríamos de la base de datos
      payouts = [];
    }

    // Paginación simple
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPayouts = payouts.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedPayouts,
      pagination: {
        page,
        limit,
        total: payouts.length,
        totalPages: Math.ceil(payouts.length / limit)
      },
      summary: {
        totalPayouts: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        maintenanceProviders: payouts.filter(p => p.recipientType === 'maintenance_provider').length,
        serviceProviders: payouts.filter(p => p.recipientType === 'service_provider').length
      }
    });

  } catch (error) {
    logger.error('Error obteniendo payouts de proveedores:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/providers/payouts
 * Calcula payouts pendientes para un período específico
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { startDate, endDate } = body;

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const payouts = await ProviderPayoutsService.calculatePendingProviderPayouts(start, end);

    logger.info('Payouts calculados por administrador', {
      adminId: user.id,
      period: { start: start?.toISOString(), end: end?.toISOString() },
      totalPayouts: payouts.length,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
    });

    return NextResponse.json({
      success: true,
      data: payouts,
      summary: {
        totalPayouts: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        maintenanceProviders: payouts.filter(p => p.recipientType === 'maintenance_provider').length,
        serviceProviders: payouts.filter(p => p.recipientType === 'service_provider').length
      }
    });

  } catch (error) {
    logger.error('Error calculando payouts por período:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
