import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1, 'El asunto es requerido'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z
    .enum(['technical', 'billing', 'general', 'bug_report', 'feature_request'])
    .default('general'),
  attachments: z.array(z.string()).optional(),
});

const updateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
});

// GET /api/support/tickets - Obtener tickets
export async function GET(request: NextRequest) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    if (!user) {
      logger.error('No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    // Si es usuario normal, solo ver sus tickets
    if (!['ADMIN', 'SUPPORT'].includes(user.role)) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          comments: {
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.ticket.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error obteniendo tickets de soporte:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/support/tickets - Crear ticket
export async function POST(request: NextRequest) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    if (!user) {
      logger.error('No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const data = await request.json();

    const validatedData = createTicketSchema.parse(data);

    const ticket = await db.ticket.create({
      data: {
        userId: user.id,
        title: validatedData.subject,
        description: validatedData.description,
        priority: validatedData.priority.toUpperCase(),
        category: validatedData.category,
        status: 'OPEN',
        ticketNumber: `TKT-${Date.now()}`,
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

    // Notificar a soporte sobre nuevo ticket
    try {
      // Aquí se podría integrar con el sistema de notificaciones
      logger.info('Nuevo ticket de soporte creado', {
        ticketId: ticket.id,
        userId: user.id,
        subject: ticket.title,
        priority: ticket.priority,
      });
    } catch (notificationError) {
      logger.warn('Error notificando nuevo ticket', { error: notificationError });
    }

    return NextResponse.json(
      {
        success: true,
        data: ticket,
        message: 'Ticket creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando ticket de soporte:', {
      error: error instanceof Error ? error.message : String(error),
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

// PUT /api/support/tickets - Actualizar ticket
export async function PUT(request: NextRequest) {
  try {
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    if (!user) {
      logger.error('No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    const data = await request.json();

    const { ticketId, ...requestData } = data;

    if (!ticketId) {
      return NextResponse.json({ error: 'ID de ticket requerido' }, { status: 400 });
    }

    const validatedData = updateTicketSchema.parse(requestData);

    // Verificar permisos
    const existingTicket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
    }

    // Solo el usuario que creó el ticket o soporte/admin pueden actualizarlo
    if (existingTicket.userId !== user.id && !['ADMIN', 'SUPPORT'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar este ticket' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (validatedData.status) {
      updateData.status = validatedData.status.toUpperCase();
    }
    if (validatedData.priority) {
      updateData.priority = validatedData.priority.toUpperCase();
    }
    if (validatedData.assignedTo) {
      updateData.assignedTo = validatedData.assignedTo;
    }

    const updatedTicket = await db.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        comments: {
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: 'Ticket actualizado exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando ticket de soporte:', {
      error: error instanceof Error ? error.message : String(error),
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
