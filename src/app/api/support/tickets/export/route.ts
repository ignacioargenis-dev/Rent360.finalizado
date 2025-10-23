import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const statusFilter = searchParams.get('status') || 'all';
    const priorityFilter = searchParams.get('priority') || 'all';
    const categoryFilter = searchParams.get('category') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    logger.info('GET /api/support/tickets/export - Exportando tickets de soporte', {
      userId: user.id,
      format,
      statusFilter,
      priorityFilter,
      categoryFilter,
      startDate,
      endDate,
    });

    const whereClause: any = {};

    if (statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    if (priorityFilter !== 'all') {
      whereClause.priority = priorityFilter;
    }

    if (categoryFilter !== 'all') {
      whereClause.category = categoryFilter;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const tickets = await db.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Solo el último comentario para contar
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID Ticket',
        'Número Ticket',
        'Título',
        'Descripción',
        'Estado',
        'Prioridad',
        'Categoría',
        'Usuario Creador',
        'Email Creador',
        'Rol Creador',
        'Asignado A',
        'Email Asignado',
        'Fecha Creación',
        'Última Respuesta',
        'Total Respuestas',
      ];

      const csvRows = tickets.map(ticket => [
        ticket.id,
        ticket.ticketNumber,
        ticket.title,
        `"${ticket.description?.replace(/"/g, '""') || ''}"`,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.user?.name || '',
        ticket.user?.email || '',
        ticket.user?.role || '',
        ticket.assignee?.name || '',
        ticket.assignee?.email || '',
        new Date(ticket.createdAt).toISOString().split('T')[0],
        ticket.comments[0]
          ? new Date(ticket.comments[0].createdAt).toISOString().split('T')[0]
          : '',
        ticket.comments.length,
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tickets_soporte_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = tickets.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        user: {
          id: ticket.user?.id,
          name: ticket.user?.name,
          email: ticket.user?.email,
          role: ticket.user?.role,
        },
        assignedTo: ticket.assignee
          ? {
              id: ticket.assignee.id,
              name: ticket.assignee.name,
              email: ticket.assignee.email,
            }
          : null,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        lastCommentDate: ticket.comments[0]?.createdAt || null,
        totalComments: ticket.comments.length,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="tickets_soporte_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error exporting support tickets:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
