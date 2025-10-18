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
      providerId: user.id
    };
    
    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener servicios del proveedor
    const services = await db.service.findMany({
      where: whereClause,
      include: {
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
    const transformedServices = services.map(service => ({
      id: service.id,
      name: service.name,
      category: service.category,
      description: service.description,
      shortDescription: service.description?.substring(0, 100) + '...',
      pricing: {
        type: service.pricingType || 'fixed',
        amount: service.basePrice || 0,
        currency: 'CLP',
        minimumCharge: service.minimumCharge || 0,
      },
      duration: {
        estimated: service.estimatedDuration?.toString() || '1',
        unit: 'hours',
      },
      features: service.features ? JSON.parse(service.features) : [],
      requirements: service.requirements ? JSON.parse(service.requirements) : [],
      availability: {
        active: service.isActive,
        regions: service.regions ? JSON.parse(service.regions) : [],
        emergency: service.emergencyService || false,
      },
      images: service.images ? JSON.parse(service.images) : [],
      tags: service.tags ? JSON.parse(service.tags) : [],
      stats: {
        views: service.views || 0,
        requests: service.requests || 0,
        conversionRate: service.conversionRate || 0,
        averageRating: service.averageRating || 0,
        totalReviews: service.totalReviews || 0,
      },
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    logger.info('Servicios de proveedor obtenidos', {
      providerId: user.id,
      count: transformedServices.length,
      status
    });

    return NextResponse.json({
      success: true,
      data: transformedServices,
      pagination: {
        limit,
        offset,
        total: services.length,
        hasMore: services.length === limit
      }
    });

  } catch (error) {
    logger.error('Error obteniendo servicios de proveedor:', {
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
