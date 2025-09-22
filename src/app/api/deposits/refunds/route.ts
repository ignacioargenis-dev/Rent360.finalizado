import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { requireAuth } from '@/lib/auth';
type RefundStatus = 'PENDING' | 'UNDER_REVIEW' | 'DISPUTED' | 'APPROVED' | 'PROCESSED' | 'REJECTED';

// Esquemas de validación
const createRefundSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato es requerido'),
  requestedAmount: z.number().min(0, 'Monto solicitado debe ser mayor o igual a 0'),
  tenantClaimed: z.number().min(0, 'Monto reclamado por inquilino debe ser mayor o igual a 0').default(0),
  ownerClaimed: z.number().min(0, 'Monto reclamado por propietario debe ser mayor o igual a 0').default(0),
  reason: z.string().min(1, 'Motivo es requerido'),
  description: z.string().optional(),
  bankAccount: z.object({
    accountNumber: z.string().min(1, 'Número de cuenta requerido'),
    accountType: z.enum(['checking', 'savings']),
    bankName: z.string().min(1, 'Nombre del banco requerido'),
    rut: z.string().min(1, 'RUT requerido')
  }).optional(),
});

const updateRefundSchema = z.object({
  requestedAmount: z.number().min(0).optional(),
  tenantClaimed: z.number().min(0).optional(),
  ownerClaimed: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'DISPUTED', 'APPROVED', 'PROCESSED', 'REJECTED']).optional(),
  tenantApproved: z.boolean().optional(),
  ownerApproved: z.boolean().optional(),
});

const getRefundsSchema = z.object({
  page: z.string().default('1').transform(Number).pipe(z.number().min(1)),
  limit: z.string().default('10').transform(Number).pipe(z.number().min(1).max(100)),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'DISPUTED', 'APPROVED', 'PROCESSED', 'REJECTED']).optional(),
  contractId: z.string().optional(),
  tenantId: z.string().optional(),
  ownerId: z.string().optional(),
});

// POST - Crear nueva solicitud de devolución
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    
    const validatedData = createRefundSchema.parse(body);

    // Verificar que el contrato existe y pertenece al usuario
    const contract = await db.contract.findUnique({
      where: { id: validatedData.contractId },
      include: {
        tenant: true,
        owner: true,
        property: true,
      },
    });

    if (!contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo inquilino o propietario pueden crear solicitudes
    if (user.role !== 'ADMIN' && 
        user.id !== contract.tenantId && 
        user.id !== contract.ownerId) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear solicitudes de devolución para este contrato' },
        { status: 403 }
      );
    }

    // Verificar que no existe una solicitud activa para este contrato
    const existingRefund = await db.depositRefund.findFirst({
      where: {
        contractId: validatedData.contractId,
        status: {
          in: ['PENDING', 'UNDER_REVIEW', 'DISPUTED']
        }
      }
    });

    if (existingRefund) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de devolución activa para este contrato' },
        { status: 409 }
      );
    }

    // Generar número único de devolución
    const refundNumber = `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Crear la solicitud de devolución
    const refund = await db.depositRefund.create({
      data: {
        contractId: validatedData.contractId,
        tenantId: contract.tenantId,
        ownerId: contract.ownerId,
        refundNumber,
        originalDeposit: contract.deposit,
        requestedAmount: validatedData.requestedAmount,
        tenantClaimed: validatedData.tenantClaimed,
        ownerClaimed: validatedData.ownerClaimed,
        status: 'PENDING',
        tenantApproved: false,
        ownerApproved: false,
        reason: validatedData.reason,
        ...(validatedData.description && { description: validatedData.description }),
        ...(validatedData.bankAccount && { bankAccount: JSON.stringify(validatedData.bankAccount) }),
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
        refundId: refund.id,
        userId: user.id,
        action: 'REFUND_CREATED',
        details: `Solicitud de devolución creada por ${user.name} (${user.role})`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent'),
      }
    });

    // Enviar notificaciones
    await Promise.all([
      // Notificar al propietario
      db.notification.create({
        data: {
          userId: contract.ownerId,
          title: 'Nueva Solicitud de Devolución de Depósito',
          message: `El inquilino ${contract.tenant.name} ha solicitado la devolución del depósito de garantía por $${validatedData.requestedAmount.toLocaleString()}`,
          type: 'INFO',
          data: JSON.stringify({
            refundId: refund.id,
            contractId: contract.id,
            amount: validatedData.requestedAmount,
          }),
        }
      }),
      // Notificar al inquilino
      db.notification.create({
        data: {
          userId: contract.tenantId,
          title: 'Solicitud de Devolución Creada',
          message: `Tu solicitud de devolución de depósito ha sido creada exitosamente. Número: ${refundNumber}`,
          type: 'SUCCESS',
          data: JSON.stringify({
            refundId: refund.id,
            contractId: contract.id,
            refundNumber,
          }),
        }
      })
    ]);

    logger.info('Solicitud de devolución creada:', {
      refundId: refund.id,
      contractId: contract.id,
      userId: user.id,
      amount: validatedData.requestedAmount,
    });

    return NextResponse.json({
      success: true,
      data: refund,
      message: 'Solicitud de devolución creada exitosamente'
    });

  } catch (error) {
    logger.error('Error creando solicitud de devolución:', {
      error: error instanceof Error ? error.message : String(error),
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

// GET - Listar solicitudes de devolución
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const validatedParams = getRefundsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      status: searchParams.get('status'),
      contractId: searchParams.get('contractId'),
      tenantId: searchParams.get('tenantId'),
      ownerId: searchParams.get('ownerId'),
    });

    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Construir filtros según el rol del usuario
    let where: any = {};

    if (user.role === 'ADMIN') {
      // Admin puede ver todas las solicitudes
      if (validatedParams.status) where.status = validatedParams.status;
      if (validatedParams.contractId) where.contractId = validatedParams.contractId;
      if (validatedParams.tenantId) where.tenantId = validatedParams.tenantId;
      if (validatedParams.ownerId) where.ownerId = validatedParams.ownerId;
    } else if (user.role === 'TENANT') {
      // Inquilino solo ve sus propias solicitudes
      where.tenantId = user.id;
      if (validatedParams.status) where.status = validatedParams.status;
      if (validatedParams.contractId) where.contractId = validatedParams.contractId;
    } else if (user.role === 'OWNER') {
      // Propietario solo ve solicitudes de sus propiedades
      where.ownerId = user.id;
      if (validatedParams.status) where.status = validatedParams.status;
      if (validatedParams.contractId) where.contractId = validatedParams.contractId;
    } else {
      return NextResponse.json(
        { error: 'No tienes permisos para ver solicitudes de devolución' },
        { status: 403 }
      );
    }

    // Obtener solicitudes con paginación
    const [refunds, total] = await Promise.all([
      db.depositRefund.findMany({
        where,
        skip,
        take: validatedParams.limit,
        orderBy: { createdAt: 'desc' },
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
            take: 5, // Solo los últimos 5 documentos
          },
          disputes: {
            where: { status: { in: ['OPEN', 'UNDER_MEDIATION'] } },
            orderBy: { createdAt: 'desc' },
          },
          approvals: {
            orderBy: { approvedAt: 'desc' },
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
      }),
      db.depositRefund.count({ where })
    ]);

    const totalPages = Math.ceil(total / validatedParams.limit);

    logger.info('Solicitudes de devolución listadas:', {
      userId: user.id,
      userRole: user.role,
      count: refunds.length,
      total,
      page: validatedParams.page,
    });

    return NextResponse.json({
      success: true,
      data: {
        refunds,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          totalPages,
          hasNext: validatedParams.page < totalPages,
          hasPrev: validatedParams.page > 1,
        }
      }
    });

  } catch (error) {
    logger.error('Error listando solicitudes de devolución:', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.headers.get('user-id'),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
