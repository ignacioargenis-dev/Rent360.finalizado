import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRatingService, UserRatingData } from '@/lib/user-rating-service';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

const updateRatingSchema = z.object({
  overallRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  reliabilityRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  punctualityRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  positiveFeedback: z.array(z.string()).optional(),
  improvementAreas: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/ratings/[id]
 * Obtener detalles de una calificación específica
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ratingId = params.id;

    // Obtener la calificación
    const rating = await db.userRating.findUnique({
      where: { id: ratingId },
      include: {
        fromUser: {
          select: { id: true, name: true, avatar: true },
        },
        toUser: {
          select: { id: true, name: true, avatar: true },
        },
        property: {
          select: { id: true, title: true, address: true, city: true },
        },
        contract: {
          select: { id: true, contractNumber: true, monthlyRent: true },
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Calificación no encontrada' }, { status: 404 });
    }

    // Verificar permisos: solo el autor o el receptor pueden ver la calificación
    if (rating.fromUserId !== user.id && rating.toUserId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'No tienes acceso a esta calificación' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: rating,
    });
  } catch (error) {
    logger.error('Error obteniendo calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/ratings/[id]
 * Actualizar una calificación (solo el autor puede editarla)
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ratingId = params.id;

    const body = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = updateRatingSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Actualizar la calificación
    const updateData: Partial<UserRatingData> = {};
    if (validatedData.overallRating !== undefined) {
      updateData.overallRating = validatedData.overallRating;
    }
    if (validatedData.communicationRating !== undefined) {
      updateData.communicationRating = validatedData.communicationRating;
    }
    if (validatedData.reliabilityRating !== undefined) {
      updateData.reliabilityRating = validatedData.reliabilityRating;
    }
    if (validatedData.professionalismRating !== undefined) {
      updateData.professionalismRating = validatedData.professionalismRating;
    }
    if (validatedData.qualityRating !== undefined) {
      updateData.qualityRating = validatedData.qualityRating;
    }
    if (validatedData.punctualityRating !== undefined) {
      updateData.punctualityRating = validatedData.punctualityRating;
    }
    if (validatedData.comment !== undefined) {
      updateData.comment = validatedData.comment;
    }
    if (validatedData.positiveFeedback !== undefined) {
      updateData.positiveFeedback = validatedData.positiveFeedback;
    }
    if (validatedData.improvementAreas !== undefined) {
      updateData.improvementAreas = validatedData.improvementAreas;
    }
    if (validatedData.isAnonymous !== undefined) {
      updateData.isAnonymous = validatedData.isAnonymous;
    }
    if (validatedData.isPublic !== undefined) {
      updateData.isPublic = validatedData.isPublic;
    }

    const updatedRating = await UserRatingService.updateRating(ratingId, user.id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedRating,
      message: 'Calificación actualizada exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * DELETE /api/ratings/[id]
 * Eliminar una calificación (solo el autor puede eliminarla)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ratingId = params.id;

    // Eliminar la calificación
    await UserRatingService.deleteRating(ratingId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Calificación eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
