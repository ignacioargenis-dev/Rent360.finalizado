import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * PUT /api/provider/profile
 * Actualiza el perfil del proveedor
 */
export async function PUT(request: NextRequest) {
  try {
    // Validar token
    const user = await requireAuth(request);
    console.log('✅ [API PUT] Usuario autenticado:', user.email, 'ID:', user.id);

    // Obtener datos del perfil a actualizar
    const profileData = await request.json();
    console.log('📥 [API PUT] Datos recibidos:', profileData);

    // Verificar que el usuario sea un provider
    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado. Solo para proveedores.' },
        { status: 403 }
      );
    }

    // Actualizar datos según el tipo de provider
    if (isServiceProvider(user.role)) {
      // Buscar y actualizar ServiceProvider
      const sp = await db.serviceProvider.findFirst({
        where: { userId: user.id },
      });

      if (!sp) {
        return NextResponse.json(
          { success: false, error: 'Proveedor de servicios no encontrado.' },
          { status: 404 }
        );
      }

      // Convertir arrays a JSON strings para guardar en BD
      const serviceTypes = Array.isArray(profileData.services?.categories)
        ? JSON.stringify(profileData.services.categories)
        : '[]';

      const availability =
        typeof profileData.operational?.availability === 'object'
          ? JSON.stringify(profileData.operational.availability)
          : JSON.stringify({ weekdays: true, weekends: false, emergencies: false });

      // Convertir responseTime de string a número si es necesario
      let responseTimeValue: number;
      if (typeof profileData.operational?.responseTime === 'string') {
        // Extraer el primer número del formato "X-Y horas"
        const timeMatch = profileData.operational.responseTime.match(/(\d+)/);
        responseTimeValue = timeMatch ? parseFloat(timeMatch[1]) : sp.responseTime || 2;
      } else {
        responseTimeValue = profileData.operational?.responseTime || sp.responseTime || 2;
      }

      await db.serviceProvider.update({
        where: { id: sp.id },
        data: {
          businessName: profileData.basicInfo?.companyName || sp.businessName,
          address: profileData.address?.street || sp.address,
          city: profileData.address?.city || sp.city,
          region: profileData.address?.region || sp.region,
          description: profileData.basicInfo?.description || sp.description,
          serviceTypes,
          basePrice: profileData.services?.basePrice || sp.basePrice,
          responseTime: responseTimeValue,
          availability,
          updatedAt: new Date(),
        },
      });

      console.log('✅ [API PUT] ServiceProvider actualizado');
    } else if (isMaintenanceProvider(user.role)) {
      // Buscar y actualizar MaintenanceProvider
      const mp = await db.maintenanceProvider.findFirst({
        where: { userId: user.id },
      });

      if (!mp) {
        return NextResponse.json(
          { success: false, error: 'Proveedor de mantenimiento no encontrado.' },
          { status: 404 }
        );
      }

      // Convertir arrays a JSON strings para guardar en BD
      const specialties = Array.isArray(profileData.services?.specialties)
        ? JSON.stringify(profileData.services.specialties)
        : '[]';

      const availability =
        typeof profileData.operational?.availability === 'object'
          ? JSON.stringify(profileData.operational.availability)
          : JSON.stringify({ weekdays: true, weekends: false, emergencies: true });

      // Convertir responseTime de string a número si es necesario
      let responseTimeValue: number;
      if (typeof profileData.operational?.responseTime === 'string') {
        // Extraer el primer número del formato "X-Y horas"
        const timeMatch = profileData.operational.responseTime.match(/(\d+)/);
        responseTimeValue = timeMatch ? parseFloat(timeMatch[1]) : mp.responseTime || 2;
      } else {
        responseTimeValue = profileData.operational?.responseTime || mp.responseTime || 2;
      }

      await db.maintenanceProvider.update({
        where: { id: mp.id },
        data: {
          businessName: profileData.basicInfo?.companyName || mp.businessName,
          address: profileData.address?.street || mp.address,
          city: profileData.address?.city || mp.city,
          region: profileData.address?.region || mp.region,
          description: profileData.basicInfo?.description || mp.description,
          specialties,
          hourlyRate: profileData.services?.hourlyRate || mp.hourlyRate,
          responseTime: responseTimeValue,
          availability,
          updatedAt: new Date(),
        },
      });

      console.log('✅ [API PUT] MaintenanceProvider actualizado');
    } else {
      return NextResponse.json(
        { success: false, error: 'Tipo de proveedor no válido.' },
        { status: 400 }
      );
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
    console.error('❌ [API PUT] Error actualizando perfil:', error);
    logger.error('Error actualizando perfil del proveedor:', { error });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

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
      console.log('🔍 [API] ServiceProvider data:', {
        serviceTypes: sp.serviceTypes,
        serviceType: sp.serviceType,
        serviceTypesType: typeof sp.serviceTypes,
        hasServiceTypes: !!sp.serviceTypes,
      });

      let serviceTypes: string[] = [];
      try {
        if (sp.serviceTypes) {
          const parsed = JSON.parse(sp.serviceTypes);
          console.log(
            '🔍 [API] Parsed serviceTypes:',
            parsed,
            'Type:',
            typeof parsed,
            'IsArray:',
            Array.isArray(parsed)
          );

          if (Array.isArray(parsed)) {
            // Verificar si contiene objetos o strings
            if (parsed.length > 0) {
              console.log('🔍 [API] First serviceType item:', parsed[0], 'Type:', typeof parsed[0]);
              if (typeof parsed[0] === 'object') {
                console.error('❌ [API] serviceTypes contains objects instead of strings!');
                serviceTypes = []; // Fallback vacío
              } else {
                serviceTypes = parsed;
              }
            } else {
              serviceTypes = parsed;
            }
          } else {
            console.warn('⚠️ [API] serviceTypes parsed but not an array');
            serviceTypes = [];
          }
        } else if (sp.serviceType) {
          serviceTypes = [sp.serviceType].filter(Boolean);
        }
      } catch (error) {
        console.error('❌ [API] Error parsing serviceTypes:', error);
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
      console.log('🔍 [API] MaintenanceProvider data:', {
        specialties: mp.specialties,
        specialty: mp.specialty,
        specialtiesType: typeof mp.specialties,
        hasSpecialties: !!mp.specialties,
      });

      let specialties: string[] = [];
      try {
        if (mp.specialties) {
          const parsed = JSON.parse(mp.specialties);
          console.log(
            '🔍 [API] Parsed specialties:',
            parsed,
            'Type:',
            typeof parsed,
            'IsArray:',
            Array.isArray(parsed)
          );

          if (Array.isArray(parsed)) {
            // Verificar si contiene objetos o strings
            if (parsed.length > 0) {
              console.log('🔍 [API] First specialty item:', parsed[0], 'Type:', typeof parsed[0]);
              if (typeof parsed[0] === 'object') {
                console.error('❌ [API] specialties contains objects instead of strings!');
                specialties = []; // Fallback vacío
              } else {
                specialties = parsed;
              }
            } else {
              specialties = parsed;
            }
          } else {
            console.warn('⚠️ [API] specialties parsed but not an array');
            specialties = [];
          }
        } else if (mp.specialty) {
          specialties = [mp.specialty].filter(Boolean);
        }
      } catch (error) {
        console.error('❌ [API] Error parsing specialties:', error);
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

    console.log('🎯 [API] Profile to be returned:', {
      hasProfile: !!profile,
      profileKeys: profile ? Object.keys(profile) : [],
      serviceTypes: profile?.serviceTypes,
      specialties: profile?.specialties,
      serviceTypesType: typeof profile?.serviceTypes,
      specialtiesType: typeof profile?.specialties,
      isServiceTypesArray: Array.isArray(profile?.serviceTypes),
      isSpecialtiesArray: Array.isArray(profile?.specialties),
    });

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
