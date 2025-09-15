import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationQueue } from '@/lib/notification-queue';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * GET /api/admin/notifications/queue
 * Obtiene estadísticas de la cola de notificaciones
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const stats = NotificationQueue.getQueueStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting notification queue stats:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

/**
 * POST /api/admin/notifications/queue/process
 * Fuerza el procesamiento de la cola de notificaciones
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { action } = await request.json();

    switch (action) {
      case 'process':
        await NotificationQueue.processQueue();
        return NextResponse.json({
          success: true,
          message: 'Cola de notificaciones procesada'
        });

      case 'cleanup':
        NotificationQueue.cleanupOldNotifications();
        return NextResponse.json({
          success: true,
          message: 'Notificaciones antiguas limpiadas'
        });

      case 'schedule_recurring':
        await NotificationQueue.scheduleRecurringNotifications();
        return NextResponse.json({
          success: true,
          message: 'Notificaciones recurrentes programadas'
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Error managing notification queue:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
