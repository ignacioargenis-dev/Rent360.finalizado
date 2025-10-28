// Script para actualizar propiedades pendientes a disponibles
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

async function updatePendingProperties() {
  try {
    console.log('🔄 Actualizando propiedades pendientes...\n');

    await prisma.$connect();

    // Contar propiedades pendientes antes
    const beforeCount = await prisma.property.count({
      where: { status: 'PENDING' },
    });

    console.log(`📊 Propiedades PENDING antes: ${beforeCount}`);

    // Actualizar todas las propiedades PENDING a AVAILABLE
    const updateResult = await prisma.property.updateMany({
      where: { status: 'PENDING' },
      data: { status: 'AVAILABLE' },
    });

    console.log(`✅ Actualizadas: ${updateResult.count} propiedades`);
    console.log('   Status: PENDING → AVAILABLE');

    // Verificar resultado
    const afterCount = await prisma.property.count({
      where: { status: 'PENDING' },
    });

    console.log(`📊 Propiedades PENDING después: ${afterCount}`);

    // Mostrar algunas propiedades actualizadas
    const recentUpdated = await prisma.property.findMany({
      where: { status: 'AVAILABLE' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    });

    console.log('\n🏠 Propiedades recientemente actualizadas:');
    recentUpdated.forEach((prop, index) => {
      console.log(`${index + 1}. "${prop.title}" - Status: ${prop.status}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

updatePendingProperties();
