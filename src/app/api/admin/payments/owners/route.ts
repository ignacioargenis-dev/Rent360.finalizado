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

    // Obtener pagos realizados a propietarios
    const payments = await db.payment.findMany({
      where: {
        ...where,
        type: { in: ['OWNER_PAYOUT', 'RENT_PAYMENT'] }, // Pagos a propietarios
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
    const payouts = payments.map((payment, index) => {
      const commission = Math.round(payment.amount * 0.05); // 5% de comisión
      const netAmount = payment.amount - commission;

      // Generar periodo basado en la fecha del pago
      const paymentDate = payment.createdAt;
      const period = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;

      return {
        id: payment.id,
        ownerName: payment.contract?.property?.owner?.name || 'Propietario desconocido',
        propertyAddress: payment.contract?.property?.address || 'Dirección no disponible',
        tenantName: payment.contract?.tenant?.name || 'Inquilino desconocido',
        amount: payment.amount,
        currency: 'CLP',
        status: payment.status.toLowerCase(),
        period,
        paymentDate: payment.status === 'COMPLETED' ? payment.createdAt.toISOString() : undefined,
        description: `Pago mensual arriendo ${period}`,
        commission,
        netAmount,
        paymentMethod: 'bank_transfer', // Por defecto
        invoiceNumber: `PO-${paymentDate.getFullYear()}-${String(index + 1).padStart(3, '0')}`,
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

    logger.info('Owner payments report generated', {
      adminId: user.id,
      totalPayouts: payouts.length,
      totalAmount,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating owner payments report:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
