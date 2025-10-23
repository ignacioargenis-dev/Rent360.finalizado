import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo administradores pueden exportar propiedades
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv'; // csv, json
    const status = searchParams.get('status'); // filtro opcional por estado

    // Construir filtros
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    // Obtener todas las propiedades
    const properties = await db.property.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (format === 'csv') {
      // Generar CSV
      const csvHeaders = [
        'ID Propiedad',
        'Título',
        'Dirección',
        'Ciudad',
        'Comuna',
        'Región',
        'Propietario',
        'Email Propietario',
        'Precio Mensual',
        'Depósito',
        'Estado',
        'Tipo de Propiedad',
        'Habitaciones',
        'Baños',
        'Superficie (m²)',
        'Contratos Activos',
        'Fecha Creación',
      ];

      const csvRows = properties.map(property => [
        property.id,
        property.title,
        property.address,
        property.city || '',
        property.commune || '',
        property.region || '',
        property.owner?.name || '',
        property.owner?.email || '',
        property.price,
        property.deposit || 0,
        property.status,
        property.type || '',
        property.bedrooms || 0,
        property.bathrooms || 0,
        property.area || 0,
        property._count.contracts,
        new Date(property.createdAt).toISOString().split('T')[0],
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Crear respuesta con archivo CSV
      const response = new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="propiedades_admin_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });

      return response;
    } else if (format === 'json') {
      // Generar JSON
      const jsonData = properties.map(property => ({
        id: property.id,
        title: property.title,
        address: property.address,
        city: property.city,
        commune: property.commune,
        region: property.region,
        owner: {
          id: property.owner?.id,
          name: property.owner?.name,
          email: property.owner?.email,
        },
        price: property.price,
        deposit: property.deposit,
        status: property.status,
        propertyType: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        area: property.area,
        description: property.description,
        activeContractsCount: property._count.contracts,
        images: property.images,
        features: property.features,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }));

      const response = new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="propiedades_admin_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Formato no soportado. Use format=csv o format=json' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Error exporting admin properties:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
