import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { LeadScoringService } from '@/lib/lead-scoring-service';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * POST /api/broker/prospects/[prospectId]/track-view
 * Registra cuando un prospect visualiza una propiedad compartida
 * Este endpoint puede ser llamado sin autenticación (desde link público)
 */
export async function POST(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    const prospectId = params.prospectId;
    const body = await request.json();
    const { propertyId, shareToken, duration } = body;

    if (!propertyId || !shareToken) {
      return NextResponse.json(
        { error: 'propertyId y shareToken son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el share existe
    const share = await db.prospectPropertyShare.findFirst({
      where: {
        prospectId,
        propertyId,
        shareLink: {
          contains: shareToken,
        },
      },
      include: {
        prospect: {
          select: {
            name: true,
            email: true,
            brokerId: true,
          },
        },
        property: {
          select: {
            title: true,
            address: true,
          },
        },
        broker: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!share) {
      return NextResponse.json(
        { error: 'Link de compartido no encontrado o inválido' },
        { status: 404 }
      );
    }

    // Registrar la visualización
    await db.prospectPropertyShare.update({
      where: { id: share.id },
      data: {
        viewCount: {
          increment: 1,
        },
        lastViewedAt: new Date(),
      },
    });

    // Crear registro de tracking detallado
    await db.prospectPropertyView.create({
      data: {
        prospectId,
        propertyId,
        shareId: share.id,
        viewedAt: new Date(),
        durationSeconds: duration || 0,
        userAgent: request.headers.get('user-agent') || '',
        ipAddress:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      },
    });

    // Actualizar última fecha de contacto del prospect
    await db.brokerProspect.update({
      where: { id: prospectId },
      data: {
        lastContactDate: new Date(),
      },
    });

    logger.info('Visualización de propiedad registrada', {
      prospectId,
      propertyId,
      shareId: share.id,
      duration,
    });

    // Ejecutar hooks de visualización de propiedad
    const { ProspectHooks } = await import('@/lib/prospect-hooks');
    ProspectHooks.onPropertyViewed(prospectId, propertyId, share.brokerId).catch(error => {
      logger.error('Error en hook onPropertyViewed', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Enviar notificación al broker (async)
    notifyBrokerOfView(share).catch(error => {
      logger.error('Error enviando notificación al broker', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Visualización registrada',
    });
  } catch (error) {
    logger.error('Error registrando visualización:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
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
 * Envía notificación al broker cuando un prospect ve una propiedad
 */
async function notifyBrokerOfView(share: any): Promise<void> {
  try {
    const { NotificationService } = await import('@/lib/notification-service');

    await NotificationService.create({
      userId: share.brokerId,
      type: 'PROSPECT_ACTIVITY',
      title: '👀 Prospect vio una propiedad',
      message: `${share.prospect.name} acaba de ver: ${share.property.title}`,
      link: `/broker/prospects/${share.prospectId}`,
      metadata: {
        prospectId: share.prospectId,
        propertyId: share.propertyId,
        prospectName: share.prospect.name,
        propertyTitle: share.property.title,
        propertyAddress: share.property.address,
      },
      priority: 'high',
    });

    logger.info('Notificación de visualización enviada al broker', {
      brokerId: share.brokerId,
      prospectId: share.prospectId,
      propertyId: share.propertyId,
    });
  } catch (error) {
    logger.error('Error creando notificación para broker', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * GET /api/broker/prospects/[prospectId]/track-view
 * Obtiene el historial de visualizaciones de un prospect
 */
export async function GET(request: NextRequest, { params }: { params: { prospectId: string } }) {
  try {
    // Este endpoint requiere autenticación
    const { requireAuth } = await import('@/lib/auth');
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    const prospectId = params.prospectId;

    // Verificar que el prospect pertenece al broker
    const prospect = await db.brokerProspect.findUnique({
      where: { id: prospectId },
      select: { id: true, brokerId: true },
    });

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect no encontrado' }, { status: 404 });
    }

    if (prospect.brokerId !== user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener historial de visualizaciones
    const views = await db.prospectPropertyView.findMany({
      where: { prospectId },
      include: {
        property: {
          select: {
            title: true,
            address: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: views,
    });
  } catch (error) {
    logger.error('Error obteniendo historial de visualizaciones:', {
      error: error instanceof Error ? error.message : String(error),
      prospectId: params.prospectId,
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
