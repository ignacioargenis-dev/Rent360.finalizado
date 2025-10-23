import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const runnerId = params.id;

    logger.info('DELETE /api/owner/runners/[id]/unassign - Desasignando corredor', {
      ownerId: user.id,
      runnerId,
    });

    // Buscar visitas activas asignadas a este corredor para las propiedades del propietario
    const activeVisits = await db.visit.findMany({
      where: {
        runnerId,
        property: {
          ownerId: user.id,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });

    if (activeVisits.length === 0) {
      return NextResponse.json(
        { error: 'No hay visitas activas asignadas a este corredor para tus propiedades.' },
        { status: 404 }
      );
    }

    // Cancelar todas las visitas activas
    const cancelledVisits = await db.visit.updateMany({
      where: {
        runnerId,
        property: {
          ownerId: user.id,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // TODO: Enviar notificación al corredor sobre la cancelación

    return NextResponse.json({
      success: true,
      message: `${cancelledVisits.count} visita(s) cancelada(s) exitosamente.`,
      cancelledVisits: activeVisits.map(visit => ({
        id: visit.id,
        property: visit.property,
        scheduledAt: visit.scheduledAt,
        status: 'CANCELLED',
      })),
    });
  } catch (error) {
    logger.error('Error unassigning runner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
