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

    // El ID es el nombre del servicio (decodificado)
    const serviceName = decodeURIComponent(params.id);

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

      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      // Verificar que el servicio existe
      if (!serviceTypes.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

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
        id: `service-${serviceName}`,
        name: serviceName,
        category: serviceName,
        description: `${serviceName} - ${freshServiceProvider.description || 'Servicio profesional'}`,
        shortDescription: freshServiceProvider.description || 'Servicio profesional',
        pricing: {
          type: 'fixed',
          amount: freshServiceProvider.basePrice || 0,
          currency: 'CLP',
        },
        duration: {
          estimated: `${freshServiceProvider.responseTime || 2}-${(freshServiceProvider.responseTime || 2) + 2}`,
          unit: 'hours',
        },
        features: [],
        requirements: [],
        availability: {
          active: freshServiceProvider.status === 'ACTIVE',
          ...availability,
        },
        images: [],
        tags: [],
        stats: {
          views: 0,
          requests: serviceJobs.length,
          conversionRate: 0,
          averageRating: avgRating,
          totalReviews: ratings.length,
          completedJobs: completedJobs.length,
        },
        createdAt: fullUser.createdAt.toISOString(),
        updatedAt: freshServiceProvider.updatedAt.toISOString(),
      };
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Similar lógica para maintenance provider
      const mp = fullUser.maintenanceProvider;
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      if (!specialties.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

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
        id: `service-${serviceName}`,
        name: serviceName,
        category: serviceName,
        description: `${serviceName} - ${mp.description || 'Servicio profesional'}`,
        shortDescription: mp.description || 'Servicio profesional',
        pricing: {
          type: 'fixed',
          amount: mp.hourlyRate || 0,
          currency: 'CLP',
        },
        duration: {
          estimated: `${mp.responseTime || 2}-${(mp.responseTime || 2) + 2}`,
          unit: 'hours',
        },
        features: [],
        requirements: [],
        availability: {
          active: mp.status === 'ACTIVE',
          regions: [],
          emergency: false,
        },
        images: [],
        tags: [],
        stats: {
          views: 0,
          requests: maintenanceJobs.length,
          conversionRate: 0,
          averageRating: 0,
          totalReviews: 0,
          completedJobs: completedJobs.length,
        },
        createdAt: fullUser.createdAt.toISOString(),
        updatedAt: mp.updatedAt.toISOString(),
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

    const serviceName = decodeURIComponent(params.id);
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

      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      if (!serviceTypes.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // Actualizar el estado del proveedor (todos los servicios comparten el mismo estado)
      // En el futuro, esto podría ser por servicio individual
      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: {
          status: active ? 'ACTIVE' : 'INACTIVE',
        },
      });

      logger.info('Estado de servicio actualizado', {
        serviceProviderId: user.id,
        serviceName,
        active,
      });

      return NextResponse.json({
        success: true,
        message: `Servicio ${active ? 'activado' : 'desactivado'} exitosamente`,
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Similar para maintenance provider
      const mp = fullUser.maintenanceProvider;
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      if (!specialties.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: {
          status: active ? 'ACTIVE' : 'INACTIVE',
        },
      });

      logger.info('Estado de servicio actualizado', {
        maintenanceProviderId: user.id,
        serviceName,
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

    const serviceName = decodeURIComponent(params.id);
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

      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(freshServiceProvider.serviceTypes || '[]');
      } catch {
        if (freshServiceProvider.serviceType) {
          serviceTypes = [freshServiceProvider.serviceType];
        }
      }

      if (!serviceTypes.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      // Actualizar el nombre del servicio si se proporciona
      if (name && name !== serviceName) {
        const index = serviceTypes.indexOf(serviceName);
        if (index !== -1) {
          serviceTypes[index] = name;
        }
      }

      // Preparar datos de actualización
      const updateData: any = {};

      if (serviceTypes.length > 0) {
        updateData.serviceTypes = JSON.stringify(serviceTypes);
      }

      if (description) {
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
        updateData.availability = JSON.stringify(availability);
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
        serviceName,
        changes: { name, category },
      });

      return NextResponse.json({
        success: true,
        message: 'Servicio actualizado exitosamente',
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Similar para maintenance provider
      const mp = fullUser.maintenanceProvider;
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        if (mp.specialty) {
          specialties = [mp.specialty];
        }
      }

      if (!specialties.includes(serviceName)) {
        return NextResponse.json({ error: 'Servicio no encontrado.' }, { status: 404 });
      }

      const updateData: any = {};

      if (description) {
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
        serviceName,
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
