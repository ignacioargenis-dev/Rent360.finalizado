import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService, NotificationType } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Solo proveedores pueden enviar cotizaciones' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      requestId,
      price,
      estimatedTime,
      availabilityDate,
      notes,
      materials,
      laborCost,
      materialsCost,
    } = body;

    // Validación básica
    if (!requestId || !price) {
      return NextResponse.json(
        { error: 'El ID de solicitud y precio son obligatorios' },
        { status: 400 }
      );
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    // Verificar que el usuario tiene un provider válido
    const providerId = fullUser.serviceProvider?.id || fullUser.maintenanceProvider?.id;
    if (!providerId) {
      return NextResponse.json(
        { error: 'Usuario no tiene un perfil de proveedor válido' },
        { status: 403 }
      );
    }

    // Obtener la solicitud de servicio para verificar que existe y pertenece al proveedor
    const serviceRequest = await db.serviceJob.findFirst({
      where: {
        id: requestId,
        serviceProviderId: providerId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes permisos para cotizarla' },
        { status: 404 }
      );
    }

    // Actualizar la solicitud con la cotización
    const updatedRequest = await db.serviceJob.update({
      where: { id: requestId },
      data: {
        finalPrice: parseFloat(price),
        status: 'QUOTED', // Cambiar estado a cotizado
        notes: notes || serviceRequest.notes,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Enviar notificación al inquilino
    try {
      await NotificationService.create({
        userId: serviceRequest.requester.id,
        type: NotificationType.SERVICE_REQUEST_RESPONSE,
        title: `Cotización recibida: ${serviceRequest.serviceType}`,
        message: `${user.name || 'Un proveedor'} te ha enviado una cotización por $${price}`,
        link: `/tenant/service-requests/${requestId}`, // Link correcto a la solicitud del inquilino
        metadata: {
          serviceRequestId: requestId,
          providerId: user.id,
          providerName: user.name,
          price: parseFloat(price),
          estimatedTime,
          availabilityDate,
          materials,
          laborCost,
          materialsCost,
        },
      });

      logger.info('✅ Notificación enviada al inquilino por cotización:', {
        requesterId: serviceRequest.requester.id,
        requestId,
        providerId: user.id,
      });
    } catch (notificationError) {
      logger.warn('Error enviando notificación de cotización:', notificationError);
      // No fallar si la notificación falla
    }

    const quote = {
      id: `quote_${Date.now()}`,
      requestId,
      providerId: user.id,
      providerName: user.name,
      price: parseFloat(price),
      estimatedTime,
      availabilityDate,
      notes,
      materials,
      laborCost,
      materialsCost,
      status: 'Enviada',
      createdAt: new Date().toISOString(),
    };

    logger.info('Nueva cotización enviada:', {
      providerId: user.id,
      requestId,
      quoteId: quote.id,
      price: parseFloat(price),
    });

    return NextResponse.json({
      success: true,
      quote,
      message: 'Cotización enviada exitosamente al cliente',
    });
  } catch (error) {
    logger.error('Error creando cotización:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
