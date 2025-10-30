import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    console.log(
      `🔍 [API] /api/broker/clients/active called by user: ${user.name} (${user.id}), role: ${user.role}`
    );

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    // Obtener clientes activos del broker (con contratos activos o relaciones brokerClient activas)
    const clients = await db.user.findMany({
      where: {
        isActive: true,
        OR: [
          // Clientes que tienen contratos activos con este broker como propietarios
          {
            contractsAsOwner: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            },
          },
          // Clientes que tienen contratos activos con este broker como inquilinos
          {
            contractsAsTenant: {
              some: {
                brokerId: user.id,
                status: 'ACTIVE',
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
      },
      include: {
        contractsAsOwner: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
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
            status: 'ACTIVE',
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
    });

    console.log(`🔍 Found ${clients.length} clients for broker ${user.id} (${user.name})`);

    // Log detailed information about each client found
    clients.forEach((client, index) => {
      console.log(`🔍 Client ${index + 1}: ${client.name} (${client.id})`);
      console.log(`   - Has ${client.contractsAsOwner.length} contracts as owner`);
      console.log(`   - Has ${client.contractsAsTenant.length} contracts as tenant`);
      console.log(`   - Has ${client.clientRelationships.length} broker relationships`);
      client.clientRelationships.forEach((rel, relIndex) => {
        console.log(
          `     Relationship ${relIndex + 1}: status=${rel.status}, brokerId=${rel.brokerId}`
        );
      });
    });

    // Transformar datos al formato esperado
    const transformedClients = clients.map(client => {
      // Combinar contratos activos como propietario y como inquilino
      const allContracts = [...client.contractsAsOwner, ...client.contractsAsTenant];
      const hasContracts = allContracts.length > 0;

      // Si no hay contratos pero sí hay relaciones brokerClient activas
      const brokerClient = client.clientRelationships[0]; // Tomar la primera relación activa
      const hasBrokerClient = brokerClient && brokerClient.status === 'ACTIVE';

      // Debug logs
      console.log(
        `🔍 Client ${client.id} (${client.name}): hasBrokerClient=${hasBrokerClient}, brokerClientId=${brokerClient?.id}, userId=${client.id}`
      );

      // Calcular datos basados en contratos o en relación brokerClient
      let propertyType = 'residential';
      let propertyValue = 0;
      let monthlyRent = 0;
      let contractStart = client.createdAt.toISOString();
      let contractEnd = undefined;
      let totalCommission = 0;

      if (hasContracts) {
        // Datos basados en contratos
        propertyType = allContracts[0]?.property.type.toLowerCase() || 'residential';
        propertyValue = allContracts.reduce((sum, c) => sum + Number(c.property.price), 0);
        monthlyRent = allContracts.reduce((sum, c) => sum + c.monthlyRent, 0);
        contractStart = allContracts[0]?.startDate.toISOString() || client.createdAt.toISOString();
        contractEnd = allContracts[0]?.endDate.toISOString() || undefined;
        totalCommission = allContracts.reduce(
          (sum, contract) => sum + contract.monthlyRent * 0.05, // Ejemplo: 5% de comisión
          0
        );
      } else if (hasBrokerClient) {
        // Datos basados en relación brokerClient
        const managedProps = brokerClient.managedProperties || [];
        if (managedProps.length > 0 && managedProps[0]?.property) {
          propertyType = managedProps[0].property.type.toLowerCase();
          propertyValue = managedProps.reduce(
            (sum, mp) => sum + Number(mp.property?.price || 0),
            0
          );
        }
        contractStart = brokerClient.startDate.toISOString();
        // Calcular comisión basada en la tasa del brokerClient
        totalCommission = propertyValue * (brokerClient.commissionRate / 100);
      }

      // Calcular siguiente pago (primer día del próximo mes)
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      const response = {
        id: client.id,
        brokerClientId: hasBrokerClient ? brokerClient.id : null, // ID de la relación brokerClient
        name: client.name,
        email: client.email,
        phone: client.phone || '',
        propertyType,
        propertyValue,
        monthlyRent,
        commissionRate: hasBrokerClient ? brokerClient.commissionRate : 5,
        contractStart,
        contractEnd,
        status: 'active' as const,
        lastContact: client.updatedAt.toISOString(),
        nextPayment: nextMonth.toISOString(),
        totalCommission,
        satisfactionScore: 4.5, // Placeholder
        referralSource: hasBrokerClient ? 'invitation' : 'website', // Placeholder
      };

      console.log(
        `📤 Response for ${client.name}: id=${response.id}, brokerClientId=${response.brokerClientId}`
      );
      return response;
    });

    // Calcular estadísticas
    const totalActiveClients = transformedClients.length;
    const totalCommission = transformedClients.reduce((sum, c) => sum + c.totalCommission, 0);
    const averageCommission = totalActiveClients > 0 ? totalCommission / totalActiveClients : 0;

    // Contratos próximos a vencer (dentro de 30 días)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringContracts = transformedClients.filter(c => {
      if (c.contractEnd) {
        const endDate = new Date(c.contractEnd);
        return endDate <= thirtyDaysFromNow && endDate >= new Date();
      }
      return false;
    }).length;

    // Nuevos clientes este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const newClientsThisMonth = transformedClients.filter(c => {
      const contractDate = new Date(c.contractStart);
      return contractDate >= firstDayOfMonth;
    }).length;

    const stats = {
      totalActiveClients,
      totalCommission,
      averageCommission,
      expiringContracts,
      newClientsThisMonth,
    };

    logger.info('Clientes activos de broker obtenidos', {
      brokerId: user.id,
      count: transformedClients.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: transformedClients,
      stats,
    });
  } catch (error) {
    logger.error('Error obteniendo clientes activos de broker:', {
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
