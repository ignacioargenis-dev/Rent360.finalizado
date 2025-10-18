import { logger } from './logger-minimal';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 1000, defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Limpiar cache expirado cada minuto
    setInterval(() => {
      this.cleanExpired();
    }, 60 * 1000);
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Si el cache está lleno, eliminar el item más antiguo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, item);
    
    logger.debug('Cache set', { key, ttl: item.ttl });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      logger.debug('Cache miss', { key });
      return null;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }

    logger.debug('Cache hit', { key });
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug('Cache deleted', { key });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  private cleanExpired(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleaned', { expiredItems: cleaned });
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Método para obtener estadísticas del cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize) * 100
    };
  }
}

// Instancia global del cache
export const cache = new MemoryCache();

// Funciones de utilidad para cache con diferentes TTLs
export const cacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minuto
  MEDIUM: 5 * 60 * 1000,     // 5 minutos
  LONG: 15 * 60 * 1000,      // 15 minutos
  VERY_LONG: 60 * 60 * 1000, // 1 hora
};

// Función helper para generar claves de cache consistentes
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

// Función helper para cache con retry automático
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = cacheTTL.MEDIUM
): Promise<T> {
  // Intentar obtener del cache primero
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Si no está en cache, ejecutar la función
  try {
    const data = await fetcher();
    cache.set(key, data, ttl);
    return data;
  } catch (error) {
    logger.error('Error en withCache:', { key, error });
    throw error;
  }
}

// Función para invalidar cache por patrón
export function invalidateCachePattern(pattern: string): number {
  const keys = cache.keys();
  let invalidated = 0;

  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
      invalidated++;
    }
  }

  logger.debug('Cache invalidated by pattern', { pattern, invalidated });
  return invalidated;
}

// Función para cache de consultas de base de datos
export function getDBCacheKey(table: string, where: any, include?: any, orderBy?: any): string {
  const params = {
    table,
    where: JSON.stringify(where),
    include: include ? JSON.stringify(include) : undefined,
    orderBy: orderBy ? JSON.stringify(orderBy) : undefined,
  };

  return generateCacheKey(`db:${table}`, params);
}

// Función para cache de APIs
export function getAPICacheKey(endpoint: string, params: Record<string, any>): string {
  return generateCacheKey(`api:${endpoint}`, params);
}

// Función para cache de estadísticas
export function getStatsCacheKey(role: string, period: string, userId?: string): string {
  const params = { role, period, ...(userId && { userId }) };
  return generateCacheKey('stats', params);
}

// Función para cache de búsquedas
export function getSearchCacheKey(query: string, type: string, userId: string): string {
  const params = { query, type, userId };
  return generateCacheKey('search', params);
}

export default cache;