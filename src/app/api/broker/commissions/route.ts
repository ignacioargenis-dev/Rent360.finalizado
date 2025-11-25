import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { CommissionService } from '@/lib/commission-service';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/commissions
 * Obtiene las estadísticas y lista de comisiones del corredor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo corredores pueden acceder a sus comisiones
    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo corredores pueden acceder a esta información.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view'); // 'stats', 'list', 'overdue'
    const limit = parseInt(searchParams.get('limit') || '50');

    // Por defecto, retornar stats y lista combinadas
    if (!view || view === 'all') {
      const [stats, commissions, overdueCommissions] = await Promise.all([
        CommissionService.getCommissionStats(user.id),
        CommissionService.getBrokerCommissions(user.id, { limit }),
        CommissionService.getOverdueCommissions(user.id),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats,
          commissions,
          overdueCommissions,
        },
      });
    }

    // Solo estadísticas
    if (view === 'stats') {
      const stats = await CommissionService.getCommissionStats(user.id);
      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // Solo lista de comisiones
    if (view === 'list') {
      const commissions = await CommissionService.getBrokerCommissions(user.id, { limit });
      return NextResponse.json({
        success: true,
        data: commissions,
      });
    }

    // Solo comisiones vencidas
    if (view === 'overdue') {
      const overdueCommissions = await CommissionService.getOverdueCommissions(user.id);
      return NextResponse.json({
        success: true,
        data: overdueCommissions,
      });
    }

    return NextResponse.json(
      { error: 'Vista no válida. Use: stats, list, overdue, o all' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error obteniendo comisiones:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/broker/commissions
 * Acciones sobre comisiones: calcular, marcar como pagada, enviar recordatorios
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo corredores pueden gestionar comisiones.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, contractId, paymentData } = body;

    // Calcular comisión para un contrato
    if (action === 'calculate') {
      if (!contractId) {
        return NextResponse.json({ error: 'ID de contrato requerido' }, { status: 400 });
      }

      const calculation = await CommissionService.calculateCommission(contractId);

      if (!calculation) {
        return NextResponse.json({ error: 'No se pudo calcular la comisión' }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: calculation,
      });
    }

    // Marcar comisión como pagada
    if (action === 'mark_paid') {
      if (!contractId || !paymentData) {
        return NextResponse.json(
          { error: 'ID de contrato y datos de pago requeridos' },
          { status: 400 }
        );
      }

      const success = await CommissionService.markCommissionAsPaid(
        contractId,
        user.id,
        paymentData
      );

      if (!success) {
        return NextResponse.json(
          { error: 'No se pudo marcar la comisión como pagada' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Comisión marcada como pagada exitosamente',
      });
    }

    // Enviar recordatorios de comisiones vencidas
    if (action === 'send_reminders') {
      const remindersSent = await CommissionService.sendOverdueReminders(user.id);

      return NextResponse.json({
        success: true,
        data: {
          remindersSent,
        },
        message: `${remindersSent} recordatorios enviados`,
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Use: calculate, mark_paid, o send_reminders' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error en acción de comisiones:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
