import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const updateRecurringServiceSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED']).optional(),
  basePrice: z.number().min(0).optional(),
  autoRenew: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;

    const service = await db.recurringService.findUnique({
      where: {
        id: serviceId,
        ownerId: user.id, // Solo puede ver sus propios servicios
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        executions: {
          include: {
            executor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio recurrente no encontrado.' }, { status: 404 });
    }

    // Calcular estadísticas del servicio
    const stats = {
      totalExecutions: service.totalExecutions,
      successfulExecutions: service.successfulExecutions,
      failedExecutions: service.failedExecutions,
      pendingExecutions: service.executions.filter(e => e.status === 'PENDING').length,
      nextExecution: service.nextExecutionDate.toISOString().split('T')[0],
      daysUntilNext: Math.ceil(
        (new Date(service.nextExecutionDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    };

    logger.info('Detalles de servicio recurrente obtenidos por propietario', {
      ownerId: user.id,
      serviceId,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        stats,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalles del servicio recurrente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;
    const body = await request.json();
    const validatedData = updateRecurringServiceSchema.parse(body);

    // Verificar que el servicio pertenece al propietario
    const existingService = await db.recurringService.findUnique({
      where: {
        id: serviceId,
        ownerId: user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio recurrente no encontrado o no tienes permisos.' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      updateData.isActive = validatedData.status === 'ACTIVE';
    }
    if (validatedData.basePrice !== undefined) {
      updateData.basePrice = validatedData.basePrice;
    }
    if (validatedData.autoRenew !== undefined) {
      updateData.autoRenew = validatedData.autoRenew;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Actualizar servicio recurrente
    const updatedService = await db.recurringService.update({
      where: { id: serviceId },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Servicio recurrente actualizado por propietario', {
      ownerId: user.id,
      serviceId,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio recurrente actualizado exitosamente.',
      data: updatedService,
    });
  } catch (error) {
    logger.error('Error actualizando servicio recurrente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;

    // Verificar que el servicio pertenece al propietario
    const existingService = await db.recurringService.findUnique({
      where: {
        id: serviceId,
        ownerId: user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio recurrente no encontrado o no tienes permisos.' },
        { status: 404 }
      );
    }

    // Solo permitir cancelar servicios activos
    if (existingService.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar servicios activos.' },
        { status: 400 }
      );
    }

    // Cancelar servicio recurrente
    const cancelledService = await db.recurringService.update({
      where: { id: serviceId },
      data: {
        status: 'CANCELLED',
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Cancelar todas las ejecuciones pendientes
    await db.recurringServiceExecution.updateMany({
      where: {
        recurringServiceId: serviceId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    logger.info('Servicio recurrente cancelado por propietario', {
      ownerId: user.id,
      serviceId,
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio recurrente cancelado exitosamente.',
      data: cancelledService,
    });
  } catch (error) {
    logger.error('Error cancelando servicio recurrente:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
