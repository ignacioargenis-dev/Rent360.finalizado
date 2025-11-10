import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService, NotificationType } from '@/lib/notification-service';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT' && user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Solo inquilinos y propietarios pueden rechazar cotizaciones.' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Verificar que la solicitud existe y pertenece al usuario
    const serviceRequest = await db.serviceJob.findFirst({
      where: {
        id: requestId,
        requesterId: user.id,
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
          },
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes acceso a ella.' },
        { status: 404 }
      );
    }

    if (serviceRequest.status !== 'QUOTED') {
      return NextResponse.json(
        { error: 'Solo puedes rechazar solicitudes que estén en estado cotizado.' },
        { status: 400 }
      );
    }

    // Actualizar el estado de la solicitud a CANCELLED
    const updatedRequest = await db.serviceJob.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log('🚨🚨🚨 [QUOTE REJECT] Cotización rechazada:', {
      requestId,
      tenantId: user.id,
      tenantEmail: user.email,
      providerId: serviceRequest.serviceProvider.user.id,
      providerName: serviceRequest.serviceProvider.businessName,
      finalPrice: serviceRequest.finalPrice,
    });

    // Enviar notificación al proveedor
    try {
      await NotificationService.create({
        userId: serviceRequest.serviceProvider.user.id,
        type: NotificationType.QUOTE_REJECTED,
        title: `Cotización rechazada: ${serviceRequest.serviceType}`,
        message: `${user.name || 'Un inquilino'} ha rechazado tu cotización de $${serviceRequest.finalPrice} para el servicio de ${serviceRequest.serviceType}`,
        link: `/provider/requests/${requestId}`,
        metadata: {
          serviceRequestId: requestId,
          tenantId: user.id,
          tenantName: user.name,
          tenantEmail: user.email,
          providerId: serviceRequest.serviceProvider.user.id,
          providerName: serviceRequest.serviceProvider.businessName,
          finalPrice: serviceRequest.finalPrice,
          serviceType: serviceRequest.serviceType,
        },
      });

      console.log('✅✅✅ [QUOTE REJECT] Notificación enviada al proveedor:', {
        providerId: serviceRequest.serviceProvider.user.id,
        requestId,
        finalPrice: serviceRequest.finalPrice,
      });
    } catch (notificationError) {
      console.error(
        '❌❌❌ [QUOTE REJECT] Error enviando notificación al proveedor:',
        notificationError
      );
      logger.warn('Error enviando notificación de rechazo de cotización:', notificationError);
      // No fallar si la notificación falla
    }

    logger.info('Cotización rechazada exitosamente', {
      requestId,
      tenantId: user.id,
      providerId: serviceRequest.serviceProvider.user.id,
      finalPrice: serviceRequest.finalPrice,
    });

    return NextResponse.json({
      success: true,
      message: 'Cotización rechazada exitosamente. El proveedor ha sido notificado.',
      request: {
        id: updatedRequest.id,
        status: updatedRequest.status,
      },
    });
  } catch (error) {
    console.error('❌ [QUOTE REJECT] Error rechazando cotización:', error);
    logger.error('Error rechazando cotización:', {
      error: error instanceof Error ? error.message : String(error),
      requestId: params.id,
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
