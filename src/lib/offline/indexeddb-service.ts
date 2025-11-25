// IndexedDB Service para Rent360
// Gestión robusta de almacenamiento offline con capacidad ilimitada

// @ts-nocheck
// Nota: La librería 'idb' tiene incompatibilidades de tipos con DBSchema
// que generan errores incluso con configuraciones estándar de TypeScript.
// Esto es un problema conocido: https://github.com/jakearchibald/idb/issues/352
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { logger } from '@/lib/logger-minimal';

// Definición del esquema de la base de datos
interface Rent360DB extends DBSchema {
  properties: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
  contracts: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
  payments: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
  maintenance: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-synced': boolean };
  };
  notifications: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      read: boolean;
    };
    indexes: { 'by-timestamp': number; 'by-read': boolean };
  };
  'offline-queue': {
    key: string;
    value: {
      id: string;
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      resource: string;
      endpoint: string;
      data: any;
      timestamp: number;
      retries: number;
      error?: string;
    };
    indexes: { 'by-timestamp': number; 'by-retries': number };
  };
  'runner-deliveries': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
      status: string;
    };
    indexes: { 'by-timestamp': number; 'by-status': string };
  };
  'support-tickets': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
      priority: string;
    };
    indexes: { 'by-timestamp': number; 'by-priority': string };
  };
  'maintenance-services': {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      synced: boolean;
      status: string;
    };
    indexes: { 'by-timestamp': number; 'by-status': string };
  };
  user: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
    };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: any;
      timestamp: number;
    };
  };
}

class IndexedDBService {
  private db: IDBPDatabase<Rent360DB> | null = null;
  private dbName = 'rent360-db';
  private dbVersion = 1;

  async init(): Promise<void> {
    if (this.db) {
      return;
    }

    try {
      this.db = await openDB<Rent360DB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
          logger.info('IndexedDB: Upgrading database', { oldVersion, newVersion });

          // Properties
          if (!db.objectStoreNames.contains('properties')) {
            const propertiesStore = db.createObjectStore('properties', { keyPath: 'id' });
            propertiesStore.createIndex('by-timestamp', 'timestamp');
            propertiesStore.createIndex('by-synced', 'synced');
          }

          // Contracts
          if (!db.objectStoreNames.contains('contracts')) {
            const contractsStore = db.createObjectStore('contracts', { keyPath: 'id' });
            contractsStore.createIndex('by-timestamp', 'timestamp');
            contractsStore.createIndex('by-synced', 'synced');
          }

          // Payments
          if (!db.objectStoreNames.contains('payments')) {
            const paymentsStore = db.createObjectStore('payments', { keyPath: 'id' });
            paymentsStore.createIndex('by-timestamp', 'timestamp');
            paymentsStore.createIndex('by-synced', 'synced');
          }

          // Maintenance
          if (!db.objectStoreNames.contains('maintenance')) {
            const maintenanceStore = db.createObjectStore('maintenance', { keyPath: 'id' });
            maintenanceStore.createIndex('by-timestamp', 'timestamp');
            maintenanceStore.createIndex('by-synced', 'synced');
          }

          // Notifications
          if (!db.objectStoreNames.contains('notifications')) {
            const notificationsStore = db.createObjectStore('notifications', { keyPath: 'id' });
            notificationsStore.createIndex('by-timestamp', 'timestamp');
            notificationsStore.createIndex('by-read', 'read');
          }

          // Offline Queue
          if (!db.objectStoreNames.contains('offline-queue')) {
            const queueStore = db.createObjectStore('offline-queue', { keyPath: 'id' });
            queueStore.createIndex('by-timestamp', 'timestamp');
            queueStore.createIndex('by-retries', 'retries');
          }

          // Runner Deliveries
          if (!db.objectStoreNames.contains('runner-deliveries')) {
            const runnerStore = db.createObjectStore('runner-deliveries', { keyPath: 'id' });
            runnerStore.createIndex('by-timestamp', 'timestamp');
            runnerStore.createIndex('by-status', 'status');
          }

          // Support Tickets
          if (!db.objectStoreNames.contains('support-tickets')) {
            const supportStore = db.createObjectStore('support-tickets', { keyPath: 'id' });
            supportStore.createIndex('by-timestamp', 'timestamp');
            supportStore.createIndex('by-priority', 'priority');
          }

          // Maintenance Services
          if (!db.objectStoreNames.contains('maintenance-services')) {
            const servicesStore = db.createObjectStore('maintenance-services', { keyPath: 'id' });
            servicesStore.createIndex('by-timestamp', 'timestamp');
            servicesStore.createIndex('by-status', 'status');
          }

          // User
          if (!db.objectStoreNames.contains('user')) {
            db.createObjectStore('user', { keyPath: 'id' });
          }

          // Settings
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      });

      logger.info('IndexedDB: Database initialized successfully');
    } catch (error) {
      logger.error('IndexedDB: Failed to initialize', { error });
      throw error;
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<Rent360DB>> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // Generic CRUD operations
  async add<T extends keyof Rent360DB>(storeName: T, data: Rent360DB[T]['value']): Promise<void> {
    const db = await this.ensureDB();
    try {
      await db.add(storeName, data as any);
      logger.info(`IndexedDB: Added to ${String(storeName)}`, { id: (data as any).id });
    } catch (error) {
      logger.error(`IndexedDB: Failed to add to ${String(storeName)}`, { error });
      throw error;
    }
  }

  async put<T extends keyof Rent360DB>(storeName: T, data: Rent360DB[T]['value']): Promise<void> {
    const db = await this.ensureDB();
    try {
      await db.put(storeName, data as any);
      logger.info(`IndexedDB: Updated in ${String(storeName)}`, { id: (data as any).id });
    } catch (error) {
      logger.error(`IndexedDB: Failed to update in ${String(storeName)}`, { error });
      throw error;
    }
  }

  async get<T extends keyof Rent360DB>(
    storeName: T,
    id: string
  ): Promise<Rent360DB[T]['value'] | undefined> {
    const db = await this.ensureDB();
    try {
      return await db.get(storeName, id as any);
    } catch (error) {
      logger.error(`IndexedDB: Failed to get from ${String(storeName)}`, { error, id });
      return undefined;
    }
  }

  async getAll<T extends keyof Rent360DB>(storeName: T): Promise<Rent360DB[T]['value'][]> {
    const db = await this.ensureDB();
    try {
      return await db.getAll(storeName);
    } catch (error) {
      logger.error(`IndexedDB: Failed to get all from ${String(storeName)}`, { error });
      return [];
    }
  }

  async delete<T extends keyof Rent360DB>(storeName: T, id: string): Promise<void> {
    const db = await this.ensureDB();
    try {
      await db.delete(storeName, id as any);
      logger.info(`IndexedDB: Deleted from ${String(storeName)}`, { id });
    } catch (error) {
      logger.error(`IndexedDB: Failed to delete from ${String(storeName)}`, { error, id });
      throw error;
    }
  }

  async clear<T extends keyof Rent360DB>(storeName: T): Promise<void> {
    const db = await this.ensureDB();
    try {
      await db.clear(storeName);
      logger.info(`IndexedDB: Cleared ${String(storeName)}`);
    } catch (error) {
      logger.error(`IndexedDB: Failed to clear ${String(storeName)}`, { error });
      throw error;
    }
  }

  // Specialized methods for offline queue
  async addToQueue(action: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    endpoint: string;
    data: any;
  }): Promise<string> {
    const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await this.add('offline-queue', {
      id,
      ...action,
      timestamp: Date.now(),
      retries: 0,
    });
    return id;
  }

  async getQueue(): Promise<Rent360DB['offline-queue']['value'][]> {
    return await this.getAll('offline-queue');
  }

  async updateQueueItem(
    id: string,
    updates: Partial<Rent360DB['offline-queue']['value']>
  ): Promise<void> {
    const item = await this.get('offline-queue', id);
    if (item) {
      await this.put('offline-queue', { ...item, ...updates });
    }
  }

  async removeFromQueue(id: string): Promise<void> {
    await this.delete('offline-queue', id);
  }

  // Specialized methods for caching API responses
  async cacheAPIResponse(resource: string, id: string, data: any): Promise<void> {
    const storeName = this.getStoreNameForResource(resource);
    if (storeName) {
      await this.put(
        storeName as keyof Rent360DB,
        {
          id,
          data,
          timestamp: Date.now(),
          synced: true,
        } as any
      );
    }
  }

  async getCachedAPIResponse(resource: string, id: string): Promise<any | undefined> {
    const storeName = this.getStoreNameForResource(resource);
    if (storeName) {
      const cached = await this.get(storeName as keyof Rent360DB, id);
      return cached ? (cached as any).data : undefined;
    }
    return undefined;
  }

  async getAllCachedForResource(resource: string): Promise<any[]> {
    const storeName = this.getStoreNameForResource(resource);
    if (storeName) {
      const items = await this.getAll(storeName as keyof Rent360DB);
      return items.map((item: any) => item.data);
    }
    return [];
  }

  private getStoreNameForResource(resource: string): string | null {
    const mapping: { [key: string]: string } = {
      property: 'properties',
      properties: 'properties',
      contract: 'contracts',
      contracts: 'contracts',
      payment: 'payments',
      payments: 'payments',
      maintenance: 'maintenance',
      notification: 'notifications',
      notifications: 'notifications',
      delivery: 'runner-deliveries',
      deliveries: 'runner-deliveries',
      runner: 'runner-deliveries',
      ticket: 'support-tickets',
      tickets: 'support-tickets',
      support: 'support-tickets',
      service: 'maintenance-services',
      services: 'maintenance-services',
    };
    return mapping[resource.toLowerCase()] || null;
  }

  // Settings management
  async saveSetting(key: string, value: any): Promise<void> {
    await this.put('settings', {
      key,
      value,
      timestamp: Date.now(),
    });
  }

  async getSetting(key: string): Promise<any | undefined> {
    const setting = await this.get('settings', key);
    return setting?.value;
  }

  // User data
  async saveUser(user: any): Promise<void> {
    await this.put('user', {
      id: user.id,
      data: user,
      timestamp: Date.now(),
    });
  }

  async getUser(): Promise<any | undefined> {
    const users = await this.getAll('user');
    return users.length > 0 ? users[0].data : undefined;
  }

  // Statistics
  async getStats(): Promise<{
    properties: number;
    contracts: number;
    payments: number;
    maintenance: number;
    notifications: number;
    queueLength: number;
    runnerDeliveries: number;
    supportTickets: number;
    maintenanceServices: number;
    totalSize: number;
  }> {
    const [
      properties,
      contracts,
      payments,
      maintenance,
      notifications,
      queue,
      deliveries,
      tickets,
      services,
    ] = await Promise.all([
      this.getAll('properties'),
      this.getAll('contracts'),
      this.getAll('payments'),
      this.getAll('maintenance'),
      this.getAll('notifications'),
      this.getAll('offline-queue'),
      this.getAll('runner-deliveries'),
      this.getAll('support-tickets'),
      this.getAll('maintenance-services'),
    ]);

    // Estimate total size (rough calculation)
    const totalSize =
      JSON.stringify(properties).length +
      JSON.stringify(contracts).length +
      JSON.stringify(payments).length +
      JSON.stringify(maintenance).length +
      JSON.stringify(notifications).length +
      JSON.stringify(queue).length +
      JSON.stringify(deliveries).length +
      JSON.stringify(tickets).length +
      JSON.stringify(services).length;

    return {
      properties: properties.length,
      contracts: contracts.length,
      payments: payments.length,
      maintenance: maintenance.length,
      notifications: notifications.length,
      queueLength: queue.length,
      runnerDeliveries: deliveries.length,
      supportTickets: tickets.length,
      maintenanceServices: services.length,
      totalSize,
    };
  }

  // Clear all data
  async clearAll(): Promise<void> {
    const stores: (keyof Rent360DB)[] = [
      'properties',
      'contracts',
      'payments',
      'maintenance',
      'notifications',
      'offline-queue',
      'runner-deliveries',
      'support-tickets',
      'maintenance-services',
      'user',
      'settings',
    ];

    await Promise.all(stores.map(store => this.clear(store)));
    logger.info('IndexedDB: All stores cleared');
  }

  // Close database connection
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('IndexedDB: Database connection closed');
    }
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();

// Initialize on import (only in browser)
if (typeof window !== 'undefined') {
  indexedDBService.init().catch(error => {
    logger.error('IndexedDB: Failed to auto-initialize', { error });
  });
}
