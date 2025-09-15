import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-edge';
import { cacheManager } from '@/lib/cache-manager';
import { rateLimiter } from '@/lib/rate-limiter';
import { apiWrapper, getApiStats } from '@/lib/api-wrapper';

async function healthHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar conexión a base de datos
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    
    try {
      const dbStart = Date.now();
      await db.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'unhealthy';
      logger.error('Database health check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // Verificar estado del cache
    const cacheStats = await cacheManager.getStats();
    const cacheStatus = cacheStats.memoryUsage < 100 * 1024 * 1024 ? 'healthy' : 'warning';

    // Verificar estado del rate limiter
    const rateLimitStats = rateLimiter.getStats();
    const rateLimitStatus = rateLimitStats.memoryUsage < 50 * 1024 * 1024 ? 'healthy' : 'warning';

    // Verificar uso de memoria del sistema
    const memoryUsage = process.memoryUsage();
    const memoryStatus = memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning';

    // Obtener estadísticas de la API
    const apiStats = getApiStats();

    // Calcular tiempo total de respuesta
    const totalResponseTime = Date.now() - startTime;

    // Determinar estado general del sistema
    const overallStatus = [dbStatus, cacheStatus, rateLimitStatus, memoryStatus].every(status => status === 'healthy')
      ? 'healthy'
      : 'degraded';

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: totalResponseTime,
      services: {
        database: {
          status: dbStatus,
          responseTime: dbResponseTime
        },
        cache: {
          status: cacheStatus,
          memoryUsage: cacheStats.memoryUsage,
          hitRate: cacheStats.hitRate
        },
        rateLimiter: {
          status: rateLimitStatus,
          memoryUsage: rateLimitStats.memoryUsage,
          activeKeys: rateLimitStats.activeKeys
        },
        system: {
          status: memoryStatus,
          memoryUsage: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024),
            rss: Math.round(memoryUsage.rss / 1024 / 1024)
          },
          uptime: process.uptime()
        }
      },
      performance: {
        api: apiStats,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        }
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    // Log del health check
    logger.info('Health check completed', {
      context: 'health.check',
      status: overallStatus,
      responseTime: totalResponseTime,
      dbStatus,
      cacheStatus,
      rateLimitStatus,
      memoryStatus
    });

    // Retornar respuesta con código de estado apropiado
    const statusCode = overallStatus === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    logger.error('Health check failed', {
      context: 'health.check',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    throw error; // Re-throw para que el wrapper maneje el error
  }
}

export const GET = apiWrapper(
  { GET: healthHandler },
  {
    timeout: 10000, // 10 segundos timeout para health checks
    enableAudit: false // No auditar health checks
  }
);
