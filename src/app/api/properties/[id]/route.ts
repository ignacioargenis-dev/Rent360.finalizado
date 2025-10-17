import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

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
            img.startsWith('/images/') ? img.replace('/images/', '/uploads/') : img
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
