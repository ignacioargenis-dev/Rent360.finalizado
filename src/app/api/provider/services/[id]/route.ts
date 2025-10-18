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

    const serviceId = params.id;

    // Obtener detalles del servicio
    const service = await db.serviceJob.findUnique({
      where: {
        id: serviceId,
        serviceProviderId: user.id, // Asegurar que el proveedor es el dueño
      },
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
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Obtener estadísticas del servicio
    const stats = await db.maintenance.aggregate({
      where: {
        assignedTo: user.id,
        category: service.serviceType,
      },
      _count: {
        id: true,
      },
    });

    const completedRequests = await db.maintenance.count({
      where: {
        assignedTo: user.id,
        category: service.serviceType,
        status: 'COMPLETED',
      },
    });

    // Transformar datos al formato esperado
    const serviceDetail = {
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
        requests: stats._count.id || 0,
        conversionRate: 0,
        averageRating: 0,
        totalReviews: 0,
        completedJobs: completedRequests,
      },
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };

    logger.info('Detalles de servicio obtenidos', {
      serviceProviderId: user.id,
      serviceId,
      category: service.serviceType,
    });

    return NextResponse.json({
      success: true,
      data: serviceDetail,
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de servicio:', {
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

    const serviceId = params.id;
    const body = await request.json();
    const {
      name,
      category,
      description,
      basePrice,
      minimumCharge,
      estimatedDuration,
      features,
      requirements,
      regions,
      isActive,
      emergencyService,
      images,
      tags,
    } = body;

    // Validar que el servicio existe y pertenece al proveedor
    const existingService = await db.serviceJob.findUnique({
      where: {
        id: serviceId,
        serviceProviderId: user.id,
      },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para modificarlo' },
        { status: 404 }
      );
    }

    // Actualizar el servicio
    const updatedService = await db.serviceJob.update({
      where: { id: serviceId },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description && { description }),
        ...(basePrice !== undefined && { basePrice }),
        ...(minimumCharge !== undefined && { minimumCharge }),
        ...(estimatedDuration && { estimatedDuration }),
        ...(features && { features: JSON.stringify(features) }),
        ...(requirements && { requirements: JSON.stringify(requirements) }),
        ...(regions && { regions: JSON.stringify(regions) }),
        ...(isActive !== undefined && { isActive }),
        ...(emergencyService !== undefined && { emergencyService }),
        ...(images && { images: JSON.stringify(images) }),
        ...(tags && { tags: JSON.stringify(tags) }),
        updatedAt: new Date(),
      },
    });

    logger.info('Servicio actualizado', {
      serviceProviderId: user.id,
      serviceId,
      changes: { name, category, isActive },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedService.id,
        name: updatedService.title,
        category: updatedService.serviceType,
        isActive: true,
        updatedAt: updatedService.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error actualizando servicio:', {
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
