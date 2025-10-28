import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { z } from 'zod';
import crypto from 'crypto';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

const sharePropertySchema = z.object({
  propertyId: z.string().min(1, 'ID de propiedad es requerido'),
  message: z.string().optional(),
  sendEmail: z.boolean().optional(),
});

/**
 * POST /api/broker/prospects/[prospectId]/share-property
 * Comparte una propiedad con un prospect
 */
export async function POST(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log(
      '🔍 [SHARE_PROPERTY] Iniciando POST /api/broker/prospects/[prospectId]/share-property'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;
    const body = await request.json();
    console.log('📋 [SHARE_PROPERTY] Datos recibidos:', body);

    // Validar datos
    const validatedData = sharePropertySchema.parse(body);

    // Verificar que el prospect existe y pertenece al corredor
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Verificar que la propiedad existe
    const property = await db.property.findUnique({
      where: { id: validatedData.propertyId },
      include: {
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Verificar que el corredor tiene acceso a la propiedad
    // (es su propiedad gestionada o tiene permisos)
    if (property.brokerId !== user.id && property.createdBy !== user.id) {
      // Verificar si tiene permisos de gestión
      const hasManagementAccess = await db.brokerPropertyManagement.findFirst({
        where: {
          brokerId: user.id,
          propertyId: validatedData.propertyId,
          status: 'ACTIVE',
        },
      });

      if (!hasManagementAccess) {
        return NextResponse.json(
          { error: 'No tienes permisos para compartir esta propiedad' },
          { status: 403 }
        );
      }
    }

    // Generar link único de seguimiento
    const shareToken = crypto.randomBytes(16).toString('hex');
    const shareLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://rent360.com'}/properties/${property.id}?ref=${shareToken}`;

    // Verificar si ya se compartió antes
    const existingShare = await db.prospectPropertyShare.findFirst({
      where: {
        prospectId,
        propertyId: validatedData.propertyId,
      },
    });

    let share;
    if (existingShare) {
      // Actualizar compartido existente
      share = await db.prospectPropertyShare.update({
        where: { id: existingShare.id },
        data: {
          sharedAt: new Date(),
          message: validatedData.message ?? null,
          shareLink,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              type: true,
              images: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
            },
          },
        },
      });
    } else {
      // Crear nuevo compartido
      share = await db.prospectPropertyShare.create({
        data: {
          prospectId,
          propertyId: validatedData.propertyId,
          brokerId: user.id,
          message: validatedData.message ?? null,
          shareLink,
          sharedAt: new Date(),
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              address: true,
              price: true,
              type: true,
              images: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
            },
          },
        },
      });
    }

    // Actualizar contador de propiedades compartidas del prospect
    await db.brokerProspect.update({
      where: { id: prospectId },
      data: {
        propertiesShared: {
          increment: 1,
        },
        lastContactDate: new Date(),
      },
    });

    // Crear actividad
    await db.prospectActivity.create({
      data: {
        prospectId,
        brokerId: user.id,
        activityType: 'property_view',
        title: `Propiedad compartida: ${property.title}`,
        description:
          validatedData.message || `Se compartió la propiedad ubicada en ${property.address}`,
        outcome: 'successful',
        completedAt: new Date(),
        metadata: {
          propertyId: property.id,
          propertyTitle: property.title,
          propertyPrice: property.price,
          shareLink,
        },
      },
    });

    // TODO: Enviar email si sendEmail es true
    if (validatedData.sendEmail && prospect.email) {
      // Aquí iría la lógica de envío de email
      logger.info('Email de propiedad compartida pendiente de envío', {
        prospectEmail: prospect.email,
        propertyId: property.id,
        shareLink,
      });
    }

    logger.info('Propiedad compartida con prospect', {
      brokerId: user.id,
      prospectId,
      propertyId: validatedData.propertyId,
      shareId: share.id,
    });

    console.log('✅ [SHARE_PROPERTY] Propiedad compartida exitosamente:', share.id);

    return NextResponse.json({
      success: true,
      data: {
        ...share,
        shareLink,
      },
      message: 'Propiedad compartida exitosamente',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ [SHARE_PROPERTY] Error de validación:', error.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('❌ [SHARE_PROPERTY] Error:', error);
    logger.error('Error compartiendo propiedad:', {
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
 * GET /api/broker/prospects/[prospectId]/share-property
 * Obtiene todas las propiedades compartidas con un prospect
 */
export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    console.log(
      '🔍 [SHARED_PROPERTIES] Iniciando GET /api/broker/prospects/[prospectId]/share-property'
    );

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect existe y pertenece al corredor
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospecto no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener propiedades compartidas
    const sharedProperties = await db.prospectPropertyShare.findMany({
      where: { prospectId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            price: true,
            type: true,
            images: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            status: true,
          },
        },
      },
      orderBy: {
        sharedAt: 'desc',
      },
    });

    console.log(
      '✅ [SHARED_PROPERTIES] Propiedades compartidas encontradas:',
      sharedProperties.length
    );

    return NextResponse.json({
      success: true,
      data: sharedProperties,
    });
  } catch (error) {
    console.error('❌ [SHARED_PROPERTIES] Error:', error);
    logger.error('Error obteniendo propiedades compartidas:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
