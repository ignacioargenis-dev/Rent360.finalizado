import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

// Configuración del logger para errores
const errorLogger = winston.createLogger({
  level: 'error',
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
      filename: 'logs/gateway-errors.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

// Clases de error personalizadas
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  constructor(service: string, originalError?: Error) {
    super(`External service ${service} error`);
    this.name = 'ExternalServiceError';
    this.cause = originalError;
  }
}

// Función para determinar el código de estado HTTP basado en el tipo de error
const getHttpStatusCode = (error: Error): number => {
  switch (error.name) {
    case 'ValidationError':
      return 400;
    case 'AuthenticationError':
      return 401;
    case 'AuthorizationError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'ConflictError':
      return 409;
    case 'RateLimitError':
      return 429;
    case 'ExternalServiceError':
      return 502;
    default:
      return 500;
  }
};

// Función para formatear la respuesta de error
const formatErrorResponse = (error: Error, req: Request): any => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const statusCode = getHttpStatusCode(error);

  const baseResponse = {
    success: false,
    error: error.name,
    message: error.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // En desarrollo, incluir más detalles
  if (isDevelopment) {
    return {
      ...baseResponse,
      stack: error.stack,
      cause: error.cause,
      ...(error instanceof ValidationError && { field: error.field }),
      ...(error instanceof RateLimitError && { retryAfter: error.retryAfter })
    };
  }

  // En producción, respuestas más genéricas pero informativas
  return {
    ...baseResponse,
    ...(error instanceof ValidationError && { field: error.field }),
    ...(error instanceof RateLimitError && { retryAfter: error.retryAfter })
  };
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log del error con contexto completo
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const userId = (req as any).user?.userId || 'anonymous';
  const userRole = (req as any).user?.role || 'unknown';

  const errorContext = {
    error: err.name,
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    clientIP,
    userAgent,
    userId,
    userRole,
    headers: req.headers,
    query: req.query,
    params: req.params,
    body: req.method !== 'GET' ? req.body : undefined,
    timestamp: new Date().toISOString()
  };

  // Log según la severidad del error
  const statusCode = getHttpStatusCode(err);

  if (statusCode >= 500) {
    errorLogger.error('Server Error', errorContext);
  } else if (statusCode >= 400 && statusCode < 500) {
    errorLogger.warn('Client Error', errorContext);
  } else {
    errorLogger.info('Handled Error', errorContext);
  }

  // Enviar respuesta de error al cliente
  const statusCodeToUse = getHttpStatusCode(err);
  const errorResponse = formatErrorResponse(err, req);

  // Headers adicionales para errores específicos
  if (err instanceof RateLimitError && err.retryAfter) {
    res.set('Retry-After', err.retryAfter.toString());
  }

  res.status(statusCodeToUse).json(errorResponse);
};

// Middleware para manejo de errores de servicios externos
export const externalServiceErrorHandler = (serviceName: string) => {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    errorLogger.error(`External service error: ${serviceName}`, {
      service: serviceName,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: req.originalUrl,
      method: req.method
    });

    const externalError = new ExternalServiceError(serviceName, error);
    next(externalError);
  };
};

// Middleware para sanitización de errores
export const sanitizeError = (req: Request, res: Response, next: NextFunction) => {
  try {
    next();
  } catch (error) {
    // Sanitizar errores que podrían contener información sensible
    if (error instanceof Error) {
      // Remover información sensible del stack trace en producción
      if (process.env.NODE_ENV === 'production') {
        error.stack = undefined;
      }

      // Sanitizar mensajes de error que podrían contener datos sensibles
      if (error.message.includes('password') || error.message.includes('token')) {
        error.message = 'Invalid credentials';
      }
    }

    next(error);
  }
};

// Middleware para timeout de requests
export const timeoutMiddleware = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      const error = new Error(`Request timeout after ${timeoutMs}ms`);
      error.name = 'TimeoutError';
      next(error);
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};
