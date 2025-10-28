import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger-minimal';

/**
 * API para gestionar notificaciones del usuario
 */

/**
 * GET - Obtener notificaciones no leídas
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const userId = session.user.id;
    const notifications = await NotificationService.getUnread(userId);

    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  } catch (error: any) {
    logger.error('Error fetching notifications', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST - Marcar todas como leídas
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { action } = body;

    if (action === 'markAllRead') {
      const count = await NotificationService.markAllAsRead(session.user.id);
      return NextResponse.json({
        success: true,
        message: `${count} notificaciones marcadas como leídas`,
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (error: any) {
    logger.error('Error in notifications POST', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al procesar solicitud' },
      { status: 500 }
    );
  }
}
