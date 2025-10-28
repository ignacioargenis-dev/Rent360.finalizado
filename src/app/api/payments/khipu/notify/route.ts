import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Definir tipos locales para enums de Prisma
type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'PARTIAL' | 'OVERDUE';
type ContractStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'TERMINATED';
type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export async function POST(request: NextRequest) {
  try {
    // Khipu envía notificaciones como form data
    const formData = await request.formData();

    const notificationToken = formData.get('notification_token');
    const paymentId = formData.get('payment_id');
    const transactionId = formData.get('transaction_id');
    const amount = formData.get('amount');
    const currency = formData.get('currency');
    const status = formData.get('status');
    const custom = formData.get('custom');

    // Verificar token de notificación (debería coincidir con el configurado en Khipu)
    const NOTIFICATION_TOKEN = process.env.KHIPU_NOTIFICATION_TOKEN;

    if (!notificationToken || notificationToken !== NOTIFICATION_TOKEN) {
      logger.error('Token de notificación inválido:', {
        error:
          notificationToken instanceof Error
            ? notificationToken.message
            : String(notificationToken),
      });
      return NextResponse.json({ error: 'Token de notificación inválido' }, { status: 401 });
    }

    logger.info('Notificación de Khipu recibida:', {
      paymentId,
      transactionId,
      amount,
      currency,
      status,
      custom,
    });

    // Parsear datos personalizados
    let customData: any = {};
    try {
      if (custom && typeof custom === 'string') {
        customData = JSON.parse(custom);
      }
    } catch (error) {
      logger.error('Error al parsear datos personalizados:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Actualizar estado del pago en la base de datos
    let paymentStatus: PaymentStatus;
    switch (status) {
      case 'completed':
        paymentStatus = 'COMPLETED';
        break;
      case 'failed':
        paymentStatus = 'FAILED';
        break;
      case 'pending':
        paymentStatus = 'PENDING';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    // Buscar el pago por el transaction_id o payment_id
    const whereConditions: any[] = [];
    if (paymentId) {
      whereConditions.push({ transactionId: paymentId.toString() });
    }
    if (customData.payment_id) {
      whereConditions.push({ paymentNumber: customData.payment_id.toString() });
    }

    const payment = await db.payment.findFirst({
      where: {
        OR: whereConditions,
      },
    });

    if (payment) {
      // Construir objeto de actualización compatible con Prisma
      const updateData: any = {
        status: paymentStatus,
        paidDate: paymentStatus === 'COMPLETED' ? new Date() : null,
        notes: payment.notes
          ? `${payment.notes}\nNotificación Khipu: ${status}`
          : `Notificación Khipu: ${status}`,
      };

      // Solo agregar transactionId si existe
      if (transactionId) {
        updateData.transactionId = transactionId.toString();
      }

      // Actualizar el pago
      await db.payment.update({
        where: { id: payment.id },
        data: updateData,
      });

      logger.info('Pago actualizado a estado:', { paymentId: payment.id, status: paymentStatus });

      // Si el pago se completó, realizar acciones adicionales
      if (paymentStatus === 'COMPLETED') {
        logger.info('Pago completado, ejecutando acciones post-pago...', { paymentId: payment.id });

        // Actualizar estado del contrato si existe
        if (customData.contract_id) {
          try {
            await db.contract.update({
              where: { id: customData.contract_id },
              data: {
                status: 'ACTIVE',
              },
            });
            logger.info('Contrato actualizado:', { contractId: customData.contract_id });
          } catch (error) {
            logger.error('Error actualizando contrato:', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Crear notificación para el usuario
        if (customData.user_id) {
          try {
            await db.notification.create({
              data: {
                userId: customData.user_id,
                title: 'Pago Completado',
                message: `Tu pago de ${amount} ${currency} ha sido procesado exitosamente.`,
                type: 'SUCCESS',
                metadata: JSON.stringify({
                  payment_id: payment.id,
                  amount: amount,
                  currency: currency,
                  transaction_id: transactionId,
                }),
              },
            });
            logger.info('Notificación creada para usuario:', { userId: customData.user_id });
          } catch (error) {
            logger.error('Error creando notificación:', {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    } else {
      logger.warn('No se encontró pago para la notificación:', { paymentId, customData });
    }

    // Responder a Khipu que recibimos la notificación
    return NextResponse.json({
      success: true,
      message: 'Notificación recibida y procesada',
    });
  } catch (error) {
    logger.error('Error procesando notificación de Khipu:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Khipu también puede enviar notificaciones GET para verificación
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const notificationToken = searchParams.get('notification_token');

    if (!notificationToken || notificationToken !== process.env.KHIPU_NOTIFICATION_TOKEN) {
      return NextResponse.json({ error: 'Token de notificación inválido' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Endpoint de notificación activo',
    });
  } catch (error) {
    logger.error('Error en verificación de endpoint:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
