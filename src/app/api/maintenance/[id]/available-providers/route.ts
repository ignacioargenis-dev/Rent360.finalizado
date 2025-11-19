import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';
import { UserRatingService } from '@/lib/user-rating-service';

/**
 * GET /api/maintenance/[id]/available-providers
 * Obtener prestadores disponibles para una solicitud de mantenimiento específica
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const maintenanceId = params.id;

    // Obtener parámetros de query para filtros
    const { searchParams } = new URL(request.url);
    const locationFilter = searchParams.get('location'); // 'same_city', 'same_region', 'all'
    const specialtyFilter = searchParams.get('specialty'); // Filtro de especialidad opcional

    // Verificar que la solicitud existe y el usuario tiene acceso
    const maintenance = await db.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            region: true,
            brokerId: true,
            ownerId: true,
          },
        },
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Solicitud de mantenimiento no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos de acceso
    const hasPermission =
      user.role === 'ADMIN' ||
      ((user.role === 'BROKER' || user.role === 'broker') &&
        maintenance.property.brokerId === user.id) ||
      ((user.role === 'OWNER' || user.role === 'owner') &&
        maintenance.property.ownerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta solicitud' },
        { status: 403 }
      );
    }

    // DIAGNÓSTICO: Contar proveedores totales y por estado
    const totalProvidersCount = await db.maintenanceProvider.count();
    const verifiedProvidersCount = await db.maintenanceProvider.count({
      where: { isVerified: true },
    });
    const activeVerifiedCount = await db.maintenanceProvider.count({
      where: {
        isVerified: true,
        status: {
          in: ['ACTIVE', 'active', 'VERIFIED', 'verified'],
        },
      },
    });

    logger.info('Diagnóstico de proveedores:', {
      maintenanceId,
      totalProviders: totalProvidersCount,
      verifiedProviders: verifiedProvidersCount,
      activeVerifiedProviders: activeVerifiedCount,
      propertyCity: maintenance.property.city,
      propertyRegion: maintenance.property.region,
    });

    // Buscar prestadores disponibles (más flexible - mostrar todos los activos y verificados)
    // El filtro por especialidad y ubicación se puede hacer opcionalmente
    const whereClause: any = {
      isVerified: true,
      // Aceptar múltiples variantes de estado activo
      status: {
        in: ['ACTIVE', 'active', 'VERIFIED', 'verified'],
      },
    };

    // Aplicar filtro de ubicación según el parámetro (solo si hay datos de ubicación)
    if (locationFilter === 'same_city' && maintenance.property.city) {
      // Solo proveedores de la misma ciudad
      whereClause.city = maintenance.property.city;
    } else if (locationFilter === 'same_region' && maintenance.property.region) {
      // Proveedores de la misma región (incluye misma ciudad)
      // Construir OR solo con los campos que existen
      const locationOR: any[] = [];
      if (maintenance.property.city) {
        locationOR.push({ city: maintenance.property.city });
      }
      if (maintenance.property.region) {
        locationOR.push({ region: maintenance.property.region });
      }

      // Solo aplicar filtro de ubicación si hay al menos una condición
      if (locationOR.length > 0) {
        whereClause.AND = [
          {
            isVerified: true,
            status: {
              in: ['ACTIVE', 'active', 'VERIFIED', 'verified'],
            },
          },
          {
            OR: locationOR,
          },
        ];
        // Eliminar las propiedades del nivel superior ya que están en AND
        delete whereClause.isVerified;
        delete whereClause.status;
      }
    }
    // Si no hay filtro de ubicación o locationFilter es 'all' o null, mostrar todos los verificados y activos

    logger.info('Filtros aplicados:', {
      maintenanceId,
      whereClause: JSON.stringify(whereClause),
      locationFilter,
      propertyCity: maintenance.property.city,
      propertyRegion: maintenance.property.region,
    });

    const availableProviders = await db.maintenanceProvider.findMany({
      where: whereClause,
      select: {
        id: true,
        businessName: true,
        specialty: true,
        specialties: true,
        hourlyRate: true,
        completedJobs: true,
        responseTime: true,
        address: true,
        city: true,
        region: true,
        description: true,
        profileImage: true,
        availability: true,
        status: true, // Agregado para logging
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ completedJobs: 'desc' }, { hourlyRate: 'asc' }],
    });

    // Obtener calificaciones unificadas para cada proveedor
    const providerUserIds = availableProviders.map(p => p.user?.id).filter(Boolean) as string[];
    const ratingsMap = new Map<string, { averageRating: number; totalRatings: number }>();

    await Promise.all(
      providerUserIds.map(async userId => {
        try {
          const ratingSummary = await UserRatingService.getUserRatingSummary(userId);
          if (ratingSummary) {
            ratingsMap.set(userId, {
              averageRating: ratingSummary.averageRating,
              totalRatings: ratingSummary.totalRatings,
            });
          }
        } catch (error) {
          logger.warn('Error obteniendo calificación para proveedor:', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })
    );

    // Obtener conteo de trabajos activos para cada proveedor
    const providerIds = availableProviders.map(p => p.id);
    const activeJobsCounts = await Promise.all(
      providerIds.map(async providerId => {
        // Verificar trabajos con estados exactos (sin variaciones de mayúsculas/minúsculas)
        const activeJobsCount = await db.maintenance.count({
          where: {
            maintenanceProviderId: providerId,
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS', 'QUOTE_PENDING', 'QUOTE_APPROVED', 'SCHEDULED'],
            },
          },
        });

        // Logging para debugging
        if (activeJobsCount > 0) {
          const activeJobs = await db.maintenance.findMany({
            where: {
              maintenanceProviderId: providerId,
              status: {
                in: ['ASSIGNED', 'IN_PROGRESS', 'QUOTE_PENDING', 'QUOTE_APPROVED', 'SCHEDULED'],
              },
            },
            select: { id: true, status: true, title: true },
          });
          logger.info('Proveedor con trabajos activos:', {
            providerId,
            activeJobsCount,
            jobs: activeJobs.map(j => ({ id: j.id, status: j.status, title: j.title })),
          });
        }

        return { providerId, activeJobsCount };
      })
    );
    const activeJobsMap = new Map(
      activeJobsCounts.map(item => [item.providerId, item.activeJobsCount])
    );

    // Mapeo de categorías de mantenimiento a especialidades comunes
    // Incluye todas las variantes posibles en español e inglés
    const categoryMapping: Record<string, string[]> = {
      general: [
        'general',
        'mantenimiento general',
        'mantenimiento',
        'reparación',
        'reparaciones',
        'otro',
        'other',
      ],
      electrical: [
        'eléctrica',
        'electricidad',
        'reparaciones eléctricas',
        'electrical',
        'electric',
        'eléctrico',
        'instalación eléctrica',
      ],
      plumbing: [
        'plomería',
        'plumbing',
        'fontanería',
        'fontanero',
        'cañerías',
        'tuberías',
        'agua',
        'sanitario',
      ],
      structural: [
        'estructural',
        'structural',
        'construcción',
        'construcción',
        'albañilería',
        'mampostería',
        'techos',
        'paredes',
      ],
      appliance: [
        'electrodomésticos',
        'appliance',
        'reparación electrodomésticos',
        'refrigerador',
        'lavadora',
        'secadora',
        'horno',
        'microondas',
      ],
      cleaning: [
        'limpieza',
        'cleaning',
        'limpieza profesional',
        'aseo',
        'desinfección',
        'sanitización',
      ],
      painting: ['pintura', 'painting', 'pintor', 'pintado', 'acabados', 'reparación pintura'],
      carpentry: [
        'carpintería',
        'carpentry',
        'carpintero',
        'muebles',
        'puertas',
        'ventanas',
        'madera',
      ],
      hvac: [
        'climatización',
        'hvac',
        'aire acondicionado',
        'calefacción',
        'ventilación',
        'refrigeración',
      ],
      gardening: ['jardinería', 'gardening', 'jardín', 'paisajismo', 'riego', 'poda', 'césped'],
      other: ['otro', 'other', 'general', 'especializado', 'especial'],
    };

    // Función auxiliar para normalizar strings (sin acentos, minúsculas)
    const normalizeString = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

    // Filtrar y transformar proveedores
    const providersWithDistance = availableProviders
      .map(provider => {
        // Parsear specialties si es JSON
        let specialtiesArray: string[] = [];
        if (provider.specialties) {
          try {
            const parsed = JSON.parse(provider.specialties);
            specialtiesArray = Array.isArray(parsed) ? parsed : [provider.specialties];
          } catch {
            // Si no es JSON, usar como string único
            specialtiesArray = [provider.specialties];
          }
        }

        // Agregar specialty principal a la lista si no está
        if (provider.specialty && !specialtiesArray.includes(provider.specialty)) {
          specialtiesArray.unshift(provider.specialty);
        }

        // Aplicar filtro de especialidad si está presente
        if (specialtyFilter && specialtyFilter !== 'all') {
          const filterNormalized = normalizeString(specialtyFilter);
          const matchesSpecialtyFilter =
            specialtiesArray.some(spec => {
              const specNormalized = normalizeString(spec);
              return (
                specNormalized.includes(filterNormalized) ||
                filterNormalized.includes(specNormalized) ||
                specNormalized === filterNormalized
              );
            }) ||
            (provider.specialty &&
              (normalizeString(provider.specialty).includes(filterNormalized) ||
                filterNormalized.includes(normalizeString(provider.specialty)) ||
                normalizeString(provider.specialty) === filterNormalized));

          // Si no coincide con el filtro, retornar null para filtrarlo después
          if (!matchesSpecialtyFilter) {
            return null;
          }
        }

        // Verificar si el proveedor tiene la especialidad requerida (más flexible)
        let matchesCategory = true;
        let matchDetails: any = null;

        if (maintenance.category) {
          const categoryLower = maintenance.category.toLowerCase().trim();
          const mappedCategories = categoryMapping[categoryLower] || [categoryLower];

          const normalizedMappedCategories = mappedCategories.map(normalizeString);

          // Verificar si alguna especialidad coincide con la categoría o sus variantes
          const hasMatchingSpecialty = specialtiesArray.some(spec => {
            const specNormalized = normalizeString(spec);
            return normalizedMappedCategories.some(
              cat =>
                specNormalized.includes(cat) ||
                cat.includes(specNormalized) ||
                specNormalized === cat
            );
          });

          const hasMatchingMainSpecialty =
            provider.specialty &&
            normalizedMappedCategories.some(
              cat =>
                normalizeString(provider.specialty!).includes(cat) ||
                cat.includes(normalizeString(provider.specialty!)) ||
                normalizeString(provider.specialty!) === cat
            );

          // Hacer el filtro más flexible: mostrar todos los proveedores aunque no coincidan exactamente
          // Esto da más opciones al usuario. El filtro de especialidad del frontend puede refinar después.
          matchesCategory = true; // Mostrar todos los proveedores verificados y activos

          // Guardar detalles del match para logging
          matchDetails = {
            category: maintenance.category,
            categoryLower,
            mappedCategories,
            specialtiesArray,
            providerSpecialty: provider.specialty,
            hasMatchingSpecialty,
            hasMatchingMainSpecialty,
            matchesCategory,
          };
        }

        // Logging detallado para debug
        if (maintenance.category) {
          const hasMatch =
            matchDetails?.hasMatchingSpecialty || matchDetails?.hasMatchingMainSpecialty;
          if (hasMatch) {
            logger.info('Proveedor coincide con categoría:', {
              providerId: provider.id,
              businessName: provider.businessName,
              ...matchDetails,
            });
          } else {
            logger.info(
              'Proveedor mostrado aunque no coincide exactamente con categoría (filtro flexible):',
              {
                providerId: provider.id,
                businessName: provider.businessName,
                ...matchDetails,
                note: 'Se muestra para dar más opciones al usuario',
              }
            );
          }
        }

        // Verificar trabajos activos del proveedor
        const activeJobsCount = activeJobsMap.get(provider.id) || 0;
        const availabilityStatus = activeJobsCount > 0 ? 'busy' : 'available';

        // Parsear availability (es un JSON string) para otros propósitos
        let availabilityParsed: any = {};
        if (provider.availability) {
          try {
            availabilityParsed = JSON.parse(provider.availability);
          } catch {
            // Si no es JSON válido, usar valores por defecto
            availabilityParsed = { weekdays: true, weekends: false, emergencies: false };
          }
        }

        // Calcular distancia aproximada y construir ubicación
        let distance = 'N/A';
        let location = '';

        if (provider.city === maintenance.property.city && provider.city) {
          distance = 'Misma ciudad';
          location = provider.address ? `${provider.address}, ${provider.city}` : provider.city;
        } else if (provider.region === maintenance.property.region && provider.region) {
          distance = 'Misma región';
          location = provider.address
            ? `${provider.address}, ${provider.city || provider.region}`
            : provider.city || provider.region || '';
        } else {
          distance = 'Otra región';
          location = provider.address
            ? `${provider.address}, ${provider.city || provider.region || ''}`.trim()
            : provider.city || provider.region || 'No especificada';
        }

        // Si no hay dirección pero hay ciudad/región, mostrar al menos eso
        if (!location || location === 'No especificada') {
          location = provider.address || provider.city || provider.region || 'No especificada';
        }

        // Obtener calificación unificada
        const userId = provider.user?.id;
        const unifiedRating = userId ? ratingsMap.get(userId) : null;
        const rating = unifiedRating?.averageRating || 0;
        const totalRatings = unifiedRating?.totalRatings || 0;

        return {
          id: provider.id,
          name: provider.businessName || provider.user.name || 'Proveedor sin nombre',
          specialty: provider.specialty || specialtiesArray[0] || 'General',
          specialties: specialtiesArray,
          rating: rating,
          totalRatings: totalRatings,
          location: location,
          hourlyRate: provider.hourlyRate || 0,
          experience: `${provider.completedJobs || 0} trabajos completados`,
          distance,
          estimatedCost: (provider.hourlyRate || 0) * 2, // Estimación básica de 2 horas
          availability: availabilityParsed,
          availabilityStatus: availabilityStatus,
          responseTime: provider.responseTime ? `${provider.responseTime} horas` : 'N/A',
          description: provider.description || '',
          profileImage: provider.profileImage || '',
          user: provider.user, // Incluir información del usuario
        };
      })
      .filter(provider => provider !== null) as any[];

    // Ordenar por calificación unificada (ya calculada arriba)
    providersWithDistance.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return (b.totalRatings || 0) - (a.totalRatings || 0);
    });

    // Contar proveedores que coinciden con la categoría
    const matchingCategoryCount = providersWithDistance.filter(p => {
      // Los proveedores que no coinciden ya fueron logueados arriba
      return true; // Por ahora mostramos todos, pero podemos filtrar después si es necesario
    }).length;

    logger.info('Prestadores disponibles obtenidos:', {
      maintenanceId,
      userId: user.id,
      userRole: user.role,
      totalProvidersInDB: totalProvidersCount,
      verifiedProvidersInDB: verifiedProvidersCount,
      activeVerifiedProvidersInDB: activeVerifiedCount,
      totalProvidersFound: availableProviders.length,
      providersAfterFiltering: providersWithDistance.length,
      maintenanceCategory: maintenance.category,
      maintenanceType: (maintenance as any).type || 'N/A', // Tipo de trabajo (REPAIR, MAINTENANCE, etc.)
      propertyCity: maintenance.property.city,
      propertyRegion: maintenance.property.region,
      locationFilter,
      providersDetails: availableProviders.map(p => {
        // Parsear specialties para mostrar en el log
        let specialtiesArray: string[] = [];
        try {
          const parsed = JSON.parse(p.specialties || '[]');
          specialtiesArray = Array.isArray(parsed) ? parsed : [p.specialties];
        } catch {
          specialtiesArray = p.specialties ? [p.specialties] : [];
        }
        return {
          id: p.id,
          businessName: p.businessName,
          status: p.status,
          isVerified: true, // Ya filtrado
          city: p.city,
          region: p.region,
          specialty: p.specialty,
          specialties: specialtiesArray,
        };
      }),
    });

    // Si no se encontraron proveedores, loguear información adicional para debug
    if (availableProviders.length === 0) {
      // Obtener algunos ejemplos de proveedores para diagnóstico
      const sampleProviders = await db.maintenanceProvider.findMany({
        take: 5,
        select: {
          id: true,
          businessName: true,
          status: true,
          isVerified: true,
          city: true,
          region: true,
        },
      });

      logger.warn('No se encontraron proveedores disponibles:', {
        maintenanceId,
        totalProvidersInDB: totalProvidersCount,
        verifiedProvidersInDB: verifiedProvidersCount,
        activeVerifiedProvidersInDB: activeVerifiedCount,
        whereClause: JSON.stringify(whereClause),
        locationFilter,
        propertyCity: maintenance.property.city,
        propertyRegion: maintenance.property.region,
        sampleProviders: sampleProviders.map(p => ({
          id: p.id,
          businessName: p.businessName,
          status: p.status,
          isVerified: p.isVerified,
          city: p.city,
          region: p.region,
        })),
        suggestion:
          verifiedProvidersCount === 0
            ? 'No hay proveedores verificados. Un administrador debe aprobar los proveedores pendientes.'
            : activeVerifiedCount === 0
              ? 'Hay proveedores verificados pero ninguno está activo. Verifica el estado de los proveedores.'
              : 'Verificar que existan proveedores con isVerified=true y status en [ACTIVE, VERIFIED]. También verificar filtros de ubicación.',
      });
    }

    // Incluir información de diagnóstico en la respuesta si no hay proveedores
    const response: any = {
      maintenance: {
        id: maintenance.id,
        title: maintenance.title,
        category: maintenance.category,
        property: {
          address: maintenance.property.address,
          city: maintenance.property.city,
        },
      },
      availableProviders: providersWithDistance,
    };

    // Agregar información de diagnóstico si no hay proveedores
    if (availableProviders.length === 0) {
      response.diagnostic = {
        totalProvidersInDB: totalProvidersCount,
        verifiedProvidersInDB: verifiedProvidersCount,
        activeVerifiedProvidersInDB: activeVerifiedCount,
        message:
          verifiedProvidersCount === 0
            ? 'No hay proveedores verificados en el sistema. Un administrador debe aprobar los proveedores pendientes.'
            : activeVerifiedCount === 0
              ? 'Hay proveedores verificados pero ninguno está activo. Verifica el estado de los proveedores.'
              : 'No se encontraron proveedores que cumplan los criterios de búsqueda.',
        suggestion:
          totalProvidersCount > 0 && verifiedProvidersCount === 0
            ? 'Contacta a un administrador para aprobar los proveedores pendientes de verificación.'
            : 'Verifica los filtros aplicados o contacta a soporte.',
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Error obteniendo prestadores disponibles:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
