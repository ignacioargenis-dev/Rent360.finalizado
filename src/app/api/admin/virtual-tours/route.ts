import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/admin/virtual-tours
 * Obtiene todos los tours virtuales del sistema para administración
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario es admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    logger.info('Obteniendo tours virtuales para admin', { userId: user.id });

    // Obtener todas las propiedades con información de tour virtual desde la tabla VirtualTour
    const properties = await db.property.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        commune: true,
        virtualTourEnabled: true,
        virtualTourData: true,
        updatedAt: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        virtualTour: {
          select: {
            id: true,
            enabled: true,
            updatedAt: true,
            scenes: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Procesar los datos para incluir estadísticas
    const processedProperties = properties.map(property => {
      // Contar escenas desde la tabla VirtualTour (prioridad) o del JSON legacy
      let scenesCount = 0;
      let status: 'active' | 'inactive' | 'pending' = 'inactive';
      let lastUpdated = property.updatedAt;

      // Verificar escenas en la tabla VirtualTour (nuevo sistema)
      if (property.virtualTour) {
        scenesCount = property.virtualTour.scenes?.length || 0;
        if (property.virtualTour.updatedAt) {
          lastUpdated = property.virtualTour.updatedAt;
        }
      }

      // Fallback al campo JSON legacy si no hay escenas en la tabla
      if (scenesCount === 0 && property.virtualTourData) {
        try {
          const tourData = JSON.parse(property.virtualTourData);
          scenesCount = tourData.scenes?.length || 0;
        } catch (error) {
          logger.error('Error parseando tour data legacy', { propertyId: property.id, error });
        }
      }

      // Determinar el estado
      if (property.virtualTourEnabled || property.virtualTour?.enabled) {
        status = scenesCount > 0 ? 'active' : 'pending';
      }

      return {
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        commune: property.commune,
        owner: property.owner,
        virtualTourEnabled: property.virtualTourEnabled || property.virtualTour?.enabled || false,
        virtualTourData: property.virtualTourData,
        scenesCount,
        lastUpdated: lastUpdated.toISOString(),
        status,
      };
    });

    // Calcular estadísticas
    const stats = {
      totalTours: properties.length,
      activeTours: processedProperties.filter(p => p.status === 'active').length,
      inactiveTours: processedProperties.filter(p => p.status === 'inactive').length,
      pendingTours: processedProperties.filter(p => p.status === 'pending').length,
      totalScenes: processedProperties.reduce((sum, p) => sum + p.scenesCount, 0),
      averageScenesPerTour:
        processedProperties.length > 0
          ? Math.round(
              (processedProperties.reduce((sum, p) => sum + p.scenesCount, 0) /
                processedProperties.length) *
                10
            ) / 10
          : 0,
    };

    logger.info('Tours virtuales obtenidos para admin', {
      userId: user.id,
      totalTours: stats.totalTours,
      activeTours: stats.activeTours,
    });

    return NextResponse.json({
      success: true,
      properties: processedProperties,
      stats,
    });
  } catch (error) {
    logger.error('Error obteniendo tours virtuales para admin:', { error });
    return handleApiError(error, 'Error al obtener los tours virtuales');
  }
}
