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

    // Buscar prestadores disponibles (más flexible - mostrar todos los activos y verificados)
    // El filtro por especialidad y ubicación se puede hacer opcionalmente
    const whereClause: any = {
      isVerified: true,
    };

    // Construir filtro de estado (aceptar múltiples variantes)
    const statusFilter = {
      OR: [
        { status: 'ACTIVE' },
        { status: 'active' },
        { status: 'VERIFIED' },
        { status: 'verified' },
      ],
    };

    // Aplicar filtro de ubicación según el parámetro (solo si hay datos de ubicación)
    if (locationFilter === 'same_city' && maintenance.property.city) {
      // Solo proveedores de la misma ciudad
      whereClause.AND = [statusFilter, { city: maintenance.property.city }];
    } else if (locationFilter === 'same_region' && maintenance.property.region) {
      // Proveedores de la misma región (incluye misma ciudad)
      whereClause.AND = [
        statusFilter,
        {
          OR: [{ city: maintenance.property.city }, { region: maintenance.property.region }],
        },
      ];
    } else {
      // Sin filtro de ubicación - mostrar todos
      whereClause.AND = [statusFilter];
    }

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
    const categoryMapping: Record<string, string[]> = {
      general: ['general', 'mantenimiento general', 'mantenimiento'],
      electrical: ['eléctrica', 'electricidad', 'reparaciones eléctricas', 'electrical'],
      plumbing: ['plomería', 'plumbing', 'fontanería'],
      structural: ['estructural', 'structural', 'construcción'],
      appliance: ['electrodomésticos', 'appliance', 'reparación'],
      cleaning: ['limpieza', 'cleaning', 'limpieza profesional'],
      other: ['otro', 'other', 'general'],
    };

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

        // Verificar si el proveedor tiene la especialidad requerida (más flexible)
        let matchesCategory = true;
        if (maintenance.category) {
          const categoryLower = maintenance.category.toLowerCase();
          const mappedCategories = categoryMapping[categoryLower] || [categoryLower];

          // Verificar si alguna especialidad coincide con la categoría o sus variantes
          const hasMatchingSpecialty = specialtiesArray.some(spec => {
            const specLower = spec.toLowerCase();
            return mappedCategories.some(cat => specLower.includes(cat) || cat.includes(specLower));
          });

          const hasMatchingMainSpecialty =
            provider.specialty &&
            mappedCategories.some(
              cat =>
                provider.specialty!.toLowerCase().includes(cat) ||
                cat.includes(provider.specialty!.toLowerCase())
            );

          matchesCategory = hasMatchingSpecialty || hasMatchingMainSpecialty || false;
        }

        // Si hay categoría pero no coincide, aún así mostrar el proveedor (filtro no estricto)
        // Solo loguear para debug
        if (!matchesCategory && maintenance.category) {
          logger.info('Proveedor no coincide con categoría pero se muestra:', {
            providerId: provider.id,
            providerSpecialty: provider.specialty,
            providerSpecialties: specialtiesArray,
            maintenanceCategory: maintenance.category,
          });
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
      .filter(provider => provider !== null);

    logger.info('Prestadores disponibles obtenidos:', {
      maintenanceId,
      userId: user.id,
      totalProvidersFound: availableProviders.length,
      providersAfterFiltering: providersWithDistance.length,
      maintenanceCategory: maintenance.category,
      propertyCity: maintenance.property.city,
      propertyRegion: maintenance.property.region,
      locationFilter,
    });

    return NextResponse.json({
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
    });
  } catch (error) {
    logger.error('Error obteniendo prestadores disponibles:', {
      maintenanceId: params.id,
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
