import { BaseBankIntegration, BankTransferRequest, BankTransferResponse, BankAccountValidation } from './base-bank';
import { BancoEstadoIntegration } from './banco-estado';
import { BCIIntegration } from './bci';
import { logger } from '@/lib/logger';

/**
 * Configuración de bancos disponibles
 */
export interface BankConfig {
  bancoEstado: {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string;
  };
  bci: {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
  };
  santander: {
    clientId: string;
    clientSecret: string;
    baseUrl?: string;
  };
}

/**
 * Servicio principal para integraciones bancarias chilenas
 * Maneja múltiples bancos y selecciona automáticamente el más apropiado
 */
export class BankService {
  private banks: Map<string, BaseBankIntegration> = new Map();
  private bankConfigs: BankConfig;

  constructor(config: BankConfig) {
    this.bankConfigs = config;
    this.initializeBanks();
  }

  /**
   * Inicializa las integraciones bancarias
   */
  private initializeBanks(): void {
    try {
      // Banco Estado
      this.banks.set('012', new BancoEstadoIntegration(this.bankConfigs.bancoEstado));
      this.banks.set('BANCO_ESTADO', new BancoEstadoIntegration(this.bankConfigs.bancoEstado));

      // BCI
      this.banks.set('016', new BCIIntegration(this.bankConfigs.bci));
      this.banks.set('BCI', new BCIIntegration(this.bankConfigs.bci));

      // Santander (por ahora usamos BCI como base para Santander)
      this.banks.set('037', new BCIIntegration(this.bankConfigs.santander));
      this.banks.set('SANTANDER', new BCIIntegration(this.bankConfigs.santander));

      logger.info('Integraciones bancarias inicializadas correctamente');
    } catch (error) {
      logger.error('Error inicializando integraciones bancarias', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene la integración bancaria apropiada
   */
  private getBankIntegration(bankCode: string): BaseBankIntegration {
    const bank = this.banks.get(bankCode);
    if (!bank) {
      throw new Error(`Banco no soportado: ${bankCode}`);
    }
    return bank;
  }

  /**
   * Realiza una transferencia bancaria
   */
  async transfer(request: BankTransferRequest): Promise<BankTransferResponse> {
    try {
      logger.info('Iniciando transferencia bancaria:', {
        recipient: request.recipientName,
        amount: request.amount,
        bank: request.recipientBank
      });

      const bankIntegration = this.getBankIntegration(request.recipientBank);
      const result = await bankIntegration.transfer(request);

      if (result.success) {
        logger.info('Transferencia bancaria exitosa:', {
          transactionId: result.transactionId,
          trackingCode: result.trackingCode,
          amount: request.amount
        });
      } else {
        logger.warn('Transferencia bancaria fallida:', {
          error: result.errorMessage,
          recipient: request.recipientName
        });
      }

      return result;
    } catch (error) {
      logger.error('Error en transferencia bancaria', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Error desconocido',
        status: 'FAILED'
      };
    }
  }

  /**
   * Valida una cuenta bancaria
   */
  async validateAccount(validation: BankAccountValidation): Promise<BankAccountValidation> {
    try {
      logger.info('Validando cuenta bancaria:', {
        account: validation.accountNumber,
        bank: validation.bankCode
      });

      const bankIntegration = this.getBankIntegration(validation.bankCode);
      const result = await bankIntegration.validateAccount(validation);

      logger.info('Validación de cuenta completada:', {
        isValid: result.isValid,
        accountHolder: result.accountHolder
      });

      return result;
    } catch (error) {
      logger.error('Error validando cuenta bancaria', { error: error instanceof Error ? error.message : String(error) });
      return {
        ...validation,
        isValid: false,
        errorMessage: 'Error en validación de cuenta'
      };
    }
  }

  /**
   * Consulta el estado de una transacción
   */
  async getTransactionStatus(bankCode: string, transactionId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    details?: any;
  }> {
    try {
      const bankIntegration = this.getBankIntegration(bankCode);
      const result = await bankIntegration.getTransactionStatus(transactionId);

      logger.info('Consulta de transacción completada:', {
        transactionId,
        status: result.status
      });

      return result;
    } catch (error) {
      logger.error('Error consultando transacción', { error: error instanceof Error ? error.message : String(error) });
      return {
        status: 'FAILED',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Obtiene el saldo disponible de un banco específico
   */
  async getBalance(bankCode: string): Promise<{
    available: number;
    currency: string;
    lastUpdated: Date;
  }> {
    try {
      const bankIntegration = this.getBankIntegration(bankCode);
      const result = await bankIntegration.getBalance();

      logger.info('Saldo obtenido exitosamente:', {
        bank: bankCode,
        available: result.available,
        currency: result.currency
      });

      return result;
    } catch (error) {
      logger.error('Error obteniendo saldo bancario', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene lista de bancos soportados
   */
  getSupportedBanks(): string[] {
    return Array.from(this.banks.keys());
  }

  /**
   * Verifica si un banco está soportado
   */
  isBankSupported(bankCode: string): boolean {
    return this.banks.has(bankCode);
  }

  /**
   * Mapea códigos de banco chilenos a nombres legibles
   */
  static getBankName(bankCode: string): string {
    const bankNames: Record<string, string> = {
      '012': 'Banco Estado',
      'BANCO_ESTADO': 'Banco Estado',
      '016': 'BCI',
      'BCI': 'BCI',
      '037': 'Santander',
      'SANTANDER': 'Santander',
      '001': 'Banco de Chile',
      'BANCO_CHILE': 'Banco de Chile',
      '009': 'Banco Internacional',
      '014': 'Banco ScotiaBank',
      '028': 'Banco BICE',
      '031': 'HSBC Bank',
      '039': 'Banco Itaú',
      '049': 'Banco Security',
      '051': 'Banco Falabella',
      '053': 'Banco Ripley',
      '054': 'Rabobank',
      '055': 'Banco Consorcio',
      '056': 'Banco Penta'
    };

    return bankNames[bankCode] || `Banco ${bankCode}`;
  }

  /**
   * Obtiene código de banco desde nombre
   */
  static getBankCode(bankName: string): string | null {
    const bankCodes: Record<string, string> = {
      'banco estado': '012',
      'estado': '012',
      'bancoestado': '012',
      'bci': '016',
      'banco bci': '016',
      'credito e inversiones': '016',
      'santander': '037',
      'banco santander': '037',
      'banco chile': '001',
      'banco de chile': '001'
    };

    return bankCodes[bankName.toLowerCase()] || null;
  }
}

/**
 * Instancia global del servicio bancario
 */
let bankServiceInstance: BankService | null = null;

/**
 * Obtiene la instancia del servicio bancario
 */
export function getBankService(): BankService {
  if (!bankServiceInstance) {
    // Obtener configuración desde variables de entorno o configuración
    const config: BankConfig = {
      bancoEstado: {
        apiKey: process.env.BANCO_ESTADO_API_KEY || '',
        apiSecret: process.env.BANCO_ESTADO_API_SECRET || '',
        baseUrl: process.env.BANCO_ESTADO_BASE_URL
      },
      bci: {
        clientId: process.env.BCI_CLIENT_ID || '',
        clientSecret: process.env.BCI_CLIENT_SECRET || '',
        baseUrl: process.env.BCI_BASE_URL
      },
      santander: {
        clientId: process.env.SANTANDER_CLIENT_ID || '',
        clientSecret: process.env.SANTANDER_CLIENT_SECRET || '',
        baseUrl: process.env.SANTANDER_BASE_URL
      }
    };

    bankServiceInstance = new BankService(config);
  }

  return bankServiceInstance;
}
