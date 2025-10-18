import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir filtros
    const whereClause: any = {};
    if (status !== 'all') {
      whereClause.status = status;
    }

    // Por ahora, devolver datos vacíos ya que no existe el modelo PropertyReport
    // TODO: Implementar modelo PropertyReport en el schema de Prisma
    const reports: any[] = [];
    const transformedReports: any[] = [];

    logger.info('Reportes de propiedades obtenidos', {
      count: transformedReports.length,
      status,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: transformedReports,
      pagination: {
        limit,
        offset,
        total: reports.length,
        hasMore: reports.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo reportes de propiedades:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: [],
      },
      { status: 500 }
    );
  }
}
