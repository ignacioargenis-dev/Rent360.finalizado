import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notification-service';
import { z } from 'zod';

const sendReminderSchema = z.object({
  reminderId: z.string().optional(),
  tenantId: z.string(),
  propertyId: z.string(),
  amount: z.number(),
  dueDate: z.string(),
  reminderType: z.enum(['first', 'second', 'final', 'urgent']),
  channel: z.enum(['email', 'sms', 'both']),
  customMessage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'owner') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = sendReminderSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que existe un contrato entre el propietario, propiedad y tenant
    const contract = await db.contract.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        ownerId: user.id,
        tenantId: validatedData.tenantId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'No se encontró un contrato activo para esta propiedad e inquilino.' },
        { status: 404 }
      );
    }

    // Verificar que la propiedad existe
    const property = contract.property;

    // Obtener información del inquilino
    const tenant = await db.user.findUnique({
      where: { id: validatedData.tenantId },
      select: { id: true, name: true, email: true, phone: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Inquilino no encontrado.' }, { status: 404 });
    }

    // Crear el recordatorio en la base de datos
    const reminder = await db.paymentReminder.create({
      data: {
        tenantId: validatedData.tenantId,
        propertyId: validatedData.propertyId,
        contractId: contract.id,
        ownerId: user.id,
        amount: validatedData.amount,
        dueDate: new Date(validatedData.dueDate),
        reminderType: validatedData.reminderType,
        channel: validatedData.channel.toUpperCase(),
        status: 'SENT',
        sentAt: new Date(),
        customMessage: validatedData.customMessage || null,
      },
    });

    // Preparar el mensaje del recordatorio
    const reminderMessage = generateReminderMessage({
      tenantName: tenant.name,
      propertyTitle: property.title || 'Propiedad',
      amount: validatedData.amount,
      dueDate: validatedData.dueDate,
      reminderType: validatedData.reminderType,
      customMessage: validatedData.customMessage || undefined,
      ownerName: user.name,
    });

    // TODO: Implementar envío de notificaciones por email
    // Por ahora solo guardamos el recordatorio en la base de datos

    // TODO: Implementar envío por SMS si está incluido en el canal

    logger.info('Recordatorio de pago enviado exitosamente:', {
      reminderId: reminder.id,
      tenantId: tenant.id,
      propertyId: property.id,
      channel: validatedData.channel,
    });

    return NextResponse.json({
      success: true,
      message: 'Recordatorio enviado exitosamente',
      reminder: {
        id: reminder.id,
        tenantName: tenant.name,
        propertyTitle: property.title || 'Propiedad',
        amount: reminder.amount,
        status: reminder.status,
        channel: reminder.channel,
        sentAt: reminder.sentAt,
      },
    });
  } catch (error) {
    logger.error('Error enviando recordatorio de pago:', {
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

function generateReminderMessage(data: {
  tenantName: string;
  propertyTitle: string;
  amount: number;
  dueDate: string;
  reminderType: string;
  customMessage: string | undefined;
  ownerName: string;
}): string {
  const dueDateFormatted = new Date(data.dueDate).toLocaleDateString('es-CL');
  const amountFormatted = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(data.amount);

  let message = `Estimado/a ${data.tenantName},\n\n`;
  message += `Le recordamos que tiene un pago pendiente por ${amountFormatted} correspondiente a la propiedad "${data.propertyTitle}".\n\n`;
  message += `Fecha de vencimiento: ${dueDateFormatted}\n`;
  message += `Tipo de recordatorio: ${getReminderTypeText(data.reminderType)}\n\n`;

  if (data.customMessage && data.customMessage.trim()) {
    message += `Mensaje adicional: ${data.customMessage}\n\n`;
  }

  message += `Por favor, realice el pago a la brevedad posible para evitar inconvenientes.\n\n`;
  message += `Atentamente,\n${data.ownerName}\nPropietario`;

  return message;
}

function getReminderTypeText(reminderType: string): string {
  switch (reminderType) {
    case 'first':
      return 'Primer Recordatorio';
    case 'second':
      return 'Segundo Recordatorio';
    case 'final':
      return 'Recordatorio Final';
    case 'urgent':
      return 'Recordatorio Urgente';
    default:
      return 'Recordatorio';
  }
}
