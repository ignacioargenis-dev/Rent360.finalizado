// Cargar variables de entorno manualmente
const fs = require('fs');
const path = require('path');

// Leer .env.local
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

async function checkRealUsers() {
  try {
    console.log('🔍 Buscando TODOS los usuarios en DigitalOcean...');

    // Obtener TODOS los usuarios
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('\n📋 TODOS los usuarios en BD de DigitalOcean:');
    allUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} - ${user.name || 'Sin nombre'} - Activo: ${user.isActive} - Rol: ${user.role} - Props: ${user._count.properties} - Contratos: ${user._count.contractsAsOwner + user._count.contractsAsTenant}`
      );
    });

    // Buscar específicamente los usuarios mencionados
    const mentionedUsers = [
      'ignacio.antonio.b@hotmail.com',
      'ingerlisesg@gmail.com',
      'lucbjork@gmail.com',
    ];
    const foundUsers = allUsers.filter(user => mentionedUsers.includes(user.email));

    console.log('\n👤 Usuarios específicos mencionados por el usuario:');
    if (foundUsers.length === 0) {
      console.log(
        '❌ NINGUNO de los usuarios mencionados existe en la base de datos de DigitalOcean'
      );
      console.log(
        '💡 Esto significa que los usuarios reales nunca se registraron o se registraron en otra base de datos'
      );
    } else {
      foundUsers.forEach(user => {
        console.log(`✅ ${user.email} - Existe en BD`);
      });
    }

    // Contar usuarios por rol que serían prospects
    const prospectsByRole = {
      OWNER: allUsers.filter(u => u.role === 'OWNER' && u.isActive).length,
      TENANT: allUsers.filter(u => u.role === 'TENANT' && u.isActive).length,
    };

    console.log('\n🎯 Prospects disponibles para brokers:');
    console.log(`  OWNER activos: ${prospectsByRole.OWNER}`);
    console.log(`  TENANT activos: ${prospectsByRole.TENANT}`);
    console.log(`  TOTAL prospects: ${prospectsByRole.OWNER + prospectsByRole.TENANT}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkRealUsers();
