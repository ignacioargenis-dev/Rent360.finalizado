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
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const dateFilter = searchParams.get('dateFilter') || 'all';

    // Construir filtros
    const whereClause: any = {
      runnerId: user.id,
    };

    if (status !== 'all') {
      // Manejar múltiples estados pendientes
      const statusUpper = status.toUpperCase();
      if (statusUpper === 'PENDING') {
        // Incluir tanto PENDING como SCHEDULED (estado por defecto)
        whereClause.status = { in: ['PENDING', 'SCHEDULED'] };
      } else {
        whereClause.status = statusUpper;
      }
    }

    // Filtro por fecha
    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);
        whereClause.scheduledAt = {
          gte: todayStart,
          lte: todayEnd,
        };
      } else if (dateFilter === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        whereClause.scheduledAt = {
          gte: weekStart,
        };
      } else if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        whereClause.scheduledAt = {
          gte: monthStart,
        };
      }
    }

    // Obtener visitas del runner
    const [visits, totalCount] = await Promise.all([
      db.visit.findMany({
        where: whereClause,
        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          runnerRatings: {
            select: {
              overallRating: true,
              comment: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          scheduledAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      db.visit.count({ where: whereClause }),
    ]);

    // Función helper para formatear fechas
    const formatSafeDateTime = (scheduledAt: Date | null) => {
      if (!scheduledAt) {
        return { scheduledDate: '', scheduledTime: '' };
      }
      try {
        const dateObj = new Date(scheduledAt);
        if (isNaN(dateObj.getTime())) {
          return { scheduledDate: '', scheduledTime: '' };
        }
        const isoString = dateObj.toISOString();
        const [datePart] = isoString.split('T');
        const timeString = dateObj.toTimeString();
        const [timePart] = timeString.split(' ');
        return {
          scheduledDate: datePart || '',
          scheduledTime: timePart ? timePart.substring(0, 5) : '',
        };
      } catch {
        return { scheduledDate: '', scheduledTime: '' };
      }
    };

    // Transformar visitas
    const transformedVisits = visits.map(visit => {
      const { scheduledDate, scheduledTime } = formatSafeDateTime(visit.scheduledAt);
      const rating = visit.runnerRatings[0]?.overallRating || visit.rating;
      const feedback = visit.runnerRatings[0]?.comment || visit.clientFeedback;

      return {
        id: visit.id,
        propertyId: visit.propertyId,
        propertyTitle: visit.property.title,
        address: `${visit.property.address}, ${visit.property.commune}, ${visit.property.city}`,
        clientName: visit.tenant?.name || visit.property.owner?.name || 'No asignado',
        clientPhone: visit.tenant?.phone || visit.property.owner?.phone || 'No disponible',
        clientEmail: visit.tenant?.email || visit.property.owner?.email || 'No disponible',
        scheduledDate,
        scheduledTime,
        status: visit.status,
        priority:
          visit.status === 'SCHEDULED' && new Date(visit.scheduledAt) < new Date()
            ? 'HIGH'
            : 'MEDIUM',
        estimatedDuration: visit.duration,
        actualDuration: visit.status === 'COMPLETED' ? visit.duration : undefined,
        earnings: visit.earnings || 0,
        notes: visit.notes || '',
        photosRequired: true, // Por defecto siempre se pueden tomar fotos
        photosUploaded: visit.photosTaken || 0,
        clientRating: rating || undefined,
        clientFeedback: feedback || undefined,
        createdAt: visit.createdAt.toISOString(),
        updatedAt: visit.updatedAt.toISOString(),
        ownerId: visit.property.owner?.id,
        tenantId: visit.tenant?.id,
      };
    });

    // Calcular estadísticas - usar comparaciones robustas
    const allVisits = await db.visit.findMany({
      where: { runnerId: user.id },
      select: {
        status: true,
        earnings: true,
        scheduledAt: true,
        runnerRatings: {
          select: {
            overallRating: true,
          },
          take: 1,
        },
      },
    });

    // Usar comparaciones robustas para el estado
    const completedVisits = allVisits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'COMPLETED';
    });
    const pendingVisits = allVisits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'SCHEDULED' || status === 'PENDING';
    });
    const inProgressVisits = allVisits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'IN_PROGRESS';
    });
    const cancelledVisits = allVisits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'CANCELLED' || status === 'NO_SHOW';
    });

    const totalEarnings = completedVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);

    // Calcular rating promedio solo de visitas completadas con rating
    const ratingsWithValue = completedVisits
      .map(v => v.runnerRatings[0]?.overallRating)
      .filter((r): r is number => r !== null && r !== undefined && r > 0);
    const averageRating =
      ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, r) => sum + r, 0) / ratingsWithValue.length
        : 0;

    const completionRate =
      allVisits.length > 0 ? (completedVisits.length / allVisits.length) * 100 : 0;

    logger.info('Visitas de runner obtenidas', {
      runnerId: user.id,
      count: transformedVisits.length,
      total: totalCount,
      status,
      stats: {
        totalVisits: allVisits.length,
        completedVisits: completedVisits.length,
        pendingVisits: pendingVisits.length,
        inProgressVisits: inProgressVisits.length,
        cancelledVisits: cancelledVisits.length,
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
      },
    });

    return NextResponse.json({
      success: true,
      visits: transformedVisits,
      stats: {
        totalVisits: allVisits.length,
        completedVisits: completedVisits.length,
        pendingVisits: pendingVisits.length,
        inProgressVisits: inProgressVisits.length,
        cancelledVisits: cancelledVisits.length,
        totalEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        averageResponseTime: 0, // TODO: Calcular desde mensajes
      },
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo visitas de runner:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, tenantId, scheduledAt, duration, priority, notes, earnings } = body;

    // Validar campos requeridos
    if (!propertyId || !scheduledAt || !duration) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: propertyId, scheduledAt, duration' },
        { status: 400 }
      );
    }

    // Verificar que la propiedad existe
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Crear la visita
    const visit = await db.visit.create({
      data: {
        propertyId,
        runnerId: user.id,
        tenantId: tenantId || null,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(String(duration)),
        status: 'SCHEDULED',
        notes: notes || null,
        earnings: earnings ? parseFloat(String(earnings)) : 0,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });

    logger.info('Visita creada por runner', {
      runnerId: user.id,
      visitId: visit.id,
      propertyId,
    });

    return NextResponse.json({
      success: true,
      visit: {
        id: visit.id,
        property: visit.property,
        scheduledAt: visit.scheduledAt.toISOString(),
        duration: visit.duration,
        status: visit.status,
        earnings: visit.earnings,
      },
    });
  } catch (error) {
    logger.error('Error creando visita:', {
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
