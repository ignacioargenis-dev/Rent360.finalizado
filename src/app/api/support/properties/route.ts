import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'SUPPORT' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de soporte o administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    logger.info('GET /api/support/properties - Obteniendo propiedades para soporte', {
      userId: user.id,
      page,
      limit,
      status,
      search,
    });

    // Construir filtros
    const whereClause: any = {};

    if (status && status !== 'all') {
      whereClause.status = status.toUpperCase();
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { owner: { name: { contains: search, mode: 'insensitive' } } },
        { owner: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Obtener propiedades con estadísticas
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
        _count: {
          select: {
            contracts: true,
            maintenanceRequests: true,
            reports: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Obtener el total para paginación
    const totalProperties = await db.property.count({ where: whereClause });

    // Transformar datos para el formato esperado
    const transformedProperties = properties.map(property => ({
      id: property.id,
      title: property.title,
      address: property.address,
      city: property.city,
      commune: property.commune,
      status: property.status.toLowerCase(),
      price: property.price,
      ownerName: property.owner?.name || 'Sin propietario',
      ownerEmail: property.owner?.email || 'Sin email',
      contractsCount: property._count.contracts,
      maintenanceCount: property._count.maintenanceRequests,
      reportsCount: property._count.reports,
      createdAt: property.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      properties: transformedProperties,
      pagination: {
        page,
        limit,
        total: totalProperties,
        totalPages: Math.ceil(totalProperties / limit),
        hasNext: page * limit < totalProperties,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo propiedades para soporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
