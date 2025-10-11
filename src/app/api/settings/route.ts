import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/auth';
import { SystemSetting } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin');

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
    // Log detallado para debugging
    console.log('🔍 SETTINGS API POST - Request received');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('URL:', request.url);
    console.log('Method:', request.method);

    const user = await requireRole(request, 'admin');
    console.log('✅ User authenticated:', { id: user.id, email: user.email, role: user.role });

    const body = await request.json();
    console.log('📦 Request body received:', JSON.stringify(body, null, 2));

    const { settings } = body;

    if (!settings) {
      console.log('❌ No settings provided in request');
      return NextResponse.json({ error: 'No se proporcionaron configuraciones' }, { status: 400 });
    }

    console.log('🔄 Processing settings categories:', Object.keys(settings));

    // Procesar cada configuración
    const updatePromises: any[] = [];
    let processedCount = 0;

    Object.entries(settings).forEach(([category, categorySettings]) => {
      console.log(`📁 Processing category: ${category}`, {
        fields: Object.keys(categorySettings as any),
      });

      Object.entries(categorySettings as Record<string, any>).forEach(([key, settingData]) => {
        console.log(`⚙️ Processing setting: ${key}`, settingData);

        // Convertir valor a string si no lo es
        const stringValue = String(settingData.value);
        console.log(`🔄 Converted value to string: "${stringValue}"`);

        updatePromises.push(
          db.systemSetting.upsert({
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
          })
        );
        processedCount++;
      });
    });

    console.log(`🚀 Executing ${updatePromises.length} database operations`);

    // Ejecutar todas las actualizaciones
    const results = await Promise.all(updatePromises);

    console.log(`✅ Settings updated successfully`, {
      processedCount,
      resultsCount: results.length,
      results: results.map(r => ({ key: r.key, value: r.value, category: r.category })),
    });

    return NextResponse.json({
      message: 'Configuraciones guardadas exitosamente',
      processedCount,
      savedSettings: results.map(r => ({ key: r.key, value: r.value })),
    });
  } catch (error) {
    console.error('❌ Error al guardar configuraciones:', error);

    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
