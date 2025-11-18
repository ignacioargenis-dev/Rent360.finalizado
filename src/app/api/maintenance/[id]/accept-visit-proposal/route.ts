import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/accept-visit-proposal
 * Aceptar o proponer otra fecha para una visita de mantenimiento (solo para proveedores)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isMaintenanceProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo para proveedores de mantenimiento.' },
        { status: 403 }
      );
    }

    const maintenanceId = params.id;
    const body = await request.json();
    const { action, proposalId, scheduledDate, scheduledTime, estimatedDuration, notes } = body;

    if (!action || !proposalId) {
      return NextResponse.json(
        { error: 'Datos requeridos: action (accept/propose), proposalId' },
        { status: 400 }
      );
    }

    // Obtener el perfil del proveedor
    const maintenanceProvider = await db.maintenanceProvider.findUnique({
      where: { userId: user.id },
    });

    if (!maintenanceProvider) {
      return NextResponse.json(
        { error: 'Perfil de proveedor de mantenimiento no encontrado.' },
        { status: 404 }
      );
    }

    // Verificar que la solicitud existe y está asignada a este proveedor
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
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    if (maintenance.maintenanceProviderId !== maintenanceProvider.id) {
      return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    }

    // Obtener la propuesta actual
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

    if (action === 'accept') {
      // Aceptar la propuesta
      const updatedProposal = await db.maintenanceVisitSchedule.update({
        where: { id: proposalId },
        data: {
          status: 'ACCEPTED',
          acceptedBy: user.id,
          acceptedAt: new Date(),
        },
      });

      // Actualizar el estado del mantenimiento
      await db.maintenance.update({
        where: { id: maintenanceId },
        data: {
          status: 'SCHEDULED',
          scheduledDate: proposal.scheduledDate,
          scheduledTime: proposal.scheduledTime,
          visitDuration: proposal.estimatedDuration,
        },
      });

      // Notificar al propietario/broker
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
            message: `El proveedor ${maintenanceProvider.businessName} ha aceptado la fecha propuesta para el mantenimiento: ${maintenance.title}`,
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

      logger.info('Propuesta de fecha aceptada:', {
        maintenanceId,
        proposalId,
        providerId: maintenanceProvider.id,
      });

      return NextResponse.json({
        message: 'Fecha aceptada exitosamente',
        visitSchedule: updatedProposal,
      });
    } else if (action === 'propose') {
      // Proponer otra fecha
      if (!scheduledDate || !scheduledTime) {
        return NextResponse.json(
          { error: 'Para proponer otra fecha, se requieren scheduledDate y scheduledTime' },
          { status: 400 }
        );
      }

      // Rechazar la propuesta anterior
      await db.maintenanceVisitSchedule.update({
        where: { id: proposalId },
        data: {
          status: 'REJECTED',
        },
      });

      // Crear nueva propuesta del proveedor
      const newProposal = await db.maintenanceVisitSchedule.create({
        data: {
          maintenanceId,
          maintenanceProviderId: maintenanceProvider.id,
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

      // Notificar al propietario/broker sobre la nueva propuesta
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
            message: `El proveedor ${maintenanceProvider.businessName} ha propuesto una nueva fecha para el mantenimiento: ${maintenance.title}`,
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
        providerId: maintenanceProvider.id,
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
  } catch (error) {
    logger.error('Error procesando propuesta de visita:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
