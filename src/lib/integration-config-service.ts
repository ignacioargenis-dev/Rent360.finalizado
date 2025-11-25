import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * Servicio centralizado para obtener configuraciones de integraciones
 * desde la base de datos (systemSetting) en lugar de process.env
 *
 * Las configuraciones se guardan desde /admin/settings/enhanced
 * como integration_<id> en la tabla systemSetting
 */

export interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
  isConfigured: boolean;
  isTested: boolean;
  config: Record<string, any>;
  testResult?: {
    success: boolean;
    message?: string;
    testedAt?: string;
  };
}

export class IntegrationConfigService {
  private static cache: Map<string, IntegrationConfig> = new Map();
  private static lastRefresh: Date | null = null;
  private static readonly CACHE_TTL = 2 * 60 * 1000; // 2 minutos

  /**
   * Obtiene la configuración de una integración específica
   * @param integrationId - ID de la integración (ej: 'esign', 'khipu', 'yoid')
   * @returns Configuración de la integración o null si no existe/no está habilitada
   */
  static async getIntegrationConfig(integrationId: string): Promise<IntegrationConfig | null> {
    try {
      // Verificar caché
      await this.refreshCacheIfNeeded();

      const cached = this.cache.get(integrationId);
      if (cached) {
        return cached;
      }

      // Buscar en base de datos
      const setting = await db.systemSetting.findFirst({
        where: {
          key: `integration_${integrationId}`,
          isActive: true,
        },
      });

      if (!setting) {
        logger.debug(`Configuración no encontrada para integración: ${integrationId}`);
        return null;
      }

      try {
        const config: IntegrationConfig = JSON.parse(setting.value);

        // Cachear configuración
        this.cache.set(integrationId, config);

        return config;
      } catch (parseError) {
        logger.error(`Error parseando configuración para ${integrationId}`, {
          error: parseError instanceof Error ? parseError.message : String(parseError),
        });
        return null;
      }
    } catch (error) {
      logger.error(`Error obteniendo configuración para ${integrationId}:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Obtiene un valor específico de configuración con fallback a process.env
   * @param integrationId - ID de la integración
   * @param configKey - Clave de configuración (ej: 'apiKey', 'secretKey')
   * @param envVarName - Nombre de variable de entorno como fallback (opcional)
   */
  static async getConfigValue(
    integrationId: string,
    configKey: string,
    envVarName?: string
  ): Promise<string | null> {
    try {
      const integration = await this.getIntegrationConfig(integrationId);

      if (integration && integration.isEnabled && integration.config?.[configKey]) {
        return integration.config[configKey];
      }

      // Fallback a variable de entorno si está especificada
      if (envVarName && process.env[envVarName]) {
        logger.debug(
          `Usando variable de entorno ${envVarName} como fallback para ${integrationId}.${configKey}`
        );
        return process.env[envVarName];
      }

      return null;
    } catch (error) {
      logger.error(`Error obteniendo valor de configuración:`, {
        integrationId,
        configKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Verifica si una integración está habilitada y configurada
   */
  static async isIntegrationEnabled(integrationId: string): Promise<boolean> {
    try {
      const config = await this.getIntegrationConfig(integrationId);
      return config !== null && config.isEnabled && config.isConfigured;
    } catch (error) {
      logger.error(`Error verificando si integración está habilitada:`, {
        integrationId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Obtiene todas las integraciones activas
   */
  static async getAllActiveIntegrations(): Promise<IntegrationConfig[]> {
    try {
      await this.refreshCacheIfNeeded();

      const activeIntegrations: IntegrationConfig[] = [];

      for (const [id, config] of this.cache.entries()) {
        if (config.isEnabled) {
          activeIntegrations.push(config);
        }
      }

      return activeIntegrations;
    } catch (error) {
      logger.error('Error obteniendo todas las integraciones activas:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Obtiene integraciones por categoría
   * @param category - Categoría (ej: 'payments', 'signature', 'identity')
   */
  static async getIntegrationsByCategory(category: string): Promise<IntegrationConfig[]> {
    const allIntegrations = await this.getAllActiveIntegrations();
    return allIntegrations.filter(config => config.category === category);
  }

  /**
   * Invalida el caché de una integración específica
   */
  static invalidateCache(integrationId?: string): void {
    if (integrationId) {
      this.cache.delete(integrationId);
      logger.debug(`Caché invalidado para integración: ${integrationId}`);
    } else {
      this.cache.clear();
      this.lastRefresh = null;
      logger.debug('Caché de integraciones completamente invalidado');
    }
  }

  /**
   * Refresca el caché si es necesario
   */
  private static async refreshCacheIfNeeded(): Promise<void> {
    if (!this.lastRefresh || Date.now() - this.lastRefresh.getTime() > this.CACHE_TTL) {
      await this.loadAllIntegrations();
    }
  }

  /**
   * Carga todas las integraciones desde la base de datos
   */
  private static async loadAllIntegrations(): Promise<void> {
    try {
      const settings = await db.systemSetting.findMany({
        where: {
          key: {
            startsWith: 'integration_',
          },
          isActive: true,
        },
      });

      this.cache.clear();

      for (const setting of settings) {
        try {
          const integrationId = setting.key.replace('integration_', '');
          const config: IntegrationConfig = JSON.parse(setting.value);
          this.cache.set(integrationId, config);
        } catch (parseError) {
          logger.warn(`Error parseando configuración para ${setting.key}`, {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
      }

      this.lastRefresh = new Date();
      logger.info(`Cargadas ${this.cache.size} configuraciones de integraciones`);
    } catch (error) {
      logger.error('Error cargando configuraciones de integraciones:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Método de ayuda para obtener configuración completa con validación
   */
  static async getRequiredConfig<T extends Record<string, any>>(
    integrationId: string,
    requiredKeys: string[]
  ): Promise<T | null> {
    const integration = await this.getIntegrationConfig(integrationId);

    if (!integration || !integration.isEnabled) {
      logger.debug(`Integración ${integrationId} no está habilitada`);
      return null;
    }

    // Verificar que todas las claves requeridas existan
    const missingKeys = requiredKeys.filter(key => !integration.config[key]);

    if (missingKeys.length > 0) {
      logger.warn(`Configuración incompleta para ${integrationId}`, {
        missingKeys,
      });
      return null;
    }

    return integration.config as T;
  }

  /**
   * Obtiene estadísticas de configuración
   */
  static async getConfigStats(): Promise<{
    total: number;
    enabled: number;
    configured: number;
    tested: number;
    byCategory: Record<string, number>;
  }> {
    const allIntegrations = await this.getAllActiveIntegrations();

    const stats = {
      total: allIntegrations.length,
      enabled: allIntegrations.filter(i => i.isEnabled).length,
      configured: allIntegrations.filter(i => i.isConfigured).length,
      tested: allIntegrations.filter(i => i.isTested).length,
      byCategory: {} as Record<string, number>,
    };

    // Contar por categoría
    for (const integration of allIntegrations) {
      stats.byCategory[integration.category] = (stats.byCategory[integration.category] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Exportación por defecto
 */
export default IntegrationConfigService;
