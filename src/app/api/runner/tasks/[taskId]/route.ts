import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { RunnerIncentivesService } from '@/lib/runner-incentives-service';

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const taskId = params.taskId;

    // Obtener detalles de la visita/tarea
    const visit = await db.visit.findUnique({
      where: {
        id: taskId,
        runnerId: user.id, // Asegurar que el runner es el asignado
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
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
      },
    });

    if (!visit) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Verificar si el runner ya calificó al propietario para esta visita
    const ownerId = visit.property.owner?.id || null;
    const existingOwnerRating = ownerId
      ? await db.userRating.findFirst({
          where: {
            fromUserId: user.id,
            toUserId: ownerId,
            contextType: 'PROPERTY_VISIT',
            contextId: visit.id,
          },
        })
      : null;

    const hasRatedOwner = !!existingOwnerRating;

    // Calcular fechas de manera segura
    let scheduledDate = new Date().toISOString().split('T')[0];
    let scheduledTime = '00:00';

    if (visit.scheduledAt) {
      try {
        const dateValue = visit.scheduledAt;
        const scheduledDateTime = new Date(dateValue);

        // Verificaciones exhaustivas para TypeScript
        if (
          scheduledDateTime instanceof Date &&
          !isNaN(scheduledDateTime.getTime()) &&
          scheduledDateTime.getTime() > 0 &&
          typeof scheduledDateTime.toISOString === 'function' &&
          typeof scheduledDateTime.toTimeString === 'function'
        ) {
          const isoString = scheduledDateTime.toISOString();
          const timeString = scheduledDateTime.toTimeString();

          if (isoString && timeString) {
            const dateParts = isoString.split('T');
            const timeParts = timeString.split(' ');

            if (dateParts.length > 0 && timeParts.length > 0 && timeParts[0]) {
              scheduledDate = dateParts[0];
              scheduledTime = timeParts[0].substring(0, 5);
            }
          }
        }
      } catch (error) {
        // Mantener valores por defecto si hay error en el parsing
        console.warn('Error parsing scheduledAt date:', error);
      }
    }

    // Transformar datos al formato esperado
    const taskDetail = {
      id: visit.id,
      propertyId: visit.propertyId,
      propertyAddress: `${visit.property.address}, ${visit.property.commune}, ${visit.property.city}`,
      propertyTitle: visit.property.title,
      tenantName: visit.tenant?.name || 'No asignado',
      tenantPhone: visit.tenant?.phone || 'No disponible',
      tenantEmail: visit.tenant?.email || 'No disponible',
      ownerName: visit.property.owner?.name || 'Propietario no identificado',
      ownerPhone: visit.property.owner?.phone || 'No disponible',
      ownerEmail: visit.property.owner?.email || 'No disponible',
      taskType: 'property_visit',
      priority: 'medium',
      status: visit.status.toLowerCase(),
      scheduledDate,
      scheduledTime,
      estimatedDuration: visit.duration,
      earnings: visit.earnings,
      description: visit.notes || 'Visita programada para mostrar propiedad',
      specialInstructions: visit.notes,
      photosTaken: visit.photosTaken,
      rating: visit.rating,
      clientFeedback: visit.clientFeedback,
      contactMethod: 'phone',
      assignedBy: 'Sistema',
      hasRatedOwner, // Flag para saber si ya se calificó al propietario
      createdAt: visit.createdAt.toISOString(),
      updatedAt: visit.updatedAt.toISOString(),
    };

    logger.info('Detalles de tarea obtenidos', {
      runnerId: user.id,
      taskId,
      status: visit.status,
    });

    return NextResponse.json({
      success: true,
      data: taskDetail,
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de tarea:', {
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

export async function PUT(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const taskId = params.taskId;
    const body = await request.json();
    const { status, notes, photosTaken, rating, clientFeedback } = body;

    // Validar que la visita existe y pertenece al runner
    const existingVisit = await db.visit.findUnique({
      where: {
        id: taskId,
        runnerId: user.id,
      },
    });

    if (!existingVisit) {
      return NextResponse.json(
        { error: 'Visita no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      );
    }

    // Actualizar la visita
    const updatedVisit = await db.visit.update({
      where: { id: taskId },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(notes !== undefined && { notes }),
        ...(photosTaken !== undefined && { photosTaken }),
        ...(rating !== undefined && { rating }),
        ...(clientFeedback !== undefined && { clientFeedback }),
        updatedAt: new Date(),
      },
    });

    // Si la visita se completó, evaluar incentivos automáticamente y procesar pago
    const wasCompleted =
      status &&
      status.toUpperCase() === 'COMPLETED' &&
      existingVisit.status.toUpperCase() !== 'COMPLETED';

    if (wasCompleted) {
      try {
        // Evaluar incentivos en segundo plano (no bloquear la respuesta)
        RunnerIncentivesService.evaluateRunnerIncentives(user.id).catch(error => {
          logger.error('Error evaluando incentivos después de completar visita:', {
            runnerId: user.id,
            visitId: taskId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

        logger.info('Evaluación de incentivos iniciada para visita completada', {
          runnerId: user.id,
          visitId: taskId,
        });

        // Procesar pago del propietario en segundo plano
        const { OwnerPaymentService } = await import('@/lib/owner-payment-service');
        OwnerPaymentService.chargePayment(taskId).catch(error => {
          logger.error('Error procesando pago del propietario después de completar visita:', {
            visitId: taskId,
            error: error instanceof Error ? error.message : String(error),
          });
        });

        logger.info('Procesamiento de pago iniciado para visita completada', {
          visitId: taskId,
        });
      } catch (error) {
        // No fallar la actualización si hay error en evaluación de incentivos o pago
        logger.warn('Error iniciando procesos después de completar visita:', {
          runnerId: user.id,
          visitId: taskId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Visita actualizada', {
      runnerId: user.id,
      taskId,
      status: updatedVisit.status,
      changes: { status, notes, photosTaken, rating, clientFeedback },
      incentivesEvaluated: wasCompleted,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedVisit.id,
        status: updatedVisit.status.toLowerCase(),
        notes: updatedVisit.notes,
        photosTaken: updatedVisit.photosTaken,
        rating: updatedVisit.rating,
        clientFeedback: updatedVisit.clientFeedback,
        updatedAt: updatedVisit.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error actualizando visita:', {
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
