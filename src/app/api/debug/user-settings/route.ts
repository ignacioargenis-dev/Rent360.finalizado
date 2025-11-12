import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Solo admins pueden ver configuraciones de todos los usuarios
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores.' },
        { status: 403 }
      );
    }

    console.log('🔍 [DEBUG USER SETTINGS] Verificando configuraciones...\n');

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
      },
      take: 20,
    });

    const userSettings = [];

    for (const user of users) {
      console.log(`👤 Usuario: ${user.name} (${user.role}) - ${user.email}`);

      let settings = null;
      if (user.bio) {
        try {
          settings = JSON.parse(user.bio);
          console.log(`✅ Configuraciones parseadas correctamente`);
        } catch (parseError) {
          console.log(`❌ Error parseando bio: ${parseError.message}`);
        }
      } else {
        console.log(`⚠️ No tiene bio (configuraciones)`);
      }

      userSettings.push({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hasSettings: !!user.bio,
        settings: settings,
      });

      console.log('---');
    }

    // Verificar calificaciones recientes
    console.log('\n⭐ Verificando calificaciones recientes...\n');

    const recentRatings = await db.userRating.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { name: true, role: true } },
        toUser: { select: { name: true, role: true } },
      },
    });

    console.log(`📊 Total de calificaciones recientes: ${recentRatings.length}`);

    for (const rating of recentRatings) {
      console.log(
        `⭐ ${rating.fromUser.name} (${rating.fromUser.role}) → ${rating.toUser.name} (${rating.toUser.role})`
      );
      console.log(`   Puntuación: ${rating.overallRating} estrellas`);
      console.log(`   Fecha: ${rating.createdAt}`);
      console.log(`   Contexto: ${rating.contextType} (${rating.contextId})`);
      console.log('---');
    }

    // Verificar notificaciones recientes
    console.log('\n🔔 Verificando notificaciones recientes...\n');

    const recentNotifications = await db.notification.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    console.log(`📊 Total de notificaciones recientes: ${recentNotifications.length}`);

    for (const notification of recentNotifications) {
      console.log(`🔔 ${notification.user.name}: ${notification.title}`);
      console.log(`   Mensaje: ${notification.message}`);
      console.log(`   Tipo: ${notification.type}`);
      console.log(`   Leída: ${notification.isRead}`);
      console.log(`   Fecha: ${notification.createdAt}`);
      console.log('---');
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        usersWithSettings: users.filter(u => u.bio).length,
        totalRatings: recentRatings.length,
        totalNotifications: recentNotifications.length,
      },
      users: userSettings,
      recentRatings,
      recentNotifications,
    });
  } catch (error) {
    console.error('❌ Error en debug user settings:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
