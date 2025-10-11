export type UserRole =
  | 'tenant'
  | 'owner'
  | 'broker'
  | 'runner'
  | 'support'
  | 'admin'
  | 'provider'
  | 'maintenance';

// Status and type enums
export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'PENDING' | 'MAINTENANCE' | 'INACTIVE';
export type PropertyType = 'HOUSE' | 'APARTMENT' | 'OFFICE' | 'WAREHOUSE' | 'LAND' | 'COMMERCIAL';
export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'TERMINATED'
  | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIAL' | 'OVERDUE';
export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CHECK'
  | 'OTHER'
  | 'KHIPU';

export type RatingContextType =
  | 'CONTRACT'
  | 'SERVICE'
  | 'MAINTENANCE'
  | 'PROPERTY_VISIT'
  | 'GENERAL'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  phoneSecondary?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;

  // Campos obligatorios en Chile
  rut?: string | null;
  rutVerified: boolean;

  // Campos opcionales de perfil
  dateOfBirth?: Date | null;
  gender?: string | null;
  nationality?: string | null;
  address?: string | null;
  city?: string | null;
  commune?: string | null;
  region?: string | null;

  role: UserRole;
  avatar?: string | null;
  bio?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified?: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Campos adicionales del modelo Prisma (opcionales para compatibilidad)
  bankAccount?: any;
  properties?: any[];
  propertyFavorites?: any[];
  contractsAsOwner?: any[];
  contractsAsTenant?: any[];
  contractsAsBroker?: any[];
  brokerProperties?: any[];
  createdProperties?: any[];
  payments?: any[];
  reviewsGiven?: any[];
  reviewsReceived?: any[];
  messagesSent?: any[];
  messagesReceived?: any[];
  tickets?: any[];
  assignedTickets?: any[];
  ticketComments?: any[];
  visitsAsRunner?: any[];
  visitsAsTenant?: any[];
  notifications?: any[];
  auditLogs?: any[];
  signatures?: any[];
  documents?: any[];
  maintenanceRequests?: any[];
  serviceJobRequests?: any[];
  scheduledVisits?: any[];
  maintenanceProvider?: any;
  serviceProvider?: any;
  runnerRatingsGiven?: any[];
  clientRatingsGiven?: any[];
  ratingsGiven?: any[];
  ratingsReceived?: any[];
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
  status: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'MAINTENANCE';
  images?: string[];
  features?: string[];
  views: number;
  inquiries: number;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  owner?: User;
}

export interface Contract {
  id: string;
  contractNumber: string;
  propertyId: string;
  ownerId: string;
  tenantId: string;
  brokerId?: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'CANCELLED';
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
  terminatedAt?: Date;
  property?: Property;
  owner?: User;
  tenant?: User;
  broker?: User;
  payments?: Payment[];
  reviews?: Review[];
}

export interface Payment {
  id: string;
  paymentNumber: string;
  contractId: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIAL';
  method?: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CHECK' | 'OTHER';
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  contract?: Contract;
}

export interface Review {
  id: string;
  propertyId?: string;
  contractId?: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  contract?: Contract;
  reviewer?: User;
  reviewee?: User;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject?: string;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'DELETED';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  sender?: User;
  receiver?: User;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  userId?: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  user?: User;
  assignee?: User;
  comments?: TicketComment[];
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface Document {
  id: string;
  userId: string;
  type:
    | 'id_front'
    | 'id_back'
    | 'criminal_record'
    | 'social_security'
    | 'property_deed'
    | 'residence_proof'
    | 'contract'
    | 'other';
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type:
    | 'PAYMENT_REMINDER'
    | 'CONTRACT_EXPIRING'
    | 'NEW_MESSAGE'
    | 'CONTRACT_SIGNED'
    | 'PAYMENT_RECEIVED'
    | 'MAINTENANCE_REQUEST'
    | 'RATING_RECEIVED'
    | 'SYSTEM_UPDATE';
  title: string;
  message: string;
  isRead: boolean;
  data?: string;
  createdAt: Date;
}

export interface Visit {
  id: string;
  propertyId: string;
  runnerId: string;
  tenantId?: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  property?: Property;
  runner?: User;
  tenant?: User;
}

export interface Availability {
  id: string;
  propertyId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

// Dashboard statistics interfaces
export interface DashboardStats {
  totalProperties: number;
  activeContracts: number;
  monthlyRevenue: number;
  totalUsers: number;
  pendingPayments: number;
  expiringContracts: number;
  averageRating: number;
}

export interface PropertySearchFilters {
  city?: string;
  commune?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  status?: 'AVAILABLE' | 'RENTED' | 'PENDING' | 'MAINTENANCE';
}

export interface AuthUser {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
