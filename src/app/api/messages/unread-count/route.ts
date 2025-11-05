import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getUserFromRequest } from '@/lib/auth-token-validator';

// Forzar renderizado dinámico para evitar caché y asegurar que la ruta funcione correctamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// CRÍTICO: Asegurar que la ruta se ejecute en el servidor Node.js, no en Edge Runtime
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

/**
 * GET /api/messages/unread-count
 * Obtener el contador de mensajes no leídos del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    // Validar token
    const decoded = await getUserFromRequest(request);

    if (!decoded) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 }
      );
    }

    const user = {
      id: decoded.id,
      email: decoded.email,
    };

    // Contar mensajes no leídos
    // ✅ CORRECCIÓN: Remover filtro de status 'DELETED' ya que el modelo Message no tiene ese valor
    // Los mensajes solo tienen status 'SENT' por defecto, no 'DELETED'
    const unreadCount = await db.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    logger.info('Contador de mensajes no leídos consultado', {
      userId: user.id,
      unreadCount,
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    logger.error('Error obteniendo contador de mensajes no leídos', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
