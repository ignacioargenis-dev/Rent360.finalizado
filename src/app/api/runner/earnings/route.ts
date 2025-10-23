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
    const period = searchParams.get('period') || 'month'; // month, week, year
    const limit = parseInt(searchParams.get('limit') || '50');

    logger.info('GET /api/runner/earnings - Obteniendo ganancias del corredor', {
      runnerId: user.id,
      period,
      limit,
    });

    // Calcular fechas según el período
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    // Obtener visitas completadas del corredor en el período
    const completedVisits = await db.visit.findMany({
      where: {
        runnerId: user.id,
        status: 'COMPLETED',
        scheduledAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
        runnerRatings: {
          select: {
            overallRating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Solo la calificación más reciente
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
      take: limit,
    });

    // Calcular estadísticas
    const totalEarnings = completedVisits.reduce((sum, visit) => sum + (visit.earnings || 0), 0);
    const totalVisits = completedVisits.length;
    const averageRating =
      totalVisits > 0
        ? completedVisits.reduce((sum, visit) => {
            const rating = visit.runnerRatings[0]?.overallRating || 0;
            return sum + rating;
          }, 0) / totalVisits
        : 0;

    // Transformar visitas a formato de earnings
    const earnings = completedVisits.map(visit => ({
      id: `earning_${visit.id}`,
      visitId: visit.id,
      propertyTitle: visit.property.title,
      propertyAddress: `${visit.property.address}, ${visit.property.commune}`,
      clientName: visit.tenant?.name || 'Cliente no identificado',
      visitDate: visit.scheduledAt,
      duration: visit.duration,
      earnings: visit.earnings || 0,
      rating: visit.runnerRatings[0]?.overallRating || null,
      status: 'PAID', // Asumimos que las visitas completadas se pagan
      createdAt: visit.scheduledAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        earnings,
        stats: {
          totalEarnings,
          totalVisits,
          averageRating: Math.round(averageRating * 10) / 10,
          period,
          periodStart: startDate,
          periodEnd: now,
        },
      },
    });
  } catch (error) {
    logger.error('Error obteniendo ganancias del corredor:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
