import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService } from '@/lib/notification-service';
import { z } from 'zod';

const selfAssignSchema = z.object({
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().min(15).max(240).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/visits/[visitId]/self-assign
 * Permite que el propietario o broker marque que hará la visita él mismo
 */
export async function POST(request: NextRequest, { params }: { params: { visitId: string } }) {
  try {
    const user = await requireAuth(request);
    const { visitId } = params;

    if (user.role !== 'OWNER' && user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo propietarios y corredores pueden hacer visitas propias' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = selfAssignSchema.parse(body);

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

    // Actualizar la visita: el propietario/broker gestiona la visita
    // Para brokers, pueden hacerla ellos mismos o enviar a alguien de su equipo
    const updatedVisit = await db.visit.update({
      where: { id: visitId },
      data: {
        runnerId: user.id, // El propietario/broker gestiona la visita (puede hacerla él o su equipo)
        status: 'SCHEDULED',
        scheduledAt: validatedData.scheduledAt
          ? new Date(validatedData.scheduledAt)
          : visit.scheduledAt,
        duration: validatedData.duration || visit.duration,
        notes: validatedData.notes || visit.notes,
        earnings: 0, // No hay pago si el propietario/broker gestiona la visita
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
        const scheduledDate = new Date(updatedVisit.scheduledAt);
        const formattedDate = scheduledDate.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
        const formattedTime = scheduledDate.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        });

        let message = '';
        if (user.role === 'OWNER') {
          message = `Tu solicitud de visita para "${visit.property.title}" ha sido programada. El propietario realizará la visita el ${formattedDate} a las ${formattedTime}.`;
        } else {
          // Para brokers, pueden hacerla ellos o su equipo
          message = `Tu solicitud de visita para "${visit.property.title}" ha sido programada. El corredor o alguien de su equipo realizará la visita el ${formattedDate} a las ${formattedTime}.`;
        }

        await NotificationService.create({
          userId: visit.tenantId,
          type: 'VISIT_SCHEDULED',
          title: 'Visita programada',
          message: message,
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

    logger.info('Visita gestionada exitosamente', {
      visitId: updatedVisit.id,
      managedBy: user.id,
      userRole: user.role,
    });

    const successMessage =
      user.role === 'OWNER'
        ? 'Visita programada exitosamente. Realizarás la visita tú mismo.'
        : 'Visita programada exitosamente. Puedes realizarla tú mismo o enviar a alguien de tu equipo.';

    return NextResponse.json({
      success: true,
      message: successMessage,
      visit: {
        id: updatedVisit.id,
        property: updatedVisit.property,
        scheduledAt: updatedVisit.scheduledAt.toISOString(),
        duration: updatedVisit.duration,
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

    logger.error('Error auto-asignando visita:', {
      error: error instanceof Error ? error.message : String(error),
      visitId: params.visitId,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
