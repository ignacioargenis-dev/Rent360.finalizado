import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/runners/[id]/activity
 * Obtiene la actividad completa de un runner en propiedades del propietario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const runnerId = params.id;

    // Verificar que el runner existe
    const runner = await db.user.findUnique({
      where: { id: runnerId, role: 'RUNNER' },
      select: { id: true, name: true },
    });

    if (!runner) {
      return NextResponse.json({ error: 'Runner no encontrado' }, { status: 404 });
    }

    // Obtener todas las visitas del runner en propiedades del propietario
    const visits = await db.visit.findMany({
      where: {
        runnerId: runnerId,
        property: {
          ownerId: user.id,
        },
      },
      include: {
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
            clientName: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Obtener incentivos del runner
    const incentives = await db.runnerIncentive.findMany({
      where: {
        runnerId: runnerId,
      },
      include: {
        incentiveRule: {
          select: {
            name: true,
            description: true,
            type: true,
            category: true,
            rewards: true,
          },
        },
      },
      orderBy: {
        earnedAt: 'desc',
      },
      take: 20,
    });

    // Obtener audit logs relacionados (si hay algún sistema de tracking)
    const auditLogs = await db.auditLog.findMany({
      where: {
        userId: runnerId,
        action: {
          in: ['VISIT_CREATED', 'VISIT_COMPLETED', 'PHOTO_UPLOADED', 'TASK_COMPLETED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Calcular estadísticas
    const stats = {
      totalVisits: visits.length,
      completedVisits: visits.filter((v) => v.status === 'COMPLETED').length,
      pendingVisits: visits.filter((v) => v.status === 'SCHEDULED' || v.status === 'PENDING').length,
      cancelledVisits: visits.filter((v) => v.status === 'CANCELLED').length,
      totalEarnings: visits.reduce((sum, v) => sum + (v.earnings || 0), 0),
      totalPhotos: visits.reduce((sum, v) => sum + (v.photosTaken || 0), 0),
      averageRating:
        visits.length > 0
          ? visits.reduce((sum, v) => {
              const rating = v.runnerRatings[0]?.overallRating || v.rating || 0;
              return sum + rating;
            }, 0) / visits.length
          : 0,
      totalIncentives: incentives.length,
      totalIncentiveValue: incentives.reduce((sum, i) => {
        // Parsear rewardsGranted para obtener el valor
        try {
          const rewardsGranted = typeof i.rewardsGranted === 'string' 
            ? JSON.parse(i.rewardsGranted) 
            : i.rewardsGranted;
          const amount = rewardsGranted?.amount || rewardsGranted?.value || 0;
          return sum + (typeof amount === 'number' ? amount : 0);
        } catch {
          return sum;
        }
      }, 0),
    };

    // Formatear actividad reciente
    const recentActivity = visits.map((visit) => ({
      id: visit.id,
      type: 'visit',
      propertyTitle: visit.property.title,
      propertyAddress: visit.property.address,
      scheduledAt: visit.scheduledAt,
      status: visit.status,
      earnings: visit.earnings,
      photosTaken: visit.photosTaken,
      rating: visit.runnerRatings[0]?.overallRating || visit.rating,
      feedback: visit.runnerRatings[0]?.comment || visit.clientFeedback,
    }));

    return NextResponse.json({
      success: true,
      runner: {
        id: runner.id,
        name: runner.name,
      },
      stats,
      recentActivity,
      incentives: incentives.map((inc) => {
        // Parsear rewardsGranted para obtener el valor
        let amount = 0;
        try {
          const rewardsGranted = typeof inc.rewardsGranted === 'string' 
            ? JSON.parse(inc.rewardsGranted) 
            : inc.rewardsGranted;
          amount = rewardsGranted?.amount || rewardsGranted?.value || 0;
        } catch {
          amount = 0;
        }
        
        return {
          id: inc.id,
          name: inc.incentiveRule.name,
          description: inc.incentiveRule.description,
          type: inc.incentiveRule.type,
          category: inc.incentiveRule.category,
          amount: typeof amount === 'number' ? amount : 0,
          earnedAt: inc.earnedAt,
        };
      }),
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        createdAt: log.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Error fetching runner activity:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

