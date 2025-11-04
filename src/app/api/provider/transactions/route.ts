import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/provider/transactions
 * Obtiene las transacciones del proveedor actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        maintenanceProvider: true,
        serviceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Obtener transacciones reales del proveedor
    let transactions: any[] = [];

    if (isMaintenanceProvider(user.role)) {
      if (!fullUser.maintenanceProvider?.id) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
          summary: {
            totalTransactions: 0,
            totalAmount: 0,
            completedTransactions: 0,
            pendingTransactions: 0,
          },
        });
      }

      // Obtener trabajos de mantenimiento completados
      const maintenanceJobs = await db.maintenance.findMany({
        where: {
          maintenanceProviderId: fullUser.maintenanceProvider.id,
          status: 'COMPLETED',
          ...(status && { status }),
        },
        include: {
          property: {
            select: {
              title: true,
              address: true,
            },
          },
          requester: {
            select: {
              name: true,
            },
          },
          transactions: true,
        },
        orderBy: {
          completedDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      transactions = maintenanceJobs.map(job => ({
        id: `txn_maint_${job.id}`,
        amount: job.actualCost || job.estimatedCost || 0,
        commission: (job.actualCost || job.estimatedCost || 0) * 0.1, // 10% comisión
        netAmount: (job.actualCost || job.estimatedCost || 0) * 0.9,
        status: job.transactions[0]?.status || 'PENDING',
        paymentMethod: job.transactions[0]?.paymentMethod || 'BANK_TRANSFER',
        createdAt: job.completedDate || job.createdAt,
        processedAt: job.transactions[0]?.processedAt,
        notes: `Trabajo de mantenimiento: ${job.title}`,
        providerType: 'MAINTENANCE',
        jobs: [
          {
            id: job.id,
            type: 'maintenance',
            amount: job.actualCost || job.estimatedCost || 0,
            date: job.completedDate || job.createdAt,
            clientName: job.requester.name,
            propertyTitle: job.property.title,
            propertyAddress: job.property.address,
          },
        ],
      }));
    } else if (isServiceProvider(user.role)) {
      if (!fullUser.serviceProvider?.id) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit, total: 0, totalPages: 0 },
          summary: {
            totalTransactions: 0,
            totalAmount: 0,
            completedTransactions: 0,
            pendingTransactions: 0,
          },
        });
      }

      // Obtener trabajos de servicio completados
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          serviceProviderId: fullUser.serviceProvider.id,
          status: 'COMPLETED',
          ...(status && { status }),
        },
        include: {
          requester: {
            select: {
              name: true,
            },
          },
          transactions: true,
        },
        orderBy: {
          completedDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

      transactions = serviceJobs.map(job => ({
        id: `txn_service_${job.id}`,
        amount: job.finalPrice || job.basePrice,
        commission: (job.finalPrice || job.basePrice) * 0.1, // 10% comisión
        netAmount: (job.finalPrice || job.basePrice) * 0.9,
        status: job.transactions[0]?.status || 'PENDING',
        paymentMethod: job.transactions[0]?.paymentMethod || 'BANK_TRANSFER',
        createdAt: job.completedDate || job.createdAt,
        processedAt: job.transactions[0]?.processedAt,
        notes: `Trabajo de servicio: ${job.title}`,
        providerType: 'SERVICE',
        jobs: [
          {
            id: job.id,
            type: 'service',
            amount: job.finalPrice || job.basePrice,
            date: job.completedDate || job.createdAt,
            clientName: job.requester.name,
          },
        ],
      }));
    }

    // Filtrar por estado si se especifica
    let filteredTransactions = transactions;
    if (status) {
      filteredTransactions = transactions.filter(t => t.status === status);
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit),
      },
      summary: {
        totalTransactions: filteredTransactions.length,
        totalAmount: filteredTransactions.reduce((sum, t) => sum + t.netAmount, 0),
        completedTransactions: filteredTransactions.filter(t => t.status === 'COMPLETED').length,
        pendingTransactions: filteredTransactions.filter(t => t.status === 'PENDING').length,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo transacciones del proveedor:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
