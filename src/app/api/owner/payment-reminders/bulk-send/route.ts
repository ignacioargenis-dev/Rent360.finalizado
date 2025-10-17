import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

const bulkSendSchema = z.object({
  paymentIds: z.array(z.string()),
  reminderType: z.enum(['first', 'second', 'final', 'urgent']),
  channel: z.enum(['email', 'sms', 'both']),
  customMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario, corredor o administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = bulkSendSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Procesar cada pago
    for (const paymentId of validatedData.paymentIds) {
      try {
        // Obtener el pago y verificar que pertenece al propietario
        const payment = await db.payment.findFirst({
          where: {
            id: paymentId,
            contract: {
              ownerId: user.id,
            },
            status: 'PENDING',
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
        });

        if (!payment) {
          results.failed++;
          results.errors.push(`Pago ${paymentId} no encontrado o no pertenece al propietario`);
          continue;
        }

        // Crear el recordatorio
        const reminder = await db.paymentReminder.create({
          data: {
            tenantId: payment.contract.tenant.id,
            propertyId: payment.contract.property.id,
            contractId: payment.contract.id,
            ownerId: user.id,
            amount: payment.amount,
            dueDate: payment.dueDate,
            reminderType: validatedData.reminderType,
            channel: validatedData.channel.toUpperCase(),
            status: 'SENT',
            sentAt: new Date(),
            customMessage: validatedData.customMessage || null,
          },
        });

        results.sent++;

        logger.info('Recordatorio masivo creado:', {
          reminderId: reminder.id,
          paymentId: payment.id,
          tenantId: payment.contract.tenant.id,
        });
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error procesando pago ${paymentId}: ${error instanceof Error ? error.message : String(error)}`
        );
        logger.error(`Error procesando pago ${paymentId} en envío masivo:`, { error });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Envío masivo completado: ${results.sent} enviados, ${results.failed} fallaron`,
      results,
    });
  } catch (error) {
    logger.error('Error en envío masivo de recordatorios:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
