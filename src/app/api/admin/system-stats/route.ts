import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { rateLimiter } from '@/lib/rate-limiter';
import { cacheManager } from '@/lib/cache-manager';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de admin
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    // Obtener estadísticas de logging desde el logger
    const logStats = logger.getLogStats();

    // Obtener estadísticas de rate limiting
    const rateLimitStats = rateLimiter.getStats();

    // Obtener estadísticas de caché
    const cacheStats = await cacheManager.getStats();

    // Obtener estadísticas de base de datos
    const dbStats = await getDatabaseStats();

    // Obtener estadísticas del sistema
    const systemStats = getSystemStats();

    // Obtener logs recientes (últimas 24 horas)
    const recentLogs = await getRecentLogs();

    const stats = {
      timestamp: new Date().toISOString(),
      logging: logStats,
      rateLimiting: rateLimitStats,
      cache: cacheStats,
      database: dbStats,
      system: systemStats,
      recentLogs: recentLogs,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    return handleApiError(error);
  }
}

// Obtener estadísticas de base de datos
async function getDatabaseStats() {
  try {
    const [
      totalUsers,
      totalProperties,
      totalContracts,
      totalPayments,
      totalMaintenance,
      totalServiceJobs,
      totalNotifications,
      totalLogs,
    ] = await Promise.all([
      db.user.count(),
      db.property.count(),
      db.contract.count(),
      db.payment.count(),
      db.maintenance.count(),
      db.serviceJob.count(),
      db.notification.count(),
      db.systemLog.count(),
    ]);

    // Obtener estadísticas por estado
    const [
      activeUsers,
      availableProperties,
      activeContracts,
      pendingPayments,
      pendingMaintenance,
      pendingServiceJobs,
      unreadNotifications,
    ] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.property.count({ where: { status: 'AVAILABLE' } }),
      db.contract.count({ where: { status: 'ACTIVE' } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.maintenance.count({ where: { status: 'OPEN' } }),
      db.serviceJob.count({ where: { status: 'PENDING' } }),
      db.notification.count({ where: { isRead: false } }),
    ]);

    // Obtener estadísticas de usuarios por rol
    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // Obtener estadísticas de logs por nivel
    const logsByLevel = await db.systemLog.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
    });

    return {
      counts: {
        totalUsers,
        totalProperties,
        totalContracts,
        totalPayments,
        totalMaintenance,
        totalServiceJobs,
        totalNotifications,
        totalLogs,
      },
      active: {
        activeUsers,
        availableProperties,
        activeContracts,
        pendingPayments,
        pendingMaintenance,
        pendingServiceJobs,
        unreadNotifications,
      },
      byRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
      logsByLevel: logsByLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    logger.error('Error getting database stats', { error: error instanceof Error ? error.message : String(error) });
    return {
      counts: {},
      active: {},
      byRole: {},
      logsByLevel: {},
      error: 'Error obteniendo estadísticas de base de datos',
    };
  }
}

// Obtener estadísticas del sistema
function getSystemStats() {
  const os = require('os');
  
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: process.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      process: process.memoryUsage(),
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
    },
    environment: process.env.NODE_ENV,
    pid: process.pid,
  };
}

// Obtener logs recientes
async function getRecentLogs() {
  try {
    const logs = await db.systemLog.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        level: true,
        message: true,
        requestId: true,
        userId: true,
        ip: true,
        path: true,
        method: true,
        duration: true,
        createdAt: true,
      },
    });

    return logs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    }));
  } catch (error) {
    logger.error('Error getting recent logs', { error: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

// Endpoint para limpiar logs antiguos
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación y rol de admin
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Eliminar logs más antiguos que el número de días especificado
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const deletedCount = await db.systemLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info('Logs antiguos eliminados', { 
      deletedCount: deletedCount.count,
      cutoffDate: cutoffDate.toISOString(),
      requestedBy: user.id, 
    });

    return NextResponse.json({
      success: true,
      message: `${deletedCount.count} logs eliminados`,
      deletedCount: deletedCount.count,
    });

  } catch (error) {
    return handleApiError(error);
  }
}
