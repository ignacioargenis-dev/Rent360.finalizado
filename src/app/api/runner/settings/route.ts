import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/runner/settings
 * Obtiene las configuraciones del runner
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de runner.' },
        { status: 403 }
      );
    }

    // Obtener datos del usuario
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: {
        city: true,
        commune: true,
        region: true,
        bio: true,
      },
    });

    // Parsear configuraciones desde bio (JSON) si existe
    let settingsObj: any = {};
    if (userData?.bio) {
      try {
        settingsObj = JSON.parse(userData.bio);
      } catch {
        // Si no es JSON válido, usar como string normal
      }
    }

    // Obtener tarifa máxima desde configuración del sistema
    // Intentar múltiples combinaciones de category/key para encontrar el valor
    let maxRateSetting = await db.systemSetting.findFirst({
      where: {
        category: 'runner',
        key: 'runnerBaseRatePerMinute',
        isActive: true,
      },
    });

    // Si no se encuentra con 'runner', intentar con otras categorías
    if (!maxRateSetting) {
      maxRateSetting = await db.systemSetting.findFirst({
        where: {
          OR: [
            { category: 'runners', key: 'runnerBaseRatePerMinute' },
            { category: 'payments', key: 'runnerBaseRatePerMinute' },
            { category: 'system', key: 'runnerBaseRatePerMinute' },
          ],
          isActive: true,
        },
      });
    }

    let maxHourlyRate = 30000; // Valor por defecto: 500/min * 60 = 30000/hora

    if (maxRateSetting) {
      try {
        const ratePerMinute = parseFloat(maxRateSetting.value);
        if (!isNaN(ratePerMinute) && ratePerMinute > 0) {
          maxHourlyRate = Math.round(ratePerMinute * 60); // Convertir de por minuto a por hora
        }
      } catch (error) {
        logger.warn('Error parseando runnerBaseRatePerMinute:', {
          value: maxRateSetting.value,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Tarifa máxima de runner obtenida', {
      maxHourlyRate,
      settingFound: !!maxRateSetting,
      settingValue: maxRateSetting?.value,
      category: maxRateSetting?.category,
      key: maxRateSetting?.key,
    });

    return NextResponse.json({
      success: true,
      settings: {
        workArea: {
          regions: settingsObj.workRegions || (userData?.region ? [userData.region] : []),
          communes: settingsObj.workCommunes || (userData?.commune ? [userData.commune] : []),
          maxDistance: settingsObj.maxDistance || 50,
          preferredTimes: settingsObj.preferredTimes || {
            morning: true,
            afternoon: true,
            evening: false,
          },
          vehicleType: settingsObj.vehicleType || '',
          licensePlate: settingsObj.licensePlate || '',
          experience: settingsObj.experience || '',
          specialties: settingsObj.specialties || [],
          languages: settingsObj.languages || ['Español'],
          hourlyRate: settingsObj.hourlyRate || 0,
          availability: settingsObj.availability || 'available',
          services: settingsObj.services || [],
          responseTime: settingsObj.responseTime || '',
        },
        notifications: {
          emailNotifications: settingsObj.emailNotifications !== false,
          smsNotifications: settingsObj.smsNotifications === true,
          jobReminders: settingsObj.jobReminders !== false,
          paymentReminders: settingsObj.paymentReminders !== false,
          ratingUpdates: settingsObj.ratingUpdates !== false,
        },
      },
      maxHourlyRate,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración del runner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PUT /api/runner/settings
 * Guarda las configuraciones del runner
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de runner.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Obtener tarifa máxima desde configuración del sistema para validar
    const maxRateSetting = await db.systemSetting.findFirst({
      where: {
        category: 'runner',
        key: 'runnerBaseRatePerMinute',
        isActive: true,
      },
    });

    const maxHourlyRate = maxRateSetting
      ? Math.round(parseFloat(maxRateSetting.value) * 60)
      : 30000;

    // Validar tarifa por hora
    if (body.workArea?.hourlyRate && body.workArea.hourlyRate > maxHourlyRate) {
      return NextResponse.json(
        {
          error: `La tarifa por hora no puede exceder $${maxHourlyRate.toLocaleString()} CLP/hora (configurada por el administrador).`,
        },
        { status: 400 }
      );
    }

    // Preparar settings para guardar en bio como JSON
    const runnerSettings = {
      workRegions: body.workArea?.regions || [],
      workCommunes: body.workArea?.communes || [],
      maxDistance: body.workArea?.maxDistance || 50,
      preferredTimes: body.workArea?.preferredTimes || {
        morning: true,
        afternoon: true,
        evening: false,
      },
      vehicleType: body.workArea?.vehicleType || '',
      licensePlate: body.workArea?.licensePlate || '',
      experience: body.workArea?.experience || '',
      specialties: body.workArea?.specialties || [],
      languages: body.workArea?.languages || ['Español'],
      hourlyRate: body.workArea?.hourlyRate || 0,
      availability: body.workArea?.availability || 'available',
      services: body.workArea?.services || [],
      responseTime: body.workArea?.responseTime || '',
      emailNotifications: body.notifications?.emailNotifications !== false,
      smsNotifications: body.notifications?.smsNotifications === true,
      jobReminders: body.notifications?.jobReminders !== false,
      paymentReminders: body.notifications?.paymentReminders !== false,
      ratingUpdates: body.notifications?.ratingUpdates !== false,
    };

    // Guardar configuraciones en el campo bio del usuario como JSON
    await db.user.update({
      where: { id: user.id },
      data: {
        bio: JSON.stringify(runnerSettings),
        ...(body.workArea?.regions?.[0] && { region: body.workArea.regions[0] }),
        ...(body.workArea.communes?.[0] && { commune: body.workArea.communes[0] }),
      },
    });

    logger.info('Configuración del runner guardada', { runnerId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Configuración guardada exitosamente',
    });
  } catch (error) {
    logger.error('Error guardando configuración del runner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
