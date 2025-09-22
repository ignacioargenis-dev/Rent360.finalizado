import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod, UserRole } from '@/types';
import { handleError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de consulta
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const contractId = searchParams.get('contractId') || '';
    const method = searchParams.get('method') || '';
    const minAmount = searchParams.get('minAmount') || '';
    const maxAmount = searchParams.get('maxAmount') || '';
    const dueDateFrom = searchParams.get('dueDateFrom') || '';
    const dueDateTo = searchParams.get('dueDateTo') || '';
    const paidDateFrom = searchParams.get('paidDateFrom') || '';
    const paidDateTo = searchParams.get('paidDateTo') || '';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Construir filtros
    const where: any = {};
    
    // Filtro por rol de usuario
    if (user.role === 'owner') {
      where.contract = {
        ownerId: user.id,
      };
    } else if (user.role === 'tenant') {
      where.contract = {
        tenantId: user.id,
      };
    } else if (user.role === 'broker') {
      where.contract = {
        OR: [
          { brokerId: user.id },
          { ownerId: user.id },
        ],
      };
    }
    // Admin puede ver todos los pagos
    
    // Filtros de búsqueda
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { contract: { contractNumber: { contains: search, mode: 'insensitive' } } },
        { contract: { property: { title: { contains: search, mode: 'insensitive' } } } },
        { contract: { property: { address: { contains: search, mode: 'insensitive' } } } },
        { contract: { owner: { name: { contains: search, mode: 'insensitive' } } } },
        { contract: { tenant: { name: { contains: search, mode: 'insensitive' } } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (contractId) {
      where.contractId = contractId;
    }
    
    if (method) {
      where.method = method;
    }
    
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) {
where.amount.gte = parseFloat(minAmount);
}
      if (maxAmount) {
where.amount.lte = parseFloat(maxAmount);
}
    }
    
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) {
where.dueDate.gte = new Date(dueDateFrom);
}
      if (dueDateTo) {
where.dueDate.lte = new Date(dueDateTo);
}
    }
    
    if (paidDateFrom || paidDateTo) {
      where.paidDate = {};
      if (paidDateFrom) {
where.paidDate.gte = new Date(paidDateFrom);
}
      if (paidDateTo) {
where.paidDate.lte = new Date(paidDateTo);
}
    }
    
    // Ordenamiento
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Calcular offset para paginación
    const offset = (page - 1) * limit;
    
    // Ejecutar consulta con paginación
    const [payments, totalCount] = await Promise.all([
      db.payment.findMany({
        where,
        include: {
          contract: {
            select: {
              id: true,
              contractNumber: true,
              monthlyRent: true,
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true,
                  commune: true,
                  type: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);
    
    // Calcular estadísticas
    const totalAmount = payments.reduce((acc, payment) => acc + payment.amount, 0);
    const paidAmount = payments
              .filter(p => p.status === 'COMPLETED')
      .reduce((acc, payment) => acc + payment.amount, 0);
    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((acc, payment) => acc + payment.amount, 0);
    const overdueAmount = payments
      .filter(p => p.status === 'PENDING' && new Date(p.dueDate) < new Date())
      .reduce((acc, payment) => acc + payment.amount, 0);
    
    const paidCount = payments.filter(p => p.status === 'COMPLETED').length;
    const pendingCount = payments.filter(p => p.status === 'PENDING').length;
    const overdueCount = payments.filter(p => 
      p.status === 'PENDING' && new Date(p.dueDate) < new Date(),
    ).length;
    
    // Formatear respuesta
    const formattedPayments = payments.map(payment => {
      const isOverdue = payment.status === 'PENDING' && new Date(payment.dueDate) < new Date();
      const daysOverdue = isOverdue 
        ? Math.ceil((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        id: payment.id,
        paymentNumber: payment.paymentNumber,
        contract: {
          id: payment.contract.id,
          contractNumber: payment.contract.contractNumber,
          monthlyRent: payment.contract.monthlyRent,
          property: payment.contract.property,
          owner: payment.contract.owner,
          tenant: payment.contract.tenant,
        },
        amount: payment.amount,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
        status: payment.status,
        method: payment.method,
        transactionId: payment.transactionId,
        notes: payment.notes,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        isOverdue,
        daysOverdue,
        daysUntilDue: payment.status === 'PENDING' && !isOverdue
          ? Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });
    
    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        totalPayments: totalCount,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        paidCount,
        pendingCount,
        overdueCount,
        paymentsInPage: formattedPayments.length,
      },
    });
    
  } catch (error) {
    logger.error('Error fetching payments:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
