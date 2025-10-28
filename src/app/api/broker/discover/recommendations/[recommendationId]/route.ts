import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * API para acciones sobre recomendaciones individuales
 */

const actionSchema = z.object({
  action: z.enum(['view', 'contact', 'dismiss', 'convert']),
  prospectId: z.string().optional(), // Requerido para 'convert'
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { recommendationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    const { recommendationId } = params;
    const body = await request.json();
    const { action, prospectId } = actionSchema.parse(body);

    const brokerId = session.user.id;

    logger.info('🔄 Updating recommendation', {
      brokerId,
      recommendationId,
      action,
    });

    // Verificar que la recomendación pertenece al corredor
    const recommendation = await db.brokerLeadRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recomendación no encontrada' },
        { status: 404 }
      );
    }

    if (recommendation.brokerId !== brokerId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para modificar esta recomendación' },
        { status: 403 }
      );
    }

    // Aplicar acción
    let updateData: any = {};

    switch (action) {
      case 'view':
        updateData = {
          status: 'VIEWED',
          viewedAt: new Date(),
        };
        break;

      case 'contact':
        updateData = {
          status: 'CONTACTED',
          contactedAt: new Date(),
        };
        break;

      case 'dismiss':
        updateData = {
          status: 'DISMISSED',
          dismissedAt: new Date(),
        };
        break;

      case 'convert':
        if (!prospectId) {
          return NextResponse.json(
            { success: false, error: 'prospectId es requerido para la acción convert' },
            { status: 400 }
          );
        }

        // Verificar que el prospect existe y pertenece al corredor
        const prospect = await db.brokerProspect.findUnique({
          where: { id: prospectId },
        });

        if (!prospect || prospect.brokerId !== brokerId) {
          return NextResponse.json(
            { success: false, error: 'Prospect no válido' },
            { status: 400 }
          );
        }

        updateData = {
          status: 'CONVERTED',
          convertedToProspect: true,
          prospectId,
        };
        break;
    }

    // Actualizar recomendación
    const updated = await db.brokerLeadRecommendation.update({
      where: { id: recommendationId },
      data: updateData,
      include: {
        recommendedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    logger.info('✅ Recommendation updated', {
      brokerId,
      recommendationId,
      action,
      newStatus: updated.status,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Recomendación marcada como ${updated.status}`,
    });
  } catch (error: any) {
    logger.error('Error updating recommendation', {
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
      { success: false, error: 'Error al actualizar recomendación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Eliminar recomendación
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { recommendationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'BROKER') {
      return NextResponse.json(
        { success: false, error: 'Solo corredores pueden acceder a esta función' },
        { status: 403 }
      );
    }

    const { recommendationId } = params;
    const brokerId = session.user.id;

    // Verificar permisos
    const recommendation = await db.brokerLeadRecommendation.findUnique({
      where: { id: recommendationId },
    });

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recomendación no encontrada' },
        { status: 404 }
      );
    }

    if (recommendation.brokerId !== brokerId) {
      return NextResponse.json(
        { success: false, error: 'No tienes permiso para eliminar esta recomendación' },
        { status: 403 }
      );
    }

    // Eliminar
    await db.brokerLeadRecommendation.delete({
      where: { id: recommendationId },
    });

    logger.info('🗑️ Recommendation deleted', {
      brokerId,
      recommendationId,
    });

    return NextResponse.json({
      success: true,
      message: 'Recomendación eliminada',
    });
  } catch (error: any) {
    logger.error('Error deleting recommendation', {
      error: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { success: false, error: 'Error al eliminar recomendación' },
      { status: 500 }
    );
  }
}
