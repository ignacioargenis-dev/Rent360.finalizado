import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { UserRatingService } from '@/lib/user-rating-service';
// import { handleApiError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/provider/clients
 * Obtiene la lista de clientes (usuarios que han solicitado servicios) del proveedor autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    // Obtener datos completos del usuario
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: {
        serviceProvider: true,
        maintenanceProvider: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });
    }

    const clientsMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        avatar: string | null;
        location: string;
        totalServices: number;
        totalSpent: number;
        averageRating: number;
        lastServiceDate: string | null;
        status: 'active' | 'inactive' | 'prospect';
        preferredContact: 'email' | 'phone' | 'whatsapp';
        serviceTypes: string[];
        createdAt: string;
      }
    >();

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      // Obtener todos los trabajos (ServiceJob) del proveedor
      const serviceJobs = await db.serviceJob.findMany({
        where: {
          serviceProviderId: fullUser.serviceProvider.id,
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              createdAt: true,
            },
          },
          transactions: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              amount: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Procesar trabajos para construir lista de clientes
      for (const job of serviceJobs) {
        if (!job.requester) {
          continue;
        }

        const clientId = job.requester.id;
        // ServiceJob no tiene relación directa con Property
        // Usar la dirección del trabajo si está disponible, o un valor por defecto
        const location =
          (job as any).address || (job as any).location || 'Ubicación no especificada';

        // Calcular fecha del trabajo
        const jobDateStr: string | null = job.createdAt
          ? job.createdAt.toISOString().split('T')[0] || null
          : null;

        const existingClient = clientsMap.get(clientId);

        if (existingClient) {
          // Actualizar cliente existente
          existingClient.totalServices += 1;

          // Sumar gasto de transacciones completadas
          const jobTotal = job.transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          existingClient.totalSpent += jobTotal;

          // Actualizar fecha del último servicio
          if (
            jobDateStr &&
            (!existingClient.lastServiceDate ||
              (existingClient.lastServiceDate && jobDateStr > existingClient.lastServiceDate))
          ) {
            existingClient.lastServiceDate = jobDateStr;
          }

          // Agregar tipo de servicio si no existe
          if (job.serviceType && !existingClient.serviceTypes.includes(job.serviceType)) {
            existingClient.serviceTypes.push(job.serviceType);
          }
        } else {
          // Crear nuevo cliente
          const jobTotal = job.transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);

          clientsMap.set(clientId, {
            id: clientId,
            name: job.requester.name || 'Sin nombre',
            email: job.requester.email,
            phone: job.requester.phone,
            avatar: job.requester.avatar,
            location,
            totalServices: 1,
            totalSpent: jobTotal,
            averageRating: 0, // Se calculará después si hay ratings
            lastServiceDate: jobDateStr,
            status: job.status === 'COMPLETED' ? 'active' : 'prospect',
            preferredContact: 'email',
            serviceTypes: job.serviceType ? [job.serviceType] : [],
            createdAt:
              (job.requester.createdAt?.toISOString().split('T')[0] ??
                new Date().toISOString().split('T')[0]) ||
              '',
          });
        }
      }

      // Obtener ratings reales usando UserRatingService para cada cliente
      for (const [clientId, client] of clientsMap.entries()) {
        try {
          const ratingSummary = await UserRatingService.getUserRatingSummary(clientId);
          client.averageRating = ratingSummary?.averageRating || 0;
        } catch (error) {
          logger.warn('Error obteniendo calificación promedio para cliente:', {
            clientId,
            error: error instanceof Error ? error.message : String(error),
          });
          client.averageRating = 0;
        }
      }
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Obtener todos los trabajos de mantenimiento (Maintenance) del proveedor
      const maintenanceJobs = await db.maintenance.findMany({
        where: {
          maintenanceProviderId: fullUser.maintenanceProvider.id,
        },
        include: {
          property: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  avatar: true,
                  createdAt: true,
                },
              },
            },
          },
          transactions: {
            where: {
              status: 'COMPLETED',
            },
            select: {
              amount: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Procesar trabajos de mantenimiento
      for (const job of maintenanceJobs) {
        // Para mantenimiento, el cliente es el owner de la propiedad
        const property = (job as any).property;
        const client = property?.owner || null;
        if (!client) {
          continue;
        }

        const clientId = client.id;
        const location = property
          ? `${property.address || ''}, ${property.city || ''}, ${property.region || ''}`
              .trim()
              .replace(/^,\s*|,\s*$/g, '')
          : 'Ubicación no especificada';

        const existingClient = clientsMap.get(clientId);

        if (existingClient) {
          existingClient.totalServices += 1;
          const jobTotal = job.transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          existingClient.totalSpent += jobTotal;

          const jobDateStr: string | null = job.createdAt
            ? job.createdAt.toISOString().split('T')[0] || null
            : null;
          if (
            jobDateStr &&
            (!existingClient.lastServiceDate ||
              (existingClient.lastServiceDate && jobDateStr > existingClient.lastServiceDate))
          ) {
            existingClient.lastServiceDate = jobDateStr;
          }
        } else {
          const jobTotal = job.transactions.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const jobDateStr: string | null = job.createdAt
            ? job.createdAt.toISOString().split('T')[0] || null
            : null;

          clientsMap.set(clientId, {
            id: clientId,
            name: client.name || 'Sin nombre',
            email: client.email,
            phone: client.phone,
            avatar: client.avatar,
            location,
            totalServices: 1,
            totalSpent: jobTotal,
            averageRating: job.rating || 0,
            lastServiceDate: jobDateStr,
            status: job.status === 'COMPLETED' ? 'active' : 'prospect',
            preferredContact: 'email',
            serviceTypes: ['Mantenimiento'],
            createdAt:
              (client.createdAt?.toISOString().split('T')[0] ??
                new Date().toISOString().split('T')[0]) ||
              '',
          });
        }
      }
    }

    // Convertir map a array y ordenar por última fecha de servicio
    const clients = Array.from(clientsMap.values()).sort((a, b) => {
      if (!a.lastServiceDate) {
        return 1;
      }
      if (!b.lastServiceDate) {
        return -1;
      }
      return b.lastServiceDate.localeCompare(a.lastServiceDate);
    });

    // Calcular estadísticas - usar calificación promedio real del proveedor para el resumen
    let providerAverageRating = 0;
    try {
      const providerRatingSummary = await UserRatingService.getUserRatingSummary(user.id);
      providerAverageRating = providerRatingSummary?.averageRating || 0;
    } catch (error) {
      logger.warn('Error obteniendo calificación promedio del proveedor:', {
        providerId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    const stats = {
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
      totalRevenue: clients.reduce((sum, c) => sum + c.totalSpent, 0),
      averageRating: providerAverageRating, // Usar calificación promedio real del proveedor
      newClientsThisMonth: clients.filter(c => {
        const clientDate = new Date(c.createdAt);
        const now = new Date();
        return (
          clientDate.getMonth() === now.getMonth() && clientDate.getFullYear() === now.getFullYear()
        );
      }).length,
      repeatClients: clients.filter(c => c.totalServices > 1).length,
    };

    logger.info('Clientes obtenidos para proveedor', {
      providerId: user.id,
      totalClients: clients.length,
      stats,
    });

    return NextResponse.json({
      success: true,
      clients,
      stats,
    });
  } catch (error) {
    logger.error('Error obteniendo clientes del proveedor', { error });
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
