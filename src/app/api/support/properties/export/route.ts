import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const statusFilter = searchParams.get('status') || 'all';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    logger.info('GET /api/support/properties/export - Exportando propiedades de soporte', {
      userId: user.id,
      format,
      statusFilter,
      startDate,
      endDate,
    });

    const whereClause: any = {};

    if (statusFilter !== 'all') {
      whereClause.status = statusFilter;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

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
        contracts: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true,
            monthlyRent: true,
            tenant: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          where: {
            status: {
              in: ['ACTIVE', 'PENDING'],
            },
          },
        },
        maintenance: {
          select: {
            id: true,
            status: true,
            priority: true,
            title: true,
          },
          where: {
            status: {
              in: ['OPEN', 'IN_PROGRESS'],
            },
          },
        },
        _count: {
          select: {
            contracts: true,
            maintenance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      const csvHeaders = [
        'ID Propiedad',
        'Título',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Región',
        'Precio',
        'Estado',
        'Propietario Nombre',
        'Propietario Email',
        'Propietario Teléfono',
        'Contratos Activos',
        'Inquilinos Activos',
        'Mantenimientos Pendientes',
        'Fecha Creación',
        'Última Actualización',
      ];

      const csvRows = properties.map(property => [
        property.id,
        property.title,
        property.address,
        property.city || '',
        property.commune || '',
        property.region || '',
        property.price,
        property.status,
        property.owner?.name || '',
        property.owner?.email || '',
        property.owner?.phone || '',
        property._count.contracts,
        property.contracts.length,
        property._count.maintenance,
        new Date(property.createdAt).toISOString().split('T')[0],
        new Date(property.updatedAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => String(cell)).join(','))
        .join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="propiedades_soporte_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else if (format === 'json') {
      const jsonData = properties.map(property => ({
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        commune: property.commune,
        region: property.region,
        price: property.price,
        status: property.status,
        owner: {
          id: property.owner?.id,
          name: property.owner?.name,
          email: property.owner?.email,
          phone: property.owner?.phone,
        },
        activeContracts: property.contracts.length,
        tenants: property.contracts.map(contract => ({
          id: contract.tenant?.id,
          name: contract.tenant?.name,
          email: contract.tenant?.email,
        })),
        pendingMaintenance: property._count.maintenance,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="propiedades_soporte_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
      return response;
    } else {
      return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Error exporting support properties:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
