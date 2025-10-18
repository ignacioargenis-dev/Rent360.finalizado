import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER' && user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Obtener detalles de la solicitud
    const maintenance = await db.maintenance.findUnique({
      where: {
        id: requestId,
        assignedTo: user.id, // Asegurar que el proveedor está asignado
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
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado
    const requestDetail = {
      id: maintenance.id,
      propertyAddress: `${maintenance.property.address}, ${maintenance.property.commune}, ${maintenance.property.city}`,
      propertyTitle: maintenance.property.title,
      tenantName: 'N/A',
      tenantEmail: 'N/A',
      tenantPhone: 'N/A',
      ownerName: maintenance.property.owner.name,
      ownerEmail: maintenance.property.owner.email,
      ownerPhone: maintenance.property.owner.phone,
      serviceType: maintenance.category,
      priority: maintenance.priority.toLowerCase(),
      title: maintenance.title,
      description: maintenance.description,
      scheduledDate: maintenance.scheduledDate?.toISOString().split('T')[0],
      scheduledTime: maintenance.scheduledTime || 'No especificado',
      visitDuration: maintenance.visitDuration || 'No especificado',
      estimatedCost: maintenance.estimatedCost || 0,
      notes: maintenance.notes || '',
      images: maintenance.images ? JSON.parse(maintenance.images) : [],
      status: maintenance.status.toLowerCase(),
      actualCost: maintenance.actualCost,
      completedDate: maintenance.completedDate?.toISOString(),
      createdAt: maintenance.createdAt.toISOString(),
      updatedAt: maintenance.updatedAt.toISOString(),
    };

    logger.info('Detalles de solicitud obtenidos', {
      providerId: user.id,
      requestId,
      status: maintenance.status,
    });

    return NextResponse.json({
      success: true,
      data: requestDetail,
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de solicitud:', {
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER' && user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const requestId = params.id;
    const body = await request.json();
    const { status, estimatedCost, actualCost, notes, completionNotes, attachments } = body;

    // Validar que la solicitud existe y pertenece al proveedor
    const existingRequest = await db.maintenance.findUnique({
      where: {
        id: requestId,
        assignedTo: user.id,
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (estimatedCost !== undefined) {
      updateData.estimatedCost = estimatedCost;
    }
    if (actualCost !== undefined) {
      updateData.actualCost = actualCost;
    }
    if (notes) {
      updateData.notes = notes;
    }
    if (completionNotes) {
      updateData.completionNotes = completionNotes;
    }
    if (attachments) {
      updateData.attachments = JSON.stringify(attachments);
    }

    // Actualizar la solicitud
    const updatedRequest = await db.maintenance.update({
      where: { id: requestId },
      data: updateData,
    });

    logger.info('Solicitud actualizada', {
      providerId: user.id,
      requestId,
      status: updatedRequest.status,
      changes: { status, estimatedCost, actualCost },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status.toLowerCase(),
        estimatedCost: updatedRequest.estimatedCost,
        actualCost: updatedRequest.actualCost,
        completedDate: updatedRequest.completedDate?.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error actualizando solicitud:', {
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
