import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const updateProspectSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  rut: z.string().optional(),
  status: z
    .enum([
      'NEW',
      'CONTACTED',
      'QUALIFIED',
      'MEETING_SCHEDULED',
      'PROPOSAL_SENT',
      'NEGOTIATING',
      'CONVERTED',
      'LOST',
    ])
    .optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  interestedIn: z.array(z.string()).optional(),
  budget: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  preferredLocations: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().datetime().optional(),
  lostReason: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * GET /api/broker/prospects/[prospectId]
 * Obtiene detalles de un prospect específico
 */
export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log('🔍 [PROSPECT_DETAIL] Iniciando GET /api/broker/prospects/[prospectId]');

    const user = await requireAuth(request);

    // Verificar permisos: brokers siempre pueden acceder, owners solo a sus propios prospects
    const isBroker = user.role === 'BROKER';
    const isOwner = user.role === 'OWNER';

    if (!isBroker && !isOwner) {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor o propietario.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    console.log('📋 [PROSPECT_DETAIL] Prospecto ID:', prospectId, 'User role:', user.role);

    // Buscar el prospect con todas sus relaciones
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            rut: true,
            avatar: true,
            role: true,
            address: true,
            city: true,
            commune: true,
            region: true,
            createdAt: true,
            properties: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
              },
              take: 10,
            },
          },
        },
        activities: {
          include: {
            broker: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        sharedProperties: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                images: true,
                status: true,
              },
            },
          },
          orderBy: {
            sharedAt: 'desc',
          },
        },
        convertedClient: {
          include: {
            managedProperties: {
              include: {
                property: {
                  select: {
                    id: true,
                    title: true,
                    address: true,
                    price: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!prospect) {
      console.log('❌ [PROSPECT_DETAIL] Prospecto no encontrado:', prospectId);
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    // Verificar permisos según el rol del usuario
    if (isBroker && prospect.brokerId !== user.id) {
      console.log('❌ [PROSPECT_DETAIL] Prospecto no pertenece al corredor');
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    if (isOwner && prospect.userId !== user.id) {
      console.log('❌ [PROSPECT_DETAIL] Prospecto no pertenece al propietario');
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    console.log('✅ [PROSPECT_DETAIL] Prospecto encontrado:', {
      id: prospect.id,
      name: prospect.name,
      status: prospect.status,
    });

    return NextResponse.json({
      success: true,
      data: prospect,
    });
  } catch (error) {
    console.error('❌ [PROSPECT_DETAIL] Error:', error);
    logger.error('Error obteniendo detalle del prospecto:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * PATCH /api/broker/prospects/[prospectId]
 * Actualiza un prospect
 */
export async function PATCH(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log('🔍 [PROSPECT_UPDATE] Iniciando PATCH /api/broker/prospects/[prospectId]');

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    const body = await request.json();
    console.log('📋 [PROSPECT_UPDATE] Datos recibidos:', body);

    // Validar datos
    const validatedData = updateProspectSchema.parse(body);

    // Verificar que el prospect existe y pertenece al corredor
    const existingProspect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
    });

    if (!existingProspect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (existingProspect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (validatedData.name) {
      updateData.name = validatedData.name;
    }
    if (validatedData.email) {
      updateData.email = validatedData.email;
    }
    if (validatedData.phone) {
      updateData.phone = validatedData.phone;
    }
    if (validatedData.rut) {
      updateData.rut = validatedData.rut;
    }
    if (validatedData.status) {
      updateData.status = validatedData.status;
      // Si se marca como perdido y hay razón, guardarla
      if (validatedData.status === 'LOST' && validatedData.lostReason) {
        updateData.lostReason = validatedData.lostReason;
      }
    }
    if (validatedData.priority) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.notes) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.nextFollowUpDate) {
      updateData.nextFollowUpDate = new Date(validatedData.nextFollowUpDate);
    }

    if (validatedData.interestedIn) {
      updateData.interestedIn = JSON.stringify(validatedData.interestedIn);
    }
    if (validatedData.budget) {
      updateData.budget = validatedData.budget;
    }
    if (validatedData.preferredLocations) {
      updateData.preferredLocations = JSON.stringify(validatedData.preferredLocations);
    }
    if (validatedData.tags) {
      updateData.tags = JSON.stringify(validatedData.tags);
    }

    // Actualizar última fecha de contacto si hay cambio de estado
    if (validatedData.status && validatedData.status !== existingProspect.status) {
      updateData.lastContactDate = new Date();
      updateData.contactCount = existingProspect.contactCount + 1;
    }

    // Actualizar prospect
    const updatedProspect = await db.brokerProspect.update({
      where: { id: prospectId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    // Crear actividad de actualización si hubo cambio de estado
    if (validatedData.status && validatedData.status !== existingProspect.status) {
      await db.prospectActivity.create({
        data: {
          prospectId: prospectId,
          brokerId: user.id,
          activityType: 'note',
          title: `Estado cambiado a ${validatedData.status}`,
          description: validatedData.lostReason || `Estado del prospect actualizado`,
          outcome: 'successful',
          completedAt: new Date(),
        },
      });
    }

    logger.info('Prospect actualizado', {
      brokerId: user.id,
      prospectId,
      changes: Object.keys(updateData),
    });

    console.log('✅ [PROSPECT_UPDATE] Prospecto actualizado exitosamente');

    return NextResponse.json({
      success: true,
      data: updatedProspect,
      message: 'Prospect actualizado exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [PROSPECT_UPDATE] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [PROSPECT_UPDATE] Error:', error);
    logger.error('Error actualizando prospect:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/broker/prospects/[prospectId]
 * Elimina un prospect
 */
export async function DELETE(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log('🔍 [PROSPECT_DELETE] Iniciando DELETE /api/broker/prospects/[prospectId]');

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect existe y pertenece al corredor
    const existingProspect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
    });

    if (!existingProspect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (existingProspect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // No permitir eliminar prospects convertidos
    if (existingProspect.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'No se puede eliminar un prospect convertido a cliente' },
        { status: 400 }
      );
    }

    // Eliminar prospect (las actividades y propiedades compartidas se eliminan en cascada)
    await db.brokerProspect.delete({
      where: { id: prospectId },
    });

    logger.info('Prospect eliminado', {
      brokerId: user.id,
      prospectId,
    });

    console.log('✅ [PROSPECT_DELETE] Prospecto eliminado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'Prospect eliminado exitosamente',
    });
  } catch (error) {
    console.error('❌ [PROSPECT_DELETE] Error:', error);
    logger.error('Error eliminando prospect:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
