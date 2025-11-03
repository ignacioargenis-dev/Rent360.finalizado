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
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    // Manejar params como Promise o objeto directo (Next.js 13+)
    const resolvedParams = 'then' in params ? await params : params;
    const runnerId = resolvedParams.id;

    if (!runnerId) {
      return NextResponse.json({ error: 'ID de runner requerido' }, { status: 400 });
    }

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
          include: {
            propertyImages: {
              select: {
                id: true,
                url: true,
                alt: true,
                createdAt: true,
                order: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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

    // Obtener todas las calificaciones del runner para calcular promedio real
    const allRunnerRatings = await db.runnerRating.findMany({
      where: {
        runnerId: runnerId,
      },
      select: {
        overallRating: true,
      },
    });

    // Calcular estadísticas
    const stats = {
      totalVisits: visits.length,
      completedVisits: visits.filter(v => v.status === 'COMPLETED').length,
      pendingVisits: visits.filter(v => v.status === 'SCHEDULED' || v.status === 'PENDING').length,
      cancelledVisits: visits.filter(v => v.status === 'CANCELLED').length,
      totalEarnings: visits.reduce((sum, v) => sum + (v.earnings || 0), 0),
      totalPhotos: visits.reduce((sum, v) => sum + (v.photosTaken || 0), 0),
      averageRating:
        allRunnerRatings.length > 0
          ? allRunnerRatings.reduce((sum, r) => sum + r.overallRating, 0) / allRunnerRatings.length
          : 0,
      totalIncentives: incentives.length,
      totalIncentiveValue: incentives.reduce((sum, i) => {
        // Parsear rewardsGranted para obtener el valor
        try {
          const rewardsGranted =
            typeof i.rewardsGranted === 'string' ? JSON.parse(i.rewardsGranted) : i.rewardsGranted;
          const amount = rewardsGranted?.amount || rewardsGranted?.value || 0;
          return sum + (typeof amount === 'number' ? amount : 0);
        } catch {
          return sum;
        }
      }, 0),
    };

    // Formatear actividad reciente con fotos
    const recentActivity = visits.map(visit => {
      // Obtener fotos asociadas a esta visita desde PropertyImage
      let visitPhotos: any[] = [];

      if (
        visit.property &&
        visit.property.propertyImages &&
        Array.isArray(visit.property.propertyImages)
      ) {
        visitPhotos = visit.property.propertyImages
          .map(img => {
            if (!img || !img.alt) {
              return null;
            }
            try {
              const metadata = JSON.parse(img.alt);
              if (metadata && metadata.visitId === visit.id) {
                return {
                  id: img.id,
                  url: img.url,
                  filename: img.url ? img.url.split('/').pop() || 'image.jpg' : 'image.jpg',
                  uploadedAt: img.createdAt
                    ? img.createdAt.toISOString()
                    : new Date().toISOString(),
                  category: metadata.category || 'general',
                  description: metadata.description || '',
                  isMain: metadata.isMain || false,
                };
              }
              return null;
            } catch {
              // Si no se puede parsear, verificar si el alt contiene el visitId como string
              if (img.alt.includes(visit.id)) {
                return {
                  id: img.id,
                  url: img.url,
                  filename: img.url ? img.url.split('/').pop() || 'image.jpg' : 'image.jpg',
                  uploadedAt: img.createdAt
                    ? img.createdAt.toISOString()
                    : new Date().toISOString(),
                  category: 'general',
                  description: '',
                  isMain: false,
                };
              }
              return null;
            }
          })
          .filter(photo => photo !== null) as any[];
      }

      return {
        id: visit.id,
        type: 'visit',
        propertyTitle: visit.property?.title || 'Propiedad no disponible',
        propertyAddress: visit.property?.address || 'Dirección no disponible',
        propertyId: visit.propertyId || '',
        scheduledAt: visit.scheduledAt ? visit.scheduledAt.toISOString() : new Date().toISOString(),
        status: visit.status || 'UNKNOWN',
        earnings: visit.earnings || 0,
        photosTaken: visit.photosTaken || 0,
        duration: visit.duration || 0,
        notes: visit.notes || '',
        rating:
          visit.runnerRatings && visit.runnerRatings.length > 0
            ? visit.runnerRatings[0]?.overallRating || visit.rating || null
            : visit.rating || null,
        feedback:
          visit.runnerRatings && visit.runnerRatings.length > 0
            ? visit.runnerRatings[0]?.comment || visit.clientFeedback || null
            : visit.clientFeedback || null,
        photos: visitPhotos,
        tenant: visit.tenant
          ? {
              id: visit.tenant.id || '',
              name: visit.tenant.name || '',
              email: visit.tenant.email || '',
              phone: visit.tenant.phone || '',
            }
          : null,
        createdAt: visit.createdAt ? visit.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: visit.updatedAt ? visit.updatedAt.toISOString() : new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      runner: {
        id: runner.id,
        name: runner.name,
      },
      stats,
      recentActivity,
      incentives: incentives.map(inc => {
        // Parsear rewardsGranted para obtener el valor
        let amount = 0;
        try {
          const rewardsGranted =
            typeof inc.rewardsGranted === 'string'
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
      auditLogs: auditLogs.map(log => ({
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
    logger.error('Error fetching runner activity:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
