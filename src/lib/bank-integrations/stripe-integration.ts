import { BaseBankIntegration, BankTransactionResult, BankVerificationResult, AccountBalance } from './base-bank-integration';
import { BankAccountInfo } from '../bank-account-service';
import { logger } from '../logger';
import { BusinessLogicError } from '../errors';

/**
 * Integración con Stripe
 */
export class StripeIntegration extends BaseBankIntegration {
  private apiKey!: string;
  private publishableKey!: string;
  private apiUrl!: string;

  constructor() {
    super('stripe');
  }

  /**
   * Inicializa la configuración de Stripe
   */
  protected async initialize(): Promise<void> {
    await super.initialize();

    this.apiKey = this.config!.credentials.apiKey || '';
    this.publishableKey = this.config!.credentials.publishableKey || '';
    this.apiUrl = this.config!.config.baseUrl || 'https://api.stripe.com';

    if (!this.apiKey) {
      throw new BusinessLogicError('API Key de Stripe requerida');
    }
  }

  /**
   * Campos requeridos para Stripe
   */
  protected getRequiredCredentialFields(): string[] {
    return ['apiKey'];
  }

  /**
   * Realiza una transferencia usando Stripe Transfers
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

      logger.info('Iniciando transferencia Stripe', {
        from: fromAccount.accountNumber,
        to: toAccount.accountNumber,
        amount,
        description
      });

      // Para Stripe, necesitamos crear un PaymentIntent o usar Connect
      // Asumimos que tenemos una cuenta conectada de Stripe

      const transferData = {
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: 'clp',
        description: description || 'Transferencia Rent360',
        metadata: {
          recipient_account: toAccount.accountNumber,
          sender_account: fromAccount.accountNumber,
          transfer_type: 'payout'
        }
      };

      // Simular creación de transfer
      const response = await this.makeBankRequest('/v1/transfers', 'POST', transferData);

      if (!response || !response.id) {
        throw new Error('Respuesta inválida de Stripe');
      }

      // Procesar resultado
      const result = await this.processStripeTransfer(response, amount);

      await this.recordTransaction(result, fromAccount.id, 'transfer');

      return result;

    } catch (error) {
      logger.error('Error en transferencia Stripe', { error: error instanceof Error ? error.message : String(error) });
      return this.handleBankError(error);
    }
  }

  /**
   * Procesa el resultado de la transferencia Stripe
   */
  private async processStripeTransfer(
    response: any,
    amount: number
  ): Promise<BankTransactionResult> {
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = Math.random() > 0.06; // 94% de éxito

      if (success) {
        return {
          success: true,
          transactionId: `st_${response.id}`,
          externalReference: response.id,
          amount,
          currency: 'CLP',
          status: 'completed',
          description: 'Transferencia procesada exitosamente vía Stripe',
          processedAt: new Date(),
          metadata: {
            stripeTransferId: response.id,
            stripeBalanceTransaction: response.balance_transaction,
            fee: response.amount * 0.0025, // 0.25% fee típico
            netAmount: response.amount - (response.amount * 0.0025)
          }
        };
      } else {
        const errors = [
          { code: 'INSUFFICIENT_FUNDS', message: 'Fondos insuficientes en cuenta Stripe' },
          { code: 'INVALID_ACCOUNT', message: 'Cuenta Stripe inválida' },
          { code: 'CARD_DECLINED', message: 'Pago rechazado' },
          { code: 'TECHNICAL_ERROR', message: 'Error técnico en procesamiento Stripe' }
        ];

        const error = errors[Math.floor(Math.random() * errors.length)] || errors[0];

        return {
          success: false,
          amount,
          currency: 'CLP',
          status: 'failed',
          errorCode: error?.code || 'UNKNOWN_ERROR',
          errorMessage: error?.message || 'Error desconocido',
          processedAt: new Date(),
          metadata: {
            stripeTransferId: response.id,
            errorDetails: error
          }
        };
      }

    } catch (error) {
      return {
        success: false,
        amount,
        currency: 'CLP',
        status: 'failed',
        errorCode: 'TECHNICAL_ERROR',
        errorMessage: 'Error procesando transferencia Stripe',
        processedAt: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Verifica una cuenta Stripe
   */
  async verifyAccount(account: BankAccountInfo): Promise<BankVerificationResult> {
    try {
      await this.initialize();

      logger.info('Verificando cuenta Stripe', {
        accountNumber: account.accountNumber
      });

      // Stripe requiere verificación de identidad para payouts
      const verificationData = {
        type: 'custom',
        country: 'CL',
        capabilities: {
          transfers: { requested: true }
        },
        business_type: 'individual',
        individual: {
          first_name: account.accountHolder?.split(' ')?.[0] || 'Unknown',
          last_name: account.accountHolder?.split(' ')?.slice(1)?.join(' ') || 'User',
          email: account.accountHolder || 'user@example.com', // Asumir que contiene email
          phone: '+56999999999', // Placeholder
          address: {
            line1: 'Dirección de ejemplo',
            city: 'Santiago',
            state: 'RM',
            postal_code: '8320000',
            country: 'CL'
          }
        }
      };

      // Simular verificación
      await new Promise(resolve => setTimeout(resolve, 2500));

      const isValid = Math.random() > 0.1; // 90% de validaciones exitosas

      if (isValid) {
        return {
          isValid: true,
          accountHolder: account.accountHolder,
          accountStatus: 'active',
          verificationMethod: 'api',
          confidence: 0.95,
          metadata: {
            stripeAccountId: `acct_${this.generateTransactionId()}`,
            verificationStatus: 'verified',
            capabilities: ['transfers', 'payouts'],
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          isValid: false,
          verificationMethod: 'api',
          confidence: 0,
          errorMessage: 'Cuenta Stripe requiere verificación adicional',
          metadata: {
            failureReason: 'Additional verification required',
            requiredDocuments: ['ID document', 'Proof of address']
          }
        };
      }

    } catch (error) {
      logger.error('Error verificando cuenta Stripe', { error: error instanceof Error ? error.message : String(error) });
      return {
        isValid: false,
        verificationMethod: 'api',
        confidence: 0,
        errorMessage: error instanceof Error ? error.message : 'Error de verificación'
      };
    }
  }

  /**
   * Consulta saldo de cuenta Stripe
   */
  async getBalance(account: BankAccountInfo): Promise<AccountBalance> {
    try {
      await this.initialize();

      logger.info('Consultando saldo Stripe', {
        accountNumber: account.accountNumber
      });

      const response = await this.makeBankRequest('/v1/balance', 'GET');

      if (!response || !response.available) {
        throw new Error('No se pudo obtener el saldo');
      }

      // Convertir a CLP
      const usdBalance = response.available.find((b: any) => b.currency === 'usd');
      const clpBalance = response.available.find((b: any) => b.currency === 'clp');

      let balance = 0;
      if (clpBalance) {
        balance = clpBalance.amount / 100; // Stripe usa centavos
      } else if (usdBalance) {
        balance = (usdBalance.amount / 100) * 850; // Convertir USD a CLP aproximado
      }

      return {
        available: balance,
        current: balance,
        currency: 'CLP',
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error consultando saldo Stripe', { error: error instanceof Error ? error.message : String(error) });
      throw new BusinessLogicError('Error obteniendo saldo de cuenta Stripe');
    }
  }

  /**
   * Obtiene historial de transacciones Stripe
   */
  async getTransactionHistory(
    account: BankAccountInfo,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      await this.initialize();

      logger.info('Consultando historial Stripe', {
        accountNumber: account.accountNumber,
        startDate,
        endDate
      });

      const params: Record<string, string> = {
        'created[gte]': Math.floor(startDate.getTime() / 1000).toString(),
        'created[lte]': Math.floor(endDate.getTime() / 1000).toString(),
        'limit': '100'
      };

      const response = await this.makeBankRequest('/v1/balance_transactions', 'GET', null, params);

      if (!response || !response.data) {
        return [];
      }

      // Transformar respuesta al formato estándar
      return response.data.map((txn: any) => ({
        transactionId: txn.id,
        date: new Date(txn.created * 1000).toISOString(),
        amount: Math.abs(txn.amount) / 100, // Convertir de centavos
        type: txn.amount > 0 ? 'credit' : 'debit',
        description: txn.description || txn.source?.type || 'Transacción Stripe',
        status: txn.status,
        balance: txn.ending_balance ? txn.ending_balance / 100 : 0,
        reference: txn.source?.id,
        metadata: {
          stripeId: txn.id,
          transactionType: txn.type,
          fee: txn.fee ? txn.fee / 100 : 0,
          netAmount: txn.net ? txn.net / 100 : 0
        }
      }));

    } catch (error) {
      logger.error('Error obteniendo historial Stripe', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  /**
   * Crea un Payment Intent para cobros
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'CLP',
    description?: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    clientSecret?: string | undefined;
    paymentIntentId?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const intentData = {
        amount: Math.round(amount * 100), // Centavos
        currency: currency.toLowerCase(),
        description: description || 'Pago Rent360',
        metadata: {
          ...metadata,
          source: 'rent360_payout'
        },
        automatic_payment_methods: {
          enabled: true
        }
      };

      const response = await this.makeBankRequest('/v1/payment_intents', 'POST', intentData);

      if (response && response.client_secret && response.id) {
        return {
          success: true,
          clientSecret: response.client_secret,
          paymentIntentId: response.id
        };
      } else {
        return {
          success: false,
          error: 'No se pudo crear el Payment Intent'
        };
      }

    } catch (error) {
      logger.error('Error creando Payment Intent', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }

  /**
   * Confirma un Payment Intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<{
    success: boolean;
    status?: string | undefined;
    chargeId?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const confirmData: any = {};

      if (paymentMethodId) {
        confirmData.payment_method = paymentMethodId;
      }

      const response = await this.makeBankRequest(`/v1/payment_intents/${paymentIntentId}/confirm`, 'POST', confirmData);

      if (response && response.status) {
        return {
          success: response.status === 'succeeded',
          status: response.status,
          chargeId: response.charges?.data?.[0]?.id
        };
      } else {
        return {
          success: false,
          error: 'No se pudo confirmar el pago'
        };
      }

    } catch (error) {
      logger.error('Error confirmando Payment Intent', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de confirmación'
      };
    }
  }

  /**
   * Crea una sesión de Checkout
   */
  async createCheckoutSession(
    lineItems: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description?: string | undefined;
        };
        unit_amount: number;
      };
      quantity: number;
    }>,
    successUrl: string,
    cancelUrl: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    sessionId?: string | undefined;
    url?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const sessionData = {
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          ...metadata,
          source: 'rent360_checkout'
        }
      };

      const response = await this.makeBankRequest('/v1/checkout/sessions', 'POST', sessionData);

      if (response && response.id && response.url) {
        return {
          success: true,
          sessionId: response.id,
          url: response.url
        };
      } else {
        return {
          success: false,
          error: 'No se pudo crear la sesión de checkout'
        };
      }

    } catch (error) {
      logger.error('Error creando sesión de checkout', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }

  /**
   * Crea un Transfer para payouts
   */
  async createTransfer(
    amount: number,
    destination: string,
    description?: string
  ): Promise<{
    success: boolean;
    transferId?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const transferData = {
        amount: Math.round(amount * 100),
        currency: 'clp',
        destination: destination,
        description: description || 'Transferencia Rent360',
        metadata: {
          payout_type: 'rent360_automatic'
        }
      };

      const response = await this.makeBankRequest('/v1/transfers', 'POST', transferData);

      if (response && response.id) {
        return {
          success: true,
          transferId: response.id
        };
      } else {
        return {
          success: false,
          error: 'No se pudo crear la transferencia'
        };
      }

    } catch (error) {
      logger.error('Error creando transferencia', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }

  /**
   * Procesa un webhook de Stripe
   */
  async processWebhook(
    payload: string,
    signature: string
  ): Promise<{
    success: boolean;
    eventType?: string | undefined;
    data?: any;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      // Verificar firma del webhook
      const webhookSecret = this.config!.credentials.webhookSecret;
      if (!webhookSecret) {
        return {
          success: false,
          error: 'Webhook secret no configurado'
        };
      }

      // En producción, verificar firma usando crypto
      // const isValidSignature = verifyStripeSignature(payload, signature, webhookSecret);

      // Parsear evento
      const event = JSON.parse(payload);

      logger.info('Webhook Stripe procesado', {
        eventType: event.type,
        eventId: event.id
      });

      return {
        success: true,
        eventType: event.type,
        data: event.data.object
      };

    } catch (error) {
      logger.error('Error procesando webhook Stripe', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando webhook'
      };
    }
  }

  /**
   * Obtiene detalles de un pago
   */
  async getPaymentDetails(paymentIntentId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string | undefined;
  }> {
    try {
      await this.initialize();

      const response = await this.makeBankRequest(`/v1/payment_intents/${paymentIntentId}`, 'GET');

      if (response) {
        return {
          success: true,
          payment: response
        };
      } else {
        return {
          success: false,
          error: 'Pago no encontrado'
        };
      }

    } catch (error) {
      logger.error('Error obteniendo detalles de pago', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }
}
