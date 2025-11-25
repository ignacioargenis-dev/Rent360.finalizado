import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { PreventiveMaintenanceService } from '@/lib/preventive-maintenance-service';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/maintenance/preventive
 * Obtiene todos los programas de mantenimiento preventivo del propietario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'OWNER' && user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener parámetro de próximos días (opcional)
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming');

    let schedules;
    if (upcoming) {
      const days = parseInt(upcoming) || 30;
      schedules = await PreventiveMaintenanceService.getUpcomingMaintenance(user.id, days);
    } else {
      schedules = await PreventiveMaintenanceService.getSchedulesByOwner(user.id);
    }

    return NextResponse.json(
      {
        success: true,
        data: schedules,
        count: schedules.length,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error obteniendo programas de mantenimiento preventivo', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener programas de mantenimiento preventivo',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/owner/maintenance/preventive
 * Crea un nuevo programa de mantenimiento preventivo
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    if (user.role !== 'OWNER' && user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }
    const body = await request.json();

    // Validar datos requeridos
    if (!body.propertyId || !body.title || !body.category || !body.frequency) {
      return NextResponse.json(
        {
          success: false,
          error: 'Faltan campos requeridos: propertyId, title, category, frequency',
        },
        { status: 400 }
      );
    }

    // Validar frecuencia
    if (!['monthly', 'quarterly', 'semiannual', 'annual'].includes(body.frequency)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Frecuencia inválida. Debe ser: monthly, quarterly, semiannual, o annual',
        },
        { status: 400 }
      );
    }

    // Crear el programa de mantenimiento
    const scheduleData: any = {
      propertyId: body.propertyId,
      title: body.title,
      description: body.description || '',
      category: body.category,
      frequency: body.frequency,
      reminderDaysBefore: body.reminderDaysBefore || 7,
      estimatedCost: body.estimatedCost,
      estimatedDuration: body.estimatedDuration,
      checklist:
        body.checklist || PreventiveMaintenanceService.getPredefinedChecklist(body.category),
    };
    if (body.lastCompletedDate) {
      scheduleData.lastCompletedDate = new Date(body.lastCompletedDate);
    }
    const schedule = await PreventiveMaintenanceService.createSchedule(user.id, scheduleData);

    return NextResponse.json(
      {
        success: true,
        data: schedule,
        message: 'Programa de mantenimiento preventivo creado exitosamente',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando programa de mantenimiento preventivo', { error });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear programa de mantenimiento',
      },
      { status: 500 }
    );
  }
}
