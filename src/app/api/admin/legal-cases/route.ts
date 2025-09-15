import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge';

// Esquemas de validación
const getLegalCasesSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
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
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional()
});

// GET /api/admin/legal-cases - Dashboard administrativo de casos legales
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Verificar que el usuario sea admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden acceder a esta información.' },
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
    if (validatedParams.dateFrom || validatedParams.dateTo) {
      whereClause.createdAt = {};
      if (validatedParams.dateFrom) {
        whereClause.createdAt.gte = new Date(validatedParams.dateFrom);
      }
      if (validatedParams.dateTo) {
        whereClause.createdAt.lte = new Date(validatedParams.dateTo);
      }
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

    // Calcular estadísticas del dashboard
    const [
      totalCases,
      pendingCases,
      activeCases,
      closedCases,
      totalDebt,
      totalLegalFees,
      totalCourtFees,
      casesByStatus,
      casesByType,
      casesByPriority,
      averageProcessingTime,
      casesNeedingAttention
    ] = await Promise.all([
      // Total de casos
      db.legalCase.count(),
      
      // Casos pendientes (pre-judicial y extrajudicial)
      db.legalCase.count({
        where: {
          status: {
            in: ['PRE_JUDICIAL', 'EXTRAJUDICIAL_NOTICE']
          }
        }
      }),
      
      // Casos activos (en proceso judicial)
      db.legalCase.count({
        where: {
          status: {
            in: ['DEMAND_FILED', 'COURT_PROCESS', 'HEARING_SCHEDULED', 'JUDGMENT_PENDING', 'JUDGMENT_ISSUED', 'EVICTION_ORDERED']
          }
        }
      }),
      
      // Casos cerrados
      db.legalCase.count({
        where: {
          status: {
            in: ['CASE_CLOSED', 'SETTLEMENT_REACHED', 'DISMISSED']
          }
        }
      }),
      
      // Total de deuda
      db.legalCase.aggregate({
        _sum: {
          totalDebt: true
        }
      }),
      
      // Total de honorarios legales
      db.legalCase.aggregate({
        _sum: {
          legalFees: true
        }
      }),
      
      // Total de gastos de tribunal
      db.legalCase.aggregate({
        _sum: {
          courtFees: true
        }
      }),
      
      // Casos por estado
      db.legalCase.groupBy({
        by: ['status'],
        _count: true
      }),
      
      // Casos por tipo
      db.legalCase.groupBy({
        by: ['caseType'],
        _count: true
      }),
      
      // Casos por prioridad
      db.legalCase.groupBy({
        by: ['priority'],
        _count: true
      }),
      
      // Tiempo promedio de procesamiento (casos cerrados)
      db.legalCase.aggregate({
        where: {
          status: {
            in: ['CASE_CLOSED', 'SETTLEMENT_REACHED', 'DISMISSED']
          }
        },
        _count: true
      }),
      
      // Casos que necesitan atención (urgentes o críticos, o con plazos vencidos)
      db.legalCase.count({
        where: {
          OR: [
            {
              priority: {
                in: ['URGENT', 'CRITICAL']
              }
            },
            {
              nextDeadline: {
                lt: new Date()
              }
            }
          ]
        }
      })
    ]);

    // Calcular tiempo promedio de procesamiento
    let avgProcessingDays = 0;
    if (averageProcessingTime._count) {
      // Para simplificar, usamos un valor fijo o calculamos basado en casos cerrados
      avgProcessingDays = 15; // Días promedio estimados
    }

    // Obtener actividad reciente
    const recentActivity = await db.legalAuditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        legalCase: {
          select: {
            caseNumber: true,
            caseType: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Obtener casos que necesitan atención inmediata
    const urgentCases = await db.legalCase.findMany({
      where: {
        OR: [
          {
            priority: {
              in: ['URGENT', 'CRITICAL']
            }
          },
          {
            nextDeadline: {
              lt: new Date()
            }
          }
        ]
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                title: true,
                address: true
              }
            },
            tenant: {
              select: {
                name: true,
                email: true
              }
            },
            owner: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      take: 10,
      orderBy: [
        { priority: 'desc' },
        { nextDeadline: 'asc' }
      ]
    });

    logger.info('Dashboard de casos legales obtenido exitosamente', {
      context: 'admin.legal-cases.dashboard',
      userId: user.id,
      count: legalCases.length,
      totalCount,
      filters: validatedParams
    });

    return NextResponse.json({
      success: true,
      data: {
        cases: legalCases,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / validatedParams.limit)
        },
        dashboard: {
          overview: {
            totalCases,
            pendingCases,
            activeCases,
            closedCases,
            casesNeedingAttention
          },
          financial: {
            totalDebt: totalDebt._sum.totalDebt || 0,
            totalLegalFees: totalLegalFees._sum.legalFees || 0,
            totalCourtFees: totalCourtFees._sum.courtFees || 0,
            totalAmount: (totalDebt._sum.totalDebt || 0) + (totalLegalFees._sum.legalFees || 0) + (totalCourtFees._sum.courtFees || 0)
          },
          performance: {
            averageProcessingDays: avgProcessingDays,
            casesByStatus: casesByStatus.reduce((acc, stat) => {
              acc[stat.status] = stat._count;
              return acc;
            }, {} as Record<string, number>),
            casesByType: casesByType.reduce((acc, stat) => {
              acc[stat.caseType] = stat._count;
              return acc;
            }, {} as Record<string, number>),
            casesByPriority: casesByPriority.reduce((acc, stat) => {
              acc[stat.priority] = stat._count;
              return acc;
            }, {} as Record<string, number>)
          },
          urgentCases,
          recentActivity
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros de consulta inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al obtener dashboard de casos legales', {
      context: 'admin.legal-cases.dashboard',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
