import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';
type DisputeType = 'DAMAGE' | 'CLEANING' | 'UNPAID_RENT' | 'OTHER';
type DisputeStatus = 'OPEN' | 'UNDER_MEDIATION' | 'RESOLVED' | 'REJECTED';

// Esquemas de validación
const createDisputeSchema = z.object({
  disputeType: z.enum(['DAMAGE', 'CLEANING', 'UNPAID_RENT', 'OTHER']),
  description: z.string().min(10, 'Descripción debe tener al menos 10 caracteres'),
  amount: z.number().min(0, 'Monto debe ser mayor o igual a 0'),
});

const resolveDisputeSchema = z.object({
  resolution: z.string().min(10, 'Resolución debe tener al menos 10 caracteres'),
  resolvedAmount: z.number().min(0, 'Monto resuelto debe ser mayor o igual a 0').optional(),
});

// POST - Crear disputa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const body = await request.json();

    const validatedData = createDisputeSchema.parse(body);

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
          }
        },
        tenant: true,
        owner: true,
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo inquilino, propietario o admin pueden crear disputas
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear disputas en esta solicitud' },
        { status: 403 }
      );
    }

    // Verificar que la solicitud no esté procesada
    if (refund.status === 'PROCESSED') {
      return NextResponse.json(
        { error: 'No se pueden crear disputas en una solicitud ya procesada' },
        { status: 400 }
      );
    }

    // Verificar que no existe una disputa activa del mismo tipo
    const existingDispute = await db.refundDispute.findFirst({
      where: {
        refundId: id,
        disputeType: validatedData.disputeType,
        status: {
          in: ['OPEN', 'UNDER_MEDIATION']
        }
      }
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'Ya existe una disputa activa de este tipo' },
        { status: 409 }
      );
    }

    // Crear la disputa
    const dispute = await db.refundDispute.create({
      data: {
        refundId: id,
        initiatedBy: user.id,
        disputeType: validatedData.disputeType,
        description: validatedData.description,
        amount: validatedData.amount,
        status: 'OPEN',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    // Actualizar estado de la solicitud a DISPUTED
    await db.depositRefund.update({
      where: { id },
      data: { status: 'DISPUTED' }
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'DISPUTE_CREATED',
        details: `Disputa creada: ${validatedData.disputeType} - $${validatedData.amount}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones
    const otherPartyId = user.id === refund.tenantId ? refund.ownerId : refund.tenantId;
    
    await Promise.all([
      // Notificar al otro usuario
      db.notification.create({
        data: {
          userId: otherPartyId,
          title: 'Nueva Disputa Creada',
          message: `${user.name} ha creado una disputa por $${validatedData.amount}: ${validatedData.description}`,
          type: 'WARNING',
          data: JSON.stringify({
            refundId: id,
            disputeId: dispute.id,
            disputeType: validatedData.disputeType,
            amount: validatedData.amount,
            initiatedBy: user.name,
          }),
        }
      }),
      // Notificar a administradores si no es admin quien creó la disputa
      ...(user.role !== 'ADMIN' ? [
        db.notification.create({
          data: {
            userId: 'admin', // Esto debería ser el ID de un admin específico o usar un sistema de notificaciones para admins
            title: 'Nueva Disputa Requiere Mediación',
            message: `Disputa creada en solicitud ${refund.refundNumber} por ${user.name}`,
            type: 'WARNING',
            data: JSON.stringify({
              refundId: id,
              disputeId: dispute.id,
              disputeType: validatedData.disputeType,
              amount: validatedData.amount,
            }),
          }
        })
      ] : [])
    ]);

    logger.info('Disputa creada:', {
      refundId: id,
      disputeId: dispute.id,
      userId: user.id,
      disputeType: validatedData.disputeType,
      amount: validatedData.amount,
    });

    return NextResponse.json({
      success: true,
      data: dispute,
      message: 'Disputa creada exitosamente'
    });

  } catch (error) {
    logger.error('Error creando disputa:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Listar disputas
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') as DisputeStatus | null;

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        tenant: true,
        owner: true,
      }
    });

    if (!refund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver disputas de esta solicitud' },
        { status: 403 }
      );
    }

    // Construir filtros
    const where: any = { refundId: id };
    if (status) {
      where.status = status;
    }

    // Obtener disputas
    const disputes = await db.refundDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        resolver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    });

    logger.info('Disputas listadas:', {
      refundId: id,
      userId: user.id,
      count: disputes.length,
      status,
    });

    return NextResponse.json({
      success: true,
      data: disputes
    });

  } catch (error) {
    logger.error('Error listando disputas:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      userId: request.headers.get('user-id'),
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
