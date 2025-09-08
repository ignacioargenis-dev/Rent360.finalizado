import { z } from 'zod';

// Validaciones sanitizadas para entrada de usuario
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres HTML básicos
    .replace(/javascript:/gi, '') // Remover protocolos peligrosos
    .replace(/on\w+\s*=/gi, '') // Remover event handlers
    .slice(0, 10000); // Limitar longitud
};

export const sanitizeEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return '';

  return email
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '') // Remover caracteres peligrosos
    .slice(0, 254); // RFC 5321 límite
};

export const sanitizePhone = (phone: string | undefined): string => {
  if (!phone || typeof phone !== 'string') return '';

  return phone
    .replace(/[^\d+\-\s()]/g, '') // Solo números, espacios, guiones, paréntesis y +
    .slice(0, 20); // Limitar longitud
};

export const sanitizeRUT = (rut: string | undefined): string => {
  if (!rut || typeof rut !== 'string') return '';

  return rut
    .replace(/[^\d\k]/g, '') // Solo números y k/K
    .toUpperCase()
    .slice(0, 12); // Formato: 12345678-9
};

// Esquemas de validación avanzados
export const userSchema = z.object({
  email: z.string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(254, 'Email demasiado largo')
    .transform(sanitizeEmail),

  password: z.string()
    .min(8, 'Contraseña debe tener al menos 8 caracteres')
    .max(128, 'Contraseña demasiado larga')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Contraseña debe contener mayúsculas, minúsculas y números'),

  firstName: z.string()
    .min(1, 'Nombre es requerido')
    .max(50, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nombre contiene caracteres inválidos')
    .transform(sanitizeInput),

  lastName: z.string()
    .min(1, 'Apellido es requerido')
    .max(50, 'Apellido demasiado largo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Apellido contiene caracteres inválidos')
    .transform(sanitizeInput),

  phone: z.string()
    .optional()
    .transform(sanitizePhone)
    .refine((val) => !val || val.length >= 8, 'Teléfono inválido'),

  rut: z.string()
    .optional()
    .transform(sanitizeRUT)
    .refine((val) => !val || /^\d{7,8}-[\dK]$/.test(val), 'RUT inválido'),
});

export const propertySchema = z.object({
  title: z.string()
    .min(1, 'Título es requerido')
    .max(200, 'Título demasiado largo')
    .transform(sanitizeInput),

  description: z.string()
    .max(2000, 'Descripción demasiado larga')
    .transform(sanitizeInput),

  price: z.number()
    .positive('Precio debe ser positivo')
    .max(999999999, 'Precio demasiado alto'),

  area: z.number()
    .positive('Área debe ser positiva')
    .max(10000, 'Área demasiado grande'),

  bedrooms: z.number()
    .int('Dormitorios debe ser entero')
    .min(0)
    .max(20),

  bathrooms: z.number()
    .min(0)
    .max(20),

  address: z.string()
    .min(1, 'Dirección es requerida')
    .max(300, 'Dirección demasiado larga')
    .transform(sanitizeInput),

  city: z.string()
    .min(1, 'Ciudad es requerida')
    .max(100, 'Ciudad demasiado larga')
    .transform(sanitizeInput),

  commune: z.string()
    .min(1, 'Comuna es requerida')
    .max(100, 'Comuna demasiado larga')
    .transform(sanitizeInput),
});

export const contractSchema = z.object({
  propertyId: z.string()
    .min(1, 'ID de propiedad requerido')
    .uuid('ID de propiedad inválido'),

  tenantId: z.string()
    .min(1, 'ID de inquilino requerido')
    .uuid('ID de inquilino inválido'),

  startDate: z.string()
    .datetime('Fecha de inicio inválida')
    .refine((date) => new Date(date) >= new Date(), 'Fecha de inicio debe ser futura'),

  endDate: z.string()
    .datetime('Fecha de término inválida'),

  monthlyRent: z.number()
    .positive('Renta mensual debe ser positiva')
    .max(99999999, 'Renta mensual demasiado alta'),

  deposit: z.number()
    .min(0, 'Depósito no puede ser negativo')
    .max(99999999, 'Depósito demasiado alto'),

  terms: z.string()
    .min(10, 'Términos demasiado cortos')
    .max(10000, 'Términos demasiado largos')
    .transform(sanitizeInput),
}).refine((data) => new Date(data.endDate) > new Date(data.startDate), {
  message: 'Fecha de término debe ser posterior a fecha de inicio',
  path: ['endDate'],
});

export const paymentSchema = z.object({
  contractId: z.string()
    .min(1, 'ID de contrato requerido')
    .uuid('ID de contrato inválido'),

  amount: z.number()
    .positive('Monto debe ser positivo')
    .max(99999999, 'Monto demasiado alto'),

  dueDate: z.string()
    .datetime('Fecha de vencimiento inválida'),

  description: z.string()
    .min(1, 'Descripción requerida')
    .max(500, 'Descripción demasiado larga')
    .transform(sanitizeInput),

  type: z.enum(['rent', 'deposit', 'utilities', 'maintenance', 'other']),
});

// Validadores de negocio
export const validateBusinessRules = {
  // Validar que la propiedad no esté ocupada para nuevas reservas
  async validatePropertyAvailability(propertyId: string, startDate: Date, endDate: Date): Promise<boolean> {
    // Implementar lógica de validación de disponibilidad
    return true; // Placeholder
  },

  // Validar capacidad financiera del inquilino
  async validateTenantFinancialCapacity(tenantId: string, monthlyRent: number): Promise<boolean> {
    // Implementar lógica de validación financiera
    return true; // Placeholder
  },

  // Validar cumplimiento de normativas locales
  async validateLocalRegulations(propertyData: any): Promise<boolean> {
    // Implementar validación de normativas locales
    return true; // Placeholder
  },

  // Validar límites de crédito para propietarios
  async validateOwnerCreditLimit(ownerId: string, propertyValue: number): Promise<boolean> {
    // Implementar validación de límites de crédito
    return true; // Placeholder
  },
};

// Función de validación general con sanitización
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: any
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Error de validación desconocido'] };
  }
}

// Middleware de validación para APIs
export function createValidationMiddleware(schema: z.ZodSchema) {
  return async (request: Request) => {
    try {
      const body = await request.json();
      const validation = validateAndSanitize(schema, body);

      if (!validation.success) {
        return new Response(
          JSON.stringify({
            success: false,
            errors: validation.errors,
            message: 'Datos de entrada inválidos'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Devolver datos validados y sanitizados
      return validation.data;
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error procesando datos de entrada'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}
