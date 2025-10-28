import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger-minimal';

/**
 * API para gestionar una solicitud específica
 */

const updateRequestSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'CLOSED', 'CANCELLED']).optional(),
  assignedBrokerId: z.string().optional(),
});

/**
 * GET - Ver detalles de una solicitud
 */
export async function GET(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const user = await requireAuth(request);

    const { requestId } = params;

    const serviceRequest = await db.brokerServiceRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedBroker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        responses: {
          orderBy: { createdAt: 'desc' },
          include: {
            broker: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: solo el creador puede verla
    if (serviceRequest.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para ver esta solicitud' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serviceRequest,
    });
  } catch (error: any) {
    logger.error('Error fetching service request', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al obtener solicitud' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Actualizar solicitud (cambiar estado, asignar corredor)
 */
export async function PATCH(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const user = await requireAuth(request);

    const { requestId } = params;
    const body = await request.json();
    const data = updateRequestSchema.parse(body);

    // Verificar que la solicitud existe y pertenece al usuario
    const serviceRequest = await db.brokerServiceRequest.findUnique({
      where: { id: requestId },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (serviceRequest.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para modificar esta solicitud' },
        { status: 403 }
      );
    }

    // Actualizar
    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'CLOSED' || data.status === 'CANCELLED') {
        updateData.closedAt = new Date();
      }
    }

    if (data.assignedBrokerId) {
      updateData.assignedBrokerId = data.assignedBrokerId;
      updateData.assignedAt = new Date();
      updateData.status = 'ASSIGNED';
    }

    const updated = await db.brokerServiceRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        assignedBroker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    logger.info('✅ Service request updated', {
      userId: user.id,
      requestId,
      updates: data,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Solicitud actualizada',
    });
  } catch (error: any) {
    logger.error('Error updating service request', {
      error: error.message,
      stack: error.stack,
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Error al actualizar solicitud' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancelar/eliminar solicitud
 */
export async function DELETE(request: NextRequest, { params }: { params: { requestId: string } }) {
  try {
    const user = await requireAuth(request);

    const { requestId } = params;

    // Verificar permisos
    const serviceRequest = await db.brokerServiceRequest.findUnique({
      where: { id: requestId },
    });

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Solicitud no encontrada' },
        { status: 404 }
      );
    }

    if (serviceRequest.userId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta solicitud' },
        { status: 403 }
      );
    }

    // Eliminar
    await db.brokerServiceRequest.delete({
      where: { id: requestId },
    });

    logger.info('🗑️ Service request deleted', {
      userId: user.id,
      requestId,
    });

    return NextResponse.json({
      success: true,
      message: 'Solicitud eliminada',
    });
  } catch (error: any) {
    logger.error('Error deleting service request', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al eliminar solicitud' },
      { status: 500 }
    );
  }
}
