import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;

    // Verificar que el usuario tiene permisos para ver los trabajos de esta propiedad
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        ownerId: true,
        brokerId: true,
        contracts: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] },
          },
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    let hasPermission = false;

    if (user.role === 'ADMIN') {
      hasPermission = true;
    } else if (user.role === 'owner' && property.ownerId === user.id) {
      hasPermission = true;
    } else if (user.role === 'broker' && property.brokerId === user.id) {
      hasPermission = true;
    } else if (user.role === 'tenant') {
      hasPermission = property.contracts.some(contract => contract.tenantId === user.id);
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver los trabajos de esta propiedad' },
        { status: 403 }
      );
    }

    // Obtener trabajos de mantenimiento de la propiedad
    const maintenanceJobs = await db.maintenance.findMany({
      where: {
        propertyId: propertyId,
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        maintenanceProvider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            specialties: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformar los datos al formato esperado por el frontend
    const transformedJobs = maintenanceJobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      category: job.category,
      priority: job.priority,
      status: job.status,
      estimatedCost: job.estimatedCost,
      actualCost: job.actualCost,
      requestedBy: {
        id: job.requester.id,
        name: job.requester.name,
        email: job.requester.email,
        phone: job.requester.phone,
        role: job.requesterRole,
      },
      assignedTo: job.maintenanceProvider
        ? {
            id: job.maintenanceProvider.id,
            name: job.maintenanceProvider.name,
            email: job.maintenanceProvider.email,
            phone: job.maintenanceProvider.phone,
            specialties: job.maintenanceProvider.specialties,
          }
        : null,
      scheduledDate: job.scheduledDate?.toISOString(),
      scheduledTime: job.scheduledTime,
      visitDuration: job.visitDuration,
      visitNotes: job.visitNotes,
      completedDate: job.completedDate?.toISOString(),
      rating: job.rating,
      feedback: job.feedback,
      images: job.images ? JSON.parse(job.images) : [],
      notes: job.notes,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      jobs: transformedJobs,
      totalCount: transformedJobs.length,
    });
  } catch (error) {
    logger.error('Error obteniendo trabajos de mantenimiento de propiedad:', {
      error: error instanceof Error ? error.message : String(error),
      propertyId: params.id,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
