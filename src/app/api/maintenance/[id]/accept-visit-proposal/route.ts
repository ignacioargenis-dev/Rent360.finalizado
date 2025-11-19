import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/accept-visit-proposal
 * Aceptar o proponer otra fecha para una visita de mantenimiento
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const body = await request.json();
    const { action, proposalId, scheduledDate, scheduledTime, estimatedDuration, notes } = body;

    if (!action || !proposalId) {
      return NextResponse.json(
        { error: 'Datos requeridos: action (accept/propose), proposalId' },
        { status: 400 }
      );
    }

    const isProviderUser = isMaintenanceProvider(user.role);
    let maintenanceProvider = null;

    if (isProviderUser) {
      maintenanceProvider = await db.maintenanceProvider.findUnique({
        where: { userId: user.id },
      });

      if (!maintenanceProvider) {
        return NextResponse.json(
          { error: 'Perfil de proveedor de mantenimiento no encontrado.' },
          { status: 404 }
        );
      }
    }

    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
            brokerId: true,
          },
        },
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            userId: true,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    const hasOwnerAccess = user.role === 'OWNER' && maintenance.property.ownerId === user.id;
    const hasBrokerAccess = user.role === 'BROKER' && maintenance.property.brokerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isProviderUser && !hasOwnerAccess && !hasBrokerAccess && !isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos para gestionar esta propuesta de visita.' },
        { status: 403 }
      );
    }

    if (isProviderUser && maintenance.maintenanceProviderId !== maintenanceProvider?.id) {
      return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    }

    const proposal = await db.maintenanceVisitSchedule.findUnique({
      where: { id: proposalId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Propuesta de fecha no encontrada' }, { status: 404 });
    }

    if (proposal.status !== 'PROPOSED') {
      return NextResponse.json({ error: 'Esta propuesta ya fue procesada' }, { status: 400 });
    }

    if (isProviderUser) {
      if (action === 'accept') {
        const updatedProposal = await db.maintenanceVisitSchedule.update({
          where: { id: proposalId },
          data: {
            status: 'ACCEPTED',
            acceptedBy: user.id,
            acceptedAt: new Date(),
          },
        });

        await db.maintenance.update({
          where: { id: maintenanceId },
          data: {
            status: 'SCHEDULED',
            scheduledDate: proposal.scheduledDate,
            scheduledTime: proposal.scheduledTime,
            visitDuration: proposal.estimatedDuration,
          },
        });

        const recipients = [];
        if (maintenance.property.ownerId) {
          recipients.push(maintenance.property.ownerId);
        }
        if (
          maintenance.property.brokerId &&
          maintenance.property.brokerId !== maintenance.property.ownerId
        ) {
          recipients.push(maintenance.property.brokerId);
        }

        for (const recipientId of recipients) {
          try {
            await NotificationService.create({
              userId: recipientId,
              type: NotificationType.MAINTENANCE_REQUEST,
              title: 'Fecha de Visita Aceptada',
              message: `El proveedor ${
                maintenanceProvider?.businessName || 'asignado'
              } ha aceptado la fecha propuesta para el mantenimiento: ${maintenance.title}`,
              link: `/owner/maintenance`,
              metadata: {
                maintenanceId: maintenance.id,
                maintenanceTitle: maintenance.title,
                scheduledDate: proposal.scheduledDate.toISOString(),
                scheduledTime: proposal.scheduledTime,
              },
            });
          } catch (notificationError) {
            logger.error('Error enviando notificación de aceptación:', {
              recipientId,
              maintenanceId,
              error: notificationError,
            });
          }
        }

        logger.info('Propuesta de fecha aceptada por proveedor:', {
          maintenanceId,
          proposalId,
          providerId: maintenanceProvider?.id,
        });

        return NextResponse.json({
          message: 'Fecha aceptada exitosamente',
          visitSchedule: updatedProposal,
        });
      } else if (action === 'propose') {
        if (!scheduledDate || !scheduledTime) {
          return NextResponse.json(
            { error: 'Para proponer otra fecha, se requieren scheduledDate y scheduledTime' },
            { status: 400 }
          );
        }

        await db.maintenanceVisitSchedule.update({
          where: { id: proposalId },
          data: {
            status: 'REJECTED',
          },
        });

        const newProposal = await db.maintenanceVisitSchedule.create({
          data: {
            maintenanceId,
            maintenanceProviderId: maintenanceProvider!.id,
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            estimatedDuration: estimatedDuration || proposal.estimatedDuration,
            notes: notes || proposal.notes,
            contactPerson: proposal.contactPerson,
            contactPhone: proposal.contactPhone,
            specialInstructions: proposal.specialInstructions,
            createdBy: user.id,
            proposedBy: 'PROVIDER',
            status: 'PROPOSED',
          },
        });

        const recipients = [];
        if (maintenance.property.ownerId) {
          recipients.push(maintenance.property.ownerId);
        }
        if (
          maintenance.property.brokerId &&
          maintenance.property.brokerId !== maintenance.property.ownerId
        ) {
          recipients.push(maintenance.property.brokerId);
        }

        for (const recipientId of recipients) {
          try {
            await NotificationService.create({
              userId: recipientId,
              type: NotificationType.MAINTENANCE_REQUEST,
              title: 'Nueva Propuesta de Fecha',
              message: `El proveedor ${
                maintenanceProvider?.businessName || 'asignado'
              } ha propuesto una nueva fecha para el mantenimiento: ${maintenance.title}`,
              link: `/owner/maintenance`,
              metadata: {
                maintenanceId: maintenance.id,
                maintenanceTitle: maintenance.title,
                scheduledDate,
                scheduledTime,
                proposalId: newProposal.id,
              },
            });
          } catch (notificationError) {
            logger.error('Error enviando notificación de nueva propuesta:', {
              recipientId,
              maintenanceId,
              error: notificationError,
            });
          }
        }

        logger.info('Nueva propuesta de fecha creada por proveedor:', {
          maintenanceId,
          proposalId: newProposal.id,
          providerId: maintenanceProvider?.id,
        });

        return NextResponse.json({
          message: 'Nueva fecha propuesta exitosamente',
          visitSchedule: newProposal,
        });
      } else {
        return NextResponse.json(
          { error: 'Acción inválida. Debe ser "accept" o "propose"' },
          { status: 400 }
        );
      }
    }

    // Branch para propietarios/brokers/admin
    if (action !== 'accept') {
      return NextResponse.json(
        { error: 'Solo puedes aceptar la propuesta actual del proveedor.' },
        { status: 400 }
      );
    }

    if (proposal.proposedBy !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'No hay una propuesta pendiente del proveedor para aceptar.' },
        { status: 400 }
      );
    }

    const updatedProposal = await db.maintenanceVisitSchedule.update({
      where: { id: proposalId },
      data: {
        status: 'ACCEPTED',
        acceptedBy: user.id,
        acceptedAt: new Date(),
      },
    });

    await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'SCHEDULED',
        scheduledDate: proposal.scheduledDate,
        scheduledTime: proposal.scheduledTime,
        visitDuration: proposal.estimatedDuration,
      },
    });

    const providerUserId = proposal.provider?.user?.id || maintenance.maintenanceProvider?.userId;

    if (providerUserId) {
      try {
        await NotificationService.create({
          userId: providerUserId,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Fecha de visita confirmada',
          message: `El administrador de la propiedad ha confirmado tu propuesta para el mantenimiento: ${maintenance.title}`,
          link: `/maintenance/jobs/${maintenance.id}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            scheduledDate: proposal.scheduledDate.toISOString(),
            scheduledTime: proposal.scheduledTime,
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al proveedor:', {
          providerUserId,
          maintenanceId,
          error: notificationError,
        });
      }
    }

    logger.info('Propuesta de fecha aceptada por owner/broker:', {
      maintenanceId,
      proposalId,
      acceptedBy: user.id,
    });

    return NextResponse.json({
      message: 'Fecha aceptada exitosamente',
      visitSchedule: updatedProposal,
    });
  } catch (error) {
    logger.error('Error procesando propuesta de visita:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
