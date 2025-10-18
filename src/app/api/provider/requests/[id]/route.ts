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
    const maintenanceRequest = await db.maintenanceRequest.findUnique({
      where: { 
        id: requestId,
        assignedProviderId: user.id // Asegurar que el proveedor está asignado
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
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado
    const requestDetail = {
      id: maintenanceRequest.id,
      propertyAddress: `${maintenanceRequest.property.address}, ${maintenanceRequest.property.commune}, ${maintenanceRequest.property.city}`,
      propertyTitle: maintenanceRequest.property.title,
      tenantName: maintenanceRequest.tenant.name,
      tenantEmail: maintenanceRequest.tenant.email,
      tenantPhone: maintenanceRequest.tenant.phone,
      ownerName: maintenanceRequest.property.owner.name,
      ownerEmail: maintenanceRequest.property.owner.email,
      ownerPhone: maintenanceRequest.property.owner.phone,
      serviceType: maintenanceRequest.type,
      priority: maintenanceRequest.priority.toLowerCase(),
      title: maintenanceRequest.title,
      description: maintenanceRequest.description,
      preferredDate: maintenanceRequest.preferredDate?.toISOString().split('T')[0],
      preferredTimeSlot: maintenanceRequest.preferredTimeSlot || 'No especificado',
      estimatedDuration: maintenanceRequest.estimatedDuration || 'No especificado',
      budgetRange: {
        min: maintenanceRequest.budgetMin || 0,
        max: maintenanceRequest.budgetMax || 0,
      },
      specialRequirements: maintenanceRequest.requirements ? JSON.parse(maintenanceRequest.requirements) : [],
      attachments: maintenanceRequest.attachments ? JSON.parse(maintenanceRequest.attachments) : [],
      status: maintenanceRequest.status.toLowerCase(),
      estimatedCost: maintenanceRequest.estimatedCost,
      actualCost: maintenanceRequest.actualCost,
      completedAt: maintenanceRequest.completedAt?.toISOString(),
      createdAt: maintenanceRequest.createdAt.toISOString(),
      updatedAt: maintenanceRequest.updatedAt.toISOString(),
    };

    logger.info('Detalles de solicitud obtenidos', {
      providerId: user.id,
      requestId,
      status: maintenanceRequest.status
    });

    return NextResponse.json({
      success: true,
      data: requestDetail
    });

  } catch (error) {
    logger.error('Error obteniendo detalles de solicitud:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
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
    const { 
      status, 
      estimatedCost, 
      actualCost, 
      notes,
      completionNotes,
      attachments
    } = body;

    // Validar que la solicitud existe y pertenece al proveedor
    const existingRequest = await db.maintenanceRequest.findUnique({
      where: { 
        id: requestId,
        assignedProviderId: user.id
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status.toUpperCase();
      if (status.toUpperCase() === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost;
    if (actualCost !== undefined) updateData.actualCost = actualCost;
    if (notes) updateData.notes = notes;
    if (completionNotes) updateData.completionNotes = completionNotes;
    if (attachments) updateData.attachments = JSON.stringify(attachments);

    // Actualizar la solicitud
    const updatedRequest = await db.maintenanceRequest.update({
      where: { id: requestId },
      data: updateData
    });

    logger.info('Solicitud actualizada', {
      providerId: user.id,
      requestId,
      status: updatedRequest.status,
      changes: { status, estimatedCost, actualCost }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status.toLowerCase(),
        estimatedCost: updatedRequest.estimatedCost,
        actualCost: updatedRequest.actualCost,
        completedAt: updatedRequest.completedAt?.toISOString(),
        updatedAt: updatedRequest.updatedAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error actualizando solicitud:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
