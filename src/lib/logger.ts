// Configuración de logging
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

// Imports lazy para evitar dependencias circulares
let db: any = null;
let cacheManager: any = null;
let rateLimiter: any = null;

const getDb = async () => {
  if (!db) {
    const { db: dbModule } = await import('@/lib/db');
    db = dbModule;
  }
  return db;
};

const getCacheManager = async () => {
  if (!cacheManager) {
    const cacheModule = await import('@/lib/cache');
    cacheManager = cacheModule.cacheManager;
  }
  return cacheManager;
};

const getRateLimiter = async () => {
  if (!rateLimiter) {
    const rateLimiterModule = await import('@/lib/rate-limiter');
    rateLimiter = rateLimiterModule.rateLimiter;
  }
  return rateLimiter;
};

// Configuración de servicios externos de logging
interface ExternalLoggingConfig {
  sentry?: {
    dsn: string;
    environment: string;
  };
  datadog?: {
    apiKey: string;
    appKey: string;
  };
  logstash?: {
    host: string;
    port: number;
  };
}

type LogLevel = keyof typeof LOG_LEVELS;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  path?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  memoryUsage?: number;
  tags?: string[];
}

// Interfaces de monitoreo mejoradas
interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    free: number;
    external: number;
    rss: number;
    gc?: {
      collections: number;
      pauseTime: number;
    };
  };
  cpu: {
    usage: number;
    loadAverage: number;
    cores: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
    connectionPoolSize: number;
    activeConnections: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    evictions: number;
    keysCount: number;
    uptime: number;
  };
  rateLimiting: {
    blockedRequests: number;
    activeKeys: number;
    memoryUsage: number;
    totalRequests: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  customMetrics?: Record<string, number>;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  rule?: string; // Regla que generó la alerta
  threshold?: number; // Umbral que se superó
  currentValue?: number; // Valor actual
  autoResolve?: boolean; // Si se puede resolver automáticamente
  escalationLevel?: number; // Nivel de escalamiento
  tags?: string[]; // Tags para categorización
  metadata?: Record<string, any> | undefined; // Información adicional
}

interface MonitoringEvent {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: SystemMetrics) => boolean;
  type: 'warning' | 'error' | 'critical';
  message: string;
  threshold?: number;
  cooldown: number; // Tiempo entre alertas similares
  lastTriggered?: number;
  enabled: boolean;
  tags?: string[];
}

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any> | undefined;
  tags?: string[];
}

interface RequestContext {
  id: string;
  startTime: number;
  path: string;
  method: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

class Logger {
  private logLevel!: LogLevel;
  private isDevelopment!: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 1000;

  // Propiedades de monitoreo
  private events: MonitoringEvent[] = [];
  private alerts: Alert[] = [];
  private metrics: SystemMetrics[] = [];
  private maxEvents = 10000;
  private maxAlerts = 1000;
  private maxMetrics = 1000;
  private monitoringEnabled = true;
  private checkInterval: NodeJS.Timeout | null = null;

  // Sistema de reglas de alertas
  private alertRules: AlertRule[] = [];
  private performanceMetrics: Map<string, PerformanceMetric> = new Map();

  // Configuración externa
  private externalConfig: ExternalLoggingConfig = {};

  // Correlación de requests
  private activeRequests: Map<string, RequestContext> = new Map();

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'INFO';
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.logLevel];
  }

  private formatLogEntry(level: LogLevel, message: string, data?: Record<string, any>): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    // En desarrollo, agregar información adicional
    if (this.isDevelopment) {
      entry.requestId = this.generateRequestId();
    }

    return entry;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Mantener el buffer dentro del límite
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const { timestamp, level, message, data, error } = entry;
    
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(logMessage, data || '');
        if (error) console.error('Error details:', error);
        break;
      case 'WARN':
        console.warn(logMessage, data || '');
        break;
      case 'INFO':
        console.info(logMessage, data || '');
        break;
      case 'DEBUG':
        console.debug(logMessage, data || '');
        break;
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    try {
      // En producción, guardar en base de datos o servicio de logging
      if (process.env.NODE_ENV === 'production') {
        // Aquí se podría implementar el guardado en base de datos
        // await db.auditLog.create({ data: entry });
      }
    } catch (error) {
      console.error('Error persisting log:', error);
    }
  }

  private async log(level: LogLevel, message: string, data?: Record<string, any>): Promise<void> {
    if (!this.shouldLog(level)) return;

    const entry = this.formatLogEntry(level, message, data);
    
    this.addToBuffer(entry);
    this.outputToConsole(entry);
    
    if (process.env.NODE_ENV === 'production') {
      await this.persistLog(entry);
    }
  }

  // Métodos públicos de logging
  async error(message: string, data?: Record<string, any>): Promise<void> {
    await this.log('ERROR', message, data);
  }

  async warn(message: string, data?: Record<string, any>): Promise<void> {
    await this.log('WARN', message, data);
  }

  async info(message: string, data?: Record<string, any>): Promise<void> {
    await this.log('INFO', message, data);
  }

  async debug(message: string, data?: Record<string, any>): Promise<void> {
    await this.log('DEBUG', message, data);
  }

  // MÉTODOS DE PERFORMANCE

  // Iniciar medición de performance
  startPerformanceMeasurement(name: string, metadata?: Record<string, any>, tags?: string[]): string {
    const id = this.generateRequestId();
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata,
      tags
    };

    this.performanceMetrics.set(id, metric);
    return id;
  }

  // Finalizar medición de performance
  async endPerformanceMeasurement(
    id: string,
    additionalMetadata?: Record<string, any>
  ): Promise<void> {
    const metric = this.performanceMetrics.get(id);
    if (!metric) {
      await this.warn('Performance measurement not found', { id });
      return;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    // Combinar metadata adicional
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    // Log de performance
    await this.info('Performance measurement completed', {
      name: metric.name,
      duration: metric.duration,
      tags: metric.tags,
      metadata: metric.metadata
    });

    // Verificar umbrales de performance
    await this.checkPerformanceThresholds(metric);

    // Limpiar la medición
    this.performanceMetrics.delete(id);
  }

  // Wrapper para medir tiempo de ejecución de funciones
  async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>,
    tags?: string[]
  ): Promise<T> {
    const id = this.startPerformanceMeasurement(name, metadata, tags);

    try {
      const result = await fn();
      await this.endPerformanceMeasurement(id);
      return result;
    } catch (error) {
      await this.endPerformanceMeasurement(id, {
        error: error instanceof Error ? error.message : String(error),
        success: false
      });
      throw error;
    }
  }

  // Verificar umbrales de performance
  private async checkPerformanceThresholds(metric: PerformanceMetric): Promise<void> {
    if (!metric.duration) return;

    const thresholds = {
      database: 1000, // 1 segundo para consultas DB
      api: 500,       // 500ms para llamadas API
      cache: 50,      // 50ms para operaciones de cache
      general: 200    // 200ms para operaciones generales
    };

    let threshold = thresholds.general;
    if (metric.tags?.includes('database')) threshold = thresholds.database;
    if (metric.tags?.includes('api')) threshold = thresholds.api;
    if (metric.tags?.includes('cache')) threshold = thresholds.cache;

    if (metric.duration > threshold) {
      await this.logEvent(
        'warning',
        `Performance threshold exceeded: ${metric.name}`,
        'medium',
        {
          name: metric.name,
          duration: metric.duration,
          threshold,
          tags: metric.tags,
          metadata: metric.metadata
        }
      );
    }
  }

  // MÉTODOS DE MONITOREO INTEGRADOS

  // Registrar evento de monitoreo
  async logEvent(
    type: MonitoringEvent['type'],
    message: string,
    severity: MonitoringEvent['severity'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: MonitoringEvent = {
      id: this.generateRequestId(),
      type,
      message,
      timestamp: new Date(),
      metadata,
      severity,
    };

    this.events.push(event);

    // Mantener límite de eventos
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log al sistema de logging
    switch (type) {
      case 'error':
        await this.error(message, metadata);
        break;
      case 'warning':
        await this.warn(message, metadata);
        break;
      case 'info':
        await this.info(message, metadata);
        break;
      case 'success':
        await this.info(message, metadata);
        break;
    }

    // Crear alerta si es crítica
    if (severity === 'critical') {
      await this.createAlert('error_rate', message, 1, 1, metadata);
    }
  }

  // Crear alerta de rendimiento
  async createAlert(
    type: string,
    message: string,
    threshold: number,
    currentValue: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alert: Alert = {
      id: `${type}-${Date.now()}`,
      type: 'warning' as const,
      title: type.replace('_', ' ').toUpperCase(),
      message,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Mantener límite de alertas
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    await this.warn(`Performance Alert: ${message}`, {
      type,
      threshold,
      currentValue,
      metadata,
    });
  }

  // Obtener métricas del sistema
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cacheMgr = await getCacheManager();
    const rateLimiterInstance = await getRateLimiter();
    const cacheStats = await cacheMgr.cacheManager.getStats();
    const rateLimitStats = await rateLimiterInstance.rateLimiter.getStats();

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
        usage: Math.random() * 30 + 20, // Simulado
        loadAverage: Math.random() * 2 + 0.5, // Simulado
      },
      database: {
        connections: Math.floor(Math.random() * 10) + 5, // Simulado
        queryTime: Math.random() * 100 + 10, // Simulado
        slowQueries: Math.floor(Math.random() * 5), // Simulado
      },
      cache: {
        hitRate: cacheStats.hitRate || 0,
        memoryUsage: Math.round((cacheStats.memoryUsage || 0) / 1024 / 1024),
        evictions: Math.floor(Math.random() * 10), // Simulado
      },
      rateLimiting: {
        blockedRequests: Math.floor(Math.random() * 20), // Simulado
        activeKeys: rateLimitStats.activeKeys || 0,
        memoryUsage: Math.round((rateLimitStats.memoryUsage || 0) / 1024 / 1024),
      },
      performance: {
        averageResponseTime: Math.random() * 1000 + 100, // Simulado
        requestsPerSecond: Math.random() * 50 + 10, // Simulado
        errorRate: Math.random() * 3, // Simulado
      },
    };
  }

  // Verificar salud del sistema
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: Record<string, boolean>;
    uptime: number;
  }> {
    try {
      const checks = {
        database: await this.checkDatabase(),
        api: await this.checkAPI(),
        memory: await this.checkMemory(),
        cache: await this.checkCache(),
      };

      const status = this.determineHealthStatus(checks);
      const uptime = process.uptime();

      return { status, checks, uptime };
    } catch (error) {
      await this.error('Error checking system health', { error: error instanceof Error ? error.message : String(error) });
      return { status: 'unhealthy', checks: {}, uptime: 0 };
    }
  }

  // Métodos de verificación de salud
  private async checkDatabase(): Promise<boolean> {
    try {
      const dbInstance = await getDb();
      await dbInstance.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkAPI(): Promise<boolean> {
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async checkMemory(): Promise<boolean> {
    try {
      const memoryUsage = process.memoryUsage();
      const usagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      return usagePercent < 80;
    } catch (error) {
      return false;
    }
  }

  private async checkCache(): Promise<boolean> {
    try {
      const cacheMgr = await getCacheManager();
      const cacheStats = await cacheMgr.cacheManager.getStats();
      return (cacheStats.hitRate || 0) > 50;
    } catch (error) {
      return false;
    }
  }

  private determineHealthStatus(checks: Record<string, boolean>): 'healthy' | 'degraded' | 'unhealthy' {
    const failedChecks = Object.values(checks).filter(check => !check).length;

    if (failedChecks === 0) return 'healthy';
    if (failedChecks <= 1) return 'degraded';
    return 'unhealthy';
  }

  // Iniciar monitoreo automático
  startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(async () => {
      if (!this.monitoringEnabled) return;

      try {
        const metrics = await this.getSystemMetrics();
        this.metrics.push(metrics);

        // Mantener límite de métricas
        if (this.metrics.length > this.maxMetrics) {
          this.metrics = this.metrics.slice(-this.maxMetrics);
        }

        // Verificar umbrales
        await this.checkThresholds(metrics);

      } catch (error) {
        await this.error('Error in monitoring cycle', { error: error instanceof Error ? error.message : String(error) });
      }
    }, intervalMs);

    this.info('Monitoring system started', { intervalMs });
  }

  // Detener monitoreo
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.info('Monitoring system stopped');
  }

  // Verificar umbrales
  private async checkThresholds(metrics: SystemMetrics): Promise<void> {
    // Verificar memoria
    const memoryUsagePercent = (metrics.memory.used / metrics.memory.total) * 100;
    if (memoryUsagePercent > 80) {
      await this.createAlert(
        'high_memory',
        `Uso de memoria alto: ${memoryUsagePercent.toFixed(1)}%`,
        80,
        memoryUsagePercent
      );
    }

    // Verificar CPU
    if (metrics.cpu.usage > 70) {
      await this.createAlert(
        'high_cpu',
        `Uso de CPU alto: ${metrics.cpu.usage.toFixed(1)}%`,
        70,
        metrics.cpu.usage
      );
    }

    // Verificar cache
    if (metrics.cache.hitRate < 50) {
      await this.createAlert(
        'low_cache_hit_rate',
        `Hit rate bajo: ${metrics.cache.hitRate.toFixed(1)}%`,
        50,
        metrics.cache.hitRate
      );
    }
  }

  // Obtener estadísticas de logging
  getLogStats(): {
    total: number;
    info: number;
    warn: number;
    error: number;
    debug: number;
  } {
    // En una implementación real, estas estadísticas vendrían de los logs almacenados
    // Por ahora devolvemos estadísticas simuladas basadas en el estado actual
    return {
      total: this.events.length + this.alerts.length,
      info: this.events.filter(e => e.type === 'info').length,
      warn: this.events.filter(e => e.type === 'warning').length,
      error: this.events.filter(e => e.type === 'error').length + this.alerts.length,
      debug: this.events.filter(e => e.type === 'success').length
    };
  }

  // Obtener métricas consolidadas
  getMonitoringStats(): {
    events: {
      total: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
    alerts: {
      total: number;
      active: number;
      byType: Record<string, number>;
    };
    health: {
      current: any;
      history: SystemMetrics[];
    };
  } {
    return {
      events: {
        total: this.events.length,
        byType: this.events.reduce((acc, event) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: this.events.reduce((acc, event) => {
          acc[event.severity] = (acc[event.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      alerts: {
        total: this.alerts.length,
        active: this.alerts.filter(a => !a.resolved).length,
        byType: this.alerts.reduce((acc, alert) => {
          acc[alert.type] = (acc[alert.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      health: {
        current: this.metrics[this.metrics.length - 1],
        history: this.metrics.slice(-10),
      },
    };
  }

  // Resolver alerta
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      alert.resolvedBy = resolvedBy;
      this.info('Alert resolved', { alertId, resolvedBy });
      return true;
    }
    return false;
  }

  // Métodos de conveniencia para logging específico
  async logRequest(req: any, userId?: string): Promise<void> {
    const requestData = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      userId,
    };

    await this.info('HTTP Request', requestData);
  }

  async logResponse(res: any, userId?: string): Promise<void> {
    const responseData = {
      statusCode: res.statusCode,
      headers: res.headers,
      userId,
    };

    await this.info('HTTP Response', responseData);
  }

  async logError(error: Error, context?: Record<string, any>): Promise<void> {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...context,
    };

    await this.error('Application Error', errorData);
  }

  async logDatabaseError(error: Error, query?: string, params?: any): Promise<void> {
    const errorData = {
      name: error.name,
      message: error.message,
      query,
      params,
    };

    await this.error('Database error', errorData);
  }

  async logAuthError(error: Error, userId?: string, action?: string): Promise<void> {
    const errorData = {
      name: error.name,
      message: error.message,
      userId,
      action,
    };

    await this.error('Authentication error', errorData);
  }

  async logPaymentError(error: Error, paymentData?: any): Promise<void> {
    const errorData = {
      name: error.name,
      message: error.message,
      paymentId: paymentData?.id,
      amount: paymentData?.amount,
      provider: paymentData?.provider,
    };

    await this.error('Payment error', errorData);
  }

  // Métodos para obtener logs
  getLogs(level?: LogLevel, limit: number = 100): LogEntry[] {
    let logs = this.logBuffer;
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return logs.slice(-limit);
  }

  getRecentErrors(limit: number = 50): LogEntry[] {
    return this.logBuffer
      .filter(log => log.level === 'ERROR')
      .slice(-limit);
  }

  getStats(): { total: number; byLevel: Record<LogLevel, number> } {
    const byLevel = {
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0,
    };

    this.logBuffer.forEach(log => {
      byLevel[log.level]++;
    });

    return {
      total: this.logBuffer.length,
      byLevel,
    };
  }

  // Limpiar buffer
  clear(): void {
    this.logBuffer = [];
  }

  // Configurar nivel de log
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Exportar logs
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'message', 'data', 'error'];
      const rows = this.logBuffer.map(log => [
        log.timestamp,
        log.level,
        log.message,
        JSON.stringify(log.data || ''),
        log.error || '',
      ]);
      
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }
    
    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Instancia singleton
export const logger = new Logger();

// Inicializar monitoreo automáticamente
logger.startMonitoring(30000); // 30 segundos

// Funciones de conveniencia para uso directo
export const logError = (message: string, data?: Record<string, any>) => logger.error(message, data);
export const logWarn = (message: string, data?: Record<string, any>) => logger.warn(message, data);
export const logInfo = (message: string, data?: Record<string, any>) => logger.info(message, data);
export const logDebug = (message: string, data?: Record<string, any>) => logger.debug(message, data);

// Funciones de monitoreo para uso directo
export const logEvent = (type: MonitoringEvent['type'], message: string, severity?: MonitoringEvent['severity'], metadata?: Record<string, any>) =>
  logger.logEvent(type, message, severity, metadata);
export const getSystemMetrics = () => logger.getSystemMetrics();
export const checkSystemHealth = () => logger.checkSystemHealth();
export const getMonitoringStats = () => logger.getMonitoringStats();
export const getLogStats = () => logger.getLogStats();
export const resolveAlert = (alertId: string, resolvedBy: string) => logger.resolveAlert(alertId, resolvedBy);

// Tipos para exportar
export type { SystemMetrics, Alert, MonitoringEvent };
