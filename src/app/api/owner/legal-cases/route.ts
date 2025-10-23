import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const createLegalCaseSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato es requerido'),
  caseType: z.enum(['EVICTION', 'DEBT_COLLECTION', 'CONTRACT_BREACH', 'PROPERTY_DAMAGE', 'OTHER']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  totalDebt: z.number().min(0, 'Deuda total debe ser mayor o igual a 0'),
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

    const [legalCases, totalCases] = await db.$transaction([
      db.legalCase.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
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
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
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
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.legalCase.count({ where }),
    ]);

    // Calcular estadísticas
    const stats = await db.legalCase.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: true,
    });

    const statusCounts = {
      PRE_JUDICIAL: 0,
      JUDICIAL: 0,
      EXECUTION: 0,
      CLOSED: 0,
      ...Object.fromEntries(stats.map(s => [s.status, s._count])),
    };

    logger.info('Casos legales del propietario obtenidos', {
      ownerId: user.id,
      count: legalCases.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: legalCases,
      pagination: {
        page,
        limit,
        total: totalCases,
        totalPages: Math.ceil(totalCases / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    logger.error('Error obteniendo casos legales del propietario:', error);
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
    const validatedData = createLegalCaseSchema.parse(body);

    // Verificar que el contrato pertenece al propietario
    const contract = await db.contract.findUnique({
      where: { id: validatedData.contractId },
      select: {
        id: true,
        ownerId: true,
        tenantId: true,
        brokerId: true,
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        payments: {
          where: {
            status: 'OVERDUE',
          },
          select: {
            amount: true,
            dueDate: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado.' }, { status: 404 });
    }

    if (contract.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para este contrato.' },
        { status: 403 }
      );
    }

    // Calcular deuda total basada en pagos pendientes
    const overduePayments = contract.payments || [];
    const calculatedDebt = overduePayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalDebt = Math.max(validatedData.totalDebt, calculatedDebt);

    // Generar número de caso único
    const caseNumber = `LEGAL-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Preparar datos de creación
    const createData: any = {
      caseNumber,
      contractId: validatedData.contractId,
      tenantId: contract.tenantId,
      ownerId: user.id,
      brokerId: contract.brokerId,
      caseType: validatedData.caseType,
      priority: validatedData.priority,
      totalDebt,
      firstDefaultDate:
        overduePayments.length > 0 ? (overduePayments[0]?.dueDate ?? new Date()) : new Date(),
    };

    if (validatedData.notes !== undefined) {
      createData.notes = validatedData.notes;
    }

    // Crear caso legal
    const legalCase = await db.legalCase.create({
      data: createData,
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
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

    logger.info('Caso legal creado exitosamente', {
      ownerId: user.id,
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
      contractId: validatedData.contractId,
    });

    return NextResponse.json({
      success: true,
      message: 'Caso legal creado exitosamente.',
      data: legalCase,
    });
  } catch (error) {
    logger.error('Error creando caso legal:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
