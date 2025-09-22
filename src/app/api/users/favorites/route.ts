import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Esquemas de validación
const addFavoriteSchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad requerido')
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    logger.info('Obteniendo favoritos del usuario', { userId: user.id });

    // Obtener propiedades favoritas del usuario
    const favorites = await db.propertyFavorite.findMany({
      where: { userId: user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            price: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            images: true,
            status: true,
            type: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const favoriteProperties = favorites.map(fav => ({
      id: fav.property.id,
      title: fav.property.title,
      address: fav.property.address,
      city: fav.property.city,
      commune: fav.property.commune,
      price: fav.property.price,
      bedrooms: fav.property.bedrooms,
      bathrooms: fav.property.bathrooms,
      area: fav.property.area,
      images: fav.property.images,
      status: fav.property.status,
      type: fav.property.type,
      favoritedAt: fav.createdAt.toISOString()
    }));

    logger.info('Favoritos obtenidos exitosamente', {
      userId: user.id,
      count: favoriteProperties.length
    });

    return NextResponse.json({
      success: true,
      data: favoriteProperties
    });

  } catch (error) {
    logger.error('Error obteniendo favoritos:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = addFavoriteSchema.parse(body);

    // Verificar que la propiedad existe y está disponible
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId }
    });

    if (!property) {
      throw new ValidationError('Propiedad no encontrada');
    }

    // Verificar que no esté ya en favoritos
    const existingFavorite = await db.propertyFavorite.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: validatedData.propertyId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json({
        success: false,
        message: 'La propiedad ya está en favoritos'
      });
    }

    // Agregar a favoritos
    const favorite = await db.propertyFavorite.create({
      data: {
        userId: user.id,
        propertyId: validatedData.propertyId
      }
    });

    logger.info('Propiedad agregada a favoritos', {
      userId: user.id,
      propertyId: validatedData.propertyId
    });

    return NextResponse.json({
      success: true,
      message: 'Propiedad agregada a favoritos',
      data: favorite
    }, { status: 201 });

  } catch (error) {
    logger.error('Error agregando propiedad a favoritos:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      throw new ValidationError('ID de propiedad requerido');
    }

    // Verificar que el favorito existe
    const existingFavorite = await db.propertyFavorite.findUnique({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: propertyId
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json({
        success: false,
        message: 'La propiedad no está en favoritos'
      });
    }

    // Eliminar de favoritos
    await db.propertyFavorite.delete({
      where: {
        userId_propertyId: {
          userId: user.id,
          propertyId: propertyId
        }
      }
    });

    logger.info('Propiedad eliminada de favoritos', {
      userId: user.id,
      propertyId: propertyId
    });

    return NextResponse.json({
      success: true,
      message: 'Propiedad eliminada de favoritos'
    });

  } catch (error) {
    logger.error('Error eliminando propiedad de favoritos:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
