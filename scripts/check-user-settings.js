const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserSettings() {
  try {
    console.log('🔍 Verificando configuraciones de notificaciones de usuarios...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
      },
      take: 10, // Solo los primeros 10 usuarios
    });

    for (const user of users) {
      console.log(`👤 Usuario: ${user.name} (${user.role})`);
      console.log(`📧 Email: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);

      if (user.bio) {
        try {
          const settings = JSON.parse(user.bio);
          console.log('⚙️ Configuraciones encontradas:');
          console.log(`   📧 emailNotifications: ${settings.notifications?.emailNotifications}`);
          console.log(`   📱 smsNotifications: ${settings.notifications?.smsNotifications}`);
          console.log(`   🔔 pushNotifications: ${settings.notifications?.pushNotifications}`);
          console.log(`   ⭐ ratingUpdates: ${settings.notifications?.ratingUpdates}`);
          console.log(`   💰 jobReminders: ${settings.notifications?.jobReminders}`);
          console.log(`   💸 paymentReminders: ${settings.notifications?.paymentReminders}`);
        } catch (parseError) {
          console.log('❌ Error parseando bio:', parseError.message);
        }
      } else {
        console.log('⚠️ No tiene configuraciones guardadas (usará valores por defecto)');
      }

      console.log('---\n');
    }

    // Verificar si hay calificaciones recientes
    console.log('⭐ Verificando calificaciones recientes...\n');

    const recentRatings = await prisma.userRating.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        fromUser: { select: { name: true, role: true } },
        toUser: { select: { name: true, role: true } },
      },
    });

    if (recentRatings.length === 0) {
      console.log('⚠️ No hay calificaciones en la base de datos');
    } else {
      for (const rating of recentRatings) {
        console.log(`⭐ Calificación: ${rating.fromUser.name} → ${rating.toUser.name}`);
        console.log(`   Puntuación: ${rating.overallRating} estrellas`);
        console.log(`   Fecha: ${rating.createdAt}`);
        console.log(`   Contexto: ${rating.contextType} (${rating.contextId})`);
        console.log('---');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSettings();
