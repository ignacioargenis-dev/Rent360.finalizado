import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const updateLegalCaseSchema = z.object({
  status: z.enum(['PRE_JUDICIAL', 'JUDICIAL', 'EXECUTION', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  currentPhase: z.string().optional(),
  nextDeadline: z.string().datetime().optional(),
  notes: z.string().optional(),
  legalFees: z.number().min(0).optional(),
  courtFees: z.number().min(0).optional(),
  accumulatedInterest: z.number().min(0).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const caseType = searchParams.get('caseType') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status !== 'all') {
      where.status = status;
    }

    if (priority !== 'all') {
      where.priority = priority;
    }

    if (caseType !== 'all') {
      where.caseType = caseType;
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
          owner: {
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
        orderBy: [
          { priority: 'desc' }, // HIGH primero
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.legalCase.count({ where }),
    ]);

    // Calcular estadísticas generales
    const stats = await db.legalCase.groupBy({
      by: ['status', 'priority'],
      _count: true,
      _sum: {
        totalAmount: true,
      },
    });

    const statusStats = stats.reduce(
      (acc, stat) => {
        const statusKey = stat.status;
        if (!acc[statusKey]) {
          acc[statusKey] = { count: 0, totalAmount: 0 };
        }
        acc[statusKey]!.count += stat._count;
        acc[statusKey]!.totalAmount += stat._sum.totalAmount || 0;
        return acc;
      },
      {} as Record<string, { count: number; totalAmount: number }>
    );

    const priorityStats = stats.reduce(
      (acc, stat) => {
        const priorityKey = stat.priority;
        if (!acc[priorityKey]) {
          acc[priorityKey] = 0;
        }
        acc[priorityKey]! += stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    logger.info('Casos legales obtenidos por soporte', {
      userId: user.id,
      role: user.role,
      count: legalCases.length,
      filters: { status, priority, caseType },
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
      stats: {
        byStatus: statusStats,
        byPriority: priorityStats,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo casos legales para soporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
