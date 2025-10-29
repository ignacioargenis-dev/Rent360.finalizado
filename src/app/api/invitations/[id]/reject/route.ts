import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const invitationId = params.id;

    // Verificar que la invitación existe y pertenece al usuario
    const invitation = await db.brokerInvitation.findFirst({
      where: {
        id: invitationId,
        userId: user.id,
        status: 'SENT',
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada o ya procesada' },
        { status: 404 }
      );
    }

    // Actualizar el estado de la invitación
    await db.brokerInvitation.update({
      where: { id: invitationId },
      data: { status: 'REJECTED' },
    });

    // Enviar notificación al broker
    await NotificationService.notifyInvitationRejected({
      brokerId: invitation.brokerId,
      userName: user.name || 'Cliente',
      userId: user.id,
      invitationId: invitationId,
    }).catch(err => {
      logger.error('Error sending invitation rejected notification', { error: err });
    });

    logger.info('Invitation rejected', {
      invitationId,
      userId: user.id,
      brokerId: invitation.brokerId,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación rechazada',
    });
  } catch (error: any) {
    logger.error('Error rejecting invitation', {
      error: error.message,
      stack: error.stack,
      invitationId: params.id,
    });

    return NextResponse.json(
      { success: false, error: 'Error al rechazar la invitación' },
      { status: 500 }
    );
  }
}
