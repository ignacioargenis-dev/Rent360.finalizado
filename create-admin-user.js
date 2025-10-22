/**
 * Script para crear usuario admin en producción
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('👑 Creando usuario admin en producción...\n');

  try {
    // Verificar conexión
    await prisma.$connect();
    console.log('✅ Conexión a base de datos exitosa');

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@rent360.cl' },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
      },
      create: {
        name: 'Administrador Rent360',
        email: 'admin@rent360.cl',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        emailVerified: true,
        rut: '12345678-9',
        phone: '+56912345678',
      },
    });

    console.log('✅ Usuario admin creado/actualizado:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Nombre: ${adminUser.name}`);
    console.log(`   Rol: ${adminUser.role}`);
    console.log(`   Contraseña: admin123`);

    // Crear usuario support también
    const supportHashedPassword = await bcrypt.hash('support123', 12);

    const supportUser = await prisma.user.upsert({
      where: { email: 'support@rent360.cl' },
      update: {
        password: supportHashedPassword,
        role: 'SUPPORT',
        isActive: true,
        emailVerified: true,
      },
      create: {
        name: 'Soporte Rent360',
        email: 'support@rent360.cl',
        password: supportHashedPassword,
        role: 'SUPPORT',
        isActive: true,
        emailVerified: true,
        rut: '55667788-9',
        phone: '+56987654321',
      },
    });

    console.log('\n✅ Usuario support creado/actualizado:');
    console.log(`   Email: ${supportUser.email}`);
    console.log(`   Nombre: ${supportUser.name}`);
    console.log(`   Rol: ${supportUser.role}`);
    console.log(`   Contraseña: support123`);

    console.log('\n🎯 CREDENCIALES DE ACCESO:');
    console.log('Admin: admin@rent360.cl / admin123');
    console.log('Support: support@rent360.cl / support123');
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
