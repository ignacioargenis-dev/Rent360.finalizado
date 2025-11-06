import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (!isAnyProvider(user.role)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de proveedor.' },
        { status: 403 }
      );
    }

    const requestId = params.id;

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

    let serviceRequest: any = null;

    if (fullUser.serviceProvider) {
      // Buscar solicitud asignada al proveedor de servicios
      serviceRequest = await db.serviceJob.findFirst({
        where: {
          id: requestId,
          serviceProviderId: fullUser.serviceProvider.id,
        },
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
      });
    } else if (fullUser.maintenanceProvider) {
      // Para maintenance providers, buscar en el modelo Maintenance
      serviceRequest = await db.maintenance.findFirst({
        where: {
          id: requestId,
          maintenanceProviderId: fullUser.maintenanceProvider.id,
        },
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
      });
    }

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes acceso a ella.' },
        { status: 404 }
      );
    }

    let responseData: any;

    if (fullUser.serviceProvider) {
      // Formato para ServiceJob
      responseData = {
        id: serviceRequest.id,
        title: serviceRequest.title,
        description: serviceRequest.description,
        serviceType: serviceRequest.serviceType,
        urgency: 'medium',
        status: serviceRequest.status.toLowerCase(),
        createdAt: serviceRequest.createdAt.toISOString(),
        clientName: serviceRequest.requester.name || 'Cliente',
        clientEmail: serviceRequest.requester.email || '',
        clientPhone: serviceRequest.requester.phone || '',
        propertyAddress: '',
        estimatedPrice: serviceRequest.basePrice || 0,
        quotedPrice: serviceRequest.finalPrice || serviceRequest.basePrice,
        preferredDate: serviceRequest.scheduledDate?.toISOString().split('T')[0] || '',
        images: serviceRequest.images ? JSON.parse(serviceRequest.images) : [],
        notes: serviceRequest.notes || '',
      };
    } else {
      // Formato para Maintenance
      responseData = {
        id: serviceRequest.id,
        title: serviceRequest.title,
        description: serviceRequest.description,
        serviceType: serviceRequest.category,
        urgency: serviceRequest.priority?.toLowerCase() || 'medium',
        status: serviceRequest.status.toLowerCase(),
        createdAt: serviceRequest.createdAt.toISOString(),
        clientName: serviceRequest.requester.name || 'Cliente',
        clientEmail: serviceRequest.requester.email || '',
        clientPhone: serviceRequest.requester.phone || '',
        propertyAddress: `${serviceRequest.property.address}, ${serviceRequest.property.commune}, ${serviceRequest.property.city}`,
        estimatedPrice: serviceRequest.estimatedCost || 0,
        preferredDate: serviceRequest.scheduledDate?.toISOString().split('T')[0] || '',
        images: serviceRequest.images ? JSON.parse(serviceRequest.images) : [],
        notes: serviceRequest.notes || '',
      };
    }

    logger.info('Solicitud de proveedor obtenida individualmente', {
      providerId: user.id,
      requestId,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      request: responseData,
    });
  } catch (error) {
    logger.error('Error obteniendo solicitud individual de proveedor:', {
      error: error instanceof Error ? error.message : String(error),
      requestId: params.id,
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
