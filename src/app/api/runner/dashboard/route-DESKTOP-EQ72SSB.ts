import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { UserRatingService } from '@/lib/user-rating-service';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    // Obtener todas las visitas del runner
    const allVisits = await db.visit.findMany({
      where: { runnerId: user.id },
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
            phone: true,
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
          take: 1,
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Calcular estadísticas
    const totalVisits = allVisits.length;
    const completedVisits = allVisits.filter(v => v.status === 'COMPLETED').length;
    const pendingVisits = allVisits.filter(
      v => v.status === 'SCHEDULED' || v.status === 'PENDING'
    ).length;

    // Ganancias mensuales (último mes)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyEarnings = allVisits
      .filter(v => v.status === 'COMPLETED' && new Date(v.scheduledAt) >= monthStart)
      .reduce((sum, v) => sum + (v.earnings || 0), 0);

    // Obtener calificación promedio real desde UserRatingService
    const ratingSummary = await UserRatingService.getUserRatingSummary(user.id);
    const averageRating = ratingSummary?.averageRating || 0;

    // Visitas de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayVisits = allVisits
      .filter(v => {
        const visitDate = new Date(v.scheduledAt);
        return visitDate >= today && visitDate <= todayEnd;
      })
      .slice(0, 10)
      .map(v => {
        const visitDate = new Date(v.scheduledAt);
        return {
          id: v.id,
          propertyTitle: v.property.title,
          address: `${v.property.address}, ${v.property.commune}`,
          clientName: v.tenant?.name || 'No asignado',
          clientPhone: v.tenant?.phone || 'No disponible',
          scheduledDate: visitDate.toISOString().split('T')[0],
          scheduledTime: visitDate.toTimeString().substring(0, 5),
          status: v.status,
          priority: v.status === 'SCHEDULED' && visitDate < new Date() ? 'HIGH' : 'MEDIUM',
          estimatedDuration: v.duration,
          notes: v.notes || '',
        };
      });

    // Actividad reciente (últimas 10 visitas)
    const recentActivity = allVisits.slice(0, 10).map(v => {
      const visitDate = new Date(v.scheduledAt);
      const rating = v.runnerRatings[0]?.overallRating || v.rating;

      return {
        id: v.id,
        type: v.status === 'COMPLETED' ? 'visit' : 'visit_scheduled',
        title: v.status === 'COMPLETED' ? 'Visita completada' : 'Visita programada',
        description: `Visita a ${v.property.title} ${v.status === 'COMPLETED' ? 'finalizada exitosamente' : 'programada'}`,
        date: visitDate.toISOString(),
        status: v.status,
        earnings: v.status === 'COMPLETED' ? v.earnings : undefined,
        rating: rating || undefined,
      };
    });

    // Métricas de rendimiento
    const completionRate = totalVisits > 0 ? (completedVisits / totalVisits) * 100 : 0;
    const avgDuration =
      completedVisits > 0
        ? allVisits.filter(v => v.status === 'COMPLETED').reduce((sum, v) => sum + v.duration, 0) /
          completedVisits
        : 0;

    const performanceMetrics = [
      {
        label: 'Tasa de Completitud',
        value: `${Math.round(completionRate)}%`,
        change: '0%', // TODO: Calcular cambio desde historial
        trend: 'stable' as const,
      },
      {
        label: 'Tiempo Promedio',
        value: `${Math.round(avgDuration)} min`,
        change: '0 min', // TODO: Calcular cambio desde historial
        trend: 'stable' as const,
      },
      {
        label: 'Satisfacción',
        value: `${Math.round(averageRating * 10) / 10}/5`,
        change: '0', // TODO: Calcular cambio desde historial
        trend: 'stable' as const,
      },
      {
        label: 'Ingresos Mensuales',
        value: `$${monthlyEarnings.toLocaleString('es-CL')}`,
        change: '0%', // TODO: Calcular cambio desde historial
        trend: 'stable' as const,
      },
    ];

    logger.info('Dashboard de runner obtenido', {
      runnerId: user.id,
      totalVisits,
      completedVisits,
      pendingVisits,
      monthlyEarnings,
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalVisits,
        completedVisits,
        pendingVisits,
        monthlyEarnings,
        averageRating: Math.round(averageRating * 10) / 10,
        responseTime: 0, // TODO: Calcular desde mensajes
      },
      todayVisits,
      recentActivity,
      performanceMetrics,
    });
  } catch (error) {
    logger.error('Error obteniendo dashboard de runner:', {
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
