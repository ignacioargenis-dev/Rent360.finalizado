import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

// Schema para configuración de comisiones
const commissionConfigSchema = z.object({
  commission_percentage: z.number().min(0).max(100),
  grace_period_days: z.number().min(0),
  payment_methods: z.array(z.string()),
});

// Schema para configuración general de la plataforma
const platformConfigSchema = z.object({
  key: z.string(),
  value: z.string(),
  category: z.string(),
  description: z.string().optional(),
});

// GET - Obtener configuración de la plataforma
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden ver la configuración
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const where: any = { isActive: true };
    if (category) {
      where.category = category;
    }

    const configs = await db.platformConfig.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });

    // Agrupar por categoría
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      configs: groupedConfigs,
      categories: Object.keys(groupedConfigs),
    });

  } catch (error) {
    return handleError(error);
  }
}

// POST - Crear o actualizar configuración
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden modificar la configuración
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs)) {
      return NextResponse.json(
        { error: 'Configuraciones debe ser un array' },
        { status: 400 },
      );
    }

    const results: any[] = [];
    for (const config of configs) {
      const validatedData = platformConfigSchema.parse(config);
      
      // Crear o actualizar configuración
      const result = await db.platformConfig.upsert({
        where: { key: validatedData.key },
        update: {
          value: validatedData.value,
          category: validatedData.category,
          description: validatedData.description,
          updatedAt: new Date(),
        },
        create: {
          key: validatedData.key,
          value: validatedData.value,
          category: validatedData.category,
          description: validatedData.description,
        },
      });

      results.push(result);
    }

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente',
      results,
    });

  } catch (error) {
    return handleError(error);
  }
}

// PUT - Actualizar configuración específica
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden modificar la configuración
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { key, value, category, description } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Clave y valor son requeridos' },
        { status: 400 },
      );
    }

    const result = await db.platformConfig.upsert({
      where: { key },
      update: {
        value,
        category: category || 'general',
        description,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        category: category || 'general',
        description,
      },
    });

    return NextResponse.json({
      message: 'Configuración actualizada exitosamente',
      config: result,
    });

  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Eliminar configuración
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden eliminar configuración
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Clave de configuración es requerida' },
        { status: 400 },
      );
    }

    await db.platformConfig.delete({
      where: { key },
    });

    return NextResponse.json({
      message: 'Configuración eliminada exitosamente',
    });

  } catch (error) {
    return handleError(error);
  }
}
