import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const convertProspectSchema = z.object({
  clientType: z.enum(['OWNER', 'TENANT', 'BOTH']),
  relationshipType: z.enum(['standard', 'exclusive', 'premium']).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  exclusiveAgreement: z.boolean().optional(),
  propertyManagementType: z.enum(['full', 'partial', 'none']).optional(),
  servicesOffered: z.array(z.string()).optional(),
  notes: z.string().optional(),
  // Si es OWNER y tiene propiedades, puede especificar cuáles gestionar
  propertyIds: z.array(z.string()).optional(),
  managementType: z.enum(['full', 'partial', 'marketing_only', 'lease_only']).optional(),
});

/**
 * POST /api/broker/prospects/[prospectId]/convert
 * Convierte un prospect en cliente activo
 */
export async function POST(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log('🔍 [CONVERT_PROSPECT] Iniciando POST /api/broker/prospects/[prospectId]/convert');

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    const body = await request.json();
    console.log('📋 [CONVERT_PROSPECT] Datos recibidos:', body);

    // Validar datos
    const validatedData = convertProspectSchema.parse(body);

    // Verificar que el prospect existe y pertenece al corredor
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      include: {
        user: true,
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar que el prospect no está ya convertido
    if (prospect.status === 'CONVERTED') {
      return NextResponse.json(
        { error: 'Este prospect ya fue convertido a cliente' },
        { status: 400 }
      );
    }

    // Verificar que el prospect tiene un usuario asociado
    if (!prospect.userId) {
      return NextResponse.json(
        {
          error: 'El prospect debe estar registrado como usuario antes de convertirse en cliente',
          details: 'Invita al prospect a registrarse en la plataforma primero',
        },
        { status: 400 }
      );
    }

    // Verificar que no existe ya una relación de cliente activa
    const existingClient = await db.brokerClient.findFirst({
      where: {
        brokerId: user.id,
        userId: prospect.userId,
        status: 'ACTIVE',
      },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: 'Ya existe una relación de cliente activa con este usuario' },
        { status: 400 }
      );
    }

    // Transacción para convertir el prospect
    const result = await db.$transaction(async tx => {
      // 1. Crear el cliente
      const client = await tx.brokerClient.create({
        data: {
          brokerId: user.id,
          userId: prospect.userId!,
          prospectId: prospect.id,
          clientType: validatedData.clientType,
          relationshipType: validatedData.relationshipType || 'standard',
          commissionRate: validatedData.commissionRate || 5.0,
          exclusiveAgreement: validatedData.exclusiveAgreement || false,
          propertyManagementType: validatedData.propertyManagementType ?? null,
          servicesOffered: validatedData.servicesOffered
            ? JSON.stringify(validatedData.servicesOffered)
            : null,
          notes: validatedData.notes ?? null,
          status: 'ACTIVE',
          startDate: new Date(),
          lastInteraction: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
              role: true,
            },
          },
        },
      });

      // 2. Si es OWNER y tiene propiedades para gestionar
      if (
        validatedData.clientType === 'OWNER' &&
        validatedData.propertyIds &&
        validatedData.propertyIds.length > 0
      ) {
        // Verificar que las propiedades pertenecen al usuario
        const properties = await tx.property.findMany({
          where: {
            id: { in: validatedData.propertyIds },
            ownerId: prospect.userId!,
          },
        });

        if (properties.length !== validatedData.propertyIds.length) {
          throw new Error('Algunas propiedades no pertenecen al usuario o no existen');
        }

        // Crear registros de gestión de propiedades
        for (const property of properties) {
          await tx.brokerPropertyManagement.create({
            data: {
              brokerId: user.id,
              clientId: client.id,
              propertyId: property.id,
              managementType: validatedData.managementType || 'full',
              services: JSON.stringify(validatedData.servicesOffered || []),
              commissionRate: validatedData.commissionRate || 5.0,
              exclusivity: validatedData.exclusiveAgreement || false,
              status: 'ACTIVE',
              startDate: new Date(),
            },
          });

          // Actualizar la propiedad para asignar el broker
          await tx.property.update({
            where: { id: property.id },
            data: { brokerId: user.id },
          });
        }

        // Actualizar métricas del cliente
        await tx.brokerClient.update({
          where: { id: client.id },
          data: {
            totalPropertiesManaged: properties.length,
          },
        });
      }

      // 3. Actualizar el prospect
      await tx.brokerProspect.update({
        where: { id: prospectId },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date(),
          convertedToClientId: client.id,
        },
      });

      // 4. Crear actividad de conversión en el prospect
      await tx.prospectActivity.create({
        data: {
          prospectId: prospectId,
          brokerId: user.id,
          activityType: 'other',
          title: 'Convertido a cliente',
          description: `Prospect convertido exitosamente a cliente ${validatedData.clientType}`,
          outcome: 'successful',
          completedAt: new Date(),
        },
      });

      // 5. Crear actividad inicial del cliente
      await tx.clientActivity.create({
        data: {
          clientId: client.id,
          brokerId: user.id,
          activityType: 'other',
          title: 'Cliente creado',
          description: `Cliente creado desde prospect. Tipo: ${validatedData.clientType}`,
        },
      });

      return client;
    });

    logger.info('Prospect convertido a cliente', {
      brokerId: user.id,
      prospectId,
      clientId: result.id,
      clientType: validatedData.clientType,
      propertiesManaged: validatedData.propertyIds?.length || 0,
    });

    // Ejecutar hooks de conversión
    const { ProspectHooks } = await import('@/lib/prospect-hooks');
    ProspectHooks.onStatusChanged(prospectId, 'NEGOTIATING', 'CONVERTED', user.id).catch(error => {
      logger.error('Error en hook onStatusChanged para conversión', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    console.log('✅ [CONVERT_PROSPECT] Prospecto convertido exitosamente:', result.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Prospect convertido a cliente exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [CONVERT_PROSPECT] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [CONVERT_PROSPECT] Error:', error);
    logger.error('Error convirtiendo prospect:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
