import { z } from 'zod';
import { logger } from '../logger';

// Validadores base reutilizables
export const BaseValidators = {
  // IDs
  id: z.string().min(1, 'ID requerido').max(100, 'ID demasiado largo'),

  // Texto
  name: z.string().min(2, 'Nombre muy corto').max(100, 'Nombre demasiado largo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
  description: z.string().max(1000, 'Descripción demasiado larga').optional(),

  // Números
  positiveNumber: z.number().positive('Debe ser un número positivo'),
  nonNegativeNumber: z.number().min(0, 'No puede ser negativo'),

  // Fechas
  dateString: z.string().refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  futureDate: z.string().refine((date) => new Date(date) > new Date(), 'La fecha debe ser futura'),

  // URLs
  url: z.string().url('URL inválida').optional(),

  // Arrays
  stringArray: z.array(z.string()).default([]),
  emailArray: z.array(z.string().email()).default([]),

  // Booleanos
  boolean: z.boolean().default(false),

  // Enums comunes
  userRole: z.enum(['TENANT', 'OWNER', 'BROKER', 'RUNNER', 'SUPPORT', 'ADMIN']),
  propertyStatus: z.enum(['AVAILABLE', 'RENTED', 'PENDING', 'MAINTENANCE', 'INACTIVE']),
  contractStatus: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'TERMINATED', 'CANCELLED']),
  paymentStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL', 'OVERDUE']),
  refundStatus: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled']),
  legalCaseStatus: z.enum(['pending', 'in_review', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']),
};

// Esquemas de validación específicos
export const ValidationSchemas = {
  // Usuario
  user: {
    create: z.object({
      email: BaseValidators.email,
      password: BaseValidators.password,
      name: BaseValidators.name,
      phone: z.string().optional(),
      role: BaseValidators.userRole,
    }),

    update: z.object({
      name: BaseValidators.name.optional(),
      phone: z.string().optional(),
      avatar: BaseValidators.url,
      bio: z.string().max(500).optional(),
    }).partial(),

    login: z.object({
      email: BaseValidators.email,
      password: z.string().min(1, 'Contraseña requerida'),
    }),
  },

  // Propiedad
  property: {
    create: z.object({
      title: BaseValidators.name,
      description: BaseValidators.description,
      address: z.string().min(5, 'Dirección muy corta').max(200, 'Dirección demasiado larga'),
      city: BaseValidators.name,
      commune: BaseValidators.name,
      region: BaseValidators.name,
      price: BaseValidators.positiveNumber,
      deposit: BaseValidators.nonNegativeNumber,
      bedrooms: z.number().int().min(0).max(20),
      bathrooms: z.number().int().min(0).max(20),
      area: BaseValidators.positiveNumber,
      type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']),
      images: BaseValidators.stringArray,
      features: BaseValidators.stringArray,
    }),

    update: z.object({
      title: BaseValidators.name.optional(),
      description: BaseValidators.description,
      address: z.string().min(5).max(200).optional(),
      city: BaseValidators.name.optional(),
      commune: BaseValidators.name.optional(),
      region: BaseValidators.name.optional(),
      price: BaseValidators.positiveNumber.optional(),
      deposit: BaseValidators.nonNegativeNumber.optional(),
      bedrooms: z.number().int().min(0).max(20).optional(),
      bathrooms: z.number().int().min(0).max(20).optional(),
      area: BaseValidators.positiveNumber.optional(),
      type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']).optional(),
      images: BaseValidators.stringArray.optional(),
      features: BaseValidators.stringArray.optional(),
      status: BaseValidators.propertyStatus.optional(),
    }).partial(),

    search: z.object({
      search: z.string().max(100).optional(),
      minPrice: BaseValidators.nonNegativeNumber.optional(),
      maxPrice: BaseValidators.positiveNumber.optional(),
      minArea: BaseValidators.positiveNumber.optional(),
      maxArea: BaseValidators.positiveNumber.optional(),
      bedrooms: z.number().int().min(0).optional(),
      bathrooms: z.number().int().min(0).optional(),
      type: z.enum(['HOUSE', 'APARTMENT', 'OFFICE', 'WAREHOUSE', 'LAND', 'COMMERCIAL']).optional(),
      city: BaseValidators.name.optional(),
      commune: BaseValidators.name.optional(),
      status: BaseValidators.propertyStatus.optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10),
    }).partial(),
  },

  // Contrato
  contract: {
    create: z.object({
      propertyId: BaseValidators.id,
      tenantId: BaseValidators.id,
      startDate: BaseValidators.dateString,
      endDate: BaseValidators.dateString,
      rentAmount: BaseValidators.positiveNumber,
      depositAmount: BaseValidators.nonNegativeNumber,
      terms: z.string().max(5000).optional(),
    }).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
      path: ['endDate'],
    }).refine((data) => new Date(data.startDate) > new Date(), {
      message: 'La fecha de inicio debe ser futura',
      path: ['startDate'],
    }),

    update: z.object({
      startDate: BaseValidators.dateString.optional(),
      endDate: BaseValidators.dateString.optional(),
      rentAmount: BaseValidators.positiveNumber.optional(),
      depositAmount: BaseValidators.nonNegativeNumber.optional(),
      status: BaseValidators.contractStatus.optional(),
      terms: z.string().max(5000).optional(),
    }).partial(),
  },

  // Pago
  payment: {
    create: z.object({
      contractId: BaseValidators.id,
      amount: BaseValidators.positiveNumber,
      dueDate: BaseValidators.dateString,
      method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER', 'KHIPU']).optional(),
      description: z.string().max(500).optional(),
    }),

    update: z.object({
      amount: BaseValidators.positiveNumber.optional(),
      dueDate: BaseValidators.dateString.optional(),
      status: BaseValidators.paymentStatus.optional(),
      method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER', 'KHIPU']).optional(),
      description: z.string().max(500).optional(),
      notes: z.string().max(1000).optional(),
    }).partial(),
  },

  // Reembolso
  refund: {
    create: z.object({
      contractId: BaseValidators.id,
      amount: BaseValidators.positiveNumber,
      reason: z.string().min(1, 'Motivo requerido'),
      description: BaseValidators.description,
      documents: BaseValidators.stringArray,
      bankAccount: z.object({
        accountNumber: z.string().min(1, 'Número de cuenta requerido'),
        accountType: z.enum(['checking', 'savings']),
        bankName: z.string().min(1, 'Nombre del banco requerido'),
        rut: z.string().min(1, 'RUT requerido'),
      }).optional(),
    }),

    update: z.object({
      status: BaseValidators.refundStatus,
      adminNotes: z.string().max(1000).optional(),
      rejectionReason: z.string().max(1000).optional(),
    }),

    partialUpdate: z.object({
      description: BaseValidators.description,
      documents: BaseValidators.stringArray,
      bankAccount: z.object({
        accountNumber: z.string().min(1),
        accountType: z.enum(['checking', 'savings']),
        bankName: z.string().min(1),
        rut: z.string().min(1),
      }).optional(),
    }).partial(),
  },

  // Causa Legal
  legalCase: {
    create: z.object({
      contractId: BaseValidators.id,
      caseType: z.enum(['rent_arrears', 'property_damage', 'contract_breach', 'eviction', 'other']),
      description: z.string().min(10, 'Descripción muy corta').max(2000),
      amount: BaseValidators.positiveNumber,
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      estimatedDuration: z.number().int().positive().max(365),
      legalBasis: z.string().min(10).max(1000),
      requestedActions: z.array(z.string().min(1)).min(1),
      documents: BaseValidators.stringArray,
      evidence: BaseValidators.stringArray,
      notes: z.string().max(1000).optional(),
    }),

    update: z.object({
      status: BaseValidators.legalCaseStatus,
      adminNotes: z.string().max(1000).optional(),
      rejectionReason: z.string().max(1000).optional(),
      assignedLawyer: BaseValidators.id.optional(),
      nextHearingDate: BaseValidators.dateString.optional(),
      courtCaseNumber: z.string().max(100).optional(),
    }),

    partialUpdate: z.object({
      description: z.string().min(10).max(2000).optional(),
      documents: BaseValidators.stringArray.optional(),
      evidence: BaseValidators.stringArray.optional(),
      notes: z.string().max(1000).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    }).partial(),
  },

  // Firma Electrónica
  signature: {
    create: z.object({
      documentId: BaseValidators.id,
      documentName: BaseValidators.name,
      signers: z.array(z.object({
        email: BaseValidators.email,
        name: BaseValidators.name,
        role: z.string().min(1),
      })).min(1, 'Al menos un firmante requerido'),
      expiresAt: BaseValidators.dateString,
      callbackUrl: BaseValidators.url,
      metadata: z.record(z.unknown()).optional(),
    }),

    status: z.object({
      signatureId: BaseValidators.id,
    }),
  },

  // Notificación
  notification: {
    create: z.object({
      userId: BaseValidators.id,
      type: z.enum([
        'PAYMENT_REMINDER', 'CONTRACT_EXPIRING', 'NEW_MESSAGE',
        'CONTRACT_SIGNED', 'PAYMENT_RECEIVED', 'MAINTENANCE_REQUEST',
        'RATING_RECEIVED', 'SYSTEM_UPDATE', 'REFUND_REQUEST',
        'LEGAL_CASE_CREATED', 'LEGAL_CASE_STATUS_UPDATE'
      ]),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(1000),
      data: z.record(z.unknown()).optional(),
    }),
  },

  // Configuración del sistema
  systemSetting: {
    create: z.object({
      key: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/, 'Clave inválida'),
      value: z.string().min(1),
      description: z.string().max(500).optional(),
      category: z.enum(['system', 'integration', 'security', 'email', 'payment', 'signature', 'maps', 'sms']),
      isEncrypted: BaseValidators.boolean,
      isPublic: BaseValidators.boolean,
    }),

    update: z.object({
      value: z.string().optional(),
      description: z.string().max(500).optional(),
      category: z.enum(['system', 'integration', 'security', 'email', 'payment', 'signature', 'maps', 'sms']).optional(),
      isEncrypted: BaseValidators.boolean.optional(),
      isPublic: BaseValidators.boolean.optional(),
    }).partial(),
  },

  // Backup
  backup: {
    create: z.object({
      type: z.enum(['manual', 'daily', 'weekly', 'monthly']).default('manual'),
    }),

    config: z.object({
      enabled: BaseValidators.boolean,
      schedule: z.object({
        daily: BaseValidators.boolean,
        weekly: BaseValidators.boolean,
        monthly: BaseValidators.boolean,
        customCron: z.string().optional(),
      }),
      retention: z.object({
        daily: z.number().int().min(1).max(365),
        weekly: z.number().int().min(1).max(52),
        monthly: z.number().int().min(1).max(120),
      }),
      compression: BaseValidators.boolean,
      encryption: BaseValidators.boolean,
    }),

    restore: z.object({
      backupId: BaseValidators.id,
    }),
  },

  // Query parameters comunes
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  filters: z.object({
    status: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    priority: z.string().optional(),
    search: z.string().max(100).optional(),
    startDate: BaseValidators.dateString.optional(),
    endDate: BaseValidators.dateString.optional(),
    minAmount: BaseValidators.nonNegativeNumber.optional(),
    maxAmount: BaseValidators.positiveNumber.optional(),
  }),
};

// Función helper para validar datos con logging
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string = 'validation'
): T {
  try {
    const result = schema.parse(data);

    logger.info('Data validation successful', {
      context: `${context}.success`,
      dataType: schema._def.typeName,
    });

    return result;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.issues.map(err => ({
        field: Array.isArray(err.path) ? err.path.join('.') : String(err.path),
        message: err.message,
        code: err.code,
      }));

      logger.warn('Data validation failed', {
        context: `${context}.failed`,
        errors: errorDetails,
        data: JSON.stringify(data).substring(0, 500), // Limitar tamaño del log
      });

      throw new ValidationError(`Validation failed: ${error.issues[0]?.message || 'Unknown error'}`, error.issues);
    }

    logger.error('Unexpected validation error', {
      context: `${context}.error`,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

// Error personalizado para validaciones
export class ValidationError extends Error {
  public readonly errors: z.ZodIssue[];

  constructor(message: string, errors: z.ZodIssue[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Middleware de validación para APIs
export function createValidationMiddleware(schema: z.ZodSchema) {
  return async (request: Request) => {
    try {
      let data: unknown;

      if (request.method === 'GET') {
        const url = new URL(request.url);
        data = Object.fromEntries(url.searchParams.entries());
      } else {
        data = await request.json();
      }

      return validateData(schema, data, 'api.validation');
    } catch (error) {
      throw error;
    }
  };
}

// Función para sanitizar strings (prevenir XSS)
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

// Función para validar y sanitizar emails
export function sanitizeEmail(email: string): string {
  const sanitized = email.toLowerCase().trim();
  // Validar formato básico
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new ValidationError('Formato de email inválido');
  }
  return sanitized;
}

// Función para validar números con límites de seguridad
export function validateNumber(
  value: unknown,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): number {
  const { min, max, integer = false, positive = false } = options;

  if (typeof value !== 'number' && typeof value !== 'string') {
    throw new ValidationError('Valor debe ser un número');
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    throw new ValidationError('Valor numérico inválido');
  }

  if (integer && !Number.isInteger(num)) {
    throw new ValidationError('Valor debe ser un número entero');
  }

  if (positive && num <= 0) {
    throw new ValidationError('Valor debe ser positivo');
  }

  if (min !== undefined && num < min) {
    throw new ValidationError(`Valor debe ser mayor o igual a ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new ValidationError(`Valor debe ser menor o igual a ${max}`);
  }

  return num;
}

// Función para validar IDs de MongoDB/ObjectId
export function validateObjectId(id: string): string {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  if (!objectIdRegex.test(id)) {
    throw new ValidationError('ID inválido');
  }
  return id;
}

// Función para validar RUT chileno
export function validateRUT(rut: string): string {
  const cleaned = rut.replace(/[^0-9kK]/g, '');

  if (cleaned.length < 8 || cleaned.length > 9) {
    throw new ValidationError('RUT inválido: longitud incorrecta');
  }

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    const digit = body[i];
    if (digit && /^\d$/.test(digit)) {
      sum += parseInt(digit) * multiplier;
    } else {
      throw new ValidationError('RUT inválido: carácter no numérico en el cuerpo');
    }
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDV = 11 - (sum % 11);
  const calculatedDV = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString();

  if (calculatedDV !== dv) {
    throw new ValidationError('RUT inválido: dígito verificador incorrecto');
  }

  return cleaned;
}

// Función para validar fechas con formato específico
export function validateDate(date: string, format: 'ISO' | 'DD/MM/YYYY' = 'ISO'): Date {
  let parsedDate: Date;

  if (format === 'DD/MM/YYYY') {
    const parts = date.split('/');
    if (parts.length !== 3) {
      throw new ValidationError('Formato de fecha inválido (esperado: DD/MM/YYYY)');
    }
    parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
  } else {
    parsedDate = new Date(date);
  }

  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError('Fecha inválida');
  }

  return parsedDate;
}
