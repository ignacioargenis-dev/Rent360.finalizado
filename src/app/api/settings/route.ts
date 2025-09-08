import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = requireRole(request, 'admin');
    
    // Obtener todas las configuraciones
    const settings = await db.systemSetting.findMany({
      orderBy: {
        category: 'asc',
      },
    });
    
    // Agrupar por categoría
    const settingsByCategory = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = {};
      }
      acc[setting.category][setting.key] = {
        value: setting.value,
        description: setting.description,
        isActive: setting.isActive,
        isSystem: setting.isSystem,
      };
      return acc;
    }, {} as Record<string, Record<string, any>>);
    
    return NextResponse.json({
      settings: settingsByCategory,
    });
  } catch (error) {
    logger.error('Error al obtener configuraciones:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireRole(request, 'admin');
    const { settings } = await request.json();
    
    // Procesar cada configuración
    const updatePromises = Object.entries(settings).map(([category, categorySettings]) => {
      return Object.entries(categorySettings as Record<string, any>).map(([key, settingData]) => {
        return db.systemSetting.upsert({
          where: { key },
          update: {
            value: settingData.value,
            isActive: settingData.isActive,
            category,
          },
          create: {
            key,
            value: settingData.value,
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
    logger.error('Error al guardar configuraciones:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
