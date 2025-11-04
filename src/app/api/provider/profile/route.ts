import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * GET /api/provider/profile
 * Obtiene el perfil completo del proveedor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario para acceder a las relaciones
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: {
          include: {
            documents: true,
          },
        },
        maintenanceProvider: {
          include: {
            documents: true,
          },
        },
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    let profile: any = null;

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const sp = fullUser.serviceProvider;
      let serviceTypes: string[] = [];
      try {
        serviceTypes = JSON.parse(sp.serviceTypes || '[]');
      } catch {
        serviceTypes = [sp.serviceType].filter(Boolean);
      }

      let availability: any = {
        weekdays: true,
        weekends: false,
        emergencies: false,
      };
      try {
        if (sp.availability) {
          availability = JSON.parse(sp.availability);
        }
      } catch {
        // Usar valores por defecto
      }

      profile = {
        companyName: sp.businessName,
        contactName: fullUser.name || '',
        email: fullUser.email,
        phone: fullUser.phone || '',
        address: sp.address || '',
        city: sp.city || '',
        region: sp.region || '',
        description: sp.description || '',
        website: '',
        taxId: sp.rut,
        serviceTypes,
        basePrice: sp.basePrice,
        responseTime: `${sp.responseTime || 2}-${(sp.responseTime || 2) + 2} horas`,
        availability,
        status: sp.status,
        isVerified: sp.isVerified,
        documents: sp.documents
          ? {
              criminalRecord: sp.documents.criminalRecord,
              idFront: sp.documents.idFront,
              idBack: sp.documents.idBack,
              businessCertificate: sp.documents.businessCertificate,
              isVerified: sp.documents.isVerified,
            }
          : null,
      };
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      const mp = fullUser.maintenanceProvider;
      let specialties: string[] = [];
      try {
        specialties = JSON.parse(mp.specialties || '[]');
      } catch {
        specialties = [mp.specialty].filter(Boolean);
      }

      let availability: any = {
        weekdays: true,
        weekends: false,
        emergencies: true,
      };
      try {
        if (mp.availability) {
          availability = JSON.parse(mp.availability);
        }
      } catch {
        // Usar valores por defecto
      }

      profile = {
        companyName: mp.businessName,
        contactName: fullUser.name || '',
        email: fullUser.email,
        phone: fullUser.phone || '',
        address: mp.address || '',
        city: mp.city || '',
        region: mp.region || '',
        description: mp.description || '',
        website: '',
        taxId: mp.rut,
        specialties,
        hourlyRate: mp.hourlyRate,
        responseTime: `${mp.responseTime || 2}-${(mp.responseTime || 2) + 2} horas`,
        availability,
        status: mp.status,
        isVerified: mp.isVerified,
        documents: mp.documents
          ? {
              criminalRecord: mp.documents.criminalRecord,
              idFront: mp.documents.idFront,
              idBack: mp.documents.idBack,
              businessCertificate: mp.documents.businessCertificate,
              isVerified: mp.documents.isVerified,
            }
          : null,
      };
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 404 });
    }

    logger.info('Perfil de proveedor obtenido', {
      providerId: user.id,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    logger.error('Error obteniendo perfil del proveedor:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

/**
 * PUT /api/provider/profile
 * Actualiza el perfil del proveedor
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      companyName,
      contactName,
      phone,
      address,
      city,
      region,
      description,
      website,
      taxId,
      serviceTypes,
      basePrice,
      hourlyRate,
      responseTime,
      availability,
    } = body;

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

    // Actualizar datos del usuario
    if (contactName || phone) {
      await db.user.update({
        where: { id: user.id },
        data: {
          ...(contactName && { name: contactName }),
          ...(phone && { phone }),
        },
      });
    }

    // Actualizar ServiceProvider
    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      const updateData: any = {};

      if (companyName) {
        updateData.businessName = companyName;
      }
      if (taxId) {
        updateData.rut = taxId;
      }
      if (address) {
        updateData.address = address;
      }
      if (city) {
        updateData.city = city;
      }
      if (region) {
        updateData.region = region;
      }
      if (description) {
        updateData.description = description;
      }
      if (basePrice !== undefined) {
        updateData.basePrice = basePrice;
      }
      // ✅ Manejar servicios: puede venir como array de nombres o como array de objetos con IDs
      if (serviceTypes && Array.isArray(serviceTypes)) {
        // Si viene con objetos completos (services), usar esos
        const services = (body as any).services;
        if (
          services &&
          Array.isArray(services) &&
          services.length > 0 &&
          typeof services[0] === 'object'
        ) {
          // Preservar estructura completa con IDs únicos
          updateData.serviceTypes = JSON.stringify(services);
        } else {
          // Si viene solo como array de nombres, obtener servicios actuales y actualizar
          const currentServiceTypesJson = fullUser.serviceProvider.serviceTypes || '[]';
          let currentServices: Array<any> = [];
          try {
            currentServices = JSON.parse(currentServiceTypesJson);
          } catch {
            // Si no es JSON válido, crear array desde serviceTypes
            currentServices = serviceTypes.map((name: string, index: number) => ({
              id: `svc_${user.id}_${Date.now()}_${index}`,
              name,
              active: true,
              pricing: { type: 'fixed', amount: basePrice || 0, currency: 'CLP' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
          }

          // Actualizar servicios existentes o crear nuevos
          const updatedServices = serviceTypes.map((name: string) => {
            const existing = currentServices.find(
              (s: any) => (typeof s === 'object' && s !== null && s.name === name) || s === name
            );

            if (existing) {
              // Preservar ID y datos existentes
              if (typeof existing === 'object' && existing !== null && existing.id) {
                return {
                  ...existing,
                  name,
                  updatedAt: new Date().toISOString(),
                };
              }
              // Si es string, convertirlo a objeto
              return {
                id: `svc_${user.id}_${Date.now()}_${name.replace(/\s+/g, '_').toLowerCase()}`,
                name,
                active: true,
                pricing: { type: 'fixed', amount: basePrice || 0, currency: 'CLP' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }

            // Crear nuevo servicio
            return {
              id: `svc_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name,
              active: true,
              pricing: { type: 'fixed', amount: basePrice || 0, currency: 'CLP' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });

          updateData.serviceTypes = JSON.stringify(updatedServices);
        }
      }
      if (availability) {
        updateData.availability = JSON.stringify(availability);
      }
      if (responseTime) {
        // Parsear responseTime (ej: "2-4 horas" -> 2)
        const timeMatch = responseTime.match(/(\d+)/);
        if (timeMatch) {
          updateData.responseTime = parseFloat(timeMatch[1]);
        }
      }

      await db.serviceProvider.update({
        where: { id: fullUser.serviceProvider.id },
        data: updateData,
      });
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      const updateData: any = {};

      if (companyName) {
        updateData.businessName = companyName;
      }
      if (taxId) {
        updateData.rut = taxId;
      }
      if (address) {
        updateData.address = address;
      }
      if (city) {
        updateData.city = city;
      }
      if (region) {
        updateData.region = region;
      }
      if (description) {
        updateData.description = description;
      }
      if (hourlyRate !== undefined) {
        updateData.hourlyRate = hourlyRate;
      }
      // ✅ Manejar especialidades: puede venir como array de nombres o como array de objetos con IDs
      if (serviceTypes && Array.isArray(serviceTypes)) {
        // Si viene con objetos completos (services), usar esos
        const services = (body as any).services;
        if (
          services &&
          Array.isArray(services) &&
          services.length > 0 &&
          typeof services[0] === 'object'
        ) {
          // Preservar estructura completa con IDs únicos
          updateData.specialties = JSON.stringify(services);
        } else {
          // Si viene solo como array de nombres, obtener servicios actuales y actualizar
          const currentSpecialtiesJson = fullUser.maintenanceProvider?.specialties || '[]';
          let currentSpecialties: Array<any> = [];
          try {
            currentSpecialties = JSON.parse(currentSpecialtiesJson);
          } catch {
            // Si no es JSON válido, crear array desde serviceTypes
            currentSpecialties = serviceTypes.map((name: string, index: number) => ({
              id: `mnt_${fullUser.maintenanceProvider?.id || user.id}_${Date.now()}_${index}`,
              name,
              active: true,
              pricing: { type: 'fixed', amount: hourlyRate || 0, currency: 'CLP' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }));
          }

          // Actualizar servicios existentes o crear nuevos
          const updatedSpecialties = serviceTypes.map((name: string) => {
            const existing = currentSpecialties.find(
              (s: any) => (typeof s === 'object' && s !== null && s.name === name) || s === name
            );

            if (existing) {
              // Preservar ID y datos existentes
              if (typeof existing === 'object' && existing !== null && existing.id) {
                return {
                  ...existing,
                  name,
                  updatedAt: new Date().toISOString(),
                };
              }
              // Si es string, convertirlo a objeto
              return {
                id: `mnt_${fullUser.maintenanceProvider?.id || user.id}_${Date.now()}_${name.replace(/\s+/g, '_').toLowerCase()}`,
                name,
                active: true,
                pricing: { type: 'fixed', amount: hourlyRate || 0, currency: 'CLP' },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }

            // Crear nuevo servicio
            return {
              id: `mnt_${fullUser.maintenanceProvider?.id || user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              name,
              active: true,
              pricing: { type: 'fixed', amount: hourlyRate || 0, currency: 'CLP' },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
          });

          updateData.specialties = JSON.stringify(updatedSpecialties);
        }
      }
      if (availability) {
        updateData.availability = JSON.stringify(availability);
      }
      if (responseTime) {
        const timeMatch = responseTime.match(/(\d+)/);
        if (timeMatch) {
          updateData.responseTime = parseFloat(timeMatch[1]);
        }
      }

      await db.maintenanceProvider.update({
        where: { id: fullUser.maintenanceProvider.id },
        data: updateData,
      });
    }

    logger.info('Perfil de proveedor actualizado', {
      providerId: user.id,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
    });
  } catch (error) {
    logger.error('Error actualizando perfil del proveedor:', { error });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
