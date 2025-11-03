import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const { clientId } = params;

    // Obtener todas las visitas del runner para este cliente (tenant o owner)
    const visits = await db.visit.findMany({
      where: {
        runnerId: user.id,
        OR: [
          { tenantId: clientId },
          {
            property: {
              ownerId: clientId,
            },
          },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            type: true,
            price: true,
            status: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            propertyImages: {
              select: {
                id: true,
                url: true,
                alt: true,
                createdAt: true,
              },
              take: 10,
            },
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        runnerRatings: {
          select: {
            id: true,
            overallRating: true,
            comment: true,
            clientId: true,
            createdAt: true,
          },
          where: {
            clientId: clientId,
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Determinar si el cliente es tenant o owner
    if (visits.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cliente no encontrado o sin visitas asociadas',
        },
        { status: 404 }
      );
    }

    const firstVisit = visits[0];
    let clientData: any = null;
    let clientType: 'tenant' | 'owner' = 'tenant';

    if (firstVisit?.tenant?.id === clientId) {
      clientData = firstVisit.tenant;
      clientType = 'tenant';
    } else if (firstVisit?.property?.ownerId === clientId) {
      clientData = firstVisit.property.owner;
      clientType = 'owner';
    }

    if (!clientData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos del cliente no encontrados',
        },
        { status: 404 }
      );
    }

    // Calcular estadísticas
    const completedVisits = visits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'COMPLETED';
    });
    const pendingVisits = visits.filter(v => {
      const status = (v.status || '').toString().toUpperCase();
      return status === 'SCHEDULED' || status === 'PENDING';
    });

    // Última fecha de servicio
    const lastServiceDate = completedVisits.sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    )[0]?.scheduledAt;

    // Próxima visita programada
    const nextVisit = pendingVisits.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )[0];

    // Calificación promedio
    const ratings = visits
      .map(v => {
        const clientRating = v.runnerRatings.find(r => r.clientId === clientId);
        return clientRating?.overallRating || v.rating;
      })
      .filter((r): r is number => r !== null && r !== undefined && r > 0);
    const averageRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

    // Propiedades únicas visitadas
    const uniqueProperties = Array.from(new Set(visits.map(v => v.propertyId))).map(propertyId => {
      const propertyVisit = visits.find(v => v.propertyId === propertyId);
      return propertyVisit?.property;
    });

    // Total de servicios y ganancias
    const totalEarnings = completedVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);

    // Formatear visitas para el frontend
    const formattedVisits = visits.map(v => {
      // Filtrar imágenes que pertenecen a esta visita específica
      // Las imágenes tienen metadata en el campo alt que incluye visitId
      const visitPhotos = (v.property.propertyImages || []).filter(img => {
        if (!img.alt) {
          return false;
        }
        try {
          const metadata = JSON.parse(img.alt);
          return metadata.visitId === v.id;
        } catch {
          return false;
        }
      });

      return {
        id: v.id,
        propertyId: v.propertyId,
        propertyTitle: v.property.title,
        propertyAddress: v.property.address,
        scheduledAt: v.scheduledAt.toISOString(),
        duration: v.duration,
        status: v.status,
        notes: v.notes || null,
        photosTaken: v.photosTaken,
        earnings: v.earnings,
        rating:
          v.runnerRatings.find(r => r.clientId === clientId)?.overallRating || v.rating || null,
        feedback:
          v.runnerRatings.find(r => r.clientId === clientId)?.comment || v.clientFeedback || null,
        photos: visitPhotos.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          createdAt: img.createdAt.toISOString(),
        })),
      };
    });

    logger.info('Detalles de cliente obtenidos para runner', {
      runnerId: user.id,
      clientId,
      clientType,
      totalVisits: visits.length,
    });

    return NextResponse.json({
      success: true,
      client: {
        id: clientId,
        name: clientData.name || 'Sin nombre',
        email: clientData.email || '',
        phone: clientData.phone || 'No disponible',
        address:
          clientData.address ||
          `${clientData.commune || ''}, ${clientData.city || ''}`.trim() ||
          'No disponible',
        type: clientType,
        lastServiceDate: lastServiceDate ? lastServiceDate.toISOString() : null,
        nextScheduledVisit: nextVisit ? nextVisit.scheduledAt.toISOString() : null,
        rating: Math.round(averageRating * 10) / 10,
        totalServices: visits.length,
        completedServices: completedVisits.length,
        pendingServices: pendingVisits.length,
        totalEarnings,
        propertyCount: uniqueProperties.length,
        satisfactionScore: Math.round(averageRating * 20),
      },
      visits: formattedVisits,
      properties: uniqueProperties.filter(p => p !== undefined),
      stats: {
        totalVisits: visits.length,
        completedVisits: completedVisits.length,
        pendingVisits: pendingVisits.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalEarnings,
        propertyCount: uniqueProperties.length,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalles de cliente para runner:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
