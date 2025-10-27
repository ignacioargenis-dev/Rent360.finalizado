// Script para verificar específicamente el usuario admin mencionado
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

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuario admin mencionado...\n');

    await prisma.$connect();
    console.log('✅ Conexión a DigitalOcean exitosa');

    // Buscar el usuario admin mencionado
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@sendspress.cl' },
    });

    console.log('🎯 BÚSQUEDA DEL USUARIO ADMIN:');
    if (adminUser) {
      console.log('✅ ENCONTRADO: admin@sendspress.cl');
      console.log(`   ├─ Nombre: ${adminUser.name}`);
      console.log(`   ├─ Rol: ${adminUser.role}`);
      console.log(`   ├─ Activo: ${adminUser.isActive ? '✅' : '❌'}`);
      console.log(`   ├─ Email verificado: ${adminUser.emailVerified ? '✅' : '❌'}`);
      console.log(`   ├─ Último login: ${adminUser.lastLogin || 'Nunca'}`);
      console.log(`   └─ Creado: ${adminUser.createdAt}`);
    } else {
      console.log('❌ NO ENCONTRADO: admin@sendspress.cl');
    }

    // Verificar si hay algún usuario con dominio sendspross.cl
    const sendsprossUsers = await prisma.user.findMany({
      where: {
        email: { contains: 'sendspross' },
      },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (sendsprossUsers.length > 0) {
      console.log('\n📧 USUARIOS CON DOMINIO SENDSPROSS:');
      sendsprossUsers.forEach(user => {
        console.log(`   - ${user.email} - ${user.name} - ${user.role}`);
      });
    }

    // Verificar todos los usuarios con rol ADMIN
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
    });

    console.log('\n👑 TODOS LOS USUARIOS CON ROL ADMIN:');
    if (adminUsers.length === 0) {
      console.log('❌ No hay usuarios con rol ADMIN');
    } else {
      adminUsers.forEach(user => {
        console.log(
          `   - ${user.email} - ${user.name} - Activo: ${user.isActive} - Login: ${user.lastLogin || 'Nunca'}`
        );
      });
    }

    // Verificar si corredor@gmail.com tiene actividad real
    const corredorUser = await prisma.user.findUnique({
      where: { email: 'corredor@gmail.com' },
      include: {
        properties: true,
        contractsAsOwner: true,
        contractsAsTenant: true,
        _count: {
          select: {
            properties: true,
            contractsAsOwner: true,
            contractsAsTenant: true,
          },
        },
      },
    });

    console.log('\n🏠 ACTIVIDAD DEL USUARIO CORREDOR@GMAIL.COM:');
    if (corredorUser) {
      console.log(`   ├─ Propiedades creadas: ${corredorUser._count.properties}`);
      console.log(`   ├─ Propiedades gestionadas: ${corredorUser.properties?.length || 0}`);
      console.log(`   ├─ Contratos como owner: ${corredorUser._count.contractsAsOwner}`);
      console.log(`   └─ Contratos como tenant: ${corredorUser._count.contractsAsTenant}`);

      if (
        corredorUser._count.properties > 0 ||
        corredorUser._count.contractsAsOwner > 0 ||
        corredorUser._count.contractsAsTenant > 0
      ) {
        console.log('✅ El usuario corredor@gmail.com TIENE actividad real');
      } else {
        console.log('⚠️ El usuario corredor@gmail.com NO tiene actividad real');
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkAdminUser();
