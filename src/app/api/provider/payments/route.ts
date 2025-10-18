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
      maintenanceRequest: {
        assignedProviderId: user.id,
        status: 'COMPLETED'
      }
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener pagos del proveedor
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        maintenanceRequest: {
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
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
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
    const totalEarnings = await db.payment.aggregate({
      where: {
        maintenanceRequest: {
          assignedProviderId: user.id,
          status: 'COMPLETED'
        },
        status: 'PAID'
      },
      _sum: {
        amount: true
      }
    });

    const pendingPayments = await db.payment.aggregate({
      where: {
        maintenanceRequest: {
          assignedProviderId: user.id,
          status: 'COMPLETED'
        },
        status: 'PENDING'
      },
      _sum: {
        amount: true
      }
    });

    const completedRequests = await db.maintenanceRequest.count({
      where: {
        assignedProviderId: user.id,
        status: 'COMPLETED'
      }
    });

    // Transformar datos al formato esperado
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
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
        id: payment.maintenanceRequest.property.id,
        title: payment.maintenanceRequest.property.title,
        address: `${payment.maintenanceRequest.property.address}, ${payment.maintenanceRequest.property.commune}, ${payment.maintenanceRequest.property.city}`,
      },
      tenant: {
        id: payment.maintenanceRequest.tenant.id,
        name: payment.maintenanceRequest.tenant.name,
        email: payment.maintenanceRequest.tenant.email,
        phone: payment.maintenanceRequest.tenant.phone,
      },
      request: {
        id: payment.maintenanceRequest.id,
        type: payment.maintenanceRequest.type,
        title: payment.maintenanceRequest.title,
        completedAt: payment.maintenanceRequest.completedAt?.toISOString(),
      }
    }));

    const stats = {
      totalEarnings: totalEarnings._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      completedRequests,
      averageEarning: completedRequests > 0 ? (totalEarnings._sum.amount || 0) / completedRequests : 0,
    };

    logger.info('Pagos de proveedor obtenidos', {
      providerId: user.id,
      count: transformedPayments.length,
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
    logger.error('Error obteniendo pagos de proveedor:', {
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
