import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      runnerId: user.id,
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener visitas/tareas del runner
    const visits = await db.visit.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
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
      take: limit,
      skip: offset,
    });

    // Función helper para manejar fechas de manera segura
    const formatSafeDateTime = (scheduledAt: Date | null) => {
      if (!scheduledAt) {
        return { scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '00:00' };
      }

      try {
        const dateObj = new Date(scheduledAt);
        if (dateObj instanceof Date && !isNaN(dateObj.getTime()) && dateObj.getTime() > 0) {
          const isoString = dateObj.toISOString();
          const timeString = dateObj.toTimeString();
          const dateParts = isoString.split('T');
          const timeParts = timeString.split(' ');

          if (dateParts.length > 0 && timeParts.length > 0) {
            const datePart = dateParts[0];
            const timePart = timeParts[0];
            if (datePart && timePart) {
              return {
                scheduledDate: datePart,
                scheduledTime: timePart.substring(0, 5),
              };
            }
          }
        }
      } catch (error) {
        console.warn('Error parsing scheduledAt date:', error);
      }

      return { scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '00:00' };
    };

    // Transformar datos al formato esperado
    const transformedTasks = visits.map(visit => {
      const { scheduledDate, scheduledTime } = formatSafeDateTime(visit.scheduledAt);

      return {
        id: visit.id,
        propertyId: visit.propertyId,
        propertyTitle: visit.property.title,
        propertyAddress: `${visit.property.address}, ${visit.property.commune}, ${visit.property.city}`,
        tenantName: visit.tenant?.name || 'No asignado',
        tenantPhone: visit.tenant?.phone || 'No disponible',
        tenantEmail: visit.tenant?.email || 'No disponible',
        taskType: 'property_visit', // Tipo de tarea para corredores
        priority: 'medium', // Por defecto, podría calcularse basado en tiempo
        status: visit.status.toLowerCase(),
        scheduledDate,
        scheduledTime,
        estimatedDuration: visit.duration,
        earnings: visit.earnings,
        description: visit.notes || 'Visita programada para mostrar propiedad',
        specialInstructions: visit.notes,
        contactMethod: 'phone', // Por defecto
        photosTaken: visit.photosTaken,
        rating: visit.rating,
        clientFeedback: visit.clientFeedback,
        createdAt: visit.createdAt.toISOString(),
        updatedAt: visit.updatedAt.toISOString(),
      };
    });

    logger.info('Tareas de runner obtenidas', {
      runnerId: user.id,
      count: transformedTasks.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: transformedTasks,
      pagination: {
        limit,
        offset,
        total: visits.length,
        hasMore: visits.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo tareas de runner:', {
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
