import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { withCache, getStatsCacheKey, cacheTTL } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar permisos según el rol
    const allowedRoles = [
      'ADMIN',
      'OWNER',
      'BROKER',
      'TENANT',
      'RUNNER',
      'PROVIDER',
      'MAINTENANCE',
    ];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Permisos insuficientes.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const role = user.role;

    // Generar clave de cache
    const cacheKey = getStatsCacheKey(user.role, period, user.id);

    // Intentar obtener datos del cache
    const statsData = await withCache(
      cacheKey,
      async () => {
        return await fetchStatsData(user, period);
      },
      cacheTTL.MEDIUM
    );

    logger.info('Estadísticas obtenidas', {
      userId: user.id,
      role: user.role,
      period,
      cached: true,
    });

    return NextResponse.json({
      success: true,
      data: statsData,
      cached: true,
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', {
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

async function fetchStatsData(user: any, period: string) {
  const now = new Date();
  let startDate = new Date();

  switch (period) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }

  const stats: any = {};

  switch (user.role) {
    case 'ADMIN':
      // Estadísticas globales del sistema
      const [
        totalUsers,
        totalProperties,
        totalContracts,
        totalPayments,
        monthlyRevenue,
        activeUsers,
        newUsers,
        pendingTickets,
      ] = await Promise.all([
        db.user.count(),
        db.property.count(),
        db.contract.count({ where: { status: 'ACTIVE' } }),
        db.payment.count({ where: { status: 'PAID' } }),
        db.payment.aggregate({
          where: {
            status: 'PAID',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        }),
        db.user.count({ where: { isActive: true } }),
        db.user.count({ where: { createdAt: { gte: startDate } } }),
        db.ticket.count({ where: { status: 'OPEN' } }),
      ]);

      stats.totalUsers = totalUsers;
      stats.totalProperties = totalProperties;
      stats.totalContracts = totalContracts;
      stats.totalPayments = totalPayments;
      stats.monthlyRevenue = monthlyRevenue._sum.amount || 0;
      stats.activeUsers = activeUsers;
      stats.newUsers = newUsers;
      stats.pendingTickets = pendingTickets;
      break;

    case 'OWNER':
      // Estadísticas del propietario
      const [
        ownerProperties,
        ownerContracts,
        ownerPayments,
        ownerRevenue,
        ownerCompletedTasks,
        ownerPendingTasks,
      ] = await Promise.all([
        db.property.count({ where: { ownerId: user.id } }),
        db.contract.count({ where: { ownerId: user.id, status: 'ACTIVE' } }),
        db.payment.count({
          where: {
            contract: { ownerId: user.id },
            status: 'PAID',
          },
        }),
        db.payment.aggregate({
          where: {
            contract: { ownerId: user.id },
            status: 'PAID',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        }),
        db.maintenance.count({
          where: {
            property: { ownerId: user.id },
            status: 'COMPLETED',
          },
        }),
        db.maintenance.count({
          where: {
            property: { ownerId: user.id },
            status: 'PENDING',
          },
        }),
      ]);

      stats.totalProperties = ownerProperties;
      stats.totalContracts = ownerContracts;
      stats.totalPayments = ownerPayments;
      stats.monthlyRevenue = ownerRevenue._sum.amount || 0;
      stats.completedTasks = ownerCompletedTasks;
      stats.pendingTasks = ownerPendingTasks;

      // Datos detallados para reportes
      stats.properties = await db.property
        .findMany({
          where: { ownerId: user.id },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            price: true,
            status: true,
            createdAt: true,
            _count: {
              select: {
                contracts: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
          take: 10,
        })
        .then(properties =>
          properties.map(prop => ({
            id: prop.id, // ✅ Incluir el ID para navegación
            title: prop.title,
            location: `${prop.address}, ${prop.city}`,
            address: prop.address, // ✅ Incluir address para compatibilidad
            city: prop.city, // ✅ Incluir city para compatibilidad
            revenue: prop.price,
            monthlyRevenue: prop.price, // ✅ Alias para compatibilidad
            occupancy: prop._count.contracts > 0 ? 100 : 0,
            occupancyRate: prop._count.contracts > 0 ? 100 : 0, // ✅ Alias para compatibilidad
            status: prop.status,
            averageRating: 0, // ✅ Valor por defecto
            maintenanceCosts: 0, // ✅ Valor por defecto
            totalRevenue: prop.price * 12, // ✅ Calcular total revenue
          }))
        );

      // Inquilinos activos
      stats.tenants = await db.contract
        .findMany({
          where: {
            ownerId: user.id,
            status: 'ACTIVE',
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            property: {
              select: {
                title: true,
              },
            },
          },
          take: 20,
        })
        .then(contracts =>
          contracts
            .filter(contract => contract.tenant && contract.property) // Filtrar contratos sin tenant o property
            .map(contract => ({
              name: contract.tenant!.name,
              email: contract.tenant!.email,
              property: contract.property!.title,
              status: 'ACTIVE',
            }))
        );

      // Datos de mantenimiento
      const maintenanceStats = await db.maintenance.aggregate({
        where: { property: { ownerId: user.id } },
        _count: { _all: true },
        _avg: { estimatedCost: true },
      });

      stats.maintenanceRequests = await db.maintenance.count({
        where: {
          property: { ownerId: user.id },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      });

      stats.maintenanceCompleted = await db.maintenance.count({
        where: {
          property: { ownerId: user.id },
          status: 'COMPLETED',
        },
      });

      stats.averageMaintenanceCost = maintenanceStats._avg.estimatedCost || 0;

      // Calcular gastos reales de mantenimiento
      const totalMaintenanceCosts = await db.maintenance.aggregate({
        where: {
          property: { ownerId: user.id },
          status: 'COMPLETED',
          completedDate: { gte: startDate },
        },
        _sum: {
          actualCost: true,
          estimatedCost: true,
        },
      });
      stats.totalMaintenanceCosts =
        (totalMaintenanceCosts._sum.actualCost || 0) +
        (totalMaintenanceCosts._sum.estimatedCost || 0);

      // Calcular pagos vencidos (paymentDelays)
      const now = new Date();
      const overduePayments = await db.payment.count({
        where: {
          contract: { ownerId: user.id },
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lt: now },
        },
      });
      stats.paymentDelays = overduePayments;

      // Calcular tiempo promedio de respuesta de mantenimiento
      const completedMaintenances = await db.maintenance.findMany({
        where: {
          property: { ownerId: user.id },
          status: 'COMPLETED',
          completedDate: { gte: startDate },
        },
        select: {
          createdAt: true,
          completedDate: true,
        },
      });
      if (completedMaintenances.length > 0) {
        const totalResponseHours = completedMaintenances.reduce((sum, m) => {
          if (m.completedDate) {
            const hours = (m.completedDate.getTime() - m.createdAt.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }
          return sum;
        }, 0);
        stats.averageMaintenanceResponseTime = totalResponseHours / completedMaintenances.length;
      } else {
        stats.averageMaintenanceResponseTime = 0;
      }

      // Distribución real de tipos de propiedades
      const propertyTypes = await db.property.groupBy({
        by: ['type'],
        where: { ownerId: user.id },
        _count: { _all: true },
      });
      stats.propertyDistribution = propertyTypes.map(pt => ({
        name:
          pt.type === 'APARTMENT'
            ? 'Departamentos'
            : pt.type === 'HOUSE'
              ? 'Casas'
              : pt.type === 'STUDIO'
                ? 'Estudios'
                : pt.type === 'ROOM'
                  ? 'Habitaciones'
                  : pt.type === 'COMMERCIAL'
                    ? 'Oficinas'
                    : pt.type,
        value: pt._count._all,
        type: pt.type,
      }));

      // Datos financieros detallados por mes (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const paymentsByMonth = await db.payment.findMany({
        where: {
          contract: { ownerId: user.id },
          status: 'PAID',
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      // Agrupar por mes
      const monthlyData: Record<string, { revenue: number; expenses: number }> = {};
      const months = [
        'Ene',
        'Feb',
        'Mar',
        'Abr',
        'May',
        'Jun',
        'Jul',
        'Ago',
        'Sep',
        'Oct',
        'Nov',
        'Dic',
      ];

      // Inicializar últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        monthlyData[monthKey] = { revenue: 0, expenses: 0 };
      }

      // Agregar ingresos por mes
      paymentsByMonth.forEach(payment => {
        const monthKey = payment.createdAt.toISOString().slice(0, 7);
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].revenue += payment.amount;
        }
      });

      // Agregar gastos de mantenimiento por mes
      const maintenancesByMonth = await db.maintenance.findMany({
        where: {
          property: { ownerId: user.id },
          status: 'COMPLETED',
          completedDate: { gte: sixMonthsAgo },
        },
        select: {
          actualCost: true,
          estimatedCost: true,
          completedDate: true,
        },
      });

      maintenancesByMonth.forEach(maintenance => {
        if (maintenance.completedDate) {
          const monthKey = maintenance.completedDate.toISOString().slice(0, 7);
          if (monthlyData[monthKey]) {
            monthlyData[monthKey].expenses +=
              (maintenance.actualCost || 0) + (maintenance.estimatedCost || 0);
          }
        }
      });

      // Convertir a array ordenado
      stats.financialData = Object.keys(monthlyData)
        .sort()
        .map(monthKey => {
          const date = new Date(monthKey + '-01');
          const monthIndex = date.getMonth();
          return {
            month: months[monthIndex],
            monthKey,
            revenue: monthlyData[monthKey].revenue,
            expenses: monthlyData[monthKey].expenses,
            net: monthlyData[monthKey].revenue - monthlyData[monthKey].expenses,
          };
        });

      // Calcular tasa de ocupación
      const occupiedProperties = await db.property.count({
        where: {
          ownerId: user.id,
          contracts: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      });
      stats.occupancyRate =
        ownerProperties > 0 ? Math.round((occupiedProperties / ownerProperties) * 100) : 0;

      // Calcular satisfacción de inquilinos
      const tenantRatings = await db.userRating.findMany({
        where: {
          toUserId: user.id,
          createdAt: { gte: startDate },
        },
        select: {
          overallRating: true,
        },
      });
      stats.tenantSatisfaction =
        tenantRatings.length > 0
          ? tenantRatings.reduce((sum, r) => sum + r.overallRating, 0) / tenantRatings.length
          : 0;

      // Calcular porcentaje de cambio mensual (comparar mes actual vs anterior)
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const currentMonthRevenue = await db.payment.aggregate({
        where: {
          contract: { ownerId: user.id },
          status: 'PAID',
          createdAt: {
            gte: currentMonth,
            lt: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
          },
        },
        _sum: { amount: true },
      });

      const lastMonthRevenue = await db.payment.aggregate({
        where: {
          contract: { ownerId: user.id },
          status: 'PAID',
          createdAt: {
            gte: lastMonth,
            lt: currentMonth,
          },
        },
        _sum: { amount: true },
      });

      const currentRevenue = currentMonthRevenue._sum.amount || 0;
      const previousRevenue = lastMonthRevenue._sum.amount || 0;
      stats.revenueChangePercent =
        previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Calcular cambio en ocupación
      const currentOccupied = await db.property.count({
        where: {
          ownerId: user.id,
          contracts: {
            some: {
              status: 'ACTIVE',
              startDate: { lte: currentMonth },
            },
          },
        },
      });

      const lastMonthOccupied = await db.property.count({
        where: {
          ownerId: user.id,
          contracts: {
            some: {
              status: 'ACTIVE',
              startDate: { lte: lastMonth },
            },
          },
        },
      });

      stats.occupancyChangePercent =
        lastMonthOccupied > 0
          ? ((currentOccupied - lastMonthOccupied) / lastMonthOccupied) * 100
          : 0;

      // Calcular tasa de pago (pagos a tiempo vs total)
      const totalPaymentsCount = await db.payment.count({
        where: {
          contract: { ownerId: user.id },
          createdAt: { gte: startDate },
        },
      });

      const onTimePayments = await db.payment.count({
        where: {
          contract: { ownerId: user.id },
          status: 'PAID',
          paidDate: { not: null },
          createdAt: { gte: startDate },
        },
      });

      stats.paymentRate = totalPaymentsCount > 0 ? (onTimePayments / totalPaymentsCount) * 100 : 0;

      // Estructurar datos en formato overview
      stats.overview = {
        totalRevenue: stats.monthlyRevenue,
        occupancyRate: stats.occupancyRate,
        totalTenants: ownerContracts,
        totalProperties: ownerProperties,
        monthlyRevenue: stats.monthlyRevenue,
      };

      break;

    case 'BROKER':
      // Estadísticas del corredor
      const [
        brokerProperties,
        brokerContracts,
        brokerPayments,
        brokerRevenue,
        brokerCompletedTasks,
        brokerPendingTasks,
      ] = await Promise.all([
        db.property.count({ where: { brokerId: user.id } }),
        db.contract.count({ where: { brokerId: user.id, status: 'ACTIVE' } }),
        db.payment.count({
          where: {
            contract: { brokerId: user.id },
            status: 'PAID',
          },
        }),
        db.payment.aggregate({
          where: {
            contract: { brokerId: user.id },
            status: 'PAID',
            createdAt: { gte: startDate },
          },
          _sum: { amount: true },
        }),
        db.maintenance.count({
          where: {
            property: { brokerId: user.id },
            status: 'COMPLETED',
          },
        }),
        db.maintenance.count({
          where: {
            property: { brokerId: user.id },
            status: 'PENDING',
          },
        }),
      ]);

      stats.totalProperties = brokerProperties;
      stats.totalContracts = brokerContracts;
      stats.totalPayments = brokerPayments;
      stats.monthlyRevenue = brokerRevenue._sum.amount || 0;
      stats.completedTasks = brokerCompletedTasks;
      stats.pendingTasks = brokerPendingTasks;
      break;

    case 'TENANT':
      // Estadísticas del inquilino
      const [tenantContracts, tenantPayments, tenantCompletedTasks, tenantPendingTasks] =
        await Promise.all([
          db.contract.count({ where: { tenantId: user.id, status: 'ACTIVE' } }),
          db.payment.count({
            where: {
              contract: { tenantId: user.id },
              status: 'PAID',
            },
          }),
          db.maintenance.count({
            where: {
              requestedBy: user.id,
              status: 'COMPLETED',
            },
          }),
          db.maintenance.count({
            where: {
              requestedBy: user.id,
              status: 'PENDING',
            },
          }),
        ]);

      stats.totalContracts = tenantContracts;
      stats.totalPayments = tenantPayments;
      stats.completedTasks = tenantCompletedTasks;
      stats.pendingTasks = tenantPendingTasks;
      break;

    case 'RUNNER':
      // Estadísticas del runner
      const [runnerCompletedTasks, runnerPendingTasks, runnerTotalEarnings, runnerPendingPayments] =
        await Promise.all([
          db.maintenance.count({
            where: {
              assignedTo: user.id,
              status: 'COMPLETED',
            },
          }),
          db.maintenance.count({
            where: {
              assignedTo: user.id,
              status: 'PENDING',
            },
          }),
          db.payment.aggregate({
            where: {
              payerId: user.id,
              status: 'PAID',
            },
            _sum: { amount: true },
          }),
          db.payment.aggregate({
            where: {
              payerId: user.id,
              status: 'PENDING',
            },
            _sum: { amount: true },
          }),
        ]);

      stats.completedTasks = runnerCompletedTasks;
      stats.pendingTasks = runnerPendingTasks;
      stats.totalEarnings = runnerTotalEarnings._sum.amount || 0;
      stats.pendingPayments = runnerPendingPayments._sum.amount || 0;
      break;

    case 'PROVIDER':
    case 'MAINTENANCE':
      // Estadísticas del proveedor
      const [
        providerCompletedRequests,
        providerTotalEarnings,
        providerPendingPayments,
        providerAverageRating,
        providerTotalReviews,
      ] = await Promise.all([
        db.maintenance.count({
          where: {
            assignedTo: user.id,
            status: 'COMPLETED',
          },
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PAID',
          },
          _sum: { amount: true },
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PENDING',
          },
          _sum: { amount: true },
        }),
        db.serviceProvider.count({
          where: { userId: user.id },
        }),
        db.serviceProvider.count({
          where: { userId: user.id },
        }),
      ]);

      stats.completedRequests = providerCompletedRequests;
      stats.totalEarnings = providerTotalEarnings._sum.amount || 0;
      stats.pendingPayments = providerPendingPayments._sum.amount || 0;
      stats.averageRating = 4.5; // Valor por defecto
      stats.totalReviews = providerAverageRating || 0;
      break;

    default:
      // Estadísticas básicas para otros roles
      stats.totalUsers = 0;
      stats.totalProperties = 0;
      stats.totalContracts = 0;
      stats.totalPayments = 0;
      stats.monthlyRevenue = 0;
      break;
  }

  return stats;
}
