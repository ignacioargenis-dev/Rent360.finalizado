import { createClient } from 'redis';
import logger from './logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Eventos de Redis
redisClient.on('error', (err) => {
  logger.error('Redis Client Error', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('end', () => {
  logger.info('Redis connection ended');
});

// Función para verificar conexión
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error('Redis connection test failed:', error);
    return false;
  }
};

// Función para obtener valor con manejo de errores
export const safeGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch (error) {
    logger.error(`Error getting key ${key}:`, error);
    return null;
  }
};

// Función para establecer valor con manejo de errores
export const safeSet = async (key: string, value: string, ttl?: number): Promise<boolean> => {
  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error(`Error setting key ${key}:`, error);
    return false;
  }
};

// Función para eliminar clave con manejo de errores
export const safeDel = async (key: string): Promise<boolean> => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting key ${key}:`, error);
    return false;
  }
};

// Función para obtener múltiples claves
export const safeMGet = async (keys: string[]): Promise<(string | null)[]> => {
  try {
    return await redisClient.mGet(keys);
  } catch (error) {
    logger.error('Error getting multiple keys:', error);
    return new Array(keys.length).fill(null);
  }
};

// Función para verificar si una clave existe
export const safeExists = async (key: string): Promise<boolean> => {
  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Error checking existence of key ${key}:`, error);
    return false;
  }
};

// Función para obtener todas las claves que coinciden con un patrón
export const safeKeys = async (pattern: string): Promise<string[]> => {
  try {
    return await redisClient.keys(pattern);
  } catch (error) {
    logger.error(`Error getting keys with pattern ${pattern}:`, error);
    return [];
  }
};

// Función para limpiar cache de usuario
export const clearUserCache = async (userId: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(`user:${userId}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache entries for user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error clearing cache for user ${userId}:`, error);
  }
};

// Función para obtener estadísticas de Redis
export const getRedisStats = async () => {
  try {
    const info = await redisClient.info();
    const lines = info.split('\n');
    const stats: any = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        stats[key] = value;
      }
    });

    return {
      connected_clients: stats.connected_clients,
      used_memory: stats.used_memory,
      total_connections_received: stats.total_connections_received,
      total_commands_processed: stats.total_commands_processed,
      uptime_in_seconds: stats.uptime_in_seconds,
      keyspace_hits: stats.keyspace_hits,
      keyspace_misses: stats.keyspace_misses,
    };
  } catch (error) {
    logger.error('Error getting Redis stats:', error);
    return null;
  }
};

export { redisClient };
export default redisClient;
