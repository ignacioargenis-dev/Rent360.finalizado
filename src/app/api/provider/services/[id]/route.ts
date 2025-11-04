import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // ✅ El ID es el ID único del servicio
    const serviceId = params.id;

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

    let serviceData: any = null;

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      // Buscar el servicio en el array de serviceTypes
      const freshServiceProvider = await db.serviceProvider.findUnique({
        where: { id: fullUser.serviceProvider.id },
        select: {
          serviceTypes: true,
          serviceType: true,
          basePrice: true,
          description: true,
          responseTime: true,
          availability: true,
          status: true,
          updatedAt: true,
        },
      });

      if (!freshServiceProvider) {
        return NextResponse.json({ error: 'Service Provider no encontrado.' }, { status: 404 });
      }

      // ✅ Parsear servicios como objetos con IDs únicos
      let serviceTypes: Array<string | any> = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceObj: any = null;
      for (const item of serviceTypes) {
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceObj = item;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `svc_${fullUser.serviceProvider.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceObj = { id: serviceId, name: item };
            break;
          }
        }
      }

      if (!serviceObj) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      const serviceName = serviceObj.name || String(serviceObj);

      // Obtener estadísticas del servicio
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          serviceProviderId: fullUser.serviceProvider.id,
          serviceType: serviceName,
        },
        select: {
          id: true,
          status: true,
          rating: true,
          finalPrice: true,
          basePrice: true,
        },
      });

      const completedJobs = serviceJobs.filter(j => j.status === 'COMPLETED');
      const ratings = completedJobs.map(j => j.rating).filter(Boolean) as number[];
      const avgRating =
        ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

      // Parsear disponibilidad
      let availability = {
        weekdays: true,
        weekends: false,
        emergencies: false,
      };
      try {
        if (freshServiceProvider.availability) {
          availability = JSON.parse(freshServiceProvider.availability);
        }
      } catch {
        // Usar valores por defecto
      }

      serviceData = {
        id: serviceId, // ✅ Usar ID único del servicio
        name: serviceName,
        category: serviceObj.category || serviceName,
        description:
          serviceObj.description ||
          `${serviceName} - ${freshServiceProvider.description || 'Servicio profesional'}`,
        shortDescription:
          serviceObj.description || freshServiceProvider.description || 'Servicio profesional',
        pricing: serviceObj.pricing || {
          type: 'fixed',
          amount: freshServiceProvider.basePrice || 0,
          currency: 'CLP',
        },
        duration: serviceObj.duration || {
          estimated: `${freshServiceProvider.responseTime || 2}-${(freshServiceProvider.responseTime || 2) + 2}`,
          unit: 'hours',
        },
        features: serviceObj.features || [],
        requirements: serviceObj.requirements || [],
        availability: {
          active:
            serviceObj.active !== undefined
              ? serviceObj.active
              : freshServiceProvider.status === 'ACTIVE',
          ...(serviceObj.availability || availability),
        },
        images: serviceObj.images || [],
        tags: serviceObj.tags || [],
        stats: {
          views: 0,
          requests: serviceJobs.length,
          conversionRate: 0,
          averageRating: avgRating,
          totalReviews: ratings.length,
          completedJobs: completedJobs.length,
        },
        createdAt: serviceObj.createdAt || new Date().toISOString(),
        updatedAt: serviceObj.updatedAt || freshServiceProvider.updatedAt.toISOString(),
      };
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // ✅ Similar lógica para maintenance provider - buscar por ID único
      const mp = fullUser.maintenanceProvider;
      let specialties: Array<string | any> = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceObj: any = null;
      for (const item of specialties) {
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceObj = item;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `mnt_${mp.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceObj = { id: serviceId, name: item };
            break;
          }
        }
      }

      if (!serviceObj) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      const serviceName = serviceObj.name || String(serviceObj);

      // Obtener estadísticas
      const maintenanceJobs = await db.maintenance.findMany({
        where: {
          maintenanceProviderId: mp.id,
          category: serviceName,
        },
        select: {
          id: true,
          status: true,
          actualCost: true,
        },
      });

      const completedJobs = maintenanceJobs.filter(j => j.status === 'COMPLETED');

      serviceData = {
        id: serviceId, // ✅ Usar ID único del servicio
        name: serviceName,
        category: serviceObj.category || serviceName,
        description:
          serviceObj.description || `${serviceName} - ${mp.description || 'Servicio profesional'}`,
        shortDescription: serviceObj.description || mp.description || 'Servicio profesional',
        pricing: serviceObj.pricing || {
          type: 'fixed',
          amount: mp.hourlyRate || 0,
          currency: 'CLP',
        },
        duration: serviceObj.duration || {
          estimated: `${mp.responseTime || 2}-${(mp.responseTime || 2) + 2}`,
          unit: 'hours',
        },
        features: serviceObj.features || [],
        requirements: serviceObj.requirements || [],
        availability: {
          active: serviceObj.active !== undefined ? serviceObj.active : mp.status === 'ACTIVE',
          regions: serviceObj.availability?.regions || [],
          emergency: serviceObj.availability?.emergency || false,
        },
        images: serviceObj.images || [],
        tags: serviceObj.tags || [],
        stats: {
          views: 0,
          requests: maintenanceJobs.length,
          conversionRate: 0,
          averageRating: 0,
          totalReviews: 0,
          completedJobs: completedJobs.length,
        },
        createdAt: serviceObj.createdAt || new Date().toISOString(),
        updatedAt: serviceObj.updatedAt || mp.updatedAt.toISOString(),
      };
    }

    if (!serviceData) {
      return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...serviceData,
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // ✅ El ID es el ID único del servicio
    const serviceId = params.id;
    const body = await request.json();
    const { active } = body;

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
      // Verificar que el servicio existe
      const freshServiceProvider = await db.serviceProvider.findUnique({
        where: { id: fullUser.serviceProvider.id },
        select: {
          serviceTypes: true,
          serviceType: true,
        },
      });

      if (!freshServiceProvider) {
        return NextResponse.json({ error: 'Service Provider no encontrado.' }, { status: 404 });
      }

      // ✅ Parsear servicios como objetos con IDs únicos
      let serviceTypes: Array<string | any> = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceIndex = -1;
      for (let i = 0; i < serviceTypes.length; i++) {
        const item = serviceTypes[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceIndex = i;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `svc_${fullUser.serviceProvider.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceIndex = i;
            break;
          }
        }
      }

      if (serviceIndex === -1) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // ✅ Actualizar el estado del servicio en el array
      if (typeof serviceTypes[serviceIndex] === 'object' && serviceTypes[serviceIndex] !== null) {
        serviceTypes[serviceIndex].active = active;
        serviceTypes[serviceIndex].updatedAt = new Date().toISOString();
      } else {
        // Si es un string, convertirlo a objeto con ID
        const serviceName = serviceTypes[serviceIndex];
        serviceTypes[serviceIndex] = {
          id: serviceId,
          name: serviceName,
          active,
          updatedAt: new Date().toISOString(),
        };
      }

      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: {
          serviceTypes: JSON.stringify(serviceTypes),
          // También actualizar el estado general del proveedor si todos los servicios están inactivos
          ...(active === false &&
          serviceTypes.every((s: any) => {
            if (typeof s === 'object' && s !== null) {
              return s.active === false;
            }
            return false;
          })
            ? { status: 'INACTIVE' }
            : active
              ? { status: 'ACTIVE' }
              : {}),
        },
      });

      logger.info('Estado de servicio actualizado', {
        serviceProviderId: user.id,
        serviceId,
        active,
      });

      return NextResponse.json({
        success: true,
        message: `Servicio ${active ? 'activado' : 'desactivado'} exitosamente`,
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // ✅ Similar para maintenance provider - buscar por ID único
      const mp = fullUser.maintenanceProvider;
      let specialties: Array<string | any> = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceIndex = -1;
      for (let i = 0; i < specialties.length; i++) {
        const item = specialties[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceIndex = i;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `mnt_${mp.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceIndex = i;
            break;
          }
        }
      }

      if (serviceIndex === -1) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // ✅ Actualizar el estado del servicio en el array
      if (typeof specialties[serviceIndex] === 'object' && specialties[serviceIndex] !== null) {
        specialties[serviceIndex].active = active;
        specialties[serviceIndex].updatedAt = new Date().toISOString();
      }

      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: {
          specialties: JSON.stringify(specialties),
          // También actualizar el estado general del proveedor si todos los servicios están inactivos
          ...(active === false &&
          specialties.every((s: any) => {
            if (typeof s === 'object' && s !== null) {
              return s.active === false;
            }
            return false;
          })
            ? { status: 'INACTIVE' }
            : active
              ? { status: 'ACTIVE' }
              : {}),
        },
      });

      logger.info('Estado de servicio actualizado', {
        maintenanceProviderId: user.id,
        serviceId,
        active,
      });

      return NextResponse.json({
        success: true,
        message: `Servicio ${active ? 'activado' : 'desactivado'} exitosamente`,
      });
    }

    return NextResponse.json({ error: 'Tipo de proveedor no reconocido.' }, { status: 400 });
  } catch (error) {
    logger.error('Error actualizando estado de servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // ✅ El ID es el ID único del servicio
    const serviceId = params.id;
    const body = await request.json();
    const { name, category, description, pricing, duration, availability } = body;

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
      // Verificar que el servicio existe
      const freshServiceProvider = await db.serviceProvider.findUnique({
        where: { id: fullUser.serviceProvider.id },
        select: {
          serviceTypes: true,
          serviceType: true,
        },
      });

      if (!freshServiceProvider) {
        return NextResponse.json({ error: 'Service Provider no encontrado.' }, { status: 404 });
      }

      // ✅ Parsear servicios como objetos con IDs únicos
      let serviceTypes: Array<string | any> = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceIndex = -1;
      for (let i = 0; i < serviceTypes.length; i++) {
        const item = serviceTypes[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceIndex = i;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `svc_${fullUser.serviceProvider.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceIndex = i;
            break;
          }
        }
      }

      if (serviceIndex === -1) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // ✅ Actualizar el servicio en el array
      const currentService = serviceTypes[serviceIndex];
      const updatedService: any =
        typeof currentService === 'object' && currentService !== null
          ? { ...currentService }
          : { id: serviceId, name: currentService };

      if (name) updatedService.name = name;
      if (category) updatedService.category = category;
      if (description) updatedService.description = description;
      if (pricing) updatedService.pricing = pricing;
      if (duration) updatedService.duration = duration;
      if (availability) updatedService.availability = availability;

      updatedService.updatedAt = new Date().toISOString();
      serviceTypes[serviceIndex] = updatedService;

      // Preparar datos de actualización
      const updateData: any = {
        serviceTypes: JSON.stringify(serviceTypes), // ✅ Actualizar array completo con servicio modificado
      };

      // Actualizar campos del proveedor si se proporcionan
      if (description && !updatedService.description) {
        updateData.description = description;
      }

      if (pricing?.amount) {
        updateData.basePrice = pricing.amount;
      }

      if (duration?.estimated) {
        // Parsear duración (ej: "2-4" -> 2)
        const timeMatch = duration.estimated.match(/(\d+)/);
        if (timeMatch) {
          updateData.responseTime = parseFloat(timeMatch[1]);
        }
      }

      if (availability) {
        updateData.availability = JSON.stringify({
          weekdays: availability.weekdays !== false,
          weekends: availability.weekends || false,
          emergencies: availability.emergency || false,
        });
        if (availability.active !== undefined) {
          updateData.status = availability.active ? 'ACTIVE' : 'INACTIVE';
        }
      }

      // Actualizar el perfil del proveedor
      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: updateData,
      });

      logger.info('Servicio actualizado', {
        serviceProviderId: user.id,
        serviceId,
        changes: { name, category },
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // ✅ Similar para maintenance provider - buscar por ID único
      const mp = fullUser.maintenanceProvider;
      let specialties: Array<string | any> = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      // ✅ Buscar el servicio por ID único
      let serviceIndex = -1;
      for (let i = 0; i < specialties.length; i++) {
        const item = specialties[i];
        if (typeof item === 'object' && item !== null && item.id === serviceId) {
          serviceIndex = i;
          break;
        } else if (typeof item === 'string') {
          // Migración: generar ID temporal para servicios legacy
          const legacyId = `mnt_${mp.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          if (legacyId === serviceId) {
            serviceIndex = i;
            break;
          }
        }
      }

      if (serviceIndex === -1) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // ✅ Actualizar el servicio en el array
      const currentService = specialties[serviceIndex];
      const updatedService: any =
        typeof currentService === 'object' && currentService !== null
          ? { ...currentService }
          : { id: serviceId, name: currentService };

      if (name) updatedService.name = name;
      if (category) updatedService.category = category;
      if (description) updatedService.description = description;
      if (pricing) updatedService.pricing = pricing;
      if (duration) updatedService.duration = duration;
      if (availability) updatedService.availability = availability;

      updatedService.updatedAt = new Date().toISOString();
      specialties[serviceIndex] = updatedService;

      const updateData: any = {
        specialties: JSON.stringify(specialties), // ✅ Actualizar array completo con servicio modificado
      };

      // Actualizar campos del proveedor si se proporcionan
      if (description && !updatedService.description) {
        updateData.description = description;
      }

      if (pricing?.amount) {
        updateData.hourlyRate = pricing.amount;
      }

      if (duration?.estimated) {
        const timeMatch = duration.estimated.match(/(\d+)/);
        if (timeMatch) {
          updateData.responseTime = parseFloat(timeMatch[1]);
        }
      }

      if (availability?.active !== undefined) {
        updateData.status = availability.active ? 'ACTIVE' : 'INACTIVE';
      }

      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: updateData,
      });

      logger.info('Servicio actualizado', {
        maintenanceProviderId: user.id,
        serviceId,
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
      });
    }

    return NextResponse.json({ error: 'Tipo de proveedor no reconocido.' }, { status: 400 });
  } catch (error) {
    logger.error('Error actualizando servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error as Error);
    return errorResponse;
  }
}
