import { BaseBankIntegration } from './base-bank-integration';
import { WebPayIntegration } from './webpay-integration';
import { BancoEstadoIntegration } from './banco-estado-integration';
import { PayPalIntegration } from './paypal-integration';
import { StripeIntegration } from './stripe-integration';
import { BankAccountInfo } from '../bank-account-service';
import { logger } from '../logger';
import { BusinessLogicError } from '../errors';

/**
 * Fábrica para crear instancias de integraciones bancarias
 */
export class BankIntegrationFactory {
  private static integrations: Map<string, BaseBankIntegration> = new Map();

  /**
   * Obtiene la integración bancaria apropiada para un banco específico
   */
  static getBankIntegration(bankCode: string): BaseBankIntegration {
    try {
      // Verificar si ya existe una instancia
      if (this.integrations.has(bankCode)) {
        return this.integrations.get(bankCode)!;
      }

      // Crear nueva instancia según el código del banco
      let integration: BaseBankIntegration;

      switch (bankCode) {
        case 'webpay':
        case '001': // WebPay puede usar código genérico
          integration = new WebPayIntegration();
          break;

        case 'banco_estado':
        case '012': // Banco Estado
          integration = new BancoEstadoIntegration();
          break;

        case 'paypal':
          integration = new PayPalIntegration();
          break;

        case 'stripe':
          integration = new StripeIntegration();
          break;

        default:
          throw new BusinessLogicError(`Integración no disponible para banco: ${bankCode}`);
      }

      // Cachear la instancia
      this.integrations.set(bankCode, integration);

      logger.info('Integración bancaria creada', { bankCode });

      return integration;

    } catch (error) {
      logger.error('Error obteniendo integración bancaria:', {
        bankCode,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Obtiene la integración apropiada para una cuenta bancaria
   */
  static getIntegrationForAccount(account: BankAccountInfo): BaseBankIntegration {
    return this.getBankIntegration(account.bankCode);
  }

  /**
   * Lista todos los bancos disponibles
   */
  static async getAvailableBanks(): Promise<Array<{
    code: string;
    name: string;
    available: boolean;
    type: 'bank' | 'payment_gateway' | 'wallet';
  }>> {
    const banks = [
      { code: 'webpay', name: 'WebPay (Transbank)', type: 'bank' as const },
      { code: 'banco_estado', name: 'Banco Estado', type: 'bank' as const },
      { code: 'banco_chile', name: 'Banco de Chile', type: 'bank' as const },
      { code: 'bci', name: 'BCI', type: 'bank' as const },
      { code: 'santander', name: 'Santander', type: 'bank' as const },
      { code: 'scotiabank', name: 'Scotiabank', type: 'bank' as const },
      { code: 'itau', name: 'Itaú', type: 'bank' as const },
      { code: 'mercado_pago', name: 'Mercado Pago', type: 'wallet' as const },
      { code: 'paypal', name: 'PayPal', type: 'payment_gateway' as const },
      { code: 'stripe', name: 'Stripe', type: 'payment_gateway' as const }
    ];

    // Verificar disponibilidad de cada banco
    const availableBanks = await Promise.all(
      banks.map(async (bank) => {
        try {
          const integration = this.getBankIntegration(bank.code);
          const available = await integration.isAvailable();
          return {
            ...bank,
            available
          };
        } catch (error) {
          logger.warn('Error verificando disponibilidad de banco:', {
            bankCode: bank.code,
            error: error instanceof Error ? error.message : String(error)
          });
          return {
            ...bank,
            available: false
          };
        }
      })
    );

    return availableBanks;
  }

  /**
   * Verifica si un banco está disponible
   */
  static async isBankAvailable(bankCode: string): Promise<boolean> {
    try {
      const integration = this.getBankIntegration(bankCode);
      return await integration.isAvailable();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene estadísticas de todas las integraciones
   */
  static async getIntegrationStats(): Promise<Array<{
    bankCode: string;
    name: string;
    available: boolean;
    lastUsed?: Date | undefined;
    successRate?: number | undefined;
    averageResponseTime?: number | undefined;
  }>> {
    const banks = await this.getAvailableBanks();

    return await Promise.all(
      banks.map(async (bank) => {
        try {
          const integration = this.getBankIntegration(bank.code);
          const available = await integration.isAvailable();

          // Simular estadísticas (en producción, obtener de BD)
          return {
            bankCode: bank.code,
            name: bank.name,
            available,
            lastUsed: available ? new Date(Date.now() - Math.random() * 86400000) : undefined,
            successRate: available ? 0.85 + Math.random() * 0.1 : undefined, // 85-95%
            averageResponseTime: available ? 1000 + Math.random() * 2000 : undefined // 1-3s
          };
        } catch (error) {
          return {
            bankCode: bank.code,
            name: bank.name,
            available: false
          };
        }
      })
    );
  }

  /**
   * Limpia el caché de integraciones
   */
  static clearCache(): void {
    this.integrations.clear();
    logger.info('Caché de integraciones bancarias limpiado');
  }

  /**
   * Obtiene la integración recomendada para una transferencia
   */
  static async getRecommendedIntegration(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number
  ): Promise<BaseBankIntegration> {
    // Estrategia de recomendación basada en:
    // 1. Disponibilidad
    // 2. Costos
    // 3. Tiempos de procesamiento
    // 4. Tasa de éxito histórica

    const possibleIntegrations = [
      fromAccount.bankCode,
      toAccount.bankCode,
      'webpay' // Opción por defecto
    ];

    for (const bankCode of possibleIntegrations) {
      try {
        const integration = this.getBankIntegration(bankCode);
        const available = await integration.isAvailable();

        if (available) {
          // Verificar límites
          if (amount >= (integration.config.config.minAmount || 0) &&
              amount <= (integration.config.config.maxAmount || Number.MAX_SAFE_INTEGER)) {
            logger.info('Integración recomendada encontrada', {
              bankCode,
              fromAccount: fromAccount.bankCode,
              toAccount: toAccount.bankCode,
              amount
            });
            return integration;
          }
        }
      } catch (error) {
        logger.warn('Error evaluando integración:', {
          bankCode,
          error: error instanceof Error ? error.message : String(error)
        });
        continue;
      }
    }

    // Fallback a WebPay
    logger.info('Usando WebPay como fallback', {
      fromAccount: fromAccount.bankCode,
      toAccount: toAccount.bankCode,
      amount
    });

    return this.getBankIntegration('webpay');
  }

  /**
   * Ejecuta una transferencia usando la mejor integración disponible
   */
  static async executeSmartTransfer(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number,
    description?: string
  ) {
    try {
      const integration = await this.getRecommendedIntegration(fromAccount, toAccount, amount);

      logger.info('Ejecutando transferencia inteligente', {
        integration: integration.getBankName(),
        from: fromAccount.accountNumber,
        to: toAccount.accountNumber,
        amount
      });

      return await integration.transfer(fromAccount, toAccount, amount, description);

    } catch (error) {
      logger.error('Error en transferencia inteligente', { error: error instanceof Error ? error.message : String(error) });

      // Intentar con WebPay como último recurso
      try {
        logger.info('Intentando con WebPay como último recurso');
        const webpayIntegration = this.getBankIntegration('webpay');
        return await webpayIntegration.transfer(fromAccount, toAccount, amount, description);
      } catch (fallbackError) {
        logger.error('Error en fallback con WebPay:', fallbackError);
        throw error; // Retornar error original
      }
    }
  }

  /**
   * Verifica una cuenta usando múltiples integraciones
   */
  static async verifyAccountMulti(account: BankAccountInfo): Promise<{
    isValid: boolean;
    method: string;
    confidence: number;
    results: Array<{
      integration: string;
      isValid: boolean;
      confidence: number;
    }>;
  }> {
    const results = [];
    let bestResult = {
      isValid: false,
      method: '',
      confidence: 0
    };

    // Intentar con múltiples bancos
    const banksToTry = [
      account.bankCode, // Banco de la cuenta
      'webpay',         // WebPay como alternativa
      'banco_estado'    // Banco Estado como alternativa
    ];

    for (const bankCode of banksToTry) {
      try {
        const integration = this.getBankIntegration(bankCode);
        const available = await integration.isAvailable();

        if (available) {
          const result = await integration.verifyAccount(account);

          results.push({
            integration: bankCode,
            isValid: result.isValid,
            confidence: result.confidence
          });

          // Mantener el mejor resultado
          if (result.isValid && result.confidence > bestResult.confidence) {
            bestResult = {
              isValid: result.isValid,
              method: bankCode,
              confidence: result.confidence
            };
          }
        }
      } catch (error) {
        logger.warn('Error verificando con integración:', {
          bankCode,
          error: error instanceof Error ? error.message : String(error)
        });

        results.push({
          integration: bankCode,
          isValid: false,
          confidence: 0
        });
      }
    }

    return {
      ...bestResult,
      results
    };
  }
}

/**
 * Utilidades adicionales para integraciones bancarias
 */
export class BankIntegrationUtils {
  /**
   * Determina el código de banco basado en el número de cuenta
   */
  static inferBankCode(accountNumber: string): string | null {
    // Lógica para inferir banco basado en formato de cuenta
    // Ejemplo simplificado para Chile

    if (!accountNumber || accountNumber.length < 8) {
      return null;
    }

    // Reglas básicas para inferir banco chileno
    const firstDigits = accountNumber.substring(0, 3);

    const bankPatterns: Record<string, string> = {
      '001': '001', // Banco de Chile
      '009': '009', // Banco Internacional
      '012': '012', // Banco del Estado
      '014': '014', // BCI
      '016': '016', // BCI
      '027': '027', // Corpbanca
      '028': '028', // Santander
      '031': '031', // HSBC
      '037': '037', // Scotiabank
      '039': '039', // Itaú Corpbanca
      '049': '049', // Security
      '051': '051', // Falabella
      '053': '053', // Ripley
      '055': '055', // Penta
      '056': '056', // Santander Banefe
    };

    return bankPatterns[firstDigits] || null;
  }

  /**
   * Formatea un número de cuenta para display
   */
  static formatAccountNumber(accountNumber: string, bankCode?: string): string {
    // Eliminar espacios y guiones
    const cleanNumber = accountNumber.replace(/[\s\-]/g, '');

    // Aplicar formato según banco
    switch (bankCode) {
      case '001': // Banco de Chile
      case '012': // Banco Estado
        // Formato: XX-XXXXXX-X
        if (cleanNumber.length === 8) {
          return `${cleanNumber.substring(0, 2)}-${cleanNumber.substring(2, 8)}`;
        }
        break;

      case '014': // BCI
      case '016': // BCI
        // Formato: XXX-XXXXXX-X
        if (cleanNumber.length === 9) {
          return `${cleanNumber.substring(0, 3)}-${cleanNumber.substring(3, 9)}`;
        }
        break;

      default:
        // Formato genérico: ocultar dígitos del medio
        if (cleanNumber.length > 4) {
          return `****${cleanNumber.substring(cleanNumber.length - 4)}`;
        }
    }

    return cleanNumber;
  }

  /**
   * Valida formato de número de cuenta chileno
   */
  static validateChileanAccountNumber(accountNumber: string, bankCode?: string): boolean {
    const cleanNumber = accountNumber.replace(/[\s\-]/g, '');

    // Longitudes típicas por banco
    const lengthByBank: Record<string, number[]> = {
      '001': [8],      // Banco de Chile
      '012': [8],      // Banco Estado
      '014': [9],      // BCI
      '016': [9],      // BCI
      '028': [9, 10],  // Santander
      '037': [9, 10],  // Scotiabank
    };

    const allowedLengths = lengthByBank[bankCode || ''] || [8, 9, 10];

    if (!allowedLengths.includes(cleanNumber.length)) {
      return false;
    }

    // Validar que sean solo dígitos
    return /^\d+$/.test(cleanNumber);
  }

  /**
   * Calcula costo estimado de una transferencia
   */
  static estimateTransferCost(
    amount: number,
    bankCode: string,
    transferType: 'internal' | 'external' = 'external'
  ): {
    bankFee: number;
    ourFee: number;
    totalFee: number;
    estimatedTime: string;
  } {
    // Tasas aproximadas (en producción, obtener de configuración)
    const bankFees: Record<string, { internal: number; external: number }> = {
      'webpay': { internal: 0, external: 0.005 }, // 0.5%
      'banco_estado': { internal: 0, external: 150 }, // $150 fijo
      'banco_chile': { internal: 0, external: 200 }, // $200 fijo
      'bci': { internal: 0, external: 0.003 }, // 0.3%
      'santander': { internal: 0, external: 250 }, // $250 fijo
    };

    const bankFee = bankFees[bankCode]?.[transferType] || 0;
    const ourFee = Math.max(amount * 0.01, 100); // 1% con mínimo $100
    const totalFee = typeof bankFee === 'number' && bankFee < 1
      ? bankFee * amount + ourFee
      : bankFee + ourFee;

    // Tiempo estimado
    const estimatedTime = bankCode === 'webpay' ? '5-30 minutos' :
                         bankCode === 'banco_estado' ? '10-45 minutos' :
                         '1-2 horas';

    return {
      bankFee: typeof bankFee === 'number' && bankFee < 1 ? bankFee * amount : bankFee,
      ourFee,
      totalFee,
      estimatedTime
    };
  }

  /**
   * Genera un ID único para transacciones
   */
  static generateTransactionId(prefix: string = 'TXN'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }
}
