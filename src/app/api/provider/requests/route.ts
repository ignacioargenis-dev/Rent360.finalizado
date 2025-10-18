import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'PROVIDER' && user.role !== 'MAINTENANCE') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {
      assignedTo: user.id,
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener solicitudes del proveedor
    const requests = await db.maintenance.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedRequests = requests.map(request => ({
      id: request.id,
      propertyAddress: `${request.property.address}, ${request.property.commune}, ${request.property.city}`,
      tenantName: 'N/A',
      tenantEmail: 'N/A',
      tenantPhone: 'N/A',
      serviceType: request.category,
      priority: request.priority.toLowerCase(),
      title: request.title,
      description: request.description,
      scheduledDate: request.scheduledDate?.toISOString().split('T')[0],
      scheduledTime: request.scheduledTime || 'No especificado',
      visitDuration: request.visitDuration || 'No especificado',
      estimatedCost: request.estimatedCost || 0,
      notes: request.notes || '',
      images: request.images ? JSON.parse(request.images) : [],
      status: request.status.toLowerCase(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }));

    logger.info('Solicitudes de proveedor obtenidas', {
      providerId: user.id,
      count: transformedRequests.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      pagination: {
        limit,
        offset,
        total: requests.length,
        hasMore: requests.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo solicitudes de proveedor:', {
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
