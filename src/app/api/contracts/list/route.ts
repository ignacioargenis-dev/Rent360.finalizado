import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus, UserRole } from '@/types';
import { handleError } from '@/lib/errors';
import { cacheManager, createCacheKey, cacheConfigs } from '@/lib/cache-manager';
import { safeSum, daysBetween, roundToDecimal, formatCurrency } from '@/lib/math-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    // Parámetros de consulta
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const propertyId = searchParams.get('propertyId') || '';
    const ownerId = searchParams.get('ownerId') || '';
    const tenantId = searchParams.get('tenantId') || '';
    const brokerId = searchParams.get('brokerId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Construir filtros
    const where: any = {};
    
    // Filtro por rol de usuario
    if (user.role === 'owner') {
      where.ownerId = user.id;
    } else if (user.role === 'tenant') {
      where.tenantId = user.id;
    } else if (user.role === 'broker') {
      where.OR = [
        { brokerId: user.id },
        { ownerId: user.id },
      ];
    }
    // Admin puede ver todos los contratos
    
    // Filtros de búsqueda
    if (search) {
      where.OR = [
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { property: { title: { contains: search, mode: 'insensitive' } } },
        { property: { address: { contains: search, mode: 'insensitive' } } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { tenant: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    
    if (status) {
      where.status = status;
    }
    
    if (propertyId) {
      where.propertyId = propertyId;
    }
    
    if (ownerId) {
      where.ownerId = ownerId;
    }
    
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    if (brokerId) {
      where.brokerId = brokerId;
    }
    
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }
    
    // Ordenamiento
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Crear clave de cache basada en parámetros y usuario
    const cacheKey = createCacheKey('contracts:list', {
      userId: user.id,
      userRole: user.role,
      page,
      limit,
      search,
      status,
      propertyId,
      ownerId,
      tenantId,
      brokerId,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    // Intentar obtener del cache primero
    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
      logger.debug('Contracts list obtenido del cache', { cacheKey });
      return NextResponse.json(cachedResult);
    }

    // Ejecutar consulta con paginación
    const [contracts, totalCount] = await Promise.all([
      db.contract.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              commune: true,
              type: true,
              price: true,
              images: true,
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
          broker: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              dueDate: true,
              paidDate: true,
            },
            orderBy: { dueDate: 'desc' },
          },
          signatures: {
            select: {
              id: true,
              signerId: true,
              signatureType: true,
              signedAt: true,
              signer: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      db.contract.count({ where }),
    ]);
    
    // Calcular estadísticas
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;
    const totalMonthlyRent = safeSum(...contracts.map(c => c.monthlyRent));
    const totalDeposits = safeSum(...contracts.map(c => c.deposit));
    
    // Formatear respuesta
    const formattedContracts = contracts.map(contract => {
      const totalPayments = contract.payments.length;
      const paidPayments = contract.payments.filter(p => p.status === 'COMPLETED').length;
      const pendingPayments = contract.payments.filter(p => p.status === 'PENDING').length;
      const overduePayments = contract.payments.filter(p => 
        p.status === 'PENDING' && new Date(p.dueDate) < new Date(),
      ).length;
      
      const totalPaid = safeSum(...contract.payments
        .filter(p => p.status === 'COMPLETED')
        .map(p => p.amount));

      const totalPending = safeSum(...contract.payments
        .filter(p => p.status === 'PENDING')
        .map(p => p.amount));
      
      const isFullySigned = contract.signatures.length >= 2; // Owner + Tenant mínimo
      
      return {
        id: contract.id,
        contractNumber: contract.contractNumber,
        property: {
          ...contract.property,
          images: contract.property.images ? JSON.parse(contract.property.images) : [],
        },
        owner: contract.owner,
        tenant: contract.tenant,
        broker: contract.broker,
        startDate: contract.startDate,
        endDate: contract.endDate,
        monthlyRent: contract.monthlyRent,
        deposit: contract.deposit,
        status: contract.status,
        terms: contract.terms,
        signedAt: contract.signedAt,
        terminatedAt: contract.terminatedAt,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        payments: {
          total: totalPayments,
          paid: paidPayments,
          pending: pendingPayments,
          overdue: overduePayments,
          totalPaid,
          totalPending,
        },
        signatures: contract.signatures.map(signature => ({
          id: signature.id,
          signer: signature.signer,
          signatureType: signature.signatureType,
          signedAt: signature.signedAt,
        })),
        isFullySigned,
        daysRemaining: contract.status === 'ACTIVE' 
                  ? daysBetween(new Date(), new Date(contract.endDate))
        : null,
      };
    });
    
    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responseData = {
      contracts: formattedContracts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        totalContracts: totalCount,
        activeContracts,
        totalMonthlyRent,
        totalDeposits,
        contractsInPage: formattedContracts.length,
      },
    };

    // Guardar en cache con tags para invalidación
    cacheManager.setWithTags(cacheKey, responseData, ['contracts', `user:${user.id}`], cacheConfigs.contract.ttl);

    logger.debug('Contracts list guardado en cache', {
      cacheKey,
      contractsCount: formattedContracts.length,
      ttl: cacheConfigs.contract.ttl
    });

    return NextResponse.json(responseData);
    
  } catch (error) {
    logger.error('Error fetching contracts:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
