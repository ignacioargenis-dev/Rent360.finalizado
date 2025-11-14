import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';
import { z } from 'zod';

const rejectVisitSchema = z.object({
  reason: z.string().optional(),
});

/**
 * POST /api/visits/[visitId]/reject
 * Rechaza una solicitud de visita pendiente
 */
export async function POST(request: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const user = await requireAuth(request);
    const { visitId } = params;

    if (user.role !== 'OWNER' && user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo propietarios y corredores pueden rechazar visitas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = rejectVisitSchema.parse(body);

    // Obtener la visita pendiente
    const visit = await db.visit.findUnique({
      where: { id: visitId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
            brokerId: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!visit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role === 'OWNER' && visit.property.ownerId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos sobre esta visita' }, { status: 403 });
    }

    if (user.role === 'BROKER') {
      // Verificar si el broker gestiona la propiedad directamente o a través de BrokerPropertyManagement
      const isDirectBroker = visit.property.brokerId === user.id;
      const isManagedBroker = await db.brokerPropertyManagement.findFirst({
        where: {
          brokerId: user.id,
          propertyId: visit.property.id,
          status: 'ACTIVE',
        },
      });

      if (!isDirectBroker && !isManagedBroker) {
        return NextResponse.json(
          { error: 'No tienes permisos sobre esta visita' },
          { status: 403 }
        );
      }
    }

    if (visit.status !== 'PENDING') {
      return NextResponse.json({ error: 'Esta visita ya ha sido procesada' }, { status: 400 });
    }

    // Actualizar la visita a estado CANCELLED
    const updatedVisit = await db.visit.update({
      where: { id: visitId },
      data: {
        status: 'CANCELLED',
        notes: validatedData.reason
          ? `${visit.notes || ''}\n\nRazón del rechazo: ${validatedData.reason}`
          : visit.notes,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notificar al inquilino
    if (visit.tenantId) {
      try {
        await NotificationService.create({
          userId: visit.tenantId,
          type: 'VISIT_REJECTED',
          title: 'Solicitud de visita rechazada',
          message: `Tu solicitud de visita para "${visit.property.title}" ha sido rechazada.${validatedData.reason ? ` Razón: ${validatedData.reason}` : ''}`,
          link: `/tenant/visits`,
        });
      } catch (notificationError) {
        logger.warn('Error enviando notificación al inquilino:', {
          error:
            notificationError instanceof Error
              ? notificationError.message
              : String(notificationError),
        });
      }
    }

    logger.info('Visita rechazada exitosamente', {
      visitId: updatedVisit.id,
      rejectedBy: user.id,
      userRole: user.role,
      reason: validatedData.reason,
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud de visita rechazada exitosamente',
      visit: {
        id: updatedVisit.id,
        property: updatedVisit.property,
        status: updatedVisit.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error rechazando visita:', {
      error: error instanceof Error ? error.message : String(error),
      visitId: params.visitId,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
