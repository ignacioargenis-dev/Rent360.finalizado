import { db } from './db';
import { logger } from './logger';
import { DatabaseError, BusinessLogicError } from './errors';
import { NotificationService } from './notification-service';
import { BankAccountService } from './bank-account-service';

export interface ProviderPayoutCalculation {
  recipientId: string;
  recipientType: 'maintenance_provider' | 'service_provider';
  amount: number;
  currency: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  breakdown: {
    grossAmount: number;
    commission: number;
    gracePeriodAdjustment: number;
    taxes: number;
    netAmount: number;
  };
  providerDetails: {
    businessName: string;
    specialty?: string;
    serviceType?: string;
    registrationDate: Date;
  };
  jobs: {
    id: string;
    type: string;
    amount: number;
    date: Date;
    clientName: string;
  }[];
}

/**
 * Servicio de payouts para proveedores de mantenimiento y servicios
 */
export class ProviderPayoutsService {

  /**
   * Calcula payouts pendientes para proveedores de mantenimiento
   */
  static async calculateMaintenanceProviderPayouts(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProviderPayoutCalculation[]> {
    try {
      const { start, end } = this.getPeriodDates(startDate, endDate);

      // Obtener todos los proveedores de mantenimiento activos
      const maintenanceProviders = await db.maintenanceProvider.findMany({
        where: {
          user: {
            isActive: true
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          maintenanceJobs: {
            where: {
              status: 'COMPLETED',
              completedDate: {
                gte: start,
                lte: end
              }
            },
            include: {
              property: {
                select: {
                  address: true,
                  owner: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      const payouts: ProviderPayoutCalculation[] = [];

      for (const provider of maintenanceProviders) {
        if (provider.maintenanceJobs.length === 0) continue;

        const totalAmount = provider.maintenanceJobs.reduce((sum, job) => sum + (job.actualCost || 0), 0);

        // Verificar período de gracia
        const gracePeriodDays = 15; // Configurable desde admin
        const daysSinceRegistration = Math.floor(
          (end.getTime() - provider.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const inGracePeriod = daysSinceRegistration <= gracePeriodDays;

        // Calcular comisión
        const commissionRate = inGracePeriod ? 0 : 10; // 10% normal, 0% en período de gracia
        const commission = (totalAmount * commissionRate) / 100;
        const netAmount = totalAmount - commission;

        // Solo crear payout si supera el mínimo
        const minimumPayout = 10000; // Configurable
        if (netAmount < minimumPayout) continue;

        payouts.push({
          recipientId: provider.id,
          recipientType: 'maintenance_provider',
          amount: netAmount,
          currency: 'CLP',
          period: { startDate: start, endDate: end },
          breakdown: {
            grossAmount: totalAmount,
            commission,
            gracePeriodAdjustment: inGracePeriod ? -commission : 0,
            taxes: 0, // Por ahora sin impuestos
            netAmount
          },
          providerDetails: {
            businessName: provider.businessName,
            specialty: provider.specialty,
            registrationDate: provider.user.createdAt
          },
          jobs: provider.maintenanceJobs.map(job => ({
            id: job.id,
            type: 'maintenance',
            amount: job.actualCost || 0,
            date: job.completedDate!,
            clientName: job.property?.owner?.name || 'Cliente'
          }))
        });
      }

      logger.info('Payouts calculados para proveedores de mantenimiento', {
        totalProviders: maintenanceProviders.length,
        payoutsGenerated: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
      });

      return payouts;

    } catch (error) {
      logger.error('Error calculando payouts de mantenimiento:', error as Error);
      throw error;
    }
  }

  /**
   * Calcula payouts pendientes para proveedores de servicios
   */
  static async calculateServiceProviderPayouts(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProviderPayoutCalculation[]> {
    try {
      const { start, end } = this.getPeriodDates(startDate, endDate);

      // Obtener todos los proveedores de servicios activos
      const serviceProviders = await db.serviceProvider.findMany({
        where: {
          user: {
            isActive: true
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true
            }
          },
          serviceJobs: {
            where: {
              status: 'COMPLETED',
              completedDate: {
                gte: start,
                lte: end
              }
            },
            include: {
              requester: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      const payouts: ProviderPayoutCalculation[] = [];

      for (const provider of serviceProviders) {
        if (provider.serviceJobs.length === 0) continue;

        const totalAmount = provider.serviceJobs.reduce((sum, job) => sum + (job.finalPrice || job.basePrice), 0);

        // Verificar período de gracia
        const gracePeriodDays = 7; // Configurable desde admin
        const daysSinceRegistration = Math.floor(
          (end.getTime() - provider.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const inGracePeriod = daysSinceRegistration <= gracePeriodDays;

        // Calcular comisión
        const commissionRate = inGracePeriod ? 0 : 8; // 8% normal, 0% en período de gracia
        const commission = (totalAmount * commissionRate) / 100;
        const netAmount = totalAmount - commission;

        // Solo crear payout si supera el mínimo
        const minimumPayout = 5000; // Configurable
        if (netAmount < minimumPayout) continue;

        payouts.push({
          recipientId: provider.id,
          recipientType: 'service_provider',
          amount: netAmount,
          currency: 'CLP',
          period: { startDate: start, endDate: end },
          breakdown: {
            grossAmount: totalAmount,
            commission,
            gracePeriodAdjustment: inGracePeriod ? -commission : 0,
            taxes: 0,
            netAmount
          },
          providerDetails: {
            businessName: provider.businessName,
            serviceType: provider.serviceType,
            registrationDate: provider.user.createdAt
          },
          jobs: provider.serviceJobs.map(job => ({
            id: job.id,
            type: 'service',
            amount: job.finalPrice || job.basePrice,
            date: job.completedDate!,
            clientName: job.requester?.name || 'Cliente'
          }))
        });
      }

      logger.info('Payouts calculados para proveedores de servicios', {
        totalProviders: serviceProviders.length,
        payoutsGenerated: payouts.length,
        totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0)
      });

      return payouts;

    } catch (error) {
      logger.error('Error calculando payouts de servicios:', error as Error);
      throw error;
    }
  }

  /**
   * Calcula todos los payouts pendientes para proveedores
   */
  static async calculatePendingProviderPayouts(
    startDate?: Date,
    endDate?: Date
  ): Promise<ProviderPayoutCalculation[]> {
    try {
      const [maintenancePayouts, servicePayouts] = await Promise.all([
        this.calculateMaintenanceProviderPayouts(startDate, endDate),
        this.calculateServiceProviderPayouts(startDate, endDate)
      ]);

      const allPayouts = [...maintenancePayouts, ...servicePayouts];

      logger.info('Payouts totales calculados para proveedores', {
        maintenancePayouts: maintenancePayouts.length,
        servicePayouts: servicePayouts.length,
        totalPayouts: allPayouts.length,
        totalAmount: allPayouts.reduce((sum, p) => sum + p.amount, 0)
      });

      return allPayouts;

    } catch (error) {
      logger.error('Error calculando payouts pendientes:', error as Error);
      throw error;
    }
  }

  /**
   * Procesa payout de proveedor con aprobación manual
   */
  static async processProviderPayout(
    payout: ProviderPayoutCalculation,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string | undefined }> {
    try {
      // Verificar cuenta bancaria del proveedor
      let bankAccount;
      if (payout.recipientType === 'maintenance_provider') {
        const provider = await db.maintenanceProvider.findUnique({
          where: { id: payout.recipientId },
          include: {
            user: {
              include: {
                bankAccounts: true
              }
            }
          }
        });

        bankAccount = provider?.user?.bankAccounts?.[0];
      } else {
        const provider = await db.serviceProvider.findUnique({
          where: { id: payout.recipientId },
          include: {
            user: {
              include: {
                bankAccounts: true
              }
            }
          }
        });

        bankAccount = provider?.user?.bankAccounts?.[0];
      }

      if (!bankAccount) {
        return { success: false, error: 'Proveedor no tiene cuenta bancaria configurada' };
      }

      // Crear transacción en estado PENDING (requiere aprobación)
      const transaction = await db.providerTransaction.create({
        data: {
          providerType: payout.recipientType === 'maintenance_provider' ? 'MAINTENANCE' : 'SERVICE',
          maintenanceProviderId: payout.recipientType === 'maintenance_provider' ? payout.recipientId : undefined,
          serviceProviderId: payout.recipientType === 'service_provider' ? payout.recipientId : undefined,
          amount: payout.breakdown.grossAmount,
          commission: payout.breakdown.commission,
          netAmount: payout.amount,
          status: 'PENDING',
          paymentMethod: 'BANK_TRANSFER',
          processedAt: null,
          approvedBy: adminUserId,
          notes: `Pago automático - ${payout.jobs.length} trabajos completados`
        }
      });

      logger.info('Payout de proveedor procesado', {
        transactionId: transaction.id,
        providerId: payout.recipientId,
        amount: payout.amount,
        type: payout.recipientType
      });

      return { success: true };

    } catch (error) {
      logger.error('Error procesando payout de proveedor:', error as Error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Aprueba y ejecuta payout de proveedor
   */
  static async approveProviderPayout(
    transactionId: string,
    adminUserId: string
  ): Promise<{ success: boolean; error?: string | undefined }> {
    try {
      const transaction = await db.providerTransaction.findUnique({
        where: { id: transactionId },
        include: {
          maintenanceProvider: {
            include: {
              user: {
                include: {
                  bankAccounts: true
                }
              }
            }
          },
          serviceProvider: {
            include: {
              user: {
                include: {
                  bankAccounts: true
                }
              }
            }
          }
        }
      });

      if (!transaction) {
        return { success: false, error: 'Transacción no encontrada' };
      }

      if (transaction.status !== 'PENDING') {
        return { success: false, error: 'Transacción no está pendiente de aprobación' };
      }

      // Simular procesamiento de pago
      const paymentResult = await this.simulatePaymentProcessing(transaction);

      if (paymentResult.success) {
        // Actualizar transacción como completada
        await db.providerTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
            paymentReference: paymentResult.transactionId
          }
        });

        // Enviar notificación al proveedor
        await this.sendProviderPayoutNotification(transaction, adminUserId);

        logger.info('Payout de proveedor aprobado y ejecutado', {
          transactionId,
          providerType: transaction.providerType,
          amount: transaction.netAmount
        });

        return { success: true };
      } else {
        // Marcar como fallida
        await db.providerTransaction.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            notes: paymentResult.error || 'Error en procesamiento de pago'
          }
        });

        return { success: false, error: paymentResult.error || 'Error en procesamiento de pago' };
      }

    } catch (error) {
      logger.error('Error aprobando payout de proveedor:', error as Error);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private static getPeriodDates(startDate?: Date, endDate?: Date) {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Última semana por defecto
    return { start, end };
  }

  private static async simulatePaymentProcessing(transaction: any): Promise<{
    success: boolean;
    transactionId?: string | undefined;
    error?: string | undefined;
  }> {
    try {
      // Simulación de procesamiento bancario
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay

      // Simular éxito/fracaso aleatorio (90% éxito)
      const success = Math.random() > 0.1;

      if (success) {
        return {
          success: true,
          transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      } else {
        return {
          success: false,
          error: 'Fondos insuficientes en cuenta origen'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: 'Error en procesamiento bancario'
      };
    }
  }

  private static async sendProviderPayoutNotification(
    transaction: any,
    adminUserId: string
  ): Promise<void> {
    try {
      let providerUser;

      if (transaction.providerType === 'MAINTENANCE') {
        const provider = await db.maintenanceProvider.findUnique({
          where: { id: transaction.maintenanceProviderId },
          include: { user: true }
        });
        providerUser = provider?.user;
      } else {
        const provider = await db.serviceProvider.findUnique({
          where: { id: transaction.serviceProviderId },
          include: { user: true }
        });
        providerUser = provider?.user;
      }

      if (!providerUser) return;

      // Calcular período
      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      const periodEnd = new Date().toISOString().substring(0, 10);

      // Obtener conteo de trabajos
      let jobCount = 0;
      if (transaction.providerType === 'MAINTENANCE') {
        jobCount = await db.maintenance.count({
          where: {
            maintenanceProviderId: transaction.maintenanceProviderId,
            status: 'COMPLETED',
            completedDate: {
              gte: new Date(periodStart),
              lte: new Date(periodEnd)
            }
          }
        });
      } else {
        jobCount = await db.serviceJob.count({
          where: {
            serviceProviderId: transaction.serviceProviderId,
            status: 'COMPLETED',
            completedDate: {
              gte: new Date(periodStart),
              lte: new Date(periodEnd)
            }
          }
        });
      }

      await NotificationService.notifyProviderPayoutApproved({
        providerId: providerUser.id,
        providerName: providerUser.name || 'Proveedor',
        amount: transaction.amount,
        netAmount: transaction.netAmount,
        jobCount,
        periodStart,
        periodEnd,
        paymentMethod: transaction.paymentMethod || 'bank_transfer',
        providerType: transaction.providerType
      });

    } catch (error) {
      logger.error('Error enviando notificación de payout:', error as Error);
    }
  }

  /**
   * Obtiene estadísticas de payouts de proveedores
   */
  static async getProviderPayoutStats(): Promise<{
    totalProviders: number;
    totalPaid: number;
    totalPending: number;
    averagePerProvider: number;
    maintenanceProviders: number;
    serviceProviders: number;
  }> {
    try {
      const [
        totalStats,
        maintenanceStats,
        serviceStats,
        pendingCount
      ] = await Promise.all([
        // Estadísticas generales
        db.providerTransaction.aggregate({
          _sum: {
            netAmount: true
          },
          _count: {
            id: true
          }
        }),

        // Estadísticas de mantenimiento
        db.maintenanceProvider.count({
          where: {
            user: {
              isActive: true
            }
          }
        }),

        // Estadísticas de servicios
        db.serviceProvider.count({
          where: {
            user: {
              isActive: true
            }
          }
        }),

        // Conteo de transacciones pendientes
        db.providerTransaction.count({
          where: {
            status: 'PENDING'
          }
        })
      ]);

      const totalProviders = maintenanceStats + serviceStats;
      const totalPaid = totalStats._sum?.netAmount || 0;
      const averagePerProvider = totalProviders > 0 ? totalPaid / totalProviders : 0;

      return {
        totalProviders,
        totalPaid,
        totalPending: pendingCount,
        averagePerProvider,
        maintenanceProviders: maintenanceStats,
        serviceProviders: serviceStats
      };

    } catch (error) {
      logger.error('Error obteniendo estadísticas de payouts:', error as Error);
      return {
        totalProviders: 0,
        totalPaid: 0,
        totalPending: 0,
        averagePerProvider: 0,
        maintenanceProviders: 0,
        serviceProviders: 0
      };
    }
  }
}
