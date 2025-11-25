import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación para crear prospect
const createProspectSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  rut: z.string().optional(),
  prospectType: z.enum(['OWNER_LEAD', 'TENANT_LEAD']),
  interestedIn: z.array(z.string()).optional(),
  budget: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  preferredLocations: z.array(z.string()).optional(),
  source: z.string().optional(),
  sourceDetails: z.string().optional(),
  notes: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/broker/prospects
 * Obtiene todos los prospects del corredor
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PROSPECTS] Iniciando GET /api/broker/prospects');

    const user = await requireAuth(request);
    console.log('✅ [PROSPECTS] Usuario autenticado:', {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    if (user.role !== 'BROKER') {
      console.log('❌ [PROSPECTS] Usuario no es BROKER');
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const prospectType = searchParams.get('prospectType') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📋 [PROSPECTS] Parámetros de búsqueda:', {
      searchQuery,
      status,
      prospectType,
      limit,
    });

    // Construir condiciones de búsqueda
    const whereConditions: any = {
      brokerId: user.id,
    };

    // Filtrar por estado
    if (status !== 'all') {
      whereConditions.status = status.toUpperCase();
    }

    // Filtrar por tipo
    if (prospectType !== 'all') {
      whereConditions.prospectType = prospectType.toUpperCase();
    }

    // Si hay búsqueda, filtrar por nombre o email
    if (searchQuery.trim()) {
      whereConditions.OR = [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    console.log(
      '🔎 [PROSPECTS] Condiciones de búsqueda:',
      JSON.stringify(whereConditions, null, 2)
    );

    // Consultar prospects del corredor
    const prospects = await db.brokerProspect.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        activities: {
          select: {
            id: true,
            activityType: true,
            title: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        sharedProperties: {
          select: {
            id: true,
            propertyId: true,
            sharedAt: true,
            viewedAt: true,
            viewCount: true,
          },
          take: 5,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { leadScore: 'desc' },
        { nextFollowUpDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    console.log('📊 [PROSPECTS] Prospects encontrados:', prospects.length);

    // Calcular métricas
    const metrics = {
      total: prospects.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      avgLeadScore:
        prospects.length > 0
          ? prospects.reduce((sum, p) => sum + p.leadScore, 0) / prospects.length
          : 0,
      highPriority: prospects.filter(p => p.priority === 'high' || p.priority === 'urgent').length,
      needFollowUp: prospects.filter(
        p => p.nextFollowUpDate && new Date(p.nextFollowUpDate) <= new Date()
      ).length,
    };

    // Contar por estado
    prospects.forEach(p => {
      metrics.byStatus[p.status] = (metrics.byStatus[p.status] || 0) + 1;
      metrics.byType[p.prospectType] = (metrics.byType[p.prospectType] || 0) + 1;
    });

    logger.info('Prospects obtenidos para broker', {
      brokerId: user.id,
      count: prospects.length,
      metrics,
    });

    return NextResponse.json({
      success: true,
      data: prospects,
      metrics,
      pagination: {
        limit: limit,
        offset: 0,
        total: prospects.length,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('❌ [PROSPECTS] Error:', error);
    logger.error('Error obteniendo prospects:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/broker/prospects
 * Crea un nuevo prospect
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [PROSPECTS] Iniciando POST /api/broker/prospects');

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('📋 [PROSPECTS] Datos recibidos:', body);

    // Validar datos
    const validatedData = createProspectSchema.parse(body);

    // Verificar si ya existe un prospect o cliente con este email
    const existingProspect = await db.brokerProspect.findFirst({
      where: {
        brokerId: user.id,
        email: validatedData.email,
        status: {
          not: 'CONVERTED',
        },
      },
    });

    if (existingProspect) {
      return NextResponse.json({ error: 'Ya existe un prospect con este email' }, { status: 400 });
    }

    // Buscar si el usuario ya existe en el sistema
    const existingUser = await db.user.findUnique({
      where: { email: validatedData.email },
      select: { id: true, role: true },
    });

    // Calcular lead score inicial basado en datos proporcionados
    let leadScore = 50; // Base score
    if (validatedData.rut) {
      leadScore += 10;
    }
    if (validatedData.budget && validatedData.budget.max && validatedData.budget.max > 0) {
      leadScore += 15;
    }
    if (validatedData.preferredLocations && validatedData.preferredLocations.length > 0) {
      leadScore += 10;
    }
    if (validatedData.interestedIn && validatedData.interestedIn.length > 0) {
      leadScore += 10;
    }
    if (existingUser) {
      leadScore += 15;
    } // Usuario existente tiene mayor score

    // Crear el prospect
    const prospectData: any = {
      brokerId: user.id,
      userId: existingUser?.id || null,
      name: validatedData.name,
      email: validatedData.email,
      phone: validatedData.phone,
      rut: validatedData.rut ?? null,
      prospectType: validatedData.prospectType,
      interestedIn: validatedData.interestedIn ? JSON.stringify(validatedData.interestedIn) : null,
      preferredLocations: validatedData.preferredLocations
        ? JSON.stringify(validatedData.preferredLocations)
        : null,
      source: validatedData.source || 'platform',
      sourceDetails: validatedData.sourceDetails ?? null,
      notes: validatedData.notes ?? null,
      priority: validatedData.priority || 'medium',
      leadScore,
      conversionProbability: leadScore / 100,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      status: 'NEW',
    };

    // Solo incluir budget si tiene valor
    if (validatedData.budget) {
      prospectData.budget = validatedData.budget;
    }

    const prospect = await db.brokerProspect.create({
      data: prospectData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    // Crear actividad inicial
    await db.prospectActivity.create({
      data: {
        prospectId: prospect.id,
        brokerId: user.id,
        activityType: 'note',
        title: 'Prospect creado',
        description: `Nuevo ${validatedData.prospectType === 'OWNER_LEAD' ? 'propietario' : 'inquilino'} prospecto agregado al pipeline`,
        outcome: 'successful',
        completedAt: new Date(),
      },
    });

    logger.info('Nuevo prospect creado', {
      brokerId: user.id,
      prospectId: prospect.id,
      prospectType: prospect.prospectType,
      leadScore,
    });

    // Ejecutar hooks automáticos
    const { ProspectHooks } = await import('@/lib/prospect-hooks');
    ProspectHooks.onProspectCreated(prospect.id, user.id).catch(error => {
      logger.error('Error en hook onProspectCreated', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    console.log('✅ [PROSPECTS] Prospect creado exitosamente:', prospect.id);

    return NextResponse.json({
      success: true,
      data: prospect,
      message: 'Prospect creado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [PROSPECTS] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [PROSPECTS] Error:', error);
    logger.error('Error creando prospect:', {
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
