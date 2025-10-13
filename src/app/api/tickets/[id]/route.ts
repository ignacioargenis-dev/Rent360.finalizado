import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, requireAnyRole } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const ticketId = params.id;
    
    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        // property: {
        //   select: {
        //     id: true,
        //     title: true,
        //     address: true,
        //   },
        // },
        comments: {
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
        },
      },
    });
    
    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 },
      );
    }
    
    // Verificar permisos
    if (user.role !== 'admin' && 
        user.role !== 'support' && 
        ticket.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este ticket' },
        { status: 403 },
      );
    }
    
    return NextResponse.json({ ticket });
  } catch (error) {
    logger.error('Error al obtener ticket:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'No autorizado') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAnyRole(request, ['admin', 'support']);
    const ticketId = params.id;
    
    // Verificar si el ticket existe
    const existingTicket = await db.ticket.findUnique({
      where: { id: ticketId },
    });
    
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 },
      );
    }
    
    const data = await request.json();
    
    const {
      status,
      priority,
      assignedToId,
      category,
    } = data;
    
    // Actualizar ticket
    const ticket = await db.ticket.update({
      where: { id: ticketId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedToId && { assignedToId }),
        ...(category && { category }),
        ...(status === 'resolved' && { resolvedAt: new Date() }),
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
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        // property: {
        //   select: {
        //     id: true,
        //     title: true,
        //     address: true,
        //   },
        // },
      },
    });
    
    return NextResponse.json({
      message: 'Ticket actualizado exitosamente',
      ticket,
    });
  } catch (error) {
    logger.error('Error al actualizar ticket:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await requireAuth(request);
    const ticketId = params.id;
    
    // Verificar si el ticket existe y si el usuario tiene permisos
    const existingTicket = await db.ticket.findUnique({
      where: { id: ticketId },
    });
    
    if (!existingTicket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 },
      );
    }
    
    // Solo admin, support o el creador pueden eliminar tickets
    if (user.role !== 'admin' && 
        user.role !== 'support' && 
        existingTicket.userId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este ticket' },
        { status: 403 },
      );
    }
    
    // Eliminar ticket
    await db.ticket.delete({
      where: { id: ticketId },
    });
    
    return NextResponse.json({
      message: 'Ticket eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar ticket:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message.includes('No autorizado')) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}