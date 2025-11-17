import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';
import { z } from 'zod';

const quoteSchema = z.object({
  estimatedCost: z.number().positive('El costo estimado debe ser positivo'),
  estimatedTime: z.string().optional(),
  notes: z.string().optional(),
  materials: z.string().optional(),
  laborCost: z.number().optional(),
  materialsCost: z.number().optional(),
});

/**
 * POST /api/maintenance/[id]/quote
 * Enviar cotización para una solicitud de mantenimiento asignada
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;
    const body = await request.json();
    const validatedData = quoteSchema.parse(body);

    // Verificar que el usuario es un proveedor de mantenimiento
    const maintenanceProvider = await db.maintenanceProvider.findFirst({
      where: {
        userId: user.id,
        isVerified: true,
        status: 'ACTIVE',
      },
    });

    if (!maintenanceProvider) {
      return NextResponse.json(
        { error: 'No eres un proveedor de mantenimiento activo' },
        { status: 403 }
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
            owner: {
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

    if (maintenance.maintenanceProviderId !== maintenanceProvider.id) {
      return NextResponse.json({ error: 'Esta solicitud no está asignada a ti' }, { status: 403 });
    }

    if (maintenance.status !== 'ASSIGNED') {
      return NextResponse.json(
        { error: 'Solo puedes enviar cotizaciones para solicitudes asignadas' },
        { status: 400 }
      );
    }

    // Actualizar la solicitud con la cotización
    const updatedMaintenance = await db.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'QUOTE_PENDING',
        estimatedCost: validatedData.estimatedCost,
        notes: maintenance.notes
          ? `${maintenance.notes}\n\n[COTIZACIÓN ${new Date().toLocaleString()}]:\nCosto: $${validatedData.estimatedCost.toLocaleString('es-CL')}\n${validatedData.estimatedTime ? `Tiempo estimado: ${validatedData.estimatedTime}\n` : ''}${validatedData.notes ? `Notas: ${validatedData.notes}\n` : ''}${validatedData.materials ? `Materiales: ${validatedData.materials}\n` : ''}${validatedData.laborCost ? `Costo mano de obra: $${validatedData.laborCost.toLocaleString('es-CL')}\n` : ''}${validatedData.materialsCost ? `Costo materiales: $${validatedData.materialsCost.toLocaleString('es-CL')}\n` : ''}`
          : `[COTIZACIÓN ${new Date().toLocaleString()}]:\nCosto: $${validatedData.estimatedCost.toLocaleString('es-CL')}\n${validatedData.estimatedTime ? `Tiempo estimado: ${validatedData.estimatedTime}\n` : ''}${validatedData.notes ? `Notas: ${validatedData.notes}\n` : ''}${validatedData.materials ? `Materiales: ${validatedData.materials}\n` : ''}${validatedData.laborCost ? `Costo mano de obra: $${validatedData.laborCost.toLocaleString('es-CL')}\n` : ''}${validatedData.materialsCost ? `Costo materiales: $${validatedData.materialsCost.toLocaleString('es-CL')}\n` : ''}`,
        updatedAt: new Date(),
      },
    });

    // Notificar al propietario/broker
    const notifyUserId = maintenance.property.ownerId || maintenance.property.brokerId;
    if (notifyUserId) {
      try {
        await NotificationService.create({
          userId: notifyUserId,
          type: NotificationType.MAINTENANCE_REQUEST,
          title: 'Nueva Cotización de Mantenimiento',
          message: `El proveedor ${maintenanceProvider.businessName} ha enviado una cotización de $${validatedData.estimatedCost.toLocaleString('es-CL')} para: ${maintenance.title}`,
          link: `/owner/maintenance/${maintenanceId}`,
          metadata: {
            maintenanceId: maintenance.id,
            maintenanceTitle: maintenance.title,
            quoteAmount: validatedData.estimatedCost,
            providerName: maintenanceProvider.businessName,
          },
        });
      } catch (notificationError) {
        logger.error('Error enviando notificación de cotización:', {
          error: notificationError,
        });
      }
    }

    logger.info('Cotización enviada exitosamente:', {
      maintenanceId,
      providerId: maintenanceProvider.id,
      quoteAmount: validatedData.estimatedCost,
    });

    return NextResponse.json({
      message: 'Cotización enviada exitosamente',
      maintenance: updatedMaintenance,
    });
  } catch (error) {
    logger.error('Error enviando cotización:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}

/**
 * GET /api/maintenance/[id]/quote
 * Obtener la cotización actual de una solicitud
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      select: {
        id: true,
        status: true,
        estimatedCost: true,
        notes: true,
        property: {
          select: {
            ownerId: true,
            brokerId: true,
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
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

    // Verificar permisos
    const hasPermission =
      user.role === 'ADMIN' ||
      (user.role === 'OWNER' && maintenance.property.ownerId === user.id) ||
      (user.role === 'BROKER' && maintenance.property.brokerId === user.id) ||
      maintenance.maintenanceProvider?.userId === user.id;

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta cotización' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      quote: {
        estimatedCost: maintenance.estimatedCost,
        status: maintenance.status,
        notes: maintenance.notes,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo cotización:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error);
  }
}
