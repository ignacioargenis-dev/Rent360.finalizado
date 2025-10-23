import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const assignRunnerSchema = z.object({
  propertyId: z.string(),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(240).default(60), // 15min to 4hours
  notes: z.string().optional(),
  estimatedEarnings: z.number().min(0).default(20000), // CLP
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de propietario.' },
        { status: 403 }
      );
    }

    const runnerId = params.id;

    // Verificar que el corredor existe y está activo
    const runner = await db.user.findFirst({
      where: {
        id: runnerId,
        role: 'RUNNER',
        isActive: true,
      },
    });

    if (!runner) {
      return NextResponse.json(
        { error: 'Corredor no encontrado o no disponible.' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = assignRunnerSchema.parse(body);

    // Verificar que la propiedad pertenece al propietario
    const property = await db.property.findFirst({
      where: {
        id: validatedData.propertyId,
        ownerId: user.id,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada o no tienes permisos sobre ella.' },
        { status: 404 }
      );
    }

    logger.info('POST /api/owner/runners/[id]/assign - Asignando corredor a propiedad', {
      ownerId: user.id,
      runnerId,
      propertyId: validatedData.propertyId,
      scheduledAt: validatedData.scheduledAt,
    });

    // Crear la visita asignada al corredor
    const visit = await db.visit.create({
      data: {
        propertyId: validatedData.propertyId,
        runnerId,
        scheduledAt: new Date(validatedData.scheduledAt),
        duration: validatedData.duration,
        notes: validatedData.notes || null,
        earnings: validatedData.estimatedEarnings,
        status: 'SCHEDULED',
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
        runner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // TODO: Enviar notificación al corredor sobre la nueva asignación

    return NextResponse.json({
      success: true,
      message: 'Corredor asignado exitosamente.',
      visit: {
        id: visit.id,
        property: visit.property,
        runner: visit.runner,
        scheduledAt: visit.scheduledAt,
        duration: visit.duration,
        status: visit.status,
        earnings: visit.earnings,
        notes: visit.notes,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error assigning runner:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
