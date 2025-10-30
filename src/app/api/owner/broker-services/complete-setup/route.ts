import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { success: false, error: 'Solo propietarios pueden completar esta configuración' },
        { status: 403 }
      );
    }

    const { invitationId, prospectId, propertyManagementType, managedPropertyIds } =
      await request.json();

    if (!invitationId || !prospectId) {
      return NextResponse.json(
        { success: false, error: 'invitationId y prospectId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la invitación existe y pertenece al usuario
    const invitation = await db.brokerInvitation.findFirst({
      where: {
        id: invitationId,
        userId: user.id,
        status: 'ACCEPTED', // Solo invitaciones aceptadas pueden completarse
      },
      include: {
        broker: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: 'Invitación no encontrada o no válida' },
        { status: 404 }
      );
    }

    // Verificar que el prospect existe y pertenece al broker correcto
    const prospect = await db.brokerProspect.findFirst({
      where: {
        id: prospectId,
        brokerId: invitation.brokerId,
        userId: user.id,
      },
    });

    if (!prospect) {
      return NextResponse.json(
        { success: false, error: 'Prospecto no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no existe ya una relación activa
    const existingClient = await db.brokerClient.findFirst({
      where: {
        brokerId: invitation.brokerId,
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { success: false, error: 'Ya existe una relación activa con este corredor' },
        { status: 400 }
      );
    }

    logger.info('Creating BrokerClient relationship', {
      ownerId: user.id,
      brokerId: invitation.brokerId,
      prospectId,
      propertyManagementType,
      managedPropertyIdsCount: managedPropertyIds?.length || 0,
    });

    // Crear la relación BrokerClient
    const brokerClient = await db.brokerClient.create({
      data: {
        brokerId: invitation.brokerId,
        userId: user.id,
        prospectId: prospect.id,
        clientType: 'OWNER',
        status: 'ACTIVE',
        relationshipType: 'standard',
        servicesOffered: invitation.servicesOffered,
        commissionRate: invitation.proposedRate || 5.0,
        exclusiveAgreement: false,
        propertyManagementType: propertyManagementType || 'none',
        managedPropertyIds: managedPropertyIds ? JSON.stringify(managedPropertyIds) : null,
        startDate: new Date(),
        lastInteraction: new Date(),
        notes: `Relación establecida desde invitación aceptada. ${invitation.servicesOffered ? `Servicios: ${invitation.servicesOffered}` : ''}`,
      },
    });

    // Actualizar el prospect a convertido
    await db.brokerProspect.update({
      where: { id: prospect.id },
      data: {
        status: 'CONVERTED',
        notes: `${prospect.notes || ''}\n\n✅ Convertido a cliente activo - ${new Date().toISOString()}`,
      },
    });

    // Marcar la invitación como completada (podríamos agregar un campo 'completed' o usar el status)
    await db.brokerInvitation.update({
      where: { id: invitationId },
      data: {
        // Aquí podríamos agregar un campo 'completedAt' si existe en el schema
        // Por ahora, podemos dejar la invitación como 'ACCEPTED'
      },
    });

    // Notificar al broker que la relación ha sido completada
    await NotificationService.notifyInvitationCompleted({
      brokerId: invitation.brokerId,
      ownerName: user.name || 'Propietario',
      ownerId: user.id,
      invitationId,
      clientId: brokerClient.id,
      propertyCount: managedPropertyIds?.length || 0,
    }).catch(err => {
      logger.error('Error sending completion notification', { error: err });
    });

    logger.info('BrokerClient relationship created successfully', {
      brokerClientId: brokerClient.id,
      ownerId: user.id,
      brokerId: invitation.brokerId,
    });

    return NextResponse.json({
      success: true,
      message: 'Relación con corredor establecida exitosamente',
      brokerClientId: brokerClient.id,
    });
  } catch (error: any) {
    logger.error('Error completing broker setup', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
