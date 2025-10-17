import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario, corredor o administrador.' },
        { status: 403 }
      );
    }

    const reminderId = params.id;

    // Verificar que el recordatorio existe y pertenece al usuario
    const reminder = await db.paymentReminder.findFirst({
      where: {
        id: reminderId,
        ownerId: user.id,
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Recordatorio no encontrado o no tienes permisos para cancelarlo.' },
        { status: 404 }
      );
    }

    // Verificar que el recordatorio puede ser cancelado
    if (reminder.status === 'CANCELLED') {
      return NextResponse.json({ error: 'El recordatorio ya ha sido cancelado.' }, { status: 400 });
    }

    if (reminder.status === 'DELIVERED' || reminder.status === 'OPENED') {
      return NextResponse.json(
        { error: 'No se puede cancelar un recordatorio que ya ha sido entregado o abierto.' },
        { status: 400 }
      );
    }

    // Actualizar el estado del recordatorio
    const updatedReminder = await db.paymentReminder.update({
      where: {
        id: reminderId,
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    logger.info('Recordatorio de pago cancelado exitosamente:', {
      reminderId: reminder.id,
      ownerId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Recordatorio cancelado exitosamente',
      reminder: {
        id: updatedReminder.id,
        status: updatedReminder.status,
      },
    });
  } catch (error) {
    logger.error('Error cancelando recordatorio de pago:', {
      error: error instanceof Error ? error.message : String(error),
      reminderId: params.id,
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
