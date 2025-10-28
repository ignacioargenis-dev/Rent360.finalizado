import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const user = await requireAuth(request);
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '6months';

    // Calcular fechas según el rango
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    }

    // 1. DATOS DE REPORTE MENSUAL
    const monthlyReports = [];

    for (let i = 5; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      // Obtener todos los pagos en este periodo
      const payments = await db.payment.findMany({
        where: {
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        select: {
          amount: true,
          status: true,
        },
      });

      const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
      const paidAmount = payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);
      const overdueAmount = payments
        .filter(p => p.status === 'OVERDUE')
        .reduce((sum, p) => sum + p.amount, 0);

      monthlyReports.push({
        month: periodStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        totalAmount,
        paidAmount,
        pendingAmount,
        overdueAmount,
        transactionCount: payments.length,
      });
    }

    // 2. RENDIMIENTO DE PROPIEDADES
    const properties = await db.property.findMany({
      include: {
        contracts: {
          where: {
            status: 'ACTIVE',
            createdAt: { gte: startDate },
          },
          include: {
            tenant: {
              select: {
                name: true,
              },
            },
            payments: {
              where: {
                status: 'COMPLETED',
                createdAt: { gte: startDate },
              },
            },
          },
        },
        reviews: true,
      },
    });

    const propertyPerformance = await Promise.all(
      properties.slice(0, 10).map(async property => {
        const activeContracts = property.contracts.length;
        const totalPayments = property.contracts.reduce(
          (sum, contract) => sum + contract.payments.length,
          0
        );
        const totalRevenue = property.contracts.reduce(
          (sum, contract) =>
            sum + contract.payments.reduce((pSum, payment) => pSum + payment.amount, 0),
          0
        );

        const averageRating =
          property.reviews.length > 0
            ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
              property.reviews.length
            : 0;

        // Calcular tiempo promedio de pago
        const paymentTimes = property.contracts.flatMap(contract =>
          contract.payments.map(payment => {
            const contractDate = contract.startDate;
            const paymentDate = payment.createdAt;
            return Math.max(
              0,
              Math.floor((paymentDate.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24))
            );
          })
        );

        const averagePaymentTime =
          paymentTimes.length > 0
            ? paymentTimes.reduce((sum, time) => sum + time, 0) / paymentTimes.length
            : 0;

        return {
          propertyId: property.id,
          propertyTitle: property.title,
          monthlyRevenue: totalRevenue,
          occupancyRate: activeContracts > 0 ? 100 : 0, // Simplificado
          totalPayments,
          averageRating: Math.round(averageRating * 10) / 10,
          averagePaymentTime: Math.round(averagePaymentTime),
          tenantName: property.contracts[0]?.tenant?.name || 'Sin inquilino',
        };
      })
    );

    const response = {
      reportData: monthlyReports,
      propertyPerformance,
      summary: {
        generatedAt: new Date().toISOString(),
        totalRevenue: monthlyReports.reduce((sum, report) => sum + report.paidAmount, 0),
        totalTransactions: monthlyReports.reduce((sum, report) => sum + report.transactionCount, 0),
        averageMonthlyRevenue:
          monthlyReports.length > 0
            ? monthlyReports.reduce((sum, report) => sum + report.paidAmount, 0) /
              monthlyReports.length
            : 0,
        timeRange,
      },
    };

    logger.info('Payment reports generated', {
      adminId: user.id,
      totalRevenue: response.summary.totalRevenue,
      totalTransactions: response.summary.totalTransactions,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating payment reports:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
