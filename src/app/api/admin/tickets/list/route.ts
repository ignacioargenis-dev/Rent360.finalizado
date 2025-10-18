import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const category = searchParams.get('category') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }
    if (category !== 'all') {
      whereClause.category = category;
    }
    if (priority !== 'all') {
      whereClause.priority = priority.toUpperCase();
    }

    // Obtener tickets desde la base de datos
    const tickets = await db.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            isInternal: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado por el frontend
    const transformedTickets = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      clientName: ticket.user?.name || 'Usuario no encontrado',
      clientEmail: ticket.user?.email || '',
      clientPhone: ticket.user?.phone || '',
      category: ticket.category,
      priority: ticket.priority.toLowerCase(),
      status: ticket.status.toLowerCase(),
      assignedTo: ticket.assignee?.name || 'Sin asignar',
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      ticketNumber: ticket.ticketNumber,
      recentComments: ticket.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        isInternal: comment.isInternal,
        createdAt: comment.createdAt.toISOString(),
        author: comment.user?.name || 'Usuario desconocido',
      })),
    }));

    logger.info('Tickets de soporte obtenidos', {
      count: transformedTickets.length,
      status,
      category,
      priority,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transformedTickets,
      pagination: {
        limit,
        offset,
        total: tickets.length,
        hasMore: tickets.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo tickets de soporte:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: [],
      },
      { status: 500 }
    );
  }
}
