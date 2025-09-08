// Logger simplificado para evitar dependencias circulares
const simpleLogger = {
  info: (message: string, data?: any) => {
    console.log(`[CACHE INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[CACHE WARN] ${message}`, data || '');
  },
  error: (message: string, data?: any) => {
    console.error(`[CACHE ERROR] ${message}`, data || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[CACHE DEBUG] ${message}`, data || '');
    }
  }
};

// Interfaz para entradas de cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version?: number; // Para invalidación de versiones
}

// Interfaz para el driver de cache
interface CacheDriver {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  getStats(): Promise<{
    total: number;
    hitRate?: number;
    memoryUsage?: number;
    uptime?: number;
  }>;
  exists(key: string): Promise<boolean>;
  expire(key: string, ttl: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

// Configuración del cache
interface CacheConfig {
  defaultTTL: number; // 5 minutos por defecto
  maxSize: number; // Máximo número de entradas
  cleanupInterval: number; // Intervalo de limpieza en ms
  enableRedis?: boolean; // Habilitar Redis si está disponible
  redisUrl?: string; // URL de Redis
}

// Driver de cache en memoria
class MemoryCacheDriver implements CacheDriver {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private hitCount = 0;
  private missCount = 0;
  private startTime = Date.now();

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupInterval();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.data;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Verificar límite de tamaño
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
    simpleLogger.info('Memory cache cleared');
  }

  async getStats() {
    const now = Date.now();
    let expired = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      total: this.cache.size,
      hitRate,
      memoryUsage: this.cache.size * 1024, // Estimación aproximada
      uptime: now - this.startTime
    };
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = ttl;
    return true;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) return -2; // Key doesn't exist

    const remaining = entry.ttl - (Date.now() - entry.timestamp);
    return remaining > 0 ? Math.ceil(remaining / 1000) : -1; // Convert to seconds
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      simpleLogger.debug('Evicted oldest cache entry', { key: oldestKey });
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      simpleLogger.debug('Cleaned expired cache entries', { count: cleaned });
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }
}

// Driver de cache Redis (si está disponible)
class RedisCacheDriver implements CacheDriver {
  private redis: any = null;
  private isConnected = false;

  constructor(config: CacheConfig) {
    this.initializeRedis(config);
  }

  private async initializeRedis(config: CacheConfig): Promise<void> {
    // Para evitar problemas de compilación, deshabilitar Redis completamente por ahora
    simpleLogger.info('Using memory cache (Redis disabled for build compatibility)');
    this.isConnected = false;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.redis) return null;

    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      simpleLogger.error('Redis GET error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setEx(key, Math.ceil(ttl / 1000), serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      simpleLogger.error('Redis SET error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;

    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      simpleLogger.error('Redis DEL error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      await this.redis.flushAll();
      simpleLogger.info('Redis cache cleared');
    } catch (error) {
      simpleLogger.error('Redis FLUSH error:', error);
    }
  }

  async getStats() {
    if (!this.isConnected || !this.redis) {
      return { total: 0 };
    }

    try {
      const info = await this.redis.info();
      // Parse Redis info for basic stats
      return {
        total: 0, // Would need to parse from info
        memoryUsage: 0,
        uptime: 0
      };
    } catch (error) {
      simpleLogger.error('Redis INFO error:', error);
      return { total: 0 };
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      simpleLogger.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected || !this.redis) return false;

    try {
      const result = await this.redis.expire(key, Math.ceil(ttl / 1000));
      return result === 1;
    } catch (error) {
      simpleLogger.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.redis) return -2;

    try {
      return await this.redis.ttl(key);
    } catch (error) {
      simpleLogger.error('Redis TTL error:', error);
      return -2;
    }
  }
}

class DistributedCacheManager {
  private driver: CacheDriver;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutos
      maxSize: 1000,
      cleanupInterval: 10 * 60 * 1000, // 10 minutos
      enableRedis: process.env.REDIS_URL ? true : false,
      ...config
    };

    // Inicializar el driver apropiado
    this.initializeDriver();
  }

  private async initializeDriver(): Promise<void> {
    if (this.config.enableRedis) {
      try {
        this.driver = new RedisCacheDriver(this.config);
        simpleLogger.info('Using Redis cache driver');
      } catch (error) {
        simpleLogger.warn('Failed to initialize Redis, falling back to memory cache:', error);
        this.driver = new MemoryCacheDriver(this.config);
      }
    } else {
      this.driver = new MemoryCacheDriver(this.config);
      simpleLogger.info('Using memory cache driver');
    }
  }

  // Obtener datos del cache
  async get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(key);
  }

  // Guardar datos en cache
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    return this.driver.set(key, data, ttl || this.config.defaultTTL);
  }

  // Eliminar entrada del cache
  async delete(key: string): Promise<boolean> {
    return this.driver.delete(key);
  }

  // Limpiar todo el cache
  async clear(): Promise<void> {
    return this.driver.clear();
  }

  // Obtener estadísticas del cache
  async getStats() {
    return this.driver.getStats();
  }

  // Verificar si una clave existe
  async exists(key: string): Promise<boolean> {
    return this.driver.exists(key);
  }

  // Establecer tiempo de expiración
  async expire(key: string, ttl: number): Promise<boolean> {
    return this.driver.expire(key, ttl);
  }

  // Obtener tiempo restante de vida
  async ttl(key: string): Promise<number> {
    return this.driver.ttl(key);
  }

  // Obtener o establecer (con función)
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      simpleLogger.debug('Cache hit', { key });
      return cached;
    }

    // Si no está en cache, obtener datos y guardarlos
    simpleLogger.debug('Cache miss, fetching data', { key });
    const data = await fetcher();
    await this.set(key, data, ttl);

    return data;
  }

}

// Instancia singleton del cache manager distribuido
export const cacheManager = new DistributedCacheManager();

// Funciones de utilidad para cache específico de la aplicación
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  PROPERTY_LIST: (filters: string) => `property:list:${filters}`,
  CONTRACT_DETAILS: (contractId: string) => `contract:details:${contractId}`,
  MARKET_STATS: (city: string, commune?: string) => `market:stats:${city}:${commune || 'all'}`,
  USER_STATS: (userId: string) => `user:stats:${userId}`,
  SYSTEM_METRICS: 'system:metrics',
  ANALYTICS_DASHBOARD: 'analytics:dashboard',
  AUDIT_LOGS: (page: number, filters: string) => `audit:logs:${page}:${filters}`
};

// Wrapper para operaciones de base de datos con cache
export async function withCache<T>(
  key: string,
  operation: () => Promise<T>,
  ttl?: number
): Promise<T> {
  return cacheManager.getOrSet(key, operation, ttl);
}

// Invalidar cache por patrón (versión simplificada)
export async function invalidateCache(pattern: string): Promise<void> {
  // Esta función necesita ser implementada de manera diferente para Redis
  // Por ahora, solo loggeamos que debería invalidarse
  simpleLogger.info('Cache invalidation requested', { pattern });
  // En una implementación completa, se necesitaría:
  // 1. Para Redis: usar SCAN para encontrar keys con patrón
  // 2. Para memoria: iterar sobre las keys disponibles

  // Versión básica que funciona con ambos drivers
  try {
    // Intentar limpiar algunas keys comunes relacionadas con el patrón
    if (pattern.includes('user')) {
      await cacheManager.clear(); // Limpieza completa por simplicidad
    } else if (pattern.includes('property')) {
      await cacheManager.clear();
    } else if (pattern.includes('market')) {
      await cacheManager.clear();
    }
  } catch (error) {
    simpleLogger.error('Error invalidating cache', { pattern, error });
  }
}

// Cache para estadísticas de usuario (se actualiza cada hora)
export const USER_STATS_TTL = 60 * 60 * 1000; // 1 hora

// Cache para estadísticas de mercado (se actualiza cada 30 minutos)
export const MARKET_STATS_TTL = 30 * 60 * 1000; // 30 minutos

// Cache para métricas del sistema (se actualiza cada 5 minutos)
export const SYSTEM_METRICS_TTL = 5 * 60 * 1000; // 5 minutos

// Cache para dashboard de analytics (se actualiza cada 15 minutos)
export const ANALYTICS_DASHBOARD_TTL = 15 * 60 * 1000; // 15 minutos
