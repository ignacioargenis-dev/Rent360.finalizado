import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { PropertyStatus, PropertyType, UserRole } from '@/types';
import { ValidationError, handleError } from '@/lib/errors';
import { getPropertiesOptimized, dbOptimizer } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const propertySchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'El título no puede exceder 200 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres').max(5000, 'La descripción no puede exceder 5000 caracteres'),
  address: z.string().min(5, 'La dirección es requerida').max(300, 'La dirección no puede exceder 300 caracteres'),
  city: z.string().min(2, 'La ciudad es requerida').max(100, 'La ciudad no puede exceder 100 caracteres'),
  commune: z.string().min(2, 'La comuna es requerida').max(100, 'La comuna no puede exceder 100 caracteres'),
  region: z.string().min(2, 'La región es requerida').max(100, 'La región no puede exceder 100 caracteres'),
  price: z.number().min(1, 'El precio debe ser mayor a 0'),
  deposit: z.number().min(0, 'El depósito no puede ser negativo'),
  bedrooms: z.number().int().min(0, 'Los dormitorios no pueden ser negativos').max(20, 'Máximo 20 dormitorios'),
  bathrooms: z.number().int().min(0, 'Los baños no pueden ser negativos').max(20, 'Máximo 20 baños'),
  area: z.number().min(1, 'El área debe ser mayor a 0').max(10000, 'El área no puede exceder 10000 m²'),
  type: z.nativeEnum(PropertyType),
  status: z.nativeEnum(PropertyStatus).optional(),
  images: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const startTime = Date.now();
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const commune = searchParams.get('commune');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const minArea = searchParams.get('minArea');
    const maxArea = searchParams.get('maxArea');
    
    const skip = (page - 1) * limit;
    
    // Construir where clause optimizado
    const where: any = {};
    
    if (status) {
      where.status = status as PropertyStatus;
    }
    
    if (type) {
      where.type = type as PropertyType;
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (commune) {
      where.commune = { contains: commune, mode: 'insensitive' };
    }
    
    if (minPrice) {
      where.price = { gte: parseFloat(minPrice) };
    }
    
    if (maxPrice) {
      where.price = { ...where.price, lte: parseFloat(maxPrice) };
    }
    
    if (bedrooms) {
      where.bedrooms = { gte: parseInt(bedrooms) };
    }
    
    if (bathrooms) {
      where.bathrooms = { gte: parseInt(bathrooms) };
    }
    
    if (minArea) {
      where.area = { gte: parseFloat(minArea) };
    }
    
    if (maxArea) {
      where.area = { ...where.area, lte: parseFloat(maxArea) };
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Si no es admin, aplicar filtros según el rol
    if (user.role !== UserRole.ADMIN) {
      switch (user.role) {
        case UserRole.OWNER:
          where.ownerId = user.id;
          break;
        case UserRole.TENANT:
          where.status = PropertyStatus.AVAILABLE;
          break;
      }
    }
    
    // Validar y sanitizar parámetros de entrada
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (isNaN(min) || min < 0) {
        throw new ValidationError('Precio mínimo inválido');
      }
    }

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (isNaN(max) || max < 0 || max > 100000000) { // Límite superior razonable
        throw new ValidationError('Precio máximo inválido');
      }
    }

    if (minArea) {
      const min = parseFloat(minArea);
      if (isNaN(min) || min < 0) {
        throw new ValidationError('Área mínima inválida');
      }
    }

    if (maxArea) {
      const max = parseFloat(maxArea);
      if (isNaN(max) || max < 0 || max > 10000) { // Límite superior razonable
        throw new ValidationError('Área máxima inválida');
      }
    }

    // Validar que los rangos sean lógicos
    if (minPrice && maxPrice) {
      const min = parseFloat(minPrice);
      const max = parseFloat(maxPrice);
      if (min > max) {
        throw new ValidationError('El precio mínimo no puede ser mayor que el precio máximo');
      }
    }

    if (minArea && maxArea) {
      const min = parseFloat(minArea);
      const max = parseFloat(maxArea);
      if (min > max) {
        throw new ValidationError('El área mínima no puede ser mayor que el área máxima');
      }
    }
    
    // Usar consulta optimizada con caché
    const result = await getPropertiesOptimized({
      where,
      skip,
      take: limit,
      cache: true,
      cacheTTL: 300, // 5 minutos
      cacheKey: `properties:${JSON.stringify({ where, skip, take: limit, userId: user.id, role: user.role })}`,
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Consulta de propiedades optimizada', {
      userId: user.id,
      role: user.role,
      duration,
      filters: { status, type, city, commune, search },
      resultCount: Array.isArray(result) ? result.length : 0,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error en consulta optimizada de propiedades', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');
    
    const body = await request.json();
    
    // Validate property data
    const validatedData = propertySchema.parse({
      ...body,
      status: body.status || PropertyStatus.AVAILABLE,
    });
    
    // Construir objeto de creación compatible con Prisma
    const createData: any = {
      ...validatedData,
      images: validatedData.images ? JSON.stringify(validatedData.images) : null,
      features: validatedData.features ? JSON.stringify(validatedData.features) : null,
      ownerId: user.id,
    };

    // Remover propiedades undefined para compatibilidad con exactOptionalPropertyTypes
    if (createData.status === undefined) {
      delete createData.status;
    }

    // Create property with Prisma
    const property = await db.property.create({
      data: createData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    
    // Parse JSON fields for response
    const propertyWithParsedFields = {
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
      features: property.features ? JSON.parse(property.features) : [],
    };
    
    return NextResponse.json({
      message: 'Propiedad creada exitosamente',
      property: propertyWithParsedFields,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error in properties API:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleError(error);
    return errorResponse;
  }
}
