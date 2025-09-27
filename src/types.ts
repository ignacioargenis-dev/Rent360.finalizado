// Re-export tipos generados desde Prisma
export type {
  User,
  Property,
  Contract,
  Payment,
  Review,
  Message,
  Ticket,
  TicketComment,
  Visit,
  Maintenance,
  Notification,
  SystemSetting,
  EmailTemplate,
  AuditLog,
  Document,
  BankAccount,
  MaintenanceProvider,
  ServiceProvider,
  ProviderDocuments,
  ServiceJob,
  ProviderTransaction,
  PlatformConfig,
  SystemLog,
  ContractSignature,
} from '@prisma/client';

// Import explícito para resolver referencias circulares
import type { Contract as PrismaContract, Property as PrismaProperty, User as PrismaUser } from '@prisma/client';

// Definir enums locales ya que no están disponibles en @prisma/client
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

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  CHECK = 'CHECK',
  OTHER = 'OTHER',
  KHIPU = 'KHIPU',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum VisitStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export enum ServiceType {
  CLEANING = 'CLEANING',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  OTHER = 'OTHER',
}

export enum ProviderStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum ServiceJobStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ProviderType {
  MAINTENANCE = 'MAINTENANCE',
  SERVICE = 'SERVICE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}


export enum RefundStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

// Enum personalizado para UserRole (SQLite no soporta enums)
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  BROKER = 'BROKER',
  RUNNER = 'RUNNER',
  SUPPORT = 'SUPPORT',
  PROVIDER = 'PROVIDER',
  MAINTENANCE_PROVIDER = 'MAINTENANCE_PROVIDER',
  SERVICE_PROVIDER = 'SERVICE_PROVIDER'
}

// Tipos personalizados que no están en Prisma
export interface RecentActivity {
  id: string;
  type: 'user' | 'property' | 'payment' | 'ticket' | 'maintenance';
  title: string;
  description: string;
  date: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  pendingTickets: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
  activities: RecentActivity[];
}

export interface ContractWithDetails extends PrismaContract {
  property: PrismaProperty;
  tenant: PrismaUser;
  owner: PrismaUser;
  broker?: PrismaUser;
}

export interface PropertyWithDetails extends PrismaProperty {
  owner: PrismaUser;
  contracts: PrismaContract[];
}

export interface PaymentWithDetails extends Payment {
  contract: PrismaContract;
  payer: PrismaUser;
}

export interface TicketWithDetails extends Ticket {
  user: PrismaUser;
  assignee?: PrismaUser;
  comments: TicketComment[];
}

export interface MaintenanceWithDetails extends Maintenance {
  property: PrismaProperty;
  assignee?: PrismaUser;
  provider?: MaintenanceProvider;
}

// Tipos para formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'date' | 'checkbox' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null;
}

// Tipos para notificaciones
export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  channels: string[];
  priority: string;
  isActive: boolean;
  aiOptimized?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SmartNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: string;
  channels: string[];
  isRead: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para PWA
export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Tipos para AI
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any> | undefined;
}

export interface Recommendation {
  id: string;
  type: 'property' | 'service' | 'maintenance' | 'payment';
  title: string;
  description: string;
  confidence: number;
  data: Record<string, any>;
  createdAt: Date;
}

// Tipos para análisis predictivo
export interface PredictionData {
  date: string;
  value: number;
  confidence: number;
}

export interface AnalyticsMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  occupancyRate: number;
  averageRent: number;
  maintenanceCosts: number;
  tenantSatisfaction: number;
}

// Tipos para configuración
export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para auditoría
export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// Tipos para reportes
export interface ReportData {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  filters: Record<string, any>;
  generatedAt: Date;
  expiresAt: Date;
}

// Tipos para integraciones
export interface Integration {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  isActive: boolean;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para archivos
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

// Tipos para firmas electrónicas
export enum SignatureStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}


// Tipos para búsqueda
export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: SearchFilters;
}

// Tipos para paginación
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Tipos para autenticación
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  permissions: string[];
}

// Tipos para validación
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Tipos para caché
export interface CacheEntry<T = any> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  expiresAt: Date;
}

// Tipos para eventos
export interface SystemEvent {
  id: string;
  type: string;
  data: Record<string, any>;
  timestamp: Date;
  source: string;
}

// Tipos para métricas
export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricAggregation {
  name: string;
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;
  period: string;
  timestamp: Date;
}
