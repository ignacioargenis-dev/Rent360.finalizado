import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} from '@/middleware/error-handler';

// Tipos para las funciones de API
type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;
type MethodHandlers = {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PUT?: ApiHandler;
  DELETE?: ApiHandler;
  PATCH?: ApiHandler;
};

// Configuración del wrapper
interface ApiWrapperConfig {
  requireAuth?: boolean;
  requireRoles?: string[];
  enableAudit?: boolean;
  auditAction?: string;
  timeout?: number; // en milisegundos
  maxRetries?: number;
}

// Estadísticas de rendimiento
const performanceStats = {
  totalRequests: 0,
  totalErrors: 0,
  averageResponseTime: 0,
  errorRate: 0,
  lastUpdated: Date.now()
};

// Función para actualizar estadísticas
function updatePerformanceStats(responseTime: number, hadError: boolean) {
  performanceStats.totalRequests++;
  if (hadError) performanceStats.totalErrors++;

  const totalTime = performanceStats.averageResponseTime * (performanceStats.totalRequests - 1) + responseTime;
  performanceStats.averageResponseTime = totalTime / performanceStats.totalRequests;
  performanceStats.errorRate = (performanceStats.totalErrors / performanceStats.totalRequests) * 100;
  performanceStats.lastUpdated = Date.now();
}

// Función para obtener estadísticas
export function getApiStats() {
  return { ...performanceStats };
}

// Wrapper principal para rutas de API
export function apiWrapper(
  handlers: MethodHandlers,
  config: ApiWrapperConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const { method, url } = request;
    const pathname = new URL(url).pathname;
    const clientIP = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let hadError = false;

    try {
      // Verificar si el método está soportado
      const handler = handlers[method as keyof MethodHandlers];
      if (!handler) {
        logger.warn('Unsupported HTTP method', {
          method,
          pathname,
          clientIP,
          context: 'api.wrapper.unsupported_method'
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Method not allowed',
            message: `HTTP method ${method} is not supported for this endpoint`
          },
          { status: 405 }
        );
      }

      // Verificar autenticación si es requerida
      if (config.requireAuth) {
        const user = (request as any).user;
        if (!user) {
          throw new AuthenticationError('Authentication required');
        }

        // Verificar roles si son especificados
        if (config.requireRoles && config.requireRoles.length > 0) {
          if (!config.requireRoles.includes(user.role)) {
            throw new AuthorizationError(`Required roles: ${config.requireRoles.join(', ')}`);
          }
        }
      }

      // Configurar timeout si es especificado
      let timeoutId: NodeJS.Timeout | null = null;
      if (config.timeout) {
        timeoutId = setTimeout(() => {
          logger.error('API request timeout', {
            method,
            pathname,
            timeout: config.timeout,
            clientIP,
            context: 'api.wrapper.timeout'
          });

          throw new Error(`Request timeout after ${config.timeout}ms`);
        }, config.timeout);
      }

      // Ejecutar el handler
      const result = await handler(request, context);

      // Limpiar timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Log de éxito
      const responseTime = Date.now() - startTime;
      logger.info('API request completed successfully', {
        method,
        pathname,
        statusCode: result.status,
        responseTime,
        clientIP,
        userId: (request as any).user?.userId,
        context: 'api.wrapper.success'
      });

      updatePerformanceStats(responseTime, false);
      return result;

    } catch (error) {
      hadError = true;
      const responseTime = Date.now() - startTime;

      // Manejar diferentes tipos de errores
      if (error instanceof ValidationError) {
        logger.warn('API validation error', {
          method,
          pathname,
          error: error.message,
          field: error.field,
          responseTime,
          clientIP,
          context: 'api.wrapper.validation_error'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: error.message,
            field: error.field
          },
          { status: 400 }
        );
      }

      if (error instanceof AuthenticationError) {
        logger.warn('API authentication error', {
          method,
          pathname,
          error: error.message,
          responseTime,
          clientIP,
          context: 'api.wrapper.auth_error'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication error',
            message: error.message
          },
          { status: 401 }
        );
      }

      if (error instanceof AuthorizationError) {
        logger.warn('API authorization error', {
          method,
          pathname,
          error: error.message,
          responseTime,
          clientIP,
          userId: (request as any).user?.userId,
          context: 'api.wrapper.authz_error'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Authorization error',
            message: error.message
          },
          { status: 403 }
        );
      }

      if (error instanceof NotFoundError) {
        logger.warn('API resource not found', {
          method,
          pathname,
          error: error.message,
          responseTime,
          clientIP,
          context: 'api.wrapper.not_found'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: error.message
          },
          { status: 404 }
        );
      }

      if (error instanceof ConflictError) {
        logger.warn('API resource conflict', {
          method,
          pathname,
          error: error.message,
          responseTime,
          clientIP,
          context: 'api.wrapper.conflict'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Conflict',
            message: error.message
          },
          { status: 409 }
        );
      }

      // Manejar errores de validación de Zod
      if (error instanceof z.ZodError) {
        logger.warn('API Zod validation error', {
          method,
          pathname,
          issues: error.issues,
          responseTime,
          clientIP,
          context: 'api.wrapper.zod_error'
        });

        updatePerformanceStats(responseTime, true);
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Invalid request data',
            details: error.issues
          },
          { status: 400 }
        );
      }

      // Error genérico del servidor
      logger.error('API internal server error', {
        method,
        pathname,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        responseTime,
        clientIP,
        userId: (request as any).user?.userId,
        context: 'api.wrapper.server_error'
      });

      updatePerformanceStats(responseTime, true);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development'
            ? (error instanceof Error ? error.message : String(error))
            : 'An unexpected error occurred'
        },
        { status: 500 }
      );
    }
  };
}

// Función helper para crear respuestas de éxito consistentes
export function createSuccessResponse(
  data: any,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Función helper para crear respuestas de error consistentes
export function createErrorResponse(
  error: string,
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      message,
      details,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

// Función helper para validar y parsear JSON con mejor manejo de errores
export async function parseJsonRequest<T = any>(
  request: NextRequest,
  schema?: z.ZodSchema<T>
): Promise<T> {
  try {
    const data = await request.json();

    if (schema) {
      return schema.parse(data);
    }

    return data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', 'body');
    }

    throw new ValidationError('Invalid JSON in request body');
  }
}

// Función helper para validar parámetros de ruta
export function validateRouteParams(
  params: any,
  requiredParams: string[]
): void {
  for (const param of requiredParams) {
    if (!params[param]) {
      throw new ValidationError(`Missing required parameter: ${param}`, param);
    }

    // Validar formato de IDs
    if (param.includes('id') || param.includes('Id')) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params[param]) &&
          !/^[0-9]+$/.test(params[param])) {
        throw new ValidationError(`Invalid ${param} format`, param);
      }
    }
  }
}

// Función helper para validar query parameters
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema?: z.ZodSchema
): any {
  const queryObj: any = {};

  for (const [key, value] of searchParams.entries()) {
    queryObj[key] = value;
  }

  if (schema) {
    try {
      return schema.parse(queryObj);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid query parameters');
      }
      throw error;
    }
  }

  return queryObj;
}

// Middleware para logging de auditoría automática
export function withAudit(auditAction: string) {
  return (handler: ApiHandler): ApiHandler => {
    return async (request: NextRequest, context?: any) => {
      const startTime = Date.now();
      const result = await handler(request, context);
      const duration = Date.now() - startTime;

      // Aquí se podría integrar con un servicio de auditoría
      logger.info('API audit log', {
        action: auditAction,
        method: request.method,
        url: request.url,
        duration,
        statusCode: result.status,
        userId: (request as any).user?.userId,
        clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        context: 'api.audit'
      });

      return result;
    };
  };
}

// Función para crear handlers con configuración predefinida
export function createApiHandler(
  config: ApiWrapperConfig,
  handlers: MethodHandlers
) {
  return apiWrapper(handlers, config);
}
