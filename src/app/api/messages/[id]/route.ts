import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * DELETE /api/messages/[id]
 * Eliminar un mensaje (marcarlo como eliminado)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
        status: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario es el remitente o receptor del mensaje
    if (message.senderId !== user.id && message.receiverId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este mensaje' },
        { status: 403 }
      );
    }

    // Marcar como eliminado
    const updatedMessage = await db.message.update({
      where: { id: messageId },
      data: {
        status: 'DELETED',
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    logger.info('Mensaje eliminado', {
      messageId,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Mensaje eliminado exitosamente',
      data: updatedMessage,
    });
  } catch (error) {
    logger.error('Error eliminando mensaje:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * GET /api/messages/[id]
 * Obtener detalles de un mensaje específico
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const messageId = params.id;

    // Obtener mensaje con todos los detalles
    const message = await db.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
            startDate: true,
            endDate: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario es el remitente o receptor del mensaje
    if (message.senderId !== user.id && message.receiverId !== user.id) {
      return NextResponse.json({ error: 'No tienes acceso a este mensaje' }, { status: 403 });
    }

    // Si el usuario es el receptor y el mensaje no está leído, marcarlo como leído
    if (message.receiverId === user.id && !message.isRead) {
      await db.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date(),
          status: 'READ',
        },
      });

      // Actualizar el objeto message
      message.isRead = true;
      message.readAt = new Date();
      message.status = 'READ';
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  } catch (error) {
    logger.error('Error obteniendo mensaje:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
