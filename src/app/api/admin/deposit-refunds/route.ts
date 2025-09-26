import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
import { RefundStatus } from '@/types';

// Esquemas de validación
const getRefundsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('10'),
  status: z.nativeEnum(RefundStatus).optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.enum(['createdAt', 'status', 'originalDeposit', 'requestedAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET - Dashboard de administradores
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // Verificar que es admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden acceder al dashboard de devoluciones' },
        { status: 403 }
      );
    }

    const validatedParams = getRefundsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Construir filtros
    const where: any = {};

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.search) {
      where.OR = [
        { refundNumber: { contains: validatedParams.search, mode: 'insensitive' } },
        { tenant: { name: { contains: validatedParams.search, mode: 'insensitive' } } },
        { owner: { name: { contains: validatedParams.search, mode: 'insensitive' } } },
        { contract: { property: { address: { contains: validatedParams.search, mode: 'insensitive' } } } },
      ];
    }

    if (validatedParams.dateFrom || validatedParams.dateTo) {
      where.createdAt = {};
      if (validatedParams.dateFrom) {
        where.createdAt.gte = new Date(validatedParams.dateFrom);
      }
      if (validatedParams.dateTo) {
        where.createdAt.lte = new Date(validatedParams.dateTo);
      }
    }

    // Construir ordenamiento
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Obtener solicitudes con paginación
    const [refunds, total] = await Promise.all([
      db.depositRefund.findMany({
        where,
        skip,
        take: validatedParams.limit,
        orderBy,
        include: {
          contract: {
            include: {
              tenant: true,
              owner: true,
              property: true,
            }
          },
          tenant: true,
          owner: true,
          documents: {
            select: { id: true }
          },
          disputes: {
            where: { status: { in: ['OPEN', 'UNDER_MEDIATION'] } },
            select: { id: true }
          },
          approvals: {
            select: { id: true }
          },
          _count: {
            select: {
              documents: true,
              disputes: true,
              approvals: true,
              auditLogs: true,
            }
          }
        }
      }),
      db.depositRefund.count({ where })
    ]);

    // Obtener estadísticas generales
    const [
      totalRefunds,
      pendingRefunds,
      disputedRefunds,
      approvedRefunds,
      processedRefunds,
      totalAmount,
      averageProcessingTime,
      disputesByType,
      statusDistribution
    ] = await Promise.all([
      // Total de solicitudes
      db.depositRefund.count(),
      
      // Solicitudes pendientes
      db.depositRefund.count({ where: { status: 'PENDING' } }),
      
      // Solicitudes en disputa
      db.depositRefund.count({ where: { status: 'DISPUTED' } }),
      
      // Solicitudes aprobadas
      db.depositRefund.count({ where: { status: 'APPROVED' } }),
      
      // Solicitudes procesadas
      db.depositRefund.count({ where: { status: 'PROCESSED' } }),
      
      // Monto total de depósitos
      db.depositRefund.aggregate({
        _sum: { originalDeposit: true }
      }),
      
      // Tiempo promedio de procesamiento (simplificado)
      db.depositRefund.aggregate({
        where: { 
          status: 'PROCESSED',
          processedAt: { not: undefined }
        },
        _avg: {
          originalDeposit: true
        }
      }),
      
      // Disputas por tipo
      db.refundDispute.groupBy({
        by: ['disputeType'],
        _count: { id: true }
      }),
      
      // Distribución por estado
      db.depositRefund.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    // Obtener solicitudes que requieren atención
    const needsAttention = await db.depositRefund.findMany({
      where: {
        OR: [
          { status: 'DISPUTED' },
          { 
            status: 'UNDER_REVIEW',
            createdAt: { 
              lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Más de 7 días
            }
          }
        ]
      },
      take: 5,
      orderBy: { createdAt: 'asc' },
      include: {
        tenant: true,
        owner: true,
        contract: {
          include: {
            property: true
          }
        },
        disputes: {
          where: { status: { in: ['OPEN', 'UNDER_MEDIATION'] } },
          take: 1
        }
      }
    });

    // Obtener actividad reciente
    const recentActivity = await db.refundAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          }
        },
        refund: {
          include: {
            tenant: true,
            owner: true,
          }
        }
      }
    });

    const totalPages = Math.ceil(total / validatedParams.limit);

    // Preparar estadísticas
    const stats = {
      overview: {
        total: totalRefunds,
        pending: pendingRefunds,
        disputed: disputedRefunds,
        approved: approvedRefunds,
        processed: processedRefunds,
        totalAmount: totalAmount._sum.originalDeposit || 0,
        averageProcessingTime: averageProcessingTime._avg.originalDeposit || 0,
      },
      disputesByType: disputesByType.reduce((acc, item) => {
        acc[item.disputeType] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      statusDistribution: statusDistribution.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      needsAttention,
      recentActivity: recentActivity.map(log => ({
        id: log.id,
        action: log.action,
        details: log.details,
        user: log.user,
        refund: log.refund,
        timestamp: log.createdAt,
      }))
    };

    logger.info('Dashboard de devoluciones consultado:', {
      userId: user.id,
      filters: validatedParams,
      count: refunds.length,
      total,
    });

    return NextResponse.json({
      success: true,
      data: {
        refunds,
        stats,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          totalPages,
          hasNext: validatedParams.page < totalPages,
          hasPrev: validatedParams.page > 1,
        }
      }
    });

  } catch (error) {
    logger.error('Error consultando dashboard de devoluciones:', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.headers.get('user-id'),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
