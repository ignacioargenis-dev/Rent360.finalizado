import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PreventiveMaintenanceService } from '@/lib/preventive-maintenance-service';
import { logger } from '@/lib/logger-minimal';

/**
 * PUT /api/owner/maintenance/preventive/[id]
 * Marca un mantenimiento preventivo como completado
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'OWNER' && user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const scheduleId = params.id;
    const body = await request.json();

    const success = await PreventiveMaintenanceService.markAsCompleted(user.id, scheduleId, {
      actualCost: body.actualCost,
      actualDuration: body.actualDuration,
      notes: body.notes,
      providerId: body.providerId,
    });

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo marcar el mantenimiento como completado',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Mantenimiento preventivo marcado como completado',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error marcando mantenimiento como completado', { error, scheduleId: params.id });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar mantenimiento',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/owner/maintenance/preventive/[id]
 * Desactiva un programa de mantenimiento preventivo
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'OWNER' && user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const scheduleId = params.id;

    const success = await PreventiveMaintenanceService.deactivateSchedule(scheduleId, user.id);

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: 'No se pudo desactivar el programa de mantenimiento',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Programa de mantenimiento desactivado exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error desactivando programa de mantenimiento', { error, scheduleId: params.id });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al desactivar programa',
      },
      { status: 500 }
    );
  }
}
