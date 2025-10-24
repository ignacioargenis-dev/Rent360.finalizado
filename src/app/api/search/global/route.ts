import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, properties, users, contracts, payments
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({
        success: true,
        data: {
          properties: [],
          users: [],
          contracts: [],
          payments: [],
          total: 0,
        },
      });
    }

    const searchResults: any = {
      properties: [],
      users: [],
      contracts: [],
      payments: [],
      total: 0,
    };

    // Búsqueda de propiedades (solo para roles autorizados)
    if (type === 'all' || type === 'properties') {
      if (['ADMIN', 'OWNER', 'BROKER'].includes(user.role)) {
        const whereClause: any = {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { address: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { commune: { contains: query, mode: 'insensitive' } },
          ],
        };

        // Filtros por rol
        if (user.role === 'OWNER') {
          whereClause.ownerId = user.id;
        }
        if (user.role === 'BROKER') {
          whereClause.brokerId = user.id;
        }

        const properties = await db.property.findMany({
          where: whereClause,
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            price: true,
            type: true,
            status: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
          },
          take: limit,
        });

        searchResults.properties = properties.map(property => ({
          id: property.id,
          title: property.title,
          address: `${property.address}, ${property.commune}, ${property.city}`,
          price: property.price,
          type: property.type,
          status: property.status,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          area: property.area,
          url: `/properties/${property.id}`,
        }));
      }
    }

    // Búsqueda de usuarios (solo para ADMIN y BROKER)
    if (type === 'all' || type === 'users') {
      if (['ADMIN', 'BROKER'].includes(user.role)) {
        const whereClause: any = {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        };

        // Filtros por rol
        if (user.role === 'BROKER') {
          whereClause.OR = [{ contracts: { some: { brokerId: user.id } } }, { brokerId: user.id }];
        }

        const users = await db.user.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          take: limit,
        });

        searchResults.users = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          url: `/users/${user.id}`,
        }));
      }
    }

    // Búsqueda de contratos (solo para roles autorizados)
    if (type === 'all' || type === 'contracts') {
      if (['ADMIN', 'OWNER', 'BROKER', 'TENANT'].includes(user.role)) {
        const whereClause: any = {
          OR: [{ terms: { contains: query, mode: 'insensitive' } }],
        };

        // Filtros por rol
        if (user.role === 'OWNER') {
          whereClause.ownerId = user.id;
        }
        if (user.role === 'BROKER') {
          whereClause.brokerId = user.id;
        }
        if (user.role === 'TENANT') {
          whereClause.tenantId = user.id;
        }

        const contracts = await db.contract.findMany({
          where: whereClause,
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          take: limit,
        });

        searchResults.contracts = contracts.map(contract => ({
          id: contract.id,
          propertyTitle: contract.property.title,
          propertyAddress: `${contract.property.address}, ${contract.property.commune}, ${contract.property.city}`,
          tenantName: contract.tenant?.name || '',
          ownerName: contract.owner?.name || '',
          monthlyRent: contract.monthlyRent,
          status: contract.status,
          startDate: contract.startDate.toISOString(),
          endDate: contract.endDate.toISOString(),
          url: `/contracts/${contract.id}`,
        }));
      }
    }

    // Búsqueda de pagos (solo para roles autorizados)
    if (type === 'all' || type === 'payments') {
      if (['ADMIN', 'OWNER', 'TENANT'].includes(user.role)) {
        const whereClause: any = {
          OR: [
            { description: { contains: query, mode: 'insensitive' } },
            { transactionId: { contains: query, mode: 'insensitive' } },
          ],
        };

        // Filtros por rol
        if (user.role === 'OWNER') {
          whereClause.contract = { ownerId: user.id };
        }
        if (user.role === 'TENANT') {
          whereClause.contract = { tenantId: user.id };
        }

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
                  },
                },
              },
            },
          },
          take: limit,
        });

        searchResults.payments = payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          dueDate: payment.dueDate.toISOString(),
          paidAt: payment.paidDate?.toISOString(),
          description: payment.notes,
          transactionId: payment.transactionId,
          propertyTitle: payment.contract.property.title,
          propertyAddress: `${payment.contract.property.address}, ${payment.contract.property.commune}, ${payment.contract.property.city}`,
          url: `/payments/${payment.id}`,
        }));
      }
    }

    // Calcular total de resultados
    searchResults.total =
      searchResults.properties.length +
      searchResults.users.length +
      searchResults.contracts.length +
      searchResults.payments.length;

    logger.info('Búsqueda global realizada', {
      userId: user.id,
      role: user.role,
      query,
      type,
      results: searchResults.total,
    });

    return NextResponse.json({
      success: true,
      data: searchResults,
    });
  } catch (error) {
    logger.error('Error en búsqueda global:', {
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
