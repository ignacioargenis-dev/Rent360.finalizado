import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/schedule-visit
 * Programar una visita de mantenimiento
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const body = await request.json();

    const {
      providerId,
      scheduledDate,
      scheduledTime,
      estimatedDuration = 120, // 2 horas por defecto
      contactPerson,
      contactPhone,
      specialInstructions,
      notes,
    } = body;

    // Validaciones básicas
    if (!providerId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Datos requeridos: providerId, scheduledDate, scheduledTime' },
        { status: 400 }
      );
    }

    // Verificar que la solicitud existe y tiene prestador asignado
    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            brokerId: true,
            ownerId: true,
          },
        },
        maintenanceProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
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

    if (!maintenance.maintenanceProvider) {
      return NextResponse.json(
        { error: 'Debe asignar un prestador antes de programar la visita' },
        { status: 400 }
      );
    }

    // Verificar que la cotización esté aprobada o que el estado permita programar
    if (maintenance.status !== 'QUOTE_APPROVED' && maintenance.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: 'Debe aprobar la cotización antes de programar la visita' },
        { status: 400 }
      );
    }

    if (maintenance.maintenanceProvider.id !== providerId) {
      return NextResponse.json(
        { error: 'El prestador especificado no coincide con el asignado' },
        { status: 400 }
      );
    }

    // Verificar permisos de acceso
    const hasPermission =
      user.role === 'ADMIN' ||
      ((user.role === 'broker' || user.role === 'BROKER') &&
        maintenance.property.brokerId === user.id) ||
      ((user.role === 'owner' || user.role === 'OWNER') &&
        maintenance.property.ownerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para programar visitas en esta solicitud' },
        { status: 403 }
      );
    }

    // Determinar quién propone la fecha
    const proposerRole =
      user.role === 'ADMIN'
        ? 'ADMIN'
        : user.role === 'broker' || user.role === 'BROKER'
          ? 'BROKER'
          : user.role === 'owner' || user.role === 'OWNER'
            ? 'OWNER'
            : 'USER';

    // Verificar si ya existe una propuesta pendiente
    const existingProposal = await db.maintenanceVisitSchedule.findFirst({
      where: {
        maintenanceId,
        status: 'PROPOSED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingProposal) {
      const existingSide = (existingProposal.proposedBy || 'OWNER').toUpperCase();
      const currentSide = proposerRole.toUpperCase();
      const isSameSideProposal = existingSide === currentSide && existingSide !== 'PROVIDER';

      if (isSameSideProposal) {
        await db.maintenanceVisitSchedule.update({
          where: { id: existingProposal.id },
          data: {
            status: 'REPLACED',
          },
        });
      } else {
        const errorMessage =
          existingSide === 'PROVIDER'
            ? 'El proveedor ya propuso una fecha. Acepta o responde a su propuesta.'
            : 'Ya existe una propuesta pendiente. Espera la respuesta del proveedor antes de enviar una nueva.';
        return NextResponse.json({ error: errorMessage }, { status: 400 });
      }
    }

    // Si ya hay una visita confirmada, impedir nuevas propuestas
    const confirmedVisit = await db.maintenanceVisitSchedule.findFirst({
      where: {
        maintenanceId,
        status: 'ACCEPTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (confirmedVisit) {
      return NextResponse.json(
        {
          error:
            'Este mantenimiento ya tiene una visita confirmada. Si necesitas reagendar, solicita al proveedor que actualice la programación.',
        },
        { status: 400 }
      );
    }

    // Crear la propuesta de visita (status: PROPOSED)
    const visitSchedule = await db.maintenanceVisitSchedule.create({
      data: {
        maintenanceId,
        maintenanceProviderId: providerId,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        estimatedDuration,
        notes,
        contactPerson,
        contactPhone,
        specialInstructions,
        createdBy: user.id,
        proposedBy: proposerRole,
        status: 'PROPOSED',
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            user: {
              select: {
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Actualizar el estado de la solicitud de mantenimiento a QUOTE_APPROVED si no lo está
    await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        visitDuration: estimatedDuration,
        visitNotes: specialInstructions,
        notes: maintenance.notes
          ? `${maintenance.notes}\n[${new Date().toLocaleString()}]: Fecha propuesta para ${scheduledDate} ${scheduledTime} por ${proposerRole}`
          : `[${new Date().toLocaleString()}]: Fecha propuesta para ${scheduledDate} ${scheduledTime} por ${proposerRole}`,
      },
    });

    // Notificar al prestador sobre la propuesta de fecha
    try {
      await NotificationService.create({
        userId: maintenance.maintenanceProvider.user.id,
        type: NotificationType.MAINTENANCE_REQUEST,
        title: 'Propuesta de Fecha para Visita de Mantenimiento',
        message: `Se ha propuesto una fecha para la visita del mantenimiento: ${maintenance.title}. Por favor, acepta o propón otra fecha.`,
        link: `/maintenance/jobs/${maintenance.id}`,
        metadata: {
          maintenanceId: maintenance.id,
          maintenanceTitle: maintenance.title,
          propertyAddress: maintenance.property.address,
          scheduledDate,
          scheduledTime,
          estimatedDuration,
          contactPerson: contactPerson || maintenance.requester.name,
          contactPhone: contactPhone || '',
          specialInstructions,
          proposedBy: user.name || 'Sistema',
          proposalId: visitSchedule.id,
        },
      });
    } catch (notificationError) {
      logger.error('Error enviando notificación de propuesta al prestador:', {
        providerId,
        maintenanceId,
        error: notificationError,
      });
    }

    logger.info('Propuesta de fecha creada exitosamente:', {
      maintenanceId,
      providerId,
      scheduledDate,
      scheduledTime,
      proposedBy: user.id,
      proposalId: visitSchedule.id,
    });

    return NextResponse.json({
      message: 'Fecha propuesta exitosamente. El proveedor debe aceptarla o proponer otra fecha.',
      visitSchedule,
      status: 'PROPOSED',
    });
  } catch (error) {
    logger.error('Error programando visita:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}

/**
 * GET /api/maintenance/[id]/schedule-visit
 * Obtener la programación de visita actual
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    // Verificar permisos
    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      select: {
        id: true,
        property: {
          select: {
            brokerId: true,
            ownerId: true,
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

    const hasPermission =
      user.role === 'ADMIN' ||
      ((user.role === 'broker' || user.role === 'BROKER') &&
        maintenance.property.brokerId === user.id) ||
      ((user.role === 'owner' || user.role === 'OWNER') &&
        maintenance.property.ownerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta programación' },
        { status: 403 }
      );
    }

    // Obtener la programación de visita
    const visitSchedule = await db.maintenanceVisitSchedule.findFirst({
      where: { maintenanceId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            user: {
              select: {
                phone: true,
                email: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      visitSchedule,
    });
  } catch (error) {
    logger.error('Error obteniendo programación de visita:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
