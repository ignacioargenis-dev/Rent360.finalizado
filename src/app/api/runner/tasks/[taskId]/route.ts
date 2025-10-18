import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

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

    // Obtener detalles de la tarea
    const task = await db.task.findUnique({
      where: { 
        id: taskId,
        assignedTo: user.id // Asegurar que el runner es el asignado
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
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        },
        // Incluir inquilino actual si existe
        property: {
          include: {
            contracts: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                tenant: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                  }
                }
              },
              take: 1,
              orderBy: {
                createdAt: 'desc'
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado
    const taskDetail = {
      id: task.id,
      propertyId: task.propertyId,
      propertyAddress: `${task.property.address}, ${task.property.commune}, ${task.property.city}`,
      propertyTitle: task.property.title,
      tenantName: task.property.contracts[0]?.tenant?.name || 'No disponible',
      tenantPhone: task.property.contracts[0]?.tenant?.phone || 'No disponible',
      tenantEmail: task.property.contracts[0]?.tenant?.email || 'No disponible',
      ownerName: task.property.owner.name,
      ownerPhone: task.property.owner.phone,
      ownerEmail: task.property.owner.email,
      taskType: task.type.toLowerCase(),
      priority: task.priority.toLowerCase(),
      status: task.status.toLowerCase(),
      scheduledDate: task.scheduledDate?.toISOString().split('T')[0],
      scheduledTime: task.scheduledTime,
      estimatedDuration: task.estimatedDuration?.toString(),
      description: task.description,
      specialInstructions: task.notes,
      contactMethod: 'phone', // Por defecto
      assignedBy: task.assignedBy.name,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    logger.info('Detalles de tarea obtenidos', {
      runnerId: user.id,
      taskId,
      status: task.status
    });

    return NextResponse.json({
      success: true,
      data: taskDetail
    });

  } catch (error) {
    logger.error('Error obteniendo detalles de tarea:', {
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
    const { status, notes, photos } = body;

    // Validar que la tarea existe y pertenece al runner
    const existingTask = await db.task.findUnique({
      where: { 
        id: taskId,
        assignedTo: user.id
      }
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o no tienes permisos para modificarla' },
        { status: 404 }
      );
    }

    // Actualizar la tarea
    const updatedTask = await db.task.update({
      where: { id: taskId },
      data: {
        ...(status && { status: status.toUpperCase() }),
        ...(notes && { notes }),
        ...(photos && { photos: JSON.stringify(photos) }),
        updatedAt: new Date()
      }
    });

    logger.info('Tarea actualizada', {
      runnerId: user.id,
      taskId,
      status: updatedTask.status,
      changes: { status, notes, photos: photos?.length }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedTask.id,
        status: updatedTask.status.toLowerCase(),
        notes: updatedTask.notes,
        photos: updatedTask.photos ? JSON.parse(updatedTask.photos) : [],
        updatedAt: updatedTask.updatedAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error actualizando tarea:', {
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
