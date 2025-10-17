import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    // Obtener pagos pendientes que necesitan recordatorios
    const pendingPayments = await db.payment.findMany({
      where: {
        contract: {
          ownerId: user.id,
        },
        status: 'PENDING',
        dueDate: {
          lte: new Date(), // Pagos vencidos
        },
      },
      include: {
        contract: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                address: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Transformar los datos al formato esperado por el frontend
    const transformedPayments = pendingPayments.map(payment => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      dueDate: payment.dueDate.toISOString(),
      tenantId: payment.contract.tenant.id,
      tenantName: payment.contract.tenant.name,
      tenantEmail: payment.contract.tenant.email,
      tenantPhone: payment.contract.tenant.phone,
      propertyId: payment.contract.property.id,
      propertyTitle: payment.contract.property.title,
      contractId: payment.contract.id,
      daysOverdue: Math.ceil(
        (new Date().getTime() - payment.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    return NextResponse.json({
      success: true,
      pendingPayments: transformedPayments,
      totalCount: transformedPayments.length,
    });
  } catch (error) {
    logger.error('Error obteniendo pagos pendientes para recordatorios:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
