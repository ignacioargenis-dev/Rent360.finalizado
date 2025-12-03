import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/clients/[clientId]/favorites
 * Obtiene las propiedades favoritas de un cliente (solo para brokers)
 */
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;

    // Buscar la relación brokerClient
    let brokerClient = await db.brokerClient.findFirst({
      where: {
        OR: [
          { id: clientId, brokerId: user.id },
          { userId: clientId, brokerId: user.id, status: 'ACTIVE' },
        ],
      },
      select: {
        id: true,
        userId: true,
        brokerId: true,
      },
    });

    // Si no se encuentra por brokerClient, buscar usuario directamente
    if (!brokerClient) {
      const clientUser = await db.user.findUnique({
        where: { id: clientId },
        include: {
          contractsAsOwner: {
            where: { brokerId: user.id },
            take: 1,
          },
          contractsAsTenant: {
            where: { brokerId: user.id },
            take: 1,
          },
        },
      });

      if (
        !clientUser ||
        (clientUser.contractsAsOwner.length === 0 && clientUser.contractsAsTenant.length === 0)
      ) {
        return NextResponse.json(
          { error: 'Cliente no encontrado o no autorizado' },
          { status: 404 }
        );
      }

      brokerClient = {
        id: `temp_${clientUser.id}`,
        userId: clientUser.id,
        brokerId: user.id,
      } as any;
    }

    // Obtener propiedades favoritas del cliente
    const favorites = await db.propertyFavorite.findMany({
      where: { userId: brokerClient.userId },
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
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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
      images: fav.property.images ? JSON.parse(fav.property.images) : [],
      status: fav.property.status,
      type: fav.property.type,
      favoritedAt: fav.createdAt.toISOString(),
    }));

    logger.info('Favoritos del cliente obtenidos', {
      brokerId: user.id,
      clientId: brokerClient.userId,
      count: favoriteProperties.length,
    });

    return NextResponse.json({
      success: true,
      data: favoriteProperties,
    });
  } catch (error) {
    logger.error('Error obteniendo favoritos del cliente:', {
      error: error instanceof Error ? error.message : String(error),
      clientId: params.clientId,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
