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
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    logger.info('GET /api/support/users - Obteniendo usuarios para soporte', {
      userId: user.id,
      page,
      limit,
      role,
      status,
      search,
    });

    // Construir filtros
    const whereClause: any = {};

    if (role && role !== 'all') {
      whereClause.role = role.toUpperCase();
    }

    if (status && status !== 'all') {
      whereClause.isActive = status === 'active';
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { rut: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Obtener usuarios con estadísticas
    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        city: true,
        commune: true,
        // Estadísticas
        _count: {
          select: {
            properties: true,
            contractsAsTenant: true,
            contractsAsBroker: true,
            tickets: true,
            reportsReceived: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Obtener el total para paginación
    const totalUsers = await db.user.count({ where: whereClause });

    // Transformar datos para el formato esperado por el frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: user.isActive ? 'ACTIVE' : 'INACTIVE',
      phone: user.phone,
      createdAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      city: user.city,
      verified: user.emailVerified,
      ticketsCount: user._count.tickets,
      propertiesCount: user._count.properties,
      contractsCount: user._count.contractsAsTenant + user._count.contractsAsBroker,
      reportsCount: user._count.reportsReceived,
    }));

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        hasNext: page * limit < totalUsers,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo usuarios para soporte:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
