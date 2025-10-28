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
    const status = searchParams.get('status');
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir filtros
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (period) {
      // Filtrar por periodo (formato YYYY-MM)
      const [year, month] = period.split('-');
      const startDate = new Date(parseInt(year!), parseInt(month!) - 1, 1);
      const endDate = new Date(parseInt(year!), parseInt(month!), 0);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // Obtener pagos de comisiones a corredores
    const commissionPayments = await db.payment.findMany({
      where: {
        ...where,
        type: 'COMMISSION', // Pagos de comisiones a brokers
        status: { in: ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED'] },
      },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                broker: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transformar los datos para el formato esperado por el frontend
    const payouts = commissionPayments.map((payment, index) => {
      // Calcular el valor del trato basado en el contrato
      const dealValue = payment.contract?.monthlyRent || 0;

      // La comisión ya está calculada en el pago
      const commissionAmount = payment.amount;
      const commissionRate = dealValue > 0 ? (commissionAmount / dealValue) * 100 : 5; // 5% por defecto

      // Generar periodo basado en la fecha del pago
      const paymentDate = payment.createdAt;
      const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: payment.id,
        brokerName: payment.contract?.property?.broker?.name || 'Corredor desconocido',
        propertyAddress: payment.contract?.property?.address || 'Dirección no disponible',
        ownerName: payment.contract?.property?.owner?.name || 'Propietario desconocido',
        tenantName: payment.contract?.tenant?.name || 'Inquilino desconocido',
        commission: commissionAmount,
        currency: 'CLP',
        status: payment.status.toLowerCase(),
        period,
        paymentDate: payment.status === 'COMPLETED' ? payment.createdAt.toISOString() : undefined,
        description: `Comisión por arriendo ${period}`,
        dealValue,
        commissionRate: Math.round(commissionRate * 10) / 10,
        netAmount: commissionAmount, // Para brokers, netAmount es igual a commission
        paymentMethod: 'bank_transfer', // Por defecto
        invoiceNumber: `PB-${paymentDate.getFullYear()}-${String(index + 1).padStart(3, '0')}`,
      };
    });

    // Calcular estadísticas
    const completedPayouts = payouts.filter(p => p.status === 'completed');
    const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
    const totalAmount = completedPayouts.reduce((sum, payout) => sum + payout.netAmount, 0);

    // Pagos completados este mes
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const completedThisMonth = completedPayouts.filter(
      p => p.paymentDate && new Date(p.paymentDate) >= thisMonth
    ).length;

    // Monto promedio
    const averagePayoutAmount =
      completedPayouts.length > 0
        ? completedPayouts.reduce((sum, payout) => sum + payout.netAmount, 0) /
          completedPayouts.length
        : 0;

    // Tasa de éxito
    const successRate = payouts.length > 0 ? (completedPayouts.length / payouts.length) * 100 : 0;

    const stats = {
      totalPayouts: payouts.length,
      totalAmount,
      pendingPayouts,
      completedThisMonth,
      averagePayoutAmount,
      successRate,
    };

    const response = {
      payouts,
      stats,
      summary: {
        generatedAt: new Date().toISOString(),
        totalPayouts: payouts.length,
        totalAmount,
        successRate: Math.round(successRate * 10) / 10,
      },
    };

    logger.info('Broker payments report generated', {
      adminId: user.id,
      totalPayouts: payouts.length,
      totalAmount,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating broker payments report:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
