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

    // Verificar si ya tiene una relación activa con este broker
    const existingRelationship = await db.brokerClient.findFirst({
      where: {
        brokerId: invitation.brokerId,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (existingRelationship) {
      return NextResponse.json(
        { success: false, error: 'Ya tienes una relación activa con este corredor' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la invitación
    await db.brokerInvitation.update({
      where: { id: invitationId },
      data: { status: 'ACCEPTED' },
    });

    // Crear la relación cliente-corredor
    const brokerClient = await db.brokerClient.create({
      data: {
        brokerId: invitation.brokerId,
        userId: user.id,
        clientType: user.role === 'OWNER' ? 'OWNER' : 'TENANT',
        servicesOffered: invitation.servicesOffered,
        commissionRate: invitation.proposedRate || 5.0,
        status: 'ACTIVE',
        startDate: new Date(),
      },
    });

    // Actualizar el prospect a cliente si existe
    if (invitation.prospectId) {
      await db.brokerProspect.update({
        where: { id: invitation.prospectId },
        data: { status: 'CONVERTED' },
      });
    }

    // Enviar notificación al broker
    await NotificationService.notifyInvitationAccepted({
      brokerId: invitation.brokerId,
      userName: user.name || 'Cliente',
      userId: user.id,
      invitationId: invitationId,
    }).catch(err => {
      logger.error('Error sending invitation accepted notification', { error: err });
    });

    logger.info('Invitation accepted', {
      invitationId,
      userId: user.id,
      brokerId: invitation.brokerId,
      clientId: brokerClient.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación aceptada exitosamente',
      clientId: brokerClient.id,
      redirectTo: '/owner/broker-services/select-properties?clientId=' + brokerClient.id,
    });
  } catch (error: any) {
    logger.error('Error accepting invitation', {
      error: error.message,
      stack: error.stack,
      invitationId: params.id,
    });

    return NextResponse.json(
      { success: false, error: 'Error al aceptar la invitación' },
      { status: 500 }
    );
  }
}
