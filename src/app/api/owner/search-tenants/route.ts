import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de propietario.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Buscar tenants activos
    const tenants = await db.user.findMany({
      where: {
        role: 'TENANT',
        isActive: true,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { rut: { contains: search } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        address: true,
        city: true,
        commune: true,
        avatar: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      users: tenants,
    });
  } catch (error) {
    logger.error('Error searching tenants:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
