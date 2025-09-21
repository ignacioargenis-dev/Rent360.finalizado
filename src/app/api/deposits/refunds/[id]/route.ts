import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';

// Definir tipos locales para enums de Prisma
type RefundStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'CANCELLED' | 'DISPUTED';

// Esquemas de validación
const updateRefundSchema = z.object({
  requestedAmount: z.number().min(0).optional(),
  tenantClaimed: z.number().min(0).optional(),
  ownerClaimed: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSED', 'CANCELLED', 'DISPUTED']).optional(),
  tenantApproved: z.boolean().optional(),
  ownerApproved: z.boolean().optional(),
});

// GET - Obtener solicitud específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    // Obtener la solicitud con todas las relaciones
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          }
        },
        tenant: true,
        owner: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        disputes: {
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
        },
        approvals: {
          orderBy: { approvedAt: 'desc' },
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            disputes: true,
            approvals: true,
            auditLogs: true,
          }
        }
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
        { error: 'No tienes permisos para ver esta solicitud de devolución' },
        { status: 403 }
      );
    }

    logger.info('Solicitud de devolución obtenida:', {
      refundId: id,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      data: refund
    });

  } catch (error) {
    logger.error('Error obteniendo solicitud de devolución:', {
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

// PUT - Actualizar solicitud
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const body = await request.json();

    const validatedData = updateRefundSchema.parse(body);

    // Obtener la solicitud actual
    const currentRefund = await db.depositRefund.findUnique({
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

    if (!currentRefund) {
      return NextResponse.json(
        { error: 'Solicitud de devolución no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos según el rol
    let canUpdate = false;
    let updateReason = '';

    if (user.role === 'ADMIN') {
      canUpdate = true;
      updateReason = 'Actualización por administrador';
    } else if (user.id === currentRefund.tenantId) {
      // Inquilino puede actualizar ciertos campos
      canUpdate = true;
      updateReason = 'Actualización por inquilino';
      
      // Inquilino no puede cambiar el estado a PROCESSED
      if (validatedData.status === 'PROCESSED') {
        return NextResponse.json(
          { error: 'No puedes procesar la devolución' },
          { status: 403 }
        );
      }
    } else if (user.id === currentRefund.ownerId) {
      // Propietario puede actualizar ciertos campos
      canUpdate = true;
      updateReason = 'Actualización por propietario';
      
      // Propietario no puede cambiar el estado a PROCESSED
      if (validatedData.status === 'PROCESSED') {
        return NextResponse.json(
          { error: 'No puedes procesar la devolución' },
          { status: 403 }
        );
      }
    }

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar esta solicitud' },
        { status: 403 }
      );
    }

    // Validaciones adicionales
    if (validatedData.requestedAmount !== undefined) {
      if (validatedData.requestedAmount > currentRefund.originalDeposit) {
        return NextResponse.json(
          { error: 'El monto solicitado no puede exceder el depósito original' },
          { status: 400 }
        );
      }
    }

    // Actualizar la solicitud
    const updatedRefund = await db.depositRefund.update({
      where: { id },
      data: {
        requestedAmount: validatedData.requestedAmount ?? null,
        tenantClaimed: validatedData.tenantClaimed ?? null,
        ownerClaimed: validatedData.ownerClaimed ?? null,
        status: validatedData.status ?? null,
        tenantApproved: validatedData.tenantApproved ?? null,
        ownerApproved: validatedData.ownerApproved ?? null,
      },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          }
        },
        tenant: true,
        owner: true,
      }
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'REFUND_UPDATED',
        details: `${updateReason}: ${JSON.stringify(validatedData)}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones si hay cambios importantes
    if (validatedData.status && validatedData.status !== currentRefund.status) {
      await Promise.all([
        // Notificar al inquilino
        db.notification.create({
          data: {
            userId: currentRefund.tenantId,
            title: 'Estado de Devolución Actualizado',
            message: `El estado de tu solicitud de devolución ha cambiado a: ${validatedData.status}`,
            type: 'INFO',
            data: JSON.stringify({
              refundId: id,
              oldStatus: currentRefund.status,
              newStatus: validatedData.status,
            }),
          }
        }),
        // Notificar al propietario
        db.notification.create({
          data: {
            userId: currentRefund.ownerId,
            title: 'Estado de Devolución Actualizado',
            message: `El estado de la solicitud de devolución ha cambiado a: ${validatedData.status}`,
            type: 'INFO',
            data: JSON.stringify({
              refundId: id,
              oldStatus: currentRefund.status,
              newStatus: validatedData.status,
            }),
          }
        })
      ]);
    }

    logger.info('Solicitud de devolución actualizada:', {
      refundId: id,
      userId: user.id,
      userRole: user.role,
      changes: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: updatedRefund,
      message: 'Solicitud de devolución actualizada exitosamente'
    });

  } catch (error) {
    logger.error('Error actualizando solicitud de devolución:', {
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

// DELETE - Cancelar solicitud
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const { id } = params;

    // Obtener la solicitud
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

    // Verificar permisos
    if (user.role !== 'ADMIN' && 
        user.id !== refund.tenantId && 
        user.id !== refund.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar esta solicitud' },
        { status: 403 }
      );
    }

    // Solo se puede cancelar si está en estado PENDING o UNDER_REVIEW
    if (!['PENDING', 'UNDER_REVIEW'].includes(refund.status)) {
      return NextResponse.json(
        { error: 'No se puede cancelar una solicitud que ya ha sido procesada o aprobada' },
        { status: 400 }
      );
    }

    // Actualizar estado a CANCELLED
    const cancelledRefund = await db.depositRefund.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          }
        },
        tenant: true,
        owner: true,
      }
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'REFUND_CANCELLED',
        details: `Solicitud cancelada por ${user.name} (${user.role})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones
    await Promise.all([
      // Notificar al inquilino
      db.notification.create({
        data: {
          userId: refund.tenantId,
          title: 'Solicitud de Devolución Cancelada',
          message: `Tu solicitud de devolución de depósito ha sido cancelada`,
          type: 'WARNING',
          data: JSON.stringify({
            refundId: id,
            cancelledBy: user.name,
          }),
        }
      }),
      // Notificar al propietario
      db.notification.create({
        data: {
          userId: refund.ownerId,
          title: 'Solicitud de Devolución Cancelada',
          message: `La solicitud de devolución de depósito ha sido cancelada`,
          type: 'WARNING',
          data: JSON.stringify({
            refundId: id,
            cancelledBy: user.name,
          }),
        }
      })
    ]);

    logger.info('Solicitud de devolución cancelada:', {
      refundId: id,
      userId: user.id,
      userRole: user.role,
    });

    return NextResponse.json({
      success: true,
      data: cancelledRefund,
      message: 'Solicitud de devolución cancelada exitosamente'
    });

  } catch (error) {
    logger.error('Error cancelando solicitud de devolución:', {
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
