import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { withCache, getStatsCacheKey, cacheTTL } from '@/lib/cache';

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
      cached: true
    });

    return NextResponse.json({
      success: true,
      data: statsData,
      cached: true
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas:', {
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
        pendingTickets
      ] = await Promise.all([
        db.user.count(),
        db.property.count(),
        db.contract.count({ where: { status: 'ACTIVE' } }),
        db.payment.count({ where: { status: 'PAID' } }),
        db.payment.aggregate({
          where: {
            status: 'PAID',
            createdAt: { gte: startDate }
          },
          _sum: { amount: true }
        }),
        db.user.count({ where: { isActive: true } }),
        db.user.count({ where: { createdAt: { gte: startDate } } }),
        db.ticket.count({ where: { status: 'OPEN' } })
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
        ownerPendingTasks
      ] = await Promise.all([
        db.property.count({ where: { ownerId: user.id } }),
        db.contract.count({ where: { ownerId: user.id, status: 'ACTIVE' } }),
        db.payment.count({ 
          where: { 
            contract: { ownerId: user.id },
            status: 'PAID'
          } 
        }),
        db.payment.aggregate({
          where: {
            contract: { ownerId: user.id },
            status: 'PAID',
            createdAt: { gte: startDate }
          },
          _sum: { amount: true }
        }),
        db.maintenance.count({ 
          where: { 
            property: { ownerId: user.id },
            status: 'COMPLETED'
          } 
        }),
        db.maintenance.count({ 
          where: { 
            property: { ownerId: user.id },
            status: 'PENDING'
          } 
        })
      ]);

      stats.totalProperties = ownerProperties;
      stats.totalContracts = ownerContracts;
      stats.totalPayments = ownerPayments;
      stats.monthlyRevenue = ownerRevenue._sum.amount || 0;
      stats.completedTasks = ownerCompletedTasks;
      stats.pendingTasks = ownerPendingTasks;
      break;

    case 'BROKER':
      // Estadísticas del corredor
      const [
        brokerProperties,
        brokerContracts,
        brokerPayments,
        brokerRevenue,
        brokerCompletedTasks,
        brokerPendingTasks
      ] = await Promise.all([
        db.property.count({ where: { brokerId: user.id } }),
        db.contract.count({ where: { brokerId: user.id, status: 'ACTIVE' } }),
        db.payment.count({ 
          where: { 
            contract: { brokerId: user.id },
            status: 'PAID'
          } 
        }),
        db.payment.aggregate({
          where: {
            contract: { brokerId: user.id },
            status: 'PAID',
            createdAt: { gte: startDate }
          },
          _sum: { amount: true }
        }),
        db.maintenance.count({ 
          where: { 
            property: { brokerId: user.id },
            status: 'COMPLETED'
          } 
        }),
        db.maintenance.count({ 
          where: { 
            property: { brokerId: user.id },
            status: 'PENDING'
          } 
        })
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
      const [
        tenantContracts,
        tenantPayments,
        tenantCompletedTasks,
        tenantPendingTasks
      ] = await Promise.all([
        db.contract.count({ where: { tenantId: user.id, status: 'ACTIVE' } }),
        db.payment.count({ 
          where: { 
            contract: { tenantId: user.id },
            status: 'PAID'
          } 
        }),
        db.maintenance.count({ 
          where: { 
            requestedBy: user.id,
            status: 'COMPLETED'
          } 
        }),
        db.maintenance.count({ 
          where: { 
            requestedBy: user.id,
            status: 'PENDING'
          } 
        })
      ]);

      stats.totalContracts = tenantContracts;
      stats.totalPayments = tenantPayments;
      stats.completedTasks = tenantCompletedTasks;
      stats.pendingTasks = tenantPendingTasks;
      break;

    case 'RUNNER':
      // Estadísticas del runner
      const [
        runnerCompletedTasks,
        runnerPendingTasks,
        runnerTotalEarnings,
        runnerPendingPayments
      ] = await Promise.all([
        db.maintenance.count({ 
          where: { 
            assignedTo: user.id,
            status: 'COMPLETED'
          } 
        }),
        db.maintenance.count({ 
          where: { 
            assignedTo: user.id,
            status: 'PENDING'
          } 
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PAID'
          },
          _sum: { amount: true }
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PENDING'
          },
          _sum: { amount: true }
        })
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
        providerTotalReviews
      ] = await Promise.all([
        db.maintenance.count({ 
          where: { 
            assignedTo: user.id,
            status: 'COMPLETED'
          } 
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PAID'
          },
          _sum: { amount: true }
        }),
        db.payment.aggregate({
          where: {
            payerId: user.id,
            status: 'PENDING'
          },
          _sum: { amount: true }
        }),
        db.serviceProvider.count({
          where: { userId: user.id }
        }),
        db.serviceProvider.count({
          where: { userId: user.id }
        })
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