import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

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
      // Usar AND para combinar con los filtros de estado e isVerified
      whereClause.AND = [
        {
          isVerified: true,
          status: {
            in: ['ACTIVE', 'active', 'VERIFIED', 'verified'],
          },
        },
        {
          OR: [{ city: maintenance.property.city }, { region: maintenance.property.region }],
        },
      ];
      // Eliminar las propiedades del nivel superior ya que están en AND
      delete whereClause.isVerified;
      delete whereClause.status;
    }
    // Si no hay filtro de ubicación, mostrar todos los verificados y activos

    logger.info('Filtros aplicados:', {
      maintenanceId,
      whereClause: JSON.stringify(whereClause),
      locationFilter,
    });

    const availableProviders = await db.maintenanceProvider.findMany({
      where: whereClause,
      select: {
        id: true,
        businessName: true,
        specialty: true,
        specialties: true,
        hourlyRate: true,
        rating: true,
        totalRatings: true,
        completedJobs: true,
        responseTime: true,
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
      orderBy: [{ rating: 'desc' }, { completedJobs: 'desc' }, { hourlyRate: 'asc' }],
    });

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

          matchesCategory = hasMatchingSpecialty || hasMatchingMainSpecialty || false;

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
          if (matchesCategory) {
            logger.info('Proveedor coincide con categoría:', {
              providerId: provider.id,
              businessName: provider.businessName,
              ...matchDetails,
            });
          } else {
            logger.warn('Proveedor NO coincide con categoría (pero se muestra):', {
              providerId: provider.id,
              businessName: provider.businessName,
              ...matchDetails,
              suggestion:
                'Verificar que las especialidades del proveedor incluyan términos relacionados con la categoría',
            });
          }
        }

        // Parsear availability (es un JSON string)
        let availabilityParsed: any = {};
        let availabilityStatus = 'available';
        if (provider.availability) {
          try {
            availabilityParsed = JSON.parse(provider.availability);
            // Determinar disponibilidad basado en el objeto parseado
            if (
              availabilityParsed.weekdays ||
              availabilityParsed.weekends ||
              availabilityParsed.emergencies
            ) {
              availabilityStatus = 'available';
            } else {
              availabilityStatus = 'busy';
            }
          } catch {
            // Si no es JSON válido, asumir disponible
            availabilityStatus = 'available';
          }
        }

        // Calcular distancia aproximada
        let distance = 'N/A';
        let location = '';
        if (provider.city === maintenance.property.city) {
          distance = 'Misma ciudad';
          location = provider.city || '';
        } else if (provider.region === maintenance.property.region) {
          distance = 'Misma región';
          location = provider.region || '';
        } else {
          distance = 'Otra región';
          location = provider.city || provider.region || 'No especificada';
        }

        return {
          id: provider.id,
          name: provider.businessName || provider.user.name || 'Proveedor sin nombre',
          specialty: provider.specialty || specialtiesArray[0] || 'General',
          specialties: specialtiesArray,
          rating: provider.rating || 0,
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
        };
      })
      .filter(provider => provider !== null) as any[];

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
      logger.warn('No se encontraron proveedores disponibles:', {
        maintenanceId,
        totalProvidersInDB: totalProvidersCount,
        verifiedProvidersInDB: verifiedProvidersCount,
        activeVerifiedProvidersInDB: activeVerifiedCount,
        whereClause: JSON.stringify(whereClause),
        suggestion:
          'Verificar que existan proveedores con isVerified=true y status en [ACTIVE, VERIFIED]',
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
