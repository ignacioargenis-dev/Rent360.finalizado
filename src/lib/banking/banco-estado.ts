import { BaseBankIntegration, BankTransferRequest, BankTransferResponse, BankAccountValidation } from './base-bank';
import { logger } from '@/lib/logger-minimal';

/**
 * Integración con Banco Estado - API de Transferencias
 * Documentación: https://developers.bancoestado.cl/
 */
export class BancoEstadoIntegration extends BaseBankIntegration {
  private accessToken: string | null = null;
  private tokenExpiration: Date | null = null;

  constructor(config: {
    apiKey: string;
    apiSecret: string;
    baseUrl?: string | undefined;
  }) {
    super({
      bankName: 'Banco Estado',
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      baseUrl: config.baseUrl || 'https://api-empresas.bancoestado.cl/v1'
    });
  }

  /**
   * Autentica con la API de Banco Estado
   */
  private async authenticate(): Promise<string> {
    try {
      if (this.accessToken && this.tokenExpiration && this.tokenExpiration > new Date()) {
        return this.accessToken!;
      }

      const response = await fetch(`${this.baseUrl}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.apiKey}:${this.apiSecret}`)}`,
          'X-Client-Id': this.apiKey
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'transferencias cuentas'
        })
      });

      if (!response.ok) {
        throw new Error(`Error de autenticación: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiration = new Date(Date.now() + (data.expires_in * 1000));

      return this.accessToken!;
    } catch (error) {
      logger.error('Error en autenticación Banco Estado', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Genera headers de autenticación
   */
  protected generateAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken!}`,
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey
    };
  }

  /**
   * Realiza una transferencia bancaria
   */
  async transfer(request: BankTransferRequest): Promise<BankTransferResponse> {
    try {
      await this.authenticate();

      // Validar cuenta destino primero
      const validation = await this.validateAccount({
        accountNumber: request.recipientAccount,
        rut: request.recipientRut,
        bankCode: '012', // Código de Banco Estado
        isValid: false
      });

      if (!validation.isValid) {
        return {
          success: false,
          errorMessage: 'Cuenta bancaria no válida o no encontrada',
          status: 'FAILED'
        };
      }

      const transferPayload = {
        origen: {
          cuenta: 'RENT360_OPERATIVA', // Cuenta operativa de Rent360
          rut: '77.777.777-7' // RUT de Rent360
        },
        destino: {
          cuenta: request.recipientAccount,
          rut: request.recipientRut,
          nombre: request.recipientName,
          banco: request.recipientBank
        },
        monto: request.amount,
        moneda: request.currency,
        descripcion: request.description,
        referencia: request.referenceId,
        tipo: 'TRANSFERENCIA_INMEDIATA'
      };

      const response = await fetch(`${this.baseUrl}/transferencias/inmediatas`, {
        method: 'POST',
        headers: this.generateAuthHeaders(),
        body: JSON.stringify(transferPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error HTTP ${response.status}`);
      }

      const transferResult = await response.json();

      logger.info('Transferencia Banco Estado exitosa:', {
        transactionId: transferResult.idTransferencia,
        amount: request.amount,
        recipient: request.recipientName
      });

      return {
        success: true,
        transactionId: transferResult.idTransferencia,
        status: transferResult.estado === 'EXITOSA' ? 'COMPLETED' : 'PENDING',
        trackingCode: transferResult.numeroComprobante
      };

    } catch (error) {
      return this.handleBankError(error, 'transfer');
    }
  }

  /**
   * Valida una cuenta bancaria
   */
  async validateAccount(validation: BankAccountValidation): Promise<BankAccountValidation> {
    try {
      await this.authenticate();

      const response = await fetch(`${this.baseUrl}/cuentas/validar-destino`, {
        method: 'POST',
        headers: this.generateAuthHeaders(),
        body: JSON.stringify({
          numeroCuenta: validation.accountNumber,
          rutDestinatario: validation.rut.replace(/\./g, '').replace(/-/g, ''),
          codigoBanco: validation.bankCode,
          tipoCuenta: 'CUENTA_CORRIENTE'
        })
      });

      if (!response.ok) {
        return {
          ...validation,
          isValid: false,
          errorMessage: `Error en validación: ${response.status}`
        };
      }

      const validationResult = await response.json();

      const result: BankAccountValidation = {
        accountNumber: validation.accountNumber,
        rut: validation.rut,
        bankCode: validation.bankCode,
        isValid: validationResult.esValida,
        accountHolder: validationResult.nombreTitular
      };

      if (!validationResult.esValida) {
        result.errorMessage = validationResult.mensajeError || 'Cuenta no válida';
      }

      return result;

    } catch (error) {
      logger.error('Error validando cuenta Banco Estado', { error: error instanceof Error ? error.message : String(error) });
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
  async getTransactionStatus(transactionId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    details?: any;
  }> {
    try {
      await this.authenticate();

      const response = await fetch(`${this.baseUrl}/transferencias/${transactionId}/estado`, {
        method: 'GET',
        headers: this.generateAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error consultando transacción: ${response.status}`);
      }

      const transactionData = await response.json();

      const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'> = {
        'PENDIENTE': 'PENDING',
        'EN_PROCESO': 'PENDING',
        'EXITOSA': 'COMPLETED',
        'COMPLETADA': 'COMPLETED',
        'FALLIDA': 'FAILED',
        'RECHAZADA': 'FAILED',
        'CANCELADA': 'CANCELLED'
      };

      return {
        status: statusMap[transactionData.estado] || 'FAILED',
        details: transactionData
      };

    } catch (error) {
      logger.error('Error consultando transacción Banco Estado', { error: error instanceof Error ? error.message : String(error) });
      return {
        status: 'FAILED',
        details: { error: error instanceof Error ? error.message : String(error) }
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

      const response = await fetch(`${this.baseUrl}/cuentas/saldo`, {
        method: 'GET',
        headers: this.generateAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Error obteniendo saldo: ${response.status}`);
      }

      const balanceData = await response.json();

      return {
        available: balanceData.saldoDisponible,
        currency: balanceData.moneda || 'CLP',
        lastUpdated: new Date()
      };

    } catch (error) {
      logger.error('Error obteniendo saldo Banco Estado', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }
}
