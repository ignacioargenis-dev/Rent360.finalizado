import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { emailService } from '@/lib/email-service';

/**
 * POST /api/owner/reports/send-email
 * Envía un reporte por email al propietario
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para propietarios.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      dateRange,
      includeMetrics,
      includeFinancialSummary,
      includePropertyPerformance,
      includeTenantAnalysis,
    } = body;

    // Generar contenido del email
    const emailContent = `
      <h2>Reporte de Rent360</h2>
      <p>Estimado/a ${user.name},</p>
      <p>Adjuntamos su reporte de rendimiento para el período: ${dateRange}</p>
      <p>Este es un resumen automático generado desde su panel de control.</p>
      <p>Para ver más detalles, visite: ${process.env.NEXT_PUBLIC_APP_URL || 'https://rent360management-2yxgz.ondigitalocean.app'}/owner/reports</p>
      <p>Saludos,<br>Equipo Rent360</p>
    `;

    // Enviar email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: `Reporte Rent360 - ${dateRange}`,
        html: emailContent,
      });

      return NextResponse.json({
        success: true,
        message: 'Reporte enviado por email exitosamente',
      });
    } catch (emailError) {
      logger.error('Error enviando email:', emailError);
      return NextResponse.json(
        { error: 'Error al enviar el email. Por favor, intente nuevamente.' },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error('Error procesando solicitud de envío de reporte:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 });
  }
}
