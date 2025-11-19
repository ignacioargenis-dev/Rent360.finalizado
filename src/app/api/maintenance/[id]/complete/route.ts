import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';
import { z } from 'zod';

const completeMaintenanceSchema = z.object({
  actualCost: z.number().positive().optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
});

/**
 * POST /api/maintenance/[id]/complete
 * Completar un trabajo de mantenimiento (solo para proveedores)
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const rawBody = await request.text();
    let parsedBody: unknown = {};
    if (rawBody.trim().length > 0) {
      try {
        parsedBody = JSON.parse(rawBody);
      } catch (parseError) {
        return NextResponse.json(
          { error: 'El cuerpo de la solicitud debe ser un JSON válido.' },
          { status: 400 }
        );
      }
    }
    const validatedData = completeMaintenanceSchema.parse(parsedBody);

    // Verificar que el usuario es un proveedor de mantenimiento
    const maintenanceProvider = await db.maintenanceProvider.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!maintenanceProvider) {
      return NextResponse.json(
        { error: 'Solo los proveedores de mantenimiento pueden completar trabajos' },
        { status: 403 }
      );
    }

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
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            broker: {
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
        maintenanceProvider: {
          select: {
            id: true,
            businessName: true,
            user: {
              select: {
                id: true,
                name: true,
              },
            },
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

    // Verificar que el trabajo está asignado a este proveedor
    if (maintenance.maintenanceProviderId !== maintenanceProvider.id) {
      return NextResponse.json({ error: 'Este trabajo no está asignado a ti' }, { status: 403 });
    }

    // Verificar que el trabajo puede ser completado
    if (maintenance.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Este trabajo ya está completado' }, { status: 400 });
    }

    // Actualizar el mantenimiento a estado PENDING_CONFIRMATION (requiere confirmación del owner/broker)
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'PENDING_CONFIRMATION', // Nuevo estado que requiere confirmación
        completedDate: new Date(),
        actualCost: validatedData.actualCost || maintenance.estimatedCost,
        notes: validatedData.notes
          ? `${maintenance.notes || ''}\n\n[COMPLETADO ${new Date().toLocaleString('es-CL')}]:\n${validatedData.notes}`
          : maintenance.notes,
        images: validatedData.images
          ? JSON.stringify([...JSON.parse(maintenance.images || '[]'), ...validatedData.images])
          : maintenance.images,
      },
      include: {
        property: {
          select: {
            ownerId: true,
            brokerId: true,
          },
        },
      },
    });

    // Notificar al propietario
    if (maintenance.property.ownerId) {
      try {
        await NotificationService.create({
          userId: maintenance.property.ownerId,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Trabajo de Mantenimiento Completado',
          message: `El trabajo "${maintenance.title}" ha sido completado por ${maintenanceProvider.businessName}. Por favor confirma que el trabajo se realizó correctamente.`,
          link: `/owner/maintenance/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            propertyAddress: maintenance.property.address,
            providerName: maintenanceProvider.businessName,
            actualCost: updatedMaintenance.actualCost,
            completedDate: updatedMaintenance.completedDate?.toISOString(),
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al propietario:', {
          ownerId: maintenance.property.ownerId,
          maintenanceId,
          error: notificationError,
        });
      }
    }

    // Notificar al broker si existe
    if (maintenance.property.brokerId) {
      try {
        await NotificationService.create({
          userId: maintenance.property.brokerId,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Trabajo de Mantenimiento Completado',
          message: `El trabajo "${maintenance.title}" ha sido completado por ${maintenanceProvider.businessName}. Por favor confirma que el trabajo se realizó correctamente.`,
          link: `/broker/maintenance/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            propertyAddress: maintenance.property.address,
            providerName: maintenanceProvider.businessName,
            actualCost: updatedMaintenance.actualCost,
            completedDate: updatedMaintenance.completedDate?.toISOString(),
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación al broker:', {
          brokerId: maintenance.property.brokerId,
          maintenanceId,
          error: notificationError,
        });
      }
    }

    logger.info('Trabajo de mantenimiento completado:', {
      maintenanceId,
      providerId: maintenanceProvider.id,
      status: 'PENDING_CONFIRMATION',
    });

    return NextResponse.json({
      message: 'Trabajo completado exitosamente. Esperando confirmación del propietario.',
      maintenance: {
        ...updatedMaintenance,
        images: JSON.parse(updatedMaintenance.images || '[]'),
      },
    });
  } catch (error) {
    logger.error('Error completando trabajo de mantenimiento:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
