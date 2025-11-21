import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const propertyId = params.propertyId;

    logger.info('GET /api/support/properties/[propertyId] - Obteniendo detalle de propiedad', {
      userId: user.id,
      propertyId,
    });

    // Obtener propiedad con información relacionada
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        contracts: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        maintenance: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Últimas 5 solicitudes
        },
        visits: {
          orderBy: { scheduledAt: 'desc' },
          take: 5, // Próximas 5 visitas
        },
        _count: {
          select: {
            contracts: true,
            maintenance: true,
            visits: true,
          },
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      );
    }

    // Transformar datos al formato esperado
    const transformedProperty = {
      id: property.id,
      propertyTitle: `${property.type} en ${property.city}`,
      propertyAddress: `${property.address}, ${property.commune}, ${property.city}`,
      ownerName: property.owner?.name || 'Sin propietario',
      ownerEmail: property.owner?.email || '',
      ownerPhone: property.owner?.phone || '',
      status: property.status.toLowerCase(),
      tenantCount: property.contracts.filter(c => c.status === 'ACTIVE').length,
      monthlyRent: property.price,
      contractStartDate: property.contracts[0]?.startDate?.toISOString().split('T')[0] || '',
      contractEndDate: property.contracts[0]?.endDate?.toISOString().split('T')[0] || '',
      propertyType: property.type,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area: property.area || 0,
      furnished: property.furnished || false,
      parking: property.parking || false,
      elevator: property.elevator || false,
      concierge: property.concierge || false,
      pool: property.pool || false,
      gym: property.gym || false,
      terrace: property.terrace || false,
      storage: property.storage || false,
      recentIssues: property.maintenance.slice(0, 3).map(m => ({
        id: m.id,
        type: m.type,
        description: m.description,
        status: m.status,
        priority: m.priority,
        createdAt: m.createdAt.toISOString().split('T')[0],
      })),
      upcomingVisits: property.visits
        .filter(v => v.scheduledAt > new Date())
        .slice(0, 3)
        .map(v => ({
          id: v.id,
          type: v.type,
          scheduledAt: v.scheduledAt.toISOString(),
          status: v.status,
        })),
      activeContracts: property.contracts
        .filter(c => c.status === 'ACTIVE')
        .map(c => ({
          id: c.id,
          tenantName: c.tenant?.name || 'Sin inquilino',
          tenantEmail: c.tenant?.email || '',
          startDate: c.startDate.toISOString().split('T')[0],
          endDate: c.endDate.toISOString().split('T')[0],
          monthlyRent: c.monthlyRent,
        })),
      stats: {
        totalContracts: property._count.contracts,
        activeMaintenance: property.maintenance.filter(m => m.status !== 'COMPLETED').length,
        totalVisits: property._count.visits,
      },
    };

    return NextResponse.json({
      success: true,
      property: transformedProperty,
    });

  } catch (error) {
    logger.error('Error en GET /api/support/properties/[propertyId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
