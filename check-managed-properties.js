// Script para verificar propiedades managed en la base de datos
console.log('🔍 Verificando propiedades managed en el sistema...\n');

// Simulamos configuración (en producción esto vendría de variables de entorno)
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/db';
process.env.JWT_SECRET = 'dummy-secret';

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkManagedProperties() {
  try {
    console.log('1️⃣ Buscando todas las propiedades:');
    const allProperties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        brokerId: true,
        createdAt: true,
      },
      take: 20,
    });

    console.log(`Encontradas ${allProperties.length} propiedades totales`);

    console.log('\n2️⃣ Clasificando propiedades:');
    const managedProperties = allProperties.filter(p => p.brokerId && p.brokerId !== p.ownerId);
    const ownedProperties = allProperties.filter(p => !p.brokerId || p.brokerId === p.ownerId);
    const availableManaged = managedProperties.filter(p => p.status === 'AVAILABLE');
    const availableOwned = ownedProperties.filter(p => p.status === 'AVAILABLE');

    console.log(`   - Propiedades managed: ${managedProperties.length}`);
    console.log(`   - Propiedades owned: ${ownedProperties.length}`);
    console.log(`   - Propiedades managed disponibles: ${availableManaged.length}`);
    console.log(`   - Propiedades owned disponibles: ${availableOwned.length}`);

    console.log('\n3️⃣ Propiedades managed disponibles (primeras 5):');
    availableManaged.slice(0, 5).forEach(prop => {
      console.log(`   - ${prop.title} (ID: ${prop.id})`);
      console.log(`     Owner: ${prop.ownerId}, Broker: ${prop.brokerId}, Status: ${prop.status}`);
    });

    console.log('\n4️⃣ Verificando API de propiedades para tenant (simulado):');
    // Simular la consulta que haría un tenant
    const tenantProperties = await prisma.property.findMany({
      where: {
        status: 'AVAILABLE', // Solo disponibles
      },
      select: {
        id: true,
        title: true,
        status: true,
        ownerId: true,
        brokerId: true,
      },
      take: 20,
    });

    const tenantManaged = tenantProperties.filter(p => p.brokerId && p.brokerId !== p.ownerId);
    const tenantOwned = tenantProperties.filter(p => !p.brokerId || p.brokerId === p.ownerId);

    console.log(`   - Total propiedades visibles para tenant: ${tenantProperties.length}`);
    console.log(`   - Propiedades managed visibles: ${tenantManaged.length}`);
    console.log(`   - Propiedades owned visibles: ${tenantOwned.length}`);

    if (tenantManaged.length === 0 && availableManaged.length > 0) {
      console.log('\n❌ PROBLEMA IDENTIFICADO:');
      console.log('   Las propiedades managed existen y están disponibles,');
      console.log('   pero no son visibles para tenants en la API.');
      console.log('\n🔧 POSIBLE SOLUCIÓN:');
      console.log('   Revisar si hay algún filtro en la API que excluya propiedades managed.');
    } else if (tenantManaged.length > 0) {
      console.log('\n✅ Las propiedades managed son visibles para tenants.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkManagedProperties();
