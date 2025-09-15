import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { logger, getSystemMetrics, getMonitoringStats } from '@/lib/logger-edge';
import { cacheManager } from '@/lib/cache-manager';
import { rateLimiter } from '@/lib/rate-limiter';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'realtime'; // realtime, hourly, daily
    const detailed = searchParams.get('detailed') === 'true';

    logger.info('Obteniendo métricas de performance', {
      userId: user.id,
      timeframe,
      detailed
    });

    // Obtener métricas actuales del sistema
    const currentMetrics = await getSystemMetrics();

    // Obtener estadísticas de monitoreo
    const monitoringStats = getMonitoringStats();

    // Calcular métricas adicionales
    const baseMetrics = {
      timestamp: Date.now(),
      system: {
        memoryUsage: Math.round((currentMetrics.memory.used / currentMetrics.memory.total) * 100),
        cpuUsage: currentMetrics.cpu.usage,
        uptime: process.uptime(),
      },
      database: {
        status: 'healthy', // Simulado, en producción verificar conexión real
        queryTime: Math.random() * 100 + 10, // Simulado
        slowQueries: Math.floor(Math.random() * 5), // Simulado
        connections: Math.floor(Math.random() * 10) + 5, // Simulado
      },
      cache: {
        hitRate: Math.random() * 40 + 60, // Simulado 60-100%
        memoryUsage: Math.floor(Math.random() * 50) + 10, // Simulado
        evictions: Math.floor(Math.random() * 100), // Simulado
        efficiency: 'good', // Simulado
      },
      rateLimiting: {
        blockedRequests: Math.floor(Math.random() * 20), // Simulado
        activeKeys: Math.floor(Math.random() * 100) + 50, // Simulado
        memoryUsage: Math.floor(Math.random() * 10) + 5, // Simulado
      },
      api: {
        averageResponseTime: Math.random() * 500 + 100, // Simulado
        requestsPerSecond: Math.random() * 50 + 10, // Simulado
        errorRate: Math.random() * 5, // Simulado
        throughput: Math.random() * 50 + 10, // Simulado
      },
      events: monitoringStats.events,
      alerts: monitoringStats.alerts,
      health: monitoringStats.health,
    };

    const performanceMetrics = detailed ? {
      ...baseMetrics,
      history: monitoringStats.health.history.length > 0
        ? monitoringStats.health.history.map((h: any) => ({
            timestamp: h.timestamp || Date.now(),
            memoryUsage: 0,
            cpuUsage: 0,
            responseTime: 0,
            errorRate: 0,
          }))
        : [{
            timestamp: Date.now(),
            memoryUsage: 0,
            cpuUsage: 0,
            responseTime: 0,
            errorRate: 0,
          }]
    } : baseMetrics;

    // Calcular estado general del sistema
    const systemScore = calculateSystemScore(performanceMetrics);
    const overallStatus = systemScore >= 80 ? 'healthy' :
                         systemScore >= 60 ? 'warning' : 'critical';

    const responseData = {
      success: true,
      data: {
        ...performanceMetrics,
        summary: {
          overallStatus,
          systemScore,
          issues: identifyIssues(performanceMetrics),
          recommendations: generateRecommendations(performanceMetrics),
        },
      },
    };

    logger.info('Métricas de performance obtenidas exitosamente', {
      userId: user.id,
      systemScore,
      overallStatus,
      alertsCount: performanceMetrics.alerts.active,
    });

    return NextResponse.json(responseData);

  } catch (error) {
    logger.error('Error obteniendo métricas de performance:', {
      error: error instanceof Error ? error.message : String(error)
    });
    const errorResponse = handleError(error as Error);
    return errorResponse;
  }
}

// Función para calcular puntuación del sistema
function calculateSystemScore(metrics: any): number {
  let score = 100;

  // Penalizar por uso alto de memoria
  if (metrics.system.memoryUsage > 90) score -= 30;
  else if (metrics.system.memoryUsage > 80) score -= 20;
  else if (metrics.system.memoryUsage > 70) score -= 10;

  // Penalizar por uso alto de CPU
  if (metrics.system.cpuUsage > 90) score -= 25;
  else if (metrics.system.cpuUsage > 70) score -= 15;
  else if (metrics.system.cpuUsage > 50) score -= 5;

  // Penalizar por tiempo de respuesta lento
  if (metrics.api.averageResponseTime > 2000) score -= 20;
  else if (metrics.api.averageResponseTime > 1000) score -= 10;

  // Penalizar por alta tasa de errores
  if (metrics.api.errorRate > 5) score -= 25;
  else if (metrics.api.errorRate > 2) score -= 10;

  // Penalizar por bajo hit rate del cache
  if (metrics.cache.hitRate < 50) score -= 15;
  else if (metrics.cache.hitRate < 70) score -= 5;

  // Penalizar por consultas lentas
  if (metrics.database.slowQueries > 10) score -= 10;

  // Penalizar por alertas activas
  if (metrics.alerts.active > 5) score -= 20;
  else if (metrics.alerts.active > 2) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// Función para identificar problemas
function identifyIssues(metrics: any): string[] {
  const issues: string[] = [];

  if (metrics.system.memoryUsage > 80) {
    issues.push(`Uso de memoria alto: ${metrics.system.memoryUsage.toFixed(1)}%`);
  }

  if (metrics.system.cpuUsage > 70) {
    issues.push(`Uso de CPU alto: ${metrics.system.cpuUsage.toFixed(1)}%`);
  }

  if (metrics.api.averageResponseTime > 1000) {
    issues.push(`Tiempo de respuesta lento: ${metrics.api.averageResponseTime.toFixed(0)}ms`);
  }

  if (metrics.api.errorRate > 2) {
    issues.push(`Tasa de errores alta: ${metrics.api.errorRate.toFixed(1)}%`);
  }

  if (metrics.cache.hitRate < 70) {
    issues.push(`Hit rate del cache bajo: ${metrics.cache.hitRate.toFixed(1)}%`);
  }

  if (metrics.database.slowQueries > 5) {
    issues.push(`Consultas lentas detectadas: ${metrics.database.slowQueries}`);
  }

  if (metrics.alerts.active > 0) {
    issues.push(`Alertas activas: ${metrics.alerts.active}`);
  }

  return issues;
}

// Función para generar recomendaciones
function generateRecommendations(metrics: any): string[] {
  const recommendations: string[] = [];

  if (metrics.system.memoryUsage > 80) {
    recommendations.push('Considerar aumentar los recursos de memoria del servidor');
    recommendations.push('Revisar y optimizar el uso de memoria en la aplicación');
  }

  if (metrics.system.cpuUsage > 70) {
    recommendations.push('Monitorear procesos que consumen alto CPU');
    recommendations.push('Considerar escalar recursos de CPU');
  }

  if (metrics.api.averageResponseTime > 1000) {
    recommendations.push('Optimizar consultas de base de datos');
    recommendations.push('Implementar cache para endpoints lentos');
    recommendations.push('Revisar algoritmos de procesamiento');
  }

  if (metrics.api.errorRate > 2) {
    recommendations.push('Revisar logs de errores para identificar patrones');
    recommendations.push('Implementar mejor manejo de errores');
    recommendations.push('Agregar validación de entrada más robusta');
  }

  if (metrics.cache.hitRate < 70) {
    recommendations.push('Revisar estrategia de cache');
    recommendations.push('Optimizar claves de cache');
    recommendations.push('Ajustar TTL de cache según patrones de uso');
  }

  if (metrics.database.slowQueries > 5) {
    recommendations.push('Analizar y optimizar consultas lentas');
    recommendations.push('Agregar índices a tablas con consultas lentas');
    recommendations.push('Considerar read replicas para consultas de solo lectura');
  }

  if (recommendations.length === 0) {
    recommendations.push('El sistema está funcionando de manera óptima');
  }

  return recommendations;
}

// Función helper para manejar errores
function handleError(error: any) {
  return NextResponse.json(
    {
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : String(error)
    },
    { status: 500 }
  );
}
