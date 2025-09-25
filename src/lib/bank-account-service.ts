import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError, ValidationError } from './errors';
import { PaymentConfigService } from './payment-config';

/**
 * Información de cuenta bancaria
 */
export interface BankAccountInfo {
  id: string;
  userId: string;

  // Información del banco
  bankCode: string; // Código del banco (ej: '001' para Banco Chile)
  bankName: string; // Nombre del banco
  country: string;  // País (CL, US, etc.)

  // Información de la cuenta
  accountType: 'checking' | 'savings' | 'business';
  accountNumber: string; // Número de cuenta enmascarado
  accountHolder: string; // Titular de la cuenta
  rut?: string | undefined; // RUT del titular (Chile)

  // Información adicional
  branchCode?: string | undefined; // Código de sucursal
  iban?: string | undefined; // IBAN para cuentas internacionales
  swiftCode?: string | undefined; // Código SWIFT/BIC
  routingNumber?: string | undefined; // Número de ruta (US)

  // Estado y verificación
  isPrimary: boolean; // Cuenta primaria
  isVerified: boolean; // Verificada por el banco
  verificationStatus: 'pending' | 'verified' | 'failed' | 'expired';
  verificationMethod: 'manual' | 'api' | 'micro_deposit' | 'instant';

  // Metadata
  metadata: {
    lastVerificationAttempt?: Date | undefined;
    verificationAttempts: number;
    microDepositAmounts?: [number, number] | undefined; // Para verificación por microdepósitos
    documentsRequired?: string[] | undefined; // Documentos requeridos
    riskScore?: number | undefined;
    notes?: string | undefined;
  };

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Códigos de bancos chilenos
 */
export const CHILEAN_BANK_CODES = {
  '001': 'Banco de Chile',
  '009': 'Banco Internacional',
  '012': 'Banco del Estado de Chile',
  '014': 'Banco de Crédito e Inversiones (BCI)',
  '016': 'Banco de Crédito e Inversiones (BCI)',
  '027': 'Corpbanca',
  '028': 'Banco Santander',
  '031': 'Banco HSBC Bank Chile',
  '039': 'Banco Itaú Corpbanca',
  '049': 'Banco Security',
  '051': 'Banco Falabella',
  '053': 'Banco Ripley',
  '054': 'Banco Consorcio',
  '055': 'Banco Penta',
  '056': 'Banco Santander Banefe',
  '504': 'Banco Bilbao Vizcaya Argentaria (BBVA)',
  '507': 'Banco del Desarrollo',
  '037': 'Scotiabank Chile'
} as const;

/**
 * Servicio de gestión de cuentas bancarias
 */
export class BankAccountService {
  /**
   * Valida formato de RUT chileno
   */
  static validateRut(rut: string): boolean {
    if (!rut) return false;

    // Remover puntos y convertir a mayúsculas
    rut = rut.replace(/\./g, '').toUpperCase();

    // Verificar formato básico
    const rutRegex = /^\d{7,8}-[\dK]$/;
    if (!rutRegex.test(rut)) {
      return false;
    }

    // Validar dígito verificador
    const rutParts = rut.split('-');
    const rutNumber = rutParts[0];
    const dv = rutParts[1];

    if (!rutNumber || !dv) {
      return false;
    }

    let sum = 0;
    let multiplier = 2;

    // Calcular suma ponderada
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      const digit = rutNumber[i];
      if (digit && /^\d$/.test(digit)) {
        sum += parseInt(digit) * multiplier;
      } else {
        return false; // Carácter inválido
      }
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const expectedDv = 11 - (sum % 11);
    let expectedDvStr = '';

    if (expectedDv === 11) {
      expectedDvStr = '0';
    } else if (expectedDv === 10) {
      expectedDvStr = 'K';
    } else {
      expectedDvStr = expectedDv.toString();
    }

    return dv === expectedDvStr;
  }

  /**
   * Obtiene nombre del banco por código
   */
  static getBankNameByCode(bankCode: string): string | null {
    return CHILEAN_BANK_CODES[bankCode as keyof typeof CHILEAN_BANK_CODES] || null;
  }

  /**
   * Registra una nueva cuenta bancaria para un usuario
   */
  static async registerBankAccount(
    userId: string,
    accountData: {
      bankCode: string;
      accountType: 'checking' | 'savings' | 'business';
      accountNumber: string;
      accountHolder: string;
      rut?: string;
      branchCode?: string;
      isPrimary?: boolean;
    }
  ): Promise<BankAccountInfo> {
    try {
      // Validar datos de entrada
      await this.validateAccountData(accountData);

      // Verificar que el usuario existe
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true }
      });

      if (!user) {
        throw new BusinessLogicError('Usuario no encontrado');
      }

      // Obtener información del banco
      const bankInfo = await this.getBankInfo(accountData.bankCode);
      if (!bankInfo) {
        throw new ValidationError('Código de banco no válido');
      }

      // Verificar si ya existe una cuenta primaria
      if (accountData.isPrimary) {
        await this.unsetPrimaryAccount(userId);
      }

      // Crear registro de cuenta bancaria
      const bankAccount = await db.$transaction(async (tx) => {
        // Aquí iría la creación del registro en una tabla bank_accounts
        // Por ahora, simulamos con un objeto

        const newAccount: BankAccountInfo = {
          id: `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId,
          bankCode: accountData.bankCode,
          bankName: bankInfo.name,
          country: 'CL',
          accountType: accountData.accountType,
          accountNumber: this.maskAccountNumber(accountData.accountNumber),
          accountHolder: accountData.accountHolder,
          rut: accountData.rut,
          branchCode: accountData.branchCode,
          isPrimary: accountData.isPrimary || false,
          isVerified: false,
          verificationStatus: 'pending',
          verificationMethod: 'api',
          metadata: {
            verificationAttempts: 0,
            riskScore: 0
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // En producción, guardar en BD
        logger.info('Cuenta bancaria registrada', {
          userId,
          bankCode: accountData.bankCode,
          accountType: accountData.accountType,
          isPrimary: accountData.isPrimary
        });

        return newAccount;
      });

      // Iniciar proceso de verificación automática
      setImmediate(() => {
        this.initiateVerification(bankAccount.id);
      });

      return bankAccount;

    } catch (error) {
      logger.error('Error registrando cuenta bancaria', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene las cuentas bancarias de un usuario
   */
  static async getUserBankAccounts(userId: string): Promise<BankAccountInfo[]> {
    try {
      // En producción, consultar tabla bank_accounts
      // Por ahora, retornar cuentas simuladas

      const mockAccounts: BankAccountInfo[] = [
        {
          id: 'ba_001',
          userId,
          bankCode: '012',
          bankName: 'Banco del Estado de Chile',
          country: 'CL',
          accountType: 'checking',
          accountNumber: '****1234',
          accountHolder: 'Usuario Demo',
          rut: '12.345.678-9',
          isPrimary: true,
          isVerified: true,
          verificationStatus: 'verified',
          verificationMethod: 'api',
          metadata: {
            lastVerificationAttempt: new Date(),
            verificationAttempts: 1,
            riskScore: 0.1
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
          updatedAt: new Date()
        }
      ];

      return mockAccounts.filter(account => account.userId === userId);

    } catch (error) {
      logger.error('Error obteniendo cuentas bancarias', { error: error instanceof Error ? error.message : String(error) });
      throw new DatabaseError('Error al obtener cuentas bancarias');
    }
  }

  /**
   * Obtiene la cuenta bancaria primaria de un usuario
   */
  static async getPrimaryBankAccount(userId: string): Promise<BankAccountInfo | null> {
    const accounts = await this.getUserBankAccounts(userId);
    return accounts.find(account => account.isPrimary) || null;
  }

  /**
   * Verifica una cuenta bancaria
   */
  static async verifyBankAccount(
    accountId: string,
    verificationData?: {
      microDepositAmounts?: [number, number];
      documents?: any[];
    }
  ): Promise<{
    success: boolean;
    status: 'verified' | 'failed' | 'pending';
    message: string;
    nextSteps?: string[];
  }> {
    try {
      // Obtener cuenta (simulado)
      const account = await this.getAccountById(accountId);
      if (!account) {
        throw new BusinessLogicError('Cuenta bancaria no encontrada');
      }

      // Verificar con el banco correspondiente
      const verificationResult = await this.performBankVerification(account, verificationData);

      // Actualizar estado de verificación
      account.verificationStatus = verificationResult.status;
      account.isVerified = verificationResult.status === 'verified';
      account.metadata.verificationAttempts += 1;
      account.metadata.lastVerificationAttempt = new Date();
      account.updatedAt = new Date();

      logger.info('Verificación de cuenta bancaria completada', {
        accountId,
        userId: account.userId,
        status: verificationResult.status,
        success: verificationResult.success
      });

      return verificationResult;

    } catch (error) {
      logger.error('Error verificando cuenta bancaria', { error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Error desconocido',
        nextSteps: ['Reintentar verificación', 'Contactar soporte']
      };
    }
  }

  /**
   * Inicia el proceso de verificación automática
   */
  static async initiateVerification(accountId: string): Promise<void> {
    try {
      const account = await this.getAccountById(accountId);
      if (!account) return;

      // Determinar método de verificación basado en el banco
      const verificationMethod = await this.determineVerificationMethod(account);

      switch (verificationMethod) {
        case 'instant':
          await this.performInstantVerification(account);
          break;
        case 'micro_deposit':
          await this.performMicroDepositVerification(account);
          break;
        case 'api':
          await this.performAPIVerification(account);
          break;
        default:
          await this.performManualVerification(account);
      }

    } catch (error) {
      logger.error('Error iniciando verificación', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Realiza verificación instantánea
   */
  private static async performInstantVerification(account: BankAccountInfo): Promise<void> {
    // Verificación instantánea usando APIs bancarias
    const bankConfig = await PaymentConfigService.getServiceConfig(account.bankCode);

    if (!bankConfig || !bankConfig.enabled) {
      throw new BusinessLogicError('Configuración bancaria no disponible');
    }

    // Simular verificación instantánea
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isValid = Math.random() > 0.05; // 95% éxito

    await this.updateVerificationStatus(account.id, isValid ? 'verified' : 'failed');
  }

  /**
   * Realiza verificación por microdepósitos
   */
  private static async performMicroDepositVerification(account: BankAccountInfo): Promise<void> {
    // Generar dos montos aleatorios pequeños
    const amount1 = Math.floor(Math.random() * 99) + 1; // 1-99 centavos
    const amount2 = Math.floor(Math.random() * 99) + 1;

    // Simular depósito de microdepósitos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Actualizar metadata con los montos
    account.metadata.microDepositAmounts = [amount1, amount2];

    logger.info('Microdepósitos enviados', {
      accountId: account.id,
      amounts: [amount1, amount2]
    });
  }

  /**
   * Realiza verificación por API bancaria
   */
  private static async performAPIVerification(account: BankAccountInfo): Promise<void> {
    const bankConfig = await PaymentConfigService.getServiceConfig(account.bankCode);

    if (!bankConfig) {
      throw new BusinessLogicError('Configuración bancaria no encontrada');
    }

    // Simular llamada a API bancaria
    await new Promise(resolve => setTimeout(resolve, 3000));

    const isValid = Math.random() > 0.1; // 90% éxito

    await this.updateVerificationStatus(account.id, isValid ? 'verified' : 'failed');
  }

  /**
   * Realiza verificación manual
   */
  private static async performManualVerification(account: BankAccountInfo): Promise<void> {
    // Marcar como pendiente de revisión manual
    account.verificationStatus = 'pending';
    account.metadata.documentsRequired = [
      'Comprobante de cuenta bancaria',
      'Cédula de identidad',
      'Certificado de titularidad'
    ];

    logger.info('Verificación manual requerida', {
      accountId: account.id,
      documentsRequired: account.metadata.documentsRequired
    });
  }

  /**
   * Actualiza el estado de verificación
   */
  private static async updateVerificationStatus(
    accountId: string,
    status: 'verified' | 'failed' | 'pending'
  ): Promise<void> {
    // En producción, actualizar en BD
    logger.info('Estado de verificación actualizado', {
      accountId,
      status
    });
  }

  /**
   * Valida los datos de la cuenta bancaria
   */
  private static async validateAccountData(data: any): Promise<void> {
    const errors: string[] = [];

    // Validar código de banco
    if (!data.bankCode || !CHILEAN_BANK_CODES[data.bankCode as keyof typeof CHILEAN_BANK_CODES]) {
      errors.push('Código de banco inválido');
    }

    // Validar tipo de cuenta
    if (!['checking', 'savings', 'business'].includes(data.accountType)) {
      errors.push('Tipo de cuenta inválido');
    }

    // Validar número de cuenta (solo dígitos)
    if (!data.accountNumber || !/^\d+$/.test(data.accountNumber)) {
      errors.push('Número de cuenta debe contener solo dígitos');
    }

    // Validar longitud del número de cuenta
    if (data.accountNumber.length < 8 || data.accountNumber.length > 20) {
      errors.push('Número de cuenta debe tener entre 8 y 20 dígitos');
    }

    // Validar titular
    if (!data.accountHolder || data.accountHolder.length < 2) {
      errors.push('Nombre del titular requerido');
    }

    // Validar RUT si es Chile
    if (data.rut && !this.validateRut(data.rut)) {
      errors.push('RUT inválido');
    }

    if (errors.length > 0) {
      throw new ValidationError(`Errores de validación: ${errors.join(', ')}`);
    }
  }

  /**
   * Obtiene información del banco por código
   */
  private static async getBankInfo(bankCode: string): Promise<{ name: string } | null> {
    const bankName = CHILEAN_BANK_CODES[bankCode as keyof typeof CHILEAN_BANK_CODES];
    return bankName ? { name: bankName } : null;
  }

  /**
   * Enmascara el número de cuenta para seguridad
   */
  private static maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    const visibleDigits = 4;
    const maskedPart = '*'.repeat(accountNumber.length - visibleDigits);
    const visiblePart = accountNumber.slice(-visibleDigits);
    return maskedPart + visiblePart;
  }

  /**
   * Quita la cuenta primaria anterior
   */
  private static async unsetPrimaryAccount(userId: string): Promise<void> {
    // En producción, actualizar todas las cuentas del usuario
    logger.info('Cuenta primaria anterior removida', { userId });
  }

  /**
   * Obtiene cuenta por ID
   */
  private static async getAccountById(accountId: string): Promise<BankAccountInfo | null> {
    // Simulado - en producción buscar en BD
    return {
      id: accountId,
      userId: 'user_001',
      bankCode: '012',
      bankName: 'Banco del Estado de Chile',
      country: 'CL',
      accountType: 'checking',
      accountNumber: '****1234',
      accountHolder: 'Usuario Demo',
      rut: '12.345.678-9',
      isPrimary: true,
      isVerified: false,
      verificationStatus: 'pending',
      verificationMethod: 'api',
      metadata: {
        verificationAttempts: 0,
        riskScore: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Determina el método de verificación basado en el banco
   */
  private static async determineVerificationMethod(account: BankAccountInfo): Promise<string> {
    // Lógica para determinar método de verificación
    const bankConfig = await PaymentConfigService.getServiceConfig(account.bankCode);

    if (bankConfig?.config?.supportedCurrencies?.includes('CLP')) {
      return 'instant'; // Verificación instantánea para bancos chilenos
    }

    return 'micro_deposit'; // Microdepósitos para internacionales
  }

  /**
   * Realiza verificación bancaria completa
   */
  private static async performBankVerification(
    account: BankAccountInfo,
    verificationData?: any
  ): Promise<{
    success: boolean;
    status: 'verified' | 'failed' | 'pending';
    message: string;
    nextSteps?: string[];
  }> {
    try {
      // Verificar titularidad
      const ownershipValid = await this.verifyAccountOwnership(account);

      if (!ownershipValid) {
        return {
          success: false,
          status: 'failed',
          message: 'No se pudo verificar la titularidad de la cuenta',
          nextSteps: [
            'Verificar que el nombre del titular coincida exactamente',
            'Verificar número de cuenta',
            'Contactar al banco si el problema persiste'
          ]
        };
      }

      // Verificar estado de la cuenta
      const accountStatus = await this.verifyAccountStatus(account);

      if (!accountStatus.active) {
        return {
          success: false,
          status: 'failed',
          message: 'La cuenta bancaria no está activa',
          nextSteps: [
            'Verificar estado de la cuenta con el banco',
            'Usar una cuenta bancaria activa'
          ]
        };
      }

      return {
        success: true,
        status: 'verified',
        message: 'Cuenta bancaria verificada exitosamente'
      };

    } catch (error) {
      return {
        success: false,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Error en verificación',
        nextSteps: ['Reintentar verificación', 'Contactar soporte técnico']
      };
    }
  }

  /**
   * Verifica la titularidad de la cuenta
   */
  private static async verifyAccountOwnership(account: BankAccountInfo): Promise<boolean> {
    // Simular verificación de titularidad
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 90% de éxito en verificación
    return Math.random() > 0.1;
  }

  /**
   * Verifica el estado de la cuenta
   */
  private static async verifyAccountStatus(account: BankAccountInfo): Promise<{
    active: boolean;
    frozen: boolean;
    closed: boolean;
  }> {
    // Simular verificación de estado
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      active: Math.random() > 0.05, // 95% activo
      frozen: false,
      closed: false
    };
  }


  /**
   * Elimina una cuenta bancaria
   */
  static async deleteBankAccount(accountId: string, userId: string): Promise<void> {
    try {
      // Verificar que la cuenta pertenece al usuario
      const account = await this.getAccountById(accountId);
      if (!account || account.userId !== userId) {
        throw new BusinessLogicError('Cuenta bancaria no encontrada o no autorizada');
      }

      // No permitir eliminar cuenta primaria si hay otras
      if (account.isPrimary) {
        const userAccounts = await this.getUserBankAccounts(userId);
        const otherAccounts = userAccounts.filter(acc => acc.id !== accountId);

        if (otherAccounts.length > 0) {
          throw new BusinessLogicError('No se puede eliminar la cuenta primaria. Asigne otra cuenta como primaria primero.');
        }
      }

      // En producción, eliminar de BD
      logger.info('Cuenta bancaria eliminada', { accountId, userId });

    } catch (error) {
      logger.error('Error eliminando cuenta bancaria', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de cuentas bancarias
   */
  static async getBankAccountStats(): Promise<{
    totalAccounts: number;
    verifiedAccounts: number;
    pendingVerification: number;
    failedVerification: number;
    byBank: Record<string, number>;
  }> {
    // Simulación de estadísticas
    return {
      totalAccounts: 1250,
      verifiedAccounts: 1100,
      pendingVerification: 120,
      failedVerification: 30,
      byBank: {
        '012': 450, // Banco Estado
        '001': 320, // Banco Chile
        '014': 280, // BCI
        '028': 150, // Santander
        'otros': 50
      }
    };
  }
}
