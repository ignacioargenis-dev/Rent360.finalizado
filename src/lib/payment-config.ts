import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError } from './errors';

/**
 * Configuración centralizada para servicios de pago y bancos
 */
export interface PaymentServiceConfig {
  // Identificador único del servicio
  serviceId: string;

  // Nombre del servicio
  name: string;

  // Tipo de servicio
  type: 'bank' | 'payment_gateway' | 'wallet' | 'crypto';

  // Estado del servicio
  enabled: boolean;

  // Credenciales de acceso
  credentials: {
    apiKey?: string;
    apiSecret?: string;
    clientId?: string;
    clientSecret?: string;
    username?: string;
    password?: string;
    merchantId?: string;
    terminalId?: string;
    webhookSecret?: string;
    publicKey?: string;
    privateKey?: string;
    // Campos específicos por banco/servicio
    [key: string]: any;
  };

  // Configuración específica del servicio
  config: {
    // URLs de endpoints
    baseUrl?: string;
    webhookUrl?: string;
    returnUrl?: string;

    // Límites y restricciones
    minAmount?: number;
    maxAmount?: number;
    dailyLimit?: number;
    monthlyLimit?: number;

    // Configuración técnica
    timeout?: number;
    retryAttempts?: number;
    rateLimit?: number;

    // Configuración específica
    supportedCurrencies?: string[];
    supportedCountries?: string[];
    requiresKYC?: boolean;
    supportsRecurring?: boolean;

    // Campos adicionales específicos del servicio
    [key: string]: any;
  };

  // Metadata
  metadata: {
    description?: string;
    version?: string;
    lastTested?: Date;
    testMode?: boolean;
    maintenance?: boolean;
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Servicios bancarios chilenos disponibles
 */
export const CHILEAN_BANKS = {
  WEBPAY: 'webpay',
  BANCO_ESTADO: 'banco_estado',
  BCI: 'bci',
  BANCO_CHILE: 'banco_chile',
  SANTANDER: 'santander',
  SCOTIABANK: 'scotiabank',
  ITAU: 'itau',
  MERCADO_PAGO: 'mercado_pago'
} as const;

/**
 * Servicios internacionales
 */
export const INTERNATIONAL_SERVICES = {
  PAYPAL: 'paypal',
  STRIPE: 'stripe',
  WISE: 'wise',
  TRANSFERWISE: 'transferwise'
} as const;

/**
 * Servicio de configuración de pagos
 */
export class PaymentConfigService {
  private static configs: Map<string, PaymentServiceConfig> = new Map();
  private static lastRefresh: Date | null = null;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Obtiene la configuración de un servicio específico
   */
  static async getServiceConfig(serviceId: string): Promise<PaymentServiceConfig | null> {
    try {
      // Verificar caché
      await this.refreshCacheIfNeeded();

      const cached = this.configs.get(serviceId);
      if (cached) {
        return cached;
      }

      // Buscar en base de datos
      const config = await db.systemSetting.findFirst({
        where: {
          category: 'payment_service',
          key: serviceId,
          isActive: true
        }
      });

      if (!config) {
        logger.warn(`Configuración no encontrada para servicio: ${serviceId}`);
        return null;
      }

      const serviceConfig: PaymentServiceConfig = JSON.parse(config.value);

      // Cachear configuración
      this.configs.set(serviceId, serviceConfig);

      return serviceConfig;

    } catch (error) {
      logger.error(`Error obteniendo configuración para ${serviceId}:`, error);
      throw new DatabaseError(`Error al obtener configuración del servicio ${serviceId}`);
    }
  }

  /**
   * Obtiene todas las configuraciones activas
   */
  static async getAllActiveConfigs(): Promise<PaymentServiceConfig[]> {
    try {
      await this.refreshCacheIfNeeded();

      const configs: PaymentServiceConfig[] = [];

      for (const [serviceId, config] of this.configs.entries()) {
        if (config.enabled) {
          configs.push(config);
        }
      }

      return configs;

    } catch (error) {
      logger.error('Error obteniendo todas las configuraciones:', error);
      throw new DatabaseError('Error al obtener configuraciones de servicios');
    }
  }

  /**
   * Obtiene configuraciones por tipo
   */
  static async getConfigsByType(type: 'bank' | 'payment_gateway' | 'wallet' | 'crypto'): Promise<PaymentServiceConfig[]> {
    const allConfigs = await this.getAllActiveConfigs();
    return allConfigs.filter(config => config.type === type);
  }

  /**
   * Actualiza la configuración de un servicio
   */
  static async updateServiceConfig(serviceId: string, updates: Partial<PaymentServiceConfig>): Promise<void> {
    try {
      const existing = await this.getServiceConfig(serviceId);
      if (!existing) {
        throw new BusinessLogicError(`Servicio ${serviceId} no encontrado`);
      }

      const updatedConfig = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      // Actualizar en base de datos
      await db.systemSetting.upsert({
        where: {
          category_key: {
            category: 'payment_service',
            key: serviceId
          }
        },
        update: {
          value: JSON.stringify(updatedConfig),
          updatedAt: new Date()
        },
        create: {
          category: 'payment_service',
          key: serviceId,
          value: JSON.stringify(updatedConfig),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Actualizar caché
      this.configs.set(serviceId, updatedConfig);
      this.lastRefresh = new Date();

      logger.info(`Configuración actualizada para servicio: ${serviceId}`);

    } catch (error) {
      logger.error(`Error actualizando configuración para ${serviceId}:`, error);
      throw error;
    }
  }

  /**
   * Habilita/deshabilita un servicio
   */
  static async toggleService(serviceId: string, enabled: boolean): Promise<void> {
    const config = await this.getServiceConfig(serviceId);
    if (!config) {
      throw new BusinessLogicError(`Servicio ${serviceId} no encontrado`);
    }

    await this.updateServiceConfig(serviceId, {
      enabled,
      metadata: {
        ...config.metadata,
        maintenance: !enabled
      }
    });

    logger.info(`Servicio ${serviceId} ${enabled ? 'habilitado' : 'deshabilitado'}`);
  }

  /**
   * Prueba la conectividad de un servicio
   */
  static async testServiceConnection(serviceId: string): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    try {
      const config = await this.getServiceConfig(serviceId);
      if (!config) {
        throw new BusinessLogicError(`Servicio ${serviceId} no encontrado`);
      }

      if (!config.enabled) {
        return {
          success: false,
          responseTime: 0,
          error: 'Servicio deshabilitado'
        };
      }

      const startTime = Date.now();

      // Aquí iría la lógica específica para probar cada servicio
      const testResult = await this.performServiceTest(config);

      const responseTime = Date.now() - startTime;

      // Actualizar metadata con resultado del test
      await this.updateServiceConfig(serviceId, {
        metadata: {
          ...config.metadata,
          lastTested: new Date(),
          testMode: config.metadata.testMode
        }
      });

      return {
        success: testResult.success,
        responseTime,
        error: testResult.error
      };

    } catch (error) {
      logger.error(`Error probando conexión para ${serviceId}:`, error);
      return {
        success: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Realiza pruebas específicas por tipo de servicio
   */
  private static async performServiceTest(config: PaymentServiceConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      switch (config.type) {
        case 'bank':
          return await this.testBankConnection(config);
        case 'payment_gateway':
          return await this.testPaymentGatewayConnection(config);
        case 'wallet':
          return await this.testWalletConnection(config);
        default:
          return { success: true }; // Test básico
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Prueba conexión con bancos chilenos
   */
  private static async testBankConnection(config: PaymentServiceConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Simulación de prueba de conexión bancaria
    // En producción, aquí irían llamadas reales a APIs bancarias

    const requiredFields = ['apiKey', 'merchantId'];
    const missingFields = requiredFields.filter(field => !config.credentials[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      };
    }

    // Simular delay de respuesta bancaria
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular 95% de éxito en pruebas
    const success = Math.random() > 0.05;

    return {
      success,
      error: success ? undefined : 'Error de conexión con el banco'
    };
  }

  /**
   * Prueba conexión con gateways de pago
   */
  private static async testPaymentGatewayConnection(config: PaymentServiceConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    const requiredFields = config.serviceId === 'stripe' ? ['apiKey'] :
                          config.serviceId === 'paypal' ? ['clientId', 'clientSecret'] :
                          ['apiKey', 'apiSecret'];

    const missingFields = requiredFields.filter(field => !config.credentials[field]);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Campos requeridos faltantes: ${missingFields.join(', ')}`
      };
    }

    // Simular delay de respuesta
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = Math.random() > 0.03; // 97% de éxito

    return {
      success,
      error: success ? undefined : 'Error de autenticación con gateway'
    };
  }

  /**
   * Prueba conexión con wallets
   */
  private static async testWalletConnection(config: PaymentServiceConfig): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Simular prueba de wallet
    await new Promise(resolve => setTimeout(resolve, 300));

    const success = Math.random() > 0.02; // 98% de éxito

    return {
      success,
      error: success ? undefined : 'Error de conexión con wallet'
    };
  }

  /**
   * Refresca el caché si es necesario
   */
  private static async refreshCacheIfNeeded(): Promise<void> {
    if (!this.lastRefresh || Date.now() - this.lastRefresh.getTime() > this.CACHE_TTL) {
      await this.loadAllConfigs();
    }
  }

  /**
   * Carga todas las configuraciones desde la base de datos
   */
  private static async loadAllConfigs(): Promise<void> {
    try {
      const configs = await db.systemSetting.findMany({
        where: {
          category: 'payment_service',
          isActive: true
        }
      });

      this.configs.clear();

      for (const config of configs) {
        try {
          const serviceConfig: PaymentServiceConfig = JSON.parse(config.value);
          this.configs.set(config.key, serviceConfig);
        } catch (parseError) {
          logger.warn(`Error parseando configuración para ${config.key}:`, parseError);
        }
      }

      this.lastRefresh = new Date();
      logger.info(`Cargadas ${this.configs.size} configuraciones de servicios de pago`);

    } catch (error) {
      logger.error('Error cargando configuraciones de servicios:', error);
      throw new DatabaseError('Error al cargar configuraciones de servicios de pago');
    }
  }

  /**
   * Inicializa configuraciones por defecto
   */
  static async initializeDefaultConfigs(): Promise<void> {
    const defaultConfigs: Record<string, PaymentServiceConfig> = {
      [CHILEAN_BANKS.WEBPAY]: {
        serviceId: CHILEAN_BANKS.WEBPAY,
        name: 'WebPay',
        type: 'bank',
        enabled: false,
        credentials: {},
        config: {
          baseUrl: 'https://api.webpay.cl',
          supportedCurrencies: ['CLP'],
          supportedCountries: ['CL'],
          requiresKYC: false,
          minAmount: 100,
          maxAmount: 50000000,
          timeout: 30000,
          retryAttempts: 3
        },
        metadata: {
          description: 'Gateway de pagos de Transbank Chile',
          version: '3.0',
          testMode: true,
          contactInfo: {
            website: 'https://www.transbank.cl'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },

      [CHILEAN_BANKS.BANCO_ESTADO]: {
        serviceId: CHILEAN_BANKS.BANCO_ESTADO,
        name: 'Banco Estado',
        type: 'bank',
        enabled: false,
        credentials: {},
        config: {
          supportedCurrencies: ['CLP'],
          supportedCountries: ['CL'],
          requiresKYC: true,
          minAmount: 1000,
          maxAmount: 100000000,
          timeout: 45000,
          retryAttempts: 3
        },
        metadata: {
          description: 'Banco estatal de Chile',
          testMode: true,
          contactInfo: {
            website: 'https://www.bancoestado.cl'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },

      [INTERNATIONAL_SERVICES.PAYPAL]: {
        serviceId: INTERNATIONAL_SERVICES.PAYPAL,
        name: 'PayPal',
        type: 'payment_gateway',
        enabled: false,
        credentials: {},
        config: {
          baseUrl: 'https://api.paypal.com',
          supportedCurrencies: ['USD', 'EUR', 'CLP'],
          supportedCountries: ['CL', 'US', 'EU'],
          requiresKYC: true,
          minAmount: 1,
          maxAmount: 10000,
          timeout: 30000,
          retryAttempts: 3,
          supportsRecurring: true
        },
        metadata: {
          description: 'PayPal para pagos internacionales',
          version: '2.0',
          testMode: true,
          contactInfo: {
            website: 'https://www.paypal.com'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },

      [INTERNATIONAL_SERVICES.STRIPE]: {
        serviceId: INTERNATIONAL_SERVICES.STRIPE,
        name: 'Stripe',
        type: 'payment_gateway',
        enabled: false,
        credentials: {},
        config: {
          baseUrl: 'https://api.stripe.com',
          supportedCurrencies: ['USD', 'EUR', 'CLP'],
          supportedCountries: ['CL', 'US', 'EU'],
          requiresKYC: true,
          minAmount: 50,
          maxAmount: 999999,
          timeout: 30000,
          retryAttempts: 3,
          supportsRecurring: true
        },
        metadata: {
          description: 'Stripe para pagos internacionales',
          version: '2023-10-16',
          testMode: true,
          contactInfo: {
            website: 'https://www.stripe.com'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    for (const [serviceId, config] of Object.entries(defaultConfigs)) {
      try {
        await this.updateServiceConfig(serviceId, config);
        logger.info(`Configuración por defecto creada para: ${serviceId}`);
      } catch (error) {
        logger.warn(`Error creando configuración por defecto para ${serviceId}:`, error);
      }
    }
  }

  /**
   * Obtiene estadísticas de servicios
   */
  static async getServiceStats(): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
    recentTests: Array<{
      serviceId: string;
      lastTested: Date;
      success: boolean;
    }>;
  }> {
    const allConfigs = await this.getAllActiveConfigs();

    const stats = {
      total: allConfigs.length,
      enabled: allConfigs.filter(c => c.enabled).length,
      disabled: allConfigs.filter(c => !c.enabled).length,
      byType: {} as Record<string, number>,
      recentTests: [] as Array<{
        serviceId: string;
        lastTested: Date;
        success: boolean;
      }>
    };

    // Contar por tipo
    for (const config of allConfigs) {
      stats.byType[config.type] = (stats.byType[config.type] || 0) + 1;
    }

    // Tests recientes (simulado)
    for (const config of allConfigs.slice(0, 5)) {
      if (config.metadata.lastTested) {
        stats.recentTests.push({
          serviceId: config.serviceId,
          lastTested: config.metadata.lastTested,
          success: Math.random() > 0.1 // 90% éxito simulado
        });
      }
    }

    return stats;
  }
}
