import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { z } from 'zod';

// Esquemas de validación
const refundRequestSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato requerido'),
  amount: z.number().positive('Monto debe ser positivo'),
  reason: z.string().min(1, 'Motivo requerido'),
  description: z.string().optional(),
  bankAccount: z.object({
    accountNumber: z.string().min(1, 'Número de cuenta requerido'),
    accountType: z.enum(['checking', 'savings']),
    bankName: z.string().min(1, 'Nombre del banco requerido'),
    rut: z.string().min(1, 'RUT requerido')
  }).optional()
});

const refundUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled']),
  adminNotes: z.string().optional(),
  rejectionReason: z.string().optional()
});

// GET /api/refunds - Obtener reembolsos según rol del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Construir where clause según rol
    let where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (contractId) {
      where.contractId = contractId;
    }
    
    // Filtrar por rol del usuario
    if (user.role === 'TENANT') {
      // Inquilinos solo ven sus propios reembolsos
      where.tenantId = user.id;
    } else if (user.role === 'OWNER' || user.role === 'BROKER') {
      // Propietarios y corredores ven reembolsos de sus propiedades/contratos
      let propertyIds: string[] = [];

      if (user.role === 'OWNER') {
        // Para propietarios: buscar propiedades directamente
        const userProperties = await db.property.findMany({
          where: { ownerId: user.id },
          select: { id: true }
        });
        propertyIds = userProperties.map(p => p.id);
      } else if (user.role === 'BROKER') {
        // Para corredores: buscar contratos donde son brokers, luego obtener propertyIds
        const brokerContracts = await db.contract.findMany({
          where: { brokerId: user.id },
          select: { propertyId: true }
        });
        propertyIds = brokerContracts.map(c => c.propertyId);
      }

      where.contract = {
        propertyId: {
          in: propertyIds
        }
      };
    }
    // Los ADMIN pueden ver todos los reembolsos
    
    // Obtener reembolsos con información relacionada
    const refunds = await db.depositRefund.findMany({
      where,
      include: {
        contract: {
          include: {
            property: {
              select: {
                id: true,
                address: true,
                city: true,
                commune: true
              }
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                rut: true
              }
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            rut: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    // Obtener total de reembolsos para paginación
    const total = await db.depositRefund.count({ where });
    
    logger.info('Reembolsos obtenidos', { 
      userId: user.id, 
      role: user.role,
      count: refunds.length,
      total,
      filters: { status, contractId }
    });
    
    return NextResponse.json({
      success: true,
      data: refunds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo reembolsos:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// POST /api/refunds - Crear solicitud de reembolso
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo inquilinos pueden crear solicitudes de reembolso
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo los inquilinos pueden solicitar reembolsos' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const validatedData = refundRequestSchema.parse(body);
    
    // Verificar que el contrato existe y pertenece al inquilino
    const contract = await db.contract.findUnique({
      where: { id: validatedData.contractId },
      include: {
        property: true,
        payments: {
          where: { method: 'DEPOSIT' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!contract) {
      throw new ValidationError('Contrato no encontrado');
    }
    
    if (contract.tenantId !== user.id) {
      throw new ValidationError('No tienes permisos para este contrato');
    }
    
    // Verificar que el contrato esté finalizado
    if (contract.status !== 'COMPLETED' && contract.status !== 'TERMINATED') {
      throw new ValidationError('Solo se pueden solicitar reembolsos de contratos finalizados');
    }
    
    // Verificar que no haya una solicitud pendiente
    const existingRefund = await db.depositRefund.findFirst({
      where: {
        contractId: validatedData.contractId,
        status: { in: ['pending', 'approved', 'processing'] }
      }
    });
    
    if (existingRefund) {
      throw new ValidationError('Ya existe una solicitud de reembolso pendiente para este contrato');
    }
    
    // Verificar que el monto no exceda el depósito
    const depositAmount = contract.payments[0]?.amount || 0;
    if (validatedData.amount > depositAmount) {
      throw new ValidationError(`El monto no puede exceder el depósito de $${depositAmount.toLocaleString()}`);
    }
    
    // Crear solicitud de reembolso
    const refund = await db.depositRefund.create({
      data: {
        contractId: validatedData.contractId,
        tenantId: user.id,
        requestedAmount: validatedData.amount,
        reason: validatedData.reason,
        description: validatedData.description ?? null,
        bankAccount: validatedData.bankAccount ? JSON.stringify(validatedData.bankAccount) : undefined,
        status: 'pending'
      },
      include: {
        contract: {
          include: {
            property: {
              select: {
                address: true,
                city: true,
                commune: true
              }
            }
          }
        }
      }
    });
    
    // Crear notificación para propietario y administradores
    await db.notification.createMany({
      data: [
        {
          userId: contract.ownerId,
          type: 'REFUND_REQUEST',
          title: 'Nueva solicitud de reembolso',
          message: `El inquilino ${user.name} ha solicitado un reembolso de $${validatedData.amount.toLocaleString()} por el contrato de ${contract.property.address}`,
          data: { refundId: refund.id, contractId: contract.id },
          createdAt: new Date()
        },
        {
          userId: contract.brokerId || contract.ownerId,
          type: 'REFUND_REQUEST',
          title: 'Nueva solicitud de reembolso',
          message: `El inquilino ${user.name} ha solicitado un reembolso de $${validatedData.amount.toLocaleString()} por el contrato de ${contract.property.address}`,
          data: { refundId: refund.id, contractId: contract.id },
          createdAt: new Date()
        }
      ]
    });
    
    logger.info('Solicitud de reembolso creada', { 
      userId: user.id, 
      refundId: refund.id,
      contractId: contract.id,
      amount: validatedData.amount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud de reembolso creada exitosamente',
      data: refund
    }, { status: 201 });

  } catch (error) {
    logger.error('Error creando solicitud de reembolso:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// PUT /api/refunds - Actualizar estado de reembolso (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await requireRole(request, 'ADMIN');
    
    const body = await request.json();
    const { refundId, ...updateData } = body;
    
    if (!refundId) {
      throw new ValidationError('ID de reembolso requerido');
    }
    
    // Verificar que el reembolso existe
    const existingRefund = await db.depositRefund.findUnique({
      where: { id: refundId },
      include: {
        contract: {
          include: {
            tenant: true,
            property: true
          }
        }
      }
    });
    
    if (!existingRefund) {
      throw new ValidationError('Reembolso no encontrado');
    }
    
    // Validar datos de actualización
    const validatedData = refundUpdateSchema.parse(updateData);
    
    // Actualizar reembolso
    const updatedRefund = await db.depositRefund.update({
      where: { id: refundId },
      data: {
        ...validatedData,
        adminId: user.id,
        updatedAt: new Date()
      },
      include: {
        contract: {
          include: {
            tenant: true,
            property: true
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    // Crear notificación para el inquilino
    await db.notification.create({
      data: {
        userId: existingRefund.tenantId,
        type: 'REFUND_STATUS_UPDATE',
        title: `Estado de reembolso actualizado`,
        message: `Tu solicitud de reembolso por $${existingRefund.requestedAmount.toLocaleString()} ha sido ${validatedData.status === 'approved' ? 'aprobada' : validatedData.status === 'rejected' ? 'rechazada' : 'actualizada'}`,
        data: { refundId: refundId, status: validatedData.status },
        createdAt: new Date()
      }
    });
    
    logger.info('Estado de reembolso actualizado', { 
      adminId: user.id, 
      refundId: refundId,
      newStatus: validatedData.status
    });
    
    return NextResponse.json({
      success: true,
      message: 'Estado de reembolso actualizado exitosamente',
      data: updatedRefund
    });

  } catch (error) {
    logger.error('Error actualizando estado de reembolso:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}

// PATCH /api/refunds - Actualización parcial (para inquilinos)
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    if (user.role !== 'TENANT') {
      return NextResponse.json(
        { error: 'Solo los inquilinos pueden actualizar sus solicitudes' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { refundId, ...updateData } = body;
    
    if (!refundId) {
      throw new ValidationError('ID de reembolso requerido');
    }
    
    // Verificar que el reembolso existe y pertenece al usuario
    const existingRefund = await db.depositRefund.findUnique({
      where: { id: refundId }
    });
    
    if (!existingRefund) {
      throw new ValidationError('Reembolso no encontrado');
    }
    
    if (existingRefund.tenantId !== user.id) {
      throw new ValidationError('No tienes permisos para actualizar este reembolso');
    }
    
    // Solo permitir actualizaciones si está pendiente
    if (existingRefund.status !== 'pending') {
      throw new ValidationError('No se puede modificar una solicitud que ya no está pendiente');
    }
    
    // Solo permitir actualizar ciertos campos
    const allowedUpdates = ['description', 'bankAccount'];
    const filteredUpdates: any = {};
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = value;
      }
    }
    
    if (Object.keys(filteredUpdates).length === 0) {
      throw new ValidationError('No hay campos válidos para actualizar');
    }
    
    // Actualizar reembolso
    const updatedRefund = await db.depositRefund.update({
      where: { id: refundId },
      data: {
        ...filteredUpdates,
        updatedAt: new Date()
      }
    });
    
    logger.info('Reembolso actualizado por inquilino', { 
      userId: user.id, 
      refundId: refundId,
      updates: Object.keys(filteredUpdates)
    });
    
    return NextResponse.json({
      success: true,
      message: 'Reembolso actualizado exitosamente',
      data: updatedRefund
    });

  } catch (error) {
    logger.error('Error actualizando reembolso:', { error: error instanceof Error ? error.message : String(error) });
    const errorResponse = handleApiError(error);
    return errorResponse;
  }
}
