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
    // Usar select explícito para evitar problemas con relaciones corruptas
    let visits: any[] = [];

    logger.info('Buscando visitas del runner en propiedades del owner', {
      runnerId,
      ownerId: user.id,
    });

    try {
      visits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
          property: {
            ownerId: user.id,
          },
        },
        include: {
          property: {
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
              id: true,
              overallRating: true,
              comment: true,
              createdAt: true,
              clientName: true,
              clientId: true,
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

      logger.info('Visitas encontradas', {
        count: visits?.length || 0,
        runnerId,
        ownerId: user.id,
      });
    } catch (visitError) {
      logger.error('Error fetching visits:', {
        error: visitError instanceof Error ? visitError.message : String(visitError),
        stack: visitError instanceof Error ? visitError.stack : undefined,
        runnerId,
        ownerId: user.id,
      });
      // Intentar obtener visitas con propertyImages usando solo include
      try {
        visits = await db.visit.findMany({
          where: {
            runnerId: runnerId,
            property: {
              ownerId: user.id,
            },
          },
          include: {
            property: {
              include: {
                propertyImages: {
                  select: {
                    id: true,
                    url: true,
                    alt: true,
                    createdAt: true,
                  },
                },
              },
            },
            runnerRatings: {
              select: {
                id: true,
                overallRating: true,
                comment: true,
                createdAt: true,
                clientName: true,
                clientId: true,
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

        logger.info('Visitas encontradas (fallback query)', {
          count: visits?.length || 0,
          runnerId,
          ownerId: user.id,
        });
      } catch (fallbackError) {
        logger.error('Error in fallback visits query:', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          stack: fallbackError instanceof Error ? fallbackError.stack : undefined,
        });
        visits = [];
      }
    }

    // Si no hay visitas, intentar verificar si el runner tiene visitas en otras propiedades
    if (visits.length === 0) {
      logger.warn('No se encontraron visitas para el runner en propiedades del owner', {
        runnerId,
        ownerId: user.id,
      });

      // Verificar si hay visitas del runner en general (para debugging)
      const allRunnerVisits = await db.visit.findMany({
        where: {
          runnerId: runnerId,
        },
        select: {
          id: true,
          propertyId: true,
          status: true,
        },
        take: 5,
      });

      // Verificar propiedades del owner
      const ownerProperties = await db.property.findMany({
        where: {
          ownerId: user.id,
        },
        select: {
          id: true,
          title: true,
        },
        take: 5,
      });

      logger.info('Información de debug', {
        runnerVisitsCount: allRunnerVisits.length,
        runnerVisitsSample: allRunnerVisits.map(v => ({
          id: v.id,
          propertyId: v.propertyId,
          status: v.status,
        })),
        ownerPropertiesCount: ownerProperties.length,
        ownerPropertiesSample: ownerProperties.map(p => ({
          id: p.id,
          title: p.title,
        })),
      });
    }

    // Obtener incentivos del runner con manejo defensivo
    let incentives: any[] = [];
    try {
      incentives = await db.runnerIncentive.findMany({
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
    } catch (incentiveError) {
      logger.error('Error fetching incentives:', {
        error: incentiveError instanceof Error ? incentiveError.message : String(incentiveError),
        runnerId,
      });
      incentives = [];
    }

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

    // Calcular estadísticas con manejo defensivo
    const stats = {
      totalVisits: visits?.length || 0,
      completedVisits:
        visits?.filter((v: any) => {
          const status = v?.status?.toUpperCase() || v?.status || '';
          return status === 'COMPLETED';
        }).length || 0,
      pendingVisits:
        visits?.filter((v: any) => {
          const status = v?.status?.toUpperCase() || v?.status || '';
          return status === 'SCHEDULED' || status === 'PENDING';
        }).length || 0,
      cancelledVisits:
        visits?.filter((v: any) => {
          const status = v?.status?.toUpperCase() || v?.status || '';
          return status === 'CANCELLED';
        }).length || 0,
      totalEarnings: visits?.reduce((sum, v) => sum + (Number(v?.earnings) || 0), 0) || 0,
      totalPhotos: visits?.reduce((sum, v) => sum + (Number(v?.photosTaken) || 0), 0) || 0,
      averageRating:
        allRunnerRatings?.length > 0
          ? allRunnerRatings.reduce((sum, r) => sum + (Number(r?.overallRating) || 0), 0) /
            allRunnerRatings.length
          : 0,
      totalIncentives: incentives?.length || 0,
      totalIncentiveValue:
        incentives?.reduce((sum, i) => {
          // Parsear rewardsGranted para obtener el valor
          if (!i) {
            return sum;
          }
          try {
            const rewardsGranted =
              typeof i.rewardsGranted === 'string'
                ? JSON.parse(i.rewardsGranted)
                : i.rewardsGranted;
            const amount = rewardsGranted?.amount || rewardsGranted?.value || 0;
            return sum + (typeof amount === 'number' ? amount : 0);
          } catch {
            return sum;
          }
        }, 0) || 0,
    };

    // Formatear actividad reciente con fotos - manejo defensivo
    const recentActivity = (visits || [])
      .map((visit: any) => {
        if (!visit || !visit.id) {
          return null;
        }

        // Obtener fotos asociadas a esta visita desde PropertyImage
        let visitPhotos: any[] = [];

        try {
          if (
            visit.property &&
            visit.property.propertyImages &&
            Array.isArray(visit.property.propertyImages)
          ) {
            visitPhotos = visit.property.propertyImages
              .map((img: any) => {
                if (!img || !img.alt || !visit?.id) {
                  return null;
                }
                try {
                  const metadata = img.alt ? JSON.parse(img.alt) : null;
                  if (metadata && metadata.visitId === visit.id) {
                    const imageUrl = img.url || '';
                    // Validar que la URL no esté vacía
                    if (!imageUrl || imageUrl.trim() === '') {
                      logger.warn('PropertyImage con URL vacía', {
                        imageId: img.id,
                        visitId: visit.id,
                      });
                      return null;
                    }

                    // Asegurar que la URL sea válida
                    let finalUrl = imageUrl.trim();

                    // Si la URL no empieza con http/https, puede ser relativa
                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                      // Si es una ruta relativa que empieza con /, mantenerla
                      if (finalUrl.startsWith('/')) {
                        // No hacer nada, mantener la ruta relativa
                      } else {
                        // Si no tiene protocolo ni empieza con /, puede ser un error
                        logger.warn('PropertyImage con URL inválida', {
                          imageId: img.id,
                          originalUrl: imageUrl,
                          visitId: visit.id,
                        });
                        return null;
                      }
                    }

                    return {
                      id: img.id || '',
                      url: finalUrl,
                      filename: finalUrl ? finalUrl.split('/').pop() || 'image.jpg' : 'image.jpg',
                      uploadedAt: img.createdAt
                        ? img.createdAt.toISOString()
                        : new Date().toISOString(),
                      category: metadata.category || 'general',
                      description: metadata.description || '',
                      isMain: metadata.isMain || false,
                    };
                  }
                  return null;
                } catch (parseError) {
                  // Si no se puede parsear, verificar si el alt contiene el visitId como string
                  if (img.alt && visit.id && img.alt.includes(visit.id)) {
                    const imageUrl = img.url || '';
                    if (!imageUrl || imageUrl.trim() === '') {
                      return null;
                    }

                    let finalUrl = imageUrl.trim();
                    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                      if (!finalUrl.startsWith('/')) {
                        logger.warn('PropertyImage con URL inválida (fallback)', {
                          imageId: img.id,
                          originalUrl: imageUrl,
                          visitId: visit.id,
                        });
                        return null;
                      }
                    }

                    return {
                      id: img.id || '',
                      url: finalUrl,
                      filename: finalUrl ? finalUrl.split('/').pop() || 'image.jpg' : 'image.jpg',
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
              .filter((photo: any) => photo !== null) as any[];
          }
        } catch (photoError) {
          logger.error('Error processing photos for visit:', {
            visitId: visit.id,
            error: photoError instanceof Error ? photoError.message : String(photoError),
          });
          visitPhotos = [];
        }

        try {
          return {
            id: visit.id || '',
            type: 'visit',
            propertyTitle: visit.property?.title || 'Propiedad no disponible',
            propertyAddress: visit.property?.address || 'Dirección no disponible',
            propertyId: visit.propertyId || '',
            scheduledAt: visit.scheduledAt
              ? visit.scheduledAt.toISOString()
              : new Date().toISOString(),
            status: visit.status || 'UNKNOWN',
            earnings: Number(visit.earnings) || 0,
            photosTaken: Number(visit.photosTaken) || 0,
            duration: Number(visit.duration) || 0,
            notes: visit.notes || '',
            rating:
              visit.runnerRatings &&
              Array.isArray(visit.runnerRatings) &&
              visit.runnerRatings.length > 0
                ? // Buscar la calificación del owner (user.id es el ownerId)
                  visit.runnerRatings.find((r: any) => r.clientId === user.id)?.overallRating ||
                  visit.runnerRatings[0]?.overallRating ||
                  Number(visit.rating) ||
                  null
                : Number(visit.rating) || null,
            hasRated:
              visit.runnerRatings &&
              Array.isArray(visit.runnerRatings) &&
              visit.runnerRatings.some((r: any) => r.clientId === user.id)
                ? true
                : false,
            feedback:
              visit.runnerRatings &&
              Array.isArray(visit.runnerRatings) &&
              visit.runnerRatings.length > 0
                ? // Buscar el feedback del owner
                  visit.runnerRatings.find((r: any) => r.clientId === user.id)?.comment ||
                  visit.runnerRatings[0]?.comment ||
                  visit.clientFeedback ||
                  null
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
        } catch (activityError) {
          logger.error('Error formatting activity for visit:', {
            visitId: visit.id,
            error: activityError instanceof Error ? activityError.message : String(activityError),
          });
          return null;
        }
      })
      .filter((activity: any) => activity !== null);

    logger.info('Respuesta de actividad del runner', {
      runnerId,
      ownerId: user.id,
      visitsCount: visits?.length || 0,
      recentActivityCount: recentActivity?.length || 0,
      statsTotalVisits: stats.totalVisits,
      statsCompletedVisits: stats.completedVisits,
    });

    return NextResponse.json({
      success: true,
      runner: {
        id: runner.id,
        name: runner.name,
      },
      stats,
      recentActivity,
      incentives: (incentives || [])
        .map((inc: any) => {
          if (!inc) {
            return null;
          }

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

          // Manejo defensivo para incentiveRule que puede no existir
          if (!inc.incentiveRule) {
            logger.warn('Incentive without incentiveRule:', { incentiveId: inc.id });
            return {
              id: inc.id || '',
              name: 'Incentivo sin regla asociada',
              description: 'No hay descripción disponible',
              type: 'unknown',
              category: 'unknown',
              amount: typeof amount === 'number' ? amount : 0,
              earnedAt: inc.earnedAt || new Date(),
            };
          }

          return {
            id: inc.id || '',
            name: inc.incentiveRule?.name || 'Sin nombre',
            description: inc.incentiveRule?.description || 'Sin descripción',
            type: inc.incentiveRule?.type || 'unknown',
            category: inc.incentiveRule?.category || 'unknown',
            amount: typeof amount === 'number' ? amount : 0,
            earnedAt: inc.earnedAt || new Date(),
          };
        })
        .filter((inc: any) => inc !== null),
      auditLogs: auditLogs.map((log: any) => ({
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
