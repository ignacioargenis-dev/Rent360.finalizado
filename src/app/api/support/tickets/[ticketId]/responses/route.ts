import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const createResponseSchema = z.object({
  content: z.string().min(1, 'El contenido de la respuesta es requerido'),
  isInternal: z.boolean().default(false), // Para notas internas del equipo de soporte
});

// GET /api/support/tickets/[ticketId]/responses - Obtener respuestas de un ticket
export async function GET(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    if (!user) {
      logger.error('No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const { ticketId } = params;

    // Verificar que el ticket existe
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (ticket.userId !== user.id && !['ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este ticket' },
        { status: 403 }
      );
    }

    const responses = await db.ticketComment.findMany({
      where: { ticketId },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Filtrar respuestas internas si el usuario no es soporte/admin
    const filteredResponses = responses.filter(response => {
      if (response.isInternal && !['ADMIN', 'SUPPORT'].includes(user.role)) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      data: filteredResponses,
    });
  } catch (error) {
    logger.error('Error obteniendo respuestas del ticket:', {
      error: error instanceof Error ? error.message : String(error),
      ticketId: params.ticketId,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/support/tickets/[ticketId]/responses - Crear respuesta
export async function POST(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    if (!user) {
      logger.error('No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const { ticketId } = params;
    const data = await request.json();

    const validatedData = createResponseSchema.parse(data);

    // Verificar que el ticket existe
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (ticket.userId !== user.id && !['ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para responder este ticket' },
        { status: 403 }
      );
    }

    // Crear la respuesta
    const response = await db.ticketComment.create({
      data: {
        ticketId,
        userId: user.id,
        content: validatedData.content,
        isInternal: validatedData.isInternal,
      },
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
    });

    // Actualizar el estado del ticket si es una respuesta del equipo de soporte
    if (['ADMIN', 'SUPPORT'].includes(user.role) && !validatedData.isInternal) {
      await db.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      });
    }

    // Notificar al usuario sobre la nueva respuesta
    try {
      logger.info('Nueva respuesta en ticket de soporte', {
        ticketId,
        responseId: response.id,
        userId: user.id,
        isInternal: validatedData.isInternal,
      });
    } catch (notificationError) {
      logger.warn('Error notificando nueva respuesta', { error: notificationError });
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Respuesta creada exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando respuesta del ticket:', {
      error: error instanceof Error ? error.message : String(error),
      ticketId: params.ticketId,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.format() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
