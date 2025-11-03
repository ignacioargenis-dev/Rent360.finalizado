import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    // Obtener TODAS las visitas del runner (tanto con tenant como sin tenant)
    const visits = await db.visit.findMany({
      where: {
        runnerId: user.id,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            commune: true,
            avatar: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            ownerId: true,
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                city: true,
                commune: true,
                avatar: true,
              },
            },
          },
        },
        runnerRatings: {
          select: {
            overallRating: true,
            clientId: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Agrupar por cliente (tenant o owner) para obtener clientes únicos
    const clientMap = new Map<string, any>();

    visits.forEach(visit => {
      // Determinar el cliente: puede ser tenant o owner
      let clientId: string | null = null;
      let clientData: any = null;

      if (visit.tenant) {
        // Cliente es un tenant
        clientId = visit.tenant.id;
        clientData = visit.tenant;
      } else if (visit.property?.owner) {
        // Cliente es el propietario de la propiedad
        clientId = visit.property.owner.id;
        clientData = visit.property.owner;
      }

      if (!clientId || !clientData) {
        return;
      }

      const existing = clientMap.get(clientId);

      if (!existing) {
        // Obtener todas las visitas de este cliente (tenant o owner)
        const clientVisits = visits.filter(v => {
          if (v.tenant?.id === clientId) {
            return true;
          }
          if (v.property?.ownerId === clientId) {
            return true;
          }
          return false;
        });

        const completedVisits = clientVisits.filter(v => {
          const status = (v.status || '').toString().toUpperCase();
          return status === 'COMPLETED';
        });
        const pendingVisits = clientVisits.filter(v => {
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

        // Calificación promedio - buscar ratings donde el clientId coincida
        const ratings = clientVisits
          .map(v => {
            // Buscar rating del cliente específico
            const clientRating = v.runnerRatings.find(r => r.clientId === clientId)?.overallRating;
            return clientRating || v.rating;
          })
          .filter((r): r is number => r !== null && r !== undefined && r > 0);
        const averageRating =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        // Propiedades únicas visitadas
        const uniqueProperties = new Set(clientVisits.map(v => v.propertyId));

        // Determinar status
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const lastService = lastServiceDate ? new Date(lastServiceDate) : null;
        const status: 'active' | 'inactive' | 'pending' =
          pendingVisits.length > 0
            ? 'active'
            : lastService && lastService >= thirtyDaysAgo
              ? 'active'
              : 'inactive';

        clientMap.set(clientId, {
          id: clientId,
          name: clientData.name || 'Sin nombre',
          email: clientData.email || '',
          phone: clientData.phone || 'No disponible',
          address:
            clientData.address ||
            `${clientData.commune || ''}, ${clientData.city || ''}`.trim() ||
            'No disponible',
          propertyCount: uniqueProperties.size,
          lastServiceDate: lastServiceDate ? lastServiceDate.toISOString() : '',
          nextScheduledVisit: nextVisit ? nextVisit.scheduledAt.toISOString() : undefined,
          rating: Math.round(averageRating * 10) / 10,
          status,
          preferredTimes: [], // TODO: Extraer de preferencias si existen
          specialInstructions: null, // TODO: Extraer de notas de visitas
          totalServices: clientVisits.length,
          satisfactionScore: Math.round(averageRating * 20), // Convertir a porcentaje (1-5 -> 20-100)
        });
      }
    });

    const clients = Array.from(clientMap.values());

    // Calcular estadísticas
    const activeClients = clients.filter(c => c.status === 'active').length;
    const averageRating =
      clients.length > 0 ? clients.reduce((sum, c) => sum + c.rating, 0) / clients.length : 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const servicesThisMonth = visits.filter(v => {
      const visitDate = new Date(v.scheduledAt);
      const status = (v.status || '').toString().toUpperCase();
      return visitDate >= monthStart && visitDate <= now && status === 'COMPLETED';
    }).length;

    const upcomingVisits = clients.filter(c => c.nextScheduledVisit).length;

    logger.info('Clientes de runner obtenidos', {
      runnerId: user.id,
      totalVisits: visits.length,
      totalClients: clients.length,
      activeClients,
      averageRating: Math.round(averageRating * 10) / 10,
      servicesThisMonth,
      upcomingVisits,
    });

    return NextResponse.json({
      success: true,
      clients,
      stats: {
        totalClients: clients.length,
        activeClients,
        averageRating: Math.round(averageRating * 10) / 10,
        servicesThisMonth,
        upcomingVisits,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo clientes de runner:', {
      error: error instanceof Error ? error.message : String(error),
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
