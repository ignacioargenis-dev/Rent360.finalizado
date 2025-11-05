import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { getUserFromRequest } from '@/lib/auth-token-validator';

// Forzar renderizado dinámico para evitar caché y asegurar que la ruta funcione correctamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * DELETE /api/messages/[id]
 * Eliminar un mensaje (marcarlo como eliminado)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar token directamente - NO depender del middleware
    const decoded = await getUserFromRequest(request);

    if (!decoded) {
      logger.error('/api/messages/[id] (DELETE): Token inválido o no presente');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Token de autenticación inválido o no presente',
        },
        { status: 401 }
      );
    }

    // Crear objeto user compatible
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    console.log('✅ Messages API: Usuario autenticado (DELETE):', user.email, 'ID:', user.id);

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
    // Validar token directamente - NO depender del middleware
    const decoded = await getUserFromRequest(request);

    if (!decoded) {
      logger.error('/api/messages/[id] (GET): Token inválido o no presente');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Token de autenticación inválido o no presente',
        },
        { status: 401 }
      );
    }

    // Crear objeto user compatible
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    console.log('✅ Messages API: Usuario autenticado (GET):', user.email, 'ID:', user.id);

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
