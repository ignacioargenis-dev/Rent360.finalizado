import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requiere rol de corredor.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    logger.info('GET /api/broker/runners - Buscando corredores disponibles', {
      userId: user.id,
      search,
      limit,
    });

    // Construir filtros
    const whereClause: any = {
      role: 'RUNNER',
      isActive: true,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { commune: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Buscar corredores activos que coincidan con el término de búsqueda
    const runners = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        city: true,
        commune: true,
        bio: true,
        createdAt: true,
        // Estadísticas calculadas
        _count: {
          select: {
            visitsAsRunner: true,
          },
        },
        // Última calificación promedio
        runnerRatingsGiven: {
          select: {
            overallRating: true,
          },
          take: 10, // Últimas 10 calificaciones para calcular promedio
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    // Calcular estadísticas para cada corredor
    const runnersWithStats = runners.map(runner => {
      const ratings = runner.runnerRatingsGiven;
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length
          : 0;

      return {
        id: runner.id,
        name: runner.name,
        email: runner.email,
        phone: runner.phone,
        avatar: runner.avatar,
        city: runner.city,
        commune: runner.commune,
        bio: runner.bio,
        memberSince: runner.createdAt,
        stats: {
          totalVisits: runner._count.visitsAsRunner,
          averageRating: Math.round(averageRating * 10) / 10,
          totalRatings: ratings.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      runners: runnersWithStats,
    });
  } catch (error) {
    logger.error('Error fetching available runners:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
