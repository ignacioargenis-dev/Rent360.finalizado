import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (
      user.role !== 'SERVICE_PROVIDER' &&
      user.role !== 'MAINTENANCE_PROVIDER' &&
      user.role !== 'PROVIDER' &&
      user.role !== 'MAINTENANCE'
    ) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    let services: any[] = [];

    if (user.role === 'SERVICE_PROVIDER' && fullUser.serviceProvider) {
      // Obtener tipos de servicios ofrecidos desde ServiceProvider
      const serviceTypesJson = fullUser.serviceProvider.serviceTypes || '[]';
      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(serviceTypesJson);
      } catch {
        // Si no es JSON válido, usar serviceType como único servicio
        serviceTypes = [fullUser.serviceProvider.serviceType].filter(Boolean);
      }

      // Obtener estadísticas de trabajos por tipo de servicio
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          serviceProviderId: fullUser.serviceProvider.id,
        },
        select: {
          serviceType: true,
          status: true,
          finalPrice: true,
          basePrice: true,
          rating: true,
        },
      });

      // Agrupar estadísticas por tipo de servicio
      const statsByType: Record<string, any> = {};
      serviceTypes.forEach(type => {
        const jobsForType = serviceJobs.filter(j => j.serviceType === type);
        const completedJobs = jobsForType.filter(j => j.status === 'COMPLETED');
        const ratings = completedJobs.map(j => j.rating).filter(Boolean) as number[];
        const avgRating =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        statsByType[type] = {
          totalJobs: jobsForType.length,
          completedJobs: completedJobs.length,
          avgRating,
          totalRevenue: completedJobs.reduce(
            (sum, j) => sum + (j.finalPrice || j.basePrice || 0),
            0
          ),
        };
      });

      // Crear servicios ofrecidos con estadísticas
      services = serviceTypes.map((serviceType, index) => {
        const stats = statsByType[serviceType] || {
          totalJobs: 0,
          completedJobs: 0,
          avgRating: 0,
          totalRevenue: 0,
        };

        // Parsear disponibilidad si existe
        let availability = {
          weekdays: true,
          weekends: false,
          emergencies: false,
        };
        try {
          const availJson = fullUser.serviceProvider?.availability;
          if (availJson) {
            availability = JSON.parse(availJson);
          }
        } catch {
          // Usar valores por defecto
        }

        const sp = fullUser.serviceProvider;
        return {
          id: `service-${index}`,
          name: serviceType,
          description: `${serviceType} - ${sp?.description || 'Servicio profesional'}`,
          category: serviceType,
          price: sp?.basePrice || 0,
          active: sp?.status === 'ACTIVE',
          totalJobs: stats.totalJobs,
          avgRating: stats.avgRating,
          responseTime: `${sp?.responseTime || 2}-${(sp?.responseTime || 2) + 2} horas`,
          availability,
          requirements: [],
          lastUpdated:
            sp?.updatedAt.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        };
      });

      // Si no hay tipos de servicios definidos, crear uno por defecto
      if (services.length === 0 && fullUser.serviceProvider?.serviceType) {
        const sp = fullUser.serviceProvider;
        services = [
          {
            id: 'service-default',
            name: sp.serviceType,
            description: sp.description || 'Servicio profesional',
            category: sp.serviceType,
            price: sp.basePrice || 0,
            active: sp.status === 'ACTIVE',
            totalJobs: 0,
            avgRating: 0,
            responseTime: `${sp.responseTime || 2}-${(sp.responseTime || 2) + 2} horas`,
            availability: {
              weekdays: true,
              weekends: false,
              emergencies: false,
            },
            requirements: [],
            lastUpdated: sp.updatedAt.toISOString().split('T')[0],
          },
        ];
      }
    } else if (
      (user.role === 'MAINTENANCE_PROVIDER' || user.role === 'MAINTENANCE') &&
      fullUser.maintenanceProvider
    ) {
      // Para maintenance providers, usar la especialidad
      const mp = fullUser.maintenanceProvider;
      const specialty = mp?.specialty || 'Mantenimiento General';
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp?.specialties || '[]');
      } catch {
        specialties = [specialty];
      }

      services = specialties.map((spec, index) => ({
        id: `maintenance-${index}`,
        name: spec,
        description: `${spec} - ${mp?.description || 'Servicio de mantenimiento'}`,
        category: spec,
        price: mp?.hourlyRate || 0,
        active: mp?.status === 'ACTIVE',
        totalJobs: mp?.completedJobs || 0,
        avgRating: mp?.rating || 0,
        responseTime: `${mp?.responseTime || 2}-${(mp?.responseTime || 2) + 2} horas`,
        availability: {
          weekdays: true,
          weekends: false,
          emergencies: true,
        },
        requirements: [],
        lastUpdated:
          mp?.updatedAt.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
      }));
    }

    logger.info('Servicios de proveedor obtenidos', {
      providerId: user.id,
      role: user.role,
      count: services.length,
    });

    return NextResponse.json({
      success: true,
      services,
      pagination: {
        limit: services.length,
        offset: 0,
        total: services.length,
        hasMore: false,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo servicios de proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
