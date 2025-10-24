import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER' && user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      // Los pagos del proveedor están relacionados con solicitudes completadas
      maintenance: {
        assignedTo: user.id,
        status: 'COMPLETED',
      },
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener pagos del proveedor
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
      },
      orderBy: {
        dueDate: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Calcular estadísticas
    const totalEarnings = await db.payment.aggregate({
      where: {
        payerId: user.id,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
    });

    const pendingPayments = await db.payment.aggregate({
      where: {
        payerId: user.id,
        status: 'PENDING',
      },
      _sum: {
        amount: true,
      },
    });

    const completedRequests = await db.maintenance.count({
      where: {
        assignedTo: user.id,
        status: 'COMPLETED',
      },
    });

    // Transformar datos al formato esperado
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString(),
      status: payment.status.toLowerCase(),
      notes: payment.notes,
      method: payment.method,
      transactionId: payment.transactionId,
      paidDate: payment.paidDate?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
      property: {
        id: payment.contract.property.id,
        title: payment.contract.property.title,
        address: `${payment.contract.property.address}, ${payment.contract.property.commune}, ${payment.contract.property.city}`,
      },
      tenant: {
        id: payment.contract.tenant?.id || '',
        name: payment.contract.tenant?.name || '',
        email: payment.contract.tenant?.email || '',
        phone: payment.contract.tenant?.phone || '',
      },
      contract: {
        id: payment.contract.id,
        contractNumber: payment.contract.contractNumber,
        status: payment.contract.status,
        signedAt: payment.contract.signedAt?.toISOString(),
      },
    }));

    const stats = {
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      completedRequests,
      averageEarning:
        completedRequests > 0 ? (totalEarnings._sum.amount || 0) / completedRequests : 0,
    };

    logger.info('Pagos de proveedor obtenidos', {
      providerId: user.id,
      count: transformedPayments.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: transformedPayments,
      stats,
      pagination: {
        limit,
        offset,
        total: payments.length,
        hasMore: payments.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo pagos de proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
