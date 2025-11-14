import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/tenant/visits/scheduled
 * Obtiene las visitas programadas del inquilino autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo los inquilinos pueden ver sus visitas programadas' },
        { status: 403 }
      );
    }

    // Obtener visitas programadas del inquilino (SCHEDULED o CONFIRMED)
    const scheduledVisits = await db.visit.findMany({
      where: {
        tenantId: user.id,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'PENDING'] },
        scheduledAt: { gte: new Date() }, // Solo visitas futuras
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            commune: true,
            city: true,
            price: true,
          },
        },
        runner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 5, // Limitar a las próximas 5 visitas
    });

    logger.info('Visitas programadas obtenidas para inquilino', {
      tenantId: user.id,
      count: scheduledVisits.length,
    });

    return NextResponse.json({
      success: true,
      visits: scheduledVisits.map(visit => ({
        id: visit.id,
        propertyId: visit.propertyId,
        property: visit.property,
        scheduledAt: visit.scheduledAt.toISOString(),
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        runner: visit.runner,
      })),
    });
  } catch (error) {
    logger.error('Error obteniendo visitas programadas del inquilino:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al obtener las visitas programadas' },
      { status: 500 }
    );
  }
}
