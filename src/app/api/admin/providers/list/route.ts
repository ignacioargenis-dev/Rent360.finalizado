import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAnyProvider } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de administrador.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ✅ Buscar usuarios con cualquier rol de proveedor (normalizado)
    const whereClause: any = {
      role: {
        in: ['PROVIDER', 'MAINTENANCE', 'SERVICE_PROVIDER', 'MAINTENANCE_PROVIDER'],
      },
    };
    if (status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    // Obtener proveedores desde la base de datos
    const providers = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Campos específicos de proveedores si existen
        bio: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // ✅ Obtener estadísticas de proveedores (todos los tipos)
    const providerRoles = ['PROVIDER', 'MAINTENANCE', 'SERVICE_PROVIDER', 'MAINTENANCE_PROVIDER'];
    const [totalProviders, activeProviders, pendingProviders] = await Promise.all([
      db.user.count({ where: { role: { in: providerRoles } } }),
      db.user.count({ where: { role: { in: providerRoles }, isActive: true } }),
      db.user.count({ where: { role: { in: providerRoles }, isActive: false } }),
    ]);

    // Transformar datos al formato esperado por el frontend
    const transformedProviders = providers.map(provider => ({
      id: provider.id,
      name: provider.name || 'Proveedor sin nombre',
      contactName: provider.name || 'Contacto no disponible',
      email: provider.email,
      phone: provider.phone || 'No disponible',
      services: ['Servicios generales'], // Por ahora genérico, se puede expandir
      status: provider.isActive ? 'active' : 'inactive',
      rating: 4.5, // Por ahora fijo, se puede calcular desde reviews
      completedJobs: 0, // Se puede calcular desde jobs completados
      location:
        `${provider.commune || ''}, ${provider.city || ''}`.trim() || 'Ubicación no especificada',
      registrationDate: provider.createdAt.toISOString().split('T')[0],
      address: provider.address,
      bio: provider.bio,
    }));

    const overview = {
      totalProviders,
      activeProviders,
      pendingProviders,
      topServices: ['Mantenimiento', 'Limpieza', 'Seguridad', 'Jardinería'], // Por ahora fijo
    };

    logger.info('Proveedores obtenidos', {
      count: transformedProviders.length,
      status,
      limit,
      offset,
      overview,
    });

    return NextResponse.json({
      success: true,
      data: {
        overview,
        providers: transformedProviders,
      },
      pagination: {
        limit,
        offset,
        total: providers.length,
        hasMore: providers.length === limit,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo proveedores:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        data: {
          overview: {
            totalProviders: 0,
            activeProviders: 0,
            pendingProviders: 0,
            topServices: [],
          },
          providers: [],
        },
      },
      { status: 500 }
    );
  }
}
