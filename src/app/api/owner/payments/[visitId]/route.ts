import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { OwnerPaymentService } from '@/lib/owner-payment-service';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/owner/payments/[visitId]
 * Obtiene el estado de un pago asociado a una visita
 */
export async function GET(request: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para propietarios.' },
        { status: 403 }
      );
    }

    const { visitId } = params;

    const paymentStatus = await OwnerPaymentService.getPaymentStatus(visitId);

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'No se encontró un pago para esta visita' },
        { status: 404 }
      );
    }

    // Verificar que el pago pertenece al propietario autenticado
    // Obtener la propiedad directamente de la base de datos
    const { db } = await import('@/lib/db');
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      select: {
        property: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!visit || visit.property.ownerId !== user.id) {
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
 * POST /api/owner/payments/[visitId]/authorize
 * Autoriza un pago para una visita (si no se autorizó al crear la visita)
 */
export async function POST(request: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para propietarios.' },
        { status: 403 }
      );
    }

    const { visitId } = params;
    const body = await request.json();

    const { paymentMethod, paymentMethodId } = body;

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 });
    }

    // Obtener la visita para obtener el monto y verificar propiedad
    const { db } = await import('@/lib/db');
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        property: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    if (visit.property.ownerId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos sobre esta visita' }, { status: 403 });
    }

    // Autorizar el pago
    const authorizationResult = await OwnerPaymentService.authorizePayment({
      visitId,
      ownerId: user.id,
      amount: visit.earnings,
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
