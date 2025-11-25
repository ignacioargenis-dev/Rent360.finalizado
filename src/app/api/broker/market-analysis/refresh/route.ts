/**
 * 🔄 API - ACTUALIZACIÓN PERIÓDICA DE ANÁLISIS DE MERCADO
 *
 * Endpoint para forzar la actualización de todos los datos de mercado.
 * Puede ser llamado manualmente o mediante un cron job.
 *
 * POST /api/broker/market-analysis/refresh - Forzar actualización
 *
 * Seguridad:
 * - Requiere autenticación ADMIN/SUPPORT o un token secreto para cron jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { marketAnalysisService } from '@/lib/market-analysis-service';
import { logger } from '@/lib/logger-minimal';

export async function POST(request: NextRequest) {
  try {
    // Verificar si es una llamada de cron job (con token secreto)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    let isAuthorized = false;
    let authMethod = '';

    // Método 1: Token secreto para cron jobs
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthorized = true;
      authMethod = 'cron-secret';
      logger.info('Actualización de mercado iniciada por cron job');
    } else {
      // Método 2: Usuario autenticado con permisos
      try {
        const user = await requireAuth(request);
        if (['ADMIN', 'SUPPORT'].includes(user.role)) {
          isAuthorized = true;
          authMethod = 'user-auth';
          logger.info('Actualización de mercado iniciada por usuario', {
            userId: user.id,
            role: user.role,
          });
        }
      } catch (error) {
        // No autorizado
      }
    }

    if (!isAuthorized) {
      logger.warn('Intento no autorizado de actualización de mercado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const startTime = Date.now();

    // Limpiar caché actual
    marketAnalysisService.clearCache();
    logger.info('Caché de mercado limpiada');

    // Forzar recalculo de datos de mercado
    const marketData = await marketAnalysisService.getMarketData({
      forceRefresh: true,
    });

    // Generar insights actualizados
    const insights = await marketAnalysisService.generateMarketInsights(marketData);

    // Obtener resumen actualizado
    const summary = await marketAnalysisService.getMarketSummary(true);

    const executionTime = Date.now() - startTime;

    logger.info('Actualización de mercado completada exitosamente', {
      authMethod,
      totalLocations: marketData.length,
      totalInsights: insights.length,
      executionTime: `${executionTime}ms`,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          updated: true,
          timestamp: new Date().toISOString(),
          stats: {
            totalLocations: marketData.length,
            totalInsights: insights.length,
            totalProperties: summary.totalProperties,
            totalActiveContracts: summary.totalActiveContracts,
          },
          executionTime,
        },
        message: 'Datos de mercado actualizados correctamente',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error en actualización de mercado', { error });
    return NextResponse.json(
      {
        error: 'Error al actualizar datos de mercado',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar el estado del sistema
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!['ADMIN', 'SUPPORT', 'BROKER'].includes(user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        cacheEnabled: true,
        cacheExpiration: '1 hour',
        lastUpdate: new Date().toISOString(),
        cronJobStatus: process.env.CRON_SECRET ? 'configured' : 'not-configured',
      },
    });
  } catch (error) {
    logger.error('Error verificando estado de actualización', { error });
    return NextResponse.json({ error: 'Error al verificar estado' }, { status: 500 });
  }
}
