import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// Endpoint para investigar de dónde vienen los IDs en la lista de clientes activos
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json({ error: 'Solo para brokers' }, { status: 403 });
    }

    console.log('🔍 INVESTIGACIÓN ACTIVE CLIENTS: Broker:', user.id);

    // 1. Obtener todos los usuarios que tienen contratos con este broker
    const usersWithContracts = await db.user.findMany({
      where: {
        isActive: true,
        OR: [
          {
            contractsAsOwner: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
          {
            contractsAsTenant: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        contractsAsOwner: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            status: true,
          },
        },
        contractsAsTenant: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    console.log(
      '🔍 CONTRACT USERS:',
      usersWithContracts.map(u => ({
        userId: u.id,
        name: u.name,
        contractsAsOwner: u.contractsAsOwner.length,
        contractsAsTenant: u.contractsAsTenant.length,
      }))
    );

    // 2. Obtener todos los usuarios que tienen relaciones brokerClient activas
    const usersWithBrokerClients = await db.user.findMany({
      where: {
        isActive: true,
        clientRelationships: {
          some: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        clientRelationships: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            status: true,
            clientType: true,
          },
        },
      },
    });

    console.log(
      '🔍 BROKER CLIENT USERS:',
      usersWithBrokerClients.map(u => ({
        userId: u.id,
        name: u.name,
        brokerClients: u.clientRelationships.map(bc => ({
          id: bc.id,
          clientType: bc.clientType,
          status: bc.status,
        })),
      }))
    );

    // 3. Verificar qué IDs específicos se están devolviendo en la API de clientes activos
    const activeClientsApiResponse = await db.user.findMany({
      where: {
        isActive: true,
        OR: [
          {
            contractsAsOwner: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
          {
            contractsAsTenant: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
          {
            clientRelationships: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 50,
    });

    console.log(
      '🔍 ACTIVE CLIENTS API WOULD RETURN:',
      activeClientsApiResponse.map(u => ({
        id: u.id,
        name: u.name,
      }))
    );

    // 4. Verificar si existe el ID específico mencionado
    const specificUser = await db.user.findUnique({
      where: { id: 'cmhccw0di00005c4wmk8ai086' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    console.log('🔍 SPECIFIC USER cmhccw0di00005c4wmk8ai086:', specificUser);

    // 5. Verificar si ese ID existe como brokerClient
    const specificBrokerClient = await db.brokerClient.findUnique({
      where: { id: 'cmhccw0di00005c4wmk8ai086' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log('🔍 SPECIFIC BROKER CLIENT cmhccw0di00005c4wmk8ai086:', {
      exists: !!specificBrokerClient,
      brokerId: specificBrokerClient?.brokerId,
      userId: specificBrokerClient?.userId,
      userName: specificBrokerClient?.user?.name,
      brokerName: specificBrokerClient?.broker?.name,
      status: specificBrokerClient?.status,
      currentUserCanAccess: specificBrokerClient?.brokerId === user.id,
    });

    return NextResponse.json({
      success: true,
      analysis: {
        brokerId: user.id,
        contractBasedClients: usersWithContracts.length,
        brokerClientBasedClients: usersWithBrokerClients.length,
        totalActiveClients: activeClientsApiResponse.length,
        specificUserCheck: {
          id: 'cmhccw0di00005c4wmk8ai086',
          exists: !!specificUser,
          details: specificUser,
        },
        specificBrokerClientCheck: {
          id: 'cmhccw0di00005c4wmk8ai086',
          exists: !!specificBrokerClient,
          canAccess: specificBrokerClient?.brokerId === user.id,
          details: specificBrokerClient
            ? {
                brokerId: specificBrokerClient.brokerId,
                userId: specificBrokerClient.userId,
                userName: specificBrokerClient.user?.name,
                brokerName: specificBrokerClient.broker?.name,
                status: specificBrokerClient.status,
              }
            : null,
        },
        activeClientsList: activeClientsApiResponse.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    return NextResponse.json(
      {
        error: 'Error en análisis',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
