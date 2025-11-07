import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'TENANT' && user.role !== 'OWNER' && user.role !== 'BROKER') {
      return NextResponse.json(
        {
          error:
            'Acceso denegado. Solo inquilinos, propietarios y corredores pueden ver solicitudes.',
        },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Obtener la solicitud específica del usuario
    const serviceRequest = await db.serviceJob.findFirst({
      where: {
        id: requestId,
        requesterId: user.id,
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

    if (!serviceRequest) {
      return NextResponse.json(
        { error: 'Solicitud no encontrada o no tienes acceso a ella.' },
        { status: 404 }
      );
    }

    // Transformar datos para el frontend
    const transformedRequest = {
      id: serviceRequest.id,
      title: serviceRequest.title,
      description: serviceRequest.description,
      serviceType: serviceRequest.serviceType,
      status: serviceRequest.status.toLowerCase(),
      createdAt: serviceRequest.createdAt.toISOString(),
      scheduledDate: serviceRequest.scheduledDate?.toISOString(),
      preferredDate: serviceRequest.scheduledDate?.toISOString().split('T')[0],
      preferredTimeSlot: serviceRequest.notes?.includes('Horario preferido:')
        ? serviceRequest.notes.split('Horario preferido:')[1]?.trim()
        : 'flexible',
      basePrice: serviceRequest.basePrice,
      budgetMin: serviceRequest.basePrice,
      finalPrice: serviceRequest.finalPrice,
      quotedPrice: serviceRequest.finalPrice,
      estimatedPrice: serviceRequest.basePrice,
      notes: serviceRequest.notes,
      images: serviceRequest.images ? JSON.parse(serviceRequest.images) : [],
      requesterName: serviceRequest.requester.name,
      requesterEmail: serviceRequest.requester.email,
      serviceProviderId: serviceRequest.serviceProviderId,
      serviceProviderName: serviceRequest.serviceProvider.businessName,
    };

    logger.info('Solicitud de servicio obtenida por inquilino', {
      requestId,
      userId: user.id,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      request: transformedRequest,
    });
  } catch (error) {
    logger.error('Error obteniendo solicitud específica de servicio:', {
      error: error instanceof Error ? error.message : String(error),
      requestId: params.id,
    });
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
