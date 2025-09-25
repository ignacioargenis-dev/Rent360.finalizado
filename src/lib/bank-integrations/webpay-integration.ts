import { BaseBankIntegration, BankTransactionResult, BankVerificationResult, AccountBalance } from './base-bank-integration';
import { BankAccountInfo } from '../bank-account-service';
import { logger } from '../logger';
import { BusinessLogicError } from '../errors';

/**
 * Integración con WebPay (Transbank)
 */
export class WebPayIntegration extends BaseBankIntegration {
  private apiKey!: string;
  private commerceCode!: string;
  private apiUrl!: string;

  constructor() {
    super('webpay');
  }

  /**
   * Inicializa la configuración de WebPay
   */
  protected async initialize(): Promise<void> {
    await super.initialize();

    this.apiKey = this.config!.credentials.apiKey || '';
    this.commerceCode = this.config!.credentials.merchantId || '';
    this.apiUrl = this.config!.config.baseUrl || 'https://api.webpay.cl';

    if (!this.apiKey || !this.commerceCode) {
      throw new BusinessLogicError('Credenciales de WebPay incompletas');
    }
  }

  /**
   * Campos requeridos para WebPay
   */
  protected getRequiredCredentialFields(): string[] {
    return ['apiKey', 'merchantId'];
  }

  /**
   * Realiza una transferencia usando WebPay
   */
  async transfer(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number,
    description?: string
  ): Promise<BankTransactionResult> {
    try {
      await this.initialize();
      this.validateTransferParams(fromAccount, toAccount, amount);

      logger.info('Iniciando transferencia WebPay', {
        from: fromAccount.accountNumber,
        to: toAccount.accountNumber,
        amount,
        description
      });

      // Preparar datos para WebPay OneClick
      const transferData = {
        commerceCode: this.commerceCode,
        buyOrder: this.generateTransactionId(),
        amount,
        returnUrl: this.config!.config.returnUrl,
        sessionId: `session_${Date.now()}`,
        details: [{
          commerceCode: this.commerceCode,
          buyOrder: this.generateTransactionId(),
          amount,
          description: description || 'Transferencia Rent360'
        }]
      };

      // Iniciar transacción con WebPay
      const initResponse = await this.makeBankRequest('/rswebpaytransaction/api/oneclick/v1.0/transactions', 'POST', transferData);

      if (!initResponse || !initResponse.token) {
        throw new Error('No se pudo iniciar la transacción WebPay');
      }

      // Simular procesamiento de la transacción
      const result = await this.processWebPayTransaction(initResponse.token, transferData);

      await this.recordTransaction(result, fromAccount.id, 'transfer');

      return result;

    } catch (error) {
      logger.error('Error en transferencia WebPay', { error: error instanceof Error ? error.message : String(error) });
      return this.handleBankError(error);
    }
  }

  /**
   * Procesa la transacción WebPay
   */
  private async processWebPayTransaction(
    token: string,
    transferData: any
  ): Promise<BankTransactionResult> {
    try {
      // Simular el procesamiento completo
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular resultado exitoso (85% de éxito)
      const success = Math.random() > 0.15;

      if (success) {
        return {
          success: true,
          transactionId: `wp_${this.generateTransactionId()}`,
          externalReference: token,
          amount: transferData.amount,
          currency: 'CLP',
          status: 'completed',
          description: 'Transferencia procesada exitosamente vía WebPay',
          processedAt: new Date(),
          metadata: {
            webpayToken: token,
            commerceCode: this.commerceCode,
            authorizationCode: `auth_${Date.now()}`
          }
        };
      } else {
        // Simular diferentes tipos de error
        const errors = [
          { code: 'INSUFFICIENT_FUNDS', message: 'Fondos insuficientes' },
          { code: 'INVALID_ACCOUNT', message: 'Cuenta inválida' },
          { code: 'TECHNICAL_ERROR', message: 'Error técnico WebPay' }
        ];

        const error = errors[Math.floor(Math.random() * errors.length)] || errors[0];

        return {
          success: false,
          amount: transferData.amount,
          currency: 'CLP',
          status: 'failed',
          errorCode: error?.code || 'UNKNOWN_ERROR',
          errorMessage: error?.message || 'Error desconocido',
          processedAt: new Date(),
          metadata: {
            webpayToken: token,
            errorDetails: error
          }
        };
      }

    } catch (error) {
      return {
        success: false,
        amount: transferData.amount,
        currency: 'CLP',
        status: 'failed',
        errorCode: 'TECHNICAL_ERROR',
        errorMessage: 'Error procesando transacción WebPay',
        processedAt: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Verifica una cuenta bancaria usando WebPay
   */
  async verifyAccount(account: BankAccountInfo): Promise<BankVerificationResult> {
    try {
      await this.initialize();

      logger.info('Verificando cuenta con WebPay', {
        accountNumber: account.accountNumber,
        bankCode: account.bankCode
      });

      // WebPay tiene capacidades limitadas de verificación
      // En producción, usar servicios adicionales o APIs bancarias directas

      const verificationData = {
        commerceCode: this.commerceCode,
        accountNumber: account.accountNumber,
        rut: account.rut,
        accountHolder: account.accountHolder
      };

      // Simular verificación
      await new Promise(resolve => setTimeout(resolve, 1500));

      const isValid = Math.random() > 0.2; // 80% de éxito

      if (isValid) {
        return {
          isValid: true,
          accountHolder: account.accountHolder,
          accountStatus: 'active',
          verificationMethod: 'api',
          confidence: 0.85,
          metadata: {
            webpayVerificationId: `ver_${Date.now()}`,
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          isValid: false,
          verificationMethod: 'api',
          confidence: 0,
          errorMessage: 'Cuenta no pudo ser verificada',
          metadata: {
            failureReason: 'Account not found or invalid'
          }
        };
      }

    } catch (error) {
      logger.error('Error verificando cuenta con WebPay', { error: error instanceof Error ? error.message : String(error) });
      return {
        isValid: false,
        verificationMethod: 'api',
        confidence: 0,
        errorMessage: error instanceof Error ? error.message : 'Error de verificación'
      };
    }
  }

  /**
   * Consulta saldo usando WebPay (limitado)
   */
  async getBalance(account: BankAccountInfo): Promise<AccountBalance> {
    try {
      await this.initialize();

      // WebPay no proporciona consulta de saldos directamente
      // En producción, integrar con APIs bancarias específicas

      logger.warn('Consulta de saldo no disponible en WebPay', {
        accountNumber: account.accountNumber
      });

      throw new BusinessLogicError('Consulta de saldo no soportada por WebPay');

    } catch (error) {
      logger.error('Error consultando saldo en WebPay', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene historial de transacciones
   */
  async getTransactionHistory(
    account: BankAccountInfo,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      await this.initialize();

      logger.info('Consultando historial WebPay', {
        accountNumber: account.accountNumber,
        startDate,
        endDate
      });

      // En producción, consultar API de WebPay para transacciones
      const historyData = {
        commerceCode: this.commerceCode,
        accountNumber: account.accountNumber,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      // Simular consulta de historial
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Retornar historial simulado
      return [
        {
          transactionId: `wp_txn_001`,
          date: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
          amount: 50000,
          type: 'debit',
          description: 'Transferencia Rent360',
          status: 'completed'
        },
        {
          transactionId: `wp_txn_002`,
          date: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
          amount: 75000,
          type: 'credit',
          description: 'Depósito',
          status: 'completed'
        }
      ];

    } catch (error) {
      logger.error('Error obteniendo historial WebPay', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Crea una transacción OneClick Mall (múltiples productos)
   */
  async createOneClickMallTransaction(
    transactions: Array<{
      commerceCode: string;
      amount: number;
      description: string;
    }>
  ): Promise<{
    success: boolean;
    token?: string | undefined;
    url?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const mallData = {
        buyOrder: this.generateTransactionId(),
        sessionId: `session_${Date.now()}`,
        returnUrl: this.config!.config.returnUrl,
        details: transactions.map((txn, index) => ({
          commerceCode: txn.commerceCode,
          buyOrder: `${this.generateTransactionId()}_${index}`,
          amount: txn.amount,
          description: txn.description
        }))
      };

      const response = await this.makeBankRequest('/rswebpaytransaction/api/oneclick/v1.0/transactions/mall', 'POST', mallData);

      if (response && response.token && response.url) {
        return {
          success: true,
          token: response.token,
          url: response.url
        };
      } else {
        return {
          success: false,
          error: 'No se pudo crear la transacción OneClick Mall'
        };
      }

    } catch (error) {
      logger.error('Error creando transacción OneClick Mall', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }

  /**
   * Confirma una transacción WebPay
   */
  async confirmTransaction(token: string): Promise<{
    success: boolean;
    transactionId?: string | undefined;
    authorizationCode?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const confirmData = {
        token
      };

      const response = await this.makeBankRequest('/rswebpaytransaction/api/oneclick/v1.0/transactions', 'PUT', confirmData);

      if (response && response.responseCode === 0) {
        return {
          success: true,
          transactionId: response.buyOrder,
          authorizationCode: response.authorizationCode
        };
      } else {
        return {
          success: false,
          error: response.error || 'Transacción rechazada'
        };
      }

    } catch (error) {
      logger.error('Error confirmando transacción WebPay', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de confirmación'
      };
    }
  }

  /**
   * Reversa una transacción WebPay
   */
  async reverseTransaction(
    buyOrder: string,
    commerceCode?: string
  ): Promise<{
    success: boolean;
    reversalId?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const reverseData = {
        buyOrder,
        commerceCode: commerceCode || this.commerceCode
      };

      const response = await this.makeBankRequest('/rswebpaytransaction/api/oneclick/v1.0/transactions/reverse', 'POST', reverseData);

      if (response && response.reversalId) {
        return {
          success: true,
          reversalId: response.reversalId
        };
      } else {
        return {
          success: false,
          error: response.error || 'No se pudo reversar la transacción'
        };
      }

    } catch (error) {
      logger.error('Error reversando transacción WebPay', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de reversión'
      };
    }
  }
}
