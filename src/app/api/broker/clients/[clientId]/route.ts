import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/clients/[clientId]
 * Obtiene detalles completos de un cliente específico del broker
 */
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;

    // Buscar la relación brokerClient para este broker y cliente
    // Primero intentar buscar por ID de brokerClient
    let brokerClient = await db.brokerClient.findFirst({
      where: {
        id: clientId,
        brokerId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            rut: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            createdAt: true,
            // Propiedades del usuario si es OWNER
            properties: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
                images: true,
                createdAt: true,
              },
              take: 10,
            },
          },
        },
        managedProperties: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
                images: true,
                createdAt: true,
              },
            },
          },
        },
        prospect: {
          select: {
            id: true,
            status: true,
            priority: true,
            notes: true,
            lastContactDate: true,
            nextFollowUpDate: true,
          },
        },
      },
    });

    // Si no se encuentra por ID de brokerClient, buscar por userId
    if (!brokerClient) {
      brokerClient = await db.brokerClient.findFirst({
        where: {
          userId: clientId,
          brokerId: user.id,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
              rut: true,
              address: true,
              city: true,
              commune: true,
              region: true,
              createdAt: true,
              properties: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  price: true,
                  type: true,
                  status: true,
                  images: true,
                  createdAt: true,
                },
                take: 10,
              },
            },
          },
          managedProperties: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  price: true,
                  type: true,
                  status: true,
                  images: true,
                  createdAt: true,
                },
              },
            },
          },
          prospect: {
            select: {
              id: true,
              status: true,
              priority: true,
              notes: true,
              lastContactDate: true,
              nextFollowUpDate: true,
            },
          },
        },
      });
    }

    // Si aún no se encuentra, buscar clientes que tienen contratos pero no relación BrokerClient
    if (!brokerClient) {
      // Verificar si el clienteId corresponde a un usuario con contratos
      const clientUser = await db.user.findUnique({
        where: { id: clientId },
        include: {
          contractsAsOwner: {
            where: {
              brokerId: user.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
            take: 1,
          },
          contractsAsTenant: {
            where: {
              brokerId: user.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
            take: 1,
          },
        },
      });

      if (clientUser && (clientUser.contractsAsOwner.length > 0 || clientUser.contractsAsTenant.length > 0)) {
        // Crear un objeto similar a brokerClient para mantener compatibilidad
        brokerClient = {
          id: `temp_${clientUser.id}`,
          userId: clientUser.id,
          brokerId: user.id,
          status: 'ACTIVE' as const,
          managementType: 'FULL' as const,
          commissionRate: 5,
          exclusivity: false,
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: clientUser.id,
            name: clientUser.name || '',
            email: clientUser.email || '',
            phone: clientUser.phone || null,
            avatar: clientUser.avatar || null,
            role: clientUser.role,
            rut: clientUser.rut || null,
            address: clientUser.address || null,
            city: clientUser.city || null,
            commune: clientUser.commune || null,
            region: clientUser.region || null,
            createdAt: clientUser.createdAt,
            properties: [],
          },
          managedProperties: [],
          prospect: null,
        } as any;
      }
    }

    if (!brokerClient) {
      logger.warn('Broker client relationship not found', {
        clientId,
        brokerId: user.id,
      });
      return NextResponse.json(
        { error: 'Cliente no encontrado o no autorizado.' },
        { status: 404 }
      );
    }

    // Obtener contratos activos si existen
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          {
            ownerId: brokerClient.userId,
            brokerId: user.id,
            status: 'ACTIVE',
          },
          {
            tenantId: brokerClient.userId,
            brokerId: user.id,
            status: 'ACTIVE',
          },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            type: true,
            status: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calcular estadísticas
    const totalPropertiesManaged = brokerClient.managedProperties.length;
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;

    // Calcular ingresos estimados
    const estimatedMonthlyIncome = contracts.reduce((sum, contract) => {
      const monthlyRent = contract.monthlyRent || 0;
      const commission = monthlyRent * (brokerClient.commissionRate / 100);
      return sum + commission;
    }, 0);

    // Formatear respuesta
    const clientDetail = {
      id: brokerClient.id,
      clientId: brokerClient.user.id,
      name: brokerClient.user.name,
      email: brokerClient.user.email,
      phone: brokerClient.user.phone,
      type: brokerClient.clientType.toLowerCase(),
      status: brokerClient.status.toLowerCase(),
      registrationDate: brokerClient.startDate.toISOString(),
      commissionRate: brokerClient.commissionRate,
      servicesOffered: brokerClient.servicesOffered,
      propertyManagementType: brokerClient.propertyManagementType,
      notes: brokerClient.notes,

      // Estadísticas
      stats: {
        totalPropertiesManaged,
        totalContracts,
        activeContracts,
        estimatedMonthlyIncome,
      },

      // Propiedades gestionadas
      managedProperties: brokerClient.managedProperties.map(mp => ({
        id: mp.property.id,
        title: mp.property.title,
        address: mp.property.address,
        price: mp.property.price,
        type: mp.property.type,
        status: mp.property.status,
        images: mp.property.images ? JSON.parse(mp.property.images) : [],
      })),

      // Propiedades del cliente (si es owner)
      clientProperties: brokerClient.user.properties || [],

      // Contratos activos
      contracts: contracts.map(contract => ({
        id: contract.id,
        property: {
          id: contract.property.id,
          title: contract.property.title,
          address: contract.property.address,
          price: contract.property.price,
          type: contract.property.type,
          status: contract.property.status,
        },
        monthlyRent: contract.monthlyRent,
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString(),
        status: contract.status,
        tenant: contract.tenant
          ? {
              id: contract.tenant.id,
              name: contract.tenant.name,
              email: contract.tenant.email,
            }
          : null,
        owner: contract.owner
          ? {
              id: contract.owner.id,
              name: contract.owner.name,
              email: contract.owner.email,
            }
          : null,
      })),

      // Información del prospect si existe
      prospectInfo: brokerClient.prospect
        ? {
            id: brokerClient.prospect.id,
            status: brokerClient.prospect.status,
            priority: brokerClient.prospect.priority,
            notes: brokerClient.prospect.notes,
            lastContactDate: brokerClient.prospect.lastContactDate?.toISOString(),
            nextFollowUpDate: brokerClient.prospect.nextFollowUpDate?.toISOString(),
          }
        : null,
    };

    logger.info('Client details retrieved successfully', {
      clientId,
      brokerId: user.id,
      clientName: brokerClient.user.name,
    });

    return NextResponse.json({
      success: true,
      client: clientDetail,
    });
  } catch (error) {
    logger.error('Error retrieving client details:', {
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
