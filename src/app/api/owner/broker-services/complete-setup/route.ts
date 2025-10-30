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

    // Crear registros de gestión de propiedades si se especificaron
    if (
      propertyManagementType === 'partial' &&
      managedPropertyIds &&
      managedPropertyIds.length > 0
    ) {
      // Verificar que las propiedades pertenecen al usuario
      const properties = await db.property.findMany({
        where: {
          id: { in: managedPropertyIds },
          ownerId: user.id,
        },
      });

      if (properties.length !== managedPropertyIds.length) {
        throw new Error('Algunas propiedades no pertenecen al usuario o no existen');
      }

      // Crear registros de brokerPropertyManagement para cada propiedad
      for (const propertyId of managedPropertyIds) {
        await db.brokerPropertyManagement.create({
          data: {
            brokerId: invitation.brokerId,
            clientId: brokerClient.id,
            propertyId: propertyId,
            managementType: 'full', // Por defecto gestión completa
            services: invitation.servicesOffered || JSON.stringify([]),
            commissionRate: brokerClient.commissionRate,
            exclusivity: false, // Por defecto no exclusivo
            status: 'ACTIVE',
            startDate: new Date(),
          },
        });

        // Actualizar la propiedad para asignar el broker
        await db.property.update({
          where: { id: propertyId },
          data: {
            brokerId: invitation.brokerId,
            status: 'MANAGED',
          },
        });
      }

      // Actualizar métricas del cliente
      await db.brokerClient.update({
        where: { id: brokerClient.id },
        data: {
          totalPropertiesManaged: managedPropertyIds.length,
        },
      });
    } else if (propertyManagementType === 'full') {
      // Para gestión completa, obtener TODAS las propiedades disponibles del propietario
      // (AVAILABLE, RENTED, etc.) - las mismas que se mostraron para selección
      const availableOwnerProperties = await db.property.findMany({
        where: {
          ownerId: user.id,
          status: { in: ['AVAILABLE', 'RENTED', 'PENDING'] }, // Solo propiedades que pueden ser gestionadas
        },
        select: { id: true },
      });

      if (availableOwnerProperties.length > 0) {
        // Crear registros de brokerPropertyManagement para todas las propiedades disponibles
        for (const property of availableOwnerProperties) {
          await db.brokerPropertyManagement.create({
            data: {
              brokerId: invitation.brokerId,
              clientId: brokerClient.id,
              propertyId: property.id,
              managementType: 'full',
              services: invitation.servicesOffered || JSON.stringify([]),
              commissionRate: brokerClient.commissionRate,
              exclusivity: false,
              status: 'ACTIVE',
              startDate: new Date(),
            },
          });

          // Actualizar la propiedad para asignar el broker
          await db.property.update({
            where: { id: property.id },
            data: {
              brokerId: invitation.brokerId,
              status: 'MANAGED',
            },
          });
        }

        // Actualizar métricas del cliente
        await db.brokerClient.update({
          where: { id: brokerClient.id },
          data: {
            totalPropertiesManaged: availableOwnerProperties.length,
          },
        });
      }
    }

    // La invitación se mantiene en ACCEPTED - no necesitamos cambiar el status

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
