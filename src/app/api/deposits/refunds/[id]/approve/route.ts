import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { requireAuth } from '@/lib/auth';
type ApprovalType = 'ADMIN_APPROVAL' | 'TENANT_APPROVAL' | 'OWNER_APPROVAL';

// Esquemas de validación
const approveRefundSchema = z.object({
  approved: z.boolean(),
  comments: z.string().optional(),
});

// POST - Aprobar devolución
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const { id } = params;
    const body = await request.json();

    const validatedData = approveRefundSchema.parse(body);

    // Verificar que la solicitud de devolución existe
    const refund = await db.depositRefund.findUnique({
      where: { id },
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          },
        },
        tenant: true,
        owner: true,
      },
    });

    if (!refund) {
      return NextResponse.json({ error: 'Solicitud de devolución no encontrada' }, { status: 404 });
    }

    // Verificar permisos según el rol
    let canApprove = false;
    let approvalType: ApprovalType = 'ADMIN_APPROVAL';
    let approvalReason = '';

    if (user.role === 'ADMIN') {
      canApprove = true;
      approvalType = 'ADMIN_APPROVAL';
      approvalReason = 'Aprobación por administrador';
    } else if (user.id === refund.tenantId) {
      canApprove = true;
      approvalType = 'TENANT_APPROVAL';
      approvalReason = 'Aprobación por inquilino';
    } else if (user.id === refund.ownerId) {
      canApprove = true;
      approvalType = 'OWNER_APPROVAL';
      approvalReason = 'Aprobación por propietario';
    }

    if (!canApprove) {
      return NextResponse.json(
        { error: 'No tienes permisos para aprobar esta devolución' },
        { status: 403 }
      );
    }

    // Verificar que la solicitud no esté procesada
    if (refund.status === 'PROCESSED') {
      return NextResponse.json({ error: 'La devolución ya ha sido procesada' }, { status: 400 });
    }

    // Verificar que no hay disputas activas
    const activeDisputes = await db.refundDispute.count({
      where: {
        refundId: id,
        status: {
          in: ['OPEN', 'UNDER_MEDIATION'],
        },
      },
    });

    if (activeDisputes > 0) {
      return NextResponse.json(
        { error: 'No se puede aprobar una devolución con disputas activas' },
        { status: 400 }
      );
    }

    // Crear la aprobación
    const approval = await db.refundApproval.create({
      data: {
        refundId: id,
        approverId: user.id,
        approvalType,
        approved: validatedData.approved,
        comments: validatedData.comments ?? null,
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Actualizar el estado de aprobación en la solicitud
    let updateData: any = {};

    if (user.id === refund.tenantId) {
      updateData.tenantApproved = validatedData.approved;
    } else if (user.id === refund.ownerId) {
      updateData.ownerApproved = validatedData.approved;
    }

    // Si ambas partes han aprobado, cambiar estado a APPROVED
    if (updateData.tenantApproved !== undefined) {
      const newTenantApproved = updateData.tenantApproved;
      if (newTenantApproved && refund.ownerApproved) {
        updateData.status = 'APPROVED';
      }
    } else if (updateData.ownerApproved !== undefined) {
      const newOwnerApproved = updateData.ownerApproved;
      if (newOwnerApproved && refund.tenantApproved) {
        updateData.status = 'APPROVED';
      }
    }

    // Actualizar la solicitud
    const updatedRefund = await db.depositRefund.update({
      where: { id },
      data: updateData,
      include: {
        contract: {
          include: {
            tenant: true,
            owner: true,
            property: true,
          },
        },
        tenant: true,
        owner: true,
      },
    });

    // Crear log de auditoría
    await db.refundAuditLog.create({
      data: {
        refundId: id,
        userId: user.id,
        action: 'REFUND_APPROVED',
        details: `${approvalReason}: ${validatedData.approved ? 'Aprobado' : 'Rechazado'}${validatedData.comments ? ` - ${validatedData.comments}` : ''}`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      },
    });

    // Enviar notificaciones
    const otherPartyId = user.id === refund.tenantId ? refund.ownerId : refund.tenantId;

    await Promise.all([
      // Notificar al otro usuario
      db.notification.create({
        data: {
          userId: otherPartyId,
          title: validatedData.approved ? 'Devolución Aprobada' : 'Devolución Rechazada',
          message: `${user.name} ha ${validatedData.approved ? 'aprobado' : 'rechazado'} la devolución${validatedData.comments ? `: ${validatedData.comments}` : ''}`,
          type: validatedData.approved ? 'SUCCESS' : 'WARNING',
          metadata: JSON.stringify({
            refundId: id,
            approved: validatedData.approved,
            comments: validatedData.comments,
            approvedBy: user.name,
          }),
        },
      }),
      // Si ambas partes aprobaron, notificar que está lista para procesar
      ...(updatedRefund.status === 'APPROVED'
        ? [
            db.notification.create({
              data: {
                userId: refund.tenantId,
                title: 'Devolución Lista para Procesar',
                message: 'Ambas partes han aprobado la devolución. Está lista para ser procesada.',
                type: 'SUCCESS',
                metadata: JSON.stringify({
                  refundId: id,
                  status: 'APPROVED',
                }),
              },
            }),
            db.notification.create({
              data: {
                userId: refund.ownerId,
                title: 'Devolución Lista para Procesar',
                message: 'Ambas partes han aprobado la devolución. Está lista para ser procesada.',
                type: 'SUCCESS',
                metadata: JSON.stringify({
                  refundId: id,
                  status: 'APPROVED',
                }),
              },
            }),
          ]
        : []),
    ]);

    logger.info('Devolución aprobada:', {
      refundId: id,
      userId: user.id,
      userRole: user.role,
      approved: validatedData.approved,
      newStatus: updatedRefund.status,
    });

    return NextResponse.json({
      success: true,
      data: {
        approval,
        refund: updatedRefund,
      },
      message: `Devolución ${validatedData.approved ? 'aprobada' : 'rechazada'} exitosamente`,
    });
  } catch (error) {
    logger.error('Error aprobando devolución:', {
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

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
