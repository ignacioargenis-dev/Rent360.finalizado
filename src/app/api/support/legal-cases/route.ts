import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { withRateLimit } from '@/lib/rate-limiter';
import { cacheManager, createCacheKey } from '@/lib/cache-manager';

// Esquemas de validación
const getLegalCasesSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('10').transform(Number).pipe(z.number().min(1).max(100)),
  status: z.enum([
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
    'DISMISSED'
  ]).optional(),
  caseType: z.enum([
    'EVICTION_NON_PAYMENT',
    'DAMAGE_CLAIM',
    'BREACH_OF_CONTRACT',
    'ILLEGAL_OCCUPATION',
    'RENT_INCREASE_DISPUTE',
    'SECURITY_DEPOSIT_DISPUTE',
    'UTILITY_PAYMENT_DISPUTE',
    'OTHER'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  search: z.string().optional(),
  assignedTo: z.string().optional()
});

const updateCaseSchema = z.object({
  status: z.enum([
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
    'DISMISSED'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  nextDeadline: z.string().datetime().optional(),
  assignedTo: z.string().optional()
});

// GET /api/support/legal-cases - Obtener casos legales para soporte
async function getLegalCases(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Verificar que el usuario sea de soporte o admin
    if (!['SUPPORT', 'ADMIN'].includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo usuarios de soporte pueden acceder a esta información.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Validar parámetros de consulta
    const validatedParams = getLegalCasesSchema.parse(Object.fromEntries(searchParams));
    
    // Construir filtros
    let whereClause: any = {};
    
    if (validatedParams.status) {
      whereClause.status = validatedParams.status;
    }
    if (validatedParams.caseType) {
      whereClause.caseType = validatedParams.caseType;
    }
    if (validatedParams.priority) {
      whereClause.priority = validatedParams.priority;
    }
    if (validatedParams.assignedTo) {
      whereClause.assignedTo = validatedParams.assignedTo;
    }
    
    // Agregar búsqueda por texto si se proporciona
    if (validatedParams.search) {
      whereClause.OR = [
        { caseNumber: { contains: validatedParams.search, mode: 'insensitive' } },
        { notes: { contains: validatedParams.search, mode: 'insensitive' } },
        { internalNotes: { contains: validatedParams.search, mode: 'insensitive' } }
      ];
    }

    // Calcular paginación
    const skip = (validatedParams.page - 1) * validatedParams.limit;
    
    // Crear clave de cache
    const cacheKey = createCacheKey('support:legal-cases', validatedParams);
    
    // Intentar obtener del cache primero
    let result = cacheManager.get(cacheKey);
    
    if (!result) {
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
                    commune: true,
                    region: true
                  }
                },
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                },
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                },
                broker: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true
                  }
                }
              }
            },
            extrajudicialNotices: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            legalDocuments: {
              orderBy: { createdAt: 'desc' },
              take: 3
            },
            courtProceedings: {
              orderBy: { createdAt: 'desc' },
              take: 1
            },
            legalPayments: {
              orderBy: { createdAt: 'desc' },
              take: 5
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: validatedParams.limit
        }),
        db.legalCase.count({ where: whereClause })
      ]);

      result = {
        cases: legalCases,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedParams.limit)
        }
      };

      // Guardar en cache por 5 minutos
      cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    }

    logger.info('Casos legales obtenidos por soporte', {
      context: 'support.legal-cases.list',
      userId: user.id,
      userRole: user.role,
      count: (result as any).cases?.length || 0,
      totalCount: (result as any).pagination?.total || 0,
      filters: validatedParams
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al obtener casos legales para soporte', {
      context: 'support.legal-cases.list',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/support/legal-cases - Actualizar caso legal
async function updateLegalCase(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Verificar que el usuario sea de soporte o admin
    if (!['SUPPORT', 'ADMIN'].includes(user.role.toUpperCase())) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo usuarios de soporte pueden actualizar casos legales.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { caseId, ...updateData } = body;

    if (!caseId) {
      return NextResponse.json(
        { error: 'ID del caso es requerido' },
        { status: 400 }
      );
    }

    // Validar datos de actualización
    const validatedData = updateCaseSchema.parse(updateData);

    // Verificar que el caso existe
    const existingCase = await db.legalCase.findUnique({
      where: { id: caseId },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true
          }
        }
      }
    });

    if (!existingCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos para actualización
    const updateFields: any = {};
    
    if (validatedData.status) {
      updateFields.status = validatedData.status;
    }
    if (validatedData.priority) {
      updateFields.priority = validatedData.priority;
    }
    if (validatedData.notes) {
      updateFields.notes = validatedData.notes;
    }
    if (validatedData.internalNotes) {
      updateFields.internalNotes = validatedData.internalNotes;
    }
    if (validatedData.nextDeadline) {
      updateFields.nextDeadline = new Date(validatedData.nextDeadline);
    }
    if (validatedData.assignedTo) {
      updateFields.assignedTo = validatedData.assignedTo;
    }

    // Actualizar el caso
    const updatedCase = await db.legalCase.update({
      where: { id: caseId },
      data: updateFields
    });

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: caseId,
        userId: user.id,
        action: 'CASE_UPDATED_BY_SUPPORT',
        details: `Caso actualizado por soporte: ${Object.keys(validatedData).join(', ')}`,
        previousValue: JSON.stringify(existingCase),
        newValue: JSON.stringify(updatedCase)
      }
    });

    // Enviar notificaciones si es necesario
    if (validatedData.status && validatedData.status !== existingCase.status) {
      await db.legalNotification.createMany({
        data: [
          {
            legalCaseId: caseId,
            userId: existingCase.contract.tenantId,
            notificationType: 'STATUS_UPDATE',
            title: 'Estado del Caso Actualizado',
            message: `El estado de su caso legal ha sido actualizado a: ${validatedData.status}`,
            priority: 'medium',
            status: 'pending'
          },
          {
            legalCaseId: caseId,
            userId: existingCase.ownerId,
            notificationType: 'STATUS_UPDATE',
            title: 'Estado del Caso Actualizado',
            message: `El estado del caso legal ha sido actualizado a: ${validatedData.status}`,
            priority: 'medium',
            status: 'pending'
          }
        ]
      });
    }

    // Limpiar cache relacionado
    cacheManager.invalidateByTag('legal-cases');

    logger.info('Caso legal actualizado por soporte', {
      context: 'support.legal-cases.update',
      userId: user.id,
      userRole: user.role,
      caseId,
      updates: Object.keys(validatedData)
    });

    return NextResponse.json({
      success: true,
      data: updatedCase,
      message: 'Caso legal actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al actualizar caso legal por soporte', {
      context: 'support.legal-cases.update',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Exportar handlers con rate limiting
export const GET = withRateLimit(getLegalCases, 'api');
export const PUT = withRateLimit(updateLegalCase, 'api');
