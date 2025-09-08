import { NextRequest } from 'next/server';
import { requireAuth, requireRole, requireAnyRole, DecodedToken } from './auth';
import { AuthorizationError } from './errors';

export interface ResourcePermissions {
  create: string[];
  read: string[];
  update: string[];
  delete: string[];
}

export interface AccessControlConfig {
  resource: string;
  permissions: ResourcePermissions;
  ownershipCheck?: (userId: string, resourceId: string) => Promise<boolean>;
}

// Define permissions for each resource type
export const RESOURCE_PERMISSIONS: Record<string, AccessControlConfig> = {
  // User permissions
  users: {
    resource: 'users',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
  },

  // Property permissions
  properties: {
    resource: 'properties',
    permissions: {
      create: ['admin', 'owner', 'broker'],
      read: ['admin', 'owner', 'broker', 'tenant'],
      update: ['admin', 'owner', 'broker'],
      delete: ['admin', 'owner'],
    },
    ownershipCheck: async (userId: string, propertyId: string) => {
      const { db } = await import('@/lib/db');
      const property = await db.property.findUnique({
        where: { id: propertyId },
        select: { ownerId: true },
      });
      return property?.ownerId === userId;
    },
  },

  // Contract permissions
  contracts: {
    resource: 'contracts',
    permissions: {
      create: ['admin', 'owner', 'broker'],
      read: ['admin', 'owner', 'broker', 'tenant'],
      update: ['admin', 'owner', 'broker'],
      delete: ['admin', 'owner'],
    },
    ownershipCheck: async (userId: string, contractId: string) => {
      const { db } = await import('@/lib/db');
      const contract = await db.contract.findUnique({
        where: { id: contractId },
        select: { ownerId: true, tenantId: true, brokerId: true },
      });
      return contract?.ownerId === userId || contract?.tenantId === userId || contract?.brokerId === userId;
    },
  },

  // Payment permissions
  payments: {
    resource: 'payments',
    permissions: {
      create: ['admin', 'owner', 'tenant'],
      read: ['admin', 'owner', 'broker', 'tenant'],
      update: ['admin', 'owner'],
      delete: ['admin'],
    },
    ownershipCheck: async (userId: string, paymentId: string) => {
      const { db } = await import('@/lib/db');
      const payment = await db.payment.findUnique({
        where: { id: paymentId },
        include: {
          contract: {
            select: { ownerId: true, tenantId: true, brokerId: true },
          },
        },
      });
      return payment?.contract.ownerId === userId || payment?.contract.tenantId === userId || payment?.contract.brokerId === userId;
    },
  },

  // Ticket permissions
  tickets: {
    resource: 'tickets',
    permissions: {
      create: ['admin', 'tenant', 'owner', 'broker'],
      read: ['admin', 'support', 'tenant', 'owner', 'broker'],
      update: ['admin', 'support'],
      delete: ['admin'],
    },
    ownershipCheck: async (userId: string, ticketId: string) => {
      const { db } = await import('@/lib/db');
      const ticket = await db.ticket.findUnique({
        where: { id: ticketId },
        select: { userId: true, assignedTo: true },
      });
      return ticket?.userId === userId || ticket?.assignedTo === userId;
    },
  },

  // Message permissions
  messages: {
    resource: 'messages',
    permissions: {
      create: ['admin', 'tenant', 'owner', 'broker', 'support', 'runner'],
      read: ['admin', 'tenant', 'owner', 'broker', 'support', 'runner'],
      update: ['admin'],
      delete: ['admin'],
    },
    ownershipCheck: async (userId: string, messageId: string) => {
      const { db } = await import('@/lib/db');
      const message = await db.message.findUnique({
        where: { id: messageId },
        select: { senderId: true, receiverId: true },
      });
      return message?.senderId === userId || message?.receiverId === userId;
    },
  },

  // Review permissions
  reviews: {
    resource: 'reviews',
    permissions: {
      create: ['admin', 'tenant', 'owner', 'broker'],
      read: ['admin', 'tenant', 'owner', 'broker'],
      update: ['admin'],
      delete: ['admin'],
    },
    ownershipCheck: async (userId: string, reviewId: string) => {
      const { db } = await import('@/lib/db');
      const review = await db.review.findUnique({
        where: { id: reviewId },
        select: { reviewerId: true, revieweeId: true },
      });
      return review?.reviewerId === userId || review?.revieweeId === userId;
    },
  },

  // System settings permissions
  settings: {
    resource: 'settings',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
  },

  // Audit logs permissions
  auditLogs: {
    resource: 'auditLogs',
    permissions: {
      create: ['admin'],
      read: ['admin'],
      update: ['admin'],
      delete: ['admin'],
    },
  },
};

export class AccessControl {
  private config: AccessControlConfig;

  constructor(resourceType: string) {
    const config = RESOURCE_PERMISSIONS[resourceType];
    if (!config) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    this.config = config;
  }

  async canCreate(request: NextRequest): Promise<DecodedToken> {
    const user = await requireAuth(request);
    this.checkPermission(user.role, this.config.permissions.create);
    return user;
  }

  async canRead(request: NextRequest): Promise<DecodedToken> {
    const user = await requireAuth(request);
    this.checkPermission(user.role, this.config.permissions.read);
    return user;
  }

  async canUpdate(request: NextRequest): Promise<DecodedToken> {
    const user = await requireAuth(request);
    this.checkPermission(user.role, this.config.permissions.update);
    return user;
  }

  async canDelete(request: NextRequest): Promise<DecodedToken> {
    const user = await requireAuth(request);
    this.checkPermission(user.role, this.config.permissions.delete);
    return user;
  }

  async canAccess(request: NextRequest, action: 'create' | 'read' | 'update' | 'delete'): Promise<DecodedToken> {
    const user = await requireAuth(request);
    this.checkPermission(user.role, this.config.permissions[action]);
    return user;
  }

  async checkOwnership(userId: string, resourceId: string): Promise<boolean> {
    if (!this.config.ownershipCheck) {
      return true; // No ownership check required
    }
    return this.config.ownershipCheck(userId, resourceId);
  }

  private checkPermission(userRole: string, allowedRoles: string[]): void {
    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError(`User with role ${userRole} cannot access this resource`);
    }
  }
}

// Helper functions for common access control scenarios
export function checkResourceAccess(resourceType: string, action: 'create' | 'read' | 'update' | 'delete') {
  return async (request: NextRequest, resourceId?: string): Promise<DecodedToken> => {
    const accessControl = new AccessControl(resourceType);
    const user = await accessControl.canAccess(request, action);

    // If resourceId is provided, check ownership
    if (resourceId) {
      const hasOwnership = await accessControl.checkOwnership(user.id, resourceId);
      if (!hasOwnership && user.role !== 'admin') {
        throw new AuthorizationError('You do not have permission to access this specific resource');
      }
    }

    return user;
  };
}

// Pre-defined access control middleware functions
export const canCreateUsers = checkResourceAccess('users', 'create');
export const canReadUsers = checkResourceAccess('users', 'read');
export const canUpdateUsers = checkResourceAccess('users', 'update');
export const canDeleteUsers = checkResourceAccess('users', 'delete');

export const canCreateProperties = checkResourceAccess('properties', 'create');
export const canReadProperties = checkResourceAccess('properties', 'read');
export const canUpdateProperties = checkResourceAccess('properties', 'update');
export const canDeleteProperties = checkResourceAccess('properties', 'delete');

export const canCreateContracts = checkResourceAccess('contracts', 'create');
export const canReadContracts = checkResourceAccess('contracts', 'read');
export const canUpdateContracts = checkResourceAccess('contracts', 'update');
export const canDeleteContracts = checkResourceAccess('contracts', 'delete');

export const canCreatePayments = checkResourceAccess('payments', 'create');
export const canReadPayments = checkResourceAccess('payments', 'read');
export const canUpdatePayments = checkResourceAccess('payments', 'update');
export const canDeletePayments = checkResourceAccess('payments', 'delete');

export const canCreateTickets = checkResourceAccess('tickets', 'create');
export const canReadTickets = checkResourceAccess('tickets', 'read');
export const canUpdateTickets = checkResourceAccess('tickets', 'update');
export const canDeleteTickets = checkResourceAccess('tickets', 'delete');

export const canCreateMessages = checkResourceAccess('messages', 'create');
export const canReadMessages = checkResourceAccess('messages', 'read');
export const canUpdateMessages = checkResourceAccess('messages', 'update');
export const canDeleteMessages = checkResourceAccess('messages', 'delete');

export const canCreateReviews = checkResourceAccess('reviews', 'create');
export const canReadReviews = checkResourceAccess('reviews', 'read');
export const canUpdateReviews = checkResourceAccess('reviews', 'update');
export const canDeleteReviews = checkResourceAccess('reviews', 'delete');

export const canReadSettings = checkResourceAccess('settings', 'read');
export const canUpdateSettings = checkResourceAccess('settings', 'update');

export const canReadAuditLogs = checkResourceAccess('auditLogs', 'read');

// Utility function to filter sensitive data based on user role
export function filterSensitiveData<T>(data: T, userRole: string): T {
  if (userRole === 'admin') {
    return data; // Admins can see everything
  }

  // Create a copy of the data to avoid modifying the original
  const filteredData = { ...data } as any;

  // Remove sensitive fields based on role
  const sensitiveFields = {
    password: true,
    // Add other sensitive fields as needed
  };

  Object.keys(sensitiveFields).forEach(field => {
    if (filteredData[field] !== undefined) {
      delete filteredData[field];
    }
  });

  // Role-specific filtering
  switch (userRole) {
    case 'tenant':
      // Tenants shouldn't see other tenants' personal information
      if (filteredData.email && !filteredData.email.includes(userRole)) {
        delete filteredData.email;
      }
      break;
    case 'owner':
    case 'broker':
      // Owners and brokers can see more information but still not everything
      break;
  }

  return filteredData;
}

// Utility function to check if user can access a specific property
export async function canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
  const { db } = await import('@/lib/db');
  
  // Admins can access everything
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (user?.role === 'ADMIN') {
    return true;
  }

  // Check if user owns the property
  const property = await db.property.findUnique({
    where: { id: propertyId },
    select: { ownerId: true },
  });
  
  if (property?.ownerId === userId) {
    return true;
  }

  // Check if user has a contract for the property
  const contract = await db.contract.findFirst({
    where: {
      propertyId,
      OR: [
        { tenantId: userId },
        { brokerId: userId },
      ],
    },
  });
  
  return !!contract;
}

// Utility function to check if user can access a specific contract
export async function canAccessContract(userId: string, contractId: string): Promise<boolean> {
  const { db } = await import('@/lib/db');
  
  // Admins can access everything
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  
  if (user?.role === 'ADMIN') {
    return true;
  }

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    select: { ownerId: true, tenantId: true, brokerId: true },
  });
  
  return contract?.ownerId === userId || 
         contract?.tenantId === userId || 
         contract?.brokerId === userId;
}
