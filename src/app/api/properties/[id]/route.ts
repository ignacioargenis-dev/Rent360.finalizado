import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;

    logger.info('Fetching property details', { propertyId });

    // Buscar la propiedad con información del propietario
    const property = await db.property.findUnique({
      where: {
        id: propertyId,
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
    });

    if (!property) {
      logger.warn('Property not found', { propertyId });
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Transformar las imágenes para usar las rutas correctas de API
    const transformedImages = property.images
      ? (Array.isArray(property.images) ? property.images : JSON.parse(property.images)).map(
          (img: string) => {
            let transformedImg = img;

            // Si la imagen ya tiene la ruta correcta de API, no hacer nada
            if (img.startsWith('/api/uploads/')) {
              transformedImg = img;
            }
            // Si empieza con /images/, convertir a /api/uploads/
            else if (img.startsWith('/images/')) {
              transformedImg = img.replace('/images/', '/api/uploads/');
            }
            // Si empieza con /uploads/, convertir a /api/uploads/
            else if (img.startsWith('/uploads/')) {
              transformedImg = img.replace('/uploads/', '/api/uploads/');
            }
            // Si es una ruta relativa, asumir que está en uploads
            else if (!img.startsWith('http') && !img.startsWith('/')) {
              transformedImg = `/api/uploads/${img}`;
            }

            // Agregar timestamp único para cada imagen para evitar problemas de caché
            const separator = transformedImg.includes('?') ? '&' : '?';
            const uniqueTimestamp = Date.now() + Math.random();
            return `${transformedImg}${separator}t=${uniqueTimestamp}`;
          }
        )
      : [];

    // Formatear la respuesta
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
      images: transformedImages,
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner,
      currentTenant: property.contracts[0]?.tenant || null,
      averageRating:
        property.reviews.length > 0
          ? property.reviews.reduce((sum, review) => sum + review.rating, 0) /
            property.reviews.length
          : 0,
      totalReviews: property.reviews.length,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,

      // Características adicionales
      furnished: property.furnished || false,
      petFriendly: property.petFriendly || false,
      parkingSpaces: property.parkingSpaces || 0,
      availableFrom: property.availableFrom,
      floor: property.floor,
      buildingName: property.buildingName,
      yearBuilt: property.yearBuilt,

      // Características del edificio/servicios
      heating: property.heating || false,
      cooling: property.cooling || false,
      internet: property.internet || false,
      elevator: property.elevator || false,
      balcony: property.balcony || false,
      terrace: property.terrace || false,
      garden: property.garden || false,
      pool: property.pool || false,
      gym: property.gym || false,
      security: property.security || false,
      concierge: property.concierge || false,

      // Campos adicionales
      brokerId: property.brokerId,
      currency: 'CLP', // Valor por defecto
    };

    logger.info('Property details fetched successfully', {
      propertyId,
      hasImages: transformedImages.length > 0,
      ownerId: property.owner?.id,
    });

    return NextResponse.json({
      success: true,
      property: formattedProperty,
    });
  } catch (error) {
    logger.error('Error fetching property details', { error, propertyId: params.id });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Endpoint para incrementar vistas
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const body = await request.json();

    if (body.action === 'increment_views') {
      // Incrementar el contador de vistas
      const updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: {
          views: {
            increment: 1,
          },
        },
      });

      logger.info('Property views incremented', { propertyId, newViews: updatedProperty.views });

      return NextResponse.json({
        success: true,
        views: updatedProperty.views,
      });
    }

    if (body.action === 'increment_inquiries') {
      // Incrementar el contador de consultas
      const updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: {
          inquiries: {
            increment: 1,
          },
        },
      });

      logger.info('Property inquiries incremented', {
        propertyId,
        newInquiries: updatedProperty.inquiries,
      });

      return NextResponse.json({
        success: true,
        inquiries: updatedProperty.inquiries,
      });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    logger.error('Error updating property counters', {
      error: error instanceof Error ? error.message : error,
      propertyId: params.id,
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const body = await request.json();

    logger.info('Updating property', { propertyId, fields: Object.keys(body) });

    // Preparar los datos para actualizar (solo campos que existen en el esquema)
    const updateData: any = {
      title: body.title,
      description: body.description,
      address: body.address,
      city: body.city,
      region: body.region,
      type: body.type,
      bedrooms: parseInt(body.bedrooms),
      bathrooms: parseInt(body.bathrooms),
      area: parseFloat(body.area),
      price: parseFloat(body.price),
      status: body.status,
      features: JSON.stringify(body.features || []),
      images: JSON.stringify(body.images || []),

      // Características básicas
      furnished: Boolean(body.furnished),
      petFriendly: Boolean(body.petFriendly),
      parkingSpaces: parseInt(body.parkingSpaces) || 0,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      floor: body.floor ? parseInt(body.floor) : null,
      buildingName: body.buildingName || null,
      yearBuilt: body.yearBuilt ? parseInt(body.yearBuilt) : null,

      // Características del edificio/servicios
      heating: Boolean(body.heating),
      cooling: Boolean(body.cooling),
      internet: Boolean(body.internet),
      elevator: Boolean(body.elevator),
      balcony: Boolean(body.balcony),
      terrace: Boolean(body.terrace),
      garden: Boolean(body.garden),
      pool: Boolean(body.pool),
      gym: Boolean(body.gym),
      security: Boolean(body.security),
      concierge: Boolean(body.concierge),

      updatedAt: new Date(),
    };

    // Actualizar la propiedad
    const updatedProperty = await db.property.update({
      where: {
        id: propertyId,
      },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    logger.info('Property updated successfully', { propertyId });

    return NextResponse.json({
      success: true,
      property: updatedProperty,
    });
  } catch (error) {
    logger.error('Error updating property', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      propertyId: params.id,
    });

    // Proporcionar más detalles del error para debugging
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: errorMessage,
        propertyId: params.id,
      },
      { status: 500 }
    );
  }
}
