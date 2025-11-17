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
      status: 'ACTIVE',
    };

    // Si hay ciudad o región en la propiedad, intentar filtrar (pero no es obligatorio)
    if (maintenance.property.city || maintenance.property.region) {
      whereClause.OR = [
        { city: maintenance.property.city },
        { region: maintenance.property.region },
        { city: null },
        { region: null },
      ];
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

    // Filtrar y transformar proveedores
    const providersWithDistance = availableProviders
      .map(provider => {
        // Parsear specialties si es JSON
        let specialtiesArray: string[] = [];
        if (provider.specialties) {
          try {
            specialtiesArray = JSON.parse(provider.specialties);
          } catch {
            // Si no es JSON, usar como string único
            specialtiesArray = [provider.specialties];
          }
        }

        // Verificar si el proveedor tiene la especialidad requerida (opcional)
        const matchesCategory =
          !maintenance.category ||
          specialtiesArray.some(s =>
            s.toLowerCase().includes(maintenance.category.toLowerCase())
          ) ||
          provider.specialty?.toLowerCase().includes(maintenance.category.toLowerCase());

        if (!matchesCategory && maintenance.category) {
          return null; // Filtrar si no coincide con la categoría
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
          availability: provider.availability || 'available',
          availabilityStatus: provider.availability === 'available' ? 'available' : 'busy',
          responseTime: provider.responseTime || 'N/A',
          description: provider.description || '',
          profileImage: provider.profileImage || '',
        };
      })
      .filter(provider => provider !== null);

    logger.info('Prestadores disponibles obtenidos:', {
      maintenanceId,
      userId: user.id,
      providersCount: providersWithDistance.length,
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
