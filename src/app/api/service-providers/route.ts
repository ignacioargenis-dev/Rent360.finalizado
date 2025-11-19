import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { UserRatingService } from '@/lib/user-rating-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('serviceType');
    const city = searchParams.get('city');
    const verified = searchParams.get('verified');

    // Construir filtros
    const where: any = {
      status: 'ACTIVE', // Solo proveedores activos
    };

    if (serviceType) {
      where.serviceType = serviceType;
    }

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      };
    }

    if (verified === 'true') {
      where.isVerified = true;
    }

    const providers = await db.serviceProvider.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, // ✅ Incluir ID del usuario para mensajería
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
      take: 50, // Limitar resultados iniciales
    });

    // Obtener calificaciones para cada proveedor y ordenar
    const providersWithRatings = await Promise.all(
      providers.map(async provider => {
        if (!provider.user?.id) {
          return {
            ...provider,
            unifiedRating: 0,
            unifiedTotalRatings: 0,
          };
        }

        const ratingSummary = await UserRatingService.getUserRatingSummary(provider.user.id);
        return {
          ...provider,
          unifiedRating: ratingSummary?.averageRating || 0,
          unifiedTotalRatings: ratingSummary?.totalRatings || 0,
        };
      })
    );

    // Ordenar por calificación unificada y luego por trabajos completados
    providersWithRatings.sort((a, b) => {
      if (b.unifiedRating !== a.unifiedRating) {
        return b.unifiedRating - a.unifiedRating;
      }
      return (b.completedJobs || 0) - (a.completedJobs || 0);
    });

    // Remover campos temporales antes de enviar
    const sortedProviders = providersWithRatings.map(
      ({ unifiedRating, unifiedTotalRatings, ...provider }) => ({
        ...provider,
        // Mantener compatibilidad: agregar rating y totalRatings calculados
        rating: unifiedRating,
        totalRatings: unifiedTotalRatings,
      })
    );

    logger.info(`Service providers loaded: ${sortedProviders.length} providers`);

    return NextResponse.json({
      success: true,
      providers: sortedProviders,
      count: sortedProviders.length,
    });
  } catch (error) {
    logger.error('Error fetching service providers:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener proveedores de servicios' },
      { status: 500 }
    );
  }
}
