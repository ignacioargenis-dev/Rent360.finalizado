import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { UserRatingService, UserRatingData } from '@/lib/user-rating-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';
import { RatingContextType } from '@/types/index';

const createRatingSchema = z.object({
  fromUserId: z.string().optional(), // Usuario que califica (opcional, por defecto el autenticado)
  toUserId: z.string().min(1, 'ID del usuario a calificar requerido'),
  contextType: z.enum(['CONTRACT', 'SERVICE', 'MAINTENANCE', 'PROPERTY_VISIT', 'GENERAL', 'OTHER']),
  contextId: z.string().min(1, 'ID del contexto requerido'),
  overallRating: z.number().min(1).max(5, 'La calificación debe estar entre 1 y 5'),
  communicationRating: z.number().min(1).max(5).optional(),
  reliabilityRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  punctualityRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  positiveFeedback: z.array(z.string()).optional(),
  improvementAreas: z.array(z.string()).optional(),
  propertyId: z.string().optional(),
  contractId: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * POST /api/ratings
 * Crear una nueva calificación
 */
export async function POST(request: NextRequest) {
  console.log('🚀🚀🚀 [API RATINGS] POST request received at:', new Date().toISOString());

  try {
    const user = await requireAuth(request);

    const body = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = createRatingSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Crear la calificación
    const ratingData: any = {
      fromUserId: validatedData.fromUserId || user.id,
      toUserId: validatedData.toUserId,
      contextType: validatedData.contextType,
      contextId: validatedData.contextId,
      overallRating: validatedData.overallRating,
    };

    // Agregar campos opcionales solo si están definidos
    if (validatedData.communicationRating !== undefined) {
      ratingData.communicationRating = validatedData.communicationRating;
    }
    if (validatedData.reliabilityRating !== undefined) {
      ratingData.reliabilityRating = validatedData.reliabilityRating;
    }
    if (validatedData.professionalismRating !== undefined) {
      ratingData.professionalismRating = validatedData.professionalismRating;
    }
    if (validatedData.qualityRating !== undefined) {
      ratingData.qualityRating = validatedData.qualityRating;
    }
    if (validatedData.punctualityRating !== undefined) {
      ratingData.punctualityRating = validatedData.punctualityRating;
    }
    if (validatedData.comment !== undefined) {
      ratingData.comment = validatedData.comment;
    }
    if (validatedData.positiveFeedback !== undefined) {
      ratingData.positiveFeedback = validatedData.positiveFeedback;
    }
    if (validatedData.improvementAreas !== undefined) {
      ratingData.improvementAreas = validatedData.improvementAreas;
    }
    if (validatedData.propertyId !== undefined) {
      ratingData.propertyId = validatedData.propertyId;
    }
    if (validatedData.contractId !== undefined) {
      ratingData.contractId = validatedData.contractId;
    }
    if (validatedData.isAnonymous !== undefined) {
      ratingData.isAnonymous = validatedData.isAnonymous;
    }
    if (validatedData.isPublic !== undefined) {
      ratingData.isPublic = validatedData.isPublic;
    }

    const rating = await UserRatingService.createRating(ratingData as UserRatingData);

    return NextResponse.json(
      {
        success: true,
        data: rating,
        message: 'Calificación enviada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * GET /api/ratings/summary
 * Obtener resumen de calificaciones del usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar si es una petición de resumen
    const { searchParams } = new URL(request.url);
    const isSummary = searchParams.get('summary') === 'true';

    if (isSummary) {
      const summary = await UserRatingService.getUserRatingSummary(user.id);

      return NextResponse.json({
        success: true,
        data: summary || {
          userId: user.id,
          userName: user.name || 'Usuario',
          totalRatings: 0,
          averageRating: 0,
          ratingDistribution: {},
          averageCommunication: 0,
          averageReliability: 0,
          averageProfessionalism: 0,
          averageQuality: 0,
          averagePunctuality: 0,
        },
      });
    }

    // Código original para obtener calificaciones
    const userId = searchParams.get('userId'); // Para ver calificaciones de otro usuario
    const given = searchParams.get('given') === 'true'; // Si es true, buscar calificaciones dadas por el usuario
    const contextType = searchParams.get('contextType') as RatingContextType;
    const isPublic = searchParams.get('isPublic') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Si no se especifica userId, mostrar calificaciones del usuario autenticado
    const targetUserId = userId || user.id;

    const filters: any = {
      limit,
      offset,
      given, // Nuevo filtro para buscar calificaciones dadas
    };

    if (contextType) {
      filters.contextType = contextType;
    }
    if (isPublic !== undefined) {
      filters.isPublic = isPublic;
    }

    const { ratings, total } = await UserRatingService.getUserRatings(targetUserId, filters);

    return NextResponse.json({
      success: true,
      data: { ratings, total },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo calificaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
