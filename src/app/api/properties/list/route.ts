import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PropertyStatus, PropertyType, UserRole } from '@/types';
import { handleApiError } from '@/lib/api-error-handler';
import { cacheManager, createCacheKey, cacheConfigs } from '@/lib/cache-manager';
import { safeAverage, roundToDecimal } from '@/lib/math-utils';

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

    // Filtro por rol de usuario
    if (user.role === 'owner') {
      where.ownerId = user.id;
    } else if (user.role === UserRole.BROKER) {
      where.OR = [
        { ownerId: user.id },
        { brokerId: user.id },
      ];
    }
    // Admin puede ver todas las propiedades

    // Crear clave de cache basada en parámetros y usuario
    const cacheKey = createCacheKey('properties:list', {
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
      sortOrder
    });

    // Intentar obtener del cache primero
    const cachedResult = cacheManager.get(cacheKey);
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
            select: { id: true, tenantId: true },
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
    const averageRating = properties.length > 0 
      ? properties.reduce((acc, property) => {
          const ratings = property.reviews.map(review => review.rating);
          return acc + (ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);
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
      images: property.images ? JSON.parse(property.images) : [],
      owner: property.owner,
      currentTenant: property.contracts[0]?.tenant || null,
      averageRating: safeAverage(property.reviews.map(review => review.rating)),
      totalReviews: property.reviews.length,
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

    // Guardar en cache con tags para invalidación
    cacheManager.setWithTags(cacheKey, responseData, ['properties', `user:${user.id}`], cacheConfigs.property.ttl);

    logger.debug('Properties list guardado en cache', {
      cacheKey,
      propertiesCount: formattedProperties.length,
      ttl: cacheConfigs.property.ttl
    });

    return NextResponse.json(responseData);
    
  } catch (error) {
    logger.error('Error fetching properties:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
