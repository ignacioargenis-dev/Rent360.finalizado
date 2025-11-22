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
    const type = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('GET /api/support/calls - Obteniendo llamadas de soporte', {
      userId: user.id,
      status,
      type,
      limit,
    });

    // Por ahora, como no tenemos un modelo específico para llamadas,
    // devolveremos datos basados en tickets con información simulada de llamadas
    // En una implementación real, habría una tabla Call en la base de datos

    const tickets = await db.ticket.findMany({
      where: {
        ...(status !== 'all' && status === 'active'
          ? { status: 'IN_PROGRESS' }
          : status === 'ended'
            ? { status: 'RESOLVED' }
            : status === 'missed'
              ? { status: 'OPEN' }
              : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Transformar tickets a formato de llamadas
    const calls = tickets.map(ticket => ({
      id: `call-${ticket.id}`,
      clientName: ticket.user?.name || 'Usuario desconocido',
      clientPhone: ticket.user?.phone || '',
      clientEmail: ticket.user?.email || '',
      type: Math.random() > 0.5 ? ('incoming' as const) : ('outgoing' as const),
      status:
        ticket.status === 'IN_PROGRESS'
          ? ('active' as const)
          : ticket.status === 'RESOLVED'
            ? ('ended' as const)
            : ticket.status === 'OPEN'
              ? ('missed' as const)
              : ('ended' as const),
      duration:
        ticket.status === 'RESOLVED'
          ? Math.floor(Math.random() * 1800) + 60 // 1-30 minutos para llamadas completadas
          : ticket.status === 'IN_PROGRESS'
            ? Math.floor(Math.random() * 600) + 10
            : undefined, // 10-600 segundos para llamadas activas
      startTime: ticket.createdAt.toISOString(),
      endTime: ticket.resolvedAt?.toISOString(),
      notes: `Ticket relacionado: ${ticket.title}`,
      ticketId: ticket.id,
      priority: ticket.priority?.toLowerCase() || 'medium',
      category: ticket.category || 'general',
      agent: ticket.assignee?.name || 'Sin asignar',
      callId: `call-${ticket.id}`,
      recordingUrl: ticket.status === 'RESOLVED' ? `/recordings/call-${ticket.id}.mp3` : undefined,
    }));

    // Calcular estadísticas
    const stats = {
      totalCalls: calls.length,
      activeCalls: calls.filter(c => c.status === 'active').length,
      missedCalls: calls.filter(c => c.status === 'missed').length,
      answeredCalls: calls.filter(c => c.status === 'ended').length,
      totalDuration: calls.filter(c => c.duration).reduce((sum, c) => sum + (c.duration || 0), 0),
      averageDuration:
        calls.filter(c => c.duration && c.duration > 0).length > 0
          ? Math.round(
              calls
                .filter(c => c.duration && c.duration > 0)
                .reduce((sum, c) => sum + (c.duration || 0), 0) /
                calls.filter(c => c.duration && c.duration > 0).length
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      calls,
      stats,
      pagination: {
        page: 1,
        limit,
        total: calls.length,
        hasNext: false,
        hasPrev: false,
      },
    });
  } catch (error) {
    logger.error('Error en GET /api/support/calls:', error);
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
    const { clientPhone, type, notes } = body;

    logger.info('POST /api/support/calls - Iniciando nueva llamada', {
      userId: user.id,
      clientPhone,
      type,
    });

    // En una implementación real, aquí se iniciaría la llamada a través de un sistema VoIP
    // Por ahora, solo devolvemos una respuesta de éxito

    return NextResponse.json({
      success: true,
      message: 'Llamada iniciada correctamente',
      callId: `call-${Date.now()}`,
    });
  } catch (error) {
    logger.error('Error en POST /api/support/calls:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
