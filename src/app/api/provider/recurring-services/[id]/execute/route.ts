import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const executeServiceSchema = z.object({
  actualCost: z.number().min(0, 'Costo real debe ser mayor o igual a 0'),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE_PROVIDER' && user.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const serviceId = params.id;
    const body = await request.json();
    const validatedData = executeServiceSchema.parse(body);

    // Verificar que el servicio existe y está activo
    const service = await db.recurringService.findUnique({
      where: { id: serviceId },
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
        executions: {
          where: {
            status: 'PENDING',
            scheduledDate: {
              lte: new Date(), // Solo ejecuciones programadas para hoy o antes
            },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 1,
        },
      },
    });

    if (!service) {
      return NextResponse.json({ error: 'Servicio recurrente no encontrado.' }, { status: 404 });
    }

    if (!service.isActive || service.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'El servicio recurrente no está activo.' },
        { status: 400 }
      );
    }

    // Verificar que hay una ejecución pendiente
    if (service.executions.length === 0) {
      return NextResponse.json(
        { error: 'No hay ejecuciones pendientes para este servicio.' },
        { status: 400 }
      );
    }

    const pendingExecution = service.executions[0];
    if (!pendingExecution) {
      return NextResponse.json(
        { error: 'No se pudo encontrar la ejecución pendiente.' },
        { status: 400 }
      );
    }

    // Preparar datos de actualización filtrando valores undefined
    const updateData: any = {
      executedDate: new Date(),
      status: 'COMPLETED',
      actualCost: validatedData.actualCost,
      executedBy: user.id,
      updatedAt: new Date(),
    };

    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    // Ejecutar la instancia del servicio
    const executedService = await db.recurringServiceExecution.update({
      where: { id: pendingExecution.id },
      data: updateData,
    });

    // Actualizar estadísticas del servicio recurrente
    await db.recurringService.update({
      where: { id: serviceId },
      data: {
        totalExecutions: { increment: 1 },
        successfulExecutions: { increment: 1 },
        lastExecutedDate: new Date(),
        nextExecutionDate: calculateNextExecutionDate(
          new Date(pendingExecution.scheduledDate),
          service.frequency
        ),
        updatedAt: new Date(),
      },
    });

    // Crear la siguiente ejecución programada
    await db.recurringServiceExecution.create({
      data: {
        recurringServiceId: serviceId,
        scheduledDate: calculateNextExecutionDate(
          new Date(pendingExecution.scheduledDate),
          service.frequency
        ),
        status: 'PENDING',
      },
    });

    logger.info('Servicio recurrente ejecutado exitosamente', {
      serviceId,
      executionId: pendingExecution.id,
      executedBy: user.id,
      actualCost: validatedData.actualCost,
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio recurrente ejecutado exitosamente.',
      data: {
        execution: executedService,
        nextExecutionDate: calculateNextExecutionDate(
          new Date(pendingExecution.scheduledDate),
          service.frequency
        ).toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error ejecutando servicio recurrente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function calculateNextExecutionDate(lastExecution: Date, frequency: string): Date {
  const nextDate = new Date(lastExecution);

  switch (frequency) {
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'BIWEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'YEARLY':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 30); // Default to monthly
  }

  return nextDate;
}
