import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

// Esquemas de validación
const processRefundSchema = z.object({
  finalAmount: z.number().min(0, 'Monto final debe ser mayor o igual a 0'),
  paymentMethod: z.string().min(1, 'Método de pago es requerido'),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// POST - Procesar devolución
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const body = await request.json();

    const validatedData = processRefundSchema.parse(body);

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          },
        },
        tenant: true,
        owner: true,
      },
    });

    if (!refund) {
      return NextResponse.json({ error: 'Solicitud de devolución no encontrada' }, { status: 404 });
    }

    // Verificar permisos: solo admin puede procesar devoluciones
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden procesar devoluciones' },
        { status: 403 }
      );
    }

    // Verificar que la solicitud esté aprobada
    if (refund.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'La devolución debe estar aprobada por ambas partes antes de procesarla' },
        { status: 400 }
      );
    }

    // Verificar que no hay disputas activas
    const activeDisputes = await db.refundDispute.count({
      where: {
        refundId: id,
        status: {
          in: ['OPEN', 'UNDER_MEDIATION'],
        },
      },
    });

    if (activeDisputes > 0) {
      return NextResponse.json(
        { error: 'No se puede procesar una devolución con disputas activas' },
        { status: 400 }
      );
    }

    // Verificar que ambas partes han aprobado
    if (!refund.tenantApproved || !refund.ownerApproved) {
      return NextResponse.json(
        { error: 'Ambas partes deben aprobar la devolución antes de procesarla' },
        { status: 400 }
      );
    }

    // Validar que el monto final no exceda el depósito original
    if (validatedData.finalAmount > refund.originalDeposit) {
      return NextResponse.json(
        { error: 'El monto final no puede exceder el depósito original' },
        { status: 400 }
      );
    }

    // Calcular monto a devolver automáticamente si no se especifica
    let finalAmount = validatedData.finalAmount;
    if (!finalAmount) {
      // Cálculo automático: depósito original - reclamaciones
      const totalClaimed = refund.tenantClaimed + refund.ownerClaimed;
      finalAmount = Math.max(0, refund.originalDeposit - totalClaimed);
    }

    // Procesar la devolución en una transacción
    const result = await db.$transaction(async tx => {
      // Actualizar la solicitud de devolución
      const processedRefund = await tx.depositRefund.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          approvedAmount: finalAmount,
          processedAt: new Date(),
        },
        include: {
          contract: {
            include: {
              tenant: true,
              owner: true,
              property: true,
            },
          },
          tenant: true,
          owner: true,
        },
      });

      // Crear un pago de reembolso
      const refundPayment = await tx.payment.create({
        data: {
          paymentNumber: `REF-${refund.refundNumber}`,
          contractId: refund.contractId,
          payerId: refund.ownerId, // El propietario paga al inquilino
          amount: finalAmount,
          dueDate: new Date(),
          paidDate: new Date(),
          status: 'COMPLETED',
          method: validatedData.paymentMethod as any,
          transactionId: validatedData.transactionId ?? null,
          notes: `Devolución de depósito: ${validatedData.notes || ''}`,
        },
      });

      return { processedRefund, refundPayment };
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'REFUND_PROCESSED',
        details: `Devolución procesada: $${finalAmount} - Método: ${validatedData.paymentMethod}${validatedData.transactionId ? ` - Transacción: ${validatedData.transactionId}` : ''}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Enviar notificaciones
    await Promise.all([
      // Notificar al inquilino
      db.notification.create({
        data: {
          userId: refund.tenantId,
          title: 'Devolución de Depósito Procesada',
          message: `Tu devolución de depósito por $${finalAmount.toLocaleString()} ha sido procesada exitosamente.`,
          type: 'SUCCESS',
          metadata: JSON.stringify({
            refundId: id,
            amount: finalAmount,
            paymentMethod: validatedData.paymentMethod,
            transactionId: validatedData.transactionId,
          }),
        },
      }),
      // Notificar al propietario
      db.notification.create({
        data: {
          userId: refund.ownerId,
          title: 'Devolución de Depósito Procesada',
          message: `La devolución de depósito por $${finalAmount.toLocaleString()} ha sido procesada exitosamente.`,
          type: 'SUCCESS',
          metadata: JSON.stringify({
            refundId: id,
            amount: finalAmount,
            paymentMethod: validatedData.paymentMethod,
            transactionId: validatedData.transactionId,
          }),
        },
      }),
    ]);

    logger.info('Devolución procesada:', {
      refundId: id,
      userId: user.id,
      finalAmount,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
    });

    return NextResponse.json({
      success: true,
      data: {
        refund: result.processedRefund,
        payment: result.refundPayment,
      },
      message: 'Devolución procesada exitosamente',
    });
  } catch (error) {
    logger.error('Error procesando devolución:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
