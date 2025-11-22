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

    logger.info('GET /api/support/settings - Obteniendo configuración de soporte', {
      userId: user.id,
    });

    // Por ahora, devolveremos configuración por defecto ya que no hay tabla específica
    // En una implementación real, habría una tabla SupportSettings en la base de datos

    const defaultConfig = {
      general: {
        workingHours: { start: '09:00', end: '18:00', timezone: 'America/Santiago' },
        autoAssignEnabled: true,
        maxTicketsPerAgent: 25,
        language: 'es',
      },
      notifications: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true,
        slackEnabled: false,
        escalationAlerts: true,
        slaAlerts: true,
      },
      automation: {
        autoCloseResolved: false,
        autoCloseDays: 7,
        escalationEnabled: true,
        escalationHours: 24,
        reassignStaleTickets: true,
        staleTicketHours: 48,
      },
      sla: {
        urgent: { response: 60, resolution: 240 }, // 1h respuesta, 4h resolución
        high: { response: 120, resolution: 480 }, // 2h respuesta, 8h resolución
        medium: { response: 240, resolution: 1440 }, // 4h respuesta, 24h resolución
        low: { response: 480, resolution: 2880 }, // 8h respuesta, 48h resolución
      },
      templates: [
        {
          id: '1',
          name: 'Confirmación de recepción',
          trigger: 'ticket_created',
          subject: 'Ticket recibido - #{ticketId}',
          message:
            'Hemos recibido tu solicitud y estamos trabajando en ella. Te mantendremos informado del progreso.',
          enabled: true,
        },
        {
          id: '2',
          name: 'Actualización de progreso',
          trigger: 'ticket_updated',
          subject: 'Actualización de ticket #{ticketId}',
          message: 'Tu ticket ha sido actualizado. Estado actual: {status}',
          enabled: true,
        },
        {
          id: '3',
          name: 'Resolución completada',
          trigger: 'ticket_resolved',
          subject: 'Ticket resuelto - #{ticketId}',
          message: 'Tu ticket ha sido resuelto. Gracias por tu paciencia.',
          enabled: true,
        },
      ],
    };

    return NextResponse.json({
      success: true,
      config: defaultConfig,
    });
  } catch (error) {
    logger.error('Error en GET /api/support/settings:', error);
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
    const { config } = body;

    logger.info('POST /api/support/settings - Actualizando configuración de soporte', {
      userId: user.id,
    });

    // En una implementación real, aquí se guardaría la configuración en la base de datos
    // Por ahora, solo devolvemos una respuesta de éxito

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      config,
    });
  } catch (error) {
    logger.error('Error en POST /api/support/settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
