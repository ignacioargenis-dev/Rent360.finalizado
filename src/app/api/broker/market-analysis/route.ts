/**
 * 📊 API - ANÁLISIS DE MERCADO INMOBILIARIO
 *
 * Endpoint principal para obtener datos de mercado, estadísticas
 * y análisis inteligente del mercado inmobiliario chileno.
 *
 * GET /api/broker/market-analysis - Obtener datos completos de mercado
 * Query params:
 *   - region: Filtrar por región específica
 *   - commune: Filtrar por comuna específica
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
      logger.warn('Acceso denegado a análisis de mercado', {
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
    const region = searchParams.get('region') || undefined;
    const commune = searchParams.get('commune') || undefined;
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    logger.info('Solicitando análisis de mercado', {
      userId: user.id,
      region,
      commune,
      forceRefresh,
    });

    // Obtener datos de mercado
    const marketData = await marketAnalysisService.getMarketData({
      ...(region && { region }),
      ...(commune && { commune }),
      forceRefresh,
    });

    // Generar insights
    const insights = await marketAnalysisService.generateMarketInsights(marketData);

    logger.info('Análisis de mercado generado exitosamente', {
      userId: user.id,
      totalLocations: marketData.length,
      totalInsights: insights.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          marketData,
          insights,
          metadata: {
            totalLocations: marketData.length,
            lastUpdated: new Date().toISOString(),
            filters: {
              region,
              commune,
            },
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error en análisis de mercado', { error });
    return NextResponse.json(
      {
        error: 'Error al obtener análisis de mercado',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
