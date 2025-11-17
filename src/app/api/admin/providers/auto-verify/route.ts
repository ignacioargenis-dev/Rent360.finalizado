import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';
import { handleApiError } from '@/lib/api-error-handler';

/**
 * POST /api/admin/providers/auto-verify
 * Endpoint para verificar automáticamente proveedores pendientes
 * Útil para desarrollo/testing o aprobación masiva
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo admins pueden usar este endpoint
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { providerType = 'maintenance', verifyAll = false, providerId } = body;

    let updatedCount = 0;
    let updatedProviders: any[] = [];

    if (verifyAll) {
      // Verificar todos los proveedores pendientes del tipo especificado
      if (providerType === 'maintenance') {
        const pendingProviders = await db.maintenanceProvider.findMany({
          where: {
            isVerified: false,
            status: 'PENDING_VERIFICATION',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        for (const provider of pendingProviders) {
          const updated = await db.maintenanceProvider.update({
            where: { id: provider.id },
            data: {
              isVerified: true,
              status: 'ACTIVE',
            },
          });

          // Activar el usuario también
          await db.user.update({
            where: { id: provider.userId },
            data: { isActive: true },
          });

          updatedProviders.push({
            id: updated.id,
            businessName: updated.businessName,
            email: provider.user.email,
          });
          updatedCount++;
        }
      } else {
        const pendingProviders = await db.serviceProvider.findMany({
          where: {
            isVerified: false,
            status: 'PENDING_VERIFICATION',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        for (const provider of pendingProviders) {
          const updated = await db.serviceProvider.update({
            where: { id: provider.id },
            data: {
              isVerified: true,
              status: 'ACTIVE',
            },
          });

          await db.user.update({
            where: { id: provider.userId },
            data: { isActive: true },
          });

          updatedProviders.push({
            id: updated.id,
            businessName: updated.businessName,
            email: provider.user.email,
          });
          updatedCount++;
        }
      }
    } else if (providerId) {
      // Verificar un proveedor específico
      if (providerType === 'maintenance') {
        const provider = await db.maintenanceProvider.findUnique({
          where: { id: providerId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        if (!provider) {
          return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
        }

        const updated = await db.maintenanceProvider.update({
          where: { id: providerId },
          data: {
            isVerified: true,
            status: 'ACTIVE',
          },
        });

        await db.user.update({
          where: { id: provider.userId },
          data: { isActive: true },
        });

        updatedProviders.push({
          id: updated.id,
          businessName: updated.businessName,
          email: provider.user.email,
        });
        updatedCount = 1;
      } else {
        const provider = await db.serviceProvider.findUnique({
          where: { id: providerId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        });

        if (!provider) {
          return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
        }

        const updated = await db.serviceProvider.update({
          where: { id: providerId },
          data: {
            isVerified: true,
            status: 'ACTIVE',
          },
        });

        await db.user.update({
          where: { id: provider.userId },
          data: { isActive: true },
        });

        updatedProviders.push({
          id: updated.id,
          businessName: updated.businessName,
          email: provider.user.email,
        });
        updatedCount = 1;
      }
    } else {
      return NextResponse.json(
        { error: 'Debe proporcionar providerId o verifyAll=true' },
        { status: 400 }
      );
    }

    logger.info('Proveedores verificados automáticamente:', {
      adminId: user.id,
      providerType,
      updatedCount,
      updatedProviders: updatedProviders.map(p => ({
        id: p.id,
        businessName: p.businessName,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `${updatedCount} proveedor(es) verificado(s) exitosamente`,
      updatedCount,
      updatedProviders,
    });
  } catch (error) {
    logger.error('Error verificando proveedores:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}

/**
 * GET /api/admin/providers/auto-verify
 * Obtener estado de proveedores pendientes de verificación
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const providerType = searchParams.get('type') || 'maintenance';

    let pendingProviders: any[] = [];
    let totalProviders = 0;
    let verifiedProviders = 0;

    if (providerType === 'maintenance') {
      totalProviders = await db.maintenanceProvider.count();
      verifiedProviders = await db.maintenanceProvider.count({
        where: { isVerified: true },
      });

      pendingProviders = await db.maintenanceProvider.findMany({
        where: {
          isVerified: false,
        },
        select: {
          id: true,
          businessName: true,
          status: true,
          isVerified: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      totalProviders = await db.serviceProvider.count();
      verifiedProviders = await db.serviceProvider.count({
        where: { isVerified: true },
      });

      pendingProviders = await db.serviceProvider.findMany({
        where: {
          isVerified: false,
        },
        select: {
          id: true,
          businessName: true,
          status: true,
          isVerified: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      providerType,
      statistics: {
        totalProviders,
        verifiedProviders,
        pendingProviders: pendingProviders.length,
      },
      pendingProviders,
    });
  } catch (error) {
    logger.error('Error obteniendo proveedores pendientes:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return handleApiError(error);
  }
}
