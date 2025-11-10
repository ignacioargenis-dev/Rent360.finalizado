import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { NotificationService, NotificationType } from '@/lib/notification-service';

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

    // Obtener tanto solicitudes iniciales (brokerServiceRequest) como trabajos activos (serviceJob)
    const [brokerRequests, serviceJobs] = await Promise.all([
      // Solicitudes iniciales a corredores
      db.brokerServiceRequest.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          responses: {
            include: {
              broker: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1, // Solo la respuesta más reciente
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),
      // Trabajos activos con proveedores
      db.serviceJob.findMany({
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
      }),
    ]);

    // Transformar las solicitudes de corredores
    const transformedBrokerRequests = brokerRequests.map(request => {
      const latestResponse = request.responses[0];
      const budget = request.budget as any; // JSON field
      return {
        id: request.id,
        serviceType: request.requestType,
        title: request.title,
        description: request.description,
        status:
          request.status === 'OPEN'
            ? 'PENDING'
            : request.status === 'ASSIGNED'
              ? 'QUOTED'
              : request.status,
        scheduledDate: null, // No hay campo específico para fecha preferida
        preferredTimeSlot: null, // No hay campo específico para horario
        budgetMin: budget?.min || null,
        budgetMax: budget?.max || null,
        createdAt: request.createdAt,
        providerName: latestResponse?.broker.name || 'Esperando respuesta',
        providerEmail: latestResponse?.broker.email,
        providerId: latestResponse?.broker.id,
        notes: null, // No hay campo para notas adicionales
        images: [], // No hay campo para imágenes en este modelo
        type: 'broker_request', // Para distinguir el tipo
      };
    });

    // Transformar los trabajos con proveedores
    const transformedServiceJobs = serviceJobs.map(request => ({
      id: request.id,
      serviceType: request.serviceType,
      title: request.title,
      description: request.description,
      status: request.status,
      scheduledDate: request.scheduledDate,
      basePrice: request.basePrice,
      finalPrice: request.finalPrice,
      quotedPrice: request.finalPrice,
      rating: request.rating,
      feedback: request.feedback,
      createdAt: request.createdAt,
      providerName: request.serviceProvider.businessName,
      requesterName: request.requester.name,
      images: request.images ? JSON.parse(request.images) : [],
      type: 'service_job', // Para distinguir el tipo
    }));

    // Combinar y ordenar por fecha de creación
    const allRequests = [...transformedBrokerRequests, ...transformedServiceJobs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allRequests,
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
    console.log('🚨🚨🚨 [SERVICE REQUEST] Starting service request creation');
    const user = await requireAuth(request);
    console.log('🚨 [SERVICE REQUEST] User authenticated:', user.id, user.role);

    const body = await request.json();
    console.log('🚨 [SERVICE REQUEST] Request body:', body);
    const {
      serviceType,
      description,
      urgency,
      preferredDate,
      preferredTimeSlot,
      budgetMin,
      budgetMax,
      serviceProviderId,
    } = body;

    // Validación básica
    if (!serviceType || !description) {
      return NextResponse.json(
        { error: 'El tipo de servicio y descripción son obligatorios' },
        { status: 400 }
      );
    }

    // Validar tipo de servicio
    const validServiceTypes = ['maintenance', 'cleaning', 'moving', 'security', 'other'];
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json({ error: 'Tipo de servicio no válido' }, { status: 400 });
    }

    // Solo propietarios, inquilinos y corredores pueden solicitar servicios
    if (!['OWNER', 'TENANT', 'BROKER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para solicitar servicios' },
        { status: 403 }
      );
    }

    // ✅ Validar que el serviceProviderId existe y corresponde a un ServiceProvider
    console.log('🚨 [SERVICE REQUEST] Validating serviceProviderId:', serviceProviderId);

    if (!serviceProviderId) {
      console.log('🚨 [SERVICE REQUEST] ERROR: serviceProviderId is missing');
      return NextResponse.json(
        { error: 'Debe especificar un proveedor de servicios' },
        { status: 400 }
      );
    }

    console.log('🚨 [SERVICE REQUEST] Looking up provider in database...');
    const provider = await db.serviceProvider.findUnique({
      where: { id: serviceProviderId },
      select: { id: true },
    });

    console.log('🚨 [SERVICE REQUEST] Provider lookup result:', provider ? 'found' : 'not found');

    if (!provider) {
      console.log('🚨 [SERVICE REQUEST] ERROR: Provider not found in database');
      return NextResponse.json({ error: 'Proveedor de servicios no encontrado' }, { status: 404 });
    }

    console.log('🚨 [SERVICE REQUEST] Provider validation passed');

    // Crear la solicitud de servicio en la base de datos
    console.log('🚨 [SERVICE REQUEST] Creating ServiceJob...');
    const serviceRequest = await db.serviceJob.create({
      data: {
        serviceProviderId: serviceProviderId, // ✅ Usar el ID del proveedor seleccionado
        requesterId: user.id,
        title: `${serviceType} - Solicitud de ${user.name || 'Usuario'}`,
        description,
        serviceType,
        status: 'PENDING',
        scheduledDate: preferredDate ? new Date(preferredDate) : null,
        basePrice: budgetMin ? Number(budgetMin) : 0,
        finalPrice: null,
        images: null,
        notes: preferredTimeSlot ? `Horario preferido: ${preferredTimeSlot}` : null,
        rating: null,
        feedback: null,
        completedDate: null,
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
      serviceProviderId: serviceProviderId,
      serviceType,
      requestId: serviceRequest.id,
    });

    // ✅ ENVIAR NOTIFICACIÓN AL PROVEEDOR
    try {
      // Obtener el usuario del proveedor para enviar la notificación
      const providerUser = await db.user.findFirst({
        where: {
          serviceProvider: {
            id: serviceProviderId,
          },
        },
        select: { id: true },
      });

      if (providerUser) {
        await NotificationService.create({
          userId: providerUser.id,
          type: NotificationType.SERVICE_REQUEST_RECEIVED,
          title: `Nueva solicitud de servicio: ${serviceType}`,
          message: `${user.name || 'Un usuario'} ha solicitado tus servicios de ${serviceType}. ${preferredDate ? `Fecha preferida: ${preferredDate}` : ''}`,
          link: `/provider/requests/${serviceRequest.id}`,
          metadata: {
            serviceRequestId: serviceRequest.id,
            requesterId: user.id,
            requesterName: user.name || 'Usuario',
            serviceType,
            description,
            preferredDate,
            preferredTimeSlot,
            budgetMin,
            budgetMax,
          },
        });

        logger.info('✅ Notificación enviada al proveedor por nueva solicitud de servicio:', {
          providerUserId: providerUser.id,
          serviceRequestId: serviceRequest.id,
        });
      }
    } catch (notificationError) {
      logger.warn('Error enviando notificación de solicitud de servicio:', notificationError);
      // No fallar la creación de la solicitud si falla la notificación
    }

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
        preferredTimeSlot: preferredTimeSlot,
        budgetMin: budgetMin,
        budgetMax: budgetMax,
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
