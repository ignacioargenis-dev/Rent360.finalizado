import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { ProspectHooks } from '@/lib/prospect-hooks';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación para crear actividad
const createActivitySchema = z.object({
  activityType: z.enum([
    'call',
    'meeting',
    'email',
    'message',
    'property_view',
    'proposal',
    'note',
    'follow_up',
    'other',
  ]),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  duration: z.number().optional(),
  outcome: z.enum(['successful', 'unsuccessful', 'pending']).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/broker/prospects/[prospectId]/activities
 * Obtiene todas las actividades de un prospect
 */
export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect pertenece al broker
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener actividades
    const activities = await db.prospectActivity.findMany({
      where: { prospectId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    logger.error('Error obteniendo actividades del prospect:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
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

/**
 * POST /api/broker/prospects/[prospectId]/activities
 * Crea una nueva actividad para un prospect
 */
export async function POST(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect pertenece al broker
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Validar datos
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);

    // Preparar metadata (solo para campos adicionales que no tienen campo propio)
    const metadataObj: any = validatedData.metadata || {};

    // Crear actividad
    const activity = await db.prospectActivity.create({
      data: {
        prospectId,
        brokerId: user.id,
        activityType: validatedData.activityType,
        title: validatedData.title,
        description: validatedData.description || null,
        duration: validatedData.duration || null,
        notes: validatedData.notes || null,
        scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
        outcome: validatedData.outcome || 'pending',
        metadata:
          Object.keys(metadataObj).length > 0 ? JSON.stringify(metadataObj) : Prisma.JsonNull,
        completedAt: validatedData.outcome !== 'pending' ? new Date() : null,
      },
    });

    logger.info('Actividad creada para prospect', {
      brokerId: user.id,
      prospectId,
      activityId: activity.id,
      activityType: activity.activityType,
    });

    // Ejecutar hooks automáticos
    ProspectHooks.onActivityCreated(prospectId, validatedData.activityType).catch(error => {
      logger.error('Error en hook onActivityCreated', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Actividad creada exitosamente',
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

    logger.error('Error creando actividad:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
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
