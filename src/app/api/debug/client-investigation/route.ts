import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';

// Endpoint temporal para investigar el problema de datos mock en clientes
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json({ error: 'Solo para brokers' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    console.log('🔍 INVESTIGACIÓN: Broker user:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // 1. Verificar si el clientId existe como brokerClient
    if (clientId) {
      console.log('🔍 INVESTIGACIÓN: Buscando brokerClient con ID:', clientId);

      const brokerClient = await db.brokerClient.findFirst({
        where: {
          id: clientId,
          brokerId: user.id,
        },
        include: {
          user: true,
        },
      });

      console.log('🔍 INVESTIGACIÓN: Resultado brokerClient:', {
        found: !!brokerClient,
        id: brokerClient?.id,
        userId: brokerClient?.userId,
        userName: brokerClient?.user?.name,
        status: brokerClient?.status,
        brokerId: brokerClient?.brokerId,
        currentBrokerId: user.id,
      });
    }

    // 2. Listar TODOS los brokerClients del broker actual
    const allBrokerClients = await db.brokerClient.findMany({
      where: {
        brokerId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      take: 20,
    });

    console.log(
      '🔍 INVESTIGACIÓN: Todos los brokerClients del broker:',
      allBrokerClients.map(bc => ({
        id: bc.id,
        userId: bc.userId,
        userName: bc.user?.name,
        status: bc.status,
      }))
    );

    // 3. Verificar si hay algún brokerClient con el ID específico mencionado
    const specificClient = await db.brokerClient.findUnique({
      where: { id: 'cmhccw0di00005c4wmk8ai086' },
      include: {
        user: true,
        broker: true,
      },
    });

    console.log('🔍 INVESTIGACIÓN: Client específico cmhccw0di00005c4wmk8ai086:', {
      exists: !!specificClient,
      brokerId: specificClient?.brokerId,
      userId: specificClient?.userId,
      userName: specificClient?.user?.name,
      brokerName: specificClient?.broker?.name,
      status: specificClient?.status,
      currentUserIsBroker: specificClient?.brokerId === user.id,
    });

    return NextResponse.json({
      success: true,
      investigation: {
        brokerInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
        specificClientSearch: clientId
          ? {
              clientId,
              found: !!specificClient,
              details: specificClient
                ? {
                    brokerId: specificClient.brokerId,
                    userId: specificClient.userId,
                    userName: specificClient.user?.name,
                    status: specificClient.status,
                    currentUserCanAccess: specificClient.brokerId === user.id,
                  }
                : null,
            }
          : null,
        allBrokerClients: allBrokerClients.map(bc => ({
          id: bc.id,
          userId: bc.userId,
          userName: bc.user?.name,
          status: bc.status,
        })),
        specificClientCheck: {
          id: 'cmhccw0di00005c4wmk8ai086',
          exists: !!specificClient,
          brokerId: specificClient?.brokerId,
          userId: specificClient?.userId,
          userName: specificClient?.user?.name,
          status: specificClient?.status,
          currentUserCanAccess: specificClient?.brokerId === user.id,
        },
      },
    });
  } catch (error) {
    console.error('❌ INVESTIGACIÓN: Error:', error);
    return NextResponse.json(
      {
        error: 'Error en investigación',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
