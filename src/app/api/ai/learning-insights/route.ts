import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { aiLearningSystem } from '@/lib/ai-learning-system';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo administradores pueden ver insights de aprendizaje
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // all, patterns, behaviors, insights, suggestions

    let responseData: any = {};

    switch (type) {
      case 'patterns':
        responseData = {
          patterns: aiLearningSystem.getPatternsForRole('all'),
          topPerforming: aiLearningSystem.getGlobalInsights().topPerformingPatterns
        };
        break;

      case 'behaviors':
        responseData = {
          totalUsers: aiLearningSystem.getGlobalInsights().totalUsers,
          averageSatisfaction: aiLearningSystem.getGlobalInsights().averageSatisfaction,
          userSatisfactionTrend: aiLearningSystem.getGlobalInsights().userSatisfactionTrend
        };
        break;

      case 'insights':
        responseData = aiLearningSystem.getGlobalInsights();
        break;

      case 'suggestions':
        responseData = {
          improvements: aiLearningSystem.getImprovementSuggestions(),
          globalInsights: aiLearningSystem.getGlobalInsights()
        };
        break;

      case 'all':
      default:
        responseData = {
          globalInsights: aiLearningSystem.getGlobalInsights(),
          patterns: aiLearningSystem.getPatternsForRole('all'),
          suggestions: aiLearningSystem.getImprovementSuggestions(),
          exportData: aiLearningSystem.exportLearningData()
        };
        break;
    }

    logger.info('Insights de aprendizaje obtenidos', {
      adminId: user.id,
      type,
      dataSize: JSON.stringify(responseData).length
    });

    return NextResponse.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error obteniendo insights de aprendizaje:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, daysToKeep } = body;

    switch (action) {
      case 'cleanup':
        const days = daysToKeep || 30;
        aiLearningSystem.cleanupOldData(days);
        
        logger.info('Limpieza de datos de aprendizaje ejecutada', {
          adminId: user.id,
          daysToKeep: days
        });

        return NextResponse.json({
          success: true,
          message: `Datos de aprendizaje limpiados (manteniendo últimos ${days} días)`
        });

      case 'export':
        const exportData = aiLearningSystem.exportLearningData();
        
        logger.info('Datos de aprendizaje exportados', {
          adminId: user.id,
          dataSize: JSON.stringify(exportData).length
        });

        return NextResponse.json({
          success: true,
          data: exportData,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Error en acción de aprendizaje:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor'
      },
      { status: 500 }
    );
  }
}
