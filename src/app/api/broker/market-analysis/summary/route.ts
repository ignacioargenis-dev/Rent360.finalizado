/**
 * 📊 API - RESUMEN DE MERCADO
 *
 * Endpoint para obtener un resumen ejecutivo del mercado inmobiliario.
 *
 * GET /api/broker/market-analysis/summary - Obtener resumen del mercado
 * Query params:
 *   - forceRefresh: Forzar actualización de datos (true/false)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { marketAnalysisService } from '@/lib/market-analysis-service';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    // Autenticación
    const user = await requireAuth(request);

    // Verificar que el usuario sea BROKER, ADMIN o SUPPORT
    if (!['BROKER', 'ADMIN', 'SUPPORT'].includes(user.role)) {
      logger.warn('Acceso denegado a resumen de mercado', {
        userId: user.id,
        role: user.role,
      });
      return NextResponse.json(
        { error: 'No tienes permiso para acceder a esta función' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    logger.info('Solicitando resumen de mercado', {
      userId: user.id,
      forceRefresh,
    });

    // Obtener resumen de mercado
    const summary = await marketAnalysisService.getMarketSummary(forceRefresh);

    logger.info('Resumen de mercado generado generado exitosamente', {
      userId: user.id,
      totalProperties: summary.totalProperties,
      totalActiveContracts: summary.totalActiveContracts,
    });

    return NextResponse.json(
      {
        success: true,
        data: summary,
        metadata: {
          lastUpdated: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error en resumen de mercado', { error });
    return NextResponse.json(
      {
        error: 'Error al obtener resumen de mercado',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
