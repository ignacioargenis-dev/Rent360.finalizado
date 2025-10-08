import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRatingService } from '@/lib/user-rating-service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/ratings/summary/[userId]
 * Obtener resumen de calificaciones de un usuario
 */
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const user = await requireAuth(request);
    const targetUserId = params.userId;

    // Obtener el resumen de calificaciones
    const summary = await UserRatingService.getUserRatingSummary(targetUserId);

    if (!summary) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error('Error obteniendo resumen de calificaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
