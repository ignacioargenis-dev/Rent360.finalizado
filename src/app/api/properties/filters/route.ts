import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { handleError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    logger.info('Obteniendo filtros de propiedades', { userId: user.id });

    // Obtener valores únicos para filtros
    const [
      cities,
      communes,
      priceRanges,
      propertyTypes,
      bedroomOptions,
      bathroomOptions
    ] = await Promise.all([
      // Ciudades disponibles
      db.property.findMany({
        where: { status: 'AVAILABLE' },
        select: { city: true },
        distinct: ['city'],
        orderBy: { city: 'asc' }
      }),

      // Comunas disponibles
      db.property.findMany({
        where: { status: 'AVAILABLE' },
        select: { commune: true },
        distinct: ['commune'],
        orderBy: { commune: 'asc' }
      }),

      // Rangos de precios
      db.property.aggregate({
        where: { status: 'AVAILABLE' },
        _min: { price: true },
        _max: { price: true }
      }),

      // Tipos de propiedades
      db.property.findMany({
        where: { status: 'AVAILABLE' },
        select: { type: true },
        distinct: ['type']
      }),

      // Opciones de dormitorios
      db.property.findMany({
        where: { status: 'AVAILABLE' },
        select: { bedrooms: true },
        distinct: ['bedrooms'],
        orderBy: { bedrooms: 'asc' }
      }),

      // Opciones de baños
      db.property.findMany({
        where: { status: 'AVAILABLE' },
        select: { bathrooms: true },
        distinct: ['bathrooms'],
        orderBy: { bathrooms: 'asc' }
      })
    ]);

    const filters = {
      cities: cities.map(c => c.city).filter(Boolean),
      communes: communes.map(c => c.commune).filter(Boolean),
      priceRange: {
        min: priceRanges._min.price || 0,
        max: priceRanges._max.price || 10000000
      },
      propertyTypes: propertyTypes.map(p => p.type).filter(Boolean),
      bedroomOptions: bedroomOptions.map(b => b.bedrooms).filter(n => n !== null).sort((a, b) => a - b),
      bathroomOptions: bathroomOptions.map(b => b.bathrooms).filter(n => n !== null).sort((a, b) => a - b)
    };

    logger.info('Filtros de propiedades obtenidos', {
      userId: user.id,
      citiesCount: filters.cities.length,
      propertyTypesCount: filters.propertyTypes.length
    });

    return NextResponse.json({
      success: true,
      data: filters
    });

  } catch (error) {
    logger.error('Error obteniendo filtros de propiedades:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
