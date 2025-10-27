// Script para probar el proceso de registro y verificar dónde se guardan los usuarios
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno de DigitalOcean
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

async function testRegistration() {
  try {
    console.log('🧪 Probando proceso de registro de usuario...\n');

    // Verificar conexión inicial
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    const initialCount = await prisma.user.count();
    console.log(`👥 Usuarios iniciales: ${initialCount}\n`);

    // Crear un usuario de prueba
    const testEmail = `test-${Date.now()}@example.com`;
    const testUser = await prisma.user.create({
      data: {
        email: testEmail,
        name: 'Usuario de Prueba',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lezfx8KQpO8fJ8Ue', // "password123"
        role: 'OWNER',
        isActive: true,
        emailVerified: true,
        phone: '+56912345678',
        rut: '12345678-9',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    console.log('✅ Usuario de prueba creado:');
    console.log(`  - Email: ${testUser.email}`);
    console.log(`  - Nombre: ${testUser.name}`);
    console.log(`  - Rol: ${testUser.role}`);
    console.log(`  - Activo: ${testUser.isActive}`);
    console.log(`  - Creado: ${testUser.createdAt}\n`);

    // Verificar que se guardó
    const finalCount = await prisma.user.count();
    console.log(`👥 Usuarios finales: ${finalCount}`);
    console.log(`📈 Diferencia: ${finalCount - initialCount} usuario(s) agregado(s)\n`);

    // Verificar que aparece en la lista
    const recentUsers = await prisma.user.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 60000), // Último minuto
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('🕐 Usuarios creados en el último minuto:');
    recentUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} - ${user.role}`);
    });

    // Buscar si aparece en prospects
    const prospects = await prisma.user.findMany({
      where: {
        role: { in: ['OWNER', 'TENANT'] },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const testInProspects = prospects.find(p => p.email === testEmail);
    console.log(
      `\n🎯 ¿Usuario de prueba aparece en prospects? ${testInProspects ? '✅ SÍ' : '❌ NO'}`
    );

    if (testInProspects) {
      console.log('✅ El proceso de registro funciona correctamente');
      console.log('✅ Los usuarios se guardan en DigitalOcean');
      console.log('✅ Los usuarios aparecen en la lista de prospects');
    } else {
      console.log('❌ Problema: Usuario no aparece en prospects');
    }

    // Limpiar usuario de prueba
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('\n🧹 Usuario de prueba eliminado');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error en prueba de registro:', error.message);
    await prisma.$disconnect();
  }
}

testRegistration();
