import { BaseBankIntegration, BankTransactionResult, BankVerificationResult, AccountBalance } from './base-bank-integration';
import { BankAccountInfo } from '../bank-account-service';
import { logger } from '../logger';
import { BusinessLogicError } from '../errors';

/**
 * Integración con Banco Estado de Chile
 */
export class BancoEstadoIntegration extends BaseBankIntegration {
  private clientId: string;
  private clientSecret: string;
  private apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    super('banco_estado');
  }

  /**
   * Inicializa la configuración de Banco Estado
   */
  protected async initialize(): Promise<void> {
    await super.initialize();

    this.clientId = this.config.credentials.clientId || '';
    this.clientSecret = this.config.credentials.clientSecret || '';
    this.apiUrl = this.config.config.baseUrl || 'https://api.bancoestado.cl';

    if (!this.clientId || !this.clientSecret) {
      throw new BusinessLogicError('Credenciales de Banco Estado incompletas');
    }
  }

  /**
   * Campos requeridos para Banco Estado
   */
  protected getRequiredCredentialFields(): string[] {
    return ['clientId', 'clientSecret'];
  }

  /**
   * Obtiene token de acceso de Banco Estado
   */
  private async getAccessToken(): Promise<string> {
    try {
      // Verificar si el token actual es válido
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
        return this.accessToken;
      }

      const tokenData = {
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'transferencias cuentas'
      };

      const response = await this.makeBankRequest('/oauth/token', 'POST', tokenData, {
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      if (!response || !response.access_token) {
        throw new Error('No se pudo obtener token de acceso');
      }

      this.accessToken = response.access_token;
      // Token válido por 1 hora (configurable)
      this.tokenExpiry = new Date(Date.now() + (response.expires_in || 3600) * 1000);

      logger.info('Token de acceso Banco Estado obtenido');

      return this.accessToken;

    } catch (error) {
      logger.error('Error obteniendo token de acceso Banco Estado:', error);
      throw new BusinessLogicError('Error de autenticación con Banco Estado');
    }
  }

  /**
   * Realiza una transferencia usando Banco Estado
   */
  async transfer(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number,
    description?: string
  ): Promise<BankTransactionResult> {
    try {
      await this.initialize();
      await this.getAccessToken();
      this.validateTransferParams(fromAccount, toAccount, amount);

      logger.info('Iniciando transferencia Banco Estado', {
        from: fromAccount.accountNumber,
        to: toAccount.accountNumber,
        amount,
        description
      });

      const transferData = {
        cuentaOrigen: fromAccount.accountNumber,
        cuentaDestino: toAccount.accountNumber,
        monto: amount,
        descripcion: description || 'Transferencia Rent360',
        tipoTransferencia: 'inmediata',
        rutDestinatario: toAccount.rut,
        nombreDestinatario: toAccount.accountHolder,
        emailNotificacion: 'payouts@rent360.cl' // Configurable
      };

      const response = await this.makeBankRequest('/api/transferencias/realizar', 'POST', transferData);

      if (!response || !response.idTransferencia) {
        throw new Error('Respuesta inválida de Banco Estado');
      }

      // Procesar resultado
      const result = await this.processBancoEstadoTransaction(response, amount);

      await this.recordTransaction(result, fromAccount.id, 'transfer');

      return result;

    } catch (error) {
      logger.error('Error en transferencia Banco Estado:', error);
      return this.handleBankError(error);
    }
  }

  /**
   * Procesa el resultado de la transacción Banco Estado
   */
  private async processBancoEstadoTransaction(
    response: any,
    amount: number
  ): Promise<BankTransactionResult> {
    try {
      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2500));

      const success = Math.random() > 0.12; // 88% de éxito

      if (success) {
        return {
          success: true,
          transactionId: `be_${response.idTransferencia}`,
          externalReference: response.idTransferencia,
          amount,
          currency: 'CLP',
          status: 'completed',
          description: 'Transferencia procesada exitosamente vía Banco Estado',
          processedAt: new Date(),
          metadata: {
            bancoEstadoId: response.idTransferencia,
            authorizationCode: response.codigoAutorizacion,
            processingTime: response.tiempoProcesamiento
          }
        };
      } else {
        const errors = [
          { code: 'INSUFFICIENT_FUNDS', message: 'Saldo insuficiente en cuenta origen' },
          { code: 'INVALID_DESTINATION', message: 'Cuenta destino inválida o inexistente' },
          { code: 'DAILY_LIMIT_EXCEEDED', message: 'Límite diario de transferencias excedido' },
          { code: 'TECHNICAL_ERROR', message: 'Error técnico en procesamiento' }
        ];

        const error = errors[Math.floor(Math.random() * errors.length)];

        return {
          success: false,
          amount,
          currency: 'CLP',
          status: 'failed',
          errorCode: error.code,
          errorMessage: error.message,
          processedAt: new Date(),
          metadata: {
            bancoEstadoId: response.idTransferencia,
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
        errorMessage: 'Error procesando transacción Banco Estado',
        processedAt: new Date(),
        metadata: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  }

  /**
   * Verifica una cuenta bancaria usando Banco Estado
   */
  async verifyAccount(account: BankAccountInfo): Promise<BankVerificationResult> {
    try {
      await this.initialize();
      await this.getAccessToken();

      logger.info('Verificando cuenta con Banco Estado', {
        accountNumber: account.accountNumber,
        rut: account.rut
      });

      const verificationData = {
        numeroCuenta: account.accountNumber,
        rut: account.rut,
        tipoVerificacion: 'basica' // basica, completa, saldo
      };

      const response = await this.makeBankRequest('/api/cuentas/verificar', 'POST', verificationData);

      if (!response) {
        throw new Error('Respuesta inválida de verificación');
      }

      // Procesar resultado de verificación
      const isValid = response.valida && Math.random() > 0.1; // 90% de validaciones exitosas

      if (isValid) {
        return {
          isValid: true,
          accountHolder: response.nombreTitular || account.accountHolder,
          accountStatus: response.estadoCuenta === 'activa' ? 'active' : 'inactive',
          verificationMethod: 'api',
          confidence: 0.95,
          metadata: {
            bancoEstadoVerificationId: response.idVerificacion,
            accountType: response.tipoCuenta,
            branchCode: response.codigoSucursal,
            verifiedAt: new Date().toISOString()
          }
        };
      } else {
        return {
          isValid: false,
          verificationMethod: 'api',
          confidence: 0,
          errorMessage: response.mensajeError || 'Cuenta no pudo ser verificada',
          metadata: {
            failureReason: response.motivoRechazo,
            bancoEstadoVerificationId: response.idVerificacion
          }
        };
      }

    } catch (error) {
      logger.error('Error verificando cuenta con Banco Estado:', error);
      return {
        isValid: false,
        verificationMethod: 'api',
        confidence: 0,
        errorMessage: error instanceof Error ? error.message : 'Error de verificación'
      };
    }
  }

  /**
   * Consulta el saldo de una cuenta usando Banco Estado
   */
  async getBalance(account: BankAccountInfo): Promise<AccountBalance> {
    try {
      await this.initialize();
      await this.getAccessToken();

      logger.info('Consultando saldo Banco Estado', {
        accountNumber: account.accountNumber
      });

      const balanceData = {
        numeroCuenta: account.accountNumber,
        rut: account.rut
      };

      const response = await this.makeBankRequest('/api/cuentas/saldo', 'GET', null, {
        ...balanceData
      });

      if (!response) {
        throw new Error('No se pudo obtener el saldo');
      }

      return {
        available: response.saldoDisponible || 0,
        current: response.saldoActual || 0,
        currency: 'CLP',
        lastUpdated: new Date(response.fechaActualizacion || Date.now())
      };

    } catch (error) {
      logger.error('Error consultando saldo Banco Estado:', error);
      throw new BusinessLogicError('Error obteniendo saldo de cuenta');
    }
  }

  /**
   * Obtiene historial de transacciones usando Banco Estado
   */
  async getTransactionHistory(
    account: BankAccountInfo,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    try {
      await this.initialize();
      await this.getAccessToken();

      logger.info('Consultando historial Banco Estado', {
        accountNumber: account.accountNumber,
        startDate,
        endDate
      });

      const historyData = {
        numeroCuenta: account.accountNumber,
        rut: account.rut,
        fechaDesde: startDate.toISOString().split('T')[0],
        fechaHasta: endDate.toISOString().split('T')[0],
        tipoMovimiento: 'todos' // debito, credito, todos
      };

      const response = await this.makeBankRequest('/api/cuentas/movimientos', 'GET', null, {
        ...historyData
      });

      if (!response || !response.movimientos) {
        return [];
      }

      // Transformar respuesta al formato estándar
      return response.movimientos.map((mov: any) => ({
        transactionId: mov.idMovimiento,
        date: new Date(mov.fechaMovimiento).toISOString(),
        amount: Math.abs(mov.monto),
        type: mov.monto > 0 ? 'credit' : 'debit',
        description: mov.descripcion || mov.glosa,
        status: 'completed',
        balance: mov.saldoPostMovimiento,
        reference: mov.numeroReferencia,
        metadata: {
          bancoEstadoId: mov.idMovimiento,
          transactionType: mov.tipoMovimiento,
          channel: mov.canal
        }
      }));

    } catch (error) {
      logger.error('Error obteniendo historial Banco Estado:', error);
      return [];
    }
  }

  /**
   * Consulta estado de una transferencia
   */
  async getTransferStatus(transferId: string): Promise<{
    status: 'completed' | 'pending' | 'failed' | 'cancelled';
    description?: string;
    processedAt?: Date;
    errorMessage?: string;
  }> {
    try {
      await this.initialize();
      await this.getAccessToken();

      const response = await this.makeBankRequest(`/api/transferencias/${transferId}/estado`, 'GET');

      if (!response) {
        throw new Error('No se pudo obtener estado de transferencia');
      }

      return {
        status: this.mapBancoEstadoStatus(response.estado),
        description: response.descripcion,
        processedAt: response.fechaProcesamiento ? new Date(response.fechaProcesamiento) : undefined,
        errorMessage: response.mensajeError
      };

    } catch (error) {
      logger.error('Error consultando estado de transferencia:', error);
      return {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Mapea estados de Banco Estado a estados estándar
   */
  private mapBancoEstadoStatus(estado: string): 'completed' | 'pending' | 'failed' | 'cancelled' {
    const statusMap: Record<string, 'completed' | 'pending' | 'failed' | 'cancelled'> = {
      'COMPLETADA': 'completed',
      'PENDIENTE': 'pending',
      'RECHAZADA': 'failed',
      'CANCELADA': 'cancelled',
      'EN_PROCESO': 'pending',
      'ERROR': 'failed'
    };

    return statusMap[estado] || 'failed';
  }

  /**
   * Crea una transferencia programada
   */
  async createScheduledTransfer(
    fromAccount: BankAccountInfo,
    toAccount: BankAccountInfo,
    amount: number,
    scheduledDate: Date,
    description?: string
  ): Promise<{
    success: boolean;
    scheduledTransferId?: string;
    error?: string;
  }> {
    try {
      await this.initialize();
      await this.getAccessToken();

      const scheduledData = {
        cuentaOrigen: fromAccount.accountNumber,
        cuentaDestino: toAccount.accountNumber,
        monto: amount,
        fechaProgramada: scheduledDate.toISOString(),
        descripcion: description || 'Transferencia programada Rent360',
        tipoTransferencia: 'programada',
        rutDestinatario: toAccount.rut,
        nombreDestinatario: toAccount.accountHolder
      };

      const response = await this.makeBankRequest('/api/transferencias/programadas', 'POST', scheduledData);

      if (response && response.idTransferenciaProgramada) {
        return {
          success: true,
          scheduledTransferId: response.idTransferenciaProgramada
        };
      } else {
        return {
          success: false,
          error: 'No se pudo crear la transferencia programada'
        };
      }

    } catch (error) {
      logger.error('Error creando transferencia programada:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno'
      };
    }
  }

  /**
   * Cancela una transferencia programada
   */
  async cancelScheduledTransfer(scheduledTransferId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.initialize();
      await this.getAccessToken();

      const response = await this.makeBankRequest(`/api/transferencias/programadas/${scheduledTransferId}`, 'DELETE');

      return {
        success: response && response.cancelada === true
      };

    } catch (error) {
      logger.error('Error cancelando transferencia programada:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error cancelando transferencia'
      };
    }
  }
}
