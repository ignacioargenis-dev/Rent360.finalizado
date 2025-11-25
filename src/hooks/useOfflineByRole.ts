// Hooks especializados de offline por rol
// Incluye soporte completo para RUNNER, SUPPORT y MAINTENANCE_PROVIDER
'use client';

import { useCallback } from 'react';
import { useOfflineV2 } from './useOfflineV2';
import { indexedDBService } from '@/lib/offline/indexeddb-service';
import { logger } from '@/lib/logger-minimal';

// ==================== RUNNER360 ====================
export interface RunnerDelivery {
  id: string;
  propertyId: string;
  contractId?: string;
  type: 'DOCUMENT' | 'KEY' | 'PAYMENT' | 'SIGNATURE' | 'INSPECTION' | 'OTHER';
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';
  pickupAddress: string;
  deliveryAddress: string;
  recipientName: string;
  recipientPhone: string;
  notes?: string;
  scheduledDate: Date;
  completedDate?: Date;
  signature?: string; // Base64 signature
  photo?: string; // Base64 photo
  gpsLocation?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
}

export function useRunnerOffline() {
  const offline = useOfflineV2();

  // Crear entrega offline
  const createDelivery = useCallback(
    async (delivery: Omit<RunnerDelivery, 'id'>): Promise<string> => {
      logger.info('useRunnerOffline: Creating delivery offline', { delivery });

      const deliveryData = {
        ...delivery,
        createdAt: new Date().toISOString(),
        _isOffline: true,
      };

      return await offline.createOffline(
        'runner-deliveries',
        '/api/runner/deliveries',
        deliveryData
      );
    },
    [offline]
  );

  // Actualizar estado de entrega offline
  const updateDeliveryStatus = useCallback(
    async (
      deliveryId: string,
      status: RunnerDelivery['status'],
      data?: {
        completedDate?: Date;
        signature?: string;
        photo?: string;
        gpsLocation?: RunnerDelivery['gpsLocation'];
        notes?: string;
      }
    ): Promise<string> => {
      logger.info('useRunnerOffline: Updating delivery status offline', { deliveryId, status });

      const updateData = {
        id: deliveryId,
        status,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'runner-deliveries',
        `/api/runner/deliveries/${deliveryId}`,
        updateData
      );
    },
    [offline]
  );

  // Marcar entrega como completada (con firma y foto)
  const completeDelivery = useCallback(
    async (
      deliveryId: string,
      signature: string,
      photo?: string,
      gpsLocation?: RunnerDelivery['gpsLocation']
    ): Promise<string> => {
      const updateData: {
        signature: string;
        photo?: string;
        gpsLocation?: RunnerDelivery['gpsLocation'];
        completedDate: Date;
      } = {
        signature,
        completedDate: new Date(),
      };
      if (photo) {
        updateData.photo = photo;
      }
      if (gpsLocation) {
        updateData.gpsLocation = gpsLocation;
      }
      return await updateDeliveryStatus(deliveryId, 'DELIVERED', updateData);
    },
    [updateDeliveryStatus]
  );

  // Obtener entregas pendientes del cache
  const getPendingDeliveries = useCallback(async (): Promise<RunnerDelivery[]> => {
    const allDeliveries = await offline.getCachedData('runner-deliveries');
    return allDeliveries.filter(
      (d: RunnerDelivery) => d.status === 'PENDING' || d.status === 'IN_TRANSIT'
    );
  }, [offline]);

  // Obtener historial de entregas del cache
  const getDeliveryHistory = useCallback(async (): Promise<RunnerDelivery[]> => {
    return await offline.getCachedData('runner-deliveries');
  }, [offline]);

  return {
    ...offline,
    createDelivery,
    updateDeliveryStatus,
    completeDelivery,
    getPendingDeliveries,
    getDeliveryHistory,
  };
}

// ==================== SUPPORT ====================
export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  type: 'TECHNICAL' | 'BILLING' | 'ACCOUNT' | 'PROPERTY' | 'CONTRACT' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
  subject: string;
  description: string;
  attachments?: string[]; // URLs o base64
  assignedTo?: string;
  resolution?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export function useSupportOffline() {
  const offline = useOfflineV2();

  // Crear ticket offline
  const createTicket = useCallback(
    async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      logger.info('useSupportOffline: Creating ticket offline', { ticket });

      const ticketData = {
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _isOffline: true,
      };

      return await offline.createOffline('support-tickets', '/api/support/tickets', ticketData);
    },
    [offline]
  );

  // Actualizar ticket offline
  const updateTicket = useCallback(
    async (
      ticketId: string,
      updates: Partial<
        Pick<SupportTicket, 'status' | 'priority' | 'assignedTo' | 'resolution' | 'description'>
      >
    ): Promise<string> => {
      logger.info('useSupportOffline: Updating ticket offline', { ticketId, updates });

      const updateData = {
        id: ticketId,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'support-tickets',
        `/api/support/tickets/${ticketId}`,
        updateData
      );
    },
    [offline]
  );

  // Resolver ticket offline
  const resolveTicket = useCallback(
    async (ticketId: string, resolution: string): Promise<string> => {
      return await updateTicket(ticketId, {
        status: 'RESOLVED',
        resolution,
      });
    },
    [updateTicket]
  );

  // Cerrar ticket offline
  const closeTicket = useCallback(
    async (ticketId: string): Promise<string> => {
      const closeData = {
        id: ticketId,
        status: 'CLOSED' as const,
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'support-tickets',
        `/api/support/tickets/${ticketId}`,
        closeData
      );
    },
    [offline]
  );

  // Obtener tickets pendientes del cache
  const getPendingTickets = useCallback(async (): Promise<SupportTicket[]> => {
    const allTickets = await offline.getCachedData('support-tickets');
    return allTickets.filter(
      (t: SupportTicket) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
    );
  }, [offline]);

  // Obtener tickets por prioridad
  const getTicketsByPriority = useCallback(
    async (priority: SupportTicket['priority']): Promise<SupportTicket[]> => {
      const allTickets = await offline.getCachedData('support-tickets');
      return allTickets.filter((t: SupportTicket) => t.priority === priority);
    },
    [offline]
  );

  // Obtener historial de tickets
  const getTicketHistory = useCallback(async (): Promise<SupportTicket[]> => {
    return await offline.getCachedData('support-tickets');
  }, [offline]);

  return {
    ...offline,
    createTicket,
    updateTicket,
    resolveTicket,
    closeTicket,
    getPendingTickets,
    getTicketsByPriority,
    getTicketHistory,
  };
}

// ==================== MAINTENANCE PROVIDER ====================
export interface MaintenanceService {
  id: string;
  providerId: string;
  propertyId: string;
  contractId?: string;
  type: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'CLEANING' | 'PAINTING' | 'CARPENTRY' | 'OTHER';
  status: 'REQUESTED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  description: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDuration?: number; // hours
  actualDuration?: number; // hours
  scheduledDate?: Date;
  startDate?: Date;
  completionDate?: Date;
  photos?: string[]; // URLs or base64
  notes?: string;
  materials?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  customerSignature?: string;
  rating?: number;
  review?: string;
}

export function useMaintenanceProviderOffline() {
  const offline = useOfflineV2();

  // Aceptar servicio offline
  const acceptService = useCallback(
    async (
      serviceId: string,
      estimatedCost: number,
      estimatedDuration: number,
      scheduledDate: Date
    ): Promise<string> => {
      logger.info('useMaintenanceProviderOffline: Accepting service offline', { serviceId });

      const updateData = {
        id: serviceId,
        status: 'ACCEPTED' as const,
        estimatedCost,
        estimatedDuration,
        scheduledDate: scheduledDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'maintenance-services',
        `/api/maintenance-provider/services/${serviceId}`,
        updateData
      );
    },
    [offline]
  );

  // Iniciar servicio offline
  const startService = useCallback(
    async (serviceId: string): Promise<string> => {
      logger.info('useMaintenanceProviderOffline: Starting service offline', { serviceId });

      const updateData = {
        id: serviceId,
        status: 'IN_PROGRESS' as const,
        startDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'maintenance-services',
        `/api/maintenance-provider/services/${serviceId}`,
        updateData
      );
    },
    [offline]
  );

  // Completar servicio offline (con fotos y firma)
  const completeService = useCallback(
    async (
      serviceId: string,
      data: {
        actualCost: number;
        actualDuration: number;
        photos?: string[];
        notes?: string;
        materials?: MaintenanceService['materials'];
        customerSignature?: string;
      }
    ): Promise<string> => {
      logger.info('useMaintenanceProviderOffline: Completing service offline', { serviceId });

      const updateData = {
        id: serviceId,
        status: 'COMPLETED' as const,
        ...data,
        completionDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return await offline.updateOffline(
        'maintenance-services',
        `/api/maintenance-provider/services/${serviceId}`,
        updateData
      );
    },
    [offline]
  );

  // Agregar foto al servicio offline
  const addServicePhoto = useCallback(
    async (serviceId: string, photo: string): Promise<string> => {
      // Obtener el servicio actual del cache
      const service = await indexedDBService.getCachedAPIResponse(
        'maintenance-services',
        serviceId
      );

      if (!service) {
        throw new Error('Service not found in cache');
      }

      const updatedPhotos = [...(service.photos || []), photo];

      return await offline.updateOffline(
        'maintenance-services',
        `/api/maintenance-provider/services/${serviceId}`,
        {
          id: serviceId,
          photos: updatedPhotos,
          updatedAt: new Date().toISOString(),
        }
      );
    },
    [offline]
  );

  // Agregar nota al servicio offline
  const addServiceNote = useCallback(
    async (serviceId: string, note: string): Promise<string> => {
      const service = await indexedDBService.getCachedAPIResponse(
        'maintenance-services',
        serviceId
      );

      if (!service) {
        throw new Error('Service not found in cache');
      }

      const updatedNotes = service.notes ? `${service.notes}\n\n${note}` : note;

      return await offline.updateOffline(
        'maintenance-services',
        `/api/maintenance-provider/services/${serviceId}`,
        {
          id: serviceId,
          notes: updatedNotes,
          updatedAt: new Date().toISOString(),
        }
      );
    },
    [offline]
  );

  // Obtener servicios pendientes
  const getPendingServices = useCallback(async (): Promise<MaintenanceService[]> => {
    const allServices = await offline.getCachedData('maintenance-services');
    return allServices.filter(
      (s: MaintenanceService) =>
        s.status === 'REQUESTED' || s.status === 'ACCEPTED' || s.status === 'IN_PROGRESS'
    );
  }, [offline]);

  // Obtener servicios por prioridad
  const getServicesByPriority = useCallback(
    async (priority: MaintenanceService['priority']): Promise<MaintenanceService[]> => {
      const allServices = await offline.getCachedData('maintenance-services');
      return allServices.filter((s: MaintenanceService) => s.priority === priority);
    },
    [offline]
  );

  // Obtener historial de servicios
  const getServiceHistory = useCallback(async (): Promise<MaintenanceService[]> => {
    return await offline.getCachedData('maintenance-services');
  }, [offline]);

  return {
    ...offline,
    acceptService,
    startService,
    completeService,
    addServicePhoto,
    addServiceNote,
    getPendingServices,
    getServicesByPriority,
    getServiceHistory,
  };
}

// ==================== OWNER ====================
export function useOwnerOffline() {
  const offline = useOfflineV2();

  // Crear propiedad offline
  const createProperty = useCallback(
    async (property: any): Promise<string> => {
      return await offline.createOffline('properties', '/api/owner/properties', property);
    },
    [offline]
  );

  // Actualizar propiedad offline
  const updateProperty = useCallback(
    async (propertyId: string, updates: any): Promise<string> => {
      return await offline.updateOffline('properties', `/api/owner/properties/${propertyId}`, {
        id: propertyId,
        ...updates,
      });
    },
    [offline]
  );

  // Solicitar mantenimiento offline
  const requestMaintenance = useCallback(
    async (maintenanceData: any): Promise<string> => {
      return await offline.createOffline('maintenance', '/api/owner/maintenance', maintenanceData);
    },
    [offline]
  );

  return {
    ...offline,
    createProperty,
    updateProperty,
    requestMaintenance,
  };
}

// ==================== TENANT ====================
export function useTenantOffline() {
  const offline = useOfflineV2();

  // Reportar problema offline
  const reportIssue = useCallback(
    async (issueData: any): Promise<string> => {
      return await offline.createOffline('maintenance', '/api/tenant/maintenance', issueData);
    },
    [offline]
  );

  // Guardar búsqueda offline
  const saveSearch = useCallback(async (searchData: any): Promise<void> => {
    const saved = localStorage.getItem('savedSearches');
    const searches = saved ? JSON.parse(saved) : [];
    searches.push({ ...searchData, savedAt: new Date().toISOString() });
    localStorage.setItem('savedSearches', JSON.stringify(searches));
  }, []);

  return {
    ...offline,
    reportIssue,
    saveSearch,
  };
}

// ==================== BROKER ====================
export function useBrokerOffline() {
  const offline = useOfflineV2();

  // Crear prospecto offline
  const createProspect = useCallback(
    async (prospectData: any): Promise<string> => {
      return await offline.createOffline('properties', '/api/broker/prospects', prospectData);
    },
    [offline]
  );

  // Actualizar prospecto offline
  const updateProspect = useCallback(
    async (prospectId: string, updates: any): Promise<string> => {
      return await offline.updateOffline('properties', `/api/broker/prospects/${prospectId}`, {
        id: prospectId,
        ...updates,
      });
    },
    [offline]
  );

  return {
    ...offline,
    createProspect,
    updateProspect,
  };
}
