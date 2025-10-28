import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * API para responder a solicitudes de servicio
 */

const responseSchema = z.object({
  message: z
    .string()
    .min(50, 'Mensaje muy corto (mínimo 50 caracteres)')
    .max(2000, 'Mensaje muy largo'),
  proposedServices: z.array(z.string()).optional(),
  proposedRate: z.number().min(0).max(100).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden responder solicitudes' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;
    const { requestId } = params;
    const body = await request.json();
    const data = responseSchema.parse(body);

    logger.info('💬 Broker responding to service request', {
      brokerId,
      requestId,
    });

    // Verificar que la solicitud existe y está abierta
    const serviceRequest = await db.brokerServiceRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
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
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (serviceRequest.status !== 'OPEN') {
      return NextResponse.json(
        { success: false, error: 'Esta solicitud ya no está abierta' },
        { status: 400 }
      );
    }

    if (serviceRequest.expiresAt && serviceRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Esta solicitud ha expirado' },
        { status: 400 }
      );
    }

    // El corredor no puede responder a su propia solicitud
    if (serviceRequest.userId === brokerId) {
      return NextResponse.json(
        { success: false, error: 'No puedes responder tu propia solicitud' },
        { status: 400 }
      );
    }

    // Verificar si ya respondió
    const existingResponse = await db.brokerRequestResponse.findUnique({
      where: {
        requestId_brokerId: {
          requestId,
          brokerId,
        },
      },
    });

    if (existingResponse) {
      return NextResponse.json(
        { success: false, error: 'Ya has respondido a esta solicitud' },
        { status: 400 }
      );
    }

    // Crear respuesta en transacción
    const result = await db.$transaction(async tx => {
      // Crear respuesta
      const response = await tx.brokerRequestResponse.create({
        data: {
          requestId,
          brokerId,
          message: data.message,
          proposedServices: data.proposedServices ? JSON.stringify(data.proposedServices) : null,
          proposedRate: data.proposedRate,
          status: 'SENT',
        },
      });

      // Incrementar contador de respuestas
      await tx.brokerServiceRequest.update({
        where: { id: requestId },
        data: {
          responseCount: {
            increment: 1,
          },
        },
      });

      return response;
    });

    // TODO: Enviar notificación al usuario
    // await sendResponseNotification(serviceRequest, result);

    logger.info('✅ Response created', {
      brokerId,
      requestId,
      responseId: result.id,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Tu propuesta ha sido enviada a ${serviceRequest.user.name}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    logger.error('Error creating response', {
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
      { success: false, error: 'Error al crear respuesta' },
      { status: 500 }
    );
  }
}

/**
 * GET - Ver mi respuesta a esta solicitud
 */
export async function GET(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder' },
        { status: 403 }
      );
    }

    const brokerId = session.user.id;
    const { requestId } = params;

    const response = await db.brokerRequestResponse.findUnique({
      where: {
        requestId_brokerId: {
          requestId,
          brokerId,
        },
      },
      include: {
        request: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!response) {
      return NextResponse.json(
        { success: false, error: 'No has respondido a esta solicitud' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    logger.error('Error fetching response', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener respuesta' },
      { status: 500 }
    );
  }
}
