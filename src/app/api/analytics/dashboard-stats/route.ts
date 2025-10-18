import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Verificar permisos según el rol
    const allowedRoles = ['ADMIN', 'OWNER', 'BROKER', 'TENANT', 'RUNNER', 'PROVIDER', 'MAINTENANCE'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Permisos insuficientes.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const role = user.role;

    // Calcular fechas según el período
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

    let analytics = {};

    // Estadísticas específicas por rol
    switch (role) {
      case 'ADMIN':
        analytics = await getAdminAnalytics(startDate, now);
        break;
      case 'OWNER':
        analytics = await getOwnerAnalytics(user.id, startDate, now);
        break;
      case 'BROKER':
        analytics = await getBrokerAnalytics(user.id, startDate, now);
        break;
      case 'TENANT':
        analytics = await getTenantAnalytics(user.id, startDate, now);
        break;
      case 'RUNNER':
        analytics = await getRunnerAnalytics(user.id, startDate, now);
        break;
      case 'PROVIDER':
      case 'MAINTENANCE':
        analytics = await getProviderAnalytics(user.id, startDate, now);
        break;
    }

    logger.info('Estadísticas de analytics obtenidas', {
      userId: user.id,
      role,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

    return NextResponse.json({
      success: true,
      data: {
        period,
        role,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        ...analytics
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de analytics:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

// Funciones auxiliares para cada rol
async function getAdminAnalytics(startDate: Date, endDate: Date) {
  const [
    totalUsers,
    totalProperties,
    totalContracts,
    totalPayments,
    monthlyRevenue,
    activeUsers,
    newUsers,
    propertiesByStatus,
    contractsByStatus,
    paymentsByStatus
  ] = await Promise.all([
    db.user.count(),
    db.property.count(),
    db.contract.count(),
    db.payment.count(),
    db.payment.aggregate({
      where: {
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    }),
    db.user.count({
      where: {
        lastLogin: {
          gte: startDate
        }
      }
    }),
    db.user.count({
      where: {
        createdAt: {
          gte: startDate
        }
      }
    }),
    db.property.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    db.contract.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    db.payment.groupBy({
      by: ['status'],
      _count: { status: true }
    })
  ]);

  return {
    overview: {
      totalUsers,
      totalProperties,
      totalContracts,
      totalPayments,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      activeUsers,
      newUsers
    },
    breakdown: {
      propertiesByStatus,
      contractsByStatus,
      paymentsByStatus
    }
  };
}

async function getOwnerAnalytics(ownerId: string, startDate: Date, endDate: Date) {
  const [
    totalProperties,
    activeContracts,
    totalRevenue,
    pendingPayments,
    maintenanceRequests,
    propertiesByStatus
  ] = await Promise.all([
    db.property.count({
      where: { ownerId }
    }),
    db.contract.count({
      where: {
        ownerId,
        status: 'ACTIVE'
      }
    }),
    db.payment.aggregate({
      where: {
        contract: { ownerId },
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    }),
    db.payment.count({
      where: {
        contract: { ownerId },
        status: 'PENDING'
      }
    }),
    db.maintenanceRequest.count({
      where: {
        property: { ownerId },
        createdAt: {
          gte: startDate
        }
      }
    }),
    db.property.groupBy({
      by: ['status'],
      where: { ownerId },
      _count: { status: true }
    })
  ]);

  return {
    overview: {
      totalProperties,
      activeContracts,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments,
      maintenanceRequests
    },
    breakdown: {
      propertiesByStatus
    }
  };
}

async function getBrokerAnalytics(brokerId: string, startDate: Date, endDate: Date) {
  const [
    totalProperties,
    activeContracts,
    totalCommissions,
    newClients,
    propertiesByStatus
  ] = await Promise.all([
    db.property.count({
      where: { brokerId }
    }),
    db.contract.count({
      where: {
        brokerId,
        status: 'ACTIVE'
      }
    }),
    db.payment.aggregate({
      where: {
        contract: { brokerId },
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    }),
    db.user.count({
      where: {
        contracts: {
          some: {
            brokerId,
            createdAt: {
              gte: startDate
            }
          }
        }
      }
    }),
    db.property.groupBy({
      by: ['status'],
      where: { brokerId },
      _count: { status: true }
    })
  ]);

  return {
    overview: {
      totalProperties,
      activeContracts,
      totalCommissions: totalCommissions._sum.amount || 0,
      newClients
    },
    breakdown: {
      propertiesByStatus
    }
  };
}

async function getTenantAnalytics(tenantId: string, startDate: Date, endDate: Date) {
  const [
    activeContracts,
    totalPaid,
    pendingPayments,
    overduePayments,
    maintenanceRequests
  ] = await Promise.all([
    db.contract.count({
      where: {
        tenantId,
        status: 'ACTIVE'
      }
    }),
    db.payment.aggregate({
      where: {
        contract: { tenantId },
        status: 'PAID',
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: { amount: true }
    }),
    db.payment.count({
      where: {
        contract: { tenantId },
        status: 'PENDING',
        dueDate: {
          gte: new Date()
        }
      }
    }),
    db.payment.count({
      where: {
        contract: { tenantId },
        status: 'PENDING',
        dueDate: {
          lt: new Date()
        }
      }
    }),
    db.maintenanceRequest.count({
      where: {
        tenantId,
        createdAt: {
          gte: startDate
        }
      }
    })
  ]);

  return {
    overview: {
      activeContracts,
      totalPaid: totalPaid._sum.amount || 0,
      pendingPayments,
      overduePayments,
      maintenanceRequests
    }
  };
}

async function getRunnerAnalytics(runnerId: string, startDate: Date, endDate: Date) {
  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    totalEarnings
  ] = await Promise.all([
    db.task.count({
      where: { assignedTo: runnerId }
    }),
    db.task.count({
      where: {
        assignedTo: runnerId,
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    db.task.count({
      where: {
        assignedTo: runnerId,
        status: 'PENDING'
      }
    }),
    db.payment.aggregate({
      where: {
        contract: {
          tasks: {
            some: {
              assignedTo: runnerId,
              status: 'COMPLETED',
              updatedAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        },
        status: 'PAID'
      },
      _sum: { amount: true }
    })
  ]);

  return {
    overview: {
      totalTasks,
      completedTasks,
      pendingTasks,
      totalEarnings: totalEarnings._sum.amount || 0
    }
  };
}

async function getProviderAnalytics(providerId: string, startDate: Date, endDate: Date) {
  const [
    totalServices,
    activeServices,
    totalRequests,
    completedRequests,
    totalEarnings
  ] = await Promise.all([
    db.service.count({
      where: { providerId }
    }),
    db.service.count({
      where: {
        providerId,
        isActive: true
      }
    }),
    db.maintenanceRequest.count({
      where: { assignedProviderId: providerId }
    }),
    db.maintenanceRequest.count({
      where: {
        assignedProviderId: providerId,
        status: 'COMPLETED',
        updatedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    }),
    db.payment.aggregate({
      where: {
        contract: {
          maintenanceRequests: {
            some: {
              assignedProviderId: providerId,
              status: 'COMPLETED',
              updatedAt: {
                gte: startDate,
                lte: endDate
              }
            }
          }
        },
        status: 'PAID'
      },
      _sum: { amount: true }
    })
  ]);

  return {
    overview: {
      totalServices,
      activeServices,
      totalRequests,
      completedRequests,
      totalEarnings: totalEarnings._sum.amount || 0
    }
  };
}
