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

    // Obtener todos los contratos del propietario con información del inquilino
    const contracts = await db.contract.findMany({
      where: {
        ownerId: user.id,
        status: {
          in: ['ACTIVE', 'PENDING', 'TERMINATED'],
        },
      },
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
        payments: {
          where: {
            status: 'PENDING',
          },
          select: {
            amount: true,
            dueDate: true,
          },
          orderBy: {
            dueDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar los contratos en inquilinos
    const tenants = contracts.map(contract => {
      // Calcular estado de pago
      let paymentStatus: 'CURRENT' | 'LATE' | 'OVERDUE' = 'CURRENT';
      let outstandingBalance = 0;

      if (contract.payments.length > 0) {
        const latestPayment = contract.payments[0];
        if (latestPayment) {
          const dueDate = new Date(latestPayment.dueDate);
          const now = new Date();
          const daysPastDue = Math.floor(
            (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysPastDue > 30) {
            paymentStatus = 'OVERDUE';
            outstandingBalance = latestPayment.amount;
          } else if (daysPastDue > 0) {
            paymentStatus = 'LATE';
            outstandingBalance = latestPayment.amount;
          }
        }
      }

      return {
        id: contract.tenant?.id || `tenant-${contract.id}`,
        name: contract.tenant?.name || 'Inquilino no especificado',
        email: contract.tenant?.email || '',
        phone: contract.tenant?.phone || '',
        property: {
          id: contract.property.id,
          title: contract.property.title,
          address: contract.property.address,
        },
        leaseStart: contract.startDate.toISOString().split('T')[0],
        leaseEnd: contract.endDate.toISOString().split('T')[0],
        monthlyRent: contract.monthlyRent,
        status: contract.status as 'ACTIVE' | 'PENDING' | 'TERMINATED',
        paymentStatus,
        lastPayment:
          contract.payments.length > 0 && contract.payments[0]
            ? contract.payments[0].dueDate.toISOString().split('T')[0]
            : contract.startDate.toISOString().split('T')[0],
        outstandingBalance,
      };
    });

    return NextResponse.json({
      tenants,
      total: tenants.length,
    });
  } catch (error) {
    logger.error('Error fetching owner tenants:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({
      tenants: [],
      total: 0,
      message: 'No hay inquilinos registrados en el sistema',
    });
  }
}
