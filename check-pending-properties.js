// Script para verificar propiedades pendientes de aprobación
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

async function checkPendingProperties() {
  try {
    console.log('🔍 Verificando propiedades pendientes de aprobación...\n');

    await prisma.$connect();

    // Buscar propiedades con status PENDING
    const pendingProperties = await prisma.property.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 Propiedades con status PENDING:');
    if (pendingProperties.length === 0) {
      console.log('   ❌ No hay propiedades pendientes de aprobación');
      console.log('   💡 Para probar la funcionalidad, crea una propiedad primero desde un OWNER');
    } else {
      pendingProperties.forEach((prop, index) => {
        console.log(`${index + 1}. "${prop.title}" (ID: ${prop.id})`);
        console.log(`   ├─ Status: ${prop.status}`);
        console.log(
          `   ├─ Owner: ${prop.owner?.name || 'Sin owner'} (${prop.owner?.email || 'Sin email'})`
        );
        console.log(`   └─ Creada: ${prop.createdAt}`);
        console.log('');
      });
    }

    // Verificar total de propiedades por status
    const statusCounts = await prisma.property.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    console.log('📊 Resumen de propiedades por status:');
    statusCounts.forEach(status => {
      console.log(`   - ${status.status}: ${status._count.id} propiedades`);
    });

    // Verificar que el admin existe
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true },
    });

    if (adminUser) {
      console.log('\n👑 Usuario administrador disponible:');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Nombre: ${adminUser.name}`);
      console.log('   ✅ Puede aprobar/rechazar propiedades');
    } else {
      console.log('\n❌ No hay usuario administrador activo');
      console.log('   💡 Necesitas crear un admin primero con: node create-real-users.js');
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
  }
}

checkPendingProperties();
