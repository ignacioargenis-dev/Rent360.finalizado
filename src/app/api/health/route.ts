import { NextRequest, NextResponse } from 'next/server';
import { db, checkDatabaseHealth } from '@/lib/db';
import { cacheManager } from '@/lib/cache-manager';
import { rateLimiter } from '@/lib/rate-limiter';
import { apiWrapper, getApiStats } from '@/lib/api-wrapper';

async function healthHandler(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verificar conexión a base de datos usando la función optimizada
    const dbHealth = await checkDatabaseHealth();
    const dbStatus = dbHealth.status;
    const dbResponseTime = dbHealth.responseTime;

    // Verificar estado del cache
    const cacheStats = await cacheManager.getStats();
    const cacheStatus = (cacheStats.memoryUsage || 0) < 100 * 1024 * 1024 ? 'healthy' : 'warning';

    // Verificar estado del rate limiter
    const rateLimitStats = rateLimiter.getStats();
    const rateLimitStatus = (rateLimitStats.memoryUsage || 0) < 50 * 1024 * 1024 ? 'healthy' : 'warning';

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
          memoryUsage: cacheStats.memoryUsage || 0,
          hitRate: cacheStats.hitRate || 0
        },
        rateLimiter: {
          status: rateLimitStatus,
          memoryUsage: rateLimitStats.memoryUsage || 0,
          activeKeys: rateLimitStats.activeKeys || 0
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

// Endpoint de debug para verificar archivos estáticos (simplificado para Edge Runtime)
async function debugHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'static') {
    // Información básica sobre el entorno
    const debugInfo = {
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      timestamp: new Date().toISOString(),
      error: null
    };

    return NextResponse.json(debugInfo);
  }

  return healthHandler(request);
}

export const GET = apiWrapper(
  { GET: debugHandler },
  {
    timeout: 10000,
    enableAudit: false
  }
);
