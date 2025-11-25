// Offline Queue Service - Gestión de acciones pendientes con sincronización automática
import { indexedDBService } from './indexeddb-service';
import { logger } from '@/lib/logger-minimal';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

export interface SyncResult {
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class OfflineQueueService {
  private isSyncing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 segundo

  // Agregar acción a la cola
  async enqueue(action: {
    type: 'CREATE' | 'UPDATE' | 'DELETE';
    resource: string;
    endpoint: string;
    data: any;
  }): Promise<string> {
    try {
      const id = await indexedDBService.addToQueue(action);
      logger.info('OfflineQueue: Action enqueued', { id, action });

      // Disparar evento personalizado
      this.dispatchQueueEvent('action-enqueued', { id, action });

      // Intentar sincronizar inmediatamente si está online
      if (navigator.onLine) {
        setTimeout(() => this.processQueue(), 0);
      }

      return id;
    } catch (error) {
      logger.error('OfflineQueue: Failed to enqueue action', { error, action });
      throw error;
    }
  }

  // Obtener todas las acciones pendientes
  async getQueue(): Promise<OfflineAction[]> {
    return await indexedDBService.getQueue();
  }

  // Obtener tamaño de la cola
  async getQueueSize(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  // Procesar cola de acciones
  async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.info('OfflineQueue: Sync already in progress');
      return { success: 0, failed: 0, errors: [] };
    }

    if (!navigator.onLine) {
      logger.info('OfflineQueue: Cannot sync while offline');
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    this.dispatchQueueEvent('sync-started');

    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    try {
      const queue = await this.getQueue();
      logger.info(`OfflineQueue: Processing ${queue.length} actions`);

      for (const action of queue) {
        try {
          // Verificar si ya se intentó demasiadas veces
          if (action.retries >= this.maxRetries) {
            logger.warn('OfflineQueue: Max retries reached', { action });
            result.failed++;
            result.errors.push({
              id: action.id,
              error: 'Max retries exceeded',
            });
            continue;
          }

          // Intentar sincronizar la acción
          await this.syncAction(action);

          // Si fue exitoso, eliminar de la cola
          await indexedDBService.removeFromQueue(action.id);
          result.success++;

          logger.info('OfflineQueue: Action synced successfully', { id: action.id });
          this.dispatchQueueEvent('action-synced', { id: action.id, action });
        } catch (error) {
          // Si falló, incrementar contador de reintentos
          const errorMessage = error instanceof Error ? error.message : String(error);
          await indexedDBService.updateQueueItem(action.id, {
            retries: action.retries + 1,
            error: errorMessage,
          });

          result.failed++;
          result.errors.push({
            id: action.id,
            error: errorMessage,
          });

          logger.error('OfflineQueue: Action sync failed', {
            id: action.id,
            error: errorMessage,
            retries: action.retries + 1,
          });
          this.dispatchQueueEvent('action-failed', {
            id: action.id,
            action,
            error: errorMessage,
          });
        }

        // Pequeño delay entre acciones para no sobrecargar el servidor
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }

      logger.info('OfflineQueue: Sync completed', result);
      this.dispatchQueueEvent('sync-completed', result);
    } catch (error) {
      logger.error('OfflineQueue: Sync process failed', { error });
      this.dispatchQueueEvent('sync-failed', { error });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // Sincronizar una acción específica
  private async syncAction(action: OfflineAction): Promise<void> {
    const { type, endpoint, data } = action;

    let method: string;
    switch (type) {
      case 'CREATE':
        method = 'POST';
        break;
      case 'UPDATE':
        method = 'PUT';
        break;
      case 'DELETE':
        method = 'DELETE';
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }

    const baseUrl = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_URL || '';
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true',
      },
      credentials: 'include',
    };
    if (type !== 'DELETE') {
      fetchOptions.body = JSON.stringify(data);
    }
    const response = await fetch(`${baseUrl}${endpoint}`, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Si fue exitoso, actualizar el cache con la respuesta
    if (type === 'CREATE' || type === 'UPDATE') {
      const responseData = await response.json();
      if (responseData.data) {
        await indexedDBService.cacheAPIResponse(
          action.resource,
          responseData.data.id || data.id,
          responseData.data
        );
      }
    }
  }

  // Eliminar una acción específica de la cola
  async removeAction(id: string): Promise<void> {
    try {
      await indexedDBService.removeFromQueue(id);
      logger.info('OfflineQueue: Action removed', { id });
      this.dispatchQueueEvent('action-removed', { id });
    } catch (error) {
      logger.error('OfflineQueue: Failed to remove action', { error, id });
      throw error;
    }
  }

  // Limpiar acciones fallidas que excedieron max retries
  async clearFailedActions(): Promise<number> {
    const queue = await this.getQueue();
    const failedActions = queue.filter(action => action.retries >= this.maxRetries);

    for (const action of failedActions) {
      await indexedDBService.removeFromQueue(action.id);
    }

    logger.info(`OfflineQueue: Cleared ${failedActions.length} failed actions`);
    return failedActions.length;
  }

  // Limpiar toda la cola
  async clearQueue(): Promise<void> {
    await indexedDBService.clear('offline-queue');
    logger.info('OfflineQueue: Queue cleared');
    this.dispatchQueueEvent('queue-cleared');
  }

  // Obtener estadísticas de la cola
  async getStats(): Promise<{
    total: number;
    pending: number;
    retrying: number;
    failed: number;
  }> {
    const queue = await this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(a => a.retries === 0).length,
      retrying: queue.filter(a => a.retries > 0 && a.retries < this.maxRetries).length,
      failed: queue.filter(a => a.retries >= this.maxRetries).length,
    };
  }

  // Eventos personalizados
  private dispatchQueueEvent(eventName: string, detail?: any): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const event = new CustomEvent(`offline-queue-${eventName}`, { detail });
      window.dispatchEvent(event);
    } catch (error) {
      logger.error('OfflineQueue: Failed to dispatch event', { error, eventName });
    }
  }

  // Configuración
  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  setRetryDelay(delay: number): void {
    this.retryDelay = delay;
  }
}

// Singleton instance
export const offlineQueueService = new OfflineQueueService();

// Auto-sync cuando se recupera la conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('OfflineQueue: Connection restored, starting auto-sync');
    offlineQueueService.processQueue().catch(error => {
      logger.error('OfflineQueue: Auto-sync failed', { error });
    });
  });

  // Sync periódico cada 5 minutos si está online
  setInterval(
    () => {
      if (navigator.onLine) {
        offlineQueueService.processQueue().catch(error => {
          logger.error('OfflineQueue: Periodic sync failed', { error });
        });
      }
    },
    5 * 60 * 1000
  ); // 5 minutos
}
