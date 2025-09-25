import { logger } from '@/lib/logger';

/**
 * Interfaz base para todas las integraciones bancarias chilenas
 */
export interface BankTransferRequest {
  recipientAccount: string;
  recipientName: string;
  recipientRut: string;
  recipientBank: string;
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
}

export interface BankTransferResponse {
  success: boolean;
  transactionId?: string | undefined;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | undefined;
  errorMessage?: string | undefined;
  trackingCode?: string | undefined;
}

export interface BankAccountValidation {
  accountNumber: string;
  rut: string;
  bankCode: string;
  isValid: boolean;
  accountHolder?: string | undefined;
  errorMessage?: string | undefined;
}

/**
 * Clase abstracta base para integraciones bancarias
 */
export abstract class BaseBankIntegration {
  protected bankName: string;
  protected apiKey: string;
  protected apiSecret: string;
  protected baseUrl: string;

  constructor(config: {
    bankName: string;
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
  }) {
    this.bankName = config.bankName;
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Realiza una transferencia bancaria
   */
  abstract transfer(request: BankTransferRequest): Promise<BankTransferResponse>;

  /**
   * Valida una cuenta bancaria
   */
  abstract validateAccount(validation: BankAccountValidation): Promise<BankAccountValidation>;

  /**
   * Consulta el estado de una transacción
   */
  abstract getTransactionStatus(transactionId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    details?: any;
  }>;

  /**
   * Obtiene el saldo disponible
   */
  abstract getBalance(): Promise<{
    available: number;
    currency: string;
    lastUpdated: Date;
  }>;

  /**
   * Genera headers de autenticación
   */
  protected abstract generateAuthHeaders(): Record<string, string>;

  /**
   * Maneja errores de la API bancaria
   */
  protected handleBankError(error: any, operation: string): BankTransferResponse {
    logger.error(`Error en integración bancaria ${this.bankName} - ${operation}`, {
      error: error instanceof Error ? error.message : String(error),
      operation,
      bank: this.bankName
    });

    return {
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Error desconocido en la integración bancaria',
      status: 'FAILED'
    };
  }
}
