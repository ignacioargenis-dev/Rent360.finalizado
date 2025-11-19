import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { UserRatingService } from '@/lib/user-rating-service';

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
            id: true, // ✅ Ya incluido, pero asegurar consistencia
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        documents: true, // ✅ Incluir documentos del proveedor
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

    // Obtener calificaciones desde el sistema unificado
    const userId = provider.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Usuario del proveedor no encontrado' },
        { status: 404 }
      );
    }

    // Obtener resumen de calificaciones
    const ratingSummary = await UserRatingService.getUserRatingSummary(userId);
    const averageRating = ratingSummary?.averageRating || 0;
    const totalRatings = ratingSummary?.totalRatings || 0;

    // Obtener calificaciones recientes (SERVICE y MAINTENANCE)
    const recentRatings = await db.userRating.findMany({
      where: {
        toUserId: userId,
        contextType: { in: ['SERVICE', 'MAINTENANCE'] },
        isPublic: true,
      },
      include: {
        fromUser: {
          select: {
            name: true,
            avatar: true,
          },
        },
        property: {
          select: {
            title: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Transformar reseñas al formato esperado
    const reviews = recentRatings.map(rating => ({
      id: rating.id,
      rating: rating.overallRating,
      comment: rating.comment || '',
      clientName: rating.isAnonymous ? 'Cliente Anónimo' : rating.fromUser?.name || 'Cliente',
      date: rating.createdAt.toISOString(),
      verified: rating.isVerified,
      contextType: rating.contextType,
      propertyTitle: rating.property?.title,
    }));

    // Obtener trabajos completados para contar
    const completedJobsCount = await db.serviceJob.count({
      where: {
        serviceProviderId: providerId,
        status: 'COMPLETED',
      },
    });

    // Obtener todas las imágenes de los servicios
    const allImages: string[] = [];
    services.forEach(service => {
      if (Array.isArray(service.images)) {
        allImages.push(...service.images);
      }
    });

    // ✅ Obtener documentos aprobados del proveedor
    const approvedDocuments: Array<{
      id: string;
      name: string;
      type: string;
      fileUrl: string;
    }> = [];

    if (provider.documents && provider.documents.isVerified) {
      // Solo mostrar documentos si el proveedor está verificado
      if (provider.documents.businessCertificate) {
        approvedDocuments.push({
          id: 'business-certificate',
          name: 'Certificado de Empresa',
          type: 'certificate',
          fileUrl: provider.documents.businessCertificate,
        });
      }
      if (provider.documents.idFront) {
        approvedDocuments.push({
          id: 'id-front',
          name: 'Cédula de Identidad (Frente)',
          type: 'id',
          fileUrl: provider.documents.idFront,
        });
      }
      if (provider.documents.idBack) {
        approvedDocuments.push({
          id: 'id-back',
          name: 'Cédula de Identidad (Reverso)',
          type: 'id',
          fileUrl: provider.documents.idBack,
        });
      }
      if (provider.documents.criminalRecord) {
        approvedDocuments.push({
          id: 'criminal-record',
          name: 'Certificado de Antecedentes',
          type: 'certificate',
          fileUrl: provider.documents.criminalRecord,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: provider.id,
        name: provider.businessName || provider.user?.name || 'Proveedor',
        serviceType: provider.serviceType || 'OTHER',
        specialty: services.length > 0 ? services[0].name : 'Servicio',
        rating: averageRating,
        reviewCount: totalRatings,
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
        approvedDocuments: approvedDocuments, // ✅ Documentos aprobados visibles para clientes
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
