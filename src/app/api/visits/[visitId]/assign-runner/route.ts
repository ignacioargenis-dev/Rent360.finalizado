import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';
import { OwnerPaymentService } from '@/lib/owner-payment-service';
import { z } from 'zod';

const assignRunnerSchema = z.object({
  runnerId: z.string(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(240).optional(),
  estimatedEarnings: z.number().min(0).optional(),
  notes: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'paypal', 'khipu', 'webpay']).optional(),
  paymentMethodId: z.string().optional(),
});

/**
 * POST /api/visits/[visitId]/assign-runner
 * Asigna un runner a una visita pendiente
 */
export async function POST(request: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const user = await requireAuth(request);
    const { visitId } = params;

    // Solo propietarios pueden asignar runners
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Solo los propietarios pueden asignar runners' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = assignRunnerSchema.parse(body);

    // Obtener la visita pendiente
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
            brokerId: true,
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
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Verificar permisos - solo propietarios pueden asignar runners
    if (visit.property.ownerId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos sobre esta visita' }, { status: 403 });
    }

    if (visit.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta visita ya ha sido procesada' }, { status: 400 });
    }

    // Verificar que el runner existe y está activo
    const runner = await db.user.findFirst({
      where: {
        id: validatedData.runnerId,
        role: 'RUNNER',
        isActive: true,
      },
    });

    if (!runner) {
      return NextResponse.json({ error: 'Runner no encontrado o no disponible' }, { status: 404 });
    }

    // Actualizar la visita con el runner asignado
    const updatedVisit = await db.visit.update({
      where: { id: visitId },
      data: {
        runnerId: validatedData.runnerId,
        status: 'SCHEDULED',
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : visit.scheduledAt,
        duration: validatedData.duration || visit.duration,
        earnings: validatedData.estimatedEarnings || visit.earnings || 0,
        notes: validatedData.notes || visit.notes,
      },
      include: {
        runner: {
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Autorizar pago si se proporcionó método de pago
    let paymentAuthorization = null;
    if (validatedData.paymentMethod && validatedData.estimatedEarnings) {
      try {
        const paymentData: {
          visitId: string;
          ownerId: string;
          amount: number;
          paymentMethod: 'stripe' | 'paypal' | 'khipu' | 'webpay';
          paymentMethodId?: string;
        } = {
          visitId: updatedVisit.id,
          ownerId: visit.property.ownerId,
          amount: validatedData.estimatedEarnings,
          paymentMethod: validatedData.paymentMethod,
        };

        if (validatedData.paymentMethodId) {
          paymentData.paymentMethodId = validatedData.paymentMethodId;
        }

        paymentAuthorization = await OwnerPaymentService.authorizePayment(paymentData);

        if (!paymentAuthorization.success) {
          logger.warn('Error autorizando pago al asignar runner', {
            visitId: updatedVisit.id,
            error: paymentAuthorization.error,
          });
        }
      } catch (error) {
        logger.error('Error en autorización de pago (no crítico)', {
          visitId: updatedVisit.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Notificar al runner
    try {
      await NotificationService.create({
        userId: validatedData.runnerId,
        type: 'VISIT_ASSIGNED',
        title: 'Nueva visita asignada',
        message: `Has sido asignado para realizar una visita a la propiedad "${visit.property.title}" el ${new Date(updatedVisit.scheduledAt).toLocaleDateString('es-CL')}.`,
        link: `/runner/visits/${updatedVisit.id}`,
      });
    } catch (notificationError) {
      logger.warn('Error enviando notificación al runner:', {
        error:
          notificationError instanceof Error
            ? notificationError.message
            : String(notificationError),
      });
    }

    // Notificar al inquilino
    if (visit.tenantId) {
      try {
        await NotificationService.create({
          userId: visit.tenantId,
          type: 'VISIT_SCHEDULED',
          title: 'Visita programada',
          message: `Tu solicitud de visita para "${visit.property.title}" ha sido programada. Un Runner360 realizará la visita el ${new Date(updatedVisit.scheduledAt).toLocaleDateString('es-CL')}.`,
          link: `/tenant/visits`,
        });
      } catch (notificationError) {
        logger.warn('Error enviando notificación al inquilino:', {
          error:
            notificationError instanceof Error
              ? notificationError.message
              : String(notificationError),
        });
      }
    }

    logger.info('Runner asignado a visita exitosamente', {
      visitId: updatedVisit.id,
      runnerId: validatedData.runnerId,
      assignedBy: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Runner asignado exitosamente',
      visit: {
        id: updatedVisit.id,
        runner: updatedVisit.runner,
        property: updatedVisit.property,
        scheduledAt: updatedVisit.scheduledAt.toISOString(),
        duration: updatedVisit.duration,
        status: updatedVisit.status,
        earnings: updatedVisit.earnings,
      },
      payment: paymentAuthorization
        ? {
            authorized: paymentAuthorization.success,
            paymentId: paymentAuthorization.paymentId,
            clientSecret: paymentAuthorization.clientSecret,
            error: paymentAuthorization.error,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error asignando runner a visita:', {
      error: error instanceof Error ? error.message : String(error),
      visitId: params.visitId,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
