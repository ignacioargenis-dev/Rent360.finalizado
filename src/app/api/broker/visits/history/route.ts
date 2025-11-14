import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/broker/visits/history
 * Obtiene el historial de visitas (completadas, canceladas, etc.) para el corredor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo los corredores pueden ver el historial de visitas' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Obtener propiedades gestionadas por el broker
    const managedProperties = await db.brokerPropertyManagement.findMany({
      where: {
        brokerId: user.id,
        status: 'ACTIVE',
      },
      select: {
        propertyId: true,
      },
    });

    const managedPropertyIds = managedProperties.map(mp => mp.propertyId);

    // Construir filtro de propiedad
    const propertyFilter: any = {
      OR: [
        { brokerId: user.id },
        ...(managedPropertyIds.length > 0
          ? [
              {
                id: {
                  in: managedPropertyIds,
                },
              },
            ]
          : []),
      ],
    };

    if (propertyId) {
      propertyFilter.id = propertyId;
    }

    // Obtener visitas completadas, canceladas, rechazadas y programadas
    const historyVisits = await db.visit.findMany({
      where: {
        property: propertyFilter,
        status: { in: ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'SCHEDULED', 'CONFIRMED'] },
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
        scheduledAt: 'desc',
      },
      take: limit,
    });

    logger.info('Historial de visitas obtenido para corredor', {
      brokerId: user.id,
      count: historyVisits.length,
    });

    return NextResponse.json({
      success: true,
      visits: historyVisits.map(visit => ({
        id: visit.id,
        propertyId: visit.propertyId,
        property: visit.property,
        tenant: visit.tenant,
        runner: visit.runner,
        scheduledAt: visit.scheduledAt.toISOString(),
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        earnings: visit.earnings,
        createdAt: visit.createdAt.toISOString(),
        updatedAt: visit.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Error obteniendo historial de visitas:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al obtener el historial de visitas' },
      { status: 500 }
    );
  }
}
