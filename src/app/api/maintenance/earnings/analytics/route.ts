import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/maintenance/earnings/analytics
 * Obtiene datos de analytics para el tab Analytics de earnings
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario es de mantenimiento
    if (user.role !== 'MAINTENANCE' && user.role !== 'MAINTENANCE_PROVIDER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo para usuarios de mantenimiento.' },
        { status: 403 }
      );
    }

    // Obtener el maintenance provider
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { maintenanceProvider: true },
    });

    if (!fullUser || !fullUser.maintenanceProvider) {
      return NextResponse.json(
        { error: 'Proveedor de mantenimiento no encontrado.' },
        { status: 404 }
      );
    }

    const maintenanceProvider = fullUser.maintenanceProvider;

    // Obtener todos los trabajos completados del proveedor
    const completedMaintenance = await db.maintenance.findMany({
      where: {
        maintenanceProviderId: maintenanceProvider.id,
        status: 'COMPLETED',
        actualCost: { not: null },
      },
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Calcular tipos de servicio más rentables
    const serviceTypeRevenue: Record<string, number> = {};
    completedMaintenance.forEach(m => {
      const type = m.category || 'OTRO';
      serviceTypeRevenue[type] = (serviceTypeRevenue[type] || 0) + (m.actualCost || 0);
    });

    const mostProfitableServices = Object.entries(serviceTypeRevenue)
      .map(([type, revenue]) => ({
        type: mapMaintenanceType(type),
        revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calcular clientes más frecuentes
    const clientFrequency: Record<string, { name: string; count: number }> = {};
    completedMaintenance.forEach(m => {
      const ownerId = m.property.ownerId;
      if (!ownerId) {
        return;
      } // Saltar si no hay ownerId
      const ownerName = m.property.owner?.name || 'Sin propietario';
      if (!clientFrequency[ownerId]) {
        clientFrequency[ownerId] = { name: ownerName, count: 0 };
      }
      clientFrequency[ownerId].count += 1;
    });

    const mostFrequentClients = Object.values(clientFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        mostProfitableServices,
        mostFrequentClients,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo analytics de earnings:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

/**
 * Mapea el tipo de mantenimiento a un nombre legible
 */
function mapMaintenanceType(type: string): string {
  const typeMap: Record<string, string> = {
    ELECTRICAL: 'Reparaciones Eléctricas',
    PLUMBING: 'Reparaciones de Plomería',
    HVAC: 'Mantenimiento de Calefacción',
    PAINTING: 'Pintura',
    CARPENTRY: 'Carpintería',
    CLEANING: 'Limpieza',
    GARDENING: 'Jardinería',
    OTHER: 'Otros',
  };

  return typeMap[type] || type;
}
