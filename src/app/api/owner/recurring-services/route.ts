import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const createRecurringServiceSchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad es requerido'),
  tenantId: z.string().min(1, 'ID de inquilino es requerido'),
  serviceType: z.enum([
    'CLEANING',
    'MAINTENANCE',
    'INSPECTION',
    'GARDENING',
    'POOL_MAINTENANCE',
    'OTHER',
  ]),
  frequency: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
  description: z.string().min(1, 'Descripción es requerida'),
  basePrice: z.number().min(0, 'Precio base debe ser mayor o igual a 0'),
  startDate: z.string().datetime('Fecha de inicio inválida'),
  endDate: z.string().datetime().optional(),
  autoRenew: z.boolean().default(true),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {
      ownerId: user.id,
    };

    if (status !== 'all') {
      where.status = status;
    }

    const [services, totalServices] = await db.$transaction([
      db.recurringService.findMany({
        where,
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
              status: 'COMPLETED',
            },
            orderBy: { executedDate: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.recurringService.count({ where }),
    ]);

    // Calcular estadísticas
    const stats = await db.recurringService.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: true,
    });

    const statusCounts = {
      ACTIVE: 0,
      PAUSED: 0,
      CANCELLED: 0,
      COMPLETED: 0,
      ...Object.fromEntries(stats.map(s => [s.status, s._count])),
    };

    logger.info('Servicios recurrentes del propietario obtenidos', {
      ownerId: user.id,
      count: services.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: services,
      pagination: {
        page,
        limit,
        total: totalServices,
        totalPages: Math.ceil(totalServices / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    logger.error('Error obteniendo servicios recurrentes del propietario:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createRecurringServiceSchema.parse(body);

    // Verificar que la propiedad pertenece al propietario
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
      select: {
        id: true,
        ownerId: true,
        title: true,
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada.' }, { status: 404 });
    }

    if (property.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para esta propiedad.' },
        { status: 403 }
      );
    }

    // Verificar que el inquilino existe y está asociado a un contrato activo de esta propiedad
    const activeContract = await db.contract.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        tenantId: validatedData.tenantId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        endDate: true,
      },
    });

    if (!activeContract) {
      return NextResponse.json(
        {
          error:
            'No se encontró un contrato activo entre esta propiedad y el inquilino especificado.',
        },
        { status: 400 }
      );
    }

    // Calcular la próxima fecha de ejecución
    const startDate = new Date(validatedData.startDate);
    const nextExecutionDate = calculateNextExecutionDate(startDate, validatedData.frequency);

    // Preparar datos de creación
    const createData: any = {
      serviceId: `REC-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      propertyId: validatedData.propertyId,
      tenantId: validatedData.tenantId,
      ownerId: user.id,
      serviceType: validatedData.serviceType,
      frequency: validatedData.frequency,
      description: validatedData.description,
      basePrice: validatedData.basePrice,
      startDate,
      nextExecutionDate,
      createdBy: user.id,
    };

    if (validatedData.endDate !== undefined) {
      createData.endDate = new Date(validatedData.endDate);
    }
    if (validatedData.autoRenew !== undefined) {
      createData.autoRenew = validatedData.autoRenew;
    }
    if (validatedData.notes !== undefined) {
      createData.notes = validatedData.notes;
    }

    // Crear servicio recurrente
    const recurringService = await db.recurringService.create({
      data: createData,
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

    // Crear la primera ejecución programada
    await db.recurringServiceExecution.create({
      data: {
        recurringServiceId: recurringService.id,
        scheduledDate: nextExecutionDate,
        status: 'PENDING',
      },
    });

    logger.info('Servicio recurrente creado exitosamente', {
      ownerId: user.id,
      serviceId: recurringService.id,
      propertyId: validatedData.propertyId,
      tenantId: validatedData.tenantId,
    });

    return NextResponse.json({
      success: true,
      message: 'Servicio recurrente creado exitosamente.',
      data: recurringService,
    });
  } catch (error) {
    logger.error('Error creando servicio recurrente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function calculateNextExecutionDate(startDate: Date, frequency: string): Date {
  const nextDate = new Date(startDate);

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
