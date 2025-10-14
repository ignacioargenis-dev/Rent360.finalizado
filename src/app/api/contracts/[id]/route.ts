import { logger } from '@/lib/logger-minimal';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { contractSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const contractId = params.id;

    // Obtener contrato
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            price: true,
            images: true,
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
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        payments: {
          orderBy: {
            dueDate: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (
      user.role !== 'ADMIN' &&
      contract.ownerId !== user.id &&
      contract.tenantId !== user.id &&
      contract.brokerId !== user.id
    ) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este contrato' },
        { status: 403 }
      );
    }

    // Parsear campos JSON si existen
    const parsedContract = {
      ...contract,
      property: contract.property
        ? {
            ...contract.property,
            images: contract.property.images ? JSON.parse(contract.property.images) : [],
          }
        : null,
    };

    return NextResponse.json({ contract: parsedContract });
  } catch (error) {
    logger.error('Error al obtener contrato:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = body;

    try {
      const validatedData = contractSchema.parse(data);
      const validatedContract = validatedData;
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: validationError.format() },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // Verificar que el contrato exista
    const existingContract = await db.contract.findUnique({
      where: { id: params.id },
    });

    if (!existingContract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos
    if (
      user.role !== 'ADMIN' &&
      existingContract.ownerId !== user.id &&
      existingContract.brokerId !== user.id
    ) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar este contrato' },
        { status: 403 }
      );
    }

    const { startDate, endDate, monthlyRent, deposit, status, terms } = data;

    // Actualizar contrato
    const updateData: any = {};

    if (startDate) {
      updateData.startDate = new Date(startDate);
    }
    if (endDate) {
      updateData.endDate = new Date(endDate);
    }
    if (monthlyRent) {
      updateData.monthlyRent = parseFloat(monthlyRent);
    }
    if (deposit) {
      updateData.deposit = parseFloat(deposit);
    }
    if (status) {
      updateData.status = status;
    }
    if (terms) {
      updateData.terms = terms;
    }

    const updatedContract = await db.contract.update({
      where: { id: params.id },
      data: updateData,
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
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
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

    return NextResponse.json({
      message: 'Contrato actualizado exitosamente',
      contract: updatedContract,
    });
  } catch (error) {
    logger.error('Error al actualizar contrato:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);
    const contractId = params.id;

    // Verificar que el contrato exista
    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Verificar permisos (solo admin y owner pueden eliminar)
    if (user.role !== 'ADMIN' && contract.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este contrato' },
        { status: 403 }
      );
    }

    // No permitir eliminar contratos activos
    if (contract.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'No se puede eliminar un contrato activo' },
        { status: 400 }
      );
    }

    // Eliminar contrato
    await db.contract.delete({
      where: { id: contractId },
    });

    return NextResponse.json({
      message: 'Contrato eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error al eliminar contrato:', {
      error: error instanceof Error ? error.message : String(error),
    });
    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
