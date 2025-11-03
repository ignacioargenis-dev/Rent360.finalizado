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

    // Obtener todas las visitas del runner que tienen tenant asignado
    const visits = await db.visit.findMany({
      where: {
        runnerId: user.id,
        tenantId: { not: null },
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
          },
        },
        runnerRatings: {
          select: {
            overallRating: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Agrupar por tenant para obtener clientes únicos
    const clientMap = new Map<string, any>();

    visits.forEach(visit => {
      if (!visit.tenant) {
        return;
      }

      const tenantId = visit.tenant.id;
      const existing = clientMap.get(tenantId);

      if (!existing) {
        // Crear nuevo cliente
        const tenantVisits = visits.filter(v => v.tenantId === tenantId);
        const completedVisits = tenantVisits.filter(v => {
          const status = (v.status || '').toString().toUpperCase();
          return status === 'COMPLETED';
        });
        const pendingVisits = tenantVisits.filter(v => {
          const status = (v.status || '').toString().toUpperCase();
          return status === 'SCHEDULED' || status === 'PENDING';
        });

        // Última fecha de servicio
        const lastServiceDate = tenantVisits
          .filter(v => {
            const status = (v.status || '').toString().toUpperCase();
            return status === 'COMPLETED';
          })
          .sort(
            (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
          )[0]?.scheduledAt;

        // Próxima visita programada
        const nextVisit = pendingVisits.sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        )[0];

        // Calificación promedio
        const ratings = tenantVisits
          .map(v => v.runnerRatings[0]?.overallRating || v.rating)
          .filter((r): r is number => r !== null && r !== undefined && r > 0);
        const averageRating =
          ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;

        // Propiedades únicas visitadas
        const uniqueProperties = new Set(tenantVisits.map(v => v.propertyId));

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

        clientMap.set(tenantId, {
          id: tenantId,
          name: visit.tenant.name,
          email: visit.tenant.email,
          phone: visit.tenant.phone || 'No disponible',
          address:
            visit.tenant.address ||
            `${visit.tenant.commune || ''}, ${visit.tenant.city || ''}`.trim() ||
            'No disponible',
          propertyCount: uniqueProperties.size,
          lastServiceDate: lastServiceDate ? lastServiceDate.toISOString() : null,
          nextScheduledVisit: nextVisit ? nextVisit.scheduledAt.toISOString() : null,
          rating: Math.round(averageRating * 10) / 10,
          status,
          preferredTimes: [], // TODO: Extraer de preferencias si existen
          specialInstructions: null, // TODO: Extraer de notas de visitas
          totalServices: tenantVisits.length,
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
      return visitDate >= monthStart && status === 'COMPLETED';
    }).length;

    const upcomingVisits = clients.filter(c => c.nextScheduledVisit).length;

    logger.info('Clientes de runner obtenidos', {
      runnerId: user.id,
      totalClients: clients.length,
      activeClients,
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
