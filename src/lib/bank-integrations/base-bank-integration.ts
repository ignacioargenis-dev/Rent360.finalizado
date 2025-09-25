import { PaymentConfigService, PaymentServiceConfig } from '../payment-config';
import { BankAccountInfo } from '../bank-account-service';
import { logger } from '../logger';
import { DatabaseError, BusinessLogicError } from '../errors';

/**
 * Resultado de una transacción bancaria
 */
export interface BankTransactionResult {
  success: boolean;
  transactionId?: string;
  externalReference?: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  description?: string;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, any>;
  processedAt: Date;
}

/**
 * Información de verificación bancaria
 */
export interface BankVerificationResult {
  isValid: boolean;
  accountHolder?: string;
  accountStatus?: 'active' | 'inactive' | 'frozen' | 'closed';
  verificationMethod: 'api' | 'manual' | 'micro_deposit';
  confidence: number; // 0-1, nivel de confianza
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Información de saldo de cuenta
 */
export interface AccountBalance {
  available: number;
  current: number;
  currency: string;
  lastUpdated: Date;
}

/**
 * Clase base para integraciones bancarias
 */
export abstract class BaseBankIntegration {
  protected config!: PaymentServiceConfig | null;
  protected bankCode: string;

  constructor(bankCode: string) {
    this.bankCode = bankCode;
  }

  /**
   * Inicializa la configuración del banco
   */
  protected async initialize(): Promise<void> {
    if (!this.config) {
      this.config = await PaymentConfigService.getServiceConfig(this.bankCode);

      if (!this.config) {
        throw new BusinessLogicError(`Configuración no encontrada para banco: ${this.bankCode}`);
      }

      if (!this.config.enabled) {
        throw new BusinessLogicError(`Servicio bancario deshabilitado: ${this.bankCode}`);
      }
    }
  }

  /**
   * Realiza una transferencia bancaria
   */
  abstract transfer(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number,
    description?: string
  ): Promise<BankTransactionResult>;

  /**
   * Verifica una cuenta bancaria
   */
  abstract verifyAccount(
    account: BankAccountInfo
  ): Promise<BankVerificationResult>;

  /**
   * Consulta el saldo de una cuenta
   */
  abstract getBalance(
    account: BankAccountInfo
  ): Promise<AccountBalance>;

  /**
   * Obtiene el historial de transacciones
   */
  abstract getTransactionHistory(
    account: BankAccountInfo,
    startDate: Date,
    endDate: Date
  ): Promise<any[]>;

  /**
   * Valida las credenciales del banco
   */
  protected async validateCredentials(): Promise<boolean> {
    try {
      if (!this.config) {
        logger.warn(`Configuración no inicializada para banco ${this.bankCode}`);
        return false;
      }

      if (!this.config.credentials) {
        return false;
      }

      // Validar campos requeridos específicos de cada banco
      const requiredFields = this.getRequiredCredentialFields();

      for (const field of requiredFields) {
        if (!this.config.credentials[field]) {
          logger.warn(`Campo requerido faltante: ${field} para banco ${this.bankCode}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Error validando credenciales', { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Campos requeridos para las credenciales (implementar en subclases)
   */
  protected abstract getRequiredCredentialFields(): string[];

  /**
   * Realiza una petición HTTP al API del banco
   */
  protected async makeBankRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    data?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    try {
      if (!this.config) {
        throw new BusinessLogicError(`Configuración no inicializada para banco ${this.bankCode}`);
      }

      const url = `${this.config.config.baseUrl}${endpoint}`;

      const requestHeaders = {
        'Content-Type': 'application/json',
        'Authorization': this.getAuthorizationHeader(),
        ...headers
      };

      const requestConfig = {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
        timeout: this.config.config.timeout || 30000
      };

      logger.info('Realizando petición bancaria', {
        bank: this.bankCode,
        method,
        endpoint,
        hasData: !!data
      });

      // Simular petición HTTP (en producción usar fetch o axios)
      const response = await this.simulateHttpRequest(url, requestConfig);

      if (!response.success) {
        throw new Error(`Error HTTP ${response.status}: ${response.error}`);
      }

      return response.data;

    } catch (error) {
      logger.error('Error en petición bancaria:', {
        bank: this.bankCode,
        endpoint,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new DatabaseError(`Error comunicándose con ${this.bankCode}`);
    }
  }

  /**
   * Genera header de autorización
   */
  protected getAuthorizationHeader(): string {
    if (!this.config) {
      throw new BusinessLogicError(`Configuración no inicializada para banco ${this.bankCode}`);
    }

    const { credentials } = this.config;

    // Implementar según el método de autenticación del banco
    if (credentials.apiKey) {
      return `Bearer ${credentials.apiKey}`;
    }

    if (credentials.clientId && credentials.clientSecret) {
      const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);
      return `Basic ${auth}`;
    }

    if (credentials.username && credentials.password) {
      const auth = btoa(`${credentials.username}:${credentials.password}`);
      return `Basic ${auth}`;
    }

    return '';
  }

  /**
   * Simula una petición HTTP (reemplazar con fetch real en producción)
   */
  private async simulateHttpRequest(
    url: string,
    config: any
  ): Promise<{
    success: boolean;
    status: number;
    data?: any;
    error?: string;
  }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simular diferentes escenarios
    const scenarios = ['success', 'error', 'timeout'];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)] || scenarios[0];

    switch (scenario) {
      case 'success':
        return {
          success: true,
          status: 200,
          data: {
            transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            status: 'completed',
            timestamp: new Date().toISOString()
          }
        };

      case 'error':
        return {
          success: false,
          status: 400,
          error: 'Bad Request - Invalid account data'
        };

      case 'timeout':
        return {
          success: false,
          status: 408,
          error: 'Request Timeout'
        };

      default:
        return {
          success: false,
          status: 500,
          error: 'Internal Server Error'
        };
    }
  }

  /**
   * Registra una transacción en el sistema local
   */
  protected async recordTransaction(
    result: BankTransactionResult,
    accountId: string,
    type: 'transfer' | 'verification' | 'balance_check'
  ): Promise<void> {
    try {
      // Aquí iría el código para guardar la transacción en BD
      logger.info('Transacción bancaria registrada', {
        bank: this.bankCode,
        type,
        accountId,
        transactionId: result.transactionId,
        status: result.status,
        amount: result.amount
      });
    } catch (error) {
      logger.error('Error registrando transacción', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Maneja errores específicos del banco
   */
  protected handleBankError(error: any): BankTransactionResult {
    const errorMappings: Record<string, { code: string; message: string }> = {
      'INSUFFICIENT_FUNDS': {
        code: 'INSUFFICIENT_FUNDS',
        message: 'Fondos insuficientes en cuenta de origen'
      },
      'INVALID_ACCOUNT': {
        code: 'INVALID_ACCOUNT',
        message: 'Número de cuenta inválido o inexistente'
      },
      'ACCOUNT_BLOCKED': {
        code: 'ACCOUNT_BLOCKED',
        message: 'Cuenta bloqueada o congelada'
      },
      'DAILY_LIMIT_EXCEEDED': {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Límite diario de transferencias excedido'
      },
      'TECHNICAL_ERROR': {
        code: 'TECHNICAL_ERROR',
        message: 'Error técnico en el procesamiento'
      }
    };

    const errorCode = error.code || 'TECHNICAL_ERROR';
    const errorInfo = errorMappings[errorCode] || errorMappings.TECHNICAL_ERROR;

    return {
      success: false,
      amount: 0,
      currency: 'CLP',
      status: 'failed',
      errorCode: errorInfo.code,
      errorMessage: errorInfo.message,
      processedAt: new Date(),
      metadata: { originalError: error }
    };
  }

  /**
   * Valida parámetros de entrada
   */
  protected validateTransferParams(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number
  ): void {
    if (!fromAccount || !toAccount) {
      throw new BusinessLogicError('Cuentas de origen y destino requeridas');
    }

    if (amount <= 0) {
      throw new BusinessLogicError('Monto debe ser mayor a cero');
    }

    if (!this.config) {
      throw new BusinessLogicError(`Configuración no inicializada para banco ${this.bankCode}`);
    }

    if (amount > (this.config.config.maxAmount || 100000000)) {
      throw new BusinessLogicError('Monto excede el límite máximo permitido');
    }

    if (amount < (this.config.config.minAmount || 100)) {
      throw new BusinessLogicError('Monto por debajo del límite mínimo permitido');
    }
  }

  /**
   * Obtiene los límites de monto para esta integración
   */
  public getAmountLimits(): { min: number; max: number } {
    if (!this.config) {
      throw new BusinessLogicError(`Configuración no inicializada para banco ${this.bankCode}`);
    }

    return {
      min: this.config.config.minAmount || 100,
      max: this.config.config.maxAmount || 100000000
    };
  }

  /**
   * Genera un ID único para transacciones
   */
  protected generateTransactionId(): string {
    return `${this.bankCode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene el nombre del banco
   */
  public getBankName(): string {
    return this.config?.name || this.bankCode;
  }

  /**
   * Verifica si el servicio está disponible
   */
  public async isAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return this.config.enabled && await this.validateCredentials();
    } catch (error) {
      return false;
    }
  }
}
