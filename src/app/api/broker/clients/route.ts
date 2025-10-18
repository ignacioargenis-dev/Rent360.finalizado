import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      OR: [
        // Clientes que tienen contratos con este broker como propietarios
        {
          contractsAsOwner: {
            some: {
              brokerId: user.id,
            },
          },
        },
        // Clientes que tienen contratos con este broker como inquilinos
        {
          contractsAsTenant: {
            some: {
              brokerId: user.id,
            },
          },
        },
      ],
    };

    if (status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (type !== 'all') {
      whereClause.role = type.toUpperCase();
    }

    // Obtener clientes del broker
    const clients = await db.user.findMany({
      where: whereClause,
      include: {
        contractsAsOwner: {
          where: {
            brokerId: user.id,
          },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
                region: true,
                price: true,
                type: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        contractsAsTenant: {
          where: {
            brokerId: user.id,
          },
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
                region: true,
                price: true,
                type: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedClients = clients.map(client => {
      // Combinar contratos como propietario y como inquilino
      const allContracts = [...client.contractsAsOwner, ...client.contractsAsTenant];

      return {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: client.role.toLowerCase(),
        status: client.isActive ? 'active' : 'inactive',
        registrationDate: client.createdAt.toISOString().split('T')[0],
        lastContact: client.updatedAt.toISOString().split('T')[0],
        preferredContactMethod: 'email', // Por defecto
        budget: {
          min: 0,
          max: 0,
          currency: 'CLP',
        },
        preferences: {
          propertyType: [],
          location: [],
          amenities: [],
        },
        contracts: allContracts.map(contract => ({
          id: contract.id,
          contractNumber: contract.contractNumber,
          property: {
            id: contract.property.id,
            title: contract.property.title,
            address: contract.property.address,
            city: contract.property.city,
            commune: contract.property.commune,
            region: contract.property.region,
            price: contract.property.price,
            type: contract.property.type,
          },
          monthlyRent: contract.monthlyRent,
          status: contract.status.toLowerCase(),
          startDate: contract.startDate.toISOString().split('T')[0],
          endDate: contract.endDate.toISOString().split('T')[0],
        })),
        totalContracts: allContracts.length,
        activeContracts: allContracts.filter(c => c.status === 'ACTIVE').length,
        totalValue: allContracts.reduce((sum, contract) => sum + contract.monthlyRent, 0),
        lastActivity: client.updatedAt.toISOString(),
        notes: '', // Campo para notas del broker
        tags: [], // Tags personalizados
      };
    });

    // Calcular estadísticas
    const totalClients = await db.user.count({
      where: whereClause,
    });

    const activeClients = await db.user.count({
      where: {
        ...whereClause,
        isActive: true,
      },
    });

    const totalContracts = await db.contract.count({
      where: {
        brokerId: user.id,
      },
    });

    const activeContracts = await db.contract.count({
      where: {
        brokerId: user.id,
        status: 'ACTIVE',
      },
    });

    const stats = {
      totalClients,
      activeClients,
      totalContracts,
      activeContracts,
      conversionRate: totalClients > 0 ? (activeClients / totalClients) * 100 : 0,
    };

    logger.info('Clientes de broker obtenidos', {
      brokerId: user.id,
      count: transformedClients.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: transformedClients,
      stats,
      pagination: {
        limit,
        offset,
        total: totalClients,
        hasMore: offset + limit < totalClients,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo clientes de broker:', {
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
