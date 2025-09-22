import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { PaymentStatus, PaymentMethod, UserRole } from '@/types';
import { ValidationError, handleApiError } from '@/lib/api-error-handler';
import { getPaymentsOptimized, dbOptimizer } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Schema para crear pago
const createPaymentSchema = z.object({
  contractId: z.string().min(1, 'ID de contrato requerido'),
  amount: z.number().positive('El monto debe ser positivo'),
  dueDate: z.string().datetime('Fecha de vencimiento inválida'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER', 'KHIPU']).optional(),
  description: z.string().min(1, 'Descripción requerida').max(500, 'Descripción muy larga'),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL', 'OVERDUE']).default('PENDING'),
});

// Schema para actualizar pago
const updatePaymentSchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DEBIT_CARD', 'CHECK', 'OTHER', 'KHIPU']).optional(),
  description: z.string().min(1).max(500).optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIAL', 'OVERDUE']).optional(),
  paidDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const startTime = Date.now();
    
    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const contractId = searchParams.get('contractId');
    const method = searchParams.get('method');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const overdue = searchParams.get('overdue');
    const upcoming = searchParams.get('upcoming');
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    
    const skip = (page - 1) * limit;
    
    // Construir where clause optimizado
    const where: any = {};
    
    if (status) {
      where.status = status as PaymentStatus;
    }
    
    if (contractId) {
      where.contractId = contractId;
    }
    
    if (method) {
      where.method = method as PaymentMethod;
    }
    
    if (startDate) {
      where.dueDate = { gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.dueDate = { ...where.dueDate, lte: new Date(endDate) };
    }
    
    if (minAmount) {
      where.amount = { gte: parseFloat(minAmount) };
    }
    
    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount) };
    }
    
    if (overdue === 'true') {
      where.dueDate = { lt: new Date() };
      where.status = 'PENDING';
    }

    if (upcoming === 'true') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      where.dueDate = { lte: nextWeek, gte: new Date() };
      where.status = 'PENDING';
    }
    
    // Aplicar filtros según el rol del usuario
    if (user.role !== UserRole.ADMIN) {
      switch (user.role) {
        case UserRole.OWNER:
          // Propietarios ven pagos de sus contratos
          const ownerContracts = await db.contract.findMany({
            where: { ownerId: user.id },
            select: { id: true },
          });
          where.contractId = { in: ownerContracts.map(c => c.id) };
          break;
        case UserRole.TENANT:
          // Inquilinos ven sus propios pagos
          const tenantContracts = await db.contract.findMany({
            where: { tenantId: user.id },
            select: { id: true },
          });
          where.contractId = { in: tenantContracts.map(c => c.id) };
          break;
        case UserRole.MAINTENANCE_PROVIDER:
        case UserRole.SERVICE_PROVIDER:
          // Proveedores de mantenimiento/servicio ven pagos relacionados con sus trabajos
          // - MAINTENANCE_PROVIDER: pagos por trabajos de mantenimiento (paga corredor/propietario)
          // - SERVICE_PROVIDER: pagos por servicios contratados por inquilino (paga inquilino)
          // Rent360 cobra comisión en ambos casos, payout redistribuye fondos
          // Nota: providerId no existe en el modelo actual, se puede implementar más adelante
          where.id = 'none'; // No mostrar pagos por ahora
          break;
      }
    }
    
    // Construir orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Usar consulta optimizada con caché
    const result = await getPaymentsOptimized({
      where,
      skip,
      take: limit,
      orderBy,
      // cache: true, // Removido por incompatibilidad con Prisma
              // cacheTTL: 300, // 5 minutos - Removido por incompatibilidad
        // cacheKey: `payments:${JSON.stringify({ where, skip, take: limit, sortBy, sortOrder, userId: user.id, role: user.role })}`, // Removido por incompatibilidad
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Consulta de pagos optimizada', {
      userId: user.id,
      role: user.role,
      duration,
      filters: { status, contractId, method, overdue },
      resultCount: Array.isArray(result) ? result.length : 0,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error en consulta optimizada de pagos', { error: error instanceof Error ? error.message : String(error) });
    return handleApiError(error, 'GET /api/payments');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins, propietarios y inquilinos pueden crear pagos
    if (!['ADMIN', 'OWNER', 'TENANT'].includes(user.role)) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear pagos' },
        { status: 403 },
      );
    }
    
    const body = await request.json();
    
    // Validar datos del pago
    const validatedData = createPaymentSchema.parse(body);
    
    // Verificar que el contrato existe
    const contract = await db.contract.findUnique({
      where: { id: validatedData.contractId },
      include: {
        property: { select: { ownerId: true } },
        tenant: { select: { id: true } },
        owner: { select: { id: true } },
      },
    });
    
    if (!contract) {
      throw new ValidationError('Contrato no encontrado');
    }
    
    // Verificar permisos según el rol
    if (user.role === UserRole.OWNER && contract.property.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes crear pagos para tus propios contratos' },
        { status: 403 },
      );
    }
    
    if (user.role === UserRole.TENANT && contract.tenantId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes crear pagos para tus propios contratos' },
        { status: 403 },
      );
    }
    
    // Verificar que la fecha de vencimiento es válida
    const dueDate = new Date(validatedData.dueDate);
    if (dueDate < new Date()) {
      throw new ValidationError('La fecha de vencimiento no puede ser en el pasado');
    }
    
    // Crear pago
    const payment = await db.payment.create({
      data: {
        ...validatedData,
        dueDate,
        paymentNumber: `PAY-${Date.now()}`,
      },
      include: {
        contract: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    
    // Invalidar caché de pagos
    // Cache invalidation disabled;
    
    logger.info('Pago creado exitosamente', {
      userId: user.id,
      paymentId: payment.id,
      contractId: payment.contractId,
      amount: payment.amount,
    });
    
    return NextResponse.json({
      message: 'Pago creado exitosamente',
      payment,
    }, { status: 201 });
  } catch (error) {
    logger.error('Error creando pago', { error: error instanceof Error ? error.message : String(error) });
    return handleApiError(error, 'POST /api/payments');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      throw new ValidationError('ID de pago requerido');
    }
    
    // Validar datos de actualización
    const validatedData = updatePaymentSchema.parse(updateData);
    
    // Verificar que el pago existe
    const existingPayment = await db.payment.findUnique({
      where: { id },
      include: {
        contract: {
          select: {
            property: { select: { ownerId: true } },
            tenant: { select: { id: true } },
            owner: { select: { id: true } },
          },
        },
      },
    });
    
    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 },
      );
    }
    
    // Verificar permisos
    const canEdit = 
      user.role === UserRole.ADMIN ||
      existingPayment.contract.property.ownerId === user.id ||
      existingPayment.contract.tenant.id === user.id;
    
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este pago' },
        { status: 403 },
      );
    }
    
    // Validar fecha de vencimiento si se está actualizando
    if (validatedData.dueDate) {
      const dueDate = new Date(validatedData.dueDate);
      if (dueDate < new Date()) {
        throw new ValidationError('La fecha de vencimiento no puede ser en el pasado');
      }
    }
    
    // Si se está marcando como pagado, establecer fecha de pago
    if (validatedData.status === 'COMPLETED' && !validatedData.paidDate) {
      validatedData.paidDate = new Date().toISOString();
    }

    // Construir objeto de actualización compatible con Prisma
    const prismaUpdateData: any = {};
    if (validatedData.amount !== undefined) prismaUpdateData.amount = validatedData.amount;
    if (validatedData.dueDate !== undefined) prismaUpdateData.dueDate = new Date(validatedData.dueDate);
    if (validatedData.method !== undefined) prismaUpdateData.method = validatedData.method;
    if (validatedData.description !== undefined) prismaUpdateData.description = validatedData.description;
    if (validatedData.status !== undefined) prismaUpdateData.status = validatedData.status;
    if (validatedData.paidDate !== undefined) prismaUpdateData.paidDate = new Date(validatedData.paidDate);

    // Actualizar pago
    const updatedPayment = await db.payment.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        contract: {
          select: {
            id: true,
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                commune: true,
              },
            },
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
    
    // Invalidar caché de pagos
    // Cache invalidation disabled;
    
    logger.info('Pago actualizado exitosamente', {
      userId: user.id,
      paymentId: id,
      updatedFields: Object.keys(validatedData),
      newStatus: validatedData.status,
    });
    
    return NextResponse.json({
      message: 'Pago actualizado exitosamente',
      payment: updatedPayment,
    });
  } catch (error) {
    logger.error('Error actualizando pago', { error: error instanceof Error ? error.message : String(error) });
    return handleApiError(error, 'PUT /api/payments');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    // Solo admins pueden eliminar pagos
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar pagos' },
        { status: 403 },
      );
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new ValidationError('ID de pago requerido');
    }
    
    // Verificar que el pago existe
    const existingPayment = await db.payment.findUnique({
      where: { id },
    });
    
    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Pago no encontrado' },
        { status: 404 },
      );
    }
    
    // Verificar que el pago no esté pagado
    if (existingPayment.status === 'COMPLETED') {
      throw new ValidationError('No se puede eliminar un pago que ya fue realizado');
    }
    
    // Eliminar pago
    await db.payment.delete({
      where: { id },
    });
    
    // Invalidar caché de pagos
    // Cache invalidation disabled;
    
    logger.info('Pago eliminado exitosamente', {
      adminId: user.id,
      paymentId: id,
    });
    
    return NextResponse.json({
      message: 'Pago eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando pago', { error: error instanceof Error ? error.message : String(error) });
    return handleApiError(error, 'DELETE /api/payments');
  }
}
