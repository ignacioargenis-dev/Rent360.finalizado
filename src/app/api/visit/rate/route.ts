import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { RunnerRatingService } from '@/lib/runner-rating-service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { BusinessLogicError } from '@/lib/errors';

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
      isAnonymous = false,
    } = body;

    // Validar campos requeridos
    if (
      !visitId ||
      !overallRating ||
      !punctualityRating ||
      !professionalismRating ||
      !communicationRating ||
      !propertyKnowledgeRating
    ) {
      return NextResponse.json(
        {
          error:
            'Campos requeridos: visitId, overallRating, punctualityRating, professionalismRating, communicationRating, propertyKnowledgeRating',
          missingFields: [],
        },
        { status: 400 }
      );
    }

    // Obtener la visita y verificar permisos
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        runner: { select: { id: true } },
        tenant: { select: { id: true } },
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario es el cliente (tenant) o el propietario (owner) de la visita
    const isTenant = visit.tenantId === user.id;
    const isOwner = visit.property.ownerId === user.id;

    if (!isTenant && !isOwner) {
      return NextResponse.json(
        { error: 'No tienes permiso para calificar esta visita' },
        { status: 403 }
      );
    }

    // Verificar que no haya una calificación existente para este usuario (tenant o owner)
    const existingRating = await db.runnerRating.findUnique({
      where: {
        visitId_clientId: {
          visitId,
          clientId: user.id,
        },
      },
    });

    if (existingRating) {
      return NextResponse.json({ error: 'Ya has calificado esta visita' }, { status: 409 });
    }

    // Usar el ID del usuario como clientId (tanto tenant como owner pueden calificar)
    const rating = await RunnerRatingService.createRunnerRating({
      visitId,
      runnerId: visit.runner.id,
      clientId: user.id,
      overallRating,
      punctualityRating,
      professionalismRating,
      communicationRating,
      propertyKnowledgeRating,
      comment: comment || null,
      positiveFeedback: positiveFeedback || [],
      improvementAreas: improvementAreas || [],
      isAnonymous,
    });

    logger.info('Nueva calificación creada', {
      visitId,
      clientId: user.id,
      overallRating,
      ratingId: rating.id,
    });

    return NextResponse.json({
      success: true,
      data: rating,
      message: 'Calificación enviada exitosamente',
    });
  } catch (error) {
    logger.error('Error creando calificación:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Si es un BusinessLogicError, devolver el mensaje específico con el código correcto
    if (error instanceof BusinessLogicError) {
      // Si el mensaje indica que ya existe una calificación, devolver 409
      if (
        error.message.includes('Ya existe una calificación') ||
        error.message.includes('Ya has calificado')
      ) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: 'CONFLICT_ERROR',
          },
          { status: 409 }
        );
      }

      // Otros errores de negocio devuelven 400
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: 'BUSINESS_LOGIC_ERROR',
        },
        { status: 400 }
      );
    }

    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
