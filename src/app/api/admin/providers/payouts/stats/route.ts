import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ProviderPayoutsService } from '@/lib/provider-payouts-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/admin/providers/payouts/stats
 * Obtiene estadísticas de payouts de proveedores
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

    const stats = await ProviderPayoutsService.getProviderPayoutStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de proveedores:', error as Error);
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}
