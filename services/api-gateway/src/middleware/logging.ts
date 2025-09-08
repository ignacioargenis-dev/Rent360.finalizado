import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configuración del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/gateway-access.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Lista de rutas sensibles que requieren logging detallado
const SENSITIVE_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/admin',
  '/api/payments',
  '/api/users',
  '/api/contracts'
];

// Lista de headers a excluir del logging
const EXCLUDED_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token'
];

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalUrl = req.originalUrl || req.url;
  const isSensitive = SENSITIVE_ROUTES.some(route => originalUrl.startsWith(route));

  // Capturar el body original antes de que sea procesado
  const originalSend = res.send;
  let responseBody: any = null;

  res.send = function(data) {
    responseBody = data;
    return originalSend.call(this, data);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Filtrar headers sensibles
    const headers = Object.keys(req.headers).reduce((acc, key) => {
      if (!EXCLUDED_HEADERS.includes(key.toLowerCase())) {
        acc[key] = req.headers[key];
      }
      return acc;
    }, {} as any);

    // Log básico para todas las solicitudes
    const logData = {
      method: req.method,
      url: originalUrl,
      statusCode: res.statusCode,
      duration,
      clientIP,
      userAgent,
      userId: (req as any).user?.userId,
      userRole: (req as any).user?.role,
      headers,
      timestamp: new Date().toISOString()
    };

    // Log detallado para rutas sensibles
    if (isSensitive) {
      logger.info('Sensitive route accessed', {
        ...logData,
        query: req.query,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined,
        responseSize: responseBody ? Buffer.byteLength(JSON.stringify(responseBody), 'utf8') : 0
      });
    } else {
      // Log básico para rutas normales
      logger.info(`${req.method} ${originalUrl} ${res.statusCode} - ${duration}ms`, {
        ...logData
      });
    }

    // Alertas para solicitudes lentas o errores
    if (duration > 5000) { // Más de 5 segundos
      logger.warn('Slow request detected', {
        ...logData,
        alert: 'performance'
      });
    }

    if (res.statusCode >= 500) {
      logger.error('Server error occurred', {
        ...logData,
        alert: 'error',
        error: responseBody?.error || 'Unknown error'
      });
    }

    if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        ...logData,
        alert: 'security'
      });
    }
  });

  res.on('error', (error) => {
    logger.error('Response error', {
      method: req.method,
      url: originalUrl,
      clientIP: req.ip || req.connection.remoteAddress,
      userId: (req as any).user?.userId,
      error: error.message,
      stack: error.stack
    });
  });

  next();
};

// Middleware adicional para logging de cambios críticos
export const auditMiddleware = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalUrl = req.originalUrl || req.url;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = (req as any).user?.userId || 'anonymous';
    const userRole = (req as any).user?.role || 'unknown';

    logger.info(`AUDIT: ${action}`, {
      userId,
      userRole,
      action,
      method: req.method,
      url: originalUrl,
      clientIP,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      params: req.params,
      query: req.query
    });

    next();
  };
};

// Middleware para monitoring de métricas
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalUrl = req.originalUrl || req.url;

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Aquí podríamos enviar métricas a un sistema de monitoring
    // como Prometheus, DataDog, etc.
    console.log(`METRIC: ${req.method} ${originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};
