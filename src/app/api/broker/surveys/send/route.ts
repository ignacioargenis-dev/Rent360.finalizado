import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';
import { z } from 'zod';

const sendSurveySchema = z.object({
  surveyType: z.enum(['client_satisfaction', 'service_quality', 'property_feedback']),
  targetAudience: z.enum(['active_clients', 'recent_clients', 'all_clients']),
  brokerId: z.string().optional(),
});

/**
 * POST /api/broker/surveys/send
 * Send satisfaction surveys to clients
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de corredor.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = sendSurveySchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    logger.info('Sending surveys to clients', {
      brokerId: user.id,
      surveyType: validatedData.surveyType,
      targetAudience: validatedData.targetAudience,
    });

    // Get clients based on target audience
    let clients = [];

    switch (validatedData.targetAudience) {
      case 'active_clients':
        // Get clients with active contracts
        clients = await db.user.findMany({
          where: {
            role: 'TENANT',
            contractsAsTenant: {
              some: {
                brokerId: user.id,
                status: { in: ['ACTIVE', 'PENDING'] },
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'recent_clients':
        // Get clients with contracts in the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        clients = await db.user.findMany({
          where: {
            role: 'TENANT',
            contractsAsTenant: {
              some: {
                brokerId: user.id,
                createdAt: { gte: thirtyDaysAgo },
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;

      case 'all_clients':
        // Get all clients associated with this broker
        clients = await db.user.findMany({
          where: {
            role: 'TENANT',
            contractsAsTenant: {
              some: {
                brokerId: user.id,
              },
            },
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });
        break;
    }

    if (clients.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se encontraron clientes para enviar encuestas',
        sentCount: 0,
      });
    }

    // Send surveys to clients
    let sentCount = 0;
    const errors = [];

    for (const client of clients) {
      try {
        // Create survey message
        const subject = getSurveySubject(validatedData.surveyType);
        const content = getSurveyContent(validatedData.surveyType, client.name);

        const surveyMessage = await db.message.create({
          data: {
            senderId: user.id,
            receiverId: client.id,
            subject: subject,
            content: content,
            type: 'survey',
            status: 'SENT',
            isRead: false,
          },
        });

        // Send notification
        await NotificationService.create({
          userId: client.id,
          type: NotificationType.NEW_MESSAGE,
          title: 'Nueva Encuesta Recibida',
          message: `Has recibido una nueva encuesta: ${subject}`,
          link: `/messages/${surveyMessage.id}`,
          metadata: {
            messageId: surveyMessage.id,
            senderId: user.id,
            senderName: user.name,
            type: 'survey',
          },
        });

        sentCount++;
      } catch (error) {
        logger.error('Error sending survey to client', {
          clientId: client.id,
          error: error instanceof Error ? error.message : String(error),
        });
        errors.push(client.id);
      }
    }

    logger.info('Surveys sent successfully', {
      brokerId: user.id,
      totalClients: clients.length,
      sentCount,
      errorsCount: errors.length,
    });

    return NextResponse.json({
      success: true,
      message: `Encuestas enviadas correctamente a ${sentCount} clientes`,
      sentCount,
      totalClients: clients.length,
      errorsCount: errors.length,
    });
  } catch (error) {
    logger.error('Error sending surveys:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

function getSurveySubject(surveyType: string): string {
  switch (surveyType) {
    case 'client_satisfaction':
      return 'Encuesta de Satisfacción del Servicio';
    case 'service_quality':
      return 'Encuesta de Calidad del Servicio';
    case 'property_feedback':
      return 'Encuesta de Retroalimentación de Propiedad';
    default:
      return 'Encuesta de Satisfacción';
  }
}

function getSurveyContent(surveyType: string, clientName: string): string {
  const baseContent = `Hola ${clientName},

Esperamos que hayas tenido una buena experiencia con nuestros servicios. Nos gustaría conocer tu opinión para poder mejorar continuamente.

Por favor, tómate un momento para responder esta breve encuesta:

`;

  switch (surveyType) {
    case 'client_satisfaction':
      return (
        baseContent +
        `1. ¿Qué tan satisfecho estás con el servicio recibido? (1-5)
2. ¿Recomendarías nuestros servicios a otros? (Sí/No)
3. ¿Qué aspectos podríamos mejorar?
4. Comentarios adicionales:

¡Gracias por tu tiempo y feedback! Tu opinión es muy importante para nosotros.

Atentamente,
Equipo Rent360`
      );

    case 'service_quality':
      return (
        baseContent +
        `1. ¿Cómo calificarías la calidad del servicio? (1-5)
2. ¿El tiempo de respuesta fue adecuado? (Sí/No)
3. ¿La comunicación fue clara y efectiva? (Sí/No)
4. ¿Qué podríamos hacer para mejorar?

¡Gracias por tu valiosa retroalimentación!

Atentamente,
Equipo Rent360`
      );

    case 'property_feedback':
      return (
        baseContent +
        `1. ¿Cómo calificarías la propiedad visitada? (1-5)
2. ¿La información proporcionada era precisa? (Sí/No)
3. ¿El proceso de visita fue satisfactorio? (Sí/No)
4. Comentarios sobre la propiedad:

¡Gracias por tu evaluación!

Atentamente,
Equipo Rent360`
      );

    default:
      return (
        baseContent +
        `Tu opinión es importante para nosotros.

¡Gracias por tu tiempo!

Atentamente,
Equipo Rent360`
      );
  }
}
