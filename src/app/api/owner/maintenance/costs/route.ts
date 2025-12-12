import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/maintenance/costs
 * Obtiene costos reales de mantenimiento para el propietario
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para propietarios.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    // Calcular fechas según el período
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Obtener costos reales de mantenimiento
    const maintenanceCosts = await db.maintenance.aggregate({
      where: {
        property: { ownerId: user.id },
        createdAt: { gte: startDate },
      },
      _sum: {
        estimatedCost: true,
        actualCost: true,
      },
      _avg: {
        estimatedCost: true,
        actualCost: true,
      },
      _count: {
        _all: true,
      },
    });

    // Usar actualCost si está disponible, sino estimatedCost
    const totalCost = maintenanceCosts._sum.actualCost || maintenanceCosts._sum.estimatedCost || 0;
    const averageCost =
      maintenanceCosts._avg.actualCost || maintenanceCosts._avg.estimatedCost || 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCost,
        averageCost,
        requestCount: maintenanceCosts._count._all,
        hasActualCosts: !!maintenanceCosts._sum.actualCost,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo costos de mantenimiento:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al obtener los costos de mantenimiento' },
      { status: 500 }
    );
  }
}
