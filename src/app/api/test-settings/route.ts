import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    logger.info('Test settings GET endpoint called');

    // Obtener todas las configuraciones
    const settings = await db.systemSetting.findMany({
      orderBy: {
        category: 'asc',
      },
    });

    logger.info('Settings found', { count: settings.length });

    return NextResponse.json({
      success: true,
      message: 'Settings retrieved successfully',
      data: {
        settingsCount: settings.length,
        settings: settings.map(s => ({
          key: s.key,
          value: s.value,
          category: s.category,
          isActive: s.isActive,
          isSystem: s.isSystem,
        })),
      },
    });
  } catch (error) {
    logger.error('Error in test-settings GET endpoint:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.info('Test settings POST endpoint called');

    const body = await request.json();
    logger.info('Received body:', body);

    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          error: 'No settings provided',
        },
        { status: 400 }
      );
    }

    logger.info('Processing settings categories:', Object.keys(settings));

    // Procesar cada configuración
    const updatePromises: any[] = [];
    let processedCount = 0;

    Object.entries(settings).forEach(([category, categorySettings]) => {
      logger.info(`Processing category: ${category}`, {
        fields: Object.keys(categorySettings as any),
      });

      Object.entries(categorySettings as Record<string, any>).forEach(([key, settingData]) => {
        logger.info(`Processing setting: ${key}`, settingData);

        // Convertir valor a string si no lo es
        const stringValue = String(settingData.value);

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

    logger.info(`Executing ${updatePromises.length} updates`);

    // Ejecutar todas las actualizaciones
    const results = await Promise.all(updatePromises);

    logger.info('Settings updated successfully', { processedCount, resultsCount: results.length });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        processedCount,
        resultsCount: results.length,
      },
    });
  } catch (error) {
    logger.error('Error in test-settings POST endpoint:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
