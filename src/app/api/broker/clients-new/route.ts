import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

// Forzar renderizado dinámico
export const dynamic = 'force-dynamic';

/**
 * GET /api/broker/clients-new
 * Obtiene todos los clientes activos del corredor desde el nuevo sistema
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [BROKER_CLIENTS] Iniciando GET /api/broker/clients-new');

    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de corredor.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const clientType = searchParams.get('clientType') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📋 [BROKER_CLIENTS] Parámetros:', { searchQuery, status, clientType, limit });

    // Construir condiciones de búsqueda
    const whereConditions: any = {
      brokerId: user.id,
    };

    if (status !== 'all') {
      whereConditions.status = status.toUpperCase();
    }

    if (clientType !== 'all') {
      whereConditions.clientType = clientType.toUpperCase();
    }

    if (searchQuery.trim()) {
      whereConditions.user = {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { email: { contains: searchQuery, mode: 'insensitive' } },
        ],
      };
    }

    // Obtener clientes
    const clients = await db.brokerClient.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
            address: true,
            city: true,
            commune: true,
            rut: true,
          },
        },
        prospect: {
          select: {
            id: true,
            source: true,
            createdAt: true,
          },
        },
        managedProperties: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                address: true,
                price: true,
                type: true,
                status: true,
              },
            },
          },
          where: {
            status: 'ACTIVE',
          },
        },
        activities: {
          select: {
            id: true,
            activityType: true,
            title: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
      orderBy: [{ lastInteraction: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    console.log('📊 [BROKER_CLIENTS] Clientes encontrados:', clients.length);

    // Calcular métricas
    const metrics = {
      total: clients.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalPropertiesManaged: clients.reduce((sum, c) => sum + c.totalPropertiesManaged, 0),
      totalContracts: clients.reduce((sum, c) => sum + c.totalContracts, 0),
      totalCommissions: clients.reduce((sum, c) => sum + c.totalCommissions, 0),
      avgSatisfaction:
        clients.filter(c => c.satisfactionRating).length > 0
          ? clients.reduce((sum, c) => sum + (c.satisfactionRating || 0), 0) /
            clients.filter(c => c.satisfactionRating).length
          : 0,
    };

    // Contar por tipo y estado
    clients.forEach(c => {
      metrics.byType[c.clientType] = (metrics.byType[c.clientType] || 0) + 1;
      metrics.byStatus[c.status] = (metrics.byStatus[c.status] || 0) + 1;
    });

    logger.info('Clientes obtenidos para broker', {
      brokerId: user.id,
      count: clients.length,
      metrics,
    });

    return NextResponse.json({
      success: true,
      data: clients,
      metrics,
      pagination: {
        limit,
        offset: 0,
        total: clients.length,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('❌ [BROKER_CLIENTS] Error:', error);
    logger.error('Error obteniendo clientes:', {
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
