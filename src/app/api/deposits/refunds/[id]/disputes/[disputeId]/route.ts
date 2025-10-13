import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';
type DisputeStatus = 'OPEN' | 'UNDER_MEDIATION' | 'RESOLVED' | 'REJECTED';

// Esquemas de validación
const resolveDisputeSchema = z.object({
  resolution: z.string().min(10, 'Resolución debe tener al menos 10 caracteres'),
  resolvedAmount: z.number().min(0, 'Monto resuelto debe ser mayor o igual a 0').optional(),
});

// PUT - Resolver disputa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; disputeId: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id: refundId, disputeId } = params;
    const body = await request.json();

    const validatedData = resolveDisputeSchema.parse(body);

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id: refundId },
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

    // Obtener la disputa
    const dispute = await db.refundDispute.findUnique({
      where: { id: disputeId },
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

    if (!dispute) {
      return NextResponse.json(
        { error: 'Disputa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la disputa pertenece a la solicitud
    if (dispute.refundId !== refundId) {
      return NextResponse.json(
        { error: 'Disputa no pertenece a esta solicitud' },
        { status: 400 }
      );
    }

    // Verificar que la disputa está activa
    if (!['OPEN', 'UNDER_MEDIATION'].includes(dispute.status)) {
      return NextResponse.json(
        { error: 'La disputa ya ha sido resuelta' },
        { status: 400 }
      );
    }

    // Verificar permisos: solo admin puede resolver disputas
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden resolver disputas' },
        { status: 403 }
      );
    }

    // Resolver la disputa
    const resolvedDispute = await db.refundDispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolvedBy: user.id,
        resolution: validatedData.resolution,
        resolvedAt: new Date(),
      },
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

    // Actualizar la solicitud de devolución si se proporcionó un monto resuelto
    if (validatedData.resolvedAmount !== undefined) {
      // Determinar si el monto resuelto es para el inquilino o propietario
      const isTenantDispute = dispute.initiator.id === refund.tenantId;
      
      if (isTenantDispute) {
        await db.depositRefund.update({
          where: { id: refundId },
          data: { tenantClaimed: validatedData.resolvedAmount }
        });
      } else {
        await db.depositRefund.update({
          where: { id: refundId },
          data: { ownerClaimed: validatedData.resolvedAmount }
        });
      }
    }

    // Verificar si todas las disputas están resueltas para cambiar el estado
    const activeDisputes = await db.refundDispute.count({
      where: {
        refundId,
        status: {
          in: ['OPEN', 'UNDER_MEDIATION']
        }
      }
    });

    if (activeDisputes === 0) {
      // Cambiar estado de la solicitud a UNDER_REVIEW si no hay disputas activas
      await db.depositRefund.update({
        where: { id: refundId },
        data: { status: 'UNDER_REVIEW' }
      });
    }

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId,
        userId: user.id,
        action: 'DISPUTE_RESOLVED',
        details: `Disputa resuelta: ${dispute.disputeType} - ${validatedData.resolution}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones
    await Promise.all([
      // Notificar al iniciador de la disputa
      db.notification.create({
        data: {
          userId: dispute.initiatedBy,
          title: 'Disputa Resuelta',
          message: `Tu disputa ha sido resuelta por ${user.name}: ${validatedData.resolution}`,
          type: 'INFO',
          data: JSON.stringify({
            refundId,
            disputeId,
            resolution: validatedData.resolution,
            resolvedBy: user.name,
            resolvedAmount: validatedData.resolvedAmount,
          }),
        }
      }),
      // Notificar al otro usuario
      db.notification.create({
        data: {
          userId: dispute.initiatedBy === refund.tenantId ? refund.ownerId : refund.tenantId,
          title: 'Disputa Resuelta',
          message: `La disputa ha sido resuelta por ${user.name}: ${validatedData.resolution}`,
          type: 'INFO',
          data: JSON.stringify({
            refundId,
            disputeId,
            resolution: validatedData.resolution,
            resolvedBy: user.name,
            resolvedAmount: validatedData.resolvedAmount,
          }),
        }
      })
    ]);

    logger.info('Disputa resuelta:', {
      refundId,
      disputeId,
      userId: user.id,
      resolution: validatedData.resolution,
      resolvedAmount: validatedData.resolvedAmount,
    });

    return NextResponse.json({
      success: true,
      data: resolvedDispute,
      message: 'Disputa resuelta exitosamente'
    });

  } catch (error) {
    logger.error('Error resolviendo disputa:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      disputeId: params.disputeId,
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

// GET - Obtener disputa específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; disputeId: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id: refundId, disputeId } = params;

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id: refundId },
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

    // Obtener la disputa
    const dispute = await db.refundDispute.findUnique({
      where: { id: disputeId },
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

    if (!dispute) {
      return NextResponse.json(
        { error: 'Disputa no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la disputa pertenece a la solicitud
    if (dispute.refundId !== refundId) {
      return NextResponse.json(
        { error: 'Disputa no pertenece a esta solicitud' },
        { status: 400 }
      );
    }

    logger.info('Disputa obtenida:', {
      refundId,
      disputeId,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: dispute
    });

  } catch (error) {
    logger.error('Error obteniendo disputa:', {
      error: error instanceof Error ? error.message : String(error),
      refundId: params.id,
      disputeId: params.disputeId,
      userId: request.headers.get('user-id'),
    });

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
