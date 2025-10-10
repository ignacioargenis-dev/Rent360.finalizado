import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { SystemSetting } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin');

    logger.info('Obteniendo configuraciones del sistema', { userId: user.id });

    // Obtener todas las configuraciones
    let settings: SystemSetting[];
    try {
      settings = await db.systemSetting.findMany({
        orderBy: {
          category: 'asc',
        },
      });
    } catch (dbError) {
      logger.warn('Error al consultar system_settings, tabla podría no existir:', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
      });
      // Si la tabla no existe, devolver configuración vacía
      settings = [] as SystemSetting[];
    }

    logger.info('Configuraciones obtenidas', { count: settings.length });

    // Agrupar por categoría
    const settingsByCategory = settings.reduce(
      (acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        (acc[setting.category] as Record<string, any>)[setting.key] = {
          value: setting.value,
          description: setting.description,
          isActive: setting.isActive,
          isSystem: setting.isSystem,
        };
        return acc;
      },
      {} as Record<string, Record<string, any>>
    );

    logger.info('Configuraciones procesadas por categoría', {
      categories: Object.keys(settingsByCategory),
    });

    return NextResponse.json({
      settings: settingsByCategory,
    });
  } catch (error) {
    logger.error('Error al obtener configuraciones:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin');
    const { settings } = await request.json();

    // Procesar cada configuración
    const updatePromises = Object.entries(settings).map(([category, categorySettings]) => {
      return Object.entries(categorySettings as Record<string, any>).map(([key, settingData]) => {
        // Convertir valor a string si no lo es
        const stringValue = String(settingData.value);

        return db.systemSetting.upsert({
          where: { key },
          update: {
            value: stringValue,
            isActive: settingData.isActive,
            category,
          },
          create: {
            key,
            value: stringValue,
            category,
            description: settingData.description || '',
            isActive: settingData.isActive,
          },
        });
      });
    });

    // Ejecutar todas las actualizaciones
    await Promise.all(updatePromises.flat());

    return NextResponse.json({
      message: 'Configuraciones guardadas exitosamente',
    });
  } catch (error) {
    logger.error('Error al guardar configuraciones:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
