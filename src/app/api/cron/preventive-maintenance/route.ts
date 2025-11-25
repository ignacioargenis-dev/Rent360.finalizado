import { NextRequest, NextResponse } from 'next/server';
import { runPreventiveMaintenanceReminders } from '@/lib/preventive-maintenance-service';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/cron/preventive-maintenance
 * Cron job para enviar recordatorios automáticos de mantenimiento preventivo
 *
 * Se puede configurar para ejecutarse diariamente con:
 * - Vercel Cron Jobs
 * - DigitalOcean App Platform Scheduled Jobs
 * - GitHub Actions
 * - Heroku Scheduler
 *
 * Protegido con token secreto en headers
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar token de autorizaci ón para cron jobs
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const CRON_SECRET = process.env.CRON_SECRET;

    if (!token || !CRON_SECRET || token !== CRON_SECRET) {
      logger.warn('Intento de acceso no autorizado a cron job de mantenimiento preventivo', {
        hasToken: !!token,
        hasCronSecret: !!CRON_SECRET,
      });
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
        },
        { status: 401 }
      );
    }

    // Ejecutar recordatorios
    const startTime = Date.now();
    await runPreventiveMaintenanceReminders();
    const executionTime = Date.now() - startTime;

    logger.info('Cron job de mantenimiento preventivo ejecutado exitosamente', {
      executionTime,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Recordatorios de mantenimiento preventivo enviados',
        executionTime,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error en cron job de mantenimiento preventivo', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Error ejecutando cron job',
      },
      { status: 500 }
    );
  }
}

// También soportar POST para algunos schedulers
export async function POST(request: NextRequest) {
  return GET(request);
}
