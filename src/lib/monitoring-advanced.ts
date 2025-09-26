import { logger } from './logger';
import { cacheManager } from './cache-manager';
import { rateLimiter } from './rate-limiter';

export interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    free: number;
    external: number;
    rss: number;
  };
  cpu: {
    usage: number;
    loadAverage: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictions: number;
  };
  rateLimiting: {
    blockedRequests: number;
    activeKeys: number;
    memoryUsage: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
}

export interface MonitoringConfig {
  checkInterval: number;
  alertThresholds: {
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    errorRate: number;
    cacheHitRate: number;
  };
  retentionDays: number;
}

class AdvancedMonitoringSystem {
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private config!: MonitoringConfig;
  private checkInterval!: NodeJS.Timeout;
  private isRunning: boolean = false;

  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      checkInterval: 30000, // 30 segundos
      alertThresholds: {
        memoryUsage: 80, // 80% de uso de memoria
        cpuUsage: 70, // 70% de uso de CPU
        responseTime: 2000, // 2 segundos
        errorRate: 5, // 5% de errores
        cacheHitRate: 60, // 60% de hit rate
      },
      retentionDays: 30,
      ...config
    };

    this.startMonitoring();
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cacheStats = await cacheManager.getStats();
    const rateLimitStats = await rateLimiter.getStats();

    // Calcular métricas de performance (simuladas para desarrollo)
    const performanceMetrics = {
      averageResponseTime: Math.random() * 1000 + 100, // 100-1100ms
      requestsPerSecond: Math.random() * 50 + 10, // 10-60 req/s
      errorRate: Math.random() * 3, // 0-3%
    };

    return {
      timestamp: Date.now(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        free: Math.round((memoryUsage.heapTotal - memoryUsage.heapUsed) / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: {
        usage: Math.random() * 30 + 20, // 20-50%
        loadAverage: Math.random() * 2 + 0.5, // 0.5-2.5
      },
      database: {
        connections: Math.floor(Math.random() * 10) + 5, // 5-15
        queryTime: Math.random() * 100 + 10, // 10-110ms
        slowQueries: Math.floor(Math.random() * 5), // 0-5
      },
      cache: {
        hitRate: cacheStats.hitRate || 0,
        memoryUsage: Math.round((cacheStats.memoryUsage || 0) / 1024 / 1024),
        evictions: Math.floor(Math.random() * 10), // 0-10
      },
      rateLimiting: {
        blockedRequests: Math.floor(Math.random() * 20), // 0-20
        activeKeys: rateLimitStats.activeKeys || 0,
        memoryUsage: Math.round((rateLimitStats.memoryUsage || 0) / 1024 / 1024),
      },
      performance: performanceMetrics,
    };
  }

  private checkThresholds(metrics: SystemMetrics): Alert[] {
    const newAlerts: Alert[] = [];
    const timestamp = Date.now();

    // Verificar uso de memoria
    const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsagePercent > this.config.alertThresholds.memoryUsage) {
      newAlerts.push({
        id: `memory-${timestamp}`,
        type: memoryUsagePercent > 90 ? 'critical' : 'warning',
        title: 'Alto uso de memoria',
        message: `Uso de memoria: ${memoryUsagePercent.toFixed(1)}% (${metrics.memory.used}MB / ${metrics.memory.total}MB)`,
        timestamp,
        resolved: false,
      });
    }

    // Verificar uso de CPU
    if (metrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      newAlerts.push({
        id: `cpu-${timestamp}`,
        type: metrics.cpu.usage > 90 ? 'critical' : 'warning',
        title: 'Alto uso de CPU',
        message: `Uso de CPU: ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp,
        resolved: false,
      });
    }

    // Verificar tiempo de respuesta
    if (metrics.performance.averageResponseTime > this.config.alertThresholds.responseTime) {
      newAlerts.push({
        id: `response-time-${timestamp}`,
        type: 'warning',
        title: 'Tiempo de respuesta lento',
        message: `Tiempo promedio de respuesta: ${metrics.performance.averageResponseTime.toFixed(0)}ms`,
        timestamp,
        resolved: false,
      });
    }

    // Verificar tasa de errores
    if (metrics.performance.errorRate > this.config.alertThresholds.errorRate) {
      newAlerts.push({
        id: `error-rate-${timestamp}`,
        type: 'error',
        title: 'Alta tasa de errores',
        message: `Tasa de errores: ${metrics.performance.errorRate.toFixed(1)}%`,
        timestamp,
        resolved: false,
      });
    }

    // Verificar hit rate del cache
    if (metrics.cache.hitRate < this.config.alertThresholds.cacheHitRate) {
      newAlerts.push({
        id: `cache-hit-rate-${timestamp}`,
        type: 'warning',
        title: 'Bajo hit rate del cache',
        message: `Hit rate del cache: ${metrics.cache.hitRate.toFixed(1)}%`,
        timestamp,
        resolved: false,
      });
    }

    return newAlerts;
  }

  private async performHealthCheck(): Promise<void> {
    try {
      const metrics = await this.collectMetrics();
      
      // Agregar métricas a la lista
      this.metrics.push(metrics);
      
      // Mantener solo las métricas de los últimos días configurados
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);

      // Verificar umbrales y generar alertas
      const newAlerts = this.checkThresholds(metrics);
      this.alerts.push(...newAlerts);

      // Mantener solo alertas de los últimos días
      this.alerts = this.alerts.filter(a => a.timestamp > cutoffTime);

      // Log de métricas
      logger.info('System metrics collected', {
        context: 'monitoring.metrics',
        timestamp: metrics.timestamp,
        memoryUsage: `${metrics.memory.used}MB / ${metrics.memory.total}MB`,
        cpuUsage: `${metrics.cpu.usage.toFixed(1)}%`,
        cacheHitRate: `${metrics.cache.hitRate.toFixed(1)}%`,
        responseTime: `${metrics.performance.averageResponseTime.toFixed(0)}ms`,
        alertsCount: newAlerts.length,
      });

      // Si hay nuevas alertas, logearlas
      if (newAlerts.length > 0) {
        logger.warn('New system alerts generated', {
          context: 'monitoring.alerts',
          alerts: newAlerts.map(a => ({ id: a.id, type: a.type, title: a.title })),
        });
      }

    } catch (error) {
      logger.error('Error collecting system metrics', {
        context: 'monitoring.error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  public startMonitoring(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);

    logger.info('Advanced monitoring system started', {
      context: 'monitoring.start',
      checkInterval: this.config.checkInterval,
      alertThresholds: this.config.alertThresholds,
    });
  }

  public stopMonitoring(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    logger.info('Advanced monitoring system stopped', {
      context: 'monitoring.stop',
    });
  }

  public getMetrics(limit: number = 100): SystemMetrics[] {
    return this.metrics.slice(-limit);
  }

  public getAlerts(includeResolved: boolean = false): Alert[] {
    if (includeResolved) {
      return this.alerts;
    }
    return this.alerts.filter(a => !a.resolved);
  }

  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  public resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;

      logger.info('Alert resolved', {
        context: 'monitoring.alert-resolved',
        alertId,
        resolvedBy,
        resolutionTime: alert.resolvedAt - alert.timestamp,
      });

      return true;
    }
    return false;
  }

  public getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const recentMetrics = this.metrics.slice(-10); // Últimas 10 métricas
    if (recentMetrics.length === 0) {
      return { status: 'healthy', score: 100, issues: [] };
    }

    const latestMetrics = recentMetrics[recentMetrics.length - 1];
    if (!latestMetrics) {
      return { status: 'healthy', score: 100, issues: [] };
    }

    const issues: string[] = [];
    let score = 100;

    // Evaluar memoria
    const memoryUsagePercent = (latestMetrics.memory.used / latestMetrics.memory.total) * 100;
    if (memoryUsagePercent > 90) {
      issues.push(`Uso crítico de memoria: ${memoryUsagePercent.toFixed(1)}%`);
      score -= 30;
    } else if (memoryUsagePercent > 80) {
      issues.push(`Alto uso de memoria: ${memoryUsagePercent.toFixed(1)}%`);
      score -= 15;
    }

    // Evaluar CPU
    if (latestMetrics.cpu.usage > 90) {
      issues.push(`Uso crítico de CPU: ${latestMetrics.cpu.usage.toFixed(1)}%`);
      score -= 25;
    } else if (latestMetrics.cpu.usage > 70) {
      issues.push(`Alto uso de CPU: ${latestMetrics.cpu.usage.toFixed(1)}%`);
      score -= 10;
    }

    // Evaluar performance
    if (latestMetrics.performance.averageResponseTime > 2000) {
      issues.push(`Respuesta muy lenta: ${latestMetrics.performance.averageResponseTime.toFixed(0)}ms`);
      score -= 20;
    } else if (latestMetrics.performance.averageResponseTime > 1000) {
      issues.push(`Respuesta lenta: ${latestMetrics.performance.averageResponseTime.toFixed(0)}ms`);
      score -= 10;
    }

    // Evaluar cache
    if (latestMetrics.cache.hitRate < 50) {
      issues.push(`Muy bajo hit rate: ${latestMetrics.cache.hitRate.toFixed(1)}%`);
      score -= 15;
    } else if (latestMetrics.cache.hitRate < 70) {
      issues.push(`Bajo hit rate: ${latestMetrics.cache.hitRate.toFixed(1)}%`);
      score -= 5;
    }

    // Determinar estado
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (score < 50) {
      status = 'critical';
    } else if (score < 80) {
      status = 'warning';
    }

    return { status, score: Math.max(0, score), issues };
  }

  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info('Monitoring configuration updated', {
      context: 'monitoring.config-update',
      newConfig,
    });
  }

  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  public cleanup(): void {
    this.stopMonitoring();
    this.metrics = [];
    this.alerts = [];
  }
}

// Instancia singleton
export const advancedMonitoring = new AdvancedMonitoringSystem();

// Función helper para obtener métricas rápidas
export async function getQuickMetrics(): Promise<{
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  activeAlerts: number;
}> {
  const memoryUsage = process.memoryUsage();
  const cacheStats = await cacheManager.getStats();
  const activeAlerts = advancedMonitoring.getActiveAlerts().length;

  return {
    memoryUsage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    cpuUsage: Math.round(Math.random() * 30 + 20), // Simulado
    cacheHitRate: Math.round(cacheStats.hitRate || 0),
    activeAlerts,
  };
}
