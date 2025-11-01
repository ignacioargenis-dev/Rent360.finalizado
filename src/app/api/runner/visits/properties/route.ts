import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    // Obtener propiedades de las visitas que el runner ya ha realizado o tiene asignadas
    const visits = await db.visit.findMany({
      where: {
        runnerId: user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            price: true,
            status: true,
          },
        },
      },
      distinct: ['propertyId'],
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    // Obtener propiedades únicas
    const uniqueProperties = new Map<string, any>();
    visits.forEach(visit => {
      if (visit.property && !uniqueProperties.has(visit.property.id)) {
        uniqueProperties.set(visit.property.id, visit.property);
      }
    });

    const properties = Array.from(uniqueProperties.values()).map(prop => ({
      id: prop.id,
      title: prop.title,
      address: prop.address,
      city: prop.city,
      commune: prop.commune || '',
      region: prop.region || '',
      price: prop.price,
      status: prop.status,
    }));

    logger.info('Propiedades para runner obtenidas', {
      runnerId: user.id,
      count: properties.length,
    });

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    logger.error('Error obteniendo propiedades para runner:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

