import { logger } from './logger';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  size?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
  totalRequests: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  maxMemoryUsage: number;
  persistencePath?: string;
  persistenceInterval?: number;
  enablePersistence: boolean;
}

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    memoryUsage: 0,
    hitRate: 0,
    totalRequests: 0
  };
  private config: CacheConfig = {
    maxSize: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 minutos por defecto
    cleanupInterval: 60 * 1000, // 1 minuto
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    persistencePath: './cache',
    persistenceInterval: 5 * 60 * 1000, // 5 minutos
    enablePersistence: true
  };
  private cleanupInterval!: NodeJS.Timeout;
  private persistenceInterval!: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Iniciar limpieza automática
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);

    // Iniciar persistencia automática si está habilitada
    if (this.config.enablePersistence) {
      this.persistenceInterval = setInterval(() => {
        this.persistCache();
      }, this.config.persistenceInterval);

      // Cargar caché persistido al iniciar
      this.loadPersistedCache();
    }

    logger.info('Cache manager inicializado', { config: this.config });
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;

    // Verificar si hay espacio disponible
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 0,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.updateStats();
    
    logger.debug('Cache entry creada', { key, ttl: entryTTL });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.stats.totalRequests++;
      this.updateStats();
      return null;
    }

    const now = Date.now();
    
    // Verificar si ha expirado
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.totalRequests++;
      this.updateStats();
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = now;
    this.stats.hits++;
    this.stats.totalRequests++;
    // No llamar updateStats() aquí - se hace automáticamente por el setter

    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    
    // Verificar si ha expirado
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats();
      logger.debug('Cache entry eliminada', { key });
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.updateStats();
    logger.info('Cache limpiado completamente');
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache entry evictada por LRU', { key: oldestKey });
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      logger.debug('Cache cleanup completado', { 
        expiredEntries: expiredKeys.length,
        remainingEntries: this.cache.size
      });
    }

    this.updateStats();
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.memoryUsage = this.cache.size * 1024; // Estimación aproximada
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
  }

  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  // Métodos de utilidad para patrones comunes
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await fetchFn();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      logger.error('Error en getOrSet', { key, error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  // Cache con invalidación por tags
  private tagMap: Map<string, Set<string>> = new Map();

  setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): void {
    this.set(key, value, ttl);
    
    tags.forEach(tag => {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    });
  }

  invalidateByTag(tag: string): void {
    const keys = this.tagMap.get(tag);
    
    if (keys) {
      keys.forEach(key => this.delete(key));
      this.tagMap.delete(tag);
      logger.debug('Cache invalidado por tag', { tag, keysCount: keys.size });
    }
  }

  // Cache con compresión para valores grandes
  private compressValue<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private decompressValue<T>(compressed: string): T {
    try {
      return JSON.parse(compressed);
    } catch {
      return compressed as T;
    }
  }

  setCompressed<T>(key: string, value: T, ttl?: number): void {
    const compressed = this.compressValue(value);
    this.set(key, compressed, ttl);
  }

  getCompressed<T>(key: string): T | null {
    const compressed = this.get<string>(key);
    
    if (compressed === null) {
      return null;
    }

    return this.decompressValue<T>(compressed);
  }

  // Métodos para debugging
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  getEntryInfo(key: string): {
    exists: boolean;
    expired: boolean;
    age: number;
    ttl: number;
    accessCount: number;
    lastAccessed: number;
  } | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;
    const expired = now > entry.timestamp + entry.ttl;

    return {
      exists: true,
      expired,
      age,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed
    };
  }

  // Persistencia de caché
  private async persistCache(): Promise<void> {
    if (!this.config.enablePersistence || !this.config.persistencePath) {
      return;
    }

    try {
      const now = Date.now();
      const cacheData: Record<string, CacheEntry> = {};

      // Solo persistir entradas que no han expirado y que no son demasiado grandes
      for (const [key, entry] of this.cache.entries()) {
        if (now <= entry.timestamp + entry.ttl) {
          const size = entry.size || JSON.stringify(entry.value).length;
          if (size < 1024 * 1024) { // Solo entradas menores a 1MB
            cacheData[key] = entry;
          }
        }
      }

      const cacheDir = path.dirname(this.config.persistencePath);
      await mkdir(cacheDir, { recursive: true });

      const cacheFile = `${this.config.persistencePath}/cache.json`;
      await writeFile(cacheFile, JSON.stringify({
        data: cacheData,
        timestamp: now,
        stats: this.stats
      }), 'utf8');

      logger.debug('Cache persistido', {
        entriesCount: Object.keys(cacheData).length,
        file: cacheFile
      });

    } catch (error) {
      logger.error('Error persistiendo cache', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async loadPersistedCache(): Promise<void> {
    if (!this.config.enablePersistence || !this.config.persistencePath) {
      return;
    }

    try {
      const cacheFile = `${this.config.persistencePath}/cache.json`;

      try {
        const cacheData = JSON.parse(await readFile(cacheFile, 'utf8'));
        const now = Date.now();

        if (cacheData.data && cacheData.timestamp) {
          const age = now - cacheData.timestamp;

          // Solo cargar si el cache no tiene más de 1 hora
          if (age < 60 * 60 * 1000) {
            let loadedCount = 0;

            for (const [key, entry] of Object.entries(cacheData.data)) {
              const cacheEntry = entry as CacheEntry;

              // Verificar si no ha expirado
              if (now <= cacheEntry.timestamp + cacheEntry.ttl) {
                this.cache.set(key, cacheEntry);
                loadedCount++;
              }
            }

            // Restaurar estadísticas si están disponibles
            if (cacheData.stats) {
              this.stats = { ...this.stats, ...cacheData.stats };
            }

            logger.info('Cache persistido cargado', {
              loadedEntries: loadedCount,
              cacheAge: Math.round(age / 1000 / 60),
              file: cacheFile
            });
          } else {
            logger.info('Cache persistido muy antiguo, ignorando', { age: Math.round(age / 1000 / 60) });
          }
        }
      } catch (fileError) {
        // Archivo no existe o está corrupto, continuar sin cache persistido
        logger.debug('No se pudo cargar cache persistido', {
          file: cacheFile,
          error: fileError instanceof Error ? fileError.message : String(fileError)
        });
      }

    } catch (error) {
      logger.error('Error cargando cache persistido', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Método para forzar persistencia manual
  async forcePersist(): Promise<void> {
    await this.persistCache();
  }

  // Método para forzar carga de cache persistido
  async forceLoad(): Promise<void> {
    await this.loadPersistedCache();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    // Persistencia final antes de destruir
    if (this.config.enablePersistence) {
      this.persistCache().catch(error => {
        logger.error('Error en persistencia final', { error });
      });
    }

    this.cache.clear();
    this.tagMap.clear();
    logger.info('Cache manager destruido');
  }
}

// Instancia singleton
export const cacheManager = new CacheManager();

// Configuración por defecto para diferentes tipos de datos
export const cacheConfigs = {
  user: { ttl: 10 * 60 * 1000 }, // 10 minutos
  property: { ttl: 15 * 60 * 1000 }, // 15 minutos
  contract: { ttl: 5 * 60 * 1000 }, // 5 minutos
  payment: { ttl: 2 * 60 * 1000 }, // 2 minutos
  legal: { ttl: 30 * 60 * 1000 }, // 30 minutos
  stats: { ttl: 60 * 1000 }, // 1 minuto
};

// Helper para crear claves de cache consistentes
export function createCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

// Decorador para cache automático
export function cached(ttl?: number, keyPrefix?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyPrefix 
        ? `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      const cached = cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cacheManager.set(cacheKey, result, ttl);
      return result;
    };

    return descriptor;
  };
}
