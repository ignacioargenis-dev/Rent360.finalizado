import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { UserRatingService } from '@/lib/user-rating-service';

export async function GET(request: NextRequest) {
  try {
    // ✅ CRÍTICO: Log inicial para verificar que la petición llega
    logger.info('🔍 [DASHBOARD] Iniciando GET /api/broker/dashboard', {
      url: request.url,
      method: request.method,
      hasCookies: !!request.cookies,
      cookieNames: request.cookies.getAll().map(c => c.name),
    });

    const user = await requireAuth(request);

    // Verificar que sea un corredor
    if (user.role !== 'BROKER') {
      logger.warn('❌ [DASHBOARD] Usuario no es BROKER', { userId: user.id, role: user.role });
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    logger.info('✅ [DASHBOARD] Usuario autenticado como BROKER', {
      userId: user.id,
      userRole: user.role,
      userName: user.name,
      userEmail: user.email,
    });

    // Obtener estadísticas del dashboard
    const [contractStats, propertyStats, commissionData, ...recentActivityData] = await Promise.all(
      [
        // Estadísticas de contratos
        Promise.all([
          // Propiedades totales gestionadas (contratos no draft)
          db.contract.count({
            where: {
              brokerId: user.id,
              status: { not: 'DRAFT' },
            },
          }),
          // Contratos activos
          db.contract.count({
            where: {
              brokerId: user.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
          }),
          // Contratos totales
          db.contract.count({
            where: { brokerId: user.id },
          }),
        ]),

        // Estadísticas de propiedades
        Promise.all([
          // Propiedades totales del broker (propias + gestionadas)
          Promise.all([
            // Propiedades propias del broker
            db.property.count({
              where: { ownerId: user.id },
            }),
            // Propiedades gestionadas por el broker
            db.brokerPropertyManagement.count({
              where: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            }),
          ]).then(([ownProperties, managedProperties]) => {
            const total = ownProperties + managedProperties;
            logger.info('Total properties for broker', {
              brokerId: user.id,
              ownProperties,
              managedProperties,
              total,
            });
            return total;
          }),

          // Propiedades disponibles (propias + gestionadas con status AVAILABLE)
          Promise.all([
            // Propiedades propias disponibles
            db.property.count({
              where: { ownerId: user.id, status: 'AVAILABLE' },
            }),
            // Propiedades gestionadas disponibles
            db.brokerPropertyManagement.count({
              where: {
                brokerId: user.id,
                status: 'ACTIVE',
                property: {
                  status: 'AVAILABLE',
                },
              },
            }),
          ]).then(([ownAvailable, managedAvailable]) => {
            const totalAvailable = ownAvailable + managedAvailable;
            logger.info('Available properties for broker', {
              brokerId: user.id,
              ownAvailable,
              managedAvailable,
              totalAvailable,
            });
            return totalAvailable;
          }),

          // Propiedades rentadas (con contratos activos) - propias
          db.property.count({
            where: {
              ownerId: user.id,
              contracts: {
                some: {
                  status: 'ACTIVE',
                },
              },
            },
          }),

          // Propiedades recientes (últimos 30 días) - propias
          db.property.count({
            where: {
              ownerId: user.id,
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),

          // Propiedades gestionadas activas
          db.brokerPropertyManagement.count({
            where: {
              brokerId: user.id,
              status: 'ACTIVE',
            },
          }),
        ]),

        // Datos de comisiones calculados dinámicamente
        Promise.all([
          // Todos los contratos del corredor para calcular comisiones
          db.contract.findMany({
            where: { brokerId: user.id },
            select: {
              id: true,
              monthlyRent: true,
              status: true,
              startDate: true,
              createdAt: true,
            },
          }),

          // Estadísticas de clientes
          Promise.all([
            // Clientes de contratos tradicionales
            db.user.count({
              where: {
                OR: [
                  {
                    contractsAsOwner: {
                      some: {
                        brokerId: user.id,
                        status: { in: ['ACTIVE', 'PENDING'] },
                      },
                    },
                  },
                  {
                    contractsAsTenant: {
                      some: {
                        brokerId: user.id,
                        status: { in: ['ACTIVE', 'PENDING'] },
                      },
                    },
                  },
                ],
              },
            }),

            // Clientes de relaciones BrokerClient activas
            db.brokerClient.count({
              where: {
                brokerId: user.id,
                status: 'ACTIVE',
              },
            }),
          ]).then(([contractClients, brokerClients]) => {
            const totalActiveClients = contractClients + brokerClients;
            logger.info('Active clients for broker', {
              brokerId: user.id,
              contractClients,
              brokerClients,
              totalActiveClients,
            });
            return totalActiveClients;
          }),
        ]),

        // ✅ CORREGIDO: Actividad reciente - incluir múltiples fuentes
        // Obtener actividades de auditLog
        db.auditLog.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            entityType: true,
            entityId: true,
            newValues: true,
            createdAt: true,
          },
        }),

        // Obtener propiedades creadas recientemente por el broker (últimos 30 días)
        db.property.findMany({
          where: {
            OR: [{ ownerId: user.id }, { brokerId: user.id }],
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        }),

        // Obtener clientes creados recientemente (conversiones de prospectos, últimos 30 días)
        db.brokerClient.findMany({
          where: {
            brokerId: user.id,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            userId: true,
            clientType: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        }),
      ]
    );

    const [totalPropertiesManaged, activeContracts, totalContracts] = contractStats;
    const [
      totalProperties,
      availableProperties,
      rentedProperties,
      recentPropertiesCount,
      managedPropertiesCount,
    ] = propertyStats;
    const [contractsForCommissions, activeClientsCount] = commissionData;
    const [recentActivity, recentPropertiesCreated, recentClientsCreated] = recentActivityData;

    // Calcular comisiones dinámicamente
    // Asumiendo una comisión del 5% del arriendo mensual por contrato
    const COMMISSION_RATE = 0.05;

    const activeContractCommissions = contractsForCommissions
      .filter(contract => contract.status === 'ACTIVE')
      .map(contract => contract.monthlyRent * COMMISSION_RATE);

    const allContractCommissions = contractsForCommissions.map(
      contract => contract.monthlyRent * COMMISSION_RATE
    );

    // Comisiones de los últimos 30 días
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentContractCommissions = contractsForCommissions
      .filter(contract => contract.createdAt >= thirtyDaysAgo)
      .map(contract => contract.monthlyRent * COMMISSION_RATE);

    const totalCommissions = allContractCommissions.reduce((sum, amount) => sum + amount, 0);
    const pendingCommissions = activeContractCommissions.reduce((sum, amount) => sum + amount, 0);
    const monthlyRevenue = recentContractCommissions.reduce((sum, amount) => sum + amount, 0);

    // Usar contratos recientes como proxy para "consultas recientes"
    const recentInquiries = contractsForCommissions.filter(
      contract => contract.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // Calcular tasa de conversión (contratos activos / contratos totales)
    const conversionRate = totalContracts > 0 ? (activeContracts / totalContracts) * 100 : 0;

    // Comisión promedio
    const averageCommission =
      allContractCommissions.length > 0
        ? allContractCommissions.reduce((sum, amount) => sum + amount, 0) /
          allContractCommissions.length
        : 0;

    // Obtener propiedades recientes del corredor (propias + gestionadas)
    const [ownRecentProperties, managedRecentProperties] = await Promise.all([
      // Propiedades propias del broker (usar ownerId para consistencia con totalProperties)
      db.property.findMany({
        where: { ownerId: user.id },
        include: {
          owner: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              contracts: {
                where: {
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Propiedades gestionadas por el broker
      db.brokerPropertyManagement.findMany({
        where: {
          brokerId: user.id,
          status: 'ACTIVE',
        },
        include: {
          property: {
            include: {
              owner: {
                select: {
                  name: true,
                },
              },
              _count: {
                select: {
                  contracts: {
                    where: {
                      status: 'ACTIVE',
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { startDate: 'desc' },
        take: 5,
      }),
    ]);

    // Combinar y transformar propiedades gestionadas al mismo formato
    const transformedManagedProperties = managedRecentProperties.map(record => ({
      id: record.property.id,
      title: record.property.title,
      address: record.property.address,
      status: record.property.status,
      price: record.property.price,
      type: record.property.type,
      owner: { name: record.property.owner?.name || 'Gestionada' },
      createdAt: record.startDate,
      _count: record.property._count,
    }));

    // Combinar ambas listas y ordenar por fecha de creación/gestión
    const allRecentProperties = [...ownRecentProperties, ...transformedManagedProperties]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    const recentProperties = allRecentProperties;

    // Obtener contratos recientes
    const recentContracts = await db.contract.findMany({
      where: { brokerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        property: {
          select: { title: true, address: true },
        },
        tenant: {
          select: { name: true },
        },
        owner: {
          select: { name: true },
        },
      },
    });

    // Generar comisiones recientes basadas en contratos reales
    const recentCommissions = await Promise.all(
      contractsForCommissions
        .filter(contract => contract.status !== 'DRAFT')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5)
        .map(async (contract, index) => {
          // Obtener información de la propiedad para cada contrato
          const fullContract = await db.contract.findUnique({
            where: { id: contract.id },
            include: {
              property: {
                select: { title: true },
              },
            },
          });

          return {
            id: `comm_${contract.id}`,
            amount: Math.round(contract.monthlyRent * COMMISSION_RATE),
            status: contract.status === 'ACTIVE' ? 'PENDING' : 'PAID',
            createdAt: contract.createdAt,
            contract: {
              property: {
                title: fullContract?.property.title || 'Propiedad',
              },
            },
          };
        })
    );

    // Obtener calificación promedio real desde UserRatingService
    const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);
    const averageRating = ratingSummary?.averageRating || 0;

    // Métricas de rendimiento calculadas
    const performanceMetrics = {
      responseTime: 2.3, // horas promedio (podría calcularse desde mensajes)
      satisfactionRate: averageRating, // sobre 5 (desde calificaciones reales)
      repeatClients: Math.round((activeContracts / Math.max(totalContracts, 1)) * 100), // porcentaje
      marketShare: 8.5, // porcentaje (mock por ahora)
    };

    // Calcular valor total del portafolio (propias + gestionadas)
    const [ownPropertiesValue, managedPropertiesValue] = await Promise.all([
      // Valor de propiedades propias (usar ownerId para consistencia)
      db.property
        .findMany({
          where: { ownerId: user.id },
          select: { price: true },
        })
        .then(properties => properties.reduce((sum, prop) => sum + (prop.price || 0), 0)),

      // Valor de propiedades gestionadas
      db.brokerPropertyManagement
        .findMany({
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          include: {
            property: {
              select: { price: true },
            },
          },
        })
        .then(managedProps => managedProps.reduce((sum, mp) => sum + (mp.property.price || 0), 0)),
    ]);

    const portfolioValue = ownPropertiesValue + managedPropertiesValue;

    // Calcular estadísticas adicionales
    const stats = {
      totalProperties: totalProperties || 0, // Propiedades totales (propias + gestionadas)
      activeListings: availableProperties || 0, // Propiedades disponibles
      totalContracts: totalContracts || 0,
      activeContracts: activeContracts || 0,
      activeClients: activeClientsCount || 0, // Clientes activos totales
      totalCommissions: Math.round(totalCommissions),
      pendingCommissions: Math.round(pendingCommissions),
      monthlyRevenue: Math.round(monthlyRevenue),
      portfolioValue: Math.round(portfolioValue), // Valor total del portafolio
      recentInquiries: recentInquiries || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageCommission: Math.round(averageCommission),
    };

    const dashboardData = {
      stats,
      performanceMetrics,
      recentProperties: recentProperties.map(property => ({
        id: property.id,
        title: property.title,
        address: property.address,
        status: property.status?.toLowerCase() || 'unknown',
        price: property.price,
        type: property.type,
        owner: property.owner?.name || 'Sin propietario',
        createdAt: property.createdAt?.toISOString() || new Date().toISOString(),
        inquiriesCount: Math.floor(Math.random() * 10) + 1, // Mock data por ahora
        contractsCount: property._count?.contracts || 0,
      })),
      recentContracts: recentContracts.map(contract => ({
        id: contract.id,
        propertyTitle: contract.property.title,
        propertyAddress: contract.property.address,
        tenantName: contract.tenant?.name || 'Sin inquilino',
        ownerName: contract.owner?.name || 'Sin propietario',
        monthlyRent: contract.monthlyRent,
        status: contract.status,
        createdAt: contract.createdAt.toISOString(),
      })),
      recentCommissions: recentCommissions.map(commission => ({
        id: commission.id,
        amount: commission.amount,
        status: commission.status,
        propertyTitle: commission.contract.property.title,
        createdAt: commission.createdAt.toISOString(),
      })),
      // ✅ CORREGIDO: Combinar actividades de múltiples fuentes
      recentActivity: [
        // Actividades de auditLog
        ...recentActivity.map(activity => ({
          id: `audit-${activity.id}`,
          type: 'audit',
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          description: `${activity.action} en ${activity.entityType}`,
          createdAt: activity.createdAt.toISOString(),
          newValues: activity.newValues,
        })),
        // Propiedades creadas recientemente
        ...recentPropertiesCreated.map(property => ({
          id: `property-${property.id}`,
          type: 'property_created',
          action: 'CREATED',
          entityType: 'PROPERTY',
          entityId: property.id,
          description: `Propiedad "${property.title}" creada`,
          createdAt: property.createdAt.toISOString(),
        })),
        // Clientes creados recientemente (conversiones)
        ...recentClientsCreated.map(client => ({
          id: `client-${client.id}`,
          type: 'client_converted',
          action: 'CONVERTED',
          entityType: 'CLIENT',
          entityId: client.id,
          description: `Cliente "${client.user?.name || 'Nuevo cliente'}" (${client.clientType}) agregado`,
          createdAt: client.createdAt.toISOString(),
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20), // Limitar a las 20 más recientes
    };

    logger.info('✅ [DASHBOARD] Dashboard del corredor obtenido exitosamente', {
      userId: user.id,
      stats: {
        totalProperties: stats.totalProperties,
        activeContracts: stats.activeContracts,
        activeClients: stats.activeClients,
        monthlyRevenue: stats.monthlyRevenue,
        portfolioValue: stats.portfolioValue,
        totalCommissions: stats.totalCommissions,
        conversionRate: stats.conversionRate,
      },
      rawCounts: {
        totalProperties: totalProperties,
        availableProperties,
        rentedProperties,
        recentPropertiesCount,
        managedPropertiesCount,
        activeClientsCount,
      },
      portfolioDetails: {
        ownPropertiesValue,
        managedPropertiesValue,
        portfolioValue,
      },
    });

    // ✅ CRÍTICO: Log adicional para debugging en producción
    console.log('🔍 [DASHBOARD] Stats calculados:', JSON.stringify(stats, null, 2));

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // ✅ CRÍTICO: Log detallado de errores
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ [DASHBOARD] Error obteniendo dashboard del corredor:', {
      error: errorMessage,
      stack: errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    // ✅ CRÍTICO: También usar console.error para asegurar que se vea en logs
    console.error('❌ [DASHBOARD] Error crítico:', errorMessage, errorStack);

    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
