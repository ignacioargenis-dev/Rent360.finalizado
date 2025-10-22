import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/messages/conversations
 * Obtener conversaciones agrupadas por usuario/contacto
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    console.log('🔍 MESSAGES API: Iniciando /api/messages/conversations');
    console.log('🔍 MESSAGES API: User from middleware:', user ? 'PRESENTE' : 'NO ENCONTRADO');
    console.log('🔍 MESSAGES API: User details:', user);

    logger.info('🔍 /api/messages/conversations: Verificando usuario', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });

    if (!user) {
      console.error('🔍 MESSAGES API: NO SE ENCONTRÓ USUARIO EN REQUEST');
      logger.error(
        '🔍 /api/messages/conversations: No se encontró información de usuario en la request'
      );
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    logger.info('Usuario autenticado para conversaciones:', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todos los participantes únicos con los que el usuario ha conversado
    const sentMessages = await db.message.findMany({
      where: {
        senderId: user.id,
        status: { not: 'DELETED' },
      },
      select: {
        receiverId: true,
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      distinct: ['receiverId'],
      orderBy: { createdAt: 'desc' },
    });

    const receivedMessages = await db.message.findMany({
      where: {
        receiverId: user.id,
        status: { not: 'DELETED' },
      },
      select: {
        senderId: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
      distinct: ['senderId'],
      orderBy: { createdAt: 'desc' },
    });

    // Crear un mapa de participantes únicos
    const participantsMap = new Map();

    // Agregar receptores de mensajes enviados
    sentMessages.forEach(msg => {
      if (msg.receiver) {
        participantsMap.set(msg.receiver.id, msg.receiver);
      }
    });

    // Agregar emisores de mensajes recibidos
    receivedMessages.forEach(msg => {
      if (msg.sender) {
        participantsMap.set(msg.sender.id, msg.sender);
      }
    });

    // Para cada participante, obtener la información de la conversación
    const conversations = [];

    for (const [participantId, participant] of participantsMap.entries()) {
      // Obtener el último mensaje entre el usuario y este participante
      const lastMessage = await db.message.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: participantId },
            { senderId: participantId, receiverId: user.id },
          ],
          status: { not: 'DELETED' },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          content: true,
          createdAt: true,
          subject: true,
          type: true,
          isRead: true,
          receiverId: true,
        },
      });

      if (lastMessage) {
        // Contar mensajes no leídos (solo los que recibió el usuario actual)
        const unreadCount = await db.message.count({
          where: {
            senderId: participantId,
            receiverId: user.id,
            isRead: false,
            status: { not: 'DELETED' },
          },
        });

        // Contar total de mensajes
        const totalMessages = await db.message.count({
          where: {
            OR: [
              { senderId: user.id, receiverId: participantId },
              { senderId: participantId, receiverId: user.id },
            ],
            status: { not: 'DELETED' },
          },
        });

        conversations.push({
          participant,
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage.createdAt,
            subject: lastMessage.subject,
            type: lastMessage.type,
          },
          unreadCount,
          totalMessages,
          lastActivity: lastMessage.createdAt,
        });
      }
    }

    // Ordenar por fecha del último mensaje (más reciente primero)
    conversations.sort(
      (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    // Aplicar paginación
    const result = conversations.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: result,
      pagination: {
        offset,
        limit,
        hasMore: result.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo conversaciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
