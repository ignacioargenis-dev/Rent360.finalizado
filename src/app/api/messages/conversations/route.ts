import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/messages/conversations
 * Obtener conversaciones agrupadas por usuario/contacto
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Obtener todos los mensajes del usuario (enviados y recibidos)
    // Agrupados por el otro participante
    const conversations = await db.$queryRaw`
      SELECT
        CASE
          WHEN m."senderId" = ${user.id} THEN m."receiverId"
          ELSE m."senderId"
        END as participant_id,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.name
          ELSE s.name
        END as participant_name,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.email
          ELSE s.email
        END as participant_email,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.role
          ELSE s.role
        END as participant_role,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.avatar
          ELSE s.avatar
        END as participant_avatar,
        m.content as last_message,
        m."createdAt" as last_message_at,
        m.subject as last_subject,
        m.type as last_message_type,
        COUNT(CASE WHEN m."receiverId" = ${user.id} AND m."isRead" = false THEN 1 END) as unread_count,
        COUNT(*) as total_messages
      FROM "Message" m
      LEFT JOIN "User" s ON s.id = m."senderId"
      LEFT JOIN "User" r ON r.id = m."receiverId"
      WHERE (m."senderId" = ${user.id} OR m."receiverId" = ${user.id})
        AND m.status != 'DELETED'
      GROUP BY
        CASE
          WHEN m."senderId" = ${user.id} THEN m."receiverId"
          ELSE m."senderId"
        END,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.name
          ELSE s.name
        END,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.email
          ELSE s.email
        END,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.role
          ELSE s.role
        END,
        CASE
          WHEN m."senderId" = ${user.id} THEN r.avatar
          ELSE s.avatar
        END,
        m.content,
        m."createdAt",
        m.subject,
        m.type
      ORDER BY m."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Procesar las conversaciones para obtener la información más reciente por participante
    const processedConversations = new Map();

    for (const conv of conversations as any[]) {
      const participantId = conv.participant_id;

      if (!processedConversations.has(participantId)) {
        processedConversations.set(participantId, {
          participant: {
            id: participantId,
            name: conv.participant_name,
            email: conv.participant_email,
            role: conv.participant_role,
            avatar: conv.participant_avatar,
          },
          lastMessage: {
            content: conv.last_message,
            timestamp: conv.last_message_at,
            subject: conv.last_subject,
            type: conv.last_message_type,
          },
          unreadCount: parseInt(conv.unread_count),
          totalMessages: parseInt(conv.total_messages),
          lastActivity: conv.last_message_at,
        });
      }
    }

    const result = Array.from(processedConversations.values());

    // Ordenar por última actividad (más reciente primero)
    result.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

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
