import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = await requireAuth(request);

    logger.info('GET /api/sidebar/stats - Obteniendo estadísticas del sidebar', {
      userId: user.id,
      userRole: user.role,
    });

    // Obtener estadísticas según el rol del usuario
    let stats = {};

    switch (user.role) {
      case 'ADMIN':
        stats = await getAdminStats();
        break;
      case 'OWNER':
        stats = await getOwnerStats(user.id);
        break;
      case 'TENANT':
        stats = await getTenantStats(user.id);
        break;
      case 'BROKER':
        stats = await getBrokerStats(user.id);
        break;
      case 'RUNNER':
        stats = await getRunnerStats(user.id);
        break;
      case 'PROVIDER':
      case 'MAINTENANCE':
        stats = await getProviderStats(user.id);
        break;
      case 'SUPPORT':
        stats = await getSupportStats();
        break;
      default:
        stats = {};
    }

    logger.info('Estadísticas del sidebar obtenidas', {
      userId: user.id,
      userRole: user.role,
      stats,
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas del sidebar:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error obteniendo estadísticas del sidebar',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Estadísticas para ADMIN
async function getAdminStats() {
  const [
    totalUsers,
    pendingTickets,
    legalCases,
    warrantyDisputes,
    pendingProperties,
    pendingContracts,
    pendingPayments,
  ] = await Promise.all([
    db.user.count(),
    db.ticket.count({ where: { status: 'OPEN' } }),
    db.legalCase.count({ where: { status: 'ACTIVE' } }),
    db.warrantyDispute.count({ where: { status: 'PENDING' } }),
    db.property.count({ where: { status: 'PENDING' } }),
    db.contract.count({ where: { status: 'PENDING' } }),
    db.payment.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalUsers,
    pendingTickets,
    legalCases,
    warrantyDisputes,
    pendingProperties,
    pendingContracts,
    pendingPayments,
  };
}

// Estadísticas para OWNER
async function getOwnerStats(userId: string) {
  const [totalProperties, activeContracts, pendingPayments, maintenanceRequests] =
    await Promise.all([
      db.property.count({ where: { ownerId: userId } }),
      db.contract.count({
        where: {
          property: { ownerId: userId },
          status: 'ACTIVE',
        },
      }),
      db.payment.count({
        where: {
          contract: { property: { ownerId: userId } },
          status: 'PENDING',
        },
      }),
      db.maintenance.count({
        where: {
          property: { ownerId: userId },
          status: 'PENDING',
        },
      }),
    ]);

  return {
    totalProperties,
    activeContracts,
    pendingPayments,
    maintenanceRequests,
  };
}

// Estadísticas para TENANT
async function getTenantStats(userId: string) {
  const [activeContracts, pendingPayments, maintenanceRequests] = await Promise.all([
    db.contract.count({
      where: {
        tenantId: userId,
        status: 'ACTIVE',
      },
    }),
    db.payment.count({
      where: {
        contract: { tenantId: userId },
        status: 'PENDING',
      },
    }),
    db.maintenance.count({
      where: {
        requestedBy: userId,
        status: 'PENDING',
      },
    }),
  ]);

  return {
    activeContracts,
    pendingPayments,
    maintenanceRequests,
  };
}

// Estadísticas para BROKER
async function getBrokerStats(userId: string) {
  const [totalClients, activeContracts, pendingAppointments] = await Promise.all([
    db.user.count({
      where: {
        brokerId: userId,
        isActive: true,
      },
    }),
    db.contract.count({
      where: {
        brokerId: userId,
        status: 'ACTIVE',
      },
    }),
    db.appointment.count({
      where: {
        brokerId: userId,
        status: 'PENDING',
      },
    }),
  ]);

  return {
    totalClients,
    activeContracts,
    pendingAppointments,
  };
}

// Estadísticas para RUNNER
async function getRunnerStats(userId: string) {
  const [assignedTasks, completedTasks, pendingTasks] = await Promise.all([
    db.maintenance.count({
      where: {
        assignedTo: userId,
      },
    }),
    db.maintenance.count({
      where: {
        assignedTo: userId,
        status: 'COMPLETED',
      },
    }),
    db.maintenance.count({
      where: {
        assignedTo: userId,
        status: 'PENDING',
      },
    }),
  ]);

  return {
    assignedTasks,
    completedTasks,
    pendingTasks,
  };
}

// Estadísticas para PROVIDER/MAINTENANCE
async function getProviderStats(userId: string) {
  const [totalServices, activeRequests, completedRequests] = await Promise.all([
    db.serviceJob.count({
      where: {
        serviceProviderId: userId,
      },
    }),
    db.maintenance.count({
      where: {
        assignedTo: userId,
        status: 'IN_PROGRESS',
      },
    }),
    db.maintenance.count({
      where: {
        assignedTo: userId,
        status: 'COMPLETED',
      },
    }),
  ]);

  return {
    totalServices,
    activeRequests,
    completedRequests,
  };
}

// Estadísticas para SUPPORT
async function getSupportStats() {
  const [pendingTickets, activeTickets, resolvedTickets] = await Promise.all([
    db.ticket.count({ where: { status: 'OPEN' } }),
    db.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    db.ticket.count({ where: { status: 'RESOLVED' } }),
  ]);

  return {
    pendingTickets,
    activeTickets,
    resolvedTickets,
  };
}
