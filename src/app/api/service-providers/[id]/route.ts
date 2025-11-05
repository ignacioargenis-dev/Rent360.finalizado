import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/service-providers/[id]
 * Obtiene los detalles completos de un proveedor de servicios, incluyendo servicios, imágenes y reseñas
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const providerId = params.id;

    // Buscar el proveedor de servicios
    const provider = await db.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Obtener servicios del proveedor
    let services: any[] = [];
    try {
      const serviceTypes = JSON.parse(provider.serviceTypes || '[]');
      if (Array.isArray(serviceTypes)) {
        services = serviceTypes
          .map((item: any, index: number) => {
            if (typeof item === 'string') {
              return {
                id: `svc_${providerId}_${index}`,
                name: item,
                category: item,
                description: '',
                images: [],
              };
            } else if (typeof item === 'object' && item !== null) {
              return {
                id: item.id || `svc_${providerId}_${index}`,
                name: item.name || 'Servicio',
                category: item.category || item.name || 'Servicio',
                description: item.description || item.shortDescription || '',
                images: Array.isArray(item.images) ? item.images : [],
                pricing: item.pricing || { amount: provider.basePrice || 0 },
                duration: item.duration || { estimated: `${provider.responseTime || 2}h` },
                features: Array.isArray(item.features) ? item.features : [],
                requirements: Array.isArray(item.requirements) ? item.requirements : [],
                tags: Array.isArray(item.tags) ? item.tags : [],
              };
            }
            return null;
          })
          .filter(Boolean);
      }
    } catch (e) {
      logger.warn('Error parsing serviceTypes', { error: e, providerId });
    }

    // Obtener trabajos completados con reseñas (feedback)
    const completedJobs = await db.serviceJob.findMany({
      where: {
        serviceProviderId: providerId,
        status: 'COMPLETED',
        feedback: { not: null },
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        completedDate: 'desc',
      },
      take: 10, // Últimas 10 reseñas
    });

    // Transformar reseñas
    const reviews = completedJobs
      .filter(job => job.rating && job.feedback)
      .map(job => ({
        id: job.id,
        rating: job.rating || 0,
        comment: job.feedback || '',
        clientName: job.requester?.name || 'Cliente',
        date: job.completedDate?.toISOString() || job.updatedAt.toISOString(),
      }));

    // Calcular estadísticas
    const allJobs = await db.serviceJob.findMany({
      where: {
        serviceProviderId: providerId,
      },
      select: {
        status: true,
        rating: true,
        feedback: true,
      },
    });

    const completedJobsCount = allJobs.filter(j => j.status === 'COMPLETED').length;
    const ratings = allJobs.filter(j => j.rating).map(j => j.rating!) as number[];
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    // Obtener todas las imágenes de los servicios
    const allImages: string[] = [];
    services.forEach(service => {
      if (Array.isArray(service.images)) {
        allImages.push(...service.images);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: provider.id,
        name: provider.businessName || provider.user?.name || 'Proveedor',
        serviceType: provider.serviceType || 'OTHER',
        specialty: services.length > 0 ? services[0].name : 'Servicio',
        rating: provider.rating || averageRating || 0,
        reviewCount: reviews.length || provider.totalRatings || 0,
        hourlyRate: provider.basePrice || 0,
        location: `${provider.city || ''} ${provider.region || ''}`.trim() || 'No especificada',
        description: provider.description || '',
        availability: provider.status === 'ACTIVE' ? 'available' : 'offline',
        verified: provider.isVerified || false,
        responseTime: provider.responseTime ? `< ${provider.responseTime}h` : '< 24h',
        completedJobs: completedJobsCount || provider.completedJobs || 0,
        phone: provider.user?.phone || '',
        email: provider.user?.email || '',
        image: provider.user?.avatar || undefined,
        services: services,
        images: allImages,
        reviews: reviews,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalles del proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener detalles del proveedor' },
      { status: 500 }
    );
  }
}
