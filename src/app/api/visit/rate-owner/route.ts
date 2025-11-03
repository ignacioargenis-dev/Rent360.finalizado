import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRatingService, UserRatingData } from '@/lib/user-rating-service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { RatingContextType } from '@/types/index';

/**
 * POST /api/visit/rate-owner
 * Permite a un runner calificar al propietario después de una visita
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Solo los runners pueden calificar a propietarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      visitId,
      overallRating,
      communicationRating,
      reliabilityRating,
      professionalismRating,
      qualityRating,
      punctualityRating,
      comment,
      positiveFeedback,
      improvementAreas,
      isAnonymous = false,
    } = body;

    // Validar campos requeridos
    if (!visitId || !overallRating) {
      return NextResponse.json(
        {
          error: 'Campos requeridos: visitId, overallRating',
          missingFields: [],
        },
        { status: 400 }
      );
    }

    // Obtener la visita y verificar permisos
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
            title: true,
            address: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario es el runner de la visita
    if (visit.runnerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para calificar esta visita' },
        { status: 403 }
      );
    }

    // Verificar que la propiedad tiene un propietario
    if (!visit.property.ownerId) {
      return NextResponse.json(
        { error: 'La propiedad no tiene un propietario asignado' },
        { status: 400 }
      );
    }

    // Verificar que no haya una calificación existente para esta visita desde el runner
    const existingRating = await db.userRating.findFirst({
      where: {
        fromUserId: user.id,
        toUserId: visit.property.ownerId,
        contextType: 'PROPERTY_VISIT',
        contextId: visitId,
      },
      select: {
        id: true,
        createdAt: true,
        overallRating: true,
      },
    });

    logger.info('Verificando calificación existente', {
      visitId,
      runnerId: user.id,
      ownerId: visit.property.ownerId,
      existingRatingId: existingRating?.id || null,
      hasExistingRating: !!existingRating,
    });

    if (existingRating) {
      logger.warn('Intento de calificar propietario duplicado', {
        visitId,
        runnerId: user.id,
        ownerId: visit.property.ownerId,
        existingRatingId: existingRating.id,
        existingRatingCreatedAt: existingRating.createdAt,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Ya has calificado este propietario para esta visita',
          code: 'ALREADY_RATED',
          existingRatingId: existingRating.id,
        },
        { status: 409 }
      );
    }

    // Crear la calificación usando UserRatingService
    const ratingData: UserRatingData = {
      fromUserId: user.id,
      toUserId: visit.property.ownerId,
      contextType: 'PROPERTY_VISIT' as RatingContextType,
      contextId: visitId,
      overallRating,
      communicationRating: communicationRating || undefined,
      reliabilityRating: reliabilityRating || undefined,
      professionalismRating: professionalismRating || undefined,
      qualityRating: qualityRating || undefined,
      punctualityRating: punctualityRating || undefined,
      comment: comment || undefined,
      positiveFeedback: positiveFeedback || [],
      improvementAreas: improvementAreas || [],
      propertyId: visit.propertyId,
      isAnonymous,
      isPublic: true,
    };

    const rating = await UserRatingService.createRating(ratingData);

    logger.info('Nueva calificación de propietario creada por runner', {
      visitId,
      runnerId: user.id,
      ownerId: visit.property.ownerId,
      overallRating,
      ratingId: rating.id,
    });

    return NextResponse.json({
      success: true,
      data: rating,
      message: 'Calificación enviada exitosamente',
    });
  } catch (error) {
    logger.error('Error creando calificación de propietario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
