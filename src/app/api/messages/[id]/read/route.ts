import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

// Forzar renderizado dinámico para evitar caché y asegurar que la ruta funcione correctamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const messageId = params.id;

    // Verificar que el mensaje existe y el usuario es el receptor
    const message = await db.message.findFirst({
      where: {
        id: messageId,
        receiverId: user.id,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Mensaje no encontrado o no tienes permisos para marcarlo como leído' },
        { status: 404 }
      );
    }

    // Marcar como leído si no lo está
    if (!message.isRead) {
      await db.message.update({
        where: {
          id: messageId,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      logger.info('Mensaje marcado como leído:', {
        messageId,
        userId: user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje marcado como leído',
    });
  } catch (error) {
    logger.error('Error marcando mensaje como leído:', {
      error: error instanceof Error ? error.message : String(error),
      messageId: params.id,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
