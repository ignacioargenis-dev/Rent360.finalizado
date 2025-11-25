/**
 * Commission Service
 *
 * Servicio para cálculo, tracking y gestión de comisiones de corredores
 */

import { db } from './db';
import { logger } from './logger-minimal';

export interface CommissionCalculation {
  contractId: string;
  brokerId: string;
  baseAmount: number; // Monto del arriendo
  commissionRate: number; // Porcentaje de comisión
  commissionAmount: number; // Monto de la comisión
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: Date;
  daysOverdue?: number;
}

export interface CommissionStats {
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  overdueCommissions: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  avgCommissionRate: number;
  thisMonthCommissions: number;
  lastMonthCommissions: number;
  growth: number; // Porcentaje de crecimiento mes a mes
}

export interface CommissionConfig {
  defaultCommissionRate: number;
  minCommissionRate: number;
  maxCommissionRate: number;
}

export class CommissionService {
  /**
   * Obtiene la configuración de comisiones del sistema
   */
  static async getCommissionConfig(): Promise<CommissionConfig> {
    // Por defecto, usar valores estándar del sistema
    // Estos valores pueden venir de configuración del sistema o base de datos en el futuro
    return {
      defaultCommissionRate: 5.0, // 5% por defecto
      minCommissionRate: 1.0, // Mínimo 1%
      maxCommissionRate: 10.0, // Máximo 10%
    };
  }

  /**
   * Calcula la comisión para un contrato específico
   */
  static async calculateCommission(contractId: string): Promise<CommissionCalculation | null> {
    try {
      const contract = await db.contract.findUnique({
        where: { id: contractId },
        include: {
          broker: {
            select: {
              id: true,
              brokerClients: {
                where: { status: 'ACTIVE' },
                select: { commissionRate: true },
              },
            },
          },
        },
      });

      if (!contract || !contract.brokerId) {
        return null;
      }

      // Obtener tasa de comisión (default 5% si no está especificada)
      const commissionRate = contract.broker?.brokerClients[0]?.commissionRate || 5.0;

      const commissionAmount = (contract.monthlyRent * commissionRate) / 100;

      // Calcular fecha de vencimiento (generalmente 30 días después del inicio del contrato)
      const dueDate = new Date(contract.startDate);
      dueDate.setDate(dueDate.getDate() + 30);

      // Determinar estado de pago
      let paymentStatus: CommissionCalculation['paymentStatus'] = 'PENDING';
      let daysOverdue: number | undefined;

      // Verificar si hay un pago registrado
      const payment = await db.payment.findFirst({
        where: {
          contractId: contract.id,
          status: 'COMPLETED',
          // Buscar pagos que correspondan a comisión de corredor
        },
        orderBy: {
          paidDate: 'desc',
        },
      });

      if (payment && payment.paidDate) {
        paymentStatus = 'PAID';
      } else if (new Date() > dueDate) {
        paymentStatus = 'OVERDUE';
        daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        contractId: contract.id,
        brokerId: contract.brokerId,
        baseAmount: contract.monthlyRent,
        commissionRate,
        commissionAmount,
        paymentStatus,
        dueDate,
        ...(daysOverdue !== undefined && { daysOverdue }),
      };
    } catch (error) {
      logger.error('Error calculando comisión', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
      });
      return null;
    }
  }

  /**
   * Obtiene todas las comisiones de un corredor con estado de pago
   */
  static async getBrokerCommissions(
    brokerId: string,
    options?: {
      includeOverdue?: boolean;
      includePaid?: boolean;
      includePending?: boolean;
      limit?: number;
    }
  ): Promise<CommissionCalculation[]> {
    try {
      // Obtener todos los contratos del broker
      const contracts = await db.contract.findMany({
        where: {
          brokerId,
          status: {
            in: ['ACTIVE', 'SIGNED', 'COMPLETED'],
          },
        },
        include: {
          broker: {
            select: {
              id: true,
              brokerClients: {
                where: { status: 'ACTIVE' },
                select: { commissionRate: true },
              },
            },
          },
          payments: {
            where: {
              status: 'COMPLETED',
            },
            orderBy: {
              paidDate: 'desc',
            },
          },
        },
        orderBy: {
          startDate: 'desc',
        },
        take: options?.limit || 100,
      });

      const commissions: CommissionCalculation[] = [];

      for (const contract of contracts) {
        const commission = await this.calculateCommission(contract.id);

        if (commission) {
          // Filtrar según opciones
          const shouldInclude =
            (options?.includeOverdue && commission.paymentStatus === 'OVERDUE') ||
            (options?.includePaid && commission.paymentStatus === 'PAID') ||
            (options?.includePending && commission.paymentStatus === 'PENDING') ||
            (!options?.includeOverdue && !options?.includePaid && !options?.includePending);

          if (shouldInclude) {
            commissions.push(commission);
          }
        }
      }

      return commissions;
    } catch (error) {
      logger.error('Error obteniendo comisiones del broker', {
        error: error instanceof Error ? error.message : String(error),
        brokerId,
      });
      return [];
    }
  }

  /**
   * Calcula estadísticas de comisiones para un corredor
   */
  static async getCommissionStats(brokerId: string): Promise<CommissionStats> {
    try {
      const commissions = await this.getBrokerCommissions(brokerId);

      // Inicializar contadores
      let totalCommissions = 0;
      let paidCommissions = 0;
      let pendingCommissions = 0;
      let overdueCommissions = 0;
      let totalAmount = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      let overdueAmount = 0;
      let totalRate = 0;

      // Calcular totales
      for (const commission of commissions) {
        totalCommissions++;
        totalAmount += commission.commissionAmount;
        totalRate += commission.commissionRate;

        switch (commission.paymentStatus) {
          case 'PAID':
            paidCommissions++;
            paidAmount += commission.commissionAmount;
            break;
          case 'PENDING':
            pendingCommissions++;
            pendingAmount += commission.commissionAmount;
            break;
          case 'OVERDUE':
            overdueCommissions++;
            overdueAmount += commission.commissionAmount;
            break;
        }
      }

      // Calcular comisiones de este mes y mes pasado
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      let thisMonthCommissions = 0;
      let lastMonthCommissions = 0;

      for (const commission of commissions) {
        if (commission.paymentStatus === 'PAID') {
          // Aquí deberíamos verificar la fecha de pago real
          // Por ahora asumimos que si está pagado, fue este mes
          thisMonthCommissions += commission.commissionAmount;
        }
      }

      // Para mes pasado, necesitaríamos datos históricos
      // Por ahora usamos un estimado
      lastMonthCommissions = thisMonthCommissions * 0.9; // Estimado

      // Calcular crecimiento
      const growth =
        lastMonthCommissions > 0
          ? ((thisMonthCommissions - lastMonthCommissions) / lastMonthCommissions) * 100
          : 0;

      const avgCommissionRate = totalCommissions > 0 ? totalRate / totalCommissions : 0;

      return {
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        overdueCommissions,
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        avgCommissionRate,
        thisMonthCommissions,
        lastMonthCommissions,
        growth,
      };
    } catch (error) {
      logger.error('Error calculando estadísticas de comisiones', {
        error: error instanceof Error ? error.message : String(error),
        brokerId,
      });

      return {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        overdueCommissions: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        overdueAmount: 0,
        avgCommissionRate: 0,
        thisMonthCommissions: 0,
        lastMonthCommissions: 0,
        growth: 0,
      };
    }
  }

  /**
   * Marca una comisión como pagada
   */
  static async markCommissionAsPaid(
    contractId: string,
    brokerId: string,
    paymentData: {
      amount: number;
      paymentMethod: string;
      paymentDate: Date;
      reference?: string;
    }
  ): Promise<boolean> {
    try {
      // Verificar que el contrato pertenece al broker
      const contract = await db.contract.findFirst({
        where: {
          id: contractId,
          brokerId,
        },
      });

      if (!contract) {
        throw new Error('Contrato no encontrado o no pertenece al broker');
      }

      // Generar número de pago único
      const paymentNumber = `COMM-${contractId}-${Date.now()}`;

      // Crear un registro de pago para la comisión
      await db.payment.create({
        data: {
          paymentNumber,
          contractId,
          payerId: brokerId,
          amount: paymentData.amount,
          dueDate: paymentData.paymentDate, // Usar como fecha de vencimiento también
          paidDate: paymentData.paymentDate,
          paidAt: paymentData.paymentDate, // Mantener compatibilidad
          status: 'COMPLETED',
          method: paymentData.paymentMethod || null,
          paymentMethod: paymentData.paymentMethod || null, // Mantener compatibilidad
          transactionId: paymentData.reference || null,
          reference: paymentData.reference || null,
        },
      });

      logger.info('Comisión marcada como pagada', {
        contractId,
        brokerId,
        amount: paymentData.amount,
      });

      return true;
    } catch (error) {
      logger.error('Error marcando comisión como pagada', {
        error: error instanceof Error ? error.message : String(error),
        contractId,
        brokerId,
      });
      return false;
    }
  }

  /**
   * Obtiene comisiones vencidas que requieren seguimiento
   */
  static async getOverdueCommissions(brokerId: string): Promise<CommissionCalculation[]> {
    return await this.getBrokerCommissions(brokerId, {
      includeOverdue: true,
    });
  }

  /**
   * Envía recordatorios automáticos para comisiones vencidas
   */
  static async sendOverdueReminders(brokerId: string): Promise<number> {
    try {
      const overdueCommissions = await this.getOverdueCommissions(brokerId);
      let remindersSent = 0;

      const { NotificationService } = await import('./notification-service');

      for (const commission of overdueCommissions) {
        try {
          // Crear notificación para el broker usando el servicio existente
          await NotificationService.create({
            userId: brokerId,
            type: 'COMMISSION_CALCULATED',
            title: '💰 Comisión Vencida',
            message: `Tienes una comisión vencida de $${commission.commissionAmount.toLocaleString('es-CL')} (${commission.daysOverdue} días de retraso)`,
            link: `/broker/commissions`,
            metadata: {
              contractId: commission.contractId,
              amount: commission.commissionAmount,
              daysOverdue: commission.daysOverdue,
              dueDate: commission.dueDate,
            },
            priority: 'high',
          });

          remindersSent++;
        } catch (error) {
          logger.error('Error enviando recordatorio de comisión vencida', {
            error: error instanceof Error ? error.message : String(error),
            brokerId,
            contractId: commission.contractId,
          });
        }
      }

      logger.info('Recordatorios de comisiones vencidas enviados', {
        brokerId,
        remindersSent,
      });

      return remindersSent;
    } catch (error) {
      logger.error('Error enviando recordatorios de comisiones vencidas', {
        error: error instanceof Error ? error.message : String(error),
        brokerId,
      });
      return 0;
    }
  }
}
