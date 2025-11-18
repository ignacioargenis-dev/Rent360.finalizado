import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

function mapJobStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'pending',
    ASSIGNED: 'pending',
    QUOTE_PENDING: 'quote_pending',
    QUOTE_APPROVED: 'quote_approved',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  return statusMap[status.toUpperCase()] || 'pending';
}

function mapPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  };
  return priorityMap[priority.toUpperCase()] || 'medium';
}

function mapMaintenanceType(category: string): string {
  const typeMap: Record<string, string> = {
    PLUMBING: 'plumbing',
    ELECTRICAL: 'electrical',
    STRUCTURAL: 'structural',
    CLEANING: 'cleaning',
    HVAC: 'other',
    OTHER: 'other',
  };
  return typeMap[category.toUpperCase()] || 'other';
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        maintenanceProvider: true,
      },
    });

    if (!fullUser || !fullUser.maintenanceProvider) {
      return NextResponse.json({
        success: true,
        jobs: [],
      });
    }

    // Obtener trabajos de mantenimiento reales
    const maintenanceJobs = await db.maintenance.findMany({
      where: {
        maintenanceProviderId: fullUser.maintenanceProvider.id,
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            commune: true,
            city: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Transformar los datos al formato esperado por el frontend
    const jobs = maintenanceJobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description || '',
      propertyAddress: job.property?.address || job.property?.title || 'Dirección no disponible',
      propertyOwner:
        job.requester?.name || job.property?.owner?.name || 'Propietario no identificado',
      ownerPhone: job.requester?.phone || '',
      ownerId: job.property?.ownerId || job.requester?.id || null,
      propertyId: job.propertyId,
      status: mapJobStatus(job.status),
      priority: mapPriority(job.priority),
      maintenanceType: mapMaintenanceType(job.category),
      estimatedCost: job.estimatedCost || 0,
      actualCost: job.actualCost || undefined,
      scheduledDate:
        job.scheduledDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      completedDate: job.completedDate?.toISOString().split('T')[0],
      notes: job.visitNotes || undefined,
    }));

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    logger.error('Error obteniendo trabajos de mantenimiento:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'MAINTENANCE') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, property, type, description, estimatedCost, dueDate, technician, urgency } =
      body;

    // Validación básica
    if (!title || !property || !type || !description) {
      return NextResponse.json(
        { error: 'Los campos título, propiedad, tipo y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // En un futuro real, crearíamos el trabajo en la base de datos
    const newJob = {
      id: Date.now().toString(),
      title,
      property,
      type,
      description,
      estimatedCost: estimatedCost || 0,
      dueDate: dueDate || new Date().toISOString(),
      technician: technician || 'Por asignar',
      urgency: urgency || 'Media',
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
    };

    logger.info('Nuevo trabajo de mantenimiento creado:', {
      maintenanceId: user.id,
      jobId: newJob.id,
    });

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Trabajo de mantenimiento creado exitosamente',
    });
  } catch (error) {
    logger.error('Error creando trabajo de mantenimiento:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
