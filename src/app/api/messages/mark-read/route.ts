import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

const markReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, 'Debe proporcionar al menos un ID de mensaje'),
});

/**
 * POST /api/messages/mark-read
 * Marcar múltiples mensajes como leídos
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = markReadSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { messageIds } = validatedData;

    // Verificar que todos los mensajes existen y pertenecen al usuario
    const messages = await db.message.findMany({
      where: {
        id: { in: messageIds },
        receiverId: user.id, // Solo mensajes recibidos por el usuario
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    // Verificar que se encontraron todos los mensajes
    const foundIds = messages.map(m => m.id);
    const notFoundIds = messageIds.filter(id => !foundIds.includes(id));

    if (notFoundIds.length > 0) {
      return NextResponse.json(
        {
          error: 'Algunos mensajes no fueron encontrados o no tienes acceso a ellos',
          notFoundIds,
        },
        { status: 404 }
      );
    }

    // Filtrar mensajes que ya están leídos
    const unreadMessages = messages.filter(m => !m.isRead);
    const alreadyReadCount = messages.length - unreadMessages.length;

    if (unreadMessages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos los mensajes ya estaban marcados como leídos',
        data: {
          markedAsRead: 0,
          alreadyRead: alreadyReadCount,
          total: messages.length,
        },
      });
    }

    // Marcar como leídos
    const updateResult = await db.message.updateMany({
      where: {
        id: { in: unreadMessages.map(m => m.id) },
        receiverId: user.id,
      },
      data: {
        isRead: true,
        readAt: new Date(),
        status: 'READ',
      },
    });

    logger.info('Mensajes marcados como leídos', {
      userId: user.id,
      markedAsRead: updateResult.count,
      alreadyRead: alreadyReadCount,
      totalRequested: messageIds.length,
    });

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} mensaje(s) marcado(s) como leído(s)`,
      data: {
        markedAsRead: updateResult.count,
        alreadyRead: alreadyReadCount,
        total: messageIds.length,
      },
    });
  } catch (error) {
    logger.error('Error marcando mensajes como leídos:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
