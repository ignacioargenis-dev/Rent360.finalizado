import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const createActivitySchema = z.object({
  activityType: z.enum([
    'email',
    'call',
    'meeting',
    'property_view',
    'proposal',
    'note',
    'follow_up',
    'other',
  ]),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().optional(),
  outcome: z.enum(['successful', 'unsuccessful', 'pending', 'scheduled']).optional(),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/broker/prospects/[prospectId]/activities
 * Obtiene todas las actividades de un prospect
 */
export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log(
      '🔍 [PROSPECT_ACTIVITIES] Iniciando GET /api/broker/prospects/[prospectId]/activities'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect existe y pertenece al corredor
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener actividades
    const activities = await db.prospectActivity.findMany({
      where: { prospectId },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('✅ [PROSPECT_ACTIVITIES] Actividades encontradas:', activities.length);

    return NextResponse.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error('❌ [PROSPECT_ACTIVITIES] Error:', error);
    logger.error('Error obteniendo actividades del prospect:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * POST /api/broker/prospects/[prospectId]/activities
 * Crea una nueva actividad para un prospect
 */
export async function POST(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log(
      '🔍 [CREATE_ACTIVITY] Iniciando POST /api/broker/prospects/[prospectId]/activities'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    const body = await request.json();
    console.log('📋 [CREATE_ACTIVITY] Datos recibidos:', body);

    // Validar datos
    const validatedData = createActivitySchema.parse(body);

    // Verificar que el prospect existe y pertenece al corredor
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true, contactCount: true, emailsSent: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Crear la actividad
    const activityData: any = {
      prospectId,
      brokerId: user.id,
      activityType: validatedData.activityType,
      title: validatedData.title,
      description: validatedData.description ?? null,
      outcome: validatedData.outcome || 'pending',
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
      completedAt:
        validatedData.outcome === 'successful' || validatedData.outcome === 'unsuccessful'
          ? new Date()
          : null,
    };

    // Solo incluir metadata si tiene valor
    if (validatedData.metadata) {
      activityData.metadata = validatedData.metadata;
    }

    const activity = await db.prospectActivity.create({
      data: activityData,
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Actualizar métricas del prospect
    const updateData: any = {
      lastContactDate: new Date(),
    };

    // Incrementar contadores según el tipo de actividad
    if (['email', 'call', 'meeting'].includes(validatedData.activityType)) {
      updateData.contactCount = prospect.contactCount + 1;
    }
    if (validatedData.activityType === 'email') {
      updateData.emailsSent = prospect.emailsSent + 1;
    }

    // Si es follow_up programado, actualizar nextFollowUpDate
    if (validatedData.activityType === 'follow_up' && validatedData.scheduledFor) {
      updateData.nextFollowUpDate = new Date(validatedData.scheduledFor);
    }

    await db.brokerProspect.update({
      where: { id: prospectId },
      data: updateData,
    });

    logger.info('Actividad creada para prospect', {
      brokerId: user.id,
      prospectId,
      activityId: activity.id,
      activityType: validatedData.activityType,
    });

    console.log('✅ [CREATE_ACTIVITY] Actividad creada exitosamente:', activity.id);

    return NextResponse.json({
      success: true,
      data: activity,
      message: 'Actividad creada exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [CREATE_ACTIVITY] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [CREATE_ACTIVITY] Error:', error);
    logger.error('Error creando actividad:', {
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
