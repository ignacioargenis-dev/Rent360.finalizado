import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/runners/assigned
 * Obtiene todos los runners asignados al propietario a través de visitas en sus propiedades
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    // Obtener todas las visitas en propiedades del propietario
    const visits = await db.visit.findMany({
      where: {
        property: {
          ownerId: user.id,
        },
      },
      include: {
        runner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            city: true,
            commune: true,
            bio: true,
            createdAt: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
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
          take: 10,
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Obtener todas las calificaciones de runners para calcular promedios
    const allRunnerRatings = await db.runnerRating.findMany({
      where: {
        runnerId: {
          in: Array.from(new Set(visits.map(v => v.runnerId))),
        },
      },
      select: {
        runnerId: true,
        overallRating: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Agrupar calificaciones por runner
    const ratingsByRunner = new Map<string, number[]>();
    allRunnerRatings.forEach(rating => {
      if (!ratingsByRunner.has(rating.runnerId)) {
        ratingsByRunner.set(rating.runnerId, []);
      }
      ratingsByRunner.get(rating.runnerId)!.push(rating.overallRating);
    });

    // Agrupar por runner y calcular estadísticas
    const runnerMap = new Map<string, any>();

    visits.forEach(visit => {
      const runnerId = visit.runnerId;
      if (!runnerMap.has(runnerId)) {
        const ratings = ratingsByRunner.get(runnerId) || [];
        const averageRating =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        runnerMap.set(runnerId, {
          runner: visit.runner,
          stats: {
            totalVisits: 0,
            completedVisits: 0,
            pendingVisits: 0,
            totalEarnings: 0,
            averageRating: Math.round(averageRating * 10) / 10,
            lastVisitDate: null,
            firstAssignedDate: visit.createdAt,
          },
          visits: [],
          properties: new Set<string>(),
        });
      }

      const runnerData = runnerMap.get(runnerId)!;
      runnerData.stats.totalVisits++;
      runnerData.stats.totalEarnings += visit.earnings || 0;
      runnerData.properties.add(visit.propertyId);

      const visitStatus = visit.status?.toUpperCase() || visit.status || '';
      if (visitStatus === 'COMPLETED') {
        runnerData.stats.completedVisits++;
      } else if (visitStatus === 'SCHEDULED' || visitStatus === 'PENDING') {
        runnerData.stats.pendingVisits++;
      }

      if (!runnerData.stats.lastVisitDate || visit.scheduledAt > runnerData.stats.lastVisitDate) {
        runnerData.stats.lastVisitDate = visit.scheduledAt;
      }

      runnerData.visits.push({
        id: visit.id,
        propertyTitle: visit.property.title,
        propertyAddress: visit.property.address,
        scheduledAt: visit.scheduledAt,
        status: visit.status,
        earnings: visit.earnings,
        photosTaken: visit.photosTaken,
      });
    });

    // Convertir a array y formatear
    const assignedRunners = Array.from(runnerMap.values()).map(data => ({
      runner: data.runner,
      stats: {
        ...data.stats,
        propertiesCount: data.properties.size,
        visits: data.visits.length,
      },
      recentVisits: data.visits.slice(0, 5),
      propertiesCount: data.properties.size,
    }));

    return NextResponse.json({
      success: true,
      runners: assignedRunners,
      total: assignedRunners.length,
    });
  } catch (error) {
    logger.error('Error fetching assigned runners:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
