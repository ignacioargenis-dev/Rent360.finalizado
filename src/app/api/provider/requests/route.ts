import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider, isServiceProvider, isMaintenanceProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const available = searchParams.get('available') === 'true'; // Solicitudes disponibles sin asignar

    // Obtener datos completos del usuario para acceder a las relaciones
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

    let requests: any[] = [];

    if (isServiceProvider(user.role) && fullUser.serviceProvider) {
      // Solicitudes asignadas al proveedor
      const whereClause: any = {
        serviceProviderId: fullUser.serviceProvider.id,
      };

      if (status !== 'all') {
        const statusMap: Record<string, string> = {
          pending: 'PENDING',
          quoted: 'QUOTED',
          accepted: 'ACCEPTED',
          active: 'ACTIVE',
          in_progress: 'IN_PROGRESS',
          completed: 'COMPLETED',
        };
        whereClause.status = statusMap[status.toLowerCase()] || status.toUpperCase();
      }

      const serviceJobs = await db.serviceJob.findMany({
        where: whereClause,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      requests = serviceJobs.map(req => ({
        id: req.id,
        title: req.title,
        description: req.description,
        serviceType: req.serviceType,
        urgency: 'medium',
        status: req.status.toUpperCase(),
        createdAt: req.createdAt.toISOString(),
        clientName: req.requester.name || 'Cliente',
        clientEmail: req.requester.email || '',
        clientPhone: req.requester.phone || '',
        propertyAddress: '',
        estimatedPrice: req.basePrice || 0,
        quotedPrice: req.finalPrice || req.basePrice,
        acceptedPrice:
          req.status === 'ACCEPTED' || req.status === 'COMPLETED'
            ? req.finalPrice || req.basePrice
            : null,
        finalPrice: req.finalPrice || null,
        preferredDate: req.scheduledDate?.toISOString().split('T')[0] || '',
        completedDate: req.completedDate?.toISOString().split('T')[0] || null,
        images: req.images ? JSON.parse(req.images) : [],
        notes: req.notes || '',
      }));
    } else if (isMaintenanceProvider(user.role) && fullUser.maintenanceProvider) {
      // Para maintenance providers, usar el modelo Maintenance
      const whereClause: any = {
        maintenanceProviderId: fullUser.maintenanceProvider.id,
      };

      if (status !== 'all') {
        whereClause.status = status.toUpperCase();
      }

      const maintenanceRequests = await db.maintenance.findMany({
        where: whereClause,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              city: true,
              commune: true,
              region: true,
            },
          },
          requester: {
            select: {
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      requests = maintenanceRequests.map(req => ({
        id: req.id,
        title: req.title,
        description: req.description,
        serviceType: req.category,
        urgency: req.priority?.toLowerCase() || 'medium',
        status: req.status.toUpperCase(),
        createdAt: req.createdAt.toISOString(),
        clientName: req.requester.name || 'Cliente',
        clientEmail: req.requester.email || '',
        clientPhone: req.requester.phone || '',
        propertyAddress: `${req.property.address}, ${req.property.commune}, ${req.property.city}`,
        estimatedPrice: req.estimatedCost || 0,
        preferredDate: req.scheduledDate?.toISOString().split('T')[0] || '',
        images: req.images ? JSON.parse(req.images) : [],
        notes: req.notes || '',
      }));
    }

    logger.info('Solicitudes de proveedor obtenidas', {
      providerId: user.id,
      role: user.role,
      count: requests.length,
      status,
      available,
    });

    return NextResponse.json({
      success: true,
      requests: requests,
      pagination: {
        limit,
        offset,
        total: requests.length,
        hasMore: requests.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo solicitudes de proveedor:', {
      error: error instanceof Error ? error.message : String(error),
    });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
