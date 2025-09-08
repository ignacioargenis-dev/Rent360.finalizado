import { NextRequest, NextResponse } from 'next/server';
import { logger } from '../logger';

// Configuración de límites de seguridad
export const SECURITY_LIMITS = {
  MAX_REQUEST_SIZE: '10mb',
  MAX_FIELD_LENGTH: 10000,
  MAX_ARRAY_LENGTH: 1000,
  MAX_OBJECT_DEPTH: 10,
  MAX_STRING_LENGTH: 100000,
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutos
};

// Patrones de ataque comunes
export const MALICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /union\s+select/gi,
  /select\s+.*\s+from/gi,
  /\b(drop|delete|update|insert)\b\s+\w+/gi,
  /--/g,
  /\/\*.*?\*\//g,
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
];

// Función para sanitizar strings
export function sanitizeString(input: string, maxLength: number = SECURITY_LIMITS.MAX_STRING_LENGTH): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remover caracteres de control
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Limitar longitud
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logger.warn('String truncated due to length limit', {
      originalLength: input.length,
      maxLength,
      context: 'input_sanitization'
    });
  }

  // Remover patrones maliciosos
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      logger.warn('Malicious pattern detected and removed', {
        pattern: pattern.source,
        input: sanitized.substring(0, 100) + '...',
        context: 'input_sanitization'
      });
      sanitized = sanitized.replace(pattern, '');
    }
  }

  return sanitized.trim();
}

// Función para validar y sanitizar objetos
export function sanitizeObject(obj: any, depth: number = 0): any {
  // Prevenir recursión infinita
  if (depth > SECURITY_LIMITS.MAX_OBJECT_DEPTH) {
    logger.warn('Object depth limit exceeded', { depth, context: 'input_sanitization' });
    return {};
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length > SECURITY_LIMITS.MAX_ARRAY_LENGTH) {
      logger.warn('Array length limit exceeded', {
        length: obj.length,
        maxLength: SECURITY_LIMITS.MAX_ARRAY_LENGTH,
        context: 'input_sanitization'
      });
      return obj.slice(0, SECURITY_LIMITS.MAX_ARRAY_LENGTH);
    }

    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(obj)) {
      // Validar nombre de propiedad
      const sanitizedKey = sanitizeString(key, 100);
      if (sanitizedKey !== key) {
        logger.warn('Object property name sanitized', {
          originalKey: key,
          sanitizedKey,
          context: 'input_sanitization'
        });
      }

      sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    }

    return sanitized;
  }

  // Para otros tipos, convertir a string y sanitizar
  return sanitizeString(String(obj));
}

// Función para validar archivos subidos
export function validateUploadedFile(file: File): { isValid: boolean; error?: string } {
  // Validar tamaño (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size exceeds maximum limit of 10MB'
    };
  }

  // Validar tipo MIME
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  // Validar nombre de archivo
  const fileName = sanitizeString(file.name);
  if (fileName !== file.name) {
    return {
      isValid: false,
      error: 'File name contains invalid characters'
    };
  }

  // Validar extensión
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf', '.txt', '.doc', '.docx'];
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));

  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `File extension ${extension} is not allowed`
    };
  }

  return { isValid: true };
}

// Función para validar URLs
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url);

    // Solo permitir HTTP/HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }

    // Validar longitud
    if (url.length > 2048) {
      return { isValid: false, error: 'URL is too long' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

// Función para validar emails con mayor rigor
export function validateEmailSecurity(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required' };
  }

  // Sanitizar primero
  const sanitizedEmail = sanitizeString(email, 254); // RFC 5321 limita a 254 caracteres

  // Validar formato básico
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Verificar que no contenga caracteres peligrosos
  const dangerousChars = ['<', '>', '"', "'", '\\', '\n', '\r', '\t'];
  for (const char of dangerousChars) {
    if (sanitizedEmail.includes(char)) {
      return { isValid: false, error: 'Email contains invalid characters' };
    }
  }

  // Verificar longitud de partes
  const [localPart, domainPart] = sanitizedEmail.split('@');

  if (localPart.length > 64) { // RFC 5321
    return { isValid: false, error: 'Local part of email is too long' };
  }

  if (domainPart.length > 253) { // RFC 5321
    return { isValid: false, error: 'Domain part of email is too long' };
  }

  return { isValid: true };
}

// Middleware de validación de entrada
export function validateInput(request: NextRequest): { isValid: boolean; sanitizedBody?: any; error?: string } {
  try {
    // Validar Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { isValid: false, error: 'Content-Type must be application/json' };
    }

    // Validar tamaño del body
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (contentLength > maxSize) {
      return { isValid: false, error: 'Request body too large' };
    }

    // Aquí se podría agregar validación del body JSON
    // Por ahora, solo validamos la estructura básica

    return { isValid: true };
  } catch (error) {
    logger.error('Error validating input', {
      error: error instanceof Error ? error.message : String(error),
      context: 'input_validation'
    });
    return { isValid: false, error: 'Input validation failed' };
  }
}

// Función para validar parámetros de consulta
export function validateQueryParams(searchParams: URLSearchParams): { isValid: boolean; error?: string } {
  // Validar que no haya parámetros duplicados
  const paramNames = Array.from(searchParams.keys());
  const uniqueParams = new Set(paramNames);

  if (paramNames.length !== uniqueParams.size) {
    return { isValid: false, error: 'Duplicate query parameters detected' };
  }

  // Validar longitud de valores
  for (const [key, value] of searchParams) {
    if (value.length > SECURITY_LIMITS.MAX_FIELD_LENGTH) {
      return {
        isValid: false,
        error: `Query parameter '${key}' is too long`
      };
    }

    // Sanitizar valores
    const sanitizedValue = sanitizeString(value);
    if (sanitizedValue !== value) {
      logger.warn('Query parameter sanitized', {
        parameter: key,
        originalValue: value,
        context: 'query_validation'
      });
    }
  }

  return { isValid: true };
}

// Función para detectar ataques de inyección
export function detectInjectionAttacks(input: string): { isSafe: boolean; threats: string[] } {
  const threats: string[] = [];

  // Patrones de SQL injection
  const sqlPatterns = [
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/gi,
    /('|(\\x27)|(\\x2D\\x2D)|(\\|\/\*|\*\/)|(\\x3B)|(\\x2B)|(\\x28)|(\\x29))/gi
  ];

  // Patrones de XSS
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi
  ];

  // Patrones de Path Traversal
  const traversalPatterns = [
    /\.\./g,
    /\.\//g,
    /\/etc\/passwd/gi,
    /\/etc\/shadow/gi
  ];

  const allPatterns = [
    ...sqlPatterns.map(p => ({ pattern: p, type: 'SQL Injection' })),
    ...xssPatterns.map(p => ({ pattern: p, type: 'XSS' })),
    ...traversalPatterns.map(p => ({ pattern: p, type: 'Path Traversal' }))
  ];

  for (const { pattern, type } of allPatterns) {
    if (pattern.test(input)) {
      threats.push(type);
    }
  }

  return {
    isSafe: threats.length === 0,
    threats
  };
}

// Función para validar headers de seguridad
export function validateSecurityHeaders(request: NextRequest): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  let isValid = true;

  // Verificar User-Agent
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || userAgent.length < 10) {
    warnings.push('Suspicious or missing User-Agent header');
  }

  // Verificar Referer para requests POST/PUT/DELETE
  const method = request.method;
  const referer = request.headers.get('referer');

  if (['POST', 'PUT', 'DELETE'].includes(method) && !referer) {
    warnings.push('Missing Referer header for state-changing request');
  }

  // Verificar Content-Length para requests con body
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    const contentLength = request.headers.get('content-length');
    if (!contentLength) {
      warnings.push('Missing Content-Length header');
    } else {
      const length = parseInt(contentLength);
      if (length > 10 * 1024 * 1024) { // 10MB
        warnings.push('Content-Length exceeds maximum allowed size');
        isValid = false;
      }
    }
  }

  // Verificar Accept header
  const accept = request.headers.get('accept');
  if (!accept || !accept.includes('application/json')) {
    warnings.push('Client does not accept JSON responses');
  }

  if (warnings.length > 0) {
    logger.warn('Security header validation warnings', {
      warnings,
      method,
      url: request.url,
      userAgent: userAgent?.substring(0, 100),
      context: 'security_validation'
    });
  }

  return { isValid, warnings };
}
