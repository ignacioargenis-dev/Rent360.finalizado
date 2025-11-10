// Tipos compartidos para la aplicación Rent360

// Enums de base de datos
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  BROKER = 'BROKER',
  RUNNER = 'RUNNER',
  SUPPORT = 'SUPPORT',
  MAINTENANCE = 'MAINTENANCE',
  PROVIDER = 'PROVIDER',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export enum PropertyStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  PENDING = 'PENDING',
  MAINTENANCE = 'MAINTENANCE',
}

export enum PropertyType {
  APARTMENT = 'APARTMENT',
  HOUSE = 'HOUSE',
  STUDIO = 'STUDIO',
  ROOM = 'ROOM',
  COMMERCIAL = 'COMMERCIAL',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// Interfaces comunes
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string | undefined;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatar?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  city: string;
  commune: string;
  region: string;
  price: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  type: PropertyType;
  status: PropertyStatus;
  ownerId: string;
  images?: string[];
  features?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  contractNumber: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  brokerId?: string | undefined;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: ContractStatus;
  terms?: string | undefined;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  contractId: string;
  payerId?: string | undefined;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  method?: string | undefined;
  transactionId?: string;
  notes?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para servicios
export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string | undefined;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string | undefined;
  url?: string | undefined;
  error?: string;
}

// Tipos para notificaciones
export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any> | undefined;
  isRead: boolean;
  createdAt: Date;
}

// Tipos para búsqueda y filtros
export interface SearchFilters {
  query?: string | undefined;
  city?: string | undefined;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  propertyType?: PropertyType;
  features?: string[];
  page?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Tipos para errores
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'No autorizado') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Acceso denegado') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado`, 404);
  }
}

// Tipos para configuración
export interface AppConfig {
  database: {
    url: string;
    maxConnections: number;
  };
  jwt: {
    secret: string;
    refreshSecret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  email: {
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
  };
  storage: {
    provider: 'local' | 's3' | 'gcs';
    bucket?: string | undefined;
    region?: string | undefined;
    credentials?: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
}

// Tipos para logs y auditoría
export interface AuditLog {
  id: string;
  userId?: string | undefined;
  action: string;
  entityType: string;
  entityId?: string | undefined;
  oldValues?: Record<string, any> | undefined;
  newValues?: Record<string, any> | undefined;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  createdAt: Date;
}

export interface SystemLog {
  id: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;
  data?: Record<string, any> | undefined;
  timestamp: Date;
}

// Tipos para métricas y monitoreo
export interface SystemMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    free: number;
    external: number;
    rss: number;
  };
  cpu: {
    usage: number;
    loadAverage: number;
  };
  database: {
    connections: number;
    queryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
  };
  performance: {
    averageResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  };
}

// Tipos para firma electrónica
export enum SignatureType {
  ADVANCED = 'ADVANCED',
  QUALIFIED = 'QUALIFIED',
}

export enum SignatureStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface SignatureRequest {
  id: string;
  documentId: string;
  signers: Array<{
    email: string;
    name: string;
    rut?: string | undefined;
    role?: string | undefined;
  }>;
  type: SignatureType;
  status: SignatureStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Exportar todo
export * from './types/index';
