import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
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

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      // ✅ CRÍTICO: Recargar el ServiceProvider desde la BD para obtener datos actualizados
      // Esto evita problemas de caché en Prisma
      const freshServiceProvider = await db.serviceProvider.findUnique({
        where: { id: fullUser.serviceProvider.id },
        select: {
          serviceTypes: true,
          serviceType: true,
          basePrice: true,
          status: true,
          description: true,
          responseTime: true,
          availability: true,
          updatedAt: true,
        },
      });

      if (!freshServiceProvider) {
        return NextResponse.json({ error: 'Service Provider no encontrado.' }, { status: 404 });
      }

      // Obtener tipos de servicios ofrecidos desde ServiceProvider
      const serviceTypesJson = freshServiceProvider.serviceTypes || '[]';
      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(serviceTypesJson);
      } catch {
        // Si no es JSON válido, usar serviceType como único servicio
        serviceTypes = [freshServiceProvider.serviceType].filter(Boolean);
      }

      logger.info('Servicios obtenidos para SERVICE_PROVIDER', {
        providerId: fullUser.serviceProvider.id,
        serviceTypesCount: serviceTypes.length,
        serviceTypes,
        serviceTypesJson,
        rawServiceTypes: freshServiceProvider.serviceTypes,
      });

      // ✅ Log detallado para diagnóstico
      console.log('🔍 [API PROVIDER SERVICES] ServiceProvider encontrado:', {
        providerId: fullUser.serviceProvider.id,
        serviceTypesJson,
        parsedServiceTypes: serviceTypes,
        serviceTypesCount: serviceTypes.length,
        rawServiceTypes: freshServiceProvider.serviceTypes,
      });

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

      // ✅ Parsear servicios como objetos con IDs únicos
      // serviceTypes puede ser array de strings (legacy) o array de objetos con IDs
      const parsedServices: Array<{
        id: string;
        name: string;
        category?: string;
        description?: string;
        pricing?: any;
        duration?: any;
        availability?: any;
        active?: boolean;
        createdAt?: string;
        updatedAt?: string;
      }> = [];

      serviceTypes.forEach((item, index) => {
        if (typeof item === 'string') {
          // ✅ Migración: convertir string a objeto con ID único
          // Generar ID único basado en timestamp y hash del nombre
          const serviceId = `svc_${Date.now()}_${item.replace(/\s+/g, '_').toLowerCase()}_${index}`;
          parsedServices.push({
            id: serviceId,
            name: item,
            category: item,
            active: freshServiceProvider.status === 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: freshServiceProvider.updatedAt.toISOString(),
          });
        } else if (typeof item === 'object' && item !== null) {
          // Ya es un objeto con ID
          const serviceObj = item as any;
          parsedServices.push({
            id: serviceObj.id || `svc_${Date.now()}_${index}`,
            name: serviceObj.name || String(item),
            category: serviceObj.category || serviceObj.name || String(item),
            description: serviceObj.description,
            pricing: serviceObj.pricing,
            duration: serviceObj.duration,
            availability: serviceObj.availability,
            active:
              serviceObj.active !== undefined
                ? serviceObj.active
                : freshServiceProvider.status === 'ACTIVE',
            createdAt: serviceObj.createdAt || new Date().toISOString(),
            updatedAt: serviceObj.updatedAt || freshServiceProvider.updatedAt.toISOString(),
          });
        }
      });

      // Crear servicios ofrecidos con estadísticas
      services = parsedServices.map(serviceObj => {
        const serviceName = serviceObj.name;
        const stats = statsByType[serviceName] || {
          totalJobs: 0,
          completedJobs: 0,
          avgRating: 0,
          totalRevenue: 0,
        };

        // Parsear disponibilidad si existe
        let availability = serviceObj.availability || {
          weekdays: true,
          weekends: false,
          emergencies: false,
        };

        if (typeof availability === 'string') {
          try {
            availability = JSON.parse(availability);
          } catch {
            availability = {
              weekdays: true,
              weekends: false,
              emergencies: false,
            };
          }
        }

        // Si no hay disponibilidad en el objeto, parsear desde el provider
        if (!serviceObj.availability) {
          try {
            const availJson = freshServiceProvider.availability;
            if (availJson) {
              availability = JSON.parse(availJson);
            }
          } catch {
            // Usar valores por defecto
          }
        }

        return {
          id: serviceObj.id, // ✅ Usar ID único del servicio
          name: serviceName,
          description:
            serviceObj.description ||
            `${serviceName} - ${freshServiceProvider.description || 'Servicio profesional'}`,
          category: serviceObj.category || serviceName,
          price: serviceObj.pricing?.amount || freshServiceProvider.basePrice || 0,
          active:
            serviceObj.active !== undefined
              ? serviceObj.active
              : freshServiceProvider.status === 'ACTIVE',
          totalJobs: stats.totalJobs,
          avgRating: stats.avgRating,
          duration:
            serviceObj.duration?.estimated ||
            `${freshServiceProvider.responseTime || 2}-${(freshServiceProvider.responseTime || 2) + 2} horas`,
          responseTime: `${freshServiceProvider.responseTime || 2}-${(freshServiceProvider.responseTime || 2) + 2} horas`,
          availability,
          requirements: [],
          lastUpdated:
            serviceObj.updatedAt ||
            freshServiceProvider.updatedAt.toISOString().split('T')[0] ||
            new Date().toISOString().split('T')[0],
        };
      });

      // ✅ NO crear servicio por defecto - solo mostrar servicios creados explícitamente
      // Si no hay servicios, devolver array vacío
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Para maintenance providers, usar la especialidad
      const mp = fullUser.maintenanceProvider;
      const specialty = mp?.specialty || 'Mantenimiento General';
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp?.specialties || '[]');
      } catch {
        specialties = [specialty];
      }

      // ✅ Parsear servicios de mantenimiento como objetos con IDs únicos
      const parsedMaintenanceServices: Array<{
        id: string;
        name: string;
        category?: string;
        description?: string;
        pricing?: any;
        duration?: any;
        availability?: any;
        active?: boolean;
        createdAt?: string;
        updatedAt?: string;
      }> = [];

      specialties.forEach((item, index) => {
        if (typeof item === 'string') {
          // Migración: convertir string a objeto con ID único
          const serviceId = `mnt_${mp.id}_${Date.now()}_${item.replace(/\s+/g, '_').toLowerCase()}_${index}`;
          parsedMaintenanceServices.push({
            id: serviceId,
            name: item,
            category: item,
            active: mp.status === 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: mp.updatedAt.toISOString(),
          });
        } else if (typeof item === 'object' && item !== null) {
          // Ya es un objeto con ID
          const serviceObj = item as any;
          parsedMaintenanceServices.push({
            id: serviceObj.id || `mnt_${mp.id}_${Date.now()}_${index}`,
            name: serviceObj.name || String(item),
            category: serviceObj.category || serviceObj.name || String(item),
            description: serviceObj.description,
            pricing: serviceObj.pricing,
            duration: serviceObj.duration,
            availability: serviceObj.availability,
            active: serviceObj.active !== undefined ? serviceObj.active : mp.status === 'ACTIVE',
            createdAt: serviceObj.createdAt || new Date().toISOString(),
            updatedAt: serviceObj.updatedAt || mp.updatedAt.toISOString(),
          });
        }
      });

      services = parsedMaintenanceServices.map(serviceObj => ({
        id: serviceObj.id, // ✅ Usar ID único del servicio
        name: serviceObj.name,
        description:
          serviceObj.description ||
          `${serviceObj.name} - ${mp?.description || 'Servicio de mantenimiento'}`,
        category: serviceObj.category || serviceObj.name,
        price: serviceObj.pricing?.amount || mp?.hourlyRate || 0,
        active: serviceObj.active !== undefined ? serviceObj.active : mp?.status === 'ACTIVE',
        totalJobs: mp?.completedJobs || 0,
        avgRating: mp?.rating || 0,
        duration:
          serviceObj.duration?.estimated ||
          `${mp?.responseTime || 2}-${(mp?.responseTime || 2) + 2} horas`,
        responseTime: `${mp?.responseTime || 2}-${(mp?.responseTime || 2) + 2} horas`,
        availability: serviceObj.availability || {
          weekdays: true,
          weekends: false,
          emergencies: true,
        },
        requirements: [],
        lastUpdated:
          serviceObj.updatedAt ||
          mp?.updatedAt.toISOString().split('T')[0] ||
          new Date().toISOString().split('T')[0],
      }));
    }

    logger.info('Servicios de proveedor obtenidos', {
      providerId: user.id,
      role: user.role,
      count: services.length,
    });

    // ✅ Log detallado para diagnóstico en consola del servidor
    console.log('📊 [API PROVIDER SERVICES] Servicios finales a enviar:', {
      providerId: user.id,
      role: user.role,
      servicesCount: services.length,
      services: services.map(s => ({
        id: s.id,
        name: s.name,
        active: s.active,
        price: s.price,
      })),
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
    const {
      name,
      category,
      description,
      shortDescription,
      pricing,
      duration,
      features,
      requirements,
      tags,
      images,
      availability,
    } = body;

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

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      // Obtener servicios actuales (pueden ser strings o objetos)
      const serviceTypesJson = fullUser.serviceProvider.serviceTypes || '[]';
      let serviceTypes: Array<string | any> = [];
      try {
        serviceTypes = JSON.parse(serviceTypesJson);
      } catch {
        serviceTypes = [fullUser.serviceProvider.serviceType].filter(Boolean);
      }

      // ✅ Generar ID único para el nuevo servicio
      const serviceId = `svc_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Verificar si el servicio ya existe (por nombre)
      const serviceNames = serviceTypes.map((s: any) => (typeof s === 'string' ? s : s.name));
      if (serviceNames.includes(name)) {
        return NextResponse.json({ error: 'Este servicio ya está registrado' }, { status: 400 });
      }

      // ✅ Agregar nuevo servicio como objeto con ID único con todos los campos
      const newService = {
        id: serviceId,
        name,
        category,
        description: description || '',
        shortDescription: shortDescription || description?.substring(0, 100) || '',
        // ✅ Asegurar que el precio se guarde como número entero (sin decimales)
        pricing: pricing
          ? {
              type: pricing.type || 'fixed',
              amount: Math.round(Number(pricing.amount)) || 0, // Redondear a entero
              currency: pricing.currency || 'CLP',
              minimumCharge: pricing.minimumCharge
                ? Math.round(Number(pricing.minimumCharge))
                : undefined,
            }
          : { type: 'fixed', amount: 0, currency: 'CLP' },
        duration: duration || (pricing?.amount ? { estimated: '2-4', unit: 'hours' } : undefined),
        // ✅ Incluir features y requirements del body
        features: features || [],
        requirements: requirements || [],
        tags: tags || [],
        images: images || [], // URLs de imágenes subidas
        availability: availability || {
          weekdays: true,
          weekends: false,
          emergencies: availability?.emergency || false,
          regions: availability?.regions || [],
        },
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      serviceTypes.push(newService);

      // Actualizar el perfil del proveedor con el nuevo servicio (con ID único)
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
        serviceId,
        serviceName: name,
        serviceCategory: category,
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio creado exitosamente',
        service: {
          id: serviceId,
          name,
          category,
          description,
        },
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // ✅ Para maintenance providers, usar specialties con IDs únicos
      const specialtiesJson = fullUser.maintenanceProvider.specialties || '[]';
      let specialties: Array<string | any> = [];
      try {
        specialties = JSON.parse(specialtiesJson);
      } catch {
        specialties = [fullUser.maintenanceProvider.specialty || 'Mantenimiento General'].filter(
          Boolean
        );
      }

      // ✅ Generar ID único para el nuevo servicio
      const serviceId = `mnt_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Verificar si el servicio ya existe (por nombre)
      const serviceNames = specialties.map((s: any) => (typeof s === 'string' ? s : s.name));
      if (serviceNames.includes(name)) {
        return NextResponse.json(
          { error: 'Esta especialidad ya está registrada' },
          { status: 400 }
        );
      }

      // ✅ Agregar nuevo servicio como objeto con ID único
      const newService = {
        id: serviceId,
        name,
        category,
        description: description || '',
        pricing: pricing || { type: 'fixed', amount: 0, currency: 'CLP' },
        duration: pricing?.amount ? { estimated: '2-4', unit: 'hours' } : undefined,
        availability: availability || {
          weekdays: true,
          weekends: false,
          emergencies: false,
        },
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      specialties.push(newService);

      // Actualizar el perfil del proveedor con el nuevo servicio (con ID único)
      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: {
          specialties: JSON.stringify(specialties),
          // Actualizar tarifa por hora si se proporciona y es mayor
          ...(pricing?.amount && pricing.amount > (fullUser.maintenanceProvider.hourlyRate || 0)
            ? { hourlyRate: pricing.amount }
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

      logger.info('Especialidad agregada exitosamente', {
        providerId: user.id,
        serviceId,
        specialtyName: name,
      });

      return NextResponse.json({
        success: true,
        message: 'Especialidad creada exitosamente',
        service: {
          id: serviceId,
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
