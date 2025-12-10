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

    const userId = user.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const notifications = await NotificationService.getUnread(userId);

    // Asegurar que notifications es un array
    const notificationsArray = Array.isArray(notifications) ? notifications : [];

    return NextResponse.json({
      success: true,
      data: notificationsArray,
      count: notificationsArray.length,
    });
  } catch (error: any) {
    logger.error('Error fetching notifications', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: (error as any)?.userId,
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
      const count = await NotificationService.markAllAsRead(user.id);
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
