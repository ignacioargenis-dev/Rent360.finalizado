import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de inquilino.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      contract: {
        tenantId: user.id
      }
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener pagos del inquilino
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
                region: true,
              }
            }
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Calcular estadísticas
    const totalPaid = await db.payment.aggregate({
      where: {
        contract: {
          tenantId: user.id
        },
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    });

    const totalPending = await db.payment.aggregate({
      where: {
        contract: {
          tenantId: user.id
        },
        status: 'PENDING',
        dueDate: {
          gte: new Date()
        }
      },
      _sum: {
        amount: true
      }
    });

    const totalOverdue = await db.payment.aggregate({
      where: {
        contract: {
          tenantId: user.id
        },
        status: 'PENDING',
        dueDate: {
          lt: new Date()
        }
      },
      _sum: {
        amount: true
      }
    });

    // Pagos del mes actual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const thisMonthPaid = await db.payment.aggregate({
      where: {
        contract: {
          tenantId: user.id
        },
        status: 'PAID',
        paidAt: {
          gte: currentMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Transformar datos al formato esperado
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      contractId: payment.contractId,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString(),
      status: payment.status.toLowerCase(),
      description: payment.description,
      method: payment.method,
      transactionId: payment.transactionId,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      property: {
        id: payment.contract.property.id,
        title: payment.contract.property.title,
        address: `${payment.contract.property.address}, ${payment.contract.property.commune}, ${payment.contract.property.city}`,
      }
    }));

    const stats = {
      totalPaid: totalPaid._sum.amount || 0,
      totalPending: totalPending._sum.amount || 0,
      totalOverdue: totalOverdue._sum.amount || 0,
      thisMonthPaid: thisMonthPaid._sum.amount || 0,
    };

    logger.info('Pagos de inquilino obtenidos', {
      tenantId: user.id,
      count: transformedPayments.length,
      status,
      stats
    });

    return NextResponse.json({
      success: true,
      data: transformedPayments,
      stats,
      pagination: {
        limit,
        offset,
        total: payments.length,
        hasMore: payments.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo pagos de inquilino:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
