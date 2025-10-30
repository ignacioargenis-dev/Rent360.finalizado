import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de propietario.' },
        { status: 403 }
      );
    }

    const rawProperties = await db.property.findMany({
      where: {
        ownerId: user.id,
        // Mostrar propiedades disponibles, alquiladas y pendientes de aprobación
        status: {
          in: ['AVAILABLE', 'RENTED', 'PENDING'],
        },
      },
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        price: true,
        deposit: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        type: true,
        status: true,
        images: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info(`Owner properties loaded: ${rawProperties.length} properties for user ${user.id}`, {
      userId: user.id,
      propertiesCount: rawProperties.length,
      statuses: rawProperties.map(p => p.status),
    });

    // Parsear imágenes JSON y asegurar que sean arrays
    const properties = rawProperties.map(property => ({
      ...property,
      images: property.images ? JSON.parse(property.images) : [],
    }));

    return NextResponse.json({
      success: true,
      properties,
    });
  } catch (error) {
    logger.error('Error fetching owner properties:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
