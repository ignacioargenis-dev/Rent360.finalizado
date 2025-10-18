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
      assignedProviderId: user.id
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener solicitudes del proveedor
    const requests = await db.maintenanceRequest.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    // Transformar datos al formato esperado
    const transformedRequests = requests.map(request => ({
      id: request.id,
      propertyAddress: `${request.property.address}, ${request.property.commune}, ${request.property.city}`,
      tenantName: request.tenant.name,
      tenantEmail: request.tenant.email,
      tenantPhone: request.tenant.phone,
      serviceType: request.type,
      priority: request.priority.toLowerCase(),
      title: request.title,
      description: request.description,
      preferredDate: request.preferredDate?.toISOString().split('T')[0],
      preferredTimeSlot: request.preferredTimeSlot || 'No especificado',
      estimatedDuration: request.estimatedDuration || 'No especificado',
      budgetRange: {
        min: request.budgetMin || 0,
        max: request.budgetMax || 0,
      },
      specialRequirements: request.requirements ? JSON.parse(request.requirements) : [],
      attachments: request.attachments ? JSON.parse(request.attachments) : [],
      status: request.status.toLowerCase(),
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
    }));

    logger.info('Solicitudes de proveedor obtenidas', {
      providerId: user.id,
      count: transformedRequests.length,
      status
    });

    return NextResponse.json({
      success: true,
      data: transformedRequests,
      pagination: {
        limit,
        offset,
        total: requests.length,
        hasMore: requests.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo solicitudes de proveedor:', {
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
