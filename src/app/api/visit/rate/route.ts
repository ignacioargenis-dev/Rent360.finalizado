import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerRatingService } from '@/lib/runner-rating-service';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

/**
 * POST /api/visit/rate
 * Permite a un cliente calificar a un runner después de una visita
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const {
      visitId,
      overallRating,
      punctualityRating,
      professionalismRating,
      communicationRating,
      propertyKnowledgeRating,
      comment,
      positiveFeedback,
      improvementAreas,
      isAnonymous = false
    } = body;

    // Validar campos requeridos
    if (!visitId || !overallRating || !punctualityRating || !professionalismRating ||
        !communicationRating || !propertyKnowledgeRating) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: visitId, overallRating, punctualityRating, professionalismRating, communicationRating, propertyKnowledgeRating',
          missingFields: []
        },
        { status: 400 }
      );
    }

    // Verificar que el usuario pueda calificar esta visita
    const canRate = await RunnerRatingService.canRateVisit(visitId, user.id);
    if (!canRate) {
      return NextResponse.json(
        { error: 'No tienes permiso para calificar esta visita o ya ha sido calificada' },
        { status: 403 }
      );
    }

    // Crear la calificación
    const rating = await RunnerRatingService.createRunnerRating({
      visitId,
      clientId: user.id,
      overallRating,
      punctualityRating,
      professionalismRating,
      communicationRating,
      propertyKnowledgeRating,
      comment,
      positiveFeedback,
      improvementAreas,
      isAnonymous
    });

    logger.info('Nueva calificación creada', {
      visitId,
      clientId: user.id,
      overallRating,
      ratingId: rating.id
    });

    return NextResponse.json({
      success: true,
      data: rating,
      message: 'Calificación enviada exitosamente'
    });

  } catch (error) {
    logger.error('Error creando calificación:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
