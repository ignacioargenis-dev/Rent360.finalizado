import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/assign-provider
 * Asignar un prestador a una solicitud de mantenimiento
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const body = await request.json();
    const { providerId, notes } = body;

    if (!providerId) {
      return NextResponse.json({ error: 'ID del prestador es requerido' }, { status: 400 });
    }

    // Verificar que la solicitud existe y el usuario tiene permisos
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

    // Verificar permisos de acceso
    // El usuario puede asignar si es:
    // 1. ADMIN
    // 2. El broker que gestiona la propiedad
    // 3. El owner de la propiedad
    // 4. El usuario que solicitó el mantenimiento (requester)
    const hasPermission =
      user.role === 'ADMIN' ||
      (user.role === 'broker' && maintenance.property.brokerId === user.id) ||
      (user.role === 'owner' && maintenance.property.ownerId === user.id) ||
      maintenance.requestedBy === user.id;

    if (!hasPermission) {
      logger.warn('Intento de asignación sin permisos:', {
        userId: user.id,
        userRole: user.role,
        maintenanceId,
        propertyOwnerId: maintenance.property.ownerId,
        propertyBrokerId: maintenance.property.brokerId,
        requestedBy: maintenance.requestedBy,
      });
      return NextResponse.json(
        { error: 'No tienes permisos para asignar prestadores a esta solicitud' },
        { status: 403 }
      );
    }

    // Verificar que el prestador existe y está disponible
    const provider = await db.maintenanceProvider.findUnique({
      where: { id: providerId },
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
    });

    if (!provider) {
      return NextResponse.json({ error: 'Prestador no encontrado' }, { status: 404 });
    }

    if (!provider.isVerified || provider.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'El prestador no está disponible actualmente' },
        { status: 400 }
      );
    }

    // Asignar el prestador a la solicitud
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        maintenanceProviderId: providerId,
        status: 'ASSIGNED',
        notes: maintenance.notes
          ? `${maintenance.notes}\n[${new Date().toLocaleString()}]: Prestador ${provider.businessName} asignado por ${user.name || 'Sistema'}`
          : `[${new Date().toLocaleString()}]: Prestador ${provider.businessName} asignado por ${user.name || 'Sistema'}`,
        updatedAt: new Date(),
      },
      include: {
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            specialty: true,
            hourlyRate: true,
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

    // Notificar al prestador
    try {
      await NotificationService.create({
        userId: provider.user.id,
        type: NotificationType.NEW_MESSAGE,
        title: 'Nuevo Trabajo de Mantenimiento Asignado',
        message: `Se te ha asignado el mantenimiento: ${maintenance.title}`,
        link: `/maintenance/jobs/${maintenance.id}`,
        metadata: {
          maintenanceId: maintenance.id,
          maintenanceTitle: maintenance.title,
          propertyAddress: maintenance.property.address,
          assignedBy: user.name || 'Sistema',
          notes: notes || '',
        },
      });
    } catch (notificationError) {
      logger.error('Error enviando notificación al prestador:', {
        providerId,
        maintenanceId,
        error: notificationError,
      });
      // No fallar la asignación por error de notificación
    }

    // Notificar al solicitante
    try {
      await NotificationService.create({
        userId: maintenance.requester.id,
        type: NotificationType.NEW_MESSAGE,
        title: 'Prestador Asignado a tu Solicitud de Mantenimiento',
        message: `Se ha asignado un prestador a tu solicitud: ${maintenance.title}`,
        link: `/maintenance/${maintenance.id}`,
        metadata: {
          maintenanceId: maintenance.id,
          maintenanceTitle: maintenance.title,
          providerName: provider.businessName,
          providerPhone: provider.user.phone || '',
          assignedBy: user.name || 'Sistema',
        },
      });
    } catch (notificationError) {
      logger.error('Error enviando notificación al solicitante:', {
        requesterId: maintenance.requester.id,
        maintenanceId,
        error: notificationError,
      });
    }

    logger.info('Prestador asignado exitosamente:', {
      maintenanceId,
      providerId,
      assignedBy: user.id,
      providerName: provider.businessName,
    });

    return NextResponse.json({
      message: 'Prestador asignado exitosamente',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    logger.error('Error asignando prestador:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
