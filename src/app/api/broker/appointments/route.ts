import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que sea un corredor
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    logger.info('Obteniendo citas del corredor', { userId: user.id });

    // Obtener actividades de prospectos que son citas/reuniones
    const prospectActivities = await db.prospectActivity.findMany({
      where: {
        brokerId: user.id,
        activityType: {
          in: ['meeting', 'property_view', 'follow_up'],
        },
      },
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledFor: 'desc',
      },
    });

    // Obtener actividades de clientes que son citas/reuniones
    const clientActivities = await db.clientActivity.findMany({
      where: {
        brokerId: user.id,
        activityType: {
          in: ['meeting', 'service', 'other'],
        },
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Obtener visitas relacionadas con propiedades gestionadas por el broker
    const managedProperties = await db.brokerPropertyManagement.findMany({
      where: {
        brokerId: user.id,
        status: 'ACTIVE',
      },
      select: {
        propertyId: true,
      },
    });

    const propertyIds = managedProperties.map(mp => mp.propertyId);

    const visits = await db.visit.findMany({
      where: {
        propertyId: {
          in: propertyIds,
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

    // Transformar actividades de prospectos a appointments
    const prospectAppointments = prospectActivities.map(activity => ({
      id: activity.id,
      clientName: activity.prospect.name,
      clientEmail: activity.prospect.email,
      clientPhone: activity.prospect.phone || '',
      propertyTitle: activity.title.includes('Propiedad') ? activity.title : 'Consulta General',
      propertyAddress: '',
      dateTime: activity.scheduledFor
        ? activity.scheduledFor.toISOString()
        : activity.createdAt.toISOString(),
      type:
        activity.activityType === 'property_view'
          ? 'viewing'
          : activity.activityType === 'meeting'
            ? 'meeting'
            : 'negotiation',
      status: activity.completedAt
        ? 'completed'
        : activity.outcome === 'scheduled'
          ? 'confirmed'
          : activity.outcome === 'unsuccessful'
            ? 'cancelled'
            : 'scheduled',
      notes: activity.notes || activity.description || '',
      createdAt: activity.createdAt.toISOString(),
    }));

    // Transformar actividades de clientes a appointments
    const clientAppointments = clientActivities.map(activity => ({
      id: activity.id,
      clientName: activity.client.user.name,
      clientEmail: activity.client.user.email,
      clientPhone: activity.client.user.phone || '',
      propertyTitle: activity.title.includes('Propiedad') ? activity.title : 'Consulta General',
      propertyAddress: '',
      dateTime: activity.createdAt.toISOString(),
      type: activity.activityType === 'meeting' ? 'meeting' : 'viewing',
      status: 'scheduled',
      notes: activity.description || '',
      createdAt: activity.createdAt.toISOString(),
    }));

    // Transformar visitas a appointments
    const visitAppointments = visits.map(visit => ({
      id: visit.id,
      clientName: visit.tenant?.name || 'Cliente',
      clientEmail: visit.tenant?.email || '',
      clientPhone: visit.tenant?.phone || '',
      propertyTitle: visit.property.title,
      propertyAddress: visit.property.address,
      dateTime: visit.scheduledAt.toISOString(),
      type: 'viewing',
      status:
        visit.status === 'COMPLETED'
          ? 'completed'
          : visit.status === 'CANCELLED'
            ? 'cancelled'
            : visit.status === 'NO_SHOW'
              ? 'no_show'
              : 'scheduled',
      notes: visit.notes || '',
      createdAt: visit.createdAt.toISOString(),
    }));

    // Combinar todos los appointments
    const allAppointments = [...prospectAppointments, ...clientAppointments, ...visitAppointments];

    // Ordenar por fecha
    allAppointments.sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return dateB - dateA;
    });

    logger.info('Citas del corredor obtenidas exitosamente', {
      userId: user.id,
      count: allAppointments.length,
    });

    return NextResponse.json({
      success: true,
      data: allAppointments,
      appointments: allAppointments, // También incluir en 'appointments' para compatibilidad
    });
  } catch (error) {
    logger.error('Error obteniendo citas del corredor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
