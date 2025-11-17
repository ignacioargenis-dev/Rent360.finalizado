import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { getUserFromRequest } from '@/lib/auth-token-validator';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * POST /api/properties/[id]/track-share
 * Registra cuando un usuario hace clic en un enlace compartido de propiedad
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const propertyId = params.id;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('share');
    const brokerId = searchParams.get('broker');
    const clientId = searchParams.get('client');

    // Intentar obtener usuario actual (puede ser anónimo)
    let userId: string | null = null;
    try {
      const decoded = await getUserFromRequest(request);
      if (decoded) {
        userId = decoded.id;
      }
    } catch {
      // Usuario no autenticado, continuar con tracking anónimo
    }

    // Si hay token y brokerId, buscar la actividad correspondiente
    if (shareToken && brokerId) {
      try {
        // Buscar ClientActivity con este token en metadata
        const activities = await db.clientActivity.findMany({
          where: {
            brokerId: brokerId,
            activityType: 'property_view',
          },
          take: 100, // Limitar búsqueda
        });

        // Buscar la actividad que tiene este token
        for (const activity of activities) {
          const metadata = activity.metadata as any;
          if (metadata?.shareToken === shareToken && metadata?.propertyId === propertyId) {
            // Actualizar contador de vistas
            const updatedMetadata = {
              ...metadata,
              viewCount: (metadata.viewCount || 0) + 1,
              lastViewedAt: new Date().toISOString(),
              viewedBy: userId || 'anonymous',
            };

            await db.clientActivity.update({
              where: { id: activity.id },
              data: {
                metadata: updatedMetadata,
              },
            });

            logger.info('Share link click tracked', {
              propertyId,
              shareToken,
              brokerId,
              clientId,
              userId,
              viewCount: updatedMetadata.viewCount,
            });

            return NextResponse.json({
              success: true,
              tracked: true,
            });
          }
        }
      } catch (error) {
        logger.warn('Error tracking share link', { error });
      }
    }

    return NextResponse.json({
      success: true,
      tracked: false,
    });
  } catch (error) {
    logger.error('Error en track-share:', {
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
