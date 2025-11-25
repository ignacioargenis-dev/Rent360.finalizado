import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { ProspectHooks } from '@/lib/prospect-hooks';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

// Schema de validación
const updateStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'MEETING_SCHEDULED',
    'PROPOSAL_SENT',
    'NEGOTIATING',
    'CONVERTED',
    'LOST',
  ]),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
});

/**
 * PATCH /api/broker/prospects/[prospectId]/status
 * Actualiza el estado de un prospect
 */
export async function PATCH(request: NextRequest, { params }: { params: { prospectId: string } }) {
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
        status: true,
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Validar datos
    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    const oldStatus = prospect.status;
    const newStatus = validatedData.status;

    // Si no hay cambio de estado, no hacer nada
    if (oldStatus === newStatus) {
      return NextResponse.json({
        success: true,
        message: 'El estado ya estaba actualizado',
      });
    }

    // Actualizar datos según el nuevo estado
    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    // Si se convirtió, marcar fecha de conversión
    if (newStatus === 'CONVERTED') {
      updateData.convertedAt = new Date();
    }

    // Si se perdió, guardar razón
    if (newStatus === 'LOST' && validatedData.lostReason) {
      updateData.lostReason = validatedData.lostReason;
    }

    // Si hay notas, agregarlas a las notas existentes
    if (validatedData.notes) {
      const currentNotes = prospect.status || '';
      updateData.notes = currentNotes
        ? `${currentNotes}\n\n[${new Date().toLocaleString('es-CL')}] ${validatedData.notes}`
        : validatedData.notes;
    }

    // Actualizar prospect
    const updatedProspect = await db.brokerProspect.update({
      where: { id: prospectId },
      data: updateData,
    });

    logger.info('Estado de prospect actualizado', {
      brokerId: user.id,
      prospectId,
      oldStatus,
      newStatus,
    });

    // Ejecutar hooks automáticos
    ProspectHooks.onStatusChanged(prospectId, oldStatus, newStatus, user.id).catch(error => {
      logger.error('Error en hook onStatusChanged', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return NextResponse.json({
      success: true,
      data: updatedProspect,
      message: `Estado actualizado de ${oldStatus} a ${newStatus}`,
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

    logger.error('Error actualizando estado del prospect:', {
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
