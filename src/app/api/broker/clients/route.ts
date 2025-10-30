import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

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
        // Clientes que tienen una relación activa brokerClient con este corredor
        {
          clientRelationships: {
            some: {
              brokerId: user.id,
              status: 'ACTIVE',
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
        clientRelationships: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          include: {
            managedProperties: {
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
            },
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

      // Obtener relación brokerClient activa si existe
      const brokerClient = client.clientRelationships?.[0];
      const hasBrokerClient = brokerClient && brokerClient.status === 'ACTIVE';

      // Calcular propiedades gestionadas si hay relación brokerClient
      const managedPropertiesCount = hasBrokerClient
        ? brokerClient.managedProperties?.length || 0
        : 0;

      return {
        id: client.id,
        brokerClientId: hasBrokerClient ? brokerClient.id : null, // ID de la relación brokerClient
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: client.role.toLowerCase(),
        status: client.isActive ? 'active' : 'inactive',
        registrationDate: client.createdAt.toISOString().split('T')[0],
        lastContact: client.updatedAt.toISOString().split('T')[0],
        preferredContactMethod: 'email',
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
        notes: '',
        tags: [],
        propertiesCount: allContracts.length + managedPropertiesCount, // Incluir propiedades gestionadas
        createdAt: client.createdAt.toISOString(),
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que sea un corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      rut,
      address,
      city,
      commune,
      region,
      budgetMin,
      budgetMax,
      propertyTypes,
      preferredLocations,
      urgencyLevel,
      financing,
      notes,
      source,
    } = body;

    // Validar campos obligatorios
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Nombre, apellido y email son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar si el cliente ya existe
    const existingClient = await db.user.findFirst({
      where: {
        OR: [{ email: email }, ...(rut ? [{ rut: rut }] : [])],
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email o RUT' },
        { status: 400 }
      );
    }

    logger.info('Creando nuevo cliente para corredor', {
      brokerId: user.id,
      clientEmail: email,
      clientName: `${firstName} ${lastName}`,
    });

    // Crear el cliente como un usuario con rol TENANT (ya que no hay rol CLIENT)
    const client = await db.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        password: '$2b$10$dummy.password.for.client.user', // Contraseña dummy, será cambiada por el cliente
        phone: phone || null,
        rut: rut || null,
        address: address || null,
        city: city || null,
        commune: commune || null,
        region: region || null,
        role: 'TENANT', // Usar TENANT ya que CLIENT no existe
        bio: notes || null,
        isActive: true,
      },
    });

    // Crear una entrada en la tabla de relaciones broker-client si es necesario
    // Por ahora, solo guardamos la información básica

    logger.info('Cliente creado exitosamente', {
      clientId: client.id,
      brokerId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        createdAt: client.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error creando cliente:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
