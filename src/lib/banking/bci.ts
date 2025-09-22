import { BaseBankIntegration, BankTransferRequest, BankTransferResponse, BankAccountValidation } from './base-bank';
import { logger } from '@/lib/logger';
import * as crypto from 'crypto';

/**
 * Integración con BCI (Banco de Crédito e Inversiones) - API Empresarial
 * Documentación: https://developers.bci.cl/
 */
export class BCIIntegration extends BaseBankIntegration {
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor(config: {
    clientId: string;
    clientSecret: string;
    apiKey?: string;
    baseUrl?: string;
  }) {
    super({
      bankName: 'BCI',
      apiKey: config.apiKey || config.clientId,
      apiSecret: config.clientSecret,
      baseUrl: config.baseUrl || 'https://api-empresas.bci.cl/v1'
    });

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  /**
   * Autentica con la API de BCI usando OAuth2
   */
  private async authenticate(): Promise<string> {
    try {
      if (this.accessToken && this.tokenExpiration && this.tokenExpiration > new Date()) {
        return this.accessToken;
      }

      const authString = `${this.clientId}:${this.clientSecret}`;
      const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`;

      const response = await fetch(`${this.baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'transferencias cuentas'
        })
      });

      if (!response.ok) {
        throw new Error(`Error de autenticación BCI: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiration = new Date(Date.now() + (data.expires_in * 1000));

      return this.accessToken;
    } catch (error) {
      logger.error('Error en autenticación BCI:', error);
      throw error;
    }
  }

  /**
   * Genera firma digital para requests seguros
   */
  private generateSignature(payload: string, timestamp: string): string {
    const secret = this.clientSecret;
    const message = `${payload}${timestamp}`;
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  }

  /**
   * Genera headers de autenticación con firma
   */
  protected generateAuthHeaders(payload?: any): Record<string, string> {
    const timestamp = Date.now().toString();
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'X-Timestamp': timestamp,
      'X-Client-Id': this.clientId
    };

    if (payload) {
      const payloadString = JSON.stringify(payload);
      const signature = this.generateSignature(payloadString, timestamp);
      headers['X-Signature'] = signature;
      headers['X-Payload-Hash'] = crypto.createHash('sha256').update(payloadString).digest('hex');
    }

    return headers;
  }

  /**
   * Realiza una transferencia bancaria
   */
  async transfer(request: BankTransferRequest): Promise<BankTransferResponse> {
    try {
      await this.authenticate();

      // Validar cuenta destino
      const validation = await this.validateAccount({
        accountNumber: request.recipientAccount,
        rut: request.recipientRut,
        bankCode: '016', // Código BCI
        isValid: false
      });

      if (!validation.isValid) {
        return {
          success: false,
          errorMessage: 'Cuenta BCI no válida o no encontrada',
          status: 'FAILED'
        };
      }

      const transferPayload = {
        cuenta_origen: {
          numero: 'RENT360_OPERATIVA',
          rut: '77.777.777-7'
        },
        cuenta_destino: {
          numero: request.recipientAccount,
          rut: request.recipientRut,
          nombre: request.recipientName,
          tipo: 'CUENTA_CORRIENTE'
        },
        monto: {
          valor: request.amount,
          moneda: request.currency
        },
        informacion: {
          descripcion: request.description,
          referencia: request.referenceId,
          tipo_transferencia: 'INMEDIATA'
        },
        configuracion: {
          notificar_destino: true,
          requiere_autorizacion: false
        }
      };

      const response = await fetch(`${this.baseUrl}/transferencias/empresarial`, {
        method: 'POST',
        headers: this.generateAuthHeaders(transferPayload),
        body: JSON.stringify(transferPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.mensaje || `Error HTTP ${response.status}`);
      }

      const transferResult = await response.json();

      logger.info('Transferencia BCI exitosa:', {
        transactionId: transferResult.id_transaccion,
        amount: request.amount,
        recipient: request.recipientName
      });

      return {
        success: true,
        transactionId: transferResult.id_transaccion,
        status: transferResult.estado === 'EXITOSA' ? 'COMPLETED' : 'PENDING',
        trackingCode: transferResult.numero_operacion
      };

    } catch (error) {
      return this.handleBankError(error, 'transfer');
    }
  }

  /**
   * Valida una cuenta bancaria BCI
   */
  async validateAccount(validation: BankAccountValidation): Promise<BankAccountValidation> {
    try {
      await this.authenticate();

      const validationPayload = {
        cuenta: validation.accountNumber,
        rut: validation.rut,
        tipo_validacion: 'EXISTENCIA_TITULAR'
      };

      const response = await fetch(`${this.baseUrl}/cuentas/validar`, {
        method: 'POST',
        headers: this.generateAuthHeaders(validationPayload),
        body: JSON.stringify(validationPayload)
      });

      if (!response.ok) {
        return {
          ...validation,
          isValid: false,
          errorMessage: `Error validando cuenta BCI: ${response.status}`
        };
      }

      const validationResult = await response.json();

      return {
        ...validation,
        isValid: validationResult.valida,
        accountHolder: validationResult.titular?.nombre,
        errorMessage: validationResult.valida ? undefined : validationResult.motivo_rechazo
      };

    } catch (error) {
      logger.error('Error validando cuenta BCI:', error);
      return {
        ...validation,
        isValid: false,
        errorMessage: 'Error en validación de cuenta BCI'
      };
    }
  }

  /**
   * Consulta el estado de una transacción
   */
  async getTransactionStatus(transactionId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    details?: any;
  }> {
    try {
      await this.authenticate();

      const response = await fetch(`${this.baseUrl}/transferencias/${transactionId}`, {
        method: 'GET',
        headers: this.generateAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error consultando transacción BCI: ${response.status}`);
      }

      const transactionData = await response.json();

      const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
        'PENDIENTE': 'PENDING',
        'EXITOSA': 'COMPLETED',
        'FALLIDA': 'FAILED',
        'CANCELADA': 'CANCELLED',
        'RECHAZADA': 'FAILED'
      };

      return {
        status: statusMap[transactionData.estado] || 'FAILED',
        details: transactionData
      };

    } catch (error) {
      logger.error('Error consultando transacción BCI:', error);
      return {
        status: 'FAILED',
        details: { error: error.message }
      };
    }
  }

  /**
   * Obtiene el saldo disponible
   */
  async getBalance(): Promise<{
    available: number;
    currency: string;
    lastUpdated: Date;
  }> {
    try {
      await this.authenticate();

      const response = await fetch(`${this.baseUrl}/cuentas/RENT360_OPERATIVA/saldo`, {
        method: 'GET',
        headers: this.generateAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo saldo BCI: ${response.status}`);
      }

      const balanceData = await response.json();

      return {
        available: balanceData.saldo_disponible,
        currency: balanceData.moneda,
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error obteniendo saldo BCI:', error);
      throw error;
    }
  }
}
