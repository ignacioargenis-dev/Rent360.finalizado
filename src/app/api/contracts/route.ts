import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { ContractStatus, UserRole } from '@/types';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  handleApiError,
  createApiResponse,
} from '@/lib/api-error-handler';
import { getContractsOptimized, dbOptimizer } from '@/lib/db-optimizer';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Schema para crear contrato
const createContractSchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad requerido'),
  tenantId: z.string().min(1, 'ID de inquilino requerido'),
  brokerId: z.string().optional(), // ID del corredor (opcional)
  startDate: z.string().min(1, 'Fecha de inicio requerida'),
  endDate: z.string().min(1, 'Fecha de fin requerida'),
  monthlyRent: z.number().positive('El monto de renta debe ser positivo'),
  depositAmount: z.number().min(0, 'El depósito no puede ser negativo'),
  terms: z.string().min(10, 'Los términos deben tener al menos 10 caracteres'),
  tenantRut: z.string().optional(), // RUT del inquilino
  propertyAddress: z.string().optional(), // Dirección completa de la propiedad
  propertyRolNumber: z.string().optional(), // Número de rol de la propiedad
  status: z
    .enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'TERMINATED', 'CANCELLED'])
    .default('DRAFT'),
});

// Schema para actualizar contrato
const updateContractSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  monthlyRent: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),
  terms: z.string().min(10).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'TERMINATED', 'CANCELLED']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Intentar obtener usuario autenticado
    let user = null;
    try {
      user = await requireAuth(request);
    } catch (error) {
      // Usuario no autenticado - devolver respuesta vacía
      return NextResponse.json({
        contracts: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        message: 'Usuario no autenticado',
      });
    }

    const startTime = Date.now();

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const propertyId = searchParams.get('propertyId');
    const tenantId = searchParams.get('tenantId');
    const ownerId = searchParams.get('ownerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minRent = searchParams.get('minRent');
    const maxRent = searchParams.get('maxRent');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Construir where clause optimizado
    const where: any = {};

    if (status) {
      // Soporte para múltiples valores separados por coma
      if (status.includes(',')) {
        const statuses = status.split(',').map(s => s.trim()) as ContractStatus[];
        where.status = { in: statuses };
      } else {
        where.status = status as ContractStatus;
      }
    }

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (minRent) {
      where.monthlyRent = { gte: parseFloat(minRent) };
    }

    if (maxRent) {
      where.monthlyRent = { ...where.monthlyRent, lte: parseFloat(maxRent) };
    }

    // Aplicar filtros según el rol del usuario
    if (user.role !== UserRole.ADMIN) {
      switch (user.role) {
        case UserRole.OWNER:
          where.ownerId = user.id;
          break;
        case UserRole.TENANT:
          where.tenantId = user.id;
          break;
        case 'MAINTENANCE_PROVIDER':
        case 'SERVICE_PROVIDER':
          // Los proveedores pueden ver contratos de propiedades donde trabajan
          // Nota: providerId no existe en el modelo actual, se puede implementar más adelante
          where.id = 'none'; // No mostrar contratos por ahora
          break;
      }
    }

    // Construir orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Usar consulta optimizada con caché
    const result = await getContractsOptimized({
      where,
      skip,
      take: limit,
      orderBy,
      // cache: true, // Removido por incompatibilidad con Prisma
      // cacheTTL: 300, // 5 minutos - Removido por incompatibilidad
      // cacheKey: `contracts:${JSON.stringify({ where, skip, take: limit, sortBy, sortOrder, userId: user.id, role: user.role })}`, // Removido por incompatibilidad
    });

    const duration = Date.now() - startTime;

    logger.info('Consulta de contratos optimizada', {
      userId: user.id,
      role: user.role,
      duration,
      filters: { status, propertyId, tenantId, ownerId },
      resultCount: Array.isArray(result) ? result.length : 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error as Error, 'GET /api/contracts');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo admins y propietarios pueden crear contratos
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.OWNER) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear contratos' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar datos del contrato
    const validatedData = createContractSchema.parse(body);

    // Verificar que la propiedad existe y está disponible
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
      include: { owner: true },
    });

    if (!property) {
      throw new ValidationError('Propiedad no encontrada');
    }

    if (property.status !== 'AVAILABLE') {
      throw new ValidationError('La propiedad no está disponible para arrendar');
    }

    // Si es propietario, verificar que la propiedad le pertenece
    if (user.role === UserRole.OWNER && property.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Solo puedes crear contratos para tus propias propiedades' },
        { status: 403 }
      );
    }

    // Verificar que el inquilino existe y está activo
    const tenant = await db.user.findUnique({
      where: { id: validatedData.tenantId },
    });

    if (!tenant) {
      throw new ValidationError('Inquilino no encontrado');
    }

    if (!tenant.isActive) {
      throw new ValidationError('El inquilino no está activo');
    }

    // Verificar que no hay contratos activos para esta propiedad
    const existingContract = await db.contract.findFirst({
      where: {
        propertyId: validatedData.propertyId,
        status: { in: [ContractStatus.ACTIVE, ContractStatus.DRAFT] },
      },
    });

    if (existingContract) {
      throw new ValidationError('Ya existe un contrato activo para esta propiedad');
    }

    // Verificar que las fechas son válidas
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    if (startDate < new Date()) {
      throw new ValidationError('La fecha de inicio no puede ser en el pasado');
    }

    // Crear contrato
    const contract = await db.contract.create({
      data: {
        propertyId: validatedData.propertyId,
        tenantId: validatedData.tenantId,
        ownerId: user.id, // ✅ Usar el ID del usuario autenticado (propietario)
        brokerId: validatedData.brokerId || null,
        startDate,
        endDate,
        monthlyRent: validatedData.monthlyRent,
        depositAmount: validatedData.depositAmount,
        tenantRut: validatedData.tenantRut || null,
        propertyAddress: validatedData.propertyAddress || null,
        propertyRolNumber: validatedData.propertyRolNumber || null,
        terms: validatedData.terms,
        status: validatedData.status,
        contractNumber: `CON-${Date.now()}`,
      },
      include: {
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
    });

    // Actualizar estado de la propiedad
    await db.property.update({
      where: { id: validatedData.propertyId },
      data: { status: 'RENTED' },
    });

    // Invalidar caché de contratos y propiedades
    await Promise.all([
      dbOptimizer.invalidateCache('contracts'),
      dbOptimizer.invalidateCache('properties'),
    ]);

    logger.info('Contrato creado exitosamente', {
      userId: user.id,
      contractId: contract.id,
      propertyId: contract.propertyId,
      tenantId: contract.tenantId,
    });

    // Nota: La firma electrónica se inicia manualmente por los usuarios usando el componente ElectronicSignature
    // Esto permite mayor control sobre cuándo y cómo se inician las firmas

    return NextResponse.json(
      {
        message: 'Contrato creado exitosamente',
        contract,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creando contrato', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error as Error, 'POST /api/contracts');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      throw new ValidationError('ID de contrato requerido');
    }

    // Validar datos de actualización
    const validatedData = updateContractSchema.parse(updateData);

    // Verificar que el contrato existe
    const existingContract = await db.contract.findUnique({
      where: { id },
      include: {
        property: { select: { ownerId: true } },
        tenant: { select: { id: true } },
        owner: { select: { id: true } },
      },
    });

    if (!existingContract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    const canEdit =
      user.role === UserRole.ADMIN ||
      existingContract.ownerId === user.id ||
      existingContract.tenantId === user.id;

    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este contrato' },
        { status: 403 }
      );
    }

    // Validar fechas si se están actualizando
    if (validatedData.startDate || validatedData.endDate) {
      const existingStartDate = existingContract.startDate;
      const existingEndDate = existingContract.endDate;

      const startDate = validatedData.startDate
        ? new Date(validatedData.startDate)
        : existingStartDate;
      const endDate = validatedData.endDate ? new Date(validatedData.endDate) : existingEndDate;

      if (startDate >= endDate) {
        throw new ValidationError('La fecha de fin debe ser posterior a la fecha de inicio');
      }

      // Validar que la fecha de inicio no sea en el pasado si se está actualizando
      if (validatedData.startDate && startDate < new Date()) {
        throw new ValidationError('La fecha de inicio no puede ser en el pasado');
      }
    }

    // Construir objeto de actualización compatible con Prisma
    const prismaUpdateData: any = {};
    if (validatedData.status !== undefined) {
      prismaUpdateData.status = validatedData.status;
    }
    if (validatedData.startDate !== undefined) {
      prismaUpdateData.startDate = new Date(validatedData.startDate);
    }
    if (validatedData.endDate !== undefined) {
      prismaUpdateData.endDate = new Date(validatedData.endDate);
    }
    if (validatedData.terms !== undefined) {
      prismaUpdateData.terms = validatedData.terms;
    }
    if (validatedData.monthlyRent !== undefined) {
      prismaUpdateData.monthlyRent = validatedData.monthlyRent;
    }
    if (validatedData.depositAmount !== undefined) {
      prismaUpdateData.deposit = validatedData.depositAmount;
    }

    // Actualizar contrato
    const updatedContract = await db.contract.update({
      where: { id },
      data: prismaUpdateData,
      include: {
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
    });

    // Invalidar caché de contratos
    await dbOptimizer.invalidateCache('contracts');

    logger.info('Contrato actualizado exitosamente', {
      userId: user.id,
      contractId: id,
      updatedFields: Object.keys(validatedData),
    });

    return NextResponse.json({
      message: 'Contrato actualizado exitosamente',
      contract: updatedContract,
    });
  } catch (error) {
    logger.error('Error actualizando contrato', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error as Error, 'PUT /api/contracts');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo admins pueden eliminar contratos
    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar contratos' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new ValidationError('ID de contrato requerido');
    }

    // Verificar que el contrato existe
    const existingContract = await db.contract.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, status: true } },
      },
    });

    if (!existingContract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar que el contrato no esté activo
    if (existingContract.status === ContractStatus.ACTIVE) {
      throw new ValidationError('No se puede eliminar un contrato activo');
    }

    // Eliminar contrato
    await db.contract.delete({
      where: { id },
    });

    // Si la propiedad estaba rentada, marcarla como disponible
    if (existingContract.property.status === 'RENTED') {
      await db.property.update({
        where: { id: existingContract.property.id },
        data: { status: 'AVAILABLE' },
      });
    }

    // Invalidar caché
    await Promise.all([
      dbOptimizer.invalidateCache('contracts'),
      dbOptimizer.invalidateCache('properties'),
    ]);

    logger.info('Contrato eliminado exitosamente', {
      adminId: user.id,
      contractId: id,
    });

    return NextResponse.json({
      message: 'Contrato eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando contrato', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error as Error, 'DELETE /api/contracts');
  }
}
