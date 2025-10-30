import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const invitationId = params.id;

    // Buscar la invitación
    const invitation = await db.brokerInvitation.findUnique({
      where: { id: invitationId },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        user: {
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
        { success: false, error: 'Invitación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga permisos para ver esta invitación
    // El propietario puede ver sus propias invitaciones, el broker puede ver las suyas
    if (invitation.userId !== user.id && invitation.brokerId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para ver esta invitación' },
        { status: 403 }
      );
    }

    logger.info('Invitation retrieved', {
      invitationId,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      invitation,
    });
  } catch (error: any) {
    logger.error('Error retrieving invitation', {
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
