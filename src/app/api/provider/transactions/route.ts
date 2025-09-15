import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-edge';
import { handleError } from '@/lib/errors';

/**
 * GET /api/provider/transactions
 * Obtiene las transacciones del proveedor actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE_PROVIDER' && user.role !== 'SERVICE_PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Aquí iría la lógica para obtener transacciones del proveedor
    // Por ahora devolvemos datos de ejemplo
    const mockTransactions = [
      {
        id: 'txn_001',
        amount: 150000,
        commission: 15000,
        netAmount: 135000,
        status: 'COMPLETED',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: new Date('2024-01-15'),
        processedAt: new Date('2024-01-16'),
        notes: 'Pago por servicios de mantenimiento',
        providerType: user.role === 'MAINTENANCE_PROVIDER' ? 'MAINTENANCE' : 'SERVICE',
        jobs: [
          {
            id: 'job_001',
            type: 'maintenance',
            amount: 75000,
            date: new Date('2024-01-10'),
            clientName: 'Juan Pérez'
          },
          {
            id: 'job_002',
            type: 'maintenance',
            amount: 75000,
            date: new Date('2024-01-12'),
            clientName: 'María González'
          }
        ]
      },
      {
        id: 'txn_002',
        amount: 80000,
        commission: 8000,
        netAmount: 72000,
        status: 'PENDING',
        paymentMethod: 'BANK_TRANSFER',
        createdAt: new Date('2024-01-20'),
        processedAt: null,
        notes: 'Pago pendiente de aprobación',
        providerType: user.role === 'MAINTENANCE_PROVIDER' ? 'MAINTENANCE' : 'SERVICE',
        jobs: [
          {
            id: 'job_003',
            type: 'service',
            amount: 80000,
            date: new Date('2024-01-18'),
            clientName: 'Carlos Rodríguez'
          }
        ]
      }
    ];

    // Filtrar por estado si se especifica
    let filteredTransactions = mockTransactions;
    if (status) {
      filteredTransactions = mockTransactions.filter(t => t.status === status);
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
        totalPages: Math.ceil(filteredTransactions.length / limit)
      },
      summary: {
        totalTransactions: filteredTransactions.length,
        totalAmount: filteredTransactions.reduce((sum, t) => sum + t.netAmount, 0),
        completedTransactions: filteredTransactions.filter(t => t.status === 'COMPLETED').length,
        pendingTransactions: filteredTransactions.filter(t => t.status === 'PENDING').length
      }
    });

  } catch (error) {
    logger.error('Error obteniendo transacciones del proveedor:', error);
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
