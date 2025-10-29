import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

const configurePropertiesSchema = z.object({
  propertyManagementType: z.enum(['full', 'partial', 'none']),
  managedPropertyIds: z.array(z.string()).nullable().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    const user = await requireAuth(request);

    // Solo propietarios pueden configurar sus propiedades
    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo propietarios pueden configurar propiedades.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;
    const body = await request.json();

    logger.info('Configuring broker client properties', {
      clientId,
      userId: user.id,
      body,
    });

    // Validar datos
    const validatedData = configurePropertiesSchema.parse(body);

    // Verificar que el cliente corredor pertenece al usuario
    const brokerClient = await db.brokerClient.findFirst({
      where: {
        id: clientId,
        userId: user.id,
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!brokerClient) {
      return NextResponse.json(
        { error: 'Cliente corredor no encontrado o no autorizado.' },
        { status: 404 }
      );
    }

    // Verificar que las propiedades seleccionadas pertenecen al usuario (si se especifican)
    if (validatedData.managedPropertyIds && validatedData.managedPropertyIds.length > 0) {
      const properties = await db.property.findMany({
        where: {
          id: { in: validatedData.managedPropertyIds },
          ownerId: user.id,
        },
        select: { id: true },
      });

      if (properties.length !== validatedData.managedPropertyIds.length) {
        return NextResponse.json(
          { error: 'Una o más propiedades seleccionadas no existen o no te pertenecen.' },
          { status: 400 }
        );
      }
    }

    // Actualizar la configuración
    const updatedClient = await db.brokerClient.update({
      where: { id: clientId },
      data: {
        propertyManagementType: validatedData.propertyManagementType,
        managedPropertyIds: validatedData.managedPropertyIds
          ? JSON.stringify(validatedData.managedPropertyIds)
          : null,
        lastInteraction: new Date(),
      },
      include: {
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Notificar al corredor sobre el cambio de configuración
    await db.notification
      .create({
        data: {
          userId: brokerClient.brokerId,
          type: 'PROPERTY_MANAGEMENT_UPDATED',
          title: 'Configuración de Propiedades Actualizada',
          message: `${user.name || 'Un propietario'} ha actualizado la configuración de propiedades que administras.`,
          link: `/broker/clients/${clientId}`,
          metadata: JSON.stringify({
            clientId,
            ownerId: user.id,
            propertyManagementType: validatedData.propertyManagementType,
            managedPropertiesCount: validatedData.managedPropertyIds?.length || 0,
          }),
        },
      })
      .catch(err => {
        logger.error('Error creating notification for broker', { error: err });
      });

    logger.info('Broker client properties configured successfully', {
      clientId,
      propertyManagementType: validatedData.propertyManagementType,
      managedPropertiesCount: validatedData.managedPropertyIds?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración de propiedades guardada exitosamente.',
      client: {
        ...updatedClient,
        managedPropertyIds: updatedClient.managedPropertyIds
          ? JSON.parse(updatedClient.managedPropertyIds)
          : null,
      },
    });
  } catch (error) {
    logger.error('Error configuring broker client properties:', error);

    if (error instanceof Error) {
      if (error.message.includes('No autorizado') || error.message.includes('Acceso denegado')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al configurar propiedades.' },
      { status: 500 }
    );
  }
}
