import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { NotificationService } from '@/lib/notification-service';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, ...notificationData } = body;

    switch (type) {
      case 'commission_calculated':
        await NotificationService.notifyCommissionCalculated(notificationData);
        break;

      case 'commission_paid':
        await NotificationService.notifyCommissionPaid(notificationData);
        break;

      case 'payout_ready':
        await NotificationService.notifyPayoutReady(notificationData);
        break;

      case 'system_alert':
        await NotificationService.notifySystemAlert(notificationData);
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de notificación no válido' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada exitosamente'
    });

  } catch (error) {
    logger.error('Error sending notification:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const stats = await NotificationService.getNotificationStats();

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error getting notification stats:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
