import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Esquemas de validación
const createLegalCaseSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato es requerido'),
  caseType: z.enum([
    'EVICTION_NON_PAYMENT',
    'DAMAGE_CLAIM',
    'BREACH_OF_CONTRACT',
    'ILLEGAL_OCCUPATION',
    'RENT_INCREASE_DISPUTE',
    'SECURITY_DEPOSIT_DISPUTE',
    'UTILITY_PAYMENT_DISPUTE',
    'OTHER',
  ]),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).default('MEDIUM'),
  totalDebt: z.number().min(0, 'La deuda debe ser mayor o igual a 0'),
  interestRate: z.number().min(0).max(1).default(0.05),
  firstDefaultDate: z.string().datetime(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

const getLegalCasesSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('10').transform(Number).pipe(z.number().min(1).max(100)),
  status: z
    .enum([
      'PRE_JUDICIAL',
      'EXTRAJUDICIAL_NOTICE',
      'WAITING_RESPONSE',
      'DEMAND_PREPARATION',
      'DEMAND_FILED',
      'COURT_PROCESS',
      'HEARING_SCHEDULED',
      'JUDGMENT_PENDING',
      'JUDGMENT_ISSUED',
      'EVICTION_ORDERED',
      'EVICTION_COMPLETED',
      'PAYMENT_COLLECTION',
      'CASE_CLOSED',
      'SETTLEMENT_REACHED',
      'DISMISSED',
    ])
    .optional(),
  caseType: z
    .enum([
      'EVICTION_NON_PAYMENT',
      'DAMAGE_CLAIM',
      'BREACH_OF_CONTRACT',
      'ILLEGAL_OCCUPATION',
      'RENT_INCREASE_DISPUTE',
      'SECURITY_DEPOSIT_DISPUTE',
      'UTILITY_PAYMENT_DISPUTE',
      'OTHER',
    ])
    .optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  search: z.string().optional(),
});

// POST /api/legal/cases - Crear nuevo caso legal
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createLegalCaseSchema.parse(body);

    // Verificar que el contrato existe y el usuario tiene permisos
    const contract = await db.contract.findUnique({
      where: { id: validatedData.contractId },
      include: {
        tenant: true,
        owner: true,
        broker: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos: solo propietario, corredor o admin pueden crear casos legales
    const canCreateCase =
      user.role === 'ADMIN' ||
      user.id === contract.ownerId ||
      (contract.brokerId && user.id === contract.brokerId);

    if (!canCreateCase) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear casos legales para este contrato' },
        { status: 403 }
      );
    }

    // Verificar que no existe un caso legal activo para este contrato
    const existingCase = await db.legalCase.findFirst({
      where: {
        contractId: validatedData.contractId,
        status: {
          notIn: ['CASE_CLOSED', 'SETTLEMENT_REACHED', 'DISMISSED'],
        },
      },
    });

    if (existingCase) {
      return NextResponse.json(
        { error: 'Ya existe un caso legal activo para este contrato' },
        { status: 400 }
      );
    }

    // Generar número único de caso
    const caseNumber = `LC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calcular intereses acumulados
    const firstDefaultDate = new Date(validatedData.firstDefaultDate);
    const monthsSinceDefault = Math.ceil(
      (Date.now() - firstDefaultDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const accumulatedInterest =
      validatedData.totalDebt * validatedData.interestRate * monthsSinceDefault;

    // Crear el caso legal
    const legalCase = await db.legalCase.create({
      data: {
        caseNumber,
        contractId: validatedData.contractId,
        tenantId: contract.tenantId || '',
        ownerId: contract.ownerId || '',
        brokerId: contract.brokerId,
        caseType: validatedData.caseType,
        priority: validatedData.priority,
        totalDebt: validatedData.totalDebt,
        interestRate: validatedData.interestRate,
        accumulatedInterest,
        totalAmount: validatedData.totalDebt + accumulatedInterest,
        firstDefaultDate,
        currentPhase: 'PRE_JUDICIAL',
        notes: validatedData.notes ?? null,
        internalNotes: validatedData.internalNotes ?? null,
        nextDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 días para respuesta
      },
    });

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: legalCase.id,
        userId: user.id,
        action: 'CASE_CREATED',
        details: `Caso legal creado: ${validatedData.caseType}`,
        newValue: JSON.stringify(legalCase),
      },
    });

    // Enviar notificaciones
    await db.legalNotification.createMany({
      data: [
        {
          legalCaseId: legalCase.id,
          userId: contract.tenantId || '',
          notificationType: 'ACTION_REQUIRED',
          title: 'Caso Legal Iniciado',
          message: `Se ha iniciado un caso legal relacionado con su contrato. Por favor revise los detalles.`,
          priority: 'high',
          status: 'pending',
          actionRequired: true,
          actionDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          legalCaseId: legalCase.id,
          userId: contract.ownerId || '',
          notificationType: 'STATUS_UPDATE',
          title: 'Caso Legal Creado',
          message: `Se ha creado exitosamente el caso legal. El siguiente paso es enviar la notificación extrajudicial.`,
          priority: 'medium',
          status: 'pending',
        },
      ],
    });

    logger.info('Caso legal creado exitosamente', {
      context: 'legal.cases.create',
      userId: user.id,
      caseId: legalCase.id,
      caseNumber: legalCase.caseNumber,
    });

    return NextResponse.json({
      success: true,
      data: legalCase,
      message: 'Caso legal creado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al crear caso legal', {
      context: 'legal.cases.create',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// GET /api/legal/cases - Obtener lista de casos legales
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    // Validar parámetros de consulta
    const validatedParams = getLegalCasesSchema.parse(Object.fromEntries(searchParams));

    // Construir filtros según el rol del usuario
    let whereClause: any = {};

    if (user.role === 'ADMIN') {
      // Admin puede ver todos los casos
      if (validatedParams.status) {
        whereClause.status = validatedParams.status;
      }
      if (validatedParams.caseType) {
        whereClause.caseType = validatedParams.caseType;
      }
      if (validatedParams.priority) {
        whereClause.priority = validatedParams.priority;
      }
    } else if (user.role === 'OWNER') {
      // Propietario solo ve sus propios casos
      whereClause.ownerId = user.id;
      if (validatedParams.status) {
        whereClause.status = validatedParams.status;
      }
      if (validatedParams.caseType) {
        whereClause.caseType = validatedParams.caseType;
      }
      if (validatedParams.priority) {
        whereClause.priority = validatedParams.priority;
      }
    } else if (user.role === 'BROKER') {
      // Corredor ve casos donde es el corredor asignado
      whereClause.brokerId = user.id;
      if (validatedParams.status) {
        whereClause.status = validatedParams.status;
      }
      if (validatedParams.caseType) {
        whereClause.caseType = validatedParams.caseType;
      }
      if (validatedParams.priority) {
        whereClause.priority = validatedParams.priority;
      }
    } else if (user.role === 'TENANT') {
      // Inquilino solo ve casos donde es el inquilino
      whereClause.tenantId = user.id;
      if (validatedParams.status) {
        whereClause.status = validatedParams.status;
      }
      if (validatedParams.caseType) {
        whereClause.caseType = validatedParams.caseType;
      }
      if (validatedParams.priority) {
        whereClause.priority = validatedParams.priority;
      }
    } else {
      return NextResponse.json({ error: 'Rol de usuario no válido' }, { status: 403 });
    }

    // Agregar búsqueda por texto si se proporciona
    if (validatedParams.search) {
      whereClause.OR = [
        { caseNumber: { contains: validatedParams.search, mode: 'insensitive' } },
        { notes: { contains: validatedParams.search, mode: 'insensitive' } },
        { internalNotes: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    // Calcular paginación
    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Obtener casos legales con relaciones
    const [legalCases, totalCount] = await Promise.all([
      db.legalCase.findMany({
        where: whereClause,
        include: {
          contract: {
            include: {
              property: {
                select: {
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
                },
              },
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
          extrajudicialNotices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          legalDocuments: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          courtProceedings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: validatedParams.limit,
      }),
      db.legalCase.count({ where: whereClause }),
    ]);

    // Calcular estadísticas básicas
    const stats = await db.legalCase.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true,
    });

    logger.info('Casos legales obtenidos exitosamente', {
      context: 'legal.cases.list',
      userId: user.id,
      count: legalCases.length,
      totalCount,
      filters: validatedParams,
    });

    return NextResponse.json({
      success: true,
      data: {
        cases: legalCases,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedParams.limit),
        },
        stats: stats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al obtener casos legales', {
      context: 'legal.cases.list',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
