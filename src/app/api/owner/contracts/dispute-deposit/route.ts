import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';
import { NotificationService } from '@/lib/notification-service';
import { z } from 'zod';

const disputeDepositSchema = z.object({
  contractId: z.string(),
  reason: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
  disputedAmount: z.number().positive('El monto debe ser positivo'),
  evidenceFiles: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    let validatedData;
    try {
      validatedData = disputeDepositSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que el contrato existe y pertenece al propietario
    const contract = await db.contract.findFirst({
      where: {
        id: validatedData.contractId,
        ownerId: user.id,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o no tienes permisos sobre él.' },
        { status: 404 }
      );
    }

    // Verificar que el contrato esté en un estado que permita disputas
    if (contract.status !== 'TERMINATED' && contract.status !== 'COMPLETED') {
      // Verificar si está próximo a terminar (30 días o menos)
      const daysUntilExpiry = Math.ceil(
        (new Date(contract.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry > 30) {
        return NextResponse.json(
          {
            error:
              'Solo se pueden disputar depósitos de contratos terminados o próximos a terminar (menos de 30 días).',
          },
          { status: 400 }
        );
      }
    }

    // Verificar si existe un registro de devolución de depósito para este contrato
    let depositRefund = await db.depositRefund.findFirst({
      where: {
        contractId: contract.id,
      },
    });

    // Si no existe, crear uno
    if (!depositRefund) {
      depositRefund = await db.depositRefund.create({
        data: {
          contractId: contract.id,
          tenantId: contract.tenantId || '',
          ownerId: contract.ownerId || '',
          refundNumber: `REFUND-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          originalDeposit: contract.depositAmount || 0,
          requestedAmount: contract.depositAmount || 0,
          tenantClaimed: 0,
          ownerClaimed: 0,
          status: 'PENDING',
          tenantApproved: false,
          ownerApproved: false,
          reason: 'Devolución de depósito de garantía',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // Verificar que no exista ya una disputa activa para este reembolso
    const existingDispute = await db.refundDispute.findFirst({
      where: {
        refundId: depositRefund.id,
        status: { in: ['OPEN', 'PENDING', 'IN_PROGRESS'] },
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'Ya existe una disputa activa para el depósito de este contrato.' },
        { status: 400 }
      );
    }

    // Verificar que el monto en disputa no exceda el depósito
    if (validatedData.disputedAmount > (contract.depositAmount || 0)) {
      return NextResponse.json(
        {
          error: `El monto en disputa no puede exceder el depósito de garantía ($${contract.depositAmount?.toLocaleString() || 0}).`,
        },
        { status: 400 }
      );
    }

    // Crear la disputa
    const dispute = await db.refundDispute.create({
      data: {
        refundId: depositRefund.id,
        initiatedBy: user.id,
        disputeType: 'OWNER_CLAIM',
        description: validatedData.reason,
        amount: validatedData.disputedAmount,
        status: 'OPEN',
      },
    });

    // Crear entrada en el audit log
    await db.refundAuditLog.create({
      data: {
        refundId: depositRefund.id,
        userId: user.id,
        action: 'DISPUTE_INITIATED',
        details: `Disputa de depósito iniciada por propietario: ${validatedData.reason}`,
      },
    });

    // TODO: Implementar sistema de notificaciones por email para disputas de depósito
    // Por ahora, las disputas se manejan internamente en el sistema

    logger.info('Disputa de depósito iniciada exitosamente', {
      disputeId: dispute.id,
      contractId: validatedData.contractId,
      disputedAmount: validatedData.disputedAmount,
    });

    return NextResponse.json({
      success: true,
      message: 'Disputa de depósito iniciada exitosamente',
      dispute: {
        id: dispute.id,
        disputeNumber: `DISPUTE-${new Date().getFullYear()}-${String(dispute.id.slice(-6)).toUpperCase()}`,
        status: dispute.status,
        disputedAmount: dispute.amount,
        initiatedAt: dispute.createdAt,
      },
    });
  } catch (error) {
    logger.error('Error iniciando disputa de depósito:', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
