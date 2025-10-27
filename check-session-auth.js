// Script para verificar el estado de autenticación y sesiones
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const envLines = envContent.split('\n');
  envLines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '');
      process.env[key.trim()] = value.trim();
    }
  });
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuthStatus() {
  try {
    console.log('🔐 Verificando estado de autenticación en el sistema...\n');

    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // Verificar todos los usuarios con información de login
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    console.log(`👥 Total de usuarios: ${users.length}\n`);

    // Clasificar por actividad de login
    const neverLoggedIn = users.filter(u => !u.lastLogin);
    const loggedInUsers = users.filter(u => u.lastLogin);
    const recentlyActive = users.filter(
      u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
    );

    console.log('📊 ESTADÍSTICAS DE ACTIVIDAD:');
    console.log(`   - Usuarios que nunca iniciaron sesión: ${neverLoggedIn.length}`);
    console.log(`   - Usuarios que han iniciado sesión: ${loggedInUsers.length}`);
    console.log(`   - Usuarios activos en las últimas 24h: ${recentlyActive.length}\n`);

    if (loggedInUsers.length > 0) {
      console.log('🔥 USUARIOS QUE HAN INICIADO SESIÓN:');
      loggedInUsers.forEach((user, index) => {
        const lastLogin = new Date(user.lastLogin);
        const hoursAgo = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60));
        console.log(
          `${index + 1}. ${user.email} (${user.role}) - Último login: ${lastLogin.toLocaleString()} (${hoursAgo}h atrás)`
        );
      });
      console.log('');
    }

    if (recentlyActive.length > 0) {
      console.log('⚡ USUARIOS ACTIVOS RECIENTEMENTE (últimas 24h):');
      recentlyActive.forEach((user, index) => {
        const lastLogin = new Date(user.lastLogin);
        console.log(`${index + 1}. ${user.email} - ${user.role} - ${lastLogin.toLocaleString()}`);
      });
      console.log('');
    }

    // Verificar si hay usuarios con actividad pero sin lastLogin actualizado
    const usersWithActivity = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
      },
      where: {
        OR: [
          { properties: { some: {} } },
          { contractsAsOwner: { some: {} } },
          { contractsAsTenant: { some: {} } },
        ],
      },
    });

    console.log('🏗️ USUARIOS CON ACTIVIDAD REAL (propiedades/contratos):');
    if (usersWithActivity.length === 0) {
      console.log('   ❌ No hay usuarios con actividad real en el sistema');
      console.log('   💡 Esto confirma que ningún usuario ha usado realmente el sistema');
    } else {
      usersWithActivity.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role})`);
        console.log(`   ├─ Propiedades: ${user._count.properties}`);
        console.log(`   ├─ Contratos como owner: ${user._count.contractsAsOwner}`);
        console.log(`   └─ Contratos como tenant: ${user._count.contractsAsTenant}`);
        console.log('');
      });
    }

    // Verificar propiedades existentes
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        ownerId: true,
        brokerId: true,
        createdAt: true,
      },
      take: 5,
    });

    console.log('🏠 PROPIEDADES EN EL SISTEMA:');
    if (properties.length === 0) {
      console.log('   ❌ No hay propiedades en el sistema');
    } else {
      properties.forEach((prop, index) => {
        console.log(
          `${index + 1}. "${prop.title}" - Owner: ${prop.ownerId || 'Sin owner'} - Broker: ${prop.brokerId || 'Sin broker'}`
        );
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkAuthStatus();
