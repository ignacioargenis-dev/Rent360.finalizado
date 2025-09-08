import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Esquemas de validación
const createExtrajudicialNoticeSchema = z.object({
  noticeType: z.enum([
    'PAYMENT_REQUIREMENT',
    'DAMAGE_NOTICE',
    'CONTRACT_VIOLATION',
    'EVICTION_WARNING',
    'FINAL_NOTICE',
    'SETTLEMENT_OFFER'
  ]),
  deliveryMethod: z.enum([
    'CERTIFIED_MAIL',
    'NOTARIAL_NOTICE',
    'PERSONAL_DELIVERY',
    'ELECTRONIC_NOTICE',
    'COURT_NOTICE'
  ]),
  content: z.string().min(10, 'El contenido debe tener al menos 10 caracteres'),
  amount: z.number().min(0, 'El monto debe ser mayor o igual a 0'),
  deadline: z.string().datetime(),
  deliveryProof: z.string().optional()
});

const updateExtrajudicialNoticeSchema = z.object({
  deliveryStatus: z.enum([
    'PENDING',
    'SENT',
    'DELIVERED',
    'RECEIVED',
    'RETURNED',
    'FAILED'
  ]).optional(),
  sentDate: z.string().datetime().optional(),
  deliveredDate: z.string().datetime().optional(),
  receivedBy: z.string().optional(),
  responseReceived: z.boolean().optional(),
  responseDate: z.string().datetime().optional(),
  responseContent: z.string().optional(),
  responseAmount: z.number().min(0).optional(),
  followUpSent: z.boolean().optional(),
  escalationSent: z.boolean().optional()
});

// POST /api/legal/cases/[id]/extrajudicial - Crear notificación extrajudicial
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = createExtrajudicialNoticeSchema.parse(body);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo propietario, corredor o admin pueden crear notificaciones
    const canCreateNotice = 
      user.role === 'ADMIN' ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canCreateNotice) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear notificaciones extrajudiciales para este caso' },
        { status: 403 }
      );
    }

    // Verificar que el caso esté en fase pre-judicial o extrajudicial
    if (!['PRE_JUDICIAL', 'EXTRAJUDICIAL_NOTICE'].includes(legalCase.status)) {
      return NextResponse.json(
        { error: 'El caso legal no está en fase para enviar notificaciones extrajudiciales' },
        { status: 400 }
      );
    }

    // Generar número único de notificación
    const noticeNumber = `EN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear la notificación extrajudicial
    const extrajudicialNotice = await db.extrajudicialNotice.create({
      data: {
        noticeNumber,
        legalCaseId: params.id,
        noticeType: validatedData.noticeType,
        deliveryMethod: validatedData.deliveryMethod,
        content: validatedData.content,
        amount: validatedData.amount,
        deadline: new Date(validatedData.deadline),
        deliveryProof: validatedData.deliveryProof
      }
    });

    // Actualizar el estado del caso legal
    await db.legalCase.update({
      where: { id: params.id },
      data: {
        status: 'EXTRAJUDICIAL_NOTICE',
        extrajudicialSentDate: new Date(),
        currentPhase: 'EXTRAJUDICIAL',
        nextDeadline: new Date(validatedData.deadline)
      }
    });

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: params.id,
        userId: user.id,
        action: 'EXTRAJUDICIAL_NOTICE_CREATED',
        details: `Notificación extrajudicial creada: ${validatedData.noticeType}`,
        newValue: JSON.stringify(extrajudicialNotice)
      }
    });

    // Enviar notificaciones
    await db.legalNotification.createMany({
      data: [
        {
          legalCaseId: params.id,
          userId: legalCase.contract.tenantId,
          notificationType: 'ACTION_REQUIRED',
          title: 'Notificación Extrajudicial Recibida',
          message: `Ha recibido una notificación extrajudicial relacionada con su contrato. Por favor revise los detalles y responda antes de la fecha límite.`,
          priority: 'high',
          status: 'pending',
          actionRequired: true,
          actionDeadline: new Date(validatedData.deadline)
        },
        {
          legalCaseId: params.id,
          userId: legalCase.ownerId,
          notificationType: 'STATUS_UPDATE',
          title: 'Notificación Extrajudicial Enviada',
          message: `Se ha enviado exitosamente la notificación extrajudicial. El siguiente paso es esperar la respuesta del inquilino.`,
          priority: 'medium',
          status: 'pending'
        }
      ]
    });

    logger.info('Notificación extrajudicial creada exitosamente', {
      context: 'legal.extrajudicial.create',
      userId: user.id,
      caseId: params.id,
      noticeId: extrajudicialNotice.id,
      noticeNumber: extrajudicialNotice.noticeNumber
    });

    return NextResponse.json({
      success: true,
      data: extrajudicialNotice,
      message: 'Notificación extrajudicial creada exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al crear notificación extrajudicial', {
      context: 'legal.extrajudicial.create',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/legal/cases/[id]/extrajudicial - Obtener notificaciones extrajudiciales
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo participantes del caso pueden ver las notificaciones
    const canViewNotices = 
      user.role === 'ADMIN' ||
      user.id === legalCase.tenantId ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canViewNotices) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver las notificaciones extrajudiciales de este caso' },
        { status: 403 }
      );
    }

    // Obtener notificaciones extrajudiciales
    const extrajudicialNotices = await db.extrajudicialNotice.findMany({
      where: { legalCaseId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    logger.info('Notificaciones extrajudiciales obtenidas exitosamente', {
      context: 'legal.extrajudicial.list',
      userId: user.id,
      caseId: params.id,
      count: extrajudicialNotices.length
    });

    return NextResponse.json({
      success: true,
      data: extrajudicialNotices
    });

  } catch (error) {
    logger.error('Error al obtener notificaciones extrajudiciales', {
      context: 'legal.extrajudicial.list',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/legal/cases/[id]/extrajudicial - Actualizar notificación extrajudicial
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    // Validar datos de entrada
    const validatedData = updateExtrajudicialNoticeSchema.parse(body);

    // Verificar que el caso legal existe
    const legalCase = await db.legalCase.findUnique({
      where: { id: params.id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            broker: true
          }
        }
      }
    });

    if (!legalCase) {
      return NextResponse.json(
        { error: 'Caso legal no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo propietario, corredor o admin pueden actualizar notificaciones
    const canUpdateNotice = 
      user.role === 'ADMIN' ||
      user.id === legalCase.ownerId ||
      (legalCase.brokerId && user.id === legalCase.brokerId);

    if (!canUpdateNotice) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar notificaciones extrajudiciales de este caso' },
        { status: 403 }
      );
    }

    // Obtener la notificación más reciente
    const latestNotice = await db.extrajudicialNotice.findFirst({
      where: { legalCaseId: params.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestNotice) {
      return NextResponse.json(
        { error: 'No se encontró notificación extrajudicial para actualizar' },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    
    if (validatedData.deliveryStatus) {
      updateData.deliveryStatus = validatedData.deliveryStatus;
    }
    if (validatedData.sentDate) {
      updateData.sentDate = new Date(validatedData.sentDate);
    }
    if (validatedData.deliveredDate) {
      updateData.deliveredDate = new Date(validatedData.deliveredDate);
    }
    if (validatedData.receivedBy) {
      updateData.receivedBy = validatedData.receivedBy;
    }
    if (validatedData.responseReceived !== undefined) {
      updateData.responseReceived = validatedData.responseReceived;
    }
    if (validatedData.responseDate) {
      updateData.responseDate = new Date(validatedData.responseDate);
    }
    if (validatedData.responseContent) {
      updateData.responseContent = validatedData.responseContent;
    }
    if (validatedData.responseAmount !== undefined) {
      updateData.responseAmount = validatedData.responseAmount;
    }
    if (validatedData.followUpSent !== undefined) {
      updateData.followUpSent = validatedData.followUpSent;
    }
    if (validatedData.escalationSent !== undefined) {
      updateData.escalationSent = validatedData.escalationSent;
    }

    // Actualizar la notificación
    const updatedNotice = await db.extrajudicialNotice.update({
      where: { id: latestNotice.id },
      data: updateData
    });

    // Si se recibió respuesta, actualizar el estado del caso
    if (validatedData.responseReceived && !latestNotice.responseReceived) {
      await db.legalCase.update({
        where: { id: params.id },
        data: {
          status: 'WAITING_RESPONSE',
          currentPhase: 'EXTRAJUDICIAL',
          nextDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 días para evaluar respuesta
        }
      });
    }

    // Crear log de auditoría
    await db.legalAuditLog.create({
      data: {
        legalCaseId: params.id,
        userId: user.id,
        action: 'EXTRAJUDICIAL_NOTICE_UPDATED',
        details: `Notificación extrajudicial actualizada`,
        previousValue: JSON.stringify(latestNotice),
        newValue: JSON.stringify(updatedNotice)
      }
    });

    // Enviar notificaciones si es necesario
    if (validatedData.responseReceived && !latestNotice.responseReceived) {
      await db.legalNotification.create({
        data: {
          legalCaseId: params.id,
          userId: legalCase.ownerId,
          notificationType: 'STATUS_UPDATE',
          title: 'Respuesta Recibida',
          message: `El inquilino ha respondido a la notificación extrajudicial. Por favor revise la respuesta.`,
          priority: 'medium',
          status: 'pending'
        }
      });
    }

    logger.info('Notificación extrajudicial actualizada exitosamente', {
      context: 'legal.extrajudicial.update',
      userId: user.id,
      caseId: params.id,
      noticeId: updatedNotice.id
    });

    return NextResponse.json({
      success: true,
      data: updatedNotice,
      message: 'Notificación extrajudicial actualizada exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos de entrada inválidos', details: error.issues },
        { status: 400 }
      );
    }

    logger.error('Error al actualizar notificación extrajudicial', {
      context: 'legal.extrajudicial.update',
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
