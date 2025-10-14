import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ticketId = params.id;

    // Verificar si el ticket existe y si el usuario tiene permisos
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && user.role !== 'support' && ticket.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este ticket' },
        { status: 403 }
      );
    }

    // Obtener comentarios
    const comments = await db.ticketComment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    logger.error('Error al obtener comentarios:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const ticketId = params.id;

    // Verificar si el ticket existe y si el usuario tiene permisos
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && user.role !== 'support' && ticket.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para comentar en este ticket' },
        { status: 403 }
      );
    }

    const data = await request.json();

    const { content } = data;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'El contenido del comentario es requerido' },
        { status: 400 }
      );
    }

    // Crear comentario
    const comment = await db.ticketComment.create({
      data: {
        content: content.trim(),
        ticketId,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Comentario agregado exitosamente',
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error al crear comentario:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
