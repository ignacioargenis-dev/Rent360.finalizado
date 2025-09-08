import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './error-handler';

// Sanitización de entrada básica
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitizar query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = (req.query[key] as string)
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres HTML básicos
        .substring(0, 1000); // Limitar longitud
    }
  }

  // Sanitizar body si existe
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

const sanitizeObject = (obj: any, depth = 0): void => {
  if (depth > 10) return; // Prevenir recursión infinita

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .trim()
        .replace(/[<>]/g, '') // Remover caracteres HTML básicos
        .substring(0, 10000); // Limitar longitud
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key], depth + 1);
    }
  }
};

// Validación de archivos subidos
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

  for (const file of files) {
    if (!file) continue;

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new ValidationError('File size exceeds 10MB limit', 'file');
    }

    // Validar tipo MIME
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError('Invalid file type', 'file');
    }

    // Validar nombre de archivo
    const fileName = file.originalname;
    if (fileName.length > 255) {
      throw new ValidationError('File name too long', 'file');
    }

    // Validar caracteres peligrosos en el nombre
    if (/[<>:"|?*\x00-\x1f]/.test(fileName)) {
      throw new ValidationError('Invalid characters in file name', 'file');
    }
  }

  next();
};

// Validación de parámetros de ruta
export const validateParams = (req: Request, res: Response, next: NextFunction) => {
  for (const param in req.params) {
    const value = req.params[param];

    // Validar que los IDs sean UUIDs válidos o números
    if (param.includes('id') || param.includes('Id')) {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) &&
          !/^[0-9]+$/.test(value)) {
        throw new ValidationError(`Invalid ${param} format`, param);
      }
    }

    // Validar longitud máxima
    if (value.length > 100) {
      throw new ValidationError(`${param} too long`, param);
    }
  }

  next();
};

// Validación de headers de seguridad
export const validateSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded-host',
    'x-forwarded-proto'
  ];

  for (const header of suspiciousHeaders) {
    if (req.headers[header] && req.headers[header] !== req.ip) {
      console.warn(`Suspicious header detected: ${header}`);
      // No bloquear, solo loggear
    }
  }

  next();
};

// Rate limiting por endpoint
export const endpointRateLimit = (limits: { [key: string]: number }) => {
  const requestCounts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const endpoint = req.route?.path || req.path;
    const limit = limits[endpoint] || limits['default'] || 100;
    const windowMs = 60 * 1000; // 1 minuto
    const key = `${req.ip}:${endpoint}`;
    const now = Date.now();

    let endpointData = requestCounts.get(key);

    if (!endpointData || endpointData.resetTime < now) {
      endpointData = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    endpointData.count++;

    if (endpointData.count > limit) {
      throw new ValidationError(`Rate limit exceeded for endpoint ${endpoint}`);
    }

    requestCounts.set(key, endpointData);
    next();
  };
};

// Validación de Content-Type
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];

    if (!contentType) {
      // Para métodos que no requieren body, permitir sin content-type
      if (['GET', 'HEAD', 'DELETE'].includes(req.method)) {
        return next();
      }
      throw new ValidationError('Content-Type header required');
    }

    const isAllowed = allowedTypes.some(type =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isAllowed) {
      throw new ValidationError(`Content-Type ${contentType} not allowed`);
    }

    next();
  };
};

// Validación de tamaño de request body
export const validateBodySize = (maxSize: string = '10mb') => {
  const maxSizeBytes = parseSize(maxSize);

  return (req: Request, res: Response, next: NextFunction) => {
    let bodySize = 0;

    if (req.body) {
      if (typeof req.body === 'string') {
        bodySize = Buffer.byteLength(req.body, 'utf8');
      } else {
        bodySize = Buffer.byteLength(JSON.stringify(req.body), 'utf8');
      }
    }

    if (bodySize > maxSizeBytes) {
      throw new ValidationError(`Request body too large. Maximum size: ${maxSize}`);
    }

    next();
  };
};

const parseSize = (size: string): number => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 10 * 1024 * 1024; // Default 10MB

  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';

  return value * (units[unit as keyof typeof units] || 1);
};

// Middleware de validación genérica
export const createValidationMiddleware = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Aquí iría la validación con el schema proporcionado
      // Por ahora, solo validamos que el body existe si es requerido
      if (schema.required && !req.body) {
        throw new ValidationError('Request body required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
