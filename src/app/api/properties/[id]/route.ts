import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Buscar la propiedad con sus relaciones
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        contracts: {
          where: {
            status: 'active',
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 1,
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        // maintenanceRequests: {
        //   where: {
        //     status: {
        //       in: ['completed', 'in_progress'],
        //     },
        //   },
        //   orderBy: {
        //     createdAt: 'desc',
        //   },
        //   take: 5,
        // },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Calcular rating promedio
    const averageRating =
      property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
        : 0;

    // Obtener tenant actual
    const currentTenant = property.contracts[0]?.tenant || null;

    // Formatear historial de mantenimiento (placeholder por ahora)
    const maintenanceHistory: any[] = [];

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
      images: property.images
        ? JSON.parse(property.images).map((img: string) =>
            img.startsWith('/images/')
              ? img.replace('/images/', '/api/uploads/')
              : img.startsWith('/uploads/')
                ? img.replace('/uploads/', '/api/uploads/')
                : img
          )
        : [],
      views: property.views,
      inquiries: property.inquiries,
      owner: property.owner,
      currentTenant,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: property.reviews.length,
      maintenanceHistory,

      // Características adicionales
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
    };

    logger.info('Property details retrieved successfully', {
      propertyId,
      ownerId: property.ownerId,
      status: property.status,
    });

    return NextResponse.json(formattedProperty);
  } catch (error) {
    logger.error('Error retrieving property details', {
      error: error instanceof Error ? error.message : String(error),
      propertyId: params.id,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ CORREGIDO: Mejor manejo de errores de autenticación
    let user;
    try {
      user = await requireAuth(request);
    } catch (authError) {
      logger.error('Authentication error in PUT property:', {
        error: authError instanceof Error ? authError.message : String(authError),
        propertyId: params.id,
      });
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const propertyId = params.id;
    const body = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Verificar que la propiedad existe y pertenece al usuario
    const existingProperty = await db.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });

    if (!existingProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // ✅ CORREGIDO: Verificar permisos (propietario, corredor y administrador pueden editar)
    if (existingProperty.ownerId !== user.id && user.role !== 'ADMIN' && user.role !== 'BROKER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Preparar datos para actualización
    const updateData: any = {
      title: body.title,
      address: body.address,
      city: body.city,
      commune: body.commune,
      region: body.region,
      type: body.type,
      bedrooms: parseInt(body.bedrooms) || 0,
      bathrooms: parseInt(body.bathrooms) || 0,
      area: parseFloat(body.area) || 0,
      price: parseFloat(body.price) || 0,
      status: body.status,
      description: body.description,
      features: body.features ? JSON.stringify(body.features) : null,
      images: body.images ? JSON.stringify(body.images) : null,
      // Características básicas
      furnished: Boolean(body.furnished),
      petFriendly: Boolean(body.petFriendly),
      parkingSpaces: parseInt(body.parkingSpaces) || 0,
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      floor: parseInt(body.floor) || null,
      buildingName: body.buildingName || null,
      yearBuilt: parseInt(body.yearBuilt) || null,
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

    // ✅ CORREGIDO: Actualizar la propiedad con mejor manejo de errores
    let updatedProperty;
    try {
      updatedProperty = await db.property.update({
        where: { id: propertyId },
        data: updateData,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
    } catch (dbError) {
      logger.error('Database error updating property:', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        propertyId,
        updateData: Object.keys(updateData),
      });
      return NextResponse.json(
        {
          error: 'Error actualizando la propiedad en la base de datos',
          details: dbError instanceof Error ? dbError.message : String(dbError),
        },
        { status: 500 }
      );
    }

    logger.info('Property updated successfully', {
      propertyId,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      message: 'Property updated successfully',
      property: updatedProperty,
    });
  } catch (error) {
    logger.error('Error updating property', {
      error: error instanceof Error ? error.message : String(error),
      propertyId: params.id,
    });

    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
