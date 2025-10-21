import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { z } from 'zod';
import { NotificationService } from '@/lib/notification-service';

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
    // Obtener usuario del middleware (ya validado)
    const user = (request as any).user;

    logger.info('🔍 /api/messages: Verificando usuario', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
    });

    if (!user) {
      logger.error('🔍 /api/messages: No se encontró información de usuario en la request');
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    logger.info('Usuario autenticado para mensajes:', {
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
    const where: any = {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    };

    if (type) {
      where.type = type;
    }

    if (senderId) {
      where.senderId = senderId;
    }

    if (receiverId) {
      where.receiverId = receiverId;
    }

    if (unreadOnly) {
      where.receiverId = user.id;
      where.isRead = false;
    }

    // Obtener mensajes
    const [messages, total] = await Promise.all([
      db.message.findMany({
        where,
        include: {
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
          createdAt: 'desc',
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
    // Intentar obtener usuario del middleware primero, luego fallback a requireAuth
    let user = (request as any).user;

    if (!user) {
      // Fallback: usar requireAuth si el middleware no adjuntó la información
      const decoded = await requireAuth(request);
      user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name,
      };
    }

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

    // Generar subject automático si no se proporciona
    const messageSubject = subject || `Mensaje de ${user.name || user.email}`;

    // Verificar que el receptor exista
    const receiver = await db.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receptor no encontrado' }, { status: 404 });
    }

    // Verificar que no se envíe mensaje a sí mismo
    if (receiverId === user.id) {
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
      include: {
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

      await NotificationService.notifyNewMessage(notificationData);
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
