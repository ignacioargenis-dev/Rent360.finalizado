import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { NotificationService, NotificationType } from '@/lib/notification-service';

/**
 * POST /api/ratings/reminders
 * Enviar recordatorios para calificar servicios/visitas completadas
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Obtener servicios/visitas completadas que no han sido calificadas
    const daysSinceCompletion = 3; // Recordar después de 3 días
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceCompletion);

    const reminders: Array<{
      type: string;
      id: string;
      title: string;
      completedDate: Date;
      recipientId: string;
      recipientName: string;
    }> = [];

    // 1. Visitas completadas sin calificar (para tenants/owners)
    if (user.role === 'TENANT' || user.role === 'OWNER') {
      const visits = await db.visit.findMany({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            lte: cutoffDate,
          },
          OR: [{ tenantId: user.id }, { property: { ownerId: user.id } }],
        },
        include: {
          runner: {
            select: { id: true, name: true },
          },
          property: {
            select: { id: true, title: true },
          },
        },
      });

      for (const visit of visits) {
        // Verificar si ya existe calificación
        const existingRating = await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            contextType: 'PROPERTY_VISIT',
            contextId: visit.id,
          },
        });

        if (!existingRating) {
          reminders.push({
            type: 'PROPERTY_VISIT',
            id: visit.id,
            title: `Visita a ${visit.property?.title || 'propiedad'}`,
            completedDate: visit.updatedAt,
            recipientId: visit.runnerId,
            recipientName: visit.runner?.name || 'Runner',
          });
        }
      }
    }

    // 2. Servicios completados sin calificar (para tenants/owners)
    if (user.role === 'TENANT' || user.role === 'OWNER') {
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          status: 'COMPLETED',
          requesterId: user.id,
          completedDate: {
            lte: cutoffDate,
          },
        },
        include: {
          serviceProvider: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const job of serviceJobs) {
        // Verificar si ya existe calificación
        const existingRating = await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            contextType: 'SERVICE',
            contextId: job.id,
          },
        });

        if (!existingRating && job.serviceProvider?.user) {
          reminders.push({
            type: 'SERVICE',
            id: job.id,
            title: job.title || 'Servicio completado',
            completedDate: job.completedDate || job.updatedAt,
            recipientId: job.serviceProvider.user.id,
            recipientName: job.serviceProvider.user.name || 'Proveedor',
          });
        }
      }
    }

    // 3. Mantenimientos completados sin calificar
    if (user.role === 'OWNER' || user.role === 'BROKER') {
      const maintenances = await db.maintenance.findMany({
        where: {
          status: 'COMPLETED',
          property: {
            OR: [{ ownerId: user.id }, { brokerId: user.id }],
          },
          completedDate: {
            lte: cutoffDate,
          },
        },
        include: {
          maintenanceProvider: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const maintenance of maintenances) {
        // Verificar si ya existe calificación
        const existingRating = await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            contextType: 'MAINTENANCE',
            contextId: maintenance.id,
          },
        });

        if (!existingRating && maintenance.maintenanceProvider?.user) {
          reminders.push({
            type: 'MAINTENANCE',
            id: maintenance.id,
            title: maintenance.title || 'Mantenimiento completado',
            completedDate: maintenance.completedDate || maintenance.updatedAt,
            recipientId: maintenance.maintenanceProvider.user.id,
            recipientName: maintenance.maintenanceProvider.user.name || 'Proveedor',
          });
        }
      }
    }

    // Enviar notificaciones de recordatorio
    const sentReminders: string[] = [];
    for (const reminder of reminders.slice(0, 5)) {
      // Limitar a 5 recordatorios por vez
      try {
        const contextTypeLabel =
          reminder.type === 'PROPERTY_VISIT'
            ? 'visita'
            : reminder.type === 'SERVICE'
              ? 'servicio'
              : 'mantenimiento';

        await NotificationService.create({
          userId: user.id,
          type: NotificationType.SYSTEM_ALERT,
          title: '⭐ Recordatorio: Califica tu Experiencia',
          message: `¿Cómo fue tu ${contextTypeLabel} con ${reminder.recipientName}? Tu opinión es importante.`,
          link: `/ratings?type=${reminder.type}&id=${reminder.id}`,
          metadata: {
            reminderType: reminder.type,
            reminderId: reminder.id,
            recipientId: reminder.recipientId,
            type: 'rating_reminder',
          },
          priority: 'low',
        });

        sentReminders.push(reminder.id);
      } catch (error) {
        logger.warn('Error enviando recordatorio de calificación:', {
          reminderId: reminder.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        remindersFound: reminders.length,
        remindersSent: sentReminders.length,
        reminders: sentReminders,
      },
      message: `Se enviaron ${sentReminders.length} recordatorios de calificación`,
    });
  } catch (error) {
    logger.error('Error enviando recordatorios de calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * GET /api/ratings/reminders
 * Obtener lista de elementos pendientes de calificar
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const pendingRatings: Array<{
      type: string;
      id: string;
      title: string;
      completedDate: Date;
      recipientId: string;
      recipientName: string;
      daysSinceCompletion: number;
    }> = [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Últimos 30 días

    // Visitas completadas sin calificar
    if (user.role === 'TENANT' || user.role === 'OWNER') {
      const visits = await db.visit.findMany({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: cutoffDate,
          },
          OR: [{ tenantId: user.id }, { property: { ownerId: user.id } }],
        },
        include: {
          runner: {
            select: { id: true, name: true },
          },
          property: {
            select: { id: true, title: true },
          },
        },
      });

      for (const visit of visits) {
        const existingRating = await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            contextType: 'PROPERTY_VISIT',
            contextId: visit.id,
          },
        });

        if (!existingRating) {
          const daysSince = Math.floor(
            (new Date().getTime() - visit.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          pendingRatings.push({
            type: 'PROPERTY_VISIT',
            id: visit.id,
            title: `Visita a ${visit.property?.title || 'propiedad'}`,
            completedDate: visit.updatedAt,
            recipientId: visit.runnerId,
            recipientName: visit.runner?.name || 'Runner',
            daysSinceCompletion: daysSince,
          });
        }
      }
    }

    // Servicios completados sin calificar
    if (user.role === 'TENANT' || user.role === 'OWNER') {
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          status: 'COMPLETED',
          requesterId: user.id,
          completedDate: {
            gte: cutoffDate,
          },
        },
        include: {
          serviceProvider: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      for (const job of serviceJobs) {
        const existingRating = await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            contextType: 'SERVICE',
            contextId: job.id,
          },
        });

        if (!existingRating && job.serviceProvider?.user && job.completedDate) {
          const daysSince = Math.floor(
            (new Date().getTime() - job.completedDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          pendingRatings.push({
            type: 'SERVICE',
            id: job.id,
            title: job.title || 'Servicio completado',
            completedDate: job.completedDate,
            recipientId: job.serviceProvider.user.id,
            recipientName: job.serviceProvider.user.name || 'Proveedor',
            daysSinceCompletion: daysSince,
          });
        }
      }
    }

    // Ordenar por días desde completación (más antiguos primero)
    pendingRatings.sort((a, b) => b.daysSinceCompletion - a.daysSinceCompletion);

    return NextResponse.json({
      success: true,
      data: {
        pendingRatings,
        total: pendingRatings.length,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo recordatorios de calificación:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
