import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService } from '@/lib/notification-service';

/**
 * PUT /api/messages/[id]/read
 * Marcar un mensaje como leído
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const messageId = params.id;

    // Verificar que el mensaje existe y pertenece al usuario
    const message = await db.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        readAt: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario es el receptor del mensaje
    if (message.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para marcar este mensaje' },
        { status: 403 }
      );
    }

    // Si ya está leído, retornar éxito
    if (message.isRead) {
      return NextResponse.json({
        success: true,
        message: 'Mensaje ya estaba marcado como leído',
        data: { id: messageId, isRead: true, readAt: message.readAt },
      });
    }

    // Obtener información del remitente para la notificación
    const sender = await db.user.findUnique({
      where: { id: message.senderId },
      select: { id: true, name: true },
    });

    // Marcar como leído
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ',
      },
      select: {
        id: true,
        isRead: true,
        readAt: true,
        status: true,
      },
    });

    // Enviar notificación al remitente
    if (sender) {
      try {
        await NotificationService.notifyMessageRead({
          senderId: message.senderId,
          readerId: user.id,
          readerName: user.name,
          messageId,
        });
      } catch (notificationError) {
        // No fallar la respuesta si hay error en notificaciones
        logger.warn('Error sending message read notification', { error: notificationError });
      }
    }

    logger.info('Mensaje marcado como leído', {
      messageId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje marcado como leído',
      data: updatedMessage,
    });
  } catch (error) {
    logger.error('Error marcando mensaje como leído:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
