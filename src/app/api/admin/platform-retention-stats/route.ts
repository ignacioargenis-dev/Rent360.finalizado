import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

interface RetentionStats {
  totalRetainedThisMonth: number;
  totalRetainedLastMonth: number;
  averageRetentionRate: number;
  totalContracts: number;
  activeContracts: number;
  monthlyBreakdown: Array<{
    month: string;
    retained: number;
    contracts: number;
  }>;
  topRetainingContracts: Array<{
    contractId: string;
    contractNumber: string;
    propertyTitle: string;
    monthlyRent: number;
    retainedAmount: number;
    retentionRate: number;
  }>;
}

/**
 * GET /api/admin/platform-retention-stats
 * Obtiene estadísticas de retención de la plataforma
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Obtener configuración de retención
    const retentionSettings = await db.systemSetting.findMany({
      where: {
        category: 'platform_retention',
        isActive: true,
      },
    });

    const platformFeePercentage = parseFloat(
      retentionSettings.find(s => s.key === 'platformFeePercentage')?.value || '5.0'
    );
    const paymentProviderFeePercentage = parseFloat(
      retentionSettings.find(s => s.key === 'paymentProviderFeePercentage')?.value || '1.0'
    );

    const totalRetentionRate = platformFeePercentage + paymentProviderFeePercentage;

    // Obtener pagos de este mes
    const paymentsThisMonth = await db.payment.findMany({
      where: {
        status: 'PAID',
        dueDate: {
          gte: startOfThisMonth,
          lte: now,
        },
        contract: {
          status: 'ACTIVE',
        },
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
            property: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Obtener pagos del mes pasado
    const paymentsLastMonth = await db.payment.findMany({
      where: {
        status: 'PAID',
        dueDate: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
        contract: {
          status: 'ACTIVE',
        },
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            monthlyRent: true,
            property: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Calcular retenciones
    const totalRetainedThisMonth = paymentsThisMonth.reduce((sum, payment) => {
      const retentionAmount = (payment.amount * totalRetentionRate) / 100;
      return sum + retentionAmount;
    }, 0);

    const totalRetainedLastMonth = paymentsLastMonth.reduce((sum, payment) => {
      const retentionAmount = (payment.amount * totalRetentionRate) / 100;
      return sum + retentionAmount;
    }, 0);

    // Obtener estadísticas de contratos
    const totalContracts = await db.contract.count();
    const activeContracts = await db.contract.count({
      where: { status: 'ACTIVE' },
    });

    // Calcular tasa promedio de retención
    const allPayments = [...paymentsThisMonth, ...paymentsLastMonth];
    const averageRetentionRate = allPayments.length > 0 ? totalRetentionRate : 0;

    // Obtener desglose mensual de los últimos 6 meses
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthPayments = await db.payment.findMany({
        where: {
          status: 'PAID',
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          contract: {
            status: 'ACTIVE',
          },
        },
      });

      const monthRetained = monthPayments.reduce((sum, payment) => {
        const retentionAmount = (payment.amount * totalRetentionRate) / 100;
        return sum + retentionAmount;
      }, 0);

      monthlyBreakdown.push({
        month: monthStart.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }),
        retained: monthRetained,
        contracts: monthPayments.length,
      });
    }

    // Obtener contratos con mayor retención
    const topRetainingContracts = paymentsThisMonth
      .map(payment => {
        const retentionAmount = (payment.amount * totalRetentionRate) / 100;
        return {
          contractId: payment.contract.id,
          contractNumber: payment.contract.contractNumber,
          propertyTitle: payment.contract.property.title,
          monthlyRent: payment.contract.monthlyRent || payment.amount,
          retainedAmount: retentionAmount,
          retentionRate: totalRetentionRate,
        };
      })
      .sort((a, b) => b.retainedAmount - a.retainedAmount)
      .slice(0, 10);

    const stats: RetentionStats = {
      totalRetainedThisMonth,
      totalRetainedLastMonth,
      averageRetentionRate,
      totalContracts,
      activeContracts,
      monthlyBreakdown,
      topRetainingContracts,
    };

    logger.info('Estadísticas de retención obtenidas', {
      userId: user.id,
      stats: {
        totalRetainedThisMonth,
        totalRetainedLastMonth,
        activeContracts,
        totalContracts,
      },
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de retención:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
