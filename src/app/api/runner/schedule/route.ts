import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart'); // Fecha de inicio de semana (opcional)

    // Calcular inicio y fin de semana
    const now = new Date();
    const startOfWeek = weekStart ? new Date(weekStart) : new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    // Ajustar al lunes de la semana
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajustar al lunes
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Obtener visitas de hoy
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // Obtener todas las visitas del runner
    const [todayVisits, weekVisits, allVisits] = await Promise.all([
      // Visitas de hoy
      db.visit.findMany({
        where: {
          runnerId: user.id,
          scheduledAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              commune: true,
              city: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          scheduledAt: 'asc',
        },
      }),
      // Visitas de la semana
      db.visit.findMany({
        where: {
          runnerId: user.id,
          scheduledAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          duration: true,
        },
      }),
      // Todas las visitas para estadísticas
      db.visit.findMany({
        where: {
          runnerId: user.id,
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
        },
      }),
    ]);

    // Calcular estadísticas
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthVisits = allVisits.filter(v => new Date(v.scheduledAt) >= monthStart).length;
    const pendingVisits = allVisits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').length;
    const completedToday = todayVisits.filter(v => v.status === 'COMPLETED').length;

    // Transformar visitas de hoy
    const todaySchedule = todayVisits.map(visit => {
      const scheduledDate = new Date(visit.scheduledAt);
      const time = scheduledDate.toTimeString().substring(0, 5);
      const durationHours = Math.floor(visit.duration / 60);
      const durationMinutes = visit.duration % 60;
      const durationStr = durationHours > 0 
        ? `${durationHours}${durationMinutes > 0 ? `.${Math.round(durationMinutes / 60 * 10)}` : ''} horas`
        : `${durationMinutes} minutos`;

      return {
        id: visit.id,
        time,
        duration: durationStr,
        type: 'Visita de propiedad',
        property: visit.property.title,
        address: `${visit.property.address}, ${visit.property.commune || ''}`,
        client: visit.tenant?.name || 'Sin cliente asignado',
        status: visit.status.toLowerCase().replace('_', ' '),
        notes: visit.notes || '',
        visitId: visit.id,
        propertyId: visit.propertyId,
        tenantId: visit.tenantId,
      };
    });

    // Agrupar visitas por día de la semana
    const weekSchedule = [
      { day: 'Lunes', visits: 0, completed: 0 },
      { day: 'Martes', visits: 0, completed: 0 },
      { day: 'Miércoles', visits: 0, completed: 0 },
      { day: 'Jueves', visits: 0, completed: 0 },
      { day: 'Viernes', visits: 0, completed: 0 },
      { day: 'Sábado', visits: 0, completed: 0 },
      { day: 'Domingo', visits: 0, completed: 0 },
    ];

    weekVisits.forEach(visit => {
      const visitDate = new Date(visit.scheduledAt);
      const dayIndex = visitDate.getDay();
      // Ajustar: 0 = domingo, 1 = lunes, ..., 6 = sábado
      const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      
      if (adjustedIndex >= 0 && adjustedIndex < 7) {
        const daySchedule = weekSchedule[adjustedIndex];
        if (daySchedule) {
          daySchedule.visits++;
          if (visit.status === 'COMPLETED') {
            daySchedule.completed++;
          }
        }
      }
    });

    logger.info('Horario de runner obtenido', {
      runnerId: user.id,
      todayVisits: todayVisits.length,
      weekVisits: weekVisits.length,
    });

    return NextResponse.json({
      success: true,
      overview: {
        todayVisits: todayVisits.length,
        weekVisits: weekVisits.length,
        monthVisits,
        pendingVisits,
        completedToday,
      },
      todaySchedule,
      weekSchedule,
    });
  } catch (error) {
    logger.error('Error obteniendo horario de runner:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

