// Re-exportar todos los tipos desde el archivo principal
export * from '../types';

// Tipos adicionales específicos pueden ir aquí si es necesario
export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  ssl?: boolean;
}

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
}

export interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  concurrency: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  alerts: {
    enabled: boolean;
    email: string[];
  };
}

// Tipos para respuestas HTTP
export interface HttpResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
  message?: string;
  headers?: Record<string, string>;
}

export interface PaginatedHttpResponse<T> extends HttpResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para middleware
export interface MiddlewareContext {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  requestId: string;
  startTime: number;
  ip: string;
  userAgent: string;
}

// Tipos para validación de formularios
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

export interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Tipos para uploads de archivos
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  mimeType?: string;
  size?: number;
  name?: string;
}

// Tipos para geolocalización
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationResult {
  coordinates: Coordinates;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

// Tipos para notificaciones push
export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any> | undefined;
}

// Tipos para WebSocket
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: Date;
  userId?: string;
  room?: string;
}

// Tipos para reportes
export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  propertyId?: string;
  contractId?: string;
  status?: string;
}

export interface ReportData {
  summary: Record<string, any>;
  details: any[];
  generatedAt: Date;
  filters: ReportFilter;
}

// Tipos para configuración de email
export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
  templates: {
    welcome: string;
    passwordReset: string;
    contractSigned: string;
  };
}

// Tipos para configuración de pagos
export interface PaymentConfig {
  providers: {
    stripe?: {
      publicKey: string;
      secretKey: string;
      webhookSecret: string;
    };
    paypal?: {
      clientId: string;
      clientSecret: string;
    };
    khipu?: {
      secret: string;
      receiverId: string;
    };
  };
  currency: string;
  commission: number;
}

// Tipos para configuración de firma electrónica
export interface SignatureConfig {
  providers: {
    trustfactory?: {
      apiKey: string;
      apiSecret: string;
      certificateId: string;
    };
    firmapro?: {
      apiKey: string;
      apiSecret: string;
      certificateId: string;
    };
  };
  defaultProvider: string;
  expirationDays: number;
}

// Tipos para configuración de IA
export interface AIConfig {
  openai?: {
    apiKey: string;
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
  google?: {
    apiKey: string;
    model: string;
  };
  enabled: boolean;
}
