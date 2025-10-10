import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
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
      user.role === 'admin' ||
      (user.role === 'broker' && maintenance.property.brokerId === user.id) ||
      (user.role === 'owner' && maintenance.property.ownerId === user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver esta solicitud' },
        { status: 403 }
      );
    }

    // Buscar prestadores disponibles en la zona
    const availableProviders = await db.maintenanceProvider.findMany({
      where: {
        AND: [
          { isVerified: true },
          { status: 'ACTIVE' },
          {
            OR: [
              { city: maintenance.property.city },
              { region: maintenance.property.region },
              { city: null }, // Prestadores que atienden toda la región
            ],
          },
          {
            // Filtrar por especialidad si es relevante
            specialties: {
              contains: maintenance.category,
            },
          },
        ],
      },
      select: {
        id: true,
        businessName: true,
        specialty: true,
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
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ rating: 'desc' }, { completedJobs: 'desc' }, { hourlyRate: 'asc' }],
    });

    // Calcular distancia aproximada (simplificada)
    const providersWithDistance = availableProviders.map(provider => {
      let distance = 'N/A';
      if (provider.city === maintenance.property.city) {
        distance = 'Misma ciudad';
      } else if (provider.region === maintenance.property.region) {
        distance = 'Misma región';
      } else {
        distance = 'Otra región';
      }

      return {
        ...provider,
        distance,
        estimatedCost: provider.hourlyRate * 2, // Estimación básica de 2 horas
        availabilityStatus: 'available', // En producción verificar calendario
      };
    });

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
