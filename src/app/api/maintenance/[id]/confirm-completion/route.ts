import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/maintenance/[id]/confirm-completion
 * Confirmar que un trabajo de mantenimiento fue completado correctamente (solo para owner/broker)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    // Obtener el mantenimiento con toda la información necesaria
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
        maintenanceProvider: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
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
        { error: 'Trabajo de mantenimiento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo owner o broker de la propiedad pueden confirmar
    const hasPermission =
      user.role === 'ADMIN' ||
      ((user.role === 'OWNER' || user.role === 'owner') &&
        maintenance.property.ownerId === user.id) ||
      ((user.role === 'BROKER' || user.role === 'broker') &&
        maintenance.property.brokerId === user.id) ||
      maintenance.requestedBy === user.id; // El solicitante también puede confirmar

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para confirmar este trabajo' },
        { status: 403 }
      );
    }

    // Verificar que el trabajo está en estado PENDING_CONFIRMATION
    if (maintenance.status !== 'PENDING_CONFIRMATION') {
      return NextResponse.json(
        { error: 'Este trabajo no está esperando confirmación' },
        { status: 400 }
      );
    }

    // Actualizar el mantenimiento a estado COMPLETED
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'COMPLETED',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        maintenanceProvider: {
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

    // Notificar al proveedor que su trabajo fue confirmado
    if (maintenance.maintenanceProvider?.user?.id) {
      try {
        await NotificationService.create({
          userId: maintenance.maintenanceProvider.user.id,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Trabajo Confirmado',
          message: `Tu trabajo "${maintenance.title}" ha sido confirmado como completado. Puedes calificar al cliente y el trabajo está listo para facturación.`,
          link: `/maintenance/jobs/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            propertyAddress: maintenance.property.address,
            confirmedBy: user.name || 'Sistema',
            confirmedAt: new Date().toISOString(),
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al proveedor:', {
          providerId: maintenance.maintenanceProvider?.user?.id,
          maintenanceId,
          error: notificationError,
        });
      }
    }

    logger.info('Trabajo de mantenimiento confirmado:', {
      maintenanceId,
      confirmedBy: user.id,
      status: 'COMPLETED',
    });

    return NextResponse.json({
      message: 'Trabajo confirmado exitosamente',
      maintenance: {
        ...updatedMaintenance,
        images: JSON.parse(updatedMaintenance.images || '[]'),
      },
    });
  } catch (error) {
    logger.error('Error confirmando trabajo de mantenimiento:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
