// Script para verificar la conexión a la base de datos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Verificando conexión a la base de datos...');

  try {
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:');
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada'}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL no está configurada');
      return;
    }

    // Intentar conectar
    console.log('🔌 Intentando conectar a la base de datos...');
    await prisma.$connect();

    console.log('✅ Conexión exitosa a la base de datos');

    // Verificar que podemos hacer consultas
    console.log('🔍 Verificando consultas...');

    const userCount = await prisma.user.count();
    console.log(`👤 Usuarios en la base de datos: ${userCount}`);

    const propertyCount = await prisma.property.count();
    console.log(`🏠 Propiedades en la base de datos: ${propertyCount}`);

    // Cerrar conexión
    await prisma.$disconnect();
    console.log('✅ Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);

    if (error.message.includes('connect ECONNREFUSED')) {
      console.error('💡 Posible solución: Verifica que la base de datos esté ejecutándose y sea accesible');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Posible solución: Verifica las credenciales de la base de datos');
    } else if (error.message.includes('does not exist')) {
      console.error('💡 Posible solución: Verifica que la base de datos exista');
    }

    await prisma.$disconnect();
  }
}

testConnection();
