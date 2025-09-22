import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/provider/stats
 * Obtiene estadísticas del proveedor actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE_PROVIDER' && user.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    // Aquí iría la lógica para calcular estadísticas reales del proveedor
    // Por ahora devolvemos datos de ejemplo
    const mockStats = {
      totalEarnings: 1250000,
      thisMonthEarnings: 350000,
      lastMonthEarnings: 280000,
      pendingPayments: 2,
      completedJobs: 28,
      averageRating: 4.7,
      gracePeriodDays: user.role === 'MAINTENANCE_PROVIDER' ? 15 : 7,
      commissionPercentage: user.role === 'MAINTENANCE_PROVIDER' ? 10 : 8
    };

    logger.info('Estadísticas obtenidas para proveedor', {
      providerId: user.id,
      role: user.role,
      totalEarnings: mockStats.totalEarnings
    });

    return NextResponse.json({
      success: true,
      data: mockStats
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas del proveedor:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
