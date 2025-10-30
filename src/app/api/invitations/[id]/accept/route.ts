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

    // Obtener datos completos del usuario desde la base de datos
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        email: true,
        phone: true,
        rut: true,
        role: true,
        city: true,
        commune: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Crear o actualizar prospect si no existe
    let prospect = await db.brokerProspect.findFirst({
      where: {
        brokerId: invitation.brokerId,
        userId: user.id,
      },
    });

    if (!prospect) {
      // Crear un prospect basado en los datos del usuario
      const prospectData: any = {
        brokerId: invitation.brokerId,
        userId: user.id,
        name: userData.name || `${userData.email} (Prospecto)`,
        email: userData.email,
        phone: userData.phone || '',
        prospectType: userData.role === 'OWNER' ? 'OWNER_LEAD' : 'TENANT_LEAD',
        status: 'QUALIFIED', // Ya está calificado porque aceptó la invitación
        priority: 'high', // Alta prioridad porque aceptó invitación
        interestedIn:
          userData.role === 'OWNER'
            ? JSON.stringify(['PROPERTY_MANAGEMENT', 'CONSULTATION'])
            : JSON.stringify(['PROPERTY_SEARCH', 'CONSULTATION']),
        notes: `Prospecto convertido desde invitación aceptada. ${invitation.servicesOffered ? `Servicios solicitados: ${invitation.servicesOffered}` : ''}`,
        tags: JSON.stringify(['invitation_accepted', userData.role.toLowerCase()]),
        source: 'invitation',
        sourceDetails: `Invitación aceptada - ${invitation.invitationType}`,
      };

      // Agregar campos opcionales solo si tienen valor
      if (userData.rut) {
        prospectData.rut = userData.rut;
      }
      if (userData.city) {
        prospectData.preferredLocations = JSON.stringify([userData.city]);
      }

      prospect = await db.brokerProspect.create({
        data: prospectData,
      });

      logger.info('Prospect created from accepted invitation', {
        prospectId: prospect.id,
        userId: user.id,
        brokerId: invitation.brokerId,
      });
    } else {
      // Actualizar el prospect existente si ya existe
      const existingTags = prospect.tags ? JSON.parse(prospect.tags) : [];
      existingTags.push('invitation_accepted');

      prospect = await db.brokerProspect.update({
        where: { id: prospect.id },
        data: {
          status: 'QUALIFIED', // Cambiar a calificado
          priority: 'high', // Alta prioridad
          notes: `${prospect.notes || ''}\n\nActualizado: Invitación aceptada el ${new Date().toISOString()}. ${invitation.servicesOffered ? `Servicios: ${invitation.servicesOffered}` : ''}`,
          nextFollowUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Seguimiento en 7 días
          tags: JSON.stringify(existingTags),
        },
      });

      logger.info('Existing prospect updated from accepted invitation', {
        prospectId: prospect.id,
        userId: user.id,
        brokerId: invitation.brokerId,
      });
    }

    // Crear la relación cliente-corredor
    const brokerClient = await db.brokerClient.create({
      data: {
        brokerId: invitation.brokerId,
        userId: user.id,
        clientType: userData.role === 'OWNER' ? 'OWNER' : 'TENANT',
        servicesOffered: invitation.servicesOffered,
        commissionRate: invitation.proposedRate || 5.0,
        status: 'ACTIVE',
        startDate: new Date(),
        prospectId: prospect.id, // Vincular con el prospect
      },
    });

    // Si había un prospectId específico en la invitación, actualizarlo también
    if (invitation.prospectId && invitation.prospectId !== prospect.id) {
      await db.brokerProspect.update({
        where: { id: invitation.prospectId },
        data: {
          status: 'CONVERTED',
          notes: `Convertido a cliente. Relación activa creada con ID: ${brokerClient.id}`,
        },
      });
    }

    // Enviar notificación al broker
    await NotificationService.notifyInvitationAccepted({
      brokerId: invitation.brokerId,
      userName: userData.name || 'Cliente',
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
