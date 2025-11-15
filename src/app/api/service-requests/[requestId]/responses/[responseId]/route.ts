import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';

/**
 * API para que el usuario acepte/rechace respuestas de corredores
 */

const updateResponseSchema = z.object({
  action: z.enum(['accept', 'reject', 'view']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { requestId: string; responseId: string } }
) {
  try {
    const user = await requireAuth(request);

    const { requestId, responseId } = params;
    const body = await request.json();
    const { action } = updateResponseSchema.parse(body);

    // Verificar que la solicitud pertenece al usuario
    const serviceRequest = await db.brokerServiceRequest.findUnique({
      where: { id: requestId },
      include: {
        responses: {
          where: { id: responseId },
          include: {
            broker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (serviceRequest.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para gestionar esta solicitud' },
        { status: 403 }
      );
    }

    const response = serviceRequest.responses[0];
    if (!response) {
      return NextResponse.json(
        { success: false, error: 'Respuesta no encontrada' },
        { status: 404 }
      );
    }

    logger.info('🔄 User updating broker response', {
      userId: user.id,
      requestId,
      responseId,
      action,
    });

    // Aplicar acción
    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'view':
        updateData = {
          status: 'VIEWED',
          viewedAt: new Date(),
        };
        message = 'Respuesta marcada como vista';
        break;

      case 'accept':
        // Actualizar respuesta
        updateData = {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        };

        // Actualizar solicitud: asignar corredor y cambiar estado
        await db.brokerServiceRequest.update({
          where: { id: requestId },
          data: {
            status: 'ASSIGNED',
            assignedBrokerId: response.brokerId,
            assignedAt: new Date(),
          },
        });

        // Crear relación BrokerClient si no existe (para propietarios e inquilinos)
        if (user.role === 'OWNER' || user.role === 'TENANT') {
          const existingClient = await db.brokerClient.findUnique({
            where: {
              brokerId_userId: {
                brokerId: response.brokerId,
                userId: user.id,
              },
            },
          });

          if (!existingClient) {
            // Determinar el tipo de cliente según el rol
            const clientType = user.role === 'OWNER' ? 'OWNER' : 'TENANT';

            // Obtener la tasa de comisión propuesta de la respuesta
            const proposedRate = response.proposedRate || 5.0;

            // Crear relación BrokerClient
            await db.brokerClient.create({
              data: {
                brokerId: response.brokerId,
                userId: user.id,
                clientType: clientType,
                status: 'ACTIVE',
                relationshipType: 'standard',
                servicesOffered: response.proposedServices
                  ? JSON.stringify(response.proposedServices)
                  : JSON.stringify(['PROPERTY_SEARCH', 'CONSULTATION']),
                commissionRate: proposedRate,
                exclusiveAgreement: false,
                propertyManagementType: user.role === 'OWNER' ? 'none' : null,
                startDate: new Date(),
                lastInteraction: new Date(),
                notes: `Relación establecida desde aceptación de respuesta en marketplace. Solicitud: ${serviceRequest.title}`,
              },
            });

            logger.info('✅ BrokerClient relationship created', {
              brokerId: response.brokerId,
              userId: user.id,
              clientType: clientType,
              requestId: requestId,
            });
          } else {
            // Si ya existe, actualizar estado a ACTIVE si estaba inactivo
            if (existingClient.status !== 'ACTIVE') {
              await db.brokerClient.update({
                where: { id: existingClient.id },
                data: {
                  status: 'ACTIVE',
                  lastInteraction: new Date(),
                },
              });
            }
          }
        }

        // Notificar al corredor
        await NotificationService.notifyResponseAccepted({
          brokerId: response.brokerId,
          userName: user.name || 'Un usuario',
          userId: user.id,
          requestId,
          requestTitle: serviceRequest.title,
        }).catch(err => {
          logger.error('Error sending acceptance notification', { error: err });
        });

        message = `Has aceptado la propuesta de ${response.broker.name}`;
        break;

      case 'reject':
        updateData = {
          status: 'REJECTED',
          respondedAt: new Date(),
        };

        // Notificar al corredor
        await NotificationService.notifyResponseRejected({
          brokerId: response.brokerId,
          userName: user.name || 'Un usuario',
          userId: user.id,
          requestId,
        }).catch(err => {
          logger.error('Error sending rejection notification', { error: err });
        });

        message = 'Respuesta rechazada';
        break;
    }

    // Actualizar respuesta
    const updated = await db.brokerRequestResponse.update({
      where: { id: responseId },
      data: updateData,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info('✅ Response updated', {
      userId: user.id,
      responseId,
      action,
      newStatus: updated.status,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message,
    });
  } catch (error: any) {
    logger.error('Error updating response', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar respuesta' },
      { status: 500 }
    );
  }
}
