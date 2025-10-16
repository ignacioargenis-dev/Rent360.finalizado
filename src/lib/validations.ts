import { z } from 'zod';

// Esquemas de validación para usuarios
export const userSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  role: z.enum([
    'ADMIN',
    'OWNER',
    'TENANT',
    'BROKER',
    'RUNNER',
    'SUPPORT',
    'MAINTENANCE_PROVIDER',
    'SERVICE_PROVIDER',
  ]),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
  phone: z.string().optional(),
  avatar: z.string().optional(),
  lastLogin: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const userProfileSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Chile'),
  rut: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.record(z.string(), z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para propiedades
export const propertySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  address: z.string().min(5, 'Dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'Ciudad debe tener al menos 2 caracteres'),
  commune: z.string().min(2, 'Comuna debe tener al menos 2 caracteres'),
  region: z.string().min(2, 'Región debe tener al menos 2 caracteres'),
  price: z.number().positive('Precio debe ser positivo'),
  deposit: z.number().min(0, 'Depósito debe ser mayor o igual a 0'),
  bedrooms: z.number().int().min(0, 'Dormitorios debe ser un número entero positivo'),
  bathrooms: z.number().int().min(0, 'Baños debe ser un número entero positivo'),
  area: z.number().positive('Área debe ser positiva'),
  type: z.enum(['APARTMENT', 'HOUSE', 'STUDIO', 'ROOM', 'COMMERCIAL']),
  status: z.enum(['AVAILABLE', 'RENTED', 'PENDING', 'MAINTENANCE']).default('AVAILABLE'),
  ownerId: z.string(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),

  // Características adicionales
  furnished: z.boolean().default(false),
  petFriendly: z.boolean().default(false),
  parkingSpaces: z
    .number()
    .int()
    .min(0, 'Estacionamientos debe ser un número entero positivo')
    .default(0),
  availableFrom: z.date().optional(),
  floor: z.number().int().min(0, 'Piso debe ser un número entero positivo').optional(),
  buildingName: z.string().optional(),
  yearBuilt: z
    .number()
    .int()
    .min(1800, 'Año de construcción debe ser válido')
    .max(new Date().getFullYear(), 'Año de construcción no puede ser futuro')
    .optional(),
  heating: z.boolean().default(false),
  cooling: z.boolean().default(false),
  internet: z.boolean().default(false),
  elevator: z.boolean().default(false),
  balcony: z.boolean().default(false),
  terrace: z.boolean().default(false),
  garden: z.boolean().default(false),
  pool: z.boolean().default(false),
  gym: z.boolean().default(false),
  security: z.boolean().default(false),
  concierge: z.boolean().default(false),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para contratos
export const contractSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  tenantId: z.string(),
  ownerId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  rentAmount: z.number().positive('Monto de renta debe ser positivo'),
  depositAmount: z.number().min(0, 'Depósito debe ser mayor o igual a 0'),
  status: z.enum(['draft', 'pending', 'active', 'expired', 'terminated']).default('draft'),
  terms: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para pagos
export const paymentSchema = z.object({
  id: z.string().optional(),
  contractId: z.string(),
  amount: z.number().positive('Monto debe ser positivo'),
  type: z.enum(['rent', 'deposit', 'utility', 'maintenance', 'other']),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('pending'),
  dueDate: z.date(),
  paidDate: z.date().optional(),
  method: z.enum(['khipu', 'stripe', 'paypal', 'webpay', 'transfer']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para mantenimiento
export const maintenanceSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  reportedBy: z.string(),
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z
    .enum(['pending', 'assigned', 'in_progress', 'completed', 'cancelled'])
    .default('pending'),
  assignedTo: z.string().optional(),
  estimatedCost: z.number().min(0, 'Costo estimado debe ser mayor o igual a 0').optional(),
  actualCost: z.number().min(0, 'Costo real debe ser mayor o igual a 0').optional(),
  scheduledDate: z.date().optional(),
  completedDate: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para tickets
export const ticketSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(5, 'Título debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['technical', 'billing', 'general', 'bug', 'feature']).default('general'),
  reportedBy: z.string(),
  assignedTo: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para notificaciones
export const notificationSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  type: z.enum(['payment', 'maintenance', 'contract', 'message', 'system']),
  title: z.string().min(1, 'Título es requerido'),
  message: z.string().min(1, 'Mensaje es requerido'),
  data: z.record(z.string(), z.any()).optional(),
  isRead: z.boolean().default(false),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Esquemas de validación para autenticación
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
});

export const registerSchema = z
  .object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    role: z.enum([
      'ADMIN',
      'OWNER',
      'TENANT',
      'BROKER',
      'RUNNER',
      'SUPPORT',
      'PROVIDER',
      'MAINTENANCE',
    ]),
    // Campos obligatorios en Chile
    rut: z.string().min(1, 'RUT es obligatorio'),
    // Campos opcionales
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    commune: z.string().optional(),
    region: z.string().optional(),
    // Campos adicionales de contacto
    phoneSecondary: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Esquemas de validación para búsqueda
export const searchSchema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  bedrooms: z.number().int().min(0).optional(),
  propertyType: z.enum(['apartment', 'house', 'office', 'land', 'commercial']).optional(),
  features: z.array(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// Esquemas de validación para filtros
export const filterSchema = z.object({
  status: z.enum(['all', 'available', 'rented', 'maintenance']).default('all'),
  sortBy: z.enum(['price', 'date', 'area', 'bedrooms']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateRange: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
});

// Funciones de validación personalizadas
export const validateRut = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') {
    return false;
  }

  // Limpiar RUT
  const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();

  if (cleanRut.length < 2) {
    return false;
  }

  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  if (!/^\d+$/.test(body)) {
    return false;
  }

  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    const digit = body[i];
    if (digit && /^\d$/.test(digit)) {
      sum += parseInt(digit) * multiplier;
    } else {
      return false; // Carácter inválido
    }
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();

  return dv === calculatedDv;
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) {
    return false;
  }

  // Validar formato chileno: +56 9 1234 5678 o 9 1234 5678
  const phoneRegex = /^(\+56\s?)?9\s?\d{4}\s?\d{4}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateEmail = (email: string): boolean => {
  if (!email) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!password) {
    errors.push('Contraseña es requerida');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Contraseña debe contener al menos una mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Contraseña debe contener al menos una minúscula');
  }

  if (!/\d/.test(password)) {
    errors.push('Contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Contraseña debe contener al menos un carácter especial');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateAmount = (amount: number, min: number, max: number): boolean => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }

  return amount >= min && amount <= max;
};

// Esquemas de validación con validaciones personalizadas
export const userSchemaWithValidation = userSchema.extend({
  rut: z.string().refine(validateRut, 'RUT inválido').optional(),
  phone: z.string().refine(validatePhone, 'Teléfono inválido').optional(),
});

export const propertySchemaWithValidation = propertySchema.extend({
  price: z.number().positive('Precio debe ser positivo').max(100000000, 'Precio demasiado alto'),
  area: z.number().positive('Área debe ser positiva').max(10000, 'Área demasiado grande'),
});

// Tipos derivados de los esquemas
export type User = z.infer<typeof userSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type Property = z.infer<typeof propertySchema>;
export type Contract = z.infer<typeof contractSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Maintenance = z.infer<typeof maintenanceSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type FilterData = z.infer<typeof filterSchema>;
