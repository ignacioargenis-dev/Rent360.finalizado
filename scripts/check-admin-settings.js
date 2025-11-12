const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminSettings() {
  try {
    console.log(
      '🔍 Verificando configuraciones de administrador que puedan afectar notificaciones...\n'
    );

    // Verificar configuraciones de plataforma
    console.log('📊 Configuraciones de Plataforma:');
    const platformConfigs = await prisma.platformConfig.findMany({
      where: { isActive: true },
    });

    if (platformConfigs.length === 0) {
      console.log('❌ No hay configuraciones de plataforma activas');
    } else {
      for (const config of platformConfigs) {
        console.log(`  ${config.category}.${config.key} = ${config.value}`);
      }
    }

    console.log('\n📧 Configuraciones relacionadas con email/notificaciones:');
    const emailConfigs = platformConfigs.filter(
      config =>
        config.key.toLowerCase().includes('email') ||
        config.key.toLowerCase().includes('notification') ||
        config.key.toLowerCase().includes('mail')
    );

    if (emailConfigs.length === 0) {
      console.log('❌ No hay configuraciones específicas de email/notificaciones');
    } else {
      for (const config of emailConfigs) {
        console.log(`  ${config.category}.${config.key} = ${config.value}`);
      }
    }

    // Verificar si hay usuarios admin
    console.log('\n👑 Usuarios Administradores:');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, name: true, email: true, bio: true },
    });

    for (const admin of admins) {
      console.log(`👤 Admin: ${admin.name} (${admin.email})`);
      if (admin.bio) {
        try {
          const settings = JSON.parse(admin.bio);
          console.log(`   ⚙️ Configuraciones:`, {
            emailNotifications: settings.notifications?.emailNotifications,
            pushNotifications: settings.notifications?.pushNotifications,
            jobReminders: settings.notifications?.jobReminders,
          });
        } catch (e) {
          console.log(`   ❌ Error parseando bio del admin: ${e.message}`);
        }
      } else {
        console.log(`   ⚠️ Sin configuraciones personalizadas`);
      }
    }

    // Verificar variables de entorno relacionadas
    console.log('\n🌍 Variables de Entorno relacionadas:');
    const envVars = [
      'NEXT_PUBLIC_PUSHER_KEY',
      'PUSHER_APP_ID',
      'PUSHER_SECRET',
      'NEXT_PUBLIC_PUSHER_CLUSTER',
      'EMAIL_ENABLED',
      'NOTIFICATIONS_ENABLED',
      'SMTP_HOST',
      'SMTP_PORT',
    ];

    for (const envVar of envVars) {
      const value = process.env[envVar];
      if (value) {
        console.log(`  ${envVar} = ${value.length > 20 ? value.substring(0, 20) + '...' : value}`);
      } else {
        console.log(`  ${envVar} = ❌ NO CONFIGURADO`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminSettings();
