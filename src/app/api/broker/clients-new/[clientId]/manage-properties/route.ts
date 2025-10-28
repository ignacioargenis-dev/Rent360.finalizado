import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const managePropertiesSchema = z.object({
  propertyIds: z.array(z.string()).min(1, 'Debe seleccionar al menos una propiedad'),
  managementType: z.enum(['full', 'partial', 'marketing_only', 'lease_only']),
  services: z.array(z.string()).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  exclusivity: z.boolean().optional(),
  ownerCanEditProperty: z.boolean().optional(),
  ownerCanViewStats: z.boolean().optional(),
  ownerCanApproveTenant: z.boolean().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/broker/clients-new/[clientId]/manage-properties
 * Asigna propiedades al corredor para gestión (parcial o total)
 */
export async function POST(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    console.log(
      '🔍 [MANAGE_PROPERTIES] Iniciando POST /api/broker/clients-new/[clientId]/manage-properties'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;
    const body = await request.json();
    console.log('📋 [MANAGE_PROPERTIES] Datos recibidos:', body);

    // Validar datos
    const validatedData = managePropertiesSchema.parse(body);

    // Verificar que el cliente existe y pertenece al corredor
    const client = await db.brokerClient.findUnique({
      where: { id: clientId },
      include: {
        user: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (client.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar que el cliente es OWNER o BOTH
    if (client.clientType !== 'OWNER' && client.clientType !== 'BOTH') {
      return NextResponse.json(
        { error: 'Solo se pueden gestionar propiedades de clientes propietarios' },
        { status: 400 }
      );
    }

    // Verificar que las propiedades pertenecen al usuario del cliente
    const properties = await db.property.findMany({
      where: {
        id: { in: validatedData.propertyIds },
        ownerId: client.userId,
      },
    });

    if (properties.length !== validatedData.propertyIds.length) {
      return NextResponse.json(
        { error: 'Algunas propiedades no pertenecen al cliente o no existen' },
        { status: 400 }
      );
    }

    // Crear o actualizar gestión de propiedades
    const managedProperties = [];
    const errors = [];

    for (const property of properties) {
      try {
        // Verificar si ya existe una gestión para esta propiedad
        const existingManagement = await db.brokerPropertyManagement.findFirst({
          where: {
            brokerId: user.id,
            propertyId: property.id,
          },
        });

        if (existingManagement) {
          // Actualizar gestión existente
          const updated = await db.brokerPropertyManagement.update({
            where: { id: existingManagement.id },
            data: {
              managementType: validatedData.managementType,
              services: JSON.stringify(validatedData.services || []),
              commissionRate: validatedData.commissionRate || client.commissionRate,
              exclusivity: validatedData.exclusivity ?? client.exclusiveAgreement,
              ownerCanEditProperty: validatedData.ownerCanEditProperty ?? true,
              ownerCanViewStats: validatedData.ownerCanViewStats ?? true,
              ownerCanApproveTenant: validatedData.ownerCanApproveTenant ?? true,
              notes: validatedData.notes ?? null,
              status: 'ACTIVE',
            },
            include: {
              property: true,
            },
          });
          managedProperties.push(updated);
        } else {
          // Crear nueva gestión
          const created = await db.brokerPropertyManagement.create({
            data: {
              brokerId: user.id,
              clientId: clientId,
              propertyId: property.id,
              managementType: validatedData.managementType,
              services: JSON.stringify(validatedData.services || []),
              commissionRate: validatedData.commissionRate || client.commissionRate,
              exclusivity: validatedData.exclusivity ?? client.exclusiveAgreement,
              ownerCanEditProperty: validatedData.ownerCanEditProperty ?? true,
              ownerCanViewStats: validatedData.ownerCanViewStats ?? true,
              ownerCanApproveTenant: validatedData.ownerCanApproveTenant ?? true,
              notes: validatedData.notes ?? null,
              status: 'ACTIVE',
              startDate: new Date(),
            },
            include: {
              property: true,
            },
          });
          managedProperties.push(created);
        }

        // Actualizar brokerId en la propiedad
        await db.property.update({
          where: { id: property.id },
          data: { brokerId: user.id },
        });
      } catch (error) {
        logger.error('Error gestionando propiedad', {
          propertyId: property.id,
          error: error instanceof Error ? error.message : String(error),
        });
        errors.push({
          propertyId: property.id,
          error: 'Error al procesar esta propiedad',
        });
      }
    }

    // Actualizar métricas del cliente
    const totalManagedProperties = await db.brokerPropertyManagement.count({
      where: {
        clientId: clientId,
        status: 'ACTIVE',
      },
    });

    await db.brokerClient.update({
      where: { id: clientId },
      data: {
        totalPropertiesManaged: totalManagedProperties,
        propertyManagementType: validatedData.managementType,
        lastInteraction: new Date(),
      },
    });

    // Crear actividad
    await db.clientActivity.create({
      data: {
        clientId,
        brokerId: user.id,
        activityType: 'service',
        title: `Propiedades asignadas para gestión`,
        description: `Se agregaron ${managedProperties.length} propiedades para gestión ${validatedData.managementType}`,
        metadata: {
          propertyIds: validatedData.propertyIds,
          managementType: validatedData.managementType,
        },
      },
    });

    logger.info('Propiedades asignadas para gestión', {
      brokerId: user.id,
      clientId,
      propertiesCount: managedProperties.length,
      managementType: validatedData.managementType,
    });

    console.log('✅ [MANAGE_PROPERTIES] Propiedades gestionadas exitosamente');

    return NextResponse.json({
      success: true,
      data: {
        managedProperties,
        errors: errors.length > 0 ? errors : undefined,
      },
      message: `${managedProperties.length} propiedades asignadas exitosamente`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [MANAGE_PROPERTIES] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [MANAGE_PROPERTIES] Error:', error);
    logger.error('Error gestionando propiedades:', {
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
 * GET /api/broker/clients-new/[clientId]/manage-properties
 * Obtiene todas las propiedades gestionadas de un cliente
 */
export async function GET(request: NextRequest, { params }: { params: { clientId: string } }) {
  try {
    console.log(
      '🔍 [GET_MANAGED_PROPERTIES] Iniciando GET /api/broker/clients-new/[clientId]/manage-properties'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const clientId = params.clientId;

    // Verificar que el cliente pertenece al corredor
    const client = await db.brokerClient.findUnique({
      where: { id: clientId },
      select: { id: true, brokerId: true, userId: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (client.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener propiedades gestionadas
    const managedProperties = await db.brokerPropertyManagement.findMany({
      where: {
        clientId,
        brokerId: user.id,
      },
      include: {
        property: {
          include: {
            contracts: {
              where: {
                status: 'ACTIVE',
              },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // También obtener propiedades del cliente que NO están siendo gestionadas
    const allClientProperties = await db.property.findMany({
      where: {
        ownerId: client.userId,
      },
      select: {
        id: true,
        title: true,
        address: true,
        price: true,
        type: true,
        status: true,
        brokerId: true,
      },
    });

    const managedPropertyIds = new Set(managedProperties.map(mp => mp.propertyId));
    const unmanagedProperties = allClientProperties.filter(p => !managedPropertyIds.has(p.id));

    console.log('✅ [GET_MANAGED_PROPERTIES] Propiedades encontradas:', {
      managed: managedProperties.length,
      unmanaged: unmanagedProperties.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        managed: managedProperties,
        unmanaged: unmanagedProperties,
        total: allClientProperties.length,
      },
    });
  } catch (error) {
    console.error('❌ [GET_MANAGED_PROPERTIES] Error:', error);
    logger.error('Error obteniendo propiedades gestionadas:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
