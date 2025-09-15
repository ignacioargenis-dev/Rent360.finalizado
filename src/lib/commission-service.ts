import { db } from './db';
import { logger } from './logger';
import { BusinessLogicError, DatabaseError } from './errors';
import { cacheManager, CacheKeys, SYSTEM_METRICS_TTL } from './cache';
import { NotificationService } from './notification-service';

export interface CommissionConfig {
  defaultCommissionRate: number; // Porcentaje por defecto (ej: 5%)
  commissionStructure: 'fixed' | 'percentage' | 'tiered';
  minimumCommissionAmount: number; // Monto mínimo de comisión
  commissionPaymentMethod: string; // Método de pago
  commissionSchedule: 'immediate' | 'weekly' | 'monthly'; // Frecuencia de pago
}

export interface CommissionCalculation {
  contractId: string;
  brokerId: string;
  propertyValue: number;
  propertyType: string;
  baseCommission: number;
  bonusCommission: number;
  totalCommission: number;
  effectiveRate: number;
  breakdown: {
    baseAmount: number;
    bonuses: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
    deductions: Array<{
      type: string;
      amount: number;
      reason: string;
    }>;
  };
}

export interface CommissionPayout {
  id: string;
  brokerId: string;
  amount: number;
  period: {
    startDate: Date;
    endDate: Date;
  };
  commissions: CommissionCalculation[];
  status: 'pending' | 'processing' | 'paid' | 'failed';
  paymentMethod: string;
  paymentReference?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Servicio para gestionar comisiones de corredores
 */
export class CommissionService {
  /**
   * Obtiene la configuración de comisiones del sistema
   */
  static async getCommissionConfig(): Promise<CommissionConfig> {
    try {
      const cacheKey = CacheKeys.SYSTEM_METRICS + ':commission_config';

      return await cacheManager.getOrSet(
        cacheKey,
        async () => {
          const settings = await db.systemSetting.findMany({
            where: {
              category: 'commission',
              isActive: true
            }
          });

          const config: CommissionConfig = {
            defaultCommissionRate: 5, // Por defecto 5%
            commissionStructure: 'percentage',
            minimumCommissionAmount: 50000, // $50.000 CLP mínimo
            commissionPaymentMethod: 'bank_transfer',
            commissionSchedule: 'monthly'
          };

          // Mapear configuraciones desde la base de datos
          settings.forEach(setting => {
            switch (setting.key) {
              case 'defaultCommissionRate':
                config.defaultCommissionRate = parseFloat(setting.value);
                break;
              case 'commissionStructure':
                config.commissionStructure = setting.value as 'fixed' | 'percentage' | 'tiered';
                break;
              case 'minimumCommissionAmount':
                config.minimumCommissionAmount = parseFloat(setting.value);
                break;
              case 'commissionPaymentMethod':
                config.commissionPaymentMethod = setting.value;
                break;
              case 'commissionSchedule':
                config.commissionSchedule = setting.value as 'immediate' | 'weekly' | 'monthly';
                break;
            }
          });

          return config;
        },
        SYSTEM_METRICS_TTL
      );
    } catch (error) {
      logger.error('Error obteniendo configuración de comisiones:', error as Error);
      throw new DatabaseError('Error al obtener configuración de comisiones');
    }
  }

  /**
   * Calcula la comisión para un contrato específico
   */
  static async calculateCommission(
    contractId: string,
    brokerId?: string
  ): Promise<CommissionCalculation> {
    try {
      // Obtener datos del contrato
      const contract = await db.contract.findUnique({
        where: { id: contractId },
        include: {
          property: {
            select: {
              id: true,
              price: true,
              type: true,
              features: true
            }
          },
          broker: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!contract) {
        throw new BusinessLogicError('Contrato no encontrado', 'CONTRACT_NOT_FOUND');
      }

      if (!contract.brokerId) {
        throw new BusinessLogicError('El contrato no tiene corredor asignado', 'NO_BROKER_ASSIGNED');
      }

      const brokerIdToUse = brokerId || contract.brokerId;
      const config = await this.getCommissionConfig();

      // Calcular comisión base
      const propertyValue = contract.monthlyRent || contract.property?.price || 0;
      const baseCommission = this.calculateBaseCommission(
        propertyValue,
        contract.property?.type || 'apartment',
        config
      );

      // Calcular bonos adicionales
      const bonuses = await this.calculateBonuses(contract, config);

      // Calcular deducciones
      const deductions = await this.calculateDeductions(contract);

      // Comisión total
      const totalBonus = bonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
      const totalDeductions = deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
      const totalCommission = Math.max(
        baseCommission + totalBonus - totalDeductions,
        config.minimumCommissionAmount
      );

      const effectiveRate = (totalCommission / propertyValue) * 100;

      // Enviar notificación automática de comisión calculada
      try {
        await NotificationService.notifyCommissionCalculated({
          brokerId: brokerIdToUse,
          type: 'commission_calculated',
          amount: totalCommission,
          contractId,
          metadata: {
            effectiveRate,
            propertyType: contract.property?.type || 'apartment',
            propertyValue,
            baseCommission,
            bonusCommission: totalBonus
          }
        });
      } catch (notificationError) {
        logger.warn('Failed to send commission calculated notification', {
          brokerId: brokerIdToUse,
          error: notificationError
        });
        // No fallar la operación por error en notificación
      }

      return {
        contractId,
        brokerId: brokerIdToUse,
        propertyValue,
        propertyType: contract.property?.type || 'apartment',
        baseCommission,
        bonusCommission: totalBonus,
        totalCommission,
        effectiveRate,
        breakdown: {
          baseAmount: baseCommission,
          bonuses,
          deductions
        }
      };
    } catch (error) {
      logger.error('Error calculando comisión:', { contractId, brokerId, error });
      if (error instanceof BusinessLogicError) {
        throw error;
      }
      throw new DatabaseError('Error al calcular comisión');
    }
  }

  /**
   * Calcula la comisión base según el tipo de propiedad y estructura
   */
  private static calculateBaseCommission(
    propertyValue: number,
    propertyType: string,
    config: CommissionConfig
  ): number {
    let baseRate = config.defaultCommissionRate;

    // Ajustar tasa según tipo de propiedad
    switch (propertyType.toLowerCase()) {
      case 'apartment':
        baseRate = propertyValue > 10000000 ? 4 : 5; // 4% para altos valores
        break;
      case 'house':
        baseRate = propertyValue > 20000000 ? 3.5 : 4.5;
        break;
      case 'office':
        baseRate = propertyValue > 50000000 ? 3 : 4;
        break;
      case 'commercial':
        baseRate = propertyValue > 30000000 ? 2.5 : 3.5;
        break;
    }

    return (propertyValue * baseRate) / 100;
  }

  /**
   * Calcula bonos adicionales para la comisión
   */
  private static async calculateBonuses(
    contract: any,
    config: CommissionConfig
  ): Promise<Array<{ type: string; amount: number; reason: string }>> {
    const bonuses: Array<{ type: string; amount: number; reason: string }> = [];
    const baseCommission = this.calculateBaseCommission(
      contract.monthlyRent || contract.property?.price || 0,
      contract.property?.type || 'apartment',
      config
    );

    // Bono por contrato exclusivo
    if (contract.isExclusive) {
      bonuses.push({
        type: 'exclusive_contract',
        amount: baseCommission * 0.1,
        reason: 'Bono por contrato exclusivo (10%)'
      });
    }

    // Bono por servicios adicionales
    if (contract.hasAdditionalServices) {
      bonuses.push({
        type: 'additional_services',
        amount: baseCommission * 0.05,
        reason: 'Bono por servicios adicionales (5%)'
      });
    }

    // Bono por cliente premium
    if (contract.clientType === 'premium') {
      bonuses.push({
        type: 'premium_client',
        amount: baseCommission * 0.15,
        reason: 'Bono por cliente premium (15%)'
      });
    }

    // Bono por cliente corporativo
    if (contract.clientType === 'corporate') {
      bonuses.push({
        type: 'corporate_client',
        amount: baseCommission * 0.2,
        reason: 'Bono por cliente corporativo (20%)'
      });
    }

    // Bono por propiedad de alto valor
    const propertyValue = contract.monthlyRent || contract.property?.price || 0;
    if (propertyValue > 100000000) {
      bonuses.push({
        type: 'high_value_property',
        amount: baseCommission * 0.05,
        reason: 'Bono por propiedad de alto valor (5%)'
      });
    }

    return bonuses;
  }

  /**
   * Calcula deducciones a la comisión
   */
  private static async calculateDeductions(
    contract: any
  ): Promise<Array<{ type: string; amount: number; reason: string }>> {
    const deductions: Array<{ type: string; amount: number; reason: string }> = [];

    // Deducción por retraso en pagos (si aplica)
    if (contract.hasPaymentDelays) {
      const baseCommission = this.calculateBaseCommission(
        contract.monthlyRent || contract.property?.price || 0,
        contract.property?.type || 'apartment',
        await this.getCommissionConfig()
      );

      deductions.push({
        type: 'payment_delay',
        amount: baseCommission * 0.1,
        reason: 'Deducción por retraso en pagos (10%)'
      });
    }

    return deductions;
  }

  /**
   * Genera un payout de comisiones para un período específico
   */
  static async generateCommissionPayout(
    brokerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommissionPayout> {
    try {
      // Obtener contratos activos del broker en el período
      const contracts = await db.contract.findMany({
        where: {
          brokerId,
          status: 'ACTIVE',
          startDate: {
            gte: startDate,
            lte: endDate
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

      if (contracts.length === 0) {
        throw new BusinessLogicError('No hay contratos elegibles para comisión en este período');
      }

      // Calcular comisiones para cada contrato
      const commissionCalculations: CommissionCalculation[] = [];
      let totalAmount = 0;

      for (const contract of contracts) {
        const calculation = await this.calculateCommission(contract.id, brokerId);
        commissionCalculations.push(calculation);
        totalAmount += calculation.totalCommission;
      }

      const config = await this.getCommissionConfig();

      const payout: CommissionPayout = {
        id: `payout_${Date.now()}_${brokerId}`,
        brokerId,
        amount: totalAmount,
        period: {
          startDate,
          endDate
        },
        commissions: commissionCalculations,
        status: 'pending',
        paymentMethod: config.commissionPaymentMethod,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Aquí se podría guardar en la base de datos
      logger.info('Payout de comisión generado:', {
        brokerId,
        amount: totalAmount,
        contractCount: contracts.length
      });

      return payout;
    } catch (error) {
      logger.error('Error generando payout de comisión:', { brokerId, startDate, endDate, error });
      throw error;
    }
  }

  /**
   * Procesa el pago de una comisión
   */
  static async processCommissionPayment(payoutId: string): Promise<void> {
    try {
      // Aquí se implementaría la lógica de pago real
      // Por ahora simulamos el procesamiento
      logger.info('Procesando pago de comisión:', { payoutId });

      // Simular procesamiento de pago
      const brokerId = payoutId.split('_')[1]; // Extraer brokerId del payoutId simulado
      const amount = Math.floor(Math.random() * 1000000) + 50000; // Monto simulado

      // Enviar notificación de pago procesado
      try {
        await NotificationService.notifyCommissionPaid({
          brokerId,
          type: 'commission_paid',
          amount,
          metadata: {
            payoutId,
            processedAt: new Date(),
            paymentMethod: 'bank_transfer'
          }
        });
      } catch (notificationError) {
        logger.warn('Failed to send commission paid notification', {
          brokerId,
          payoutId,
          error: notificationError
        });
      }

      logger.info('Pago de comisión procesado exitosamente', {
        payoutId,
        brokerId,
        amount
      });

    } catch (error) {
      logger.error('Error procesando pago de comisión:', { payoutId, error });
      throw new DatabaseError('Error al procesar pago de comisión');
    }
  }

  /**
   * Obtiene estadísticas de comisiones para un broker
   */
  static async getBrokerCommissionStats(brokerId: string) {
    try {
      // Obtener contratos activos del broker
      const contracts = await db.contract.findMany({
        where: {
          brokerId,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          monthlyRent: true,
          startDate: true,
          property: {
            select: {
              type: true
            }
          }
        }
      });

      if (contracts.length === 0) {
        return {
          totalContracts: 0,
          totalCommissionValue: 0,
          averageCommission: 0,
          monthlyRevenue: 0,
          contractsByType: {}
        };
      }

      // Calcular estadísticas
      const config = await this.getCommissionConfig();
      let totalCommissionValue = 0;
      const contractsByType: Record<string, number> = {};

      for (const contract of contracts) {
        const commission = await this.calculateCommission(contract.id, brokerId);
        totalCommissionValue += commission.totalCommission;

        const propertyType = contract.property?.type || 'unknown';
        contractsByType[propertyType] = (contractsByType[propertyType] || 0) + 1;
      }

      const averageCommission = totalCommissionValue / contracts.length;
      const monthlyRevenue = totalCommissionValue; // Simplificado

      return {
        totalContracts: contracts.length,
        totalCommissionValue,
        averageCommission,
        monthlyRevenue,
        contractsByType,
        commissionConfig: config
      };
    } catch (error) {
      logger.error('Error obteniendo estadísticas de comisión:', { brokerId, error });
      throw new DatabaseError('Error al obtener estadísticas de comisión');
    }
  }
}
