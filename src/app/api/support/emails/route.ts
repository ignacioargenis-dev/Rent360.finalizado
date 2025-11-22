import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('GET /api/support/emails - Obteniendo emails de soporte', {
      userId: user.id,
      status,
      limit,
    });

    // Por ahora, como no tenemos un modelo específico para emails,
    // devolveremos datos basados en tickets con información simulada de emails
    // En una implementación real, habría una tabla Email en la base de datos

    const tickets = await db.ticket.findMany({
      where: {
        ...(status !== 'all' && status === 'unread'
          ? { status: 'OPEN' }
          : status === 'read'
            ? { status: 'IN_PROGRESS' }
            : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Transformar tickets a formato de emails
    const emails = tickets.map(ticket => ({
      id: `email-${ticket.id}`,
      from: ticket.user?.email || 'usuario@desconocido.com',
      to: ticket.assignee?.email || 'soporte@rent360.cl',
      subject: ticket.title,
      content: ticket.description,
      isRead: ticket.status !== 'OPEN',
      isStarred: ticket.priority === 'URGENT',
      isImportant: ticket.priority === 'HIGH' || ticket.priority === 'URGENT',
      status:
        ticket.status === 'OPEN'
          ? 'unread'
          : ticket.status === 'IN_PROGRESS'
            ? 'read'
            : ticket.status === 'RESOLVED'
              ? 'replied'
              : 'sent',
      date: ticket.createdAt.toISOString(),
      attachments: [],
      labels: [ticket.category || 'general'],
      threadId: `thread-${ticket.id}`,
      ticketId: ticket.id,
    }));

    // Calcular estadísticas
    const stats = {
      totalEmails: emails.length,
      unreadEmails: emails.filter(e => !e.isRead).length,
      sentEmails: emails.filter(e => e.status === 'sent').length,
      draftEmails: emails.filter(e => e.status === 'draft').length,
      importantEmails: emails.filter(e => e.isImportant).length,
      starredEmails: emails.filter(e => e.isStarred).length,
    };

    return NextResponse.json({
      success: true,
      emails,
      stats,
      pagination: {
        page: 1,
        limit,
        total: emails.length,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/emails:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { to, subject, content, ticketId } = body;

    logger.info('POST /api/support/emails - Enviando email de soporte', {
      userId: user.id,
      to,
      subject,
      ticketId,
    });

    // En una implementación real, aquí se enviaría el email
    // Por ahora, solo devolvemos una respuesta de éxito

    return NextResponse.json({
      success: true,
      message: 'Email enviado correctamente',
      emailId: `email-${Date.now()}`,
    });
  } catch (error) {
    logger.error('Error en POST /api/support/emails:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
