import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService } from '@/lib/notification-service';

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

    if (maintenance.maintenanceProvider.id !== providerId) {
      return NextResponse.json(
        { error: 'El prestador especificado no coincide con el asignado' },
        { status: 400 }
      );
    }

    // Verificar permisos de acceso
    const hasPermission =
      user.role === 'admin' ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id) ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para programar visitas en esta solicitud' },
        { status: 403 }
      );
    }

    // Verificar que no exista una visita programada para esta solicitud
    const existingSchedule = await db.maintenanceVisitSchedule.findFirst({
      where: {
        maintenanceId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
      },
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: 'Ya existe una visita programada para esta solicitud' },
        { status: 400 }
      );
    }

    // Crear la programación de visita
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

    // Actualizar el estado de la solicitud de mantenimiento
    await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'SCHEDULED',
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        visitDuration: estimatedDuration,
        visitNotes: specialInstructions,
        notes: maintenance.notes
          ? `${maintenance.notes}\n[${new Date().toLocaleString()}]: Visita programada para ${scheduledDate} ${scheduledTime}`
          : `[${new Date().toLocaleString()}]: Visita programada para ${scheduledDate} ${scheduledTime}`,
      },
    });

    // Notificar al prestador sobre la visita programada
    try {
      await NotificationService.notifyMaintenanceVisitScheduled({
        recipientId: maintenance.maintenanceProvider.user.id,
        recipientName: maintenance.maintenanceProvider.user.name,
        recipientEmail: maintenance.maintenanceProvider.user.email,
        maintenanceId: maintenance.id,
        maintenanceTitle: maintenance.title,
        propertyAddress: maintenance.property.address,
        scheduledDate,
        scheduledTime,
        estimatedDuration,
        contactPerson: contactPerson || maintenance.requester.name,
        contactPhone: contactPhone || '',
        specialInstructions,
        scheduledBy: user.name || 'Sistema',
      });
    } catch (notificationError) {
      logger.error('Error enviando notificación de visita al prestador:', {
        providerId,
        maintenanceId,
        error: notificationError,
      });
    }

    // Notificar al solicitante sobre la visita programada
    try {
      await NotificationService.notifyMaintenanceVisitScheduled({
        recipientId: maintenance.requester.id,
        recipientName: maintenance.requester.name,
        recipientEmail: maintenance.requester.email,
        maintenanceId: maintenance.id,
        maintenanceTitle: maintenance.title,
        propertyAddress: maintenance.property.address,
        scheduledDate,
        scheduledTime,
        estimatedDuration,
        contactPerson: contactPerson || maintenance.requester.name,
        contactPhone: contactPhone || '',
        specialInstructions,
        scheduledBy: user.name || 'Sistema',
      });
    } catch (notificationError) {
      logger.error('Error enviando notificación de visita al solicitante:', {
        requesterId: maintenance.requester.id,
        maintenanceId,
        error: notificationError,
      });
    }

    logger.info('Visita programada exitosamente:', {
      maintenanceId,
      providerId,
      scheduledDate,
      scheduledTime,
      scheduledBy: user.id,
    });

    return NextResponse.json({
      message: 'Visita programada exitosamente',
      visitSchedule,
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
      user.role === 'admin' ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id) ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id);

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
