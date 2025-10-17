import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  type: z.enum(['legal_case_update', 'case_resolved', 'case_archived', 'admin_alert']),
  title: z.string().min(1),
  message: z.string().min(1),
  recipientId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  caseId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).default(['in_app']),
  metadata: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = sendNotificationSchema.parse(body);

    // Crear la notificación en la base de datos
    const notification = await db.notification.create({
      data: {
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        recipientId: validatedData.recipientId,
        recipientEmail: validatedData.recipientEmail,
        priority: validatedData.priority.toUpperCase(),
        channels: validatedData.channels.join(','),
        metadata: validatedData.metadata ? JSON.stringify(validatedData.metadata) : null,
        sentBy: user.id,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    // Simular envío por diferentes canales
    const results = {
      email: false,
      sms: false,
      push: false,
      in_app: false,
    };

    for (const channel of validatedData.channels) {
      try {
        switch (channel) {
          case 'email':
            if (validatedData.recipientEmail) {
              // TODO: Integrar con servicio de email real (SendGrid, etc.)
              logger.info('Enviando notificación por email:', {
                to: validatedData.recipientEmail,
                subject: validatedData.title,
                notificationId: notification.id,
              });
              results.email = true;
            }
            break;

          case 'sms':
            if (validatedData.recipientId) {
              // TODO: Integrar con servicio de SMS real (Twilio, etc.)
              logger.info('Enviando notificación por SMS:', {
                recipientId: validatedData.recipientId,
                message: validatedData.message,
                notificationId: notification.id,
              });
              results.sms = true;
            }
            break;

          case 'push':
            if (validatedData.recipientId) {
              // TODO: Integrar con servicio de push notifications real
              logger.info('Enviando notificación push:', {
                recipientId: validatedData.recipientId,
                title: validatedData.title,
                notificationId: notification.id,
              });
              results.push = true;
            }
            break;

          case 'in_app':
            // Las notificaciones in-app se almacenan en la base de datos
            logger.info('Notificación in-app creada:', {
              recipientId: validatedData.recipientId,
              notificationId: notification.id,
            });
            results.in_app = true;
            break;
        }
      } catch (channelError) {
        logger.error(`Error enviando notificación por ${channel}:`, {
          error: channelError instanceof Error ? channelError.message : String(channelError),
          notificationId: notification.id,
          channel,
        });
      }
    }

    // Actualizar el estado de la notificación
    await db.notification.update({
      where: { id: notification.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        metadata: JSON.stringify({
          ...validatedData.metadata,
          deliveryResults: results,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      results,
      message: 'Notificación enviada exitosamente',
    });
  } catch (error) {
    logger.error('Error enviando notificación:', {
      error: error instanceof Error ? error.message : String(error),
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
