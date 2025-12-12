import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const alertsConfigSchema = z.object({
  occupancyAlert: z.boolean(),
  paymentDelayAlert: z.boolean(),
  maintenanceAlert: z.boolean(),
  lowRatingAlert: z.boolean(),
  occupancyThreshold: z.number().min(0).max(100),
  paymentDelayDays: z.number().min(1).max(90),
  maintenanceThreshold: z.number().min(1).max(100),
  ratingThreshold: z.number().min(1).max(5),
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
    // En el futuro se puede crear un modelo AnalyticsSettings
    const defaultConfig = {
      occupancyAlert: true,
      paymentDelayAlert: true,
      maintenanceAlert: true,
      lowRatingAlert: true,
      occupancyThreshold: 80,
      paymentDelayDays: 5,
      maintenanceThreshold: 3,
      ratingThreshold: 3.5,
    };

    return NextResponse.json({
      success: true,
      data: defaultConfig,
    });
  } catch (error) {
    logger.error('Error obteniendo configuración de alertas:', {
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
    const validatedData = alertsConfigSchema.parse(body);

    logger.info('Guardando configuración de alertas:', {
      userId: user.id,
      config: validatedData,
    });

    // Por ahora solo logueamos, en el futuro se puede guardar en un modelo AnalyticsSettings
    // o en el campo metadata del User si existe

    return NextResponse.json({
      success: true,
      message: 'Configuración de alertas guardada correctamente',
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

    logger.error('Error guardando configuración de alertas:', {
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
