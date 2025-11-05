import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo propietarios, inquilinos y corredores pueden ver sus solicitudes
    if (!['OWNER', 'TENANT', 'BROKER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver solicitudes de servicios' },
        { status: 403 }
      );
    }

    const userId = user.id;

    const serviceRequests = await db.serviceJob.findMany({
      where: {
        requesterId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // Transformar los datos para el frontend
    const transformedRequests = serviceRequests.map(request => ({
      id: request.id,
      serviceType: request.serviceType,
      title: request.title,
      description: request.description,
      status: request.status,
      scheduledDate: request.scheduledDate,
      basePrice: request.basePrice,
      finalPrice: request.finalPrice,
      rating: request.rating,
      feedback: request.feedback,
      createdAt: request.createdAt,
      requesterName: request.requester.name,
      serviceProviderName: request.serviceProvider.businessName,
      images: request.images ? JSON.parse(request.images) : [],
    }));

    return NextResponse.json({
      success: true,
      data: transformedRequests,
    });
  } catch (error) {
    logger.error('Error obteniendo solicitudes de servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitudes de servicio' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const { serviceType, description, urgency, preferredDate, budget, serviceProviderId } = body;

    // Validación básica
    if (!serviceType || !description) {
      return NextResponse.json(
        { error: 'El tipo de servicio y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // Solo propietarios, inquilinos y corredores pueden solicitar servicios
    if (!['OWNER', 'TENANT', 'BROKER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para solicitar servicios' },
        { status: 403 }
      );
    }

    // ✅ Validar que el serviceProviderId existe y corresponde a un ServiceProvider
    let providerId: string | null = null;
    if (serviceProviderId) {
      const provider = await db.serviceProvider.findUnique({
        where: { id: serviceProviderId },
        select: { id: true },
      });

      if (!provider) {
        return NextResponse.json(
          { error: 'Proveedor de servicios no encontrado' },
          { status: 404 }
        );
      }

      providerId = provider.id;
    }

    // Si no se proporcionó un proveedor, crear solicitud sin asignar (para que aparezca en el marketplace)
    // Por ahora, requerimos que se proporcione un proveedor
    if (!providerId) {
      return NextResponse.json(
        { error: 'Debe especificar un proveedor de servicios' },
        { status: 400 }
      );
    }

    // Crear la solicitud de servicio en la base de datos
    const serviceRequest = await db.serviceJob.create({
      data: {
        serviceProviderId: providerId, // ✅ Usar el ID del proveedor seleccionado
        requesterId: user.id,
        title: `${serviceType} - Solicitud de ${user.name || 'Usuario'}`,
        description,
        serviceType,
        status: 'PENDING',
        scheduledDate: preferredDate ? new Date(preferredDate) : null,
        basePrice: budget ? parseFloat(budget) : 0,
      },
      include: {
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
        serviceProvider: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    logger.info('Nueva solicitud de servicio doméstico creada:', {
      requesterId: user.id,
      serviceProviderId: providerId,
      serviceType,
      requestId: serviceRequest.id,
    });

    return NextResponse.json({
      success: true,
      request: {
        id: serviceRequest.id,
        requesterId: serviceRequest.requesterId,
        requesterName: serviceRequest.requester.name,
        serviceProviderId: serviceRequest.serviceProviderId,
        serviceProviderName: serviceRequest.serviceProvider.businessName,
        serviceType: serviceRequest.serviceType,
        description: serviceRequest.description,
        status: serviceRequest.status,
        scheduledDate: serviceRequest.scheduledDate,
        budget: serviceRequest.basePrice,
        createdAt: serviceRequest.createdAt,
      },
      message: 'Solicitud de servicio enviada exitosamente. El proveedor recibirá tu solicitud.',
    });
  } catch (error) {
    logger.error('Error creando solicitud de servicio:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
