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
      assignedTo: user.id
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener tareas del runner
    const tasks = await db.task.findMany({
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
          }
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedTasks = tasks.map(task => ({
      id: task.id,
      propertyId: task.propertyId,
      propertyAddress: `${task.property.address}, ${task.property.commune}, ${task.property.city}`,
      tenantName: 'No disponible', // Se puede obtener del contrato activo
      tenantPhone: 'No disponible',
      tenantEmail: 'No disponible',
      taskType: task.type.toLowerCase(),
      priority: task.priority.toLowerCase(),
      status: task.status.toLowerCase(),
      scheduledDate: task.scheduledDate?.toISOString().split('T')[0],
      scheduledTime: task.scheduledTime,
      estimatedDuration: task.estimatedDuration?.toString(),
      description: task.description,
      specialInstructions: task.notes,
      contactMethod: 'phone', // Por defecto
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));

    logger.info('Tareas de runner obtenidas', {
      runnerId: user.id,
      count: transformedTasks.length,
      status
    });

    return NextResponse.json({
      success: true,
      data: transformedTasks,
      pagination: {
        limit,
        offset,
        total: tasks.length,
        hasMore: tasks.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo tareas de runner:', {
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
