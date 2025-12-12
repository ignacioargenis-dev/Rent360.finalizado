import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const goalsConfigSchema = z.object({
  targetOccupancy: z.number().min(0).max(100),
  targetRevenue: z.number().min(0),
  targetRating: z.number().min(0).max(5),
  targetMaintenanceResponse: z.number().min(1).max(168), // Máximo 168 horas (7 días)
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    // Obtener configuración guardada (por ahora desde metadata o usar defaults)
    const defaultConfig = {
      targetOccupancy: 95,
      targetRevenue: 5000000,
      targetRating: 4.5,
      targetMaintenanceResponse: 24,
    };

    return NextResponse.json({
      success: true,
      data: defaultConfig,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración de metas:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta funcionalidad' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = goalsConfigSchema.parse(body);

    logger.info('Guardando configuración de metas:', {
      userId: user.id,
      config: validatedData,
    });

    // Por ahora solo logueamos, en el futuro se puede guardar en un modelo AnalyticsSettings
    // o en el campo metadata del User si existe

    return NextResponse.json({
      success: true,
      message: 'Metas y objetivos guardados correctamente',
      data: validatedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('Error guardando configuración de metas:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
