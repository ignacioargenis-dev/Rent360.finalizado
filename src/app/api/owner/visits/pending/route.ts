import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

/**
 * GET /api/owner/visits/pending
 * Obtiene las solicitudes de visita pendientes para las propiedades del propietario o corredor
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo propietarios y corredores pueden ver solicitudes de visita
    if (user.role !== 'OWNER' && user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Solo propietarios y corredores pueden ver solicitudes de visita' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const tenantId = searchParams.get('tenantId');

    // Construir filtros
    // Buscar visitas pendientes donde el runnerId temporal es el propietario/corredor
    // (esto indica que aún no se ha asignado un runner real)
    const whereClause: any = {
      status: 'PENDING', // Solo visitas pendientes
      runnerId: user.id, // El runnerId temporal es el propietario/corredor
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    // Si es propietario, solo sus propiedades
    if (user.role === 'OWNER') {
      whereClause.property = {
        ownerId: user.id,
      };
    }

    // Si es corredor, solo propiedades que gestiona
    if (user.role === 'BROKER') {
      whereClause.property = {
        brokerId: user.id,
      };
    }

    // Obtener visitas pendientes con información completa
    const visits = await db.visit.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            commune: true,
            price: true,
            status: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    logger.info('Visitas pendientes obtenidas', {
      userId: user.id,
      userRole: user.role,
      count: visits.length,
      propertyId,
      tenantId,
    });

    return NextResponse.json({
      success: true,
      visits: visits.map(visit => ({
        id: visit.id,
        propertyId: visit.propertyId,
        property: visit.property,
        tenantId: visit.tenantId,
        tenant: visit.tenant,
        scheduledAt: visit.scheduledAt.toISOString(),
        duration: visit.duration,
        status: visit.status,
        notes: visit.notes,
        createdAt: visit.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error('Error obteniendo visitas pendientes:', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Error al obtener las solicitudes de visita' },
      { status: 500 }
    );
  }
}
