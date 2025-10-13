// Logger completamente compatible con Edge Runtime
export const logger = {
  error: (message: string, data?: any) => {
    console.error(`[${new Date().toISOString()}] ERROR:`, message, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[${new Date().toISOString()}] WARN:`, message, data || '');
  },
  info: (message: string, data?: any) => {
    console.log(`[${new Date().toISOString()}] INFO:`, message, data || '');
  },
  debug: (message: string, data?: any) => {
    if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development') {
      console.debug(`[${new Date().toISOString()}] DEBUG:`, message, data || '');
    }
  },
  getLogStats: () => {
    // Estadísticas básicas simplificadas para compatibilidad
    return {
      totalLogs: 0,
      errorCount: 0,
      warnCount: 0,
      infoCount: 0,
      debugCount: 0,
      lastLogTime: null,
      logsByHour: {},
      logsByDay: {},
      topErrors: [],
      performanceMetrics: {
        avgResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
      },
    };
  },
};
