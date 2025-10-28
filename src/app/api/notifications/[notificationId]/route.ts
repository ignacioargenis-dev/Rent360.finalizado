import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger';

/**
 * PATCH - Marcar notificación como leída
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const { notificationId } = params;
    await NotificationService.markAsRead(notificationId, session.user.id);

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
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    const { notificationId } = params;
    await NotificationService.delete(notificationId, session.user.id);

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
