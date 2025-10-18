import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { handleApiError } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;

    // Buscar la propiedad
    const property = await db.property.findUnique({
      where: { id: propertyId },
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
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && user.role !== 'ADMIN') {
      if (user.role === 'OWNER' && property.ownerId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
      if (user.role === 'BROKER' && property.brokerId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    // Formatear respuesta
    const formattedProperty = {
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
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner,
      currentTenant: property.contracts[0]?.tenant || null,
      reviews: property.reviews,
      averageRating:
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0,
      totalReviews: property.reviews.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };

    return NextResponse.json({ property: formattedProperty });
  } catch (error) {
    logger.error('Error fetching property:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;
    const body = await request.json();

    // Verificar que la propiedad existe
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && user.role !== 'ADMIN') {
      if (user.role === 'OWNER' && existingProperty.ownerId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }
    }

    // Actualizar la propiedad
    const updatedProperty = await db.property.update({
      where: { id: propertyId },
      data: {
        title: body.title,
        description: body.description,
        address: body.address,
        city: body.city,
        commune: body.commune,
        region: body.region,
        price: body.price,
        deposit: body.deposit,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        area: body.area,
        type: body.type,
        status: body.status,
        features: body.features ? JSON.stringify(body.features) : null,
        updatedAt: new Date(),
      },
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

    return NextResponse.json({
      message: 'Propiedad actualizada exitosamente',
      property: updatedProperty,
    });
  } catch (error) {
    logger.error('Error updating property:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const propertyId = params.id;

    // Verificar que la propiedad existe
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Solo admin puede eliminar propiedades
    if (user.role !== 'ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Eliminar la propiedad
    await db.property.delete({
      where: { id: propertyId },
    });

    return NextResponse.json({ message: 'Propiedad eliminada exitosamente' });
  } catch (error) {
    logger.error('Error deleting property:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
