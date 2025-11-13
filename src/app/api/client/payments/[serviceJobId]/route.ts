import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { ClientPaymentService } from '@/lib/client-payment-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/client/payments/[serviceJobId]
 * Obtiene el estado de un pago asociado a un trabajo
 */
export async function GET(request: NextRequest, { params }: { params: { serviceJobId: string } }) {
  try {
    const user = await requireAuth(request);

    // Solo clientes (tenants) pueden ver sus propios pagos
    if (user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para clientes.' }, { status: 403 });
    }

    const { serviceJobId } = params;

    const paymentStatus = await ClientPaymentService.getPaymentStatus(serviceJobId);

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'No se encontró un pago para este trabajo' },
        { status: 404 }
      );
    }

    // Verificar que el pago pertenece al cliente autenticado
    const { db } = await import('@/lib/db');
    const serviceJob = await db.serviceJob.findUnique({
      where: { id: serviceJobId },
      select: {
        requesterId: true,
      },
    });

    if (!serviceJob || serviceJob.requesterId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para ver este pago' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      payment: paymentStatus,
    });
  } catch (error) {
    logger.error('Error obteniendo estado de pago:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * POST /api/client/payments/[serviceJobId]/authorize
 * Autoriza un pago para un trabajo (si no se autorizó al crear el trabajo)
 */
export async function POST(request: NextRequest, { params }: { params: { serviceJobId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT') {
      return NextResponse.json({ error: 'Acceso denegado. Solo para clientes.' }, { status: 403 });
    }

    const { serviceJobId } = params;
    const body = await request.json();

    const { paymentMethod, paymentMethodId } = body;

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 });
    }

    // Obtener el trabajo para obtener el monto y verificar propiedad
    const { db } = await import('@/lib/db');
    const serviceJob = await db.serviceJob.findUnique({
      where: { id: serviceJobId },
      select: {
        id: true,
        requesterId: true,
        finalPrice: true,
        basePrice: true,
        status: true,
      },
    });

    if (!serviceJob) {
      return NextResponse.json({ error: 'Trabajo no encontrado' }, { status: 404 });
    }

    if (serviceJob.requesterId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos sobre este trabajo' }, { status: 403 });
    }

    // Usar finalPrice si existe, sino basePrice
    const amount = serviceJob.finalPrice || serviceJob.basePrice;

    // Autorizar el pago
    const authorizationResult = await ClientPaymentService.authorizePayment({
      serviceJobId,
      clientId: user.id,
      amount,
      paymentMethod,
      paymentMethodId,
    });

    if (!authorizationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: authorizationResult.error || 'Error autorizando pago',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: authorizationResult.paymentId,
        authorizationId: authorizationResult.authorizationId,
        clientSecret: authorizationResult.clientSecret,
      },
    });
  } catch (error) {
    logger.error('Error autorizando pago:', error);
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
