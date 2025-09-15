import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { dbOptimizer } from '@/lib/db-optimizer';
import { cacheManager } from '@/lib/cache-manager';
import { handleError } from '@/lib/errors';
import { logger } from '@/lib/logger-edge';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    const startTime = Date.now();

    // Obtener estadísticas de la base de datos
    const dbStats = await getDatabaseStats();
    
    // Obtener estadísticas de consultas optimizadas
    const queryStats = dbOptimizer.getQueryStats();
    
    // Obtener estadísticas de caché
    const cacheStats = cacheManager.getStats();
    
    // Generar recomendaciones de índices
    const indexRecommendations = await dbOptimizer.generateIndexRecommendations();
    
    // Obtener estadísticas de rendimiento
    const performanceStats = await getPerformanceStats();

    const duration = Date.now() - startTime;

    const stats = {
      timestamp: new Date().toISOString(),
      database: dbStats,
      queries: queryStats,
      cache: cacheStats,
      performance: performanceStats,
      recommendations: {
        indexes: indexRecommendations,
        cache: generateCacheRecommendations(cacheStats),
        queries: generateQueryRecommendations(queryStats),
      },
    };

    logger.info('Estadísticas de base de datos generadas', {
      adminId: user.id,
      duration,
      statsSummary: {
        totalTables: 15, // Tablas principales del sistema
        totalQueries: Object.keys(queryStats).length,
        cacheHitRate: cacheStats.hitRate,
      },
    });

    return NextResponse.json({
      success: true,
      data: stats,
    });

  } catch (error) {
    return handleError(error);
  }
}

// Obtener estadísticas de la base de datos
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

    // Obtener estadísticas de propiedades por tipo
    const propertiesByType = await db.property.groupBy({
      by: ['type'],
      _count: {
        type: true,
      },
    });

    // Obtener estadísticas de propiedades por estado
    const propertiesByStatus = await db.property.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Obtener estadísticas de pagos por método
    const paymentsByMethod = await db.payment.groupBy({
      by: ['method'],
      _count: {
        method: true,
      },
    });

    // Obtener estadísticas de pagos por estado
    const paymentsByStatus = await db.payment.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Obtener estadísticas de logs por nivel
    const logsByLevel = await db.systemLog.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
    });

    // Calcular tamaños aproximados de tablas
    const tableSizes = {
      users: totalUsers * 1024, // Estimación aproximada
      properties: totalProperties * 2048,
      contracts: totalContracts * 1536,
      payments: totalPayments * 1024,
      maintenance: totalMaintenance * 1024,
      notifications: totalNotifications * 512,
      logs: totalLogs * 256,
    };

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
      byType: {
        properties: propertiesByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {} as Record<string, number>),
        payments: paymentsByMethod.reduce((acc, item) => {
          if (item.method) {
            acc[item.method] = item._count.method;
          }
          return acc;
        }, {} as Record<string, number>),
      },
      byStatus: {
        properties: propertiesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
        payments: paymentsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as Record<string, number>),
      },
      logsByLevel: logsByLevel.reduce((acc, item) => {
        acc[item.level] = item._count.level;
        return acc;
      }, {} as Record<string, number>),
      tableSizes,
      totalSize: Object.values(tableSizes).reduce((sum, size) => sum + size, 0),
    };
  } catch (error) {
    logger.error('Error obteniendo estadísticas de base de datos', { error: error instanceof Error ? error.message : String(error) });
    return {
      counts: {},
      active: {},
      byRole: {},
      byType: {},
      byStatus: {},
      logsByLevel: {},
      tableSizes: {},
      totalSize: 0,
      error: 'Error obteniendo estadísticas de base de datos',
    };
  }
}

// Obtener estadísticas de rendimiento
async function getPerformanceStats() {
  try {
    // Obtener consultas más lentas recientes
    const recentSlowQueries = await db.systemLog.findMany({
      where: {
        level: 'WARN',
        message: {
          contains: 'slow query',
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Obtener errores de base de datos recientes
    const recentDbErrors = await db.systemLog.findMany({
      where: {
        level: 'ERROR',
        message: {
          contains: 'database',
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Calcular métricas de rendimiento
    const performanceMetrics = {
      slowQueries24h: recentSlowQueries.length,
      dbErrors24h: recentDbErrors.length,
      avgQueryTime: calculateAverageQueryTime(),
      peakUsageTime: await calculatePeakUsageTime(),
      connectionPool: {
        active: Math.floor(Math.random() * 10) + 5, // Simulado
        max: 20,
        utilization: Math.floor(Math.random() * 30) + 20, // Simulado
      },
    };

    return performanceMetrics;
  } catch (error) {
    logger.error('Error obteniendo estadísticas de rendimiento', { error: error instanceof Error ? error.message : String(error) });
    return {
      slowQueries24h: 0,
      dbErrors24h: 0,
      avgQueryTime: 0,
      peakUsageTime: null,
      connectionPool: {
        active: 0,
        max: 0,
        utilization: 0,
      },
    };
  }
}

// Calcular tiempo promedio de consulta (simulado)
function calculateAverageQueryTime() {
  return Math.floor(Math.random() * 50) + 10; // 10-60ms
}

// Calcular hora de mayor uso (simulado)
async function calculatePeakUsageTime() {
  const usageStats = await db.systemLog.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
    _count: {
      id: true,
    },
  });

  if (usageStats.length === 0) {
return null;
}

  const peakHour = usageStats.reduce((peak, current) => 
    current._count.id > peak._count.id ? current : peak,
  );

  return peakHour.createdAt;
}

// Generar recomendaciones de caché
function generateCacheRecommendations(cacheStats: any) {
  const recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }> = [];

  if (cacheStats.hitRate < 50) {
    recommendations.push({
      type: 'warning',
      message: 'La tasa de aciertos del caché es baja. Considerar aumentar el TTL o agregar más datos al caché.',
      priority: 'high',
    });
  }

  if (cacheStats.size > 1000) {
    recommendations.push({
      type: 'info',
      message: 'El caché tiene muchas entradas. Considerar limpiar entradas antiguas.',
      priority: 'medium',
    });
  }

  if (cacheStats.memoryUsage > 50 * 1024 * 1024) { // 50MB
    recommendations.push({
      type: 'warning',
      message: 'El caché está usando mucha memoria. Considerar reducir el tamaño máximo.',
      priority: 'high',
    });
  }

  return recommendations;
}

// Generar recomendaciones de consultas
function generateQueryRecommendations(queryStats: any) {
  const recommendations: Array<{
    type: string;
    message: string;
    priority: string;
    queryType?: string;
    avgTime?: number;
    count?: number;
  }> = [];

  const slowQueries = Object.entries(queryStats)
    .filter(([_, stats]: [string, any]) => stats.avgTime > 100)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.avgTime - a.avgTime);

  for (const [queryType, stats] of slowQueries) {
    const typedStats = stats as { avgTime: number; count: number };
    recommendations.push({
      type: 'warning',
      message: `La consulta '${queryType}' es lenta (${Math.round(typedStats.avgTime)}ms promedio). Considerar optimizar o agregar índices.`,
      priority: 'high',
      queryType,
      avgTime: typedStats.avgTime,
      count: typedStats.count,
    });
  }

  const frequentQueries = Object.entries(queryStats)
    .filter(([_, stats]: [string, any]) => stats.count > 100)
    .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.count - a.count);

  for (const [queryType, stats] of frequentQueries) {
    const typedStats = stats as { count: number };
    recommendations.push({
      type: 'info',
      message: `La consulta '${queryType}' se ejecuta frecuentemente (${typedStats.count} veces). Considerar agregar al caché.`,
      priority: 'medium',
      queryType,
      count: typedStats.count,
    });
  }

  return recommendations;
}

// Limpiar estadísticas
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 },
      );
    }

    // Limpiar estadísticas de consultas
    dbOptimizer.clearQueryStats();
    
    // Limpiar caché
    await cacheManager.clear();

    logger.info('Estadísticas de base de datos limpiadas', { adminId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Estadísticas limpiadas exitosamente',
    });

  } catch (error) {
    return handleError(error);
  }
}
