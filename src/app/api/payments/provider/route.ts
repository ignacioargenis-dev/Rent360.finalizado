import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

// Schema para crear pago a provider
const createProviderPaymentSchema = z.object({
  providerId: z.string().min(1, 'ID de proveedor requerido'),
  providerType: z.enum(['maintenance', 'service']),
  amount: z.number().positive('Monto debe ser positivo'),
  jobId: z.string().optional(),
  description: z.string().min(1, 'Descripción requerida'),
  paymentMethod: z.enum(['BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH']),
  commissionPercentage: z.number().min(0).max(100).optional(),
});

// Schema para obtener pagos de provider
const getProviderPaymentsSchema = z.object({
  providerId: z.string().min(1, 'ID de proveedor requerido'),
  providerType: z.enum(['maintenance', 'service']),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional(),
});

// POST - Crear pago a provider
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins, owners y brokers pueden crear pagos
    if (!['ADMIN', 'OWNER', 'BROKER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No autorizado para crear pagos' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createProviderPaymentSchema.parse(body);

    // Verificar que el provider existe
    let provider;
    if (validatedData.providerType === 'maintenance') {
      provider = await db.maintenanceProvider.findUnique({
        where: { id: validatedData.providerId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // bankAccount: {
          //   select: {
          //     bank: true,
          //     accountNumber: true,
          //     holderName: true
          //   }
          // }
        },
      });
    } else {
      provider = await db.serviceProvider.findUnique({
        where: { id: validatedData.providerId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          // bankAccount: {
          //   select: {
          //     bank: true,
          //     accountNumber: true,
          //     holderName: true
          //   }
          // }
        },
      });
    }

    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 },
      );
    }

    // Calcular comisión
    const commissionPercentage = validatedData.commissionPercentage || 10; // Default 10%
    const commissionAmount = (validatedData.amount * commissionPercentage) / 100;
    const netAmount = validatedData.amount - commissionAmount;

    // Crear transacción en una transacción de base de datos
    const result = await db.$transaction(async (tx) => {
      // Crear transacción de provider
      const providerTransaction = await tx.providerTransaction.create({
        data: {
          providerType: validatedData.providerType === 'maintenance' ? 'MAINTENANCE' : 'SERVICE',
          maintenanceProviderId: validatedData.providerType === 'maintenance' ? validatedData.providerId : undefined,
          serviceProviderId: validatedData.providerType === 'service' ? validatedData.providerId : undefined,
          amount: validatedData.amount,
          commission: commissionAmount,
          netAmount,
          status: 'PENDING',
          paymentMethod: validatedData.paymentMethod,
          ...(validatedData.providerType === 'service' && validatedData.jobId ? { serviceJobId: validatedData.jobId } : {}),
          ...(validatedData.providerType === 'maintenance' && validatedData.jobId ? { maintenanceId: validatedData.jobId } : {}),
          processedAt: null,
        },
      });

      // Actualizar estadísticas del provider
      if (validatedData.providerType === 'maintenance') {
        await tx.maintenanceProvider.update({
          where: { id: validatedData.providerId },
          data: {
            totalEarnings: {
              increment: netAmount,
            },
            // totalTransactions: {
            //   increment: 1
            // }
          },
        });
      } else {
        await tx.serviceProvider.update({
          where: { id: validatedData.providerId },
          data: {
            totalEarnings: {
              increment: netAmount,
            },
            // totalTransactions: {
            //   increment: 1
            // }
          },
        });
      }

      return providerTransaction;
    });

    // Simular procesamiento de pago (en producción, aquí iría la integración con pasarela de pago)
    setTimeout(async () => {
      try {
        await db.providerTransaction.update({
          where: { id: result.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        // Enviar notificación al provider (implementar sistema de notificaciones)
        logger.info('Pago completado para provider:', { providerName: provider.user.name, netAmount });
      } catch (error) {
        logger.error('Error procesando pago:', { error: error instanceof Error ? error.message : String(error) });
        await db.providerTransaction.update({
          where: { id: result.id },
          data: {
            status: 'FAILED',
            processedAt: new Date(),
          },
        });
      }
    }, 2000); // Simular 2 segundos de procesamiento

    return NextResponse.json({
      message: 'Pago creado exitosamente',
      transaction: {
        id: result.id,
        amount: result.amount,
        netAmount: result.netAmount,
        commissionAmount: commissionAmount,
        status: result.status,
        providerName: provider.user.name,
        description: validatedData.description,
      },
    }, { status: 201 });

  } catch (error) {
    return handleError(error);
  }
}

// GET - Obtener pagos de provider
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const queryParams = {
      providerId: searchParams.get('providerId'),
      providerType: searchParams.get('providerType'),
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    };

    const validatedParams = getProviderPaymentsSchema.parse(queryParams);
    
    // Verificar permisos
    if (user.role === 'ADMIN') {
      // Admin puede ver todos los pagos
    } else if (['MAINTENANCE_PROVIDER', 'SERVICE_PROVIDER'].includes(user.role)) {
      // Providers solo pueden ver sus propios pagos
      if (validatedParams.providerId !== user.id) {
        return NextResponse.json(
          { error: 'Solo puedes ver tus propios pagos' },
          { status: 403 },
        );
      }
    } else {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const page = validatedParams.page || 1;
    const limit = validatedParams.limit || 10;
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      providerId: validatedParams.providerId,
      providerType: validatedParams.providerType === 'maintenance' ? 'MAINTENANCE' : 'SERVICE',
    };

    if (validatedParams.status) {
      where.status = validatedParams.status;
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      where.createdAt = {};
      if (validatedParams.startDate) {
        where.createdAt.gte = new Date(validatedParams.startDate);
      }
      if (validatedParams.endDate) {
        where.createdAt.lte = new Date(validatedParams.endDate);
      }
    }

    // Obtener transacciones
    const [transactions, total] = await Promise.all([
      db.providerTransaction.findMany({
        where,
        include: {
          // payer: {
          //   select: {
          //     id: true,
          //     name: true,
          //     email: true
          //   }
          // }
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.providerTransaction.count({ where }),
    ]);

    // Calcular estadísticas
    const stats = await db.providerTransaction.aggregate({
      where,
      _sum: {
        amount: true,
        netAmount: true,
        commission: true,
      },
      _count: true,
    });

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalAmount: stats._sum?.amount || 0,
        totalNetAmount: stats._sum?.netAmount || 0,
        totalCommission: stats._sum?.commission || 0,
        totalTransactions: stats._count || 0,
      },
    });

  } catch (error) {
    return handleError(error);
  }
}
