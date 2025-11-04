import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

// Forzar renderizado dinámico para evitar caché
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

    const response = NextResponse.json({
      success: true,
      services,
      pagination: {
        limit: services.length,
        offset: 0,
        total: services.length,
        hasMore: false,
      },
    });

    // Agregar headers para evitar caché
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    logger.error('Error obteniendo servicios de proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, category, description, pricing, availability } = body;

    // Validación básica
    if (!name || !category) {
      return NextResponse.json(
        { error: 'El nombre y la categoría del servicio son obligatorios' },
        { status: 400 }
      );
    }

    // Obtener datos completos del usuario
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

    if (
      (user.role === 'SERVICE_PROVIDER' || user.role === 'PROVIDER') &&
      fullUser.serviceProvider
    ) {
      // Obtener servicios actuales
      const serviceTypesJson = fullUser.serviceProvider.serviceTypes || '[]';
      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(serviceTypesJson);
      } catch {
        serviceTypes = [fullUser.serviceProvider.serviceType].filter(Boolean);
      }

      // Verificar si el servicio ya existe
      if (serviceTypes.includes(name)) {
        return NextResponse.json({ error: 'Este servicio ya está registrado' }, { status: 400 });
      }

      // Agregar nuevo servicio
      serviceTypes.push(name);

      // Actualizar el perfil del proveedor
      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: {
          serviceTypes: JSON.stringify(serviceTypes),
          // Actualizar precio base si se proporciona y es mayor
          ...(pricing?.amount && pricing.amount > (fullUser.serviceProvider.basePrice || 0)
            ? { basePrice: pricing.amount }
            : {}),
          // Actualizar disponibilidad si se proporciona
          ...(availability
            ? {
                availability: JSON.stringify({
                  weekdays: availability.weekdays !== false,
                  weekends: availability.weekends || false,
                  emergencies: availability.emergency || false,
                }),
              }
            : {}),
        },
      });

      logger.info('Servicio agregado exitosamente', {
        providerId: user.id,
        serviceName: name,
        serviceCategory: category,
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio creado exitosamente',
        service: {
          name,
          category,
          description,
        },
      });
    } else if (
      (user.role === 'MAINTENANCE_PROVIDER' || user.role === 'MAINTENANCE') &&
      fullUser.maintenanceProvider
    ) {
      // Para maintenance providers, usar specialties
      const specialtiesJson = fullUser.maintenanceProvider.specialties || '[]';
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(specialtiesJson);
      } catch {
        specialties = [fullUser.maintenanceProvider.specialty || 'Mantenimiento General'].filter(
          Boolean
        );
      }

      // Verificar si la especialidad ya existe
      if (specialties.includes(name)) {
        return NextResponse.json(
          { error: 'Esta especialidad ya está registrada' },
          { status: 400 }
        );
      }

      // Agregar nueva especialidad
      specialties.push(name);

      // Actualizar el perfil del proveedor
      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: {
          specialties: JSON.stringify(specialties),
          // Actualizar tarifa por hora si se proporciona y es mayor
          ...(pricing?.amount && pricing.amount > (fullUser.maintenanceProvider.hourlyRate || 0)
            ? { hourlyRate: pricing.amount }
            : {}),
        },
      });

      logger.info('Especialidad agregada exitosamente', {
        providerId: user.id,
        specialtyName: name,
      });

      return NextResponse.json({
        success: true,
        message: 'Especialidad creada exitosamente',
        service: {
          name,
          category,
          description,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: 'Perfil de proveedor no encontrado',
          message:
            'No se encontró un perfil de proveedor asociado a tu cuenta. Si acabas de registrarte, por favor recarga la página. Si el problema persiste, contacta al soporte.',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    logger.error('Error creando servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
