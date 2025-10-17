import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

const markPaidSchema = z.object({
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario, corredor o administrador.' },
        { status: 403 }
      );
    }

    const paymentId = params.id;
    const body = await request.json();
    const validatedData = markPaidSchema.parse(body);

    // Verificar que el pago existe
    const payment = await db.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verificar que el usuario tiene permisos para modificar este pago
    if (user.role === 'OWNER' && payment.contract.property.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este pago' },
        { status: 403 }
      );
    }

    // Verificar que el pago no esté ya marcado como pagado
    if (payment.status === 'PAID') {
      return NextResponse.json(
        { error: 'El pago ya está marcado como realizado' },
        { status: 400 }
      );
    }

    // Actualizar el pago
    const updatedPayment = await db.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : new Date(),
        method: validatedData.paymentMethod || payment.method,
        notes: validatedData.notes || payment.notes,
        updatedAt: new Date(),
      },
      include: {
        contract: {
          include: {
            property: {
              include: {
                owner: true,
              },
            },
            tenant: true,
          },
        },
      },
    });

    // Crear registro de auditoría
    await db.auditLog.create({
      data: {
        action: 'PAYMENT_MARKED_PAID',
        entityType: 'PAYMENT',
        entityId: paymentId,
        userId: user.id,
        details: JSON.stringify({
          previousStatus: payment.status,
          newStatus: 'PAID',
          paymentMethod: validatedData.paymentMethod,
          notes: validatedData.notes,
          markedBy: user.name || user.email,
        }),
        timestamp: new Date(),
      },
    });

    // Enviar notificación al inquilino (opcional)
    try {
      await db.notification.create({
        data: {
          type: 'payment_confirmed',
          title: 'Pago Confirmado',
          message: `Tu pago de $${payment.amount} ha sido confirmado por el propietario.`,
          recipientId: payment.contract.tenantId,
          recipientEmail: payment.contract.tenant.email,
          priority: 'MEDIUM',
          channels: 'in_app,email',
          status: 'SENT',
          sentAt: new Date(),
          sentBy: user.id,
        },
      });
    } catch (notificationError) {
      logger.error('Error creando notificación de pago confirmado:', {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
        paymentId,
      });
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        paymentDate: updatedPayment.paymentDate?.toISOString(),
        method: updatedPayment.method,
        notes: updatedPayment.notes,
        updatedAt: updatedPayment.updatedAt.toISOString(),
      },
      message: 'Pago marcado como realizado exitosamente',
    });
  } catch (error) {
    logger.error('Error marcando pago como realizado:', {
      error: error instanceof Error ? error.message : String(error),
      paymentId: params.id,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
