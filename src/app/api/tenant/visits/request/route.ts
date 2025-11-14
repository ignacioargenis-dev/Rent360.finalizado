import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';

/**
 * POST /api/tenant/visits/request
 * Permite a un inquilino solicitar una visita de Runner360 para una propiedad
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo inquilinos pueden solicitar visitas
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo los inquilinos pueden solicitar visitas de Runner360' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, preferredDate, preferredTime, notes } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId es requerido' }, { status: 400 });
    }

    // Verificar que la propiedad existe y está disponible
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    if (property.status !== 'AVAILABLE') {
      return NextResponse.json(
        { error: 'Esta propiedad no está disponible para visitas' },
        { status: 400 }
      );
    }

    // Verificar si ya existe una solicitud de visita pendiente para este inquilino y propiedad
    const existingRequest = await db.visit.findFirst({
      where: {
        propertyId,
        tenantId: user.id,
        status: { in: ['PENDING', 'SCHEDULED'] },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          error: 'Ya tienes una solicitud de visita pendiente para esta propiedad',
          visitId: existingRequest.id,
        },
        { status: 400 }
      );
    }

    // Crear la solicitud de visita (sin runner asignado aún)
    // Nota: El modelo Visit requiere runnerId, así que usamos el ID del propietario como valor temporal
    // que será actualizado cuando se asigne un runner real desde /owner/visits
    const temporaryRunnerId = property.brokerId || property.ownerId;

    if (!temporaryRunnerId) {
      return NextResponse.json(
        { error: 'No se puede crear la solicitud: propiedad sin propietario o corredor asignado' },
        { status: 400 }
      );
    }

    const visitRequest = await db.visit.create({
      data: {
        propertyId,
        runnerId: temporaryRunnerId, // Valor temporal (propietario/corredor), será actualizado cuando se asigne un runner real
        tenantId: user.id,
        scheduledAt: preferredDate
          ? new Date(preferredDate)
          : new Date(Date.now() + 24 * 60 * 60 * 1000), // Por defecto mañana
        duration: 60, // Duración por defecto de 60 minutos
        status: 'PENDING', // Pendiente de asignación de runner
        notes: notes || `Solicitud de visita de Runner360 para la propiedad "${property.title}"`,
      },
      include: {
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
            phone: true,
          },
        },
      },
    });

    // Notificar al propietario o corredor sobre la solicitud de visita
    const recipientId = property.brokerId || property.ownerId;
    const recipientName = property.broker?.name || property.owner?.name || 'Propietario';

    if (recipientId) {
      try {
        await NotificationService.create({
          userId: recipientId,
          type: 'SERVICE_REQUEST_RECEIVED',
          title: 'Nueva solicitud de visita Runner360',
          message: `${user.name} ha solicitado una visita de Runner360 para la propiedad "${property.title}". Puedes revisar los documentos del inquilino y asignar un runner.`,
          link: `/owner/visits?propertyId=${propertyId}&tenantId=${user.id}`,
        });
      } catch (notificationError) {
        logger.warn('Error enviando notificación de solicitud de visita:', {
          error:
            notificationError instanceof Error
              ? notificationError.message
              : String(notificationError),
        });
      }
    }

    logger.info('Solicitud de visita Runner360 creada', {
      visitId: visitRequest.id,
      propertyId,
      tenantId: user.id,
      recipientId,
    });

    return NextResponse.json({
      success: true,
      visit: {
        id: visitRequest.id,
        property: visitRequest.property,
        scheduledAt: visitRequest.scheduledAt.toISOString(),
        status: visitRequest.status,
        notes: visitRequest.notes,
      },
      message:
        'Solicitud de visita enviada exitosamente. El propietario o corredor será notificado y asignará un Runner360.',
    });
  } catch (error) {
    logger.error('Error creando solicitud de visita:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de visita' },
      { status: 500 }
    );
  }
}
