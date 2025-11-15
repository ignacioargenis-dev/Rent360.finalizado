import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/clients/[clientId]
 * Obtiene detalles completos de un cliente específico del broker
 */
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    // ✅ CRÍTICO: Log inicial para verificar que la petición llega
    logger.info('🔍 [CLIENT_DETAIL] Iniciando GET /api/broker/clients/[clientId]', {
      url: request.url,
      method: request.method,
      hasCookies: !!request.cookies,
      cookieNames: request.cookies.getAll().map(c => c.name),
    });

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      logger.warn('❌ [CLIENT_DETAIL] Usuario no es BROKER', { userId: user.id, role: user.role });
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;

    logger.info('✅ [CLIENT_DETAIL] Usuario autenticado como BROKER', {
      userId: user.id,
      clientId,
    });

    // Buscar la relación brokerClient para este broker y cliente
    // Primero intentar buscar por ID de brokerClient
    let brokerClient = await db.brokerClient.findFirst({
      where: {
        id: clientId,
        brokerId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            rut: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            createdAt: true,
            // Propiedades del usuario si es OWNER
            properties: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
                images: true,
                createdAt: true,
              },
              take: 10,
            },
          },
        },
        managedProperties: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
                images: true,
                createdAt: true,
              },
            },
          },
        },
        prospect: {
          select: {
            id: true,
            status: true,
            priority: true,
            notes: true,
            lastContactDate: true,
            nextFollowUpDate: true,
          },
        },
      },
    });

    // Si no se encuentra por ID de brokerClient, buscar por userId
    if (!brokerClient) {
      brokerClient = await db.brokerClient.findFirst({
        where: {
          userId: clientId,
          brokerId: user.id,
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
              rut: true,
              address: true,
              city: true,
              commune: true,
              region: true,
              createdAt: true,
              properties: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  price: true,
                  type: true,
                  status: true,
                  images: true,
                  createdAt: true,
                },
                take: 10,
              },
            },
          },
          managedProperties: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  price: true,
                  type: true,
                  status: true,
                  images: true,
                  createdAt: true,
                },
              },
            },
          },
          prospect: {
            select: {
              id: true,
              status: true,
              priority: true,
              notes: true,
              lastContactDate: true,
              nextFollowUpDate: true,
            },
          },
        },
      });
    }

    // Si aún no se encuentra, buscar clientes que tienen contratos pero no relación BrokerClient
    if (!brokerClient) {
      // Verificar si el clienteId corresponde a un usuario con contratos
      const clientUser = await db.user.findUnique({
        where: { id: clientId },
        include: {
          contractsAsOwner: {
            where: {
              brokerId: user.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
            take: 1,
          },
          contractsAsTenant: {
            where: {
              brokerId: user.id,
              status: { in: ['ACTIVE', 'PENDING'] },
            },
            take: 1,
          },
        },
      });

      if (
        clientUser &&
        (clientUser.contractsAsOwner.length > 0 || clientUser.contractsAsTenant.length > 0)
      ) {
        // Crear un objeto similar a brokerClient para mantener compatibilidad
        brokerClient = {
          id: `temp_${clientUser.id}`,
          userId: clientUser.id,
          brokerId: user.id,
          status: 'ACTIVE' as const,
          managementType: 'FULL' as const,
          commissionRate: 5,
          exclusivity: false,
          startDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: clientUser.id,
            name: clientUser.name || '',
            email: clientUser.email || '',
            phone: clientUser.phone || null,
            avatar: clientUser.avatar || null,
            role: clientUser.role,
            rut: clientUser.rut || null,
            address: clientUser.address || null,
            city: clientUser.city || null,
            commune: clientUser.commune || null,
            region: clientUser.region || null,
            createdAt: clientUser.createdAt,
            properties: [],
          },
          managedProperties: [],
          prospect: null,
        } as any;
      }
    }

    if (!brokerClient) {
      logger.warn('Broker client relationship not found', {
        clientId,
        brokerId: user.id,
      });
      return NextResponse.json(
        { error: 'Cliente no encontrado o no autorizado.' },
        { status: 404 }
      );
    }

    // Obtener contratos activos si existen
    const contracts = await db.contract.findMany({
      where: {
        OR: [
          {
            ownerId: brokerClient.userId,
            brokerId: user.id,
            status: 'ACTIVE',
          },
          {
            tenantId: brokerClient.userId,
            brokerId: user.id,
            status: 'ACTIVE',
          },
        ],
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            type: true,
            status: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        owner: {
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
    });

    // Calcular estadísticas
    const totalPropertiesManaged = brokerClient.managedProperties.length;
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'ACTIVE').length;

    // Calcular ingresos estimados
    const estimatedMonthlyIncome = contracts.reduce((sum, contract) => {
      const monthlyRent = contract.monthlyRent || 0;
      const commission = monthlyRent * (brokerClient.commissionRate / 100);
      return sum + commission;
    }, 0);

    // Determinar el tipo de cliente - mantener mayúsculas para consistencia con el sistema
    // OWNER, TENANT, BOTH (en mayúsculas como el schema de Prisma)
    const clientTypeValue = brokerClient.clientType; // OWNER, TENANT, o BOTH

    // Obtener propiedades del cliente
    const clientPropertiesData = brokerClient.user.properties || [];

    // Calcular datos financieros
    const totalSpent = contracts.reduce((sum, c) => sum + (c.monthlyRent || 0), 0);
    const satisfactionScore = brokerClient.satisfactionRating
      ? Math.round(brokerClient.satisfactionRating * 20)
      : 95;

    // Obtener fecha de último contacto
    const lastContactDate = brokerClient.lastInteraction || brokerClient.startDate;

    // Parsear servicios ofrecidos si existe
    let servicesOfferedArray: string[] = [];
    if (brokerClient.servicesOffered) {
      try {
        servicesOfferedArray = JSON.parse(brokerClient.servicesOffered);
      } catch {
        servicesOfferedArray = [];
      }
    }

    // Formatear respuesta en el formato que espera el frontend
    // Nota: El frontend espera minúsculas en getTypeBadge, pero mantenemos mayúsculas aquí
    // El frontend deberá hacer toLowerCase() al usarlo en getTypeBadge si es necesario
    const clientDetail = {
      id: brokerClient.id,
      clientId: brokerClient.user.id,
      name: brokerClient.user.name || 'Sin nombre',
      email: brokerClient.user.email || '',
      phone: brokerClient.user.phone || '',
      type: clientTypeValue.toLowerCase(), // Convertir a minúsculas solo para el frontend en este endpoint específico
      clientType: clientTypeValue, // Mantener mayúsculas en campo adicional para consistencia
      status: brokerClient.status.toLowerCase() === 'active' ? 'active' : 'inactive',
      registrationDate: brokerClient.startDate.toISOString(),
      lastContact: lastContactDate.toISOString(),
      preferredContactMethod: 'email' as const, // Default, puede mejorarse

      // Budget y preferencias (para inquilinos)
      budget:
        clientTypeValue === 'TENANT' || clientTypeValue === 'BOTH'
          ? {
              min: 0,
              max: 0,
              currency: 'CLP',
            }
          : undefined,

      preferences: {
        propertyType: [],
        bedrooms: 0,
        bathrooms: 0,
        location: [],
        features: [],
      },

      // Documentos del cliente/usuario
      documents: await db.document
        .findMany({
          where: {
            OR: [
              { uploadedById: brokerClient.userId },
              {
                property: {
                  OR: [
                    { ownerId: brokerClient.userId },
                    {
                      contracts: {
                        some: {
                          OR: [{ ownerId: brokerClient.userId }, { tenantId: brokerClient.userId }],
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            type: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        })
        .then(docs =>
          docs.map(doc => ({
            id: doc.id,
            name: doc.name || doc.fileName || 'Documento sin nombre',
            type: doc.mimeType || 'application/pdf',
            uploadDate: doc.createdAt.toISOString(),
            size: `${(doc.fileSize / 1024 / 1024).toFixed(2)} MB`,
            category:
              doc.type === 'IDENTIFICATION'
                ? ('identification' as const)
                : doc.type === 'FINANCIAL' || doc.type === 'INVOICE' || doc.type === 'RECEIPT'
                  ? ('financial' as const)
                  : doc.type === 'CONTRACT'
                    ? ('contract' as const)
                    : ('other' as const),
          }))
        ),

      // Interacciones (vacío por ahora, se puede implementar después)
      interactions: [],

      // Propiedades del cliente
      properties: clientPropertiesData.map(prop => ({
        id: prop.id,
        title: prop.title || 'Propiedad sin título',
        address: prop.address || 'Sin dirección',
        status: 'interested' as const,
        notes: '',
      })),

      // Contratos
      contracts: contracts.map(contract => ({
        id: contract.id,
        propertyTitle: contract.property.title || 'Propiedad',
        propertyAddress: contract.property.address || '',
        startDate: contract.startDate.toISOString(),
        endDate: contract.endDate?.toISOString() || '',
        monthlyRent: contract.monthlyRent || 0,
        status: contract.status === 'ACTIVE' ? ('active' as const) : ('completed' as const),
        commission: Math.round((contract.monthlyRent || 0) * (brokerClient.commissionRate / 100)),
      })),

      // Datos financieros
      financialData: {
        totalSpent,
        averageRating: brokerClient.satisfactionRating || 4.8,
        contractCount: totalContracts,
        satisfactionScore,
      },

      // Información adicional (no usada por el frontend pero útil)
      stats: {
        totalPropertiesManaged,
        totalContracts,
        activeContracts,
        estimatedMonthlyIncome,
      },

      // Propiedades gestionadas
      managedProperties: brokerClient.managedProperties.map(mp => ({
        id: mp.property.id,
        title: mp.property.title,
        address: mp.property.address,
        price: mp.property.price,
        type: mp.property.type,
        status: mp.property.status,
        images: mp.property.images ? JSON.parse(mp.property.images) : [],
      })),

      // Información del prospect si existe
      prospectInfo: brokerClient.prospect
        ? {
            id: brokerClient.prospect.id,
            status: brokerClient.prospect.status,
            priority: brokerClient.prospect.priority,
            notes: brokerClient.prospect.notes,
            lastContactDate: brokerClient.prospect.lastContactDate?.toISOString(),
            nextFollowUpDate: brokerClient.prospect.nextFollowUpDate?.toISOString(),
          }
        : null,
    };

    logger.info('Client details retrieved successfully', {
      clientId,
      brokerId: user.id,
      clientName: brokerClient.user.name,
      clientType: clientTypeValue, // Mantener mayúsculas para consistencia con el sistema
    });

    return NextResponse.json({
      success: true,
      data: clientDetail, // ✅ Cambiado de 'client' a 'data' para que el frontend lo encuentre
    });
  } catch (error) {
    // ✅ CRÍTICO: Log detallado de errores
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('❌ [CLIENT_DETAIL] Error obteniendo detalles del cliente:', {
      error: errorMessage,
      stack: errorStack,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    // ✅ CRÍTICO: También usar console.error para asegurar que se vea en logs
    console.error('❌ [CLIENT_DETAIL] Error crítico:', errorMessage, errorStack);

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/broker/clients/[clientId]
 * Actualiza información de un cliente específico del broker
 */
export async function PUT(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;
    const body = await request.json();

    // Buscar la relación brokerClient
    let brokerClient = await db.brokerClient.findFirst({
      where: {
        id: clientId,
        brokerId: user.id,
      },
    });

    // Si no se encuentra por ID de brokerClient, buscar por userId
    if (!brokerClient) {
      brokerClient = await db.brokerClient.findFirst({
        where: {
          userId: clientId,
          brokerId: user.id,
          status: 'ACTIVE',
        },
      });
    }

    if (!brokerClient) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no autorizado.' },
        { status: 404 }
      );
    }

    // Actualizar datos del usuario
    const updatedUser = await db.user.update({
      where: { id: brokerClient.userId },
      data: {
        name: body.name || undefined,
        email: body.email || undefined,
        phone: body.phone || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        region: body.region || undefined,
        commune: body.commune || undefined,
        bio: body.notes || undefined,
      },
    });

    // Actualizar datos de brokerClient si se proporcionan
    const updatedBrokerClient = await db.brokerClient.update({
      where: { id: brokerClient.id },
      data: {
        notes: body.notes || undefined,
        lastInteraction: new Date(),
      },
    });

    logger.info('Cliente actualizado exitosamente', {
      clientId,
      brokerId: user.id,
      clientName: updatedUser.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: {
        id: updatedBrokerClient.id,
        clientId: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        region: updatedUser.region,
      },
    });
  } catch (error) {
    logger.error('Error actualizando cliente:', {
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
