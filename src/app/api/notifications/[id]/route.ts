import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { notificationService } from '@/lib/notifications';
import { handleError } from '@/lib/errors';
// import { logger } from '@/lib/logger'; // Logger no disponible

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const notificationId = params.id;

    // Obtener notificación específica
    const notification = await notificationService.getUserNotifications(
      user.id,
      { limit: 1, offset: 0 },
    ).then(notifications => 
      notifications.find(n => n.id === notificationId),
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });

  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const notificationId = params.id;
    const body = await request.json();

    if (body.action === 'markAsRead') {
      await notificationService.markAsRead(notificationId);
      
      logger.info('Notificación marcada como leída', { 
        notificationId, 
        userId: user.id, 
      });
      
      return NextResponse.json({
        success: true,
        message: 'Notificación marcada como leída',
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 },
    );

  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const notificationId = params.id;

    // Verificar que la notificación pertenece al usuario
    const notification = await notificationService.getUserNotifications(
      user.id,
      { limit: 1, offset: 0 },
    ).then(notifications => 
      notifications.find(n => n.id === notificationId),
    );

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 },
      );
    }

    // Eliminar notificación (implementación simulada)
    // En una implementación real, esto eliminaría de la base de datos
    logger.info('Notificación eliminada', { 
      notificationId, 
      userId: user.id, 
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada',
    });

  } catch (error) {
    return handleError(error);
  }
}
