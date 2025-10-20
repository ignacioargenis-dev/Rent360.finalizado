import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PropertyStatus, PropertyType, UserRole } from '@/types';
import { handleApiError } from '@/lib/api-error-handler';
import { cache, generateCacheKey, cacheTTL } from '@/lib/cache';
// Funciones de utilidad matemática
const safeAverage = (numbers: number[]): number => {
  if (!numbers || numbers.length === 0) {
    return 0;
  }
  const validNumbers = numbers.filter(n => typeof n === 'number' && !isNaN(n));
  return validNumbers.length > 0
    ? validNumbers.reduce((sum, n) => sum + n, 0) / validNumbers.length
    : 0;
};

const roundToDecimal = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    // Parámetros de consulta
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const city = searchParams.get('city') || '';
    const commune = searchParams.get('commune') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const bedrooms = searchParams.get('bedrooms') || '';
    const bathrooms = searchParams.get('bathrooms') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construir filtros
    const where: any = {};

    // Filtro por rol de usuario (roles siempre en MAYÚSCULAS)
    if (user.role === 'OWNER' || user.role === UserRole.OWNER) {
      where.ownerId = user.id;
    } else if (user.role === 'BROKER' || user.role === UserRole.BROKER) {
      where.OR = [{ ownerId: user.id }, { brokerId: user.id }];
    }
    // Admin y ADMIN pueden ver todas las propiedades

    // Crear clave de cache basada en parámetros y usuario
    const cacheKey = generateCacheKey('properties:list', {
      userId: user.id,
      userRole: user.role,
      page,
      limit,
      search,
      status,
      type,
      city,
      commune,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      sortBy,
      sortOrder,
    });

    // Intentar obtener del cache primero
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
      logger.debug('Properties list obtenido del cache', { cacheKey });
      return NextResponse.json(cachedResult);
    }

    // Filtros de búsqueda
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (commune) {
      where.commune = { contains: commune, mode: 'insensitive' };
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price.lte = parseFloat(maxPrice);
      }
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms);
    }

    if (bathrooms) {
      where.bathrooms = parseInt(bathrooms);
    }

    // Ordenamiento
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Calcular offset para paginación
    const offset = (page - 1) * limit;

    // Ejecutar consulta con paginación
    const [properties, totalCount] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          contracts: {
            where: { status: 'ACTIVE' },
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy,
        skip: offset,
        take: limit,
      }),
      db.property.count({ where }),
    ]);

    // Calcular estadísticas
    const averageRating =
      properties.length > 0
        ? properties.reduce((acc, property) => {
            const ratings = property.reviews.map(review => review.rating);
            return (
              acc + (ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0)
            );
          }, 0) / properties.length
        : 0;

    // Formatear respuesta
    const formattedProperties = properties.map(property => ({
      id: property.id,
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      commune: property.commune,
      region: property.region,
      price: property.price,
      deposit: property.deposit,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      type: property.type,
      status: property.status,
      features: property.features ? JSON.parse(property.features) : [],
      images: property.images
        ? (Array.isArray(property.images) ? property.images : JSON.parse(property.images))
            .map((img: string) => {
              const imgStr = String(img ?? '');
              const imgNoQuery = imgStr.split('?')[0];
              let transformedImg = imgNoQuery;
              if (imgNoQuery.startsWith('/api/uploads/')) {
                transformedImg = imgNoQuery;
              } else if (imgNoQuery.startsWith('/images/')) {
                transformedImg = imgNoQuery.replace('/images/', '/api/uploads/');
              } else if (imgNoQuery.startsWith('/uploads/')) {
                transformedImg = imgNoQuery.replace('/uploads/', '/api/uploads/');
              } else if (!imgNoQuery.startsWith('http') && !imgNoQuery.startsWith('/')) {
                transformedImg = `/api/uploads/${imgNoQuery}`;
              }
              return transformedImg;
            })
            .filter((imgPath: string) => {
              try {
                const logical = imgPath.replace(/^\/api\//, '');
                const fullPath = require('path').join(
                  process.cwd(),
                  'public',
                  logical.replace(/^uploads\//, 'uploads/')
                );
                return require('fs').existsSync(fullPath);
              } catch {
                return false;
              }
            })
            .map((imgPath: string) => {
              const separator = imgPath.includes('?') ? '&' : '?';
              const uniqueTimestamp = Date.now() + Math.random();
              return `${imgPath}${separator}t=${uniqueTimestamp}`;
            })
        : [],
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner,
      currentTenant: property.contracts[0]?.tenant || null,
      averageRating: safeAverage(property.reviews.map(review => review.rating)),
      totalReviews: property.reviews.length,

      // Nuevos campos de características
      furnished: property.furnished,
      petFriendly: property.petFriendly,
      parkingSpaces: property.parkingSpaces,
      availableFrom: property.availableFrom,
      floor: property.floor,
      buildingName: property.buildingName,
      yearBuilt: property.yearBuilt,

      // Características del edificio/servicios
      heating: property.heating,
      cooling: property.cooling,
      internet: property.internet,
      elevator: property.elevator,
      balcony: property.balcony,
      terrace: property.terrace,
      garden: property.garden,
      pool: property.pool,
      gym: property.gym,
      security: property.security,
      concierge: property.concierge,

      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }));

    // Calcular información de paginación
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const responseData = {
      properties: formattedProperties,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        totalProperties: totalCount,
        averageRating: Math.round(averageRating * 10) / 10,
        propertiesInPage: formattedProperties.length,
      },
    };

    // Guardar en cache
    cache.set(cacheKey, responseData, cacheTTL.MEDIUM);

    logger.debug('Properties list guardado en cache', {
      cacheKey,
      propertiesCount: formattedProperties.length,
      ttl: cacheTTL.MEDIUM,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error('Error fetching properties:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
