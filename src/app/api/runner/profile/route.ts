import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger-minimal';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    // Obtener perfil del usuario
    const userProfile = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        address: true,
        city: true,
        commune: true,
        region: true,
        bio: true,
        createdAt: true,
        isActive: true,
        lastLogin: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener estadísticas del runner
    const [allVisits, completedVisits] = await Promise.all([
      db.visit.findMany({
        where: { runnerId: user.id },
        select: {
          id: true,
          status: true,
          earnings: true,
          scheduledAt: true,
          duration: true,
        },
      }),
      db.visit.findMany({
        where: {
          runnerId: user.id,
          status: 'COMPLETED',
        },
        include: {
          runnerRatings: {
            select: {
              overallRating: true,
            },
            take: 1,
          },
        },
      }),
    ]);

    // Calcular estadísticas
    const totalVisits = allVisits.length;
    const completedTasks = completedVisits.length;
    const totalEarnings = completedVisits.reduce((sum, v) => sum + (v.earnings || 0), 0);
    
    const ratings = completedVisits
      .map(v => v.runnerRatings[0]?.overallRating || v.rating)
      .filter((r): r is number => r !== null && r !== undefined && r > 0);
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0;

    const completionRate = totalVisits > 0 ? (completedTasks / totalVisits) * 100 : 0;

    // Calcular tiempo promedio de respuesta (simplificado)
    const responseTime = '2.3 horas'; // TODO: Calcular desde mensajes/notificaciones

    // Parsear datos adicionales del campo bio (JSON)
    let skills: any[] = [];
    let experience: any[] = [];
    let certifications: any[] = [];
    let equipment: string[] = [];

    if (userProfile.bio) {
      try {
        const bioData = typeof userProfile.bio === 'string' ? JSON.parse(userProfile.bio) : userProfile.bio;
        if (bioData && typeof bioData === 'object') {
          skills = bioData.skills || [];
          experience = bioData.experience || [];
          certifications = bioData.certifications || [];
          equipment = bioData.equipment || [];
        }
      } catch (error) {
        logger.debug('Error parsing bio JSON, using empty arrays', { error });
      }
    }

    const location = userProfile.commune && userProfile.city
      ? `${userProfile.commune}, ${userProfile.city}`
      : userProfile.region || 'No disponible';

    logger.info('Perfil de runner obtenido', {
      runnerId: user.id,
      totalVisits,
      hasBioData: !!userProfile.bio,
    });

    return NextResponse.json({
      success: true,
      personalInfo: {
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phone || 'No disponible',
        avatar: userProfile.avatar,
        location,
        joinDate: userProfile.createdAt.toISOString().split('T')[0],
        status: userProfile.isActive ? 'active' : 'inactive',
      },
      stats: {
        totalVisits,
        completedTasks,
        avgRating: Math.round(avgRating * 10) / 10,
        totalEarnings,
        responseTime,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      skills: skills || [],
      experience: experience || [],
      certifications: certifications || [],
      equipment: equipment || [],
    });
  } catch (error) {
    logger.error('Error obteniendo perfil de runner:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    if (user.role !== 'RUNNER') {
      return NextResponse.json(
        { error: 'Acceso denegado. Se requieren permisos de runner.' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Actualizar perfil del usuario
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.phone && { phone: body.phone }),
        ...(body.avatar && { avatar: body.avatar }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.commune !== undefined && { commune: body.commune }),
        ...(body.region !== undefined && { region: body.region }),
        ...(body.bio !== undefined && { bio: body.bio }),
        updatedAt: new Date(),
      },
    });

    logger.info('Perfil de runner actualizado', { runnerId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Perfil actualizado correctamente',
    });
  } catch (error) {
    logger.error('Error actualizando perfil de runner:', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

