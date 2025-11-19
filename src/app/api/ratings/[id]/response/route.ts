import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';
import { NotificationService, NotificationType } from '@/lib/notification-service';

const responseSchema = z.object({
  response: z
    .string()
    .min(1, 'La respuesta no puede estar vacía')
    .max(1000, 'La respuesta es demasiado larga'),
});

/**
 * POST /api/ratings/[id]/response
 * Responder a una calificación (solo el usuario calificado puede responder)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ratingId = params.id;

    const body = await request.json();
    const validatedData = responseSchema.parse(body);

    // Obtener la calificación
    const rating = await db.userRating.findUnique({
      where: { id: ratingId },
      include: {
        fromUser: {
          select: { id: true, name: true },
        },
        toUser: {
          select: { id: true, name: true },
        },
      },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Calificación no encontrada' }, { status: 404 });
    }

    // Solo el usuario calificado puede responder
    if (rating.toUserId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes responder a calificaciones que recibiste' },
        { status: 403 }
      );
    }

    // Actualizar la calificación con la respuesta
    const updatedRating = await db.userRating.update({
      where: { id: ratingId },
      data: {
        response: validatedData.response,
        responseDate: new Date(),
      },
      include: {
        fromUser: {
          select: { id: true, name: true, avatar: true },
        },
        toUser: {
          select: { id: true, name: true, avatar: true },
        },
        property: {
          select: { id: true, title: true, address: true },
        },
      },
    });

    // Enviar notificación al usuario que calificó
    try {
      await NotificationService.create({
        userId: rating.fromUserId,
        type: NotificationType.NEW_MESSAGE,
        title: '💬 Respuesta a tu Calificación',
        message: `${rating.toUser.name || 'El usuario'} ha respondido a tu calificación`,
        link: `/ratings?ratingId=${ratingId}`,
        metadata: {
          ratingId: ratingId,
          responderId: rating.toUserId,
          responderName: rating.toUser.name,
          type: 'rating_response',
        },
      });
    } catch (notificationError) {
      logger.warn('Error sending response notification', { error: notificationError });
    }

    logger.info('Respuesta agregada a calificación', {
      ratingId,
      toUserId: rating.toUserId,
    });

    return NextResponse.json({
      success: true,
      data: updatedRating,
      message: 'Respuesta enviada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.format() },
        { status: 400 }
      );
    }

    logger.error('Error agregando respuesta a calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * DELETE /api/ratings/[id]/response
 * Eliminar respuesta a una calificación
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ratingId = params.id;

    // Obtener la calificación
    const rating = await db.userRating.findUnique({
      where: { id: ratingId },
    });

    if (!rating) {
      return NextResponse.json({ error: 'Calificación no encontrada' }, { status: 404 });
    }

    // Solo el usuario calificado puede eliminar su respuesta
    if (rating.toUserId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes eliminar tu propia respuesta' },
        { status: 403 }
      );
    }

    // Eliminar la respuesta
    await db.userRating.update({
      where: { id: ratingId },
      data: {
        response: null,
        responseDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Respuesta eliminada exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando respuesta:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
