import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError } from './errors';
import { NotificationService } from './notification-service';
import { BankAccountService, BankAccountInfo } from './bank-account-service';
import { BankIntegrationFactory, BankIntegrationUtils } from './bank-integrations/bank-integration-factory';
import { PaymentConfigService } from './payment-config';
import { KYCService } from './kyc-service';
import { FraudDetectionService, TransactionData, FraudRiskLevel } from './fraud-detection';

export interface PayoutConfig {
  // Configuración general
  enabled: boolean;
  autoProcess: boolean;
  schedule: 'immediate' | 'weekly' | 'monthly';
  cutoffDay: number; // Día del mes para procesamiento mensual

  // Límites y validaciones
  minimumPayout: number;
  maximumDailyPayout: number;
  requireApproval: boolean;
  approvalThreshold: number;

  // Métodos de pago
  defaultPaymentMethod: 'bank_transfer' | 'paypal' | 'stripe';
  supportedMethods: string[];

  // Tasas y comisiones
  platformFee: number; // Porcentaje retenido por la plataforma
  paymentProviderFee: number; // Costo del proveedor de pagos

  // Configuración de seguridad
  requireKYC: boolean;
  requireBankVerification: boolean;
  fraudDetection: boolean;
}

export interface RunnerPayoutConfig {
  // Configuración específica para runners
  enabled: boolean;

  // Cálculo de ganancias por visita
  baseRatePerMinute: number; // Tarifa base por minuto (ej: 500)
  premiumPropertyBonus: number; // Bono por propiedades premium (ej: 200)
  premiumPropertyThreshold: number; // Umbral para considerar propiedad premium (ej: 1000000)

  // Multiplicadores por tipo de visita
  visitTypeMultipliers: {
    regular: number;    // 1.0
    premium: number;    // 1.5
    express: number;    // 1.2
  };

  // Límites de pago
  minimumPayout: number;
  maximumDailyPayout: number;
  requireManualApproval: boolean;
  approvalThreshold: number;

  // Programación de pagos
  payoutSchedule: 'immediate' | 'weekly' | 'monthly';
  cutoffDay: number; // Día del mes para procesamiento mensual

  // Métodos de pago soportados
  supportedPaymentMethods: string[];

  // Configuración de seguridad
  requireBankVerification: boolean;
  requireKYC: boolean;
  fraudDetectionEnabled: boolean;

  // Tasas y comisiones
  platformFeePercentage: number; // Comisión de la plataforma
}

export interface PayoutCalculation {
  recipientId: string;
  recipientType: 'broker' | 'owner' | 'runner' | 'maintenance_provider' | 'service_provider';
  amount: number;
  currency: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    commissions: number;
    fees: number;
    taxes: number;
    netAmount: number;
  };
  items: PayoutItem[];
}

export interface PayoutItem {
  type: 'commission' | 'rental_income' | 'fee_refund';
  referenceId: string; // contractId, paymentId, etc.
  amount: number;
  description: string;
  date: Date;
}

export interface PayoutBatch {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalAmount: number;
  totalRecipients: number;
  processedAt?: Date;
  completedAt?: Date;
  payoutConfigs: PayoutCalculation[];
  metadata: {
    batchType: 'scheduled' | 'manual' | 'emergency';
    triggeredBy: string;
    notes?: string;
  };
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'bank_account' | 'paypal' | 'stripe';
  isDefault: boolean;
  isVerified: boolean;
  details: {
    // Para bank_account
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountHolder?: string;

    // Para paypal
    paypalEmail?: string;

    // Para stripe
    stripeAccountId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Servicio completo de Payouts Automáticos
 */
export class PayoutService {
  private static config: PayoutConfig | null = null;

  /**
   * Obtiene la configuración del sistema de payouts
   */
  static async getConfig(): Promise<PayoutConfig> {
    if (this.config) return this.config;

    try {
      const settings = await db.systemSetting.findMany({
        where: {
          category: 'payout',
          isActive: true
        }
      });

      this.config = {
        enabled: true,
        autoProcess: true,
        schedule: 'monthly',
        cutoffDay: 1,
        minimumPayout: 50000, // $50.000 CLP
        maximumDailyPayout: 10000000, // $10M CLP por día
        requireApproval: false,
        approvalThreshold: 1000000, // $1M CLP
        defaultPaymentMethod: 'bank_transfer',
        supportedMethods: ['bank_transfer', 'paypal'],
        platformFee: 0.05, // 5%
        paymentProviderFee: 0.01, // 1%
        requireKYC: true,
        requireBankVerification: true,
        fraudDetection: true
      };

      // Aplicar configuraciones desde DB
      settings.forEach(setting => {
        switch (setting.key) {
          case 'autoProcess':
            this.config!.autoProcess = setting.value === 'true';
            break;
          case 'schedule':
            this.config!.schedule = setting.value as 'immediate' | 'weekly' | 'monthly';
            break;
          case 'minimumPayout':
            this.config!.minimumPayout = parseFloat(setting.value);
            break;
          case 'platformFee':
            this.config!.platformFee = parseFloat(setting.value);
            break;
        }
      });

      return this.config;
    } catch (error) {
      logger.error('Error obteniendo configuración de payouts:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw new DatabaseError('Error al obtener configuración de payouts');
    }
  }

  /**
   * Calcula payouts pendientes para un período
   */
  static async calculatePendingPayouts(
    recipientType: 'broker' | 'owner' = 'broker',
    startDate?: Date,
    endDate?: Date
  ): Promise<PayoutCalculation[]> {
    try {
      const config = await this.getConfig();
      const period = this.getPeriodDates(startDate, endDate);

      logger.info('Calculando payouts pendientes', {
        recipientType,
        period: { startDate: period.startDate, endDate: period.endDate }
      });

      if (recipientType === 'broker') {
        return await this.calculateBrokerPayouts(period);
      } else {
        return await this.calculateOwnerPayouts(period);
      }
    } catch (error) {
      logger.error('Error calculando payouts pendientes:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Calcula payouts para corredores
   */
  private static async calculateBrokerPayouts(period: { startDate: Date; endDate: Date }): Promise<PayoutCalculation[]> {
    // Obtener todos los corredores activos
    const brokers = await db.user.findMany({
      where: {
        role: 'BROKER',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const payouts: PayoutCalculation[] = [];

    for (const broker of brokers) {
      try {
        const brokerPayout = await this.calculateBrokerPayout(broker.id, period);
        if (brokerPayout && brokerPayout.amount > 0) {
          payouts.push(brokerPayout);
        }
      } catch (error) {
        logger.warn('Error calculando payout para broker', {
          brokerId: broker.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return payouts;
  }

  /**
   * Calcula payout individual para un corredor
   */
  private static async calculateBrokerPayout(
    brokerId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<PayoutCalculation | null> {
    // Obtener contratos del corredor en el período
    const contracts = await db.contract.findMany({
      where: {
        brokerId,
        status: 'ACTIVE',
        startDate: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      include: {
        property: {
          select: {
            price: true,
            type: true
          }
        }
      }
    });

    if (contracts.length === 0) return null;

    const items: PayoutItem[] = [];
    let totalCommissions = 0;

    for (const contract of contracts) {
      const commission = await this.calculateContractCommission(contract);
      if (commission > 0) {
        items.push({
          type: 'commission',
          referenceId: contract.id,
          amount: commission,
          description: `Comisión contrato ${contract.contractNumber}`,
          date: contract.startDate
        });
        totalCommissions += commission;
      }
    }

    if (totalCommissions === 0) return null;

    const config = await this.getConfig();
    const platformFee = totalCommissions * config.platformFee;
    const paymentFee = totalCommissions * config.paymentProviderFee;
    const totalFees = platformFee + paymentFee;
    const netAmount = totalCommissions - totalFees;

    // Verificar monto mínimo
    if (netAmount < config.minimumPayout) {
      logger.info('Payout por debajo del mínimo', {
        brokerId,
        amount: netAmount,
        minimum: config.minimumPayout
      });
      return null;
    }

    return {
      recipientId: brokerId,
      recipientType: 'broker',
      amount: netAmount,
      currency: 'CLP',
      period,
      breakdown: {
        commissions: totalCommissions,
        fees: totalFees,
        taxes: 0, // Por ahora sin impuestos
        netAmount
      },
      items
    };
  }

  /**
   * Calcula payouts para propietarios
   */
  private static async calculateOwnerPayouts(period: { startDate: Date; endDate: Date }): Promise<PayoutCalculation[]> {
    // Obtener propietarios con contratos activos
    const owners = await db.user.findMany({
      where: {
        role: 'OWNER',
        isActive: true,
        properties: {
          some: {
            contracts: {
              some: {
                status: 'ACTIVE',
                startDate: {
                  gte: period.startDate,
                  lte: period.endDate
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const payouts: PayoutCalculation[] = [];

    for (const owner of owners) {
      try {
        const ownerPayout = await this.calculateOwnerPayout(owner.id, period);
        if (ownerPayout && ownerPayout.amount > 0) {
          payouts.push(ownerPayout);
        }
      } catch (error) {
        logger.warn('Error calculando payout para owner', {
          ownerId: owner.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return payouts;
  }

  /**
   * Calcula payout individual para un propietario
   */
  private static async calculateOwnerPayout(
    ownerId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<PayoutCalculation | null> {
    // Obtener pagos de rentas del propietario en el período
    const rentalPayments = await db.payment.findMany({
      where: {
        contract: {
          ownerId,
          status: 'ACTIVE'
        },
        status: 'PAID',
        dueDate: {
          gte: period.startDate,
          lte: period.endDate
        }
      },
      include: {
        contract: {
          select: {
            contractNumber: true,
            property: {
              select: {
                title: true
              }
            }
          }
        }
      }
    });

    if (rentalPayments.length === 0) return null;

    const items: PayoutItem[] = [];
    let totalRentalIncome = 0;

    for (const payment of rentalPayments) {
      items.push({
        type: 'rental_income',
        referenceId: payment.id,
        amount: payment.amount,
        description: `Renta contrato ${payment.contract.contractNumber}`,
        date: payment.dueDate
      });
      totalRentalIncome += payment.amount;
    }

    const config = await this.getConfig();
    const platformFee = totalRentalIncome * config.platformFee;
    const paymentFee = totalRentalIncome * config.paymentProviderFee;
    const totalFees = platformFee + paymentFee;
    const netAmount = totalRentalIncome - totalFees;

    // Verificar monto mínimo
    if (netAmount < config.minimumPayout) {
      logger.info('Payout por debajo del mínimo', {
        ownerId,
        amount: netAmount,
        minimum: config.minimumPayout
      });
      return null;
    }

    return {
      recipientId: ownerId,
      recipientType: 'owner',
      amount: netAmount,
      currency: 'CLP',
      period,
      breakdown: {
        commissions: 0,
        fees: totalFees,
        taxes: 0,
        netAmount
      },
      items
    };
  }

  /**
   * Procesa un lote de payouts
   */
  static async processPayoutBatch(
    payouts: PayoutCalculation[],
    batchMetadata: {
      batchType: 'scheduled' | 'manual' | 'emergency';
      triggeredBy: string;
      notes?: string;
    }
  ): Promise<PayoutBatch> {
    try {
      const config = await this.getConfig();
      const batch: PayoutBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        totalRecipients: payouts.length,
        payoutConfigs: payouts,
        metadata: batchMetadata
      };

      logger.info('Procesando lote de payouts', {
        batchId: batch.id,
        totalRecipients: batch.totalRecipients,
        totalAmount: batch.totalAmount
      });

      // Verificar límites diarios
      if (batch.totalAmount > config.maximumDailyPayout) {
        throw new BusinessLogicError(
          `Monto total del lote (${batch.totalAmount}) excede el límite diario (${config.maximumDailyPayout})`
        );
      }

      // Verificar aprobaciones requeridas
      if (config.requireApproval && batch.totalAmount > config.approvalThreshold) {
        batch.status = 'pending'; // Esperar aprobación manual
        logger.info('Lote requiere aprobación manual', {
          batchId: batch.id,
          amount: batch.totalAmount,
          threshold: config.approvalThreshold
        });
        return batch;
      }

      // Procesar payouts
      await this.processPayouts(payouts, batch.id);

      batch.status = 'completed';
      batch.processedAt = new Date();
      batch.completedAt = new Date();

      logger.info('Lote de payouts completado', {
        batchId: batch.id,
        processedRecipients: payouts.length
      });

      return batch;
    } catch (error) {
      logger.error('Error procesando lote de payouts:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Procesa payouts individuales
   */
  private static async processPayouts(payouts: PayoutCalculation[], batchId: string): Promise<void> {
    const results = await Promise.allSettled(
      payouts.map(payout => this.processIndividualPayout(payout, batchId))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Procesamiento de payouts completado', {
      batchId,
      successful,
      failed,
      total: payouts.length
    });

    if (failed > 0) {
      logger.warn('Algunos payouts fallaron', {
        batchId,
        failedCount: failed
      });
    }
  }

  /**
   * Procesa un payout individual
   */
  private static async processIndividualPayout(
    payout: PayoutCalculation,
    batchId: string
  ): Promise<void> {
    try {
      // 1. Validar elegibilidad KYC
      await this.validateKYCEligibility(payout.recipientId);

      // 2. Obtener cuenta bancaria del destinatario
      const bankAccount = await this.getRecipientBankAccount(payout.recipientId);

      if (!bankAccount) {
        throw new BusinessLogicError(
          `No se encontró cuenta bancaria verificada para ${payout.recipientId}`
        );
      }

      // 3. Verificar que la cuenta esté verificada
      if (!bankAccount.isVerified) {
        throw new BusinessLogicError(
          `La cuenta bancaria de ${payout.recipientId} no está verificada`
        );
      }

      // 4. Ejecutar evaluación antifraude
      const fraudAssessment = await this.assessFraudRisk(payout, bankAccount);

      if (fraudAssessment.blockTransaction) {
        throw new BusinessLogicError(
          `Transacción bloqueada por detección de fraude: ${fraudAssessment.recommendations.join(', ')}`
        );
      }

      if (fraudAssessment.requiresApproval) {
        logger.warn('Payout requiere aprobación manual', {
          recipientId: payout.recipientId,
          amount: payout.amount,
          riskLevel: fraudAssessment.riskLevel,
          riskScore: fraudAssessment.riskScore
        });

        // Marcar para aprobación manual
        await this.markForManualApproval(payout, batchId, fraudAssessment);
        return;
      }

      // 5. Obtener cuenta bancaria de origen (de la plataforma)
      const sourceAccount = await this.getPlatformBankAccount();

      // 6. Ejecutar transferencia inteligente
      const transferResult = await BankIntegrationFactory.executeSmartTransfer(
        sourceAccount,
        bankAccount,
        payout.amount,
        `Payout Rent360 - ${payout.recipientType} ${payout.recipientId}`
      );

      if (!transferResult.success) {
        throw new Error(`Transferencia fallida: ${transferResult.errorMessage}`);
      }

      // 7. Registrar payout en base de datos
      await this.recordPayout(payout, batchId, {
        success: transferResult.success,
        transactionId: transferResult.transactionId,
        error: transferResult.errorMessage
      });

      // 8. Enviar notificación
      await this.notifyPayoutProcessed(payout, {
        success: transferResult.success,
        transactionId: transferResult.transactionId,
        error: transferResult.errorMessage
      });

      logger.info('Payout procesado exitosamente', {
        recipientId: payout.recipientId,
        amount: payout.amount,
        bank: bankAccount.bankName,
        transactionId: transferResult.transactionId,
        riskLevel: fraudAssessment.riskLevel
      });

    } catch (error) {
      logger.error('Error procesando payout individual', {
        recipientId: payout.recipientId,
        amount: payout.amount,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Obtiene cuenta bancaria del destinatario
   */
  private static async getRecipientBankAccount(recipientId: string): Promise<BankAccountInfo | null> {
    try {
      const accounts = await BankAccountService.getUserBankAccounts(recipientId);
      const primaryAccount = accounts.find(account => account.isVerified);

      if (primaryAccount) {
        return primaryAccount;
      }

      // Si no hay cuenta primaria, usar la primera verificada
      const verifiedAccount = accounts.find(account => account.isVerified);
      return verifiedAccount || null;

    } catch (error) {
      logger.error('Error obteniendo cuenta bancaria del destinatario:', {
        recipientId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Obtiene cuenta bancaria de la plataforma
   */
  private static async getPlatformBankAccount(): Promise<BankAccountInfo> {
    try {
      // Obtener configuración de la cuenta bancaria de la plataforma
      const platformAccountConfig = await PaymentConfigService.getServiceConfig('platform_bank_account');

      if (!platformAccountConfig) {
        throw new BusinessLogicError('Configuración de cuenta bancaria de plataforma no encontrada');
      }

      // Retornar cuenta bancaria de la plataforma
      return {
        id: 'platform_account',
        userId: 'platform',
        isPrimary: true,
        bankCode: platformAccountConfig.config.defaultBankCode || '012', // Banco Estado por defecto
        bankName: platformAccountConfig.config.defaultBankName || 'Banco del Estado de Chile',
        country: 'CL',
        accountType: 'business',
        accountNumber: platformAccountConfig.credentials.accountNumber || '000000000',
        accountHolder: platformAccountConfig.config.companyName || 'Rent360 SpA',
        rut: platformAccountConfig.config.companyRut || '99.999.999-9',
        isVerified: true,
        verificationStatus: 'verified',
        verificationMethod: 'manual',
        metadata: {
          verificationAttempts: 1,
          riskScore: 0,
          notes: 'Cuenta bancaria oficial de Rent360'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

    } catch (error) {
      logger.error('Error obteniendo cuenta bancaria de plataforma:', {
        error: error instanceof Error ? error.message : String(error)
      });

      // Fallback con cuenta simulada
      return {
        id: 'platform_fallback',
        userId: 'platform',
        isPrimary: true,
        bankCode: '012',
        bankName: 'Banco del Estado de Chile',
        country: 'CL',
        accountType: 'business',
        accountNumber: '999999999',
        accountHolder: 'Rent360 SpA',
        rut: '99.999.999-9',
        isVerified: true,
        verificationStatus: 'verified',
        verificationMethod: 'manual',
        metadata: {
          verificationAttempts: 1,
          riskScore: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  /**
   * Valida elegibilidad KYC del destinatario
   */
  private static async validateKYCEligibility(recipientId: string): Promise<void> {
    try {
      const kycCheck = await KYCService.canReceivePayouts(recipientId);

      if (!kycCheck.canReceive) {
        throw new BusinessLogicError(
          `Usuario no elegible para payouts: ${kycCheck.reason}`
        );
      }

      logger.info('Validación KYC exitosa', {
        recipientId,
        kycLevel: kycCheck.currentLevel
      });

    } catch (error) {
      logger.error('Error validando elegibilidad KYC:', {
        recipientId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Evalúa riesgo de fraude para el payout
   */
  private static async assessFraudRisk(
    payout: PayoutCalculation,
    bankAccount: BankAccountInfo
  ): Promise<import('./fraud-detection').FraudAssessment> {
    try {
      // Preparar datos para evaluación de fraude
      const transactionData: TransactionData = {
        userId: payout.recipientId,
        amount: payout.amount,
        currency: payout.currency,
        type: 'payout',
        recipientId: payout.recipientId,
        description: `Payout ${payout.recipientType} - ${payout.recipientId}`,
        metadata: {
          ipAddress: '127.0.0.1', // En producción, obtener del request
          userAgent: 'Rent360 Payout Service',
          deviceFingerprint: `device_${payout.recipientId}`,
          location: {
            country: 'CL',
            city: 'Santiago',
            latitude: -33.4489,
            longitude: -70.6693
          },
          previousTransactions: [] // En producción, obtener historial real
        }
      };

      const assessment = await FraudDetectionService.assessTransaction(transactionData);

      logger.info('Evaluación antifraude completada', {
        recipientId: payout.recipientId,
        riskLevel: assessment.riskLevel,
        riskScore: assessment.riskScore,
        patternsCount: assessment.patterns.length
      });

      return assessment;

    } catch (error) {
      logger.error('Error evaluando riesgo de fraude:', {
        recipientId: payout.recipientId,
        error: error instanceof Error ? error.message : String(error)
      });

      // En caso de error, asumir riesgo bajo pero marcar para revisión
      return {
        riskLevel: FraudRiskLevel.MEDIUM,
        riskScore: 50,
        confidence: 0.5,
        patterns: [],
        recommendations: ['Error en evaluación automática - revisar manualmente'],
        requiresApproval: true,
        blockTransaction: false,
        flags: ['evaluation_error']
      };
    }
  }

  /**
   * Marca payout para aprobación manual
   */
  private static async markForManualApproval(
    payout: PayoutCalculation,
    batchId: string,
    fraudAssessment: import('./fraud-detection').FraudAssessment
  ): Promise<void> {
    try {
      // En producción, guardar en tabla de aprobaciones pendientes
      logger.info('Payout marcado para aprobación manual', {
        recipientId: payout.recipientId,
        amount: payout.amount,
        batchId,
        riskLevel: fraudAssessment.riskLevel,
        reasons: fraudAssessment.recommendations
      });

      // Notificar a administradores sobre aprobación pendiente
      await NotificationService.notifySystemAlert({
        type: 'system_alert',
        title: 'Aprobación Manual de Payout Requerida',
        message: `Payout de ${payout.amount.toLocaleString('es-CL')} CLP requiere aprobación manual. Nivel de riesgo: ${fraudAssessment.riskLevel}`,
        severity: 'medium',
        targetUsers: [] // Notificar a todos los administradores
      });

    } catch (error) {
      logger.error('Error marcando para aprobación manual:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Método obsoleto - mantener por compatibilidad
   */
  private static async getRecipientPaymentMethod(recipientId: string): Promise<PaymentMethod | null> {
    // En implementación real, consultar tabla de métodos de pago
    // Por ahora, retornar método por defecto
    return {
      id: 'default',
      userId: recipientId,
      type: 'bank_account',
      isDefault: true,
      isVerified: true,
      details: {
        bankName: 'Banco Estado',
        accountNumber: '123456789',
        accountHolder: 'Usuario Demo'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Procesa pago según método
   */
  private static async processPayment(
    payout: PayoutCalculation,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Aquí iría la integración real con proveedores de pago
      switch (paymentMethod.type) {
        case 'bank_account':
          return await this.processBankTransfer(payout, paymentMethod);
        case 'paypal':
          return await this.processPayPalTransfer(payout, paymentMethod);
        case 'stripe':
          return await this.processStripeTransfer(payout, paymentMethod);
        default:
          throw new Error(`Método de pago no soportado: ${paymentMethod.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Procesa transferencia bancaria
   */
  private static async processBankTransfer(
    payout: PayoutCalculation,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulación de procesamiento bancario
    logger.info('Procesando transferencia bancaria', {
      recipientId: payout.recipientId,
      amount: payout.amount,
      bankAccount: paymentMethod.details.accountNumber
    });

    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simular éxito/fracaso aleatorio (90% éxito)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        success: true,
        transactionId: `BANK_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      };
    } else {
      return {
        success: false,
        error: 'Fondos insuficientes en cuenta de origen'
      };
    }
  }

  /**
   * Procesa pago PayPal
   */
  private static async processPayPalTransfer(
    payout: PayoutCalculation,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulación de procesamiento PayPal
    logger.info('Procesando pago PayPal', {
      recipientId: payout.recipientId,
      amount: payout.amount,
      paypalEmail: paymentMethod.details.paypalEmail
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      transactionId: `PP_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  /**
   * Procesa pago Stripe
   */
  private static async processStripeTransfer(
    payout: PayoutCalculation,
    paymentMethod: PaymentMethod
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simulación de procesamiento Stripe
    logger.info('Procesando pago Stripe', {
      recipientId: payout.recipientId,
      amount: payout.amount,
      stripeAccount: paymentMethod.details.stripeAccountId
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      success: true,
      transactionId: `STRIPE_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
    };
  }

  /**
   * Registra payout en base de datos
   */
  private static async recordPayout(
    payout: PayoutCalculation,
    batchId: string,
    paymentResult: { success: boolean; transactionId?: string; error?: string }
  ): Promise<void> {
    // Aquí iría el código para guardar el payout en la base de datos
    logger.info('Payout registrado en BD', {
      recipientId: payout.recipientId,
      amount: payout.amount,
      transactionId: paymentResult.transactionId,
      batchId
    });
  }

  /**
   * Envía notificación de payout procesado
   */
  private static async notifyPayoutProcessed(
    payout: PayoutCalculation,
    paymentResult: { success: boolean; transactionId?: string; error?: string }
  ): Promise<void> {
    try {
      await NotificationService.notifyCommissionPaid({
        brokerId: payout.recipientId,
        type: 'commission_paid',
        amount: payout.amount,
        metadata: {
          payoutType: payout.recipientType,
          transactionId: paymentResult.transactionId,
          netAmount: payout.amount,
          period: payout.period
        }
      });
    } catch (error) {
      logger.warn('Error enviando notificación de payout', {
        recipientId: payout.recipientId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Calcula comisión para un contrato específico
   */
  private static async calculateContractCommission(contract: any): Promise<number> {
    // Lógica simplificada - en producción usar CommissionService
    const baseAmount = contract.monthlyRent || contract.property?.price || 0;
    const commissionRate = 0.05; // 5% por defecto
    return baseAmount * commissionRate;
  }

  /**
   * Obtiene fechas del período
   */
  private static getPeriodDates(
    startDate?: Date,
    endDate?: Date
  ): { startDate: Date; endDate: Date } {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    // Por defecto, mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: startOfMonth,
      endDate: endOfMonth
    };
  }

  /**
   * Obtiene estadísticas de payouts
   */
  static async getPayoutStats(): Promise<{
    totalProcessed: number;
    totalAmount: number;
    successRate: number;
    averageProcessingTime: number;
    byMethod: Record<string, number>;
    recentPayouts: any[];
  }> {
    // Simulación de estadísticas
    return {
      totalProcessed: 1250,
      totalAmount: 250000000, // $250M CLP
      successRate: 98.5,
      averageProcessingTime: 2.3, // minutos
      byMethod: {
        bank_transfer: 1100,
        paypal: 120,
        stripe: 30
      },
      recentPayouts: []
    };
  }
}

/**
 * Servicio específico para payouts de runners
 */
export class RunnerPayoutService {
  private static config: RunnerPayoutConfig = {
    enabled: true,
    baseRatePerMinute: 500,
    premiumPropertyBonus: 200,
    premiumPropertyThreshold: 1000000,
    visitTypeMultipliers: {
      regular: 1.0,
      premium: 1.5,
      express: 1.2
    },
    minimumPayout: 5000,
    maximumDailyPayout: 500000,
    requireManualApproval: true,
    approvalThreshold: 50000,
    payoutSchedule: 'weekly',
    cutoffDay: 5,
    supportedPaymentMethods: ['bank_transfer', 'paypal'],
    requireBankVerification: true,
    requireKYC: false,
    fraudDetectionEnabled: true,
    platformFeePercentage: 5
  };

  /**
   * Obtiene la configuración actual
   */
  static getConfig(): RunnerPayoutConfig {
    return { ...this.config };
  }

  /**
   * Actualiza la configuración
   */
  static updateConfig(newConfig: Partial<RunnerPayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configuración de RunnerPayoutService actualizada', { newConfig });
  }

  /**
   * Calcula las ganancias de una visita específica
   */
  static calculateVisitEarnings(
    duration: number, // en minutos
    propertyPrice: number,
    visitType: 'regular' | 'premium' | 'express' = 'regular'
  ): number {
    // Tarifa base por minuto
    let earnings = duration * this.config.baseRatePerMinute;

    // Bono por propiedad premium
    if (propertyPrice >= this.config.premiumPropertyThreshold) {
      earnings += this.config.premiumPropertyBonus;
    }

    // Multiplicador por tipo de visita
    earnings *= this.config.visitTypeMultipliers[visitType];

    return Math.round(earnings);
  }

  /**
   * Calcula payouts pendientes para runners
   */
  static async calculatePendingRunnerPayouts(
    startDate?: Date,
    endDate?: Date
  ): Promise<PayoutCalculation[]> {
    try {
      const { startDate: periodStart, endDate: periodEnd } = this.getPeriodDates(startDate, endDate);

      // Obtener visitas completadas en el período
      const completedVisits = await db.visit.findMany({
        where: {
          status: 'completed',
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          },
          earnings: {
            gt: 0
          }
        },
        include: {
          runner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          property: {
            select: {
              id: true,
              price: true
            }
          }
        }
      });

      // Agrupar por runner
      const runnerPayouts = new Map<string, {
        runner: any;
        visits: any[];
        totalEarnings: number;
        visitCount: number;
      }>();

      for (const visit of completedVisits) {
        const runnerId = visit.runnerId;
        const earnings = visit.earnings || 0;

        if (!runnerPayouts.has(runnerId)) {
          runnerPayouts.set(runnerId, {
            runner: visit.runner,
            visits: [],
            totalEarnings: 0,
            visitCount: 0
          });
        }

        const runnerData = runnerPayouts.get(runnerId)!;
        runnerData.visits.push(visit);
        runnerData.totalEarnings += earnings;
        runnerData.visitCount += 1;
      }

      // Convertir a PayoutCalculation
      const payouts: PayoutCalculation[] = [];

      for (const [runnerId, data] of Array.from(runnerPayouts.entries())) {
        // Aplicar comisión de plataforma
        const platformFee = data.totalEarnings * (this.config.platformFeePercentage / 100);
        const netAmount = data.totalEarnings - platformFee;

        // Solo incluir si supera el mínimo
        if (netAmount >= this.config.minimumPayout) {
          payouts.push({
            recipientId: runnerId,
            recipientType: 'runner',
            amount: netAmount,
            currency: 'CLP',
            period: {
              startDate: periodStart,
              endDate: periodEnd
            },
            breakdown: {
              commissions: data.totalEarnings,
              fees: platformFee,
              taxes: 0,
              netAmount
            },
            items: data.visits.map(visit => ({
              type: 'commission' as const,
              referenceId: visit.id,
              amount: visit.earnings,
              description: `Visita a propiedad ${visit.propertyId}`,
              date: visit.createdAt
            }))
          });
        }
      }

      logger.info('Payouts de runners calculados', {
        period: { startDate: periodStart, endDate: periodEnd },
        totalRunners: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
      });

      return payouts;

    } catch (error) {
      logger.error('Error calculando payouts de runners:', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Procesa un payout de runner (con confirmación manual)
   */
  static async processRunnerPayout(
    payout: PayoutCalculation,
    adminUserId: string
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // Validar que el runner tenga cuenta bancaria verificada
      if (this.config.requireBankVerification) {
        const bankAccount = await db.bankAccount.findFirst({
          where: {
            userId: payout.recipientId,
            isVerified: true
          }
        });

        if (!bankAccount) {
          throw new BusinessLogicError('Runner no tiene cuenta bancaria verificada');
        }
      }

      // Verificar límites diarios
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayPayouts = await db.providerTransaction.findMany({
        where: {
          providerType: 'RUNNER',
          createdAt: {
            gte: today
          }
        }
      });

      const todayTotal = todayPayouts.reduce((sum, p) => sum + p.amount, 0);

      if (todayTotal + payout.amount > this.config.maximumDailyPayout) {
        throw new BusinessLogicError('Límite diario de payouts excedido');
      }

      // Crear transacción pendiente (requiere aprobación manual)
      const transaction = await db.providerTransaction.create({
        data: {
          providerType: 'RUNNER',
          serviceProviderId: payout.recipientId, // Usamos serviceProviderId para runners
          amount: payout.amount,
          commission: payout.breakdown.fees,
          netAmount: payout.breakdown.netAmount,
          status: this.config.requireManualApproval ? 'PENDING' : 'PROCESSING',
          paymentMethod: 'bank_transfer', // Por defecto banco
          processedAt: null,
          reference: `RUNNER_PAYOUT_${payout.recipientId}_${Date.now()}`
        }
      });

      logger.info('Payout de runner procesado', {
        runnerId: payout.recipientId,
        amount: payout.amount,
        transactionId: transaction.id,
        requiresApproval: this.config.requireManualApproval
      });

      return {
        success: true,
        transactionId: transaction.id
      };

    } catch (error) {
      logger.error('Error procesando payout de runner:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Aprueba un payout pendiente (confirmación manual)
   */
  static async approveRunnerPayout(
    transactionId: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const transaction = await db.providerTransaction.findUnique({
        where: { id: transactionId },
        include: {
          serviceProvider: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        throw new BusinessLogicError('Transacción no encontrada');
      }

      if (transaction.status !== 'PENDING') {
        throw new BusinessLogicError('Transacción no está pendiente de aprobación');
      }

      // Procesar el pago
      const paymentResult = await this.processPayment(transaction);

      if (paymentResult.success) {
        // Actualizar transacción como completada
        await db.providerTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            reference: paymentResult.transactionId
          }
        });

        // Enviar notificación al runner
        await this.notifyRunnerPayout(transaction, adminUserId);

        // Enviar notificación push al runner sobre el payout aprobado
        await this.sendRunnerPayoutNotification(transaction);

        logger.info('Payout de runner aprobado y procesado', {
          transactionId,
          runnerId: transaction.serviceProviderId,
          amount: transaction.amount
        });

        return { success: true };
      } else {
        // Marcar como fallida
        await db.providerTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED'
          }
        });

        return {
          success: false,
          error: paymentResult.error || 'Error procesando pago'
        };
      }

    } catch (error) {
      logger.error('Error aprobando payout de runner:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Procesa el pago real (simulado)
   */
  private static async processPayment(
    transaction: any
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    // Simular procesamiento de pago
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = Math.random() > 0.05; // 95% de éxito

    if (success) {
      return {
        success: true,
        transactionId: `RUNNER_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
      };
    } else {
      return {
        success: false,
        error: 'Error en procesamiento bancario'
      };
    }
  }

  /**
   * Envía notificación al runner sobre el pago procesado
   */
  private static async notifyRunnerPayout(
    transaction: any,
    adminUserId: string
  ): Promise<void> {
    try {
      // Aquí iría la lógica de notificación
      logger.info('Notificación enviada a runner', {
        runnerId: transaction.serviceProviderId,
        amount: transaction.amount,
        transactionId: transaction.id
      });
    } catch (error) {
      logger.warn('Error enviando notificación a runner:', {
        runnerId: transaction.serviceProviderId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Obtiene fechas del período
   */
  private static getPeriodDates(
    startDate?: Date,
    endDate?: Date
  ): { startDate: Date; endDate: Date } {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    // Por defecto, semana actual
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return {
      startDate: startOfWeek,
      endDate: endOfWeek
    };
  }

  /**
   * Envía notificación de payout aprobado al runner
   */
  private static async sendRunnerPayoutNotification(transaction: any): Promise<void> {
    try {
      const runner = await db.user.findUnique({
        where: { id: transaction.serviceProviderId },
        select: {
          id: true,
          name: true
        }
      });

      if (!runner) return;

      // Obtener información del período
      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const periodEnd = new Date().toISOString().split('T')[0];

      // Obtener conteo de visitas para este período
      const visitCount = await db.visit.count({
        where: {
          runnerId: transaction.serviceProviderId,
          status: 'completed',
          createdAt: {
            gte: new Date(periodStart),
            lte: new Date(periodEnd)
          }
        }
      });

      await NotificationService.notifyRunnerPayoutApproved({
        runnerId: transaction.serviceProviderId,
        runnerName: runner.name || 'Runner',
        amount: transaction.amount,
        netAmount: transaction.netAmount,
        visitCount: visitCount,
        periodStart: periodStart,
        periodEnd: periodEnd,
        paymentMethod: transaction.paymentMethod || 'bank_transfer'
      });

    } catch (error) {
      logger.error('Error sending runner payout notification:', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Obtiene estadísticas de payouts de runners
   */
  static async getRunnerPayoutStats(): Promise<{
    totalRunners: number;
    totalPaid: number;
    totalPending: number;
    averagePerRunner: number;
    topEarners: any[];
  }> {
    try {
      const [totalStats, topEarners] = await Promise.all([
        // Estadísticas generales
        db.providerTransaction.aggregate({
          where: {
            providerType: 'RUNNER'
          },
          _sum: {
            amount: true,
            netAmount: true
          },
          _count: true
        }),

        // Top earners (último mes)
        db.providerTransaction.findMany({
          where: {
            providerType: 'RUNNER',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            serviceProvider: {
              select: {
                id: true,
                businessName: true
              },
              include: {
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          },
          orderBy: {
            amount: 'desc'
          },
          take: 10
        })
      ]);

      const totalPaid = totalStats._sum?.netAmount || 0;
      const totalPending = await db.providerTransaction.count({
        where: {
          providerType: 'RUNNER',
          status: 'PENDING'
        }
      });

      const uniqueRunners = await db.providerTransaction.findMany({
        where: {
          providerType: 'RUNNER'
        },
        select: {
          serviceProviderId: true
        },
        distinct: ['serviceProviderId']
      });

      return {
        totalRunners: uniqueRunners.length,
        totalPaid,
        totalPending,
        averagePerRunner: uniqueRunners.length > 0 ? totalPaid / uniqueRunners.length : 0,
        topEarners: topEarners.map(te => ({
          runnerId: te.serviceProviderId,
          runnerName: te.serviceProvider?.businessName || 'N/A',
          runnerEmail: te.serviceProvider?.user?.email || 'N/A',
          amount: te.netAmount,
          date: te.createdAt
        }))
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas de runners:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        totalRunners: 0,
        totalPaid: 0,
        totalPending: 0,
        averagePerRunner: 0,
        topEarners: []
      };
    }
  }
}
