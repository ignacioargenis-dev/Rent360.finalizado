import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/lib/logger-minimal';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Verificar que el usuario tiene permisos para ver propiedades de mantenimiento
    if (!['ADMIN', 'owner', 'broker', 'tenant'].includes(user.role)) {
      return NextResponse.json(
        {
          error:
            'Acceso denegado. Se requiere rol de administrador, propietario, corredor o inquilino.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Construir filtros basados en el rol del usuario
    let whereClause: any = {};

    if (user.role === 'owner') {
      whereClause.ownerId = user.id;
    } else if (user.role === 'broker') {
      whereClause.brokerId = user.id;
    } else if (user.role === 'tenant') {
      // Para inquilinos, solo mostrar propiedades con contratos activos
      whereClause.contracts = {
        some: {
          tenantId: user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      };
    }

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    if (type && type !== 'all') {
      whereClause.type = type.toUpperCase();
    }

    // Obtener propiedades con información de mantenimiento
    const properties = await db.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        broker: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        maintenance: {
          select: {
            id: true,
            status: true,
            estimatedCost: true,
            actualCost: true,
            completedDate: true,
            createdAt: true,
          },
        },
        contracts: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] },
          },
          select: {
            id: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transformar los datos al formato esperado por el frontend
    const transformedProperties = properties.map(property => {
      const totalJobs = property.maintenance.length;
      const activeJobs = property.maintenance.filter(
        m => m.status === 'OPEN' || m.status === 'IN_PROGRESS'
      ).length;
      const completedJobs = property.maintenance.filter(m => m.status === 'COMPLETED').length;
      const totalRevenue = property.maintenance
        .filter(m => m.actualCost && m.status === 'COMPLETED')
        .reduce((sum, m) => sum + (m.actualCost || 0), 0);

      const lastJob = property.maintenance
        .filter(m => m.completedDate)
        .sort(
          (a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime()
        )[0];

      const nextJob = property.maintenance
        .filter(m => m.status === 'OPEN' || m.status === 'IN_PROGRESS')
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

      return {
        id: property.id,
        address: property.address,
        commune: property.commune,
        region: property.region,
        ownerName: property.owner?.name || 'No asignado',
        ownerPhone: property.owner?.phone || 'No asignado',
        ownerEmail: property.owner?.email || 'No asignado',
        propertyType: property.type.toLowerCase() as 'house' | 'apartment' | 'office' | 'warehouse',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        totalJobs,
        activeJobs,
        completedJobs,
        totalRevenue,
        lastJobDate: lastJob?.completedDate?.toISOString().split('T')[0],
        nextJobDate: nextJob?.createdAt.toISOString().split('T')[0],
        status: property.status.toLowerCase() as 'active' | 'inactive' | 'maintenance',
        currentTenant: property.contracts[0]?.tenant || null,
      };
    });

    return NextResponse.json({
      success: true,
      properties: transformedProperties,
      totalCount: transformedProperties.length,
    });
  } catch (error) {
    logger.error('Error obteniendo propiedades de mantenimiento:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
