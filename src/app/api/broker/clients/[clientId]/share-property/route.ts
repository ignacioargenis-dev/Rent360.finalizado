import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';
import crypto from 'crypto';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const sharePropertySchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad es requerido'),
  message: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

/**
 * POST /api/broker/clients/[clientId]/share-property
 * Comparte una propiedad con un cliente/inquilino mediante enlace en el sistema de mensajería
 */
export async function POST(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    logger.info(
      '🔍 [SHARE_PROPERTY_CLIENT] Iniciando POST /api/broker/clients/[clientId]/share-property'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;
    const body = await request.json();
    logger.info('📋 [SHARE_PROPERTY_CLIENT] Datos recibidos:', body);

    // Validar datos
    const validatedData = sharePropertySchema.parse(body);

    // Buscar la relación brokerClient
    let brokerClient = await db.brokerClient.findFirst({
      where: {
        OR: [
          { id: clientId, brokerId: user.id },
          { userId: clientId, brokerId: user.id, status: 'ACTIVE' },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Si no se encuentra por brokerClient, buscar usuario directamente
    if (!brokerClient) {
      const clientUser = await db.user.findUnique({
        where: { id: clientId },
        include: {
          contractsAsOwner: {
            where: { brokerId: user.id },
            take: 1,
          },
          contractsAsTenant: {
            where: { brokerId: user.id },
            take: 1,
          },
        },
      });

      if (
        !clientUser ||
        (clientUser.contractsAsOwner.length === 0 && clientUser.contractsAsTenant.length === 0)
      ) {
        return NextResponse.json(
          { error: 'Cliente no encontrado o no autorizado' },
          { status: 404 }
        );
      }

      // Crear objeto temporal para mantener compatibilidad
      brokerClient = {
        id: `temp_${clientUser.id}`,
        userId: clientUser.id,
        brokerId: user.id,
        user: {
          id: clientUser.id,
          email: clientUser.email || '',
          name: clientUser.name || '',
        },
      } as any;
    }

    // Verificar que brokerClient existe después de todas las búsquedas
    if (!brokerClient || !brokerClient.user) {
      return NextResponse.json({ error: 'Cliente no encontrado o no autorizado' }, { status: 404 });
    }

    // Verificar que la propiedad existe
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        managedByBroker: {
          where: {
            brokerId: user.id,
            status: 'ACTIVE',
          },
          take: 1,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar que el corredor tiene acceso a la propiedad
    const hasAccess =
      property.ownerId === user.id || // Propiedad propia del broker
      property.managedByBroker.length > 0; // Propiedad gestionada por el broker

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes permisos para compartir esta propiedad' },
        { status: 403 }
      );
    }

    // Generar link único de seguimiento
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/properties/${property.id}?share=${shareToken}&broker=${user.id}&client=${brokerClient.userId}`;

    // Crear mensaje en el sistema de mensajería con el enlace de la propiedad
    const messageContent = validatedData.message
      ? `${validatedData.message}\n\n🔗 Ver propiedad: ${shareLink}`
      : `Hola ${brokerClient.user.name || 'cliente'}, te comparto esta propiedad que podría interesarte:\n\n🏠 ${property.title}\n📍 ${property.address}\n💰 ${new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(property.price || 0)}\n\n🔗 Ver detalles: ${shareLink}`;

    // Crear mensaje en el sistema de mensajería
    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId: brokerClient.userId,
        subject: `Propiedad compartida: ${property.title}`,
        content: messageContent,
        type: 'PROPERTY_SHARE',
        status: 'SENT',
        isRead: false,
        propertyId: property.id, // Asociar con la propiedad
      },
    });

    // Crear actividad del cliente si existe relación BrokerClient
    if (brokerClient.id && !brokerClient.id.startsWith('temp_')) {
      try {
        await db.clientActivity.create({
          data: {
            clientId: brokerClient.id,
            brokerId: user.id,
            activityType: 'property_view',
            title: `Propiedad compartida: ${property.title}`,
            description:
              validatedData.message || `Se compartió la propiedad ubicada en ${property.address}`,
            metadata: {
              propertyId: property.id,
              propertyTitle: property.title,
              propertyPrice: property.price,
              shareLink,
              messageId: message.id,
            },
          },
        });
      } catch (activityError) {
        logger.warn('No se pudo crear actividad del cliente', { error: activityError });
      }
    }

    logger.info('Propiedad compartida con cliente mediante mensajería', {
      brokerId: user.id,
      clientId: brokerClient.userId,
      propertyId: validatedData.propertyId,
      messageId: message.id,
      shareLink,
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: message.id,
        shareLink,
        property: {
          id: property.id,
          title: property.title,
          address: property.address,
        },
      },
      message: 'Propiedad compartida exitosamente mediante sistema de mensajería',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    logger.error('Error compartiendo propiedad con cliente:', {
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
