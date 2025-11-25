import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeadScoringService } from '@/lib/lead-scoring-service';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * POST /api/broker/prospects/[prospectId]/calculate-score
 * Calcula y actualiza el lead score de un prospect
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

    // Calcular lead score
    const result = await LeadScoringService.calculateLeadScore(prospectId);

    // Actualizar en base de datos
    await LeadScoringService.updateProspectScore(prospectId);

    logger.info('Lead score calculado y actualizado', {
      brokerId: user.id,
      prospectId,
      leadScore: result.leadScore,
      conversionProbability: result.conversionProbability,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Lead score calculado exitosamente',
    });
  } catch (error) {
    logger.error('Error calculando lead score:', {
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
 * GET /api/broker/prospects/[prospectId]/calculate-score
 * Obtiene el lead score actual sin recalcular
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
      select: {
        id: true,
        brokerId: true,
        leadScore: true,
        conversionProbability: true,
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        leadScore: prospect.leadScore,
        conversionProbability: prospect.conversionProbability,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo lead score:', {
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
