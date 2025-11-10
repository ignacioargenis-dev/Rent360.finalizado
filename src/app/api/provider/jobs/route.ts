import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // ✅ Aceptar todos los roles de proveedor (normalizados)
    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso no autorizado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    let jobs: any[] = [];

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          serviceProviderId: fullUser.serviceProvider.id,
        },
        include: {
          requester: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      jobs = serviceJobs.map(job => ({
        id: job.id,
        title: job.title,
        client: job.requester.name || 'Cliente',
        status: mapJobStatus(job.status),
        priority: getPriorityFromStatus(job.status),
        dueDate: job.scheduledDate?.toISOString() || job.createdAt.toISOString(),
        description: job.description,
        price: job.finalPrice || job.basePrice,
        createdAt: job.createdAt.toISOString(),
        serviceType: job.serviceType,
        rating: job.rating || undefined,
        feedback: job.feedback || undefined,
      }));
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
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
              title: true,
              address: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      jobs = maintenanceJobs.map(job => ({
        id: job.id,
        title: job.title,
        client: job.property?.title || job.requester.name || 'Cliente',
        status: mapJobStatus(job.status),
        priority: job.priority || 'Media',
        dueDate: job.scheduledDate?.toISOString() || job.createdAt.toISOString(),
        description: job.description,
        price: job.actualCost || job.estimatedCost || 0,
        createdAt: job.createdAt.toISOString(),
        serviceType: job.category,
      }));
    }

    return NextResponse.json({
      success: true,
      jobs,
    });
  } catch (error) {
    logger.error('Error obteniendo trabajos del proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

function mapJobStatus(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: 'Pendiente',
    ACCEPTED: 'Aceptado',
    ACTIVE: 'Activo',
    IN_PROGRESS: 'En progreso',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    ASSIGNED: 'Programado',
  };
  return statusMap[status.toUpperCase()] || status;
}

function getPriorityFromStatus(status: string): string {
  if (status === 'IN_PROGRESS' || status === 'ACCEPTED' || status === 'ACTIVE') {
    return 'Alta';
  }
  if (status === 'PENDING') {
    return 'Media';
  }
  return 'Baja';
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Acceso no autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { title, client, description, price, dueDate, priority } = body;

    // Validación básica
    if (!title || !client || !description) {
      return NextResponse.json(
        { error: 'Los campos título, cliente y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // En un futuro real, crearíamos el trabajo en la base de datos
    const newJob = {
      id: Date.now().toString(),
      title,
      client,
      description,
      price: price || 0,
      dueDate: dueDate || new Date().toISOString(),
      priority: priority || 'Media',
      status: 'Pendiente',
      createdAt: new Date().toISOString(),
    };

    logger.info('Nuevo trabajo creado por proveedor:', { providerId: user.id, jobId: newJob.id });

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Trabajo creado exitosamente',
    });
  } catch (error) {
    logger.error('Error creando trabajo:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
