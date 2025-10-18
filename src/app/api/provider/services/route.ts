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
      serviceProviderId: user.id,
    };

    if (status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    // Obtener servicios del proveedor
    const services = await db.serviceJob.findMany({
      where: whereClause,
      include: {
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
            serviceTypes: true,
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
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
    const transformedServices = services.map(service => ({
      id: service.id,
      name: service.title,
      category: service.serviceType,
      description: service.description,
      shortDescription: service.description?.substring(0, 100) + '...',
      pricing: {
        type: 'fixed',
        amount: service.basePrice || 0,
        currency: 'CLP',
        minimumCharge: 0,
      },
      duration: {
        estimated: '1',
        unit: 'hours',
      },
      features: [],
      requirements: [],
      availability: {
        active: true,
        regions: [],
        emergency: false,
      },
      images: service.images ? JSON.parse(service.images) : [],
      tags: [],
      stats: {
        views: 0,
        requests: 0,
        conversionRate: 0,
        averageRating: 0,
        totalReviews: 0,
      },
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    }));

    logger.info('Servicios de proveedor obtenidos', {
      serviceProviderId: user.id,
      count: transformedServices.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: transformedServices,
      pagination: {
        limit,
        offset,
        total: services.length,
        hasMore: services.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo servicios de proveedor:', {
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
