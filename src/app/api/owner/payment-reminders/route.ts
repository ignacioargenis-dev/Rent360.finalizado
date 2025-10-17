import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!['OWNER', 'BROKER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario, corredor o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');

    // Construir filtros
    const whereClause: any = {
      ownerId: user.id,
    };

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    if (channel && channel !== 'all') {
      whereClause.channel = channel.toUpperCase();
    }

    // Obtener recordatorios de la base de datos
    const reminders = await db.paymentReminder.findMany({
      where: whereClause,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        contract: {
          select: {
            id: true,
            monthlyRent: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: limit,
    });

    // Transformar los datos al formato esperado por el frontend
    const transformedReminders = reminders.map(reminder => ({
      id: reminder.id,
      tenantId: reminder.tenantId,
      tenantName: reminder.tenant.name,
      tenantEmail: reminder.tenant.email,
      tenantPhone: reminder.tenant.phone,
      propertyId: reminder.propertyId,
      propertyTitle: reminder.property.title,
      amount: reminder.amount,
      dueDate: reminder.dueDate.toISOString(),
      reminderType: reminder.reminderType,
      sentDate: reminder.sentAt.toISOString(),
      status: reminder.status.toLowerCase(),
      channel: reminder.channel.toLowerCase(),
      response: reminder.response?.toLowerCase(),
      customMessage: reminder.customMessage,
      deliveredAt: reminder.deliveredAt?.toISOString(),
      openedAt: reminder.openedAt?.toISOString(),
      respondedAt: reminder.respondedAt?.toISOString(),
      notes: reminder.notes,
    }));

    // Calcular estadísticas
    const totalSent = reminders.length;
    const delivered = reminders.filter(r => r.status === 'DELIVERED').length;
    const opened = reminders.filter(r => r.status === 'OPENED').length;
    const responses = reminders.filter(r => r.response && r.response !== 'PENDING').length;
    const successRate = responses > 0 ? (responses / totalSent) * 100 : 0;
    const pendingAmount = reminders
      .filter(r => r.response !== 'PAID')
      .reduce((sum, r) => sum + r.amount, 0);

    const stats = {
      totalSent,
      delivered,
      opened,
      responses,
      successRate,
      pendingAmount,
    };

    return NextResponse.json({
      success: true,
      reminders: transformedReminders,
      stats,
    });
  } catch (error) {
    logger.error('Error obteniendo recordatorios de pago:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
