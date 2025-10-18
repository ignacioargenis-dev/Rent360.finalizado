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
    const service = await db.service.findUnique({
      where: { 
        id: serviceId,
        providerId: user.id // Asegurar que el proveedor es el dueño
      },
      include: {
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

    if (!service) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para acceder' },
        { status: 404 }
      );
    }

    // Obtener estadísticas del servicio
    const stats = await db.maintenanceRequest.aggregate({
      where: {
        assignedProviderId: user.id,
        type: service.category
      },
      _count: {
        id: true
      }
    });

    const completedRequests = await db.maintenanceRequest.count({
      where: {
        assignedProviderId: user.id,
        type: service.category,
        status: 'COMPLETED'
      }
    });

    // Transformar datos al formato esperado
    const serviceDetail = {
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
        requests: stats._count.id || 0,
        conversionRate: service.conversionRate || 0,
        averageRating: service.averageRating || 0,
        totalReviews: service.totalReviews || 0,
        completedJobs: completedRequests,
      },
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };

    logger.info('Detalles de servicio obtenidos', {
      providerId: user.id,
      serviceId,
      category: service.category
    });

    return NextResponse.json({
      success: true,
      data: serviceDetail
    });

  } catch (error) {
    logger.error('Error obteniendo detalles de servicio:', {
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
      tags
    } = body;

    // Validar que el servicio existe y pertenece al proveedor
    const existingService = await db.service.findUnique({
      where: { 
        id: serviceId,
        providerId: user.id
      }
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Servicio no encontrado o no tienes permisos para modificarlo' },
        { status: 404 }
      );
    }

    // Actualizar el servicio
    const updatedService = await db.service.update({
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
        updatedAt: new Date()
      }
    });

    logger.info('Servicio actualizado', {
      providerId: user.id,
      serviceId,
      changes: { name, category, isActive }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedService.id,
        name: updatedService.name,
        category: updatedService.category,
        isActive: updatedService.isActive,
        updatedAt: updatedService.updatedAt.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error actualizando servicio:', {
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
