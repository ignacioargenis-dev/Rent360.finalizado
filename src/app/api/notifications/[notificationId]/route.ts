import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger-minimal';

/**
 * PATCH - Marcar notificación como leída
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = await requireAuth(request);

    const { notificationId } = params;
    await NotificationService.markAsRead(notificationId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error: any) {
    logger.error('Error marking notification as read', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al marcar notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar notificación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const user = await requireAuth(request);

    const { notificationId } = params;
    await NotificationService.delete(notificationId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada',
    });
  } catch (error: any) {
    logger.error('Error deleting notification', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}

