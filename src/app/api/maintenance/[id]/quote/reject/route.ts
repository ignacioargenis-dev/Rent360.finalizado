import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';
import { z } from 'zod';

const rejectSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/maintenance/[id]/quote/reject
 * Rechazar una cotización de mantenimiento
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    // Verificar que la solicitud existe
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
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo owner o broker pueden rechazar
    const hasPermission =
      user.role === 'ADMIN' ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id) ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para rechazar esta cotización' },
        { status: 403 }
      );
    }

    if (maintenance.status !== 'QUOTE_PENDING') {
      return NextResponse.json(
        { error: 'Esta solicitud no tiene una cotización pendiente' },
        { status: 400 }
      );
    }

    // Actualizar el estado de vuelta a ASSIGNED para que el proveedor pueda enviar nueva cotización
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'ASSIGNED',
        notes: maintenance.notes
          ? `${maintenance.notes}\n\n[${new Date().toLocaleString()}]: Cotización rechazada por ${user.name || 'Sistema'}${reason ? `\nRazón: ${reason}` : ''}`
          : `[${new Date().toLocaleString()}]: Cotización rechazada por ${user.name || 'Sistema'}${reason ? `\nRazón: ${reason}` : ''}`,
        updatedAt: new Date(),
      },
    });

    // Notificar al proveedor
    if (maintenance.maintenanceProvider?.user) {
      try {
        await NotificationService.create({
          userId: maintenance.maintenanceProvider.user.id,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Cotización Rechazada',
          message: `Tu cotización para "${maintenance.title}" ha sido rechazada.${reason ? ` Razón: ${reason}` : ''} Puedes enviar una nueva cotización.`,
          link: `/maintenance/jobs/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            rejectedBy: user.name || 'Sistema',
            reason: reason || '',
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al proveedor:', {
          error: notificationError,
        });
      }
    }

    logger.info('Cotización rechazada:', {
      maintenanceId,
      rejectedBy: user.id,
      reason,
    });

    return NextResponse.json({
      message: 'Cotización rechazada',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    logger.error('Error rechazando cotización:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}
