import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { NotificationService, NotificationType } from '@/lib/notification-service';
import { getUserFromRequest } from '@/lib/auth-token-validator';

// Forzar renderizado dinámico para evitar caché y asegurar que la ruta funcione correctamente
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// CRÍTICO: Asegurar que la ruta se ejecute en el servidor Node.js, no en Edge Runtime
// Esto es necesario para que las APIs de Prisma funcionen correctamente
export const runtime = 'nodejs';
export const preferredRegion = 'auto';

const messageSchema = z.object({
  receiverId: z.string(),
  subject: z.string().min(1).optional(),
  content: z.string().min(1),
  type: z
    .enum(['direct', 'property_inquiry', 'contract_related', 'support'])
    .optional()
    .default('direct'),
  propertyId: z.string().optional(),
  contractId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Validar token directamente - NO depender del middleware
    console.log('🔍 MESSAGES API: Iniciando validación de token (GET)');
    const decoded = await getUserFromRequest(request);

    console.log(
      '🔍 MESSAGES API: Resultado de validación (GET):',
      decoded ? 'USUARIO VÁLIDO' : 'NO AUTORIZADO'
    );

    if (!decoded) {
      console.error('🔍 MESSAGES API: NO SE PUDO VALIDAR TOKEN (GET)');
      logger.error('🔍 /api/messages (GET): Token inválido o no presente');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Token de autenticación inválido o no presente',
        },
        { status: 401 }
      );
    }

    // Crear objeto user compatible
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    console.log('✅ MESSAGES API: Usuario autenticado (GET):', user.email, 'ID:', user.id);

    logger.info('Usuario autenticado para mensajes (GET):', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type');
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    // Construir filtro
    let where: any = {};

    // Si se especifica receiverId, buscar conversación entre user y receiverId
    if (receiverId) {
      console.log('🔍 MESSAGES API (GET): Buscando conversación con receiverId:', receiverId);
      console.log('🔍 MESSAGES API (GET): Usuario actual:', user.id);

      where = {
        OR: [
          // Mensajes enviados por el usuario actual al otro usuario
          { senderId: user.id, receiverId: receiverId },
          // Mensajes enviados por el otro usuario al usuario actual
          { senderId: receiverId, receiverId: user.id },
        ],
      };

      console.log('🔍 MESSAGES API (GET): Filtro de conversación construido');
    } else {
      // Sin receiverId específico, mostrar todos los mensajes del usuario
      where = {
        OR: [{ senderId: user.id }, { receiverId: user.id }],
      };
    }

    // Filtros adicionales
    if (type) {
      where.type = type;
    }

    if (senderId && !receiverId) {
      // Solo aplicar senderId si no hay receiverId (para evitar conflictos)
      where.senderId = senderId;
    }

    if (unreadOnly) {
      where.receiverId = user.id;
      where.isRead = false;
    }

    console.log('🔍 MESSAGES API (GET): Ejecutando query con filtro:', JSON.stringify(where));

    // Obtener mensajes
    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          subject: true,
          content: true,
          type: true,
          status: true,
          isRead: true,
          createdAt: true,
          updatedAt: true,
          readAt: true,
          attachmentUrl: true,
          attachmentName: true,
          attachmentSize: true,
          attachmentType: true,
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: true,
            },
          },
          contract: {
            select: {
              id: true,
              contractNumber: true,
              property: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
        orderBy: {
          // Si es una conversación específica (receiverId), ordenar de más antiguo a más reciente
          // Si es listado general, ordenar de más reciente a más antiguo
          createdAt: receiverId ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
      db.message.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Error al obtener mensajes:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar token directamente - NO depender del middleware
    console.log('🔍 MESSAGES API: Iniciando validación de token (POST)');
    const decoded = await getUserFromRequest(request);

    console.log(
      '🔍 MESSAGES API: Resultado de validación (POST):',
      decoded ? 'USUARIO VÁLIDO' : 'NO AUTORIZADO'
    );

    if (!decoded) {
      console.error('🔍 MESSAGES API: NO SE PUDO VALIDAR TOKEN (POST)');
      logger.error('🔍 /api/messages (POST): Token inválido o no presente');
      return NextResponse.json(
        {
          success: false,
          error: 'No autorizado',
          message: 'Token de autenticación inválido o no presente',
        },
        { status: 401 }
      );
    }

    // Crear objeto user compatible
    const user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    console.log('✅ MESSAGES API: Usuario autenticado (POST):', user.email, 'ID:', user.id);

    const data = await request.json();

    // Validar los datos de entrada
    let validatedData;
    try {
      validatedData = messageSchema.parse(data);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    const { receiverId, subject, content, type, propertyId, contractId } = validatedData;

    console.log('📨 [API MESSAGES] Procesando envío:', {
      senderId: user.id,
      senderRole: user.role,
      receiverId,
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
    });

    // LOG ESPECÍFICO PARA PROVIDER
    if (user.role === 'PROVIDER') {
      console.log('🚨🚨🚨 [PROVIDER MESSAGE] PROVIDER ENVIANDO MENSAJE:', {
        providerId: user.id,
        providerEmail: user.email,
        receiverId,
        messageLength: content.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Generar subject automático si no se proporciona
    const messageSubject = subject || `Mensaje de ${user.name || user.email}`;

    // Verificar que el receptor exista
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      console.error('❌ [API MESSAGES] Receptor no encontrado:', receiverId);
      return NextResponse.json({ error: 'Receptor no encontrado' }, { status: 404 });
    }

    console.log('✅ [API MESSAGES] Receptor encontrado:', {
      receiverId,
      receiverRole: receiver.role,
      receiverName: receiver.name,
    });

    // Verificar que no se envíe mensaje a sí mismo
    if (receiverId === user.id) {
      console.warn('⚠️ [API MESSAGES] Intento de auto-mensaje:', user.id);
      return NextResponse.json({ error: 'No puedes enviar mensajes a ti mismo' }, { status: 400 });
    }

    // Si se especifica propiedad, verificar que exista
    if (propertyId) {
      const property = await db.property.findUnique({
        where: { id: propertyId },
      });

      if (!property) {
        return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
      }
    }

    // Si se especifica contrato, verificar que exista
    if (contractId) {
      const contract = await db.contract.findUnique({
        where: { id: contractId },
      });

      if (!contract) {
        return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
      }
    }

    // Crear mensaje
    console.log('💾 [API MESSAGES] Creando mensaje en BD...');
    const message = await db.message.create({
      data: {
        senderId: user.id,
        receiverId,
        subject: messageSubject,
        content,
        type: type || 'direct',
        propertyId: propertyId || null,
        contractId: contractId || null,
        isRead: false,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        subject: true,
        content: true,
        type: true,
        status: true,
        isRead: true,
        createdAt: true,
        updatedAt: true,
        readAt: true,
        attachmentUrl: true,
        attachmentName: true,
        attachmentSize: true,
        attachmentType: true,
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            property: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    console.log('✅ [API MESSAGES] Mensaje creado exitosamente:', {
      messageId: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      receiverRole: message.receiver?.role,
      contentLength: message.content.length,
    });

    // Enviar notificación al receptor
    try {
      const notificationData: any = {
        recipientId: receiverId,
        senderId: user.id,
        senderName: user.name,
        subject,
        content,
        messageId: message.id,
        type: type || 'direct',
      };

      if (propertyId) {
        notificationData.propertyId = propertyId;
      }
      if (contractId) {
        notificationData.contractId = contractId;
      }

      console.log('📨 [MESSAGES API] Enviando notificación a:', notificationData.recipientId);

      // LOG ESPECÍFICO PARA PROVIDER - envío de notificación
      if (user.role === 'PROVIDER') {
        console.log('🚨🚨🚨 [PROVIDER NOTIFICATION] PROVIDER enviando notificación:', {
          providerId: user.id,
          recipientId: notificationData.recipientId,
          messageId: message.id,
          notificationType: NotificationType.NEW_MESSAGE,
        });
      }

      await NotificationService.create({
        userId: notificationData.recipientId,
        type: NotificationType.NEW_MESSAGE,
        title: `Nuevo mensaje: ${subject}`,
        message: content.length > 100 ? content.substring(0, 100) + '...' : content,
        link: `/messages/${message.id}`,
        metadata: {
          messageId: message.id,
          senderId: notificationData.senderId,
          senderName: notificationData.senderName,
          subject,
          content,
          type: notificationData.type,
          propertyId: notificationData.propertyId,
          contractId: notificationData.contractId,
        },
      });

      console.log('✅ [MESSAGES API] Notificación enviada exitosamente');

      // LOG ESPECÍFICO PARA PROVIDER - notificación enviada
      if (user.role === 'PROVIDER') {
        console.log(
          '✅✅✅ [PROVIDER NOTIFICATION] Notificación enviada exitosamente desde PROVIDER'
        );
      }
    } catch (notificationError) {
      // No fallar la respuesta si hay error en notificaciones
      logger.warn('Error sending message notification', { error: notificationError });
    }

    return NextResponse.json(
      {
        message: 'Mensaje enviado exitosamente',
        data: message,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error al enviar mensaje:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
