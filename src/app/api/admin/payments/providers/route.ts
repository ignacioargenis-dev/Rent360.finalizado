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
    const providerType = searchParams.get('providerType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construir filtros
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Obtener pagos realizados a proveedores/servicios
    const servicePayments = await db.payment.findMany({
      where: {
        ...where,
        type: { in: ['SERVICE', 'MAINTENANCE', 'CLEANING', 'REPAIR'] }, // Pagos a proveedores
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
        // Si hay una tabla de proveedores, incluirla aquí
        // provider: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transformar los datos para el formato esperado por el frontend
    const payouts = servicePayments.map((payment, index) => {
      // Calcular IVA (19% en Chile)
      const taxRate = 0.19;
      const taxAmount = Math.round(payment.amount * taxRate);
      const totalAmount = payment.amount + taxAmount;

      // Determinar tipo de proveedor basado en el tipo de pago
      const providerType = payment.type.toLowerCase();

      // Generar nombre de proveedor basado en el tipo de servicio
      const providerNames: { [key: string]: string } = {
        maintenance: 'Servicio de Mantención',
        service: 'Proveedor de Servicios',
        cleaning: 'Servicio de Limpieza',
        repair: 'Servicio de Reparaciones',
      };

      const providerName = providerNames[providerType] || 'Proveedor de Servicios';

      // Fecha del servicio (usamos la fecha de creación como aproximación)
      const serviceDate = payment.createdAt;

      return {
        id: payment.id,
        providerName,
        providerType,
        amount: payment.amount,
        currency: 'CLP',
        status: payment.status.toLowerCase(),
        serviceDate: serviceDate.toISOString(),
        paymentDate: payment.status === 'COMPLETED' ? payment.createdAt.toISOString() : undefined,
        description: `Servicio ${providerType} - ${payment.contract?.property?.address || 'Propiedad sin dirección'}`,
        propertyAddress: payment.contract?.property?.address || 'Dirección no disponible',
        clientName:
          payment.contract?.tenant?.name ||
          payment.contract?.property?.owner?.name ||
          'Cliente desconocido',
        paymentMethod: 'bank_transfer', // Por defecto
        invoiceNumber: `PS-${serviceDate.getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        taxAmount,
        totalAmount,
      };
    });

    // Calcular estadísticas
    const completedPayouts = payouts.filter(p => p.status === 'completed');
    const pendingPayouts = payouts.filter(p => p.status === 'pending').length;
    const totalAmount = completedPayouts.reduce((sum, payout) => sum + payout.totalAmount, 0);

    // Pagos completados este mes
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const completedThisMonth = completedPayouts.filter(
      p => p.paymentDate && new Date(p.paymentDate) >= thisMonth
    ).length;

    // Monto promedio
    const averagePayoutAmount =
      completedPayouts.length > 0
        ? completedPayouts.reduce((sum, payout) => sum + payout.totalAmount, 0) /
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

    logger.info('Provider payments report generated', {
      adminId: user.id,
      totalPayouts: payouts.length,
      totalAmount,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error generating provider payments report:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
