import { logger } from '@/lib/logger-edge';
import { NextResponse } from 'next/server';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public details?: any;
  
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  public service?: string;

  constructor(message = 'External service error', service?: string) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

export class RateLimitError extends AppError {
  public retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class FileUploadError extends AppError {
  public maxSize?: number;
  public allowedTypes?: string[];

  constructor(message = 'File upload failed', maxSize?: number, allowedTypes?: string[]) {
    super(message, 400, 'FILE_UPLOAD_ERROR');
    this.name = 'FileUploadError';
    this.maxSize = maxSize;
    this.allowedTypes = allowedTypes;
  }
}

export class BusinessLogicError extends AppError {
  public businessRule?: string;

  constructor(message = 'Business rule violation', businessRule?: string) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR');
    this.name = 'BusinessLogicError';
    this.businessRule = businessRule;
  }
}

export function handleError(error: unknown): NextResponse {
  logger.error('Error:', { error: error instanceof Error ? error.message : String(error) });

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code || 'APP_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { 
        error: error.message, 
        details: error.details,
        code: 'VALIDATION_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  if (error instanceof AuthenticationError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'AUTHENTICATION_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 401 },
    );
  }

  if (error instanceof AuthorizationError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'AUTHORIZATION_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 403 },
    );
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: 'NOT_FOUND_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 404 },
    );
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'CONFLICT_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 409 },
    );
  }

  if (error instanceof DatabaseError) {
    logger.error('Database error:', { error: error.message });
    return NextResponse.json(
      {
        error: 'Error de base de datos',
        code: 'DATABASE_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  if (error instanceof ExternalServiceError) {
    logger.error('External service error:', { service: error.service, error: error.message });
    return NextResponse.json(
      {
        error: error.message,
        code: 'EXTERNAL_SERVICE_ERROR',
        service: error.service,
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    );
  }

  if (error instanceof RateLimitError) {
    const headers = new Headers();
    if (error.retryAfter) {
      headers.set('Retry-After', error.retryAfter.toString());
    }

    return NextResponse.json(
      {
        error: error.message,
        code: 'RATE_LIMIT_ERROR',
        retryAfter: error.retryAfter,
        timestamp: new Date().toISOString(),
      },
      { status: 429, headers },
    );
  }

  if (error instanceof FileUploadError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'FILE_UPLOAD_ERROR',
        maxSize: error.maxSize,
        allowedTypes: error.allowedTypes,
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  if (error instanceof BusinessLogicError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'BUSINESS_LOGIC_ERROR',
        businessRule: error.businessRule,
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  if (error instanceof Error) {
    logger.error('Unexpected error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }

  logger.error('Unknown error:', { error: error instanceof Error ? error.message : String(error) });
  return NextResponse.json(
    { 
      error: 'Error interno del servidor',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status: 500 },
  );
}

export function asyncHandler(fn: (req: any, res: any, next: any) => Promise<any>) {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateRequest<T>(schema: any, data: T): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error && 'errors' in error) {
      throw new ValidationError('Validation failed', (error as any).errors);
    }
    throw new ValidationError('Validation failed');
  }
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  // This is a simple in-memory rate limiter
  // In production, you should use Redis or similar
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!global.rateLimits) {
    global.rateLimits = new Map();
  }
  
  const userRequests = global.rateLimits.get(key) || [];
  const validRequests = userRequests.filter((time: number) => time > windowStart);
  
  if (validRequests.length >= limit) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  global.rateLimits.set(key, validRequests);
  
  return true; // Within rate limit
}

export function getRateLimitInfo(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
} {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!global.rateLimits) {
    global.rateLimits = new Map();
  }

  const userRequests = global.rateLimits.get(key) || [];
  const validRequests = userRequests.filter((time: number) => time > windowStart);

  return {
    allowed: validRequests.length < limit,
    remaining: Math.max(0, limit - validRequests.length),
    resetTime: windowStart + windowMs,
    limit,
  };
}

// Wrapper para operaciones de base de datos con manejo de errores
export async function withDatabaseErrorHandling<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Database operation failed: ${operationName}`, {
      error: error instanceof Error ? error.message : String(error),
      operation: operationName
    });

    if (error instanceof Error) {
      // Detectar tipos específicos de errores de base de datos
      if (error.message.includes('Unique constraint')) {
        throw new ConflictError('Recurso ya existe');
      }
      if (error.message.includes('Foreign key constraint')) {
        throw new BusinessLogicError('Referencia inválida');
      }
      if (error.message.includes('Connection')) {
        throw new DatabaseError('Error de conexión a base de datos');
      }
    }

    throw new DatabaseError(`Error en operación de base de datos: ${operationName}`);
  }
}

// Wrapper para llamadas a servicios externos
export async function withExternalServiceErrorHandling<T>(
  operation: () => Promise<T>,
  serviceName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`External service error: ${serviceName}`, {
      error: error instanceof Error ? error.message : String(error),
      service: serviceName
    });

    throw new ExternalServiceError(
      `Error al comunicarse con ${serviceName}`,
      serviceName
    );
  }
}

// Función para validar archivos de subida
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): void {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB por defecto
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  } = options;

  if (file.size > maxSize) {
    throw new FileUploadError(
      `El archivo es demasiado grande. Máximo permitido: ${Math.round(maxSize / 1024 / 1024)}MB`,
      maxSize,
      allowedTypes
    );
  }

  if (!allowedTypes.includes(file.type)) {
    throw new FileUploadError(
      `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
      maxSize,
      allowedTypes
    );
  }

  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(fileExtension)) {
    throw new FileUploadError(
      `Extensión de archivo no permitida. Extensiones permitidas: ${allowedExtensions.join(', ')}`,
      maxSize,
      allowedTypes
    );
  }
}

// Función para validar reglas de negocio
export function validateBusinessRule(
  condition: boolean,
  message: string,
  businessRule?: string
): void {
  if (!condition) {
    throw new BusinessLogicError(message, businessRule);
  }
}

// Función para crear respuestas de error consistentes para el frontend
export function createErrorResponse(
  error: unknown,
  context?: Record<string, any>
): {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: string;
    context?: Record<string, any>;
  };
} {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code || 'APP_ERROR',
        timestamp,
        context
      }
    };
  }

  if (error instanceof Error) {
    logger.error('Unhandled error:', { error: error.message, context });
    return {
      success: false,
      error: {
        message: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        timestamp,
        context
      }
    };
  }

  logger.error('Unknown error:', { error: String(error), context });
  return {
    success: false,
    error: {
      message: 'Error desconocido',
      code: 'UNKNOWN_ERROR',
      timestamp,
      context
    }
  };
}
