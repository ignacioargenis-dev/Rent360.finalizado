import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ZodError } from 'zod';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
  isOperational?: boolean | undefined;
}

export class AppError extends Error implements ApiError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores comunes predefinidos
export class ValidationError extends AppError {
  constructor(message: string = 'Datos de entrada inválidos', details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND_ERROR', true);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto en la solicitud') {
    super(message, 409, 'CONFLICT_ERROR', true);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error de base de datos') {
    super(message, 500, 'DATABASE_ERROR', false);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'Error en servicio externo') {
    super(`${message} (${service})`, 502, 'EXTERNAL_SERVICE_ERROR', true);
    this.name = 'ExternalServiceError';
  }
}

// Función para convertir errores a respuestas HTTP consistentes
export function handleApiError(error: unknown, context?: string): NextResponse {
  let apiError: ApiError;

  if (error instanceof AppError) {
    apiError = error;
  } else if (error instanceof ZodError) {
    apiError = new ValidationError('Datos de entrada inválidos', {
      issues: error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }))
    });
  } else if (error instanceof Error) {
    // Errores de base de datos
    if (error.message.includes('prisma') || error.message.includes('database')) {
      apiError = new DatabaseError('Error en la base de datos');
    }
    // Errores de red/servicios externos
    else if (error.message.includes('fetch') || error.message.includes('network')) {
      apiError = new ExternalServiceError('Servicio externo', 'Error de conexión');
    }
    // Otros errores operacionales
    else {
      apiError = new AppError(
        error.message || 'Error interno del servidor',
        500,
        'INTERNAL_ERROR',
        true
      );
    }
  } else {
    apiError = new AppError(
      'Error desconocido',
      500,
      'UNKNOWN_ERROR',
      false,
      { originalError: error }
    );
  }

  // Log del error
  const logData = {
    error: apiError.message,
    code: apiError.code,
    statusCode: apiError.statusCode,
    isOperational: apiError.isOperational,
    stack: apiError instanceof Error ? apiError.stack : undefined,
    details: apiError.details,
    context,
  };

  if (apiError.isOperational) {
    logger.warn('API Error', logData);
  } else {
    logger.error('API Error', logData);
  }

  // Crear respuesta HTTP
  const responseBody = {
    success: false,
    error: {
      message: apiError.message,
      code: apiError.code,
      ...(apiError.details && { details: apiError.details }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: apiError instanceof Error ? apiError.stack : undefined
      })
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(responseBody, { status: apiError.statusCode });
}

// Middleware para manejo de errores en rutas API
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<Response>
) {
  return async (request: Request, context?: any): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, `API Route: ${request.url}`);
    }
  };
}

// Función helper para respuestas de éxito consistentes
export function createApiResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse {
  const response = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: statusCode });
}

// Función helper para respuestas de éxito con paginación
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  },
  message?: string
): NextResponse {
  const response = {
    success: true,
    data,
    pagination,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response);
}

// Función para validar y convertir errores de Prisma
export function handlePrismaError(error: any): AppError {
  // Errores de unicidad
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo';
    return new ConflictError(`El ${field} ya existe`);
  }

  // Errores de clave foránea
  if (error.code === 'P2003') {
    return new ValidationError('Referencia a registro inexistente');
  }

  // Errores de validación
  if (error.code === 'P2000') {
    return new ValidationError('Valor demasiado largo para el campo');
  }

  // Errores de conexión
  if (error.code === 'P1001') {
    return new DatabaseError('Error de conexión a la base de datos');
  }

  // Error genérico de base de datos
  return new DatabaseError('Error en la operación de base de datos');
}
