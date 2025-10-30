import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const invitationId = params.id;

    // Verificar que la invitación existe y pertenece al usuario
    const invitation = await db.brokerInvitation.findFirst({
      where: {
        id: invitationId,
        userId: user.id,
        status: 'ACCEPTED', // Solo se puede cancelar invitaciones aceptadas
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada o no se puede cancelar' },
        { status: 404 }
      );
    }

    logger.info('Cancelling accepted invitation', {
      invitationId,
      userId: user.id,
      brokerId: invitation.brokerId,
    });

    // Cambiar el estado de la invitación de vuelta a SENT
    await db.brokerInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'SENT', // Volver al estado inicial
      },
    });

    // Buscar el prospect relacionado y actualizar su estado
    const prospect = await db.brokerProspect.findFirst({
      where: {
        brokerId: invitation.brokerId,
        userId: user.id,
        status: 'QUALIFIED', // Solo prospects que están calificados
      },
    });

    if (prospect) {
      // Actualizar el prospect para indicar que la invitación fue cancelada
      await db.brokerProspect.update({
        where: { id: prospect.id },
        data: {
          status: 'CONTACTED', // Cambiar a contactado (estado anterior)
          notes: `${prospect.notes || ''}\n\n❌ Invitación cancelada por el usuario el ${new Date().toISOString()}. El usuario puede aceptarla nuevamente.`,
          nextFollowUpDate: null, // Limpiar fecha de seguimiento
        },
      });

      logger.info('Prospect status updated after invitation cancellation', {
        prospectId: prospect.id,
        userId: user.id,
        brokerId: invitation.brokerId,
      });
    }

    logger.info('Invitation cancelled successfully', {
      invitationId,
      userId: user.id,
      brokerId: invitation.brokerId,
      prospectUpdated: !!prospect,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitación cancelada exitosamente',
    });
  } catch (error: any) {
    logger.error('Error cancelling invitation', {
      error: error.message,
      stack: error.stack,
      invitationId: params.id,
    });

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
